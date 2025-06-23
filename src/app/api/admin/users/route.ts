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

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const { isValid, error: authError } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json(
        { message: authError || "관리자 권한이 필요합니다.", success: false },
        { status: 403 }
      );
    }

    // USER 역할을 가진 사용자 조회
    const { data, error: dbError } = await supabase
      .from("users")
      .select(
        "id, name, email, phone_number, company_info, created_at, documents, approval_status, approval_log"
      )
      .eq("role", "USER")
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { message: "사용자 조회 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    // approval_status가 없는 경우 기본값 설정
    const usersWithStatus = (data || []).map((user) => ({
      ...user,
      approval_status: user.approval_status || "PENDING",
    }));

    return NextResponse.json({
      users: usersWithStatus,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const { userId, approval_status } = await request.json();

    if (!userId || !approval_status) {
      return NextResponse.json(
        { message: "사용자 ID와 상태가 필요합니다.", success: false },
        { status: 400 }
      );
    }

    // 관리자 정보 조회
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("name, email")
      .eq("id", adminId)
      .single();

    if (adminError || !adminUser) {
      console.error("Admin user query error:", adminError);
      return NextResponse.json(
        { message: "관리자 정보 조회 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    // 현재 사용자의 기존 상태 조회
    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("approval_status")
      .eq("id", userId)
      .eq("role", "USER")
      .single();

    if (currentUserError || !currentUser) {
      console.error("Current user query error:", currentUserError);
      return NextResponse.json(
        { message: "사용자 정보 조회 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    // 상태가 실제로 변경되는 경우에만 로그 기록
    if (currentUser.approval_status !== approval_status) {
      // approval_log 생성
      const approvalLog = {
        changed_by: adminUser.name || adminUser.email,
        changed_by_email: adminUser.email,
        changed_at: new Date().toISOString(),
        previous_status: currentUser.approval_status || "PENDING",
        new_status: approval_status,
        admin_id: adminId,
      };

      // 상태와 로그 동시 업데이트
      const { error: updateError } = await supabase
        .from("users")
        .update({
          approval_status,
          approval_log: approvalLog,
        })
        .eq("id", userId)
        .eq("role", "USER"); // USER 역할만 업데이트 가능

      if (updateError) {
        console.error("Supabase update error:", updateError);
        return NextResponse.json(
          { message: "상태 업데이트 중 오류가 발생했습니다.", success: false },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "상태가 성공적으로 업데이트되었습니다.",
      success: true,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}
