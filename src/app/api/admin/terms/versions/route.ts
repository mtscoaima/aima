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
      console.error("Authorization 헤더가 없습니다.");
      return { isValid: false, error: "로그인이 필요합니다. 다시 로그인해주세요." };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    if (!decoded.userId) {
      return { isValid: false, error: "세션이 만료되었습니다. 다시 로그인해주세요." };
    }

    // 사용자 정보 및 권한 확인
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return { isValid: false, error: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요." };
    }

    if (user.role !== "ADMIN") {
      return { isValid: false, error: "접근 권한이 없습니다." };
    }

    return { isValid: true, userId: user.id };
  } catch (error) {
    console.error("Token verification error:", error);
    return { isValid: false, error: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

// GET: 특정 타입의 모든 버전 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminToken(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("관리자") ? 403 : 401 }
      );
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { success: false, error: "타입이 필요합니다." },
        { status: 400 }
      );
    }

    // 해당 타입의 모든 버전을 생성일 역순으로 조회
    const { data, error } = await supabase
      .from("terms_agreements")
      .select("id, version, title, description, is_active, created_at, updated_at")
      .eq("term_type", type)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("버전 목록 조회 오류:", error);
      return NextResponse.json(
        { success: false, error: "버전 목록 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error("버전 목록 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PATCH: 특정 버전을 활성화 (다른 버전들은 비활성화)
export async function PATCH(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminToken(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("관리자") ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { type, versionId } = body;

    if (!type || !versionId) {
      return NextResponse.json(
        { success: false, error: "타입과 버전 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 트랜잭션으로 처리: 먼저 해당 타입의 모든 버전을 비활성화
    const { error: deactivateError } = await supabase
      .from("terms_agreements")
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("term_type", type);

    if (deactivateError) {
      console.error("기존 버전 비활성화 오류:", deactivateError);
      return NextResponse.json(
        { success: false, error: "기존 버전 비활성화에 실패했습니다." },
        { status: 500 }
      );
    }

    // 선택된 버전을 활성화
    const { data: activatedVersion, error: activateError } = await supabase
      .from("terms_agreements")
      .update({
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq("id", versionId)
      .eq("term_type", type)
      .select()
      .single();

    if (activateError || !activatedVersion) {
      console.error("버전 활성화 오류:", activateError);
      return NextResponse.json(
        { success: false, error: "버전 활성화에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "버전이 성공적으로 활성화되었습니다.",
      data: activatedVersion
    });

  } catch (error) {
    console.error("버전 활성화 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// DELETE: 특정 버전 삭제 (활성 버전은 삭제 불가)
export async function DELETE(request: NextRequest) {
  try {
    // 관리자 권한 확인
    const authResult = await verifyAdminToken(request);
    if (!authResult.isValid) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.error?.includes("관리자") ? 403 : 401 }
      );
    }

    const body = await request.json();
    const { type, versionId } = body;

    if (!type || !versionId) {
      return NextResponse.json(
        { success: false, error: "타입과 버전 ID가 필요합니다." },
        { status: 400 }
      );
    }

    // 삭제하려는 버전이 활성 버전인지 확인
    const { data: versionToDelete, error: checkError } = await supabase
      .from("terms_agreements")
      .select("id, is_active, version")
      .eq("id", versionId)
      .eq("term_type", type)
      .single();

    if (checkError || !versionToDelete) {
      return NextResponse.json(
        { success: false, error: "삭제할 버전을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 활성 버전은 삭제 불가
    if (versionToDelete.is_active) {
      return NextResponse.json(
        { success: false, error: "현재 활성화된 버전은 삭제할 수 없습니다." },
        { status: 400 }
      );
    }

    // 버전 삭제
    const { error: deleteError } = await supabase
      .from("terms_agreements")
      .delete()
      .eq("id", versionId)
      .eq("term_type", type);

    if (deleteError) {
      console.error("버전 삭제 오류:", deleteError);
      return NextResponse.json(
        { success: false, error: "버전 삭제에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `버전 ${versionToDelete.version}이(가) 성공적으로 삭제되었습니다.`
    });

  } catch (error) {
    console.error("버전 삭제 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}