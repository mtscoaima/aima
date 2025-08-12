import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 관리자 권한 확인
async function verifyAdminToken(request: NextRequest): Promise<{
  isValid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isValid: false, error: "Authorization 헤더가 없습니다." };
    }

    const token = authHeader.substring(7);
    if (!token) {
      return { isValid: false, error: "토큰이 없습니다." };
    }

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return { isValid: false, error: "유효하지 않은 토큰입니다." };
    }

    if (!decoded.userId) {
      return { isValid: false, error: "토큰에 사용자 ID가 없습니다." };
    }

    // Supabase에서 사용자 정보 조회하여 role 및 활성 상태 확인
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role, is_active")
      .eq("id", decoded.userId)
      .single();

    if (error) {
      console.error("Database query error:", error);
      return { isValid: false, error: "사용자 조회 중 오류가 발생했습니다." };
    }

    if (!user) {
      return { isValid: false, error: "사용자를 찾을 수 없습니다." };
    }

    if (!user.is_active) {
      return { isValid: false, error: "비활성화된 계정입니다." };
    }

    if (user.role !== "ADMIN") {
      return { isValid: false, error: "관리자 권한이 필요합니다." };
    }

    return { isValid: true, userId: decoded.userId };
  } catch (error) {
    console.error("Token verification error:", error);
    return { isValid: false, error: "권한 확인 중 오류가 발생했습니다." };
  }
}

export async function POST(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const {
      isValid,
      error: authError,
      userId: adminId,
    } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json(
        { message: authError || "관리자 권한이 필요합니다.", success: false },
        { status: 403 }
      );
    }

    const { userIds, action, roleValue } = await request.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { message: "처리할 사용자 ID 목록이 필요합니다.", success: false },
        { status: 400 }
      );
    }

    if (!action) {
      return NextResponse.json(
        { message: "실행할 액션이 필요합니다.", success: false },
        { status: 400 }
      );
    }

    // 관리자 정보 조회
    const { data: adminUser } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", adminId)
      .single();

    let updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    let actionName = "";
    let logMessage = "";

    // 액션에 따른 업데이트 필드 설정
    switch (action) {
      case "activate":
        updateFields.is_active = true;
        updateFields.approval_status = "APPROVED";
        actionName = "활성화";
        logMessage = "관리자에 의한 일괄 활성화";
        break;
      case "suspend":
        updateFields.is_active = false;
        actionName = "정지";
        logMessage = "관리자에 의한 일괄 정지";
        break;
      case "approve":
        updateFields.approval_status = "APPROVED";
        actionName = "승인";
        logMessage = "관리자에 의한 일괄 승인";
        break;
      case "reject":
        updateFields.approval_status = "REJECTED";
        actionName = "거부";
        logMessage = "관리자에 의한 일괄 거부";
        break;
      case "delete":
        // 삭제는 별도 처리
        break;
      case "changeRole":
        if (!roleValue || !['USER', 'SALESPERSON', 'ADMIN'].includes(roleValue)) {
          return NextResponse.json(
            { message: "유효한 권한을 선택해주세요.", success: false },
            { status: 400 }
          );
        }
        updateFields.role = roleValue;
        actionName = "권한 변경";
        logMessage = `관리자에 의한 권한 변경: ${roleValue}`;
        break;
      default:
        return NextResponse.json(
          { message: "지원하지 않는 액션입니다.", success: false },
          { status: 400 }
        );
    }

    let processedCount = 0;
    let errors: string[] = [];

    if (action === "delete") {
      // 일괄 삭제
      // 관리자 계정은 삭제에서 제외
      const { data: usersToDelete } = await supabase
        .from("users")
        .select("id")
        .in("id", userIds)
        .neq("role", "ADMIN");

      const deleteIds = usersToDelete?.map(u => u.id) || [];
      if (deleteIds.length === 0) {
        return NextResponse.json(
          { message: "삭제 가능한 회원이 없습니다.", success: false },
          { status: 400 }
        );
      }

      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .in("id", deleteIds);

      if (deleteError) {
        console.error("Bulk delete error:", deleteError);
        return NextResponse.json(
          { message: "일괄 삭제 중 오류가 발생했습니다.", success: false },
          { status: 500 }
        );
      }

      processedCount = userIds.length;
      actionName = "삭제";
    } else {
      // 상태 변경이 있는 경우 로그 추가
      if (updateFields.approval_status) {
        updateFields.approval_log = {
          changed_by: adminUser?.name || adminUser?.email,
          changed_by_email: adminUser?.email,
          changed_at: new Date().toISOString(),
          previous_status: "BULK_UPDATE",
          new_status: updateFields.approval_status,
          admin_id: adminId,
          message: logMessage,
        };
      }

      // 일괄 업데이트
      const { error: updateError } = await supabase
        .from("users")
        .update(updateFields)
        .in("id", userIds);

      if (updateError) {
        console.error("Bulk update error:", updateError);
        return NextResponse.json(
          { message: "일괄 처리 중 오류가 발생했습니다.", success: false },
          { status: 500 }
        );
      }

      processedCount = userIds.length;
    }

    return NextResponse.json({
      message: `${processedCount}명의 회원이 성공적으로 ${actionName}되었습니다.`,
      processedCount,
      errors: errors.length > 0 ? errors : undefined,
      success: true,
    });
  } catch (error) {
    console.error("Error in bulk operation:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}
