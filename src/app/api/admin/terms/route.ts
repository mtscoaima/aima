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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    if (!decoded.userId) {
      return { isValid: false, error: "유효하지 않은 토큰입니다." };
    }

    // 사용자 정보 및 권한 확인
    const { data: user, error } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", decoded.userId)
      .single();

    if (error || !user) {
      return { isValid: false, error: "사용자를 찾을 수 없습니다." };
    }

    if (user.role !== "ADMIN") {
      return { isValid: false, error: "관리자 권한이 필요합니다." };
    }

    return { isValid: true, userId: user.id };
  } catch (error) {
    console.error("Token verification error:", error);
    return { isValid: false, error: "토큰 검증에 실패했습니다." };
  }
}

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

    const { data, error } = await supabase
      .from("terms_agreements")
      .select("*")
      .eq("term_type", type)
      .eq("is_active", true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("약관 조회 오류:", error);
      return NextResponse.json(
        { success: false, error: "약관 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || null
    });

  } catch (error) {
    console.error("약관 조회 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { type, title, content, version } = body;

    if (!type || !title || !content) {
      return NextResponse.json(
        { success: false, error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 기존 활성 약관 확인
    const { data: existingTerm } = await supabase
      .from("terms_agreements")
      .select("id, version, content")
      .eq("term_type", type)
      .eq("is_active", true)
      .single();

    // 버전과 내용이 모두 같은지 확인
    if (existingTerm) {
      const currentVersion = version || "1.0";
      if (existingTerm.version === currentVersion && existingTerm.content === content) {
        return NextResponse.json(
          {
            success: false,
            error: "동일한 버전과 내용으로는 수정할 수 없습니다. 버전을 변경하거나 내용을 수정해주세요."
          },
          { status: 400 }
        );
      }
    }

    // 자동 버전 생성: 동일한 버전이 있으면 다음 버전으로 자동 증가
    let finalVersion = version || "1.0";

    // 기존 버전들 조회하여 다음 버전 번호 계산
    const { data: allVersions } = await supabase
      .from("terms_agreements")
      .select("version")
      .eq("term_type", type)
      .order("version", { ascending: false });

    if (allVersions && allVersions.length > 0) {
      // 버전이 이미 존재하는지 확인
      const versionExists = allVersions.some(v => v.version === finalVersion);

      if (versionExists) {
        // 숫자 버전인 경우 자동 증가
        const versionNumbers = allVersions
          .map(v => parseFloat(v.version))
          .filter(v => !isNaN(v))
          .sort((a, b) => b - a);

        if (versionNumbers.length > 0) {
          const maxVersion = versionNumbers[0];
          finalVersion = (maxVersion + 0.1).toFixed(1);
        } else {
          // 숫자가 아닌 버전인 경우 타임스탬프 추가
          finalVersion = `${finalVersion}-${Date.now()}`;
        }
      }
    }

    // 기존 약관 비활성화
    await supabase
      .from("terms_agreements")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("term_type", type);

    // 새 약관 추가
    const { data, error } = await supabase
      .from("terms_agreements")
      .insert({
        term_type: type,
        title: title,
        content: content,
        version: finalVersion,
        description: type === 'SERVICE_TERMS' ? '서비스 이용약관' : '개인정보처리방침',
        is_active: true,
        required: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error("약관 저장 오류:", error);
      return NextResponse.json(
        { success: false, error: "약관 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error("약관 저장 API 오류:", error);
    return NextResponse.json(
      { success: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}