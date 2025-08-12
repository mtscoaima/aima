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

    // 기업 정보가 있는 사용자들의 company_info 조회
    const { data, error: dbError } = await supabase
      .from("users")
      .select("company_info")
      .eq("role", "USER")
      .not("company_info", "is", null);

    if (dbError) {
      console.error("Supabase error:", dbError);
      return NextResponse.json(
        { message: "기업 정보 조회 중 오류가 발생했습니다.", success: false },
        { status: 500 }
      );
    }

    // 고유한 기업명 추출
    const companyNames = new Set<string>();
    
    (data || []).forEach((user) => {
      const companyInfo = user.company_info as any;
      if (companyInfo && companyInfo.companyName) {
        companyNames.add(companyInfo.companyName);
      }
    });

    // 배열로 변환하고 정렬
    const sortedCompanies = Array.from(companyNames).sort();

    return NextResponse.json({
      companies: sortedCompanies,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다.", success: false },
      { status: 500 }
    );
  }
}
