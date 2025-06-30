import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 서버 사이드에서는 서비스 역할 키 사용
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

export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/referral-stats",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // JWT 토큰 검증
    let decoded: {
      userId: string;
      role: string;
    };

    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };
    } catch {
      return NextResponse.json(
        {
          message: "유효하지 않은 토큰",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/referral-stats",
        },
        { status: 401 }
      );
    }

    const userId = parseInt(decoded.userId);

    // 영업사원 권한 확인
    if (decoded.role !== "SALESPERSON") {
      return NextResponse.json(
        {
          message: "영업사원만 추천 통계를 조회할 수 있습니다",
          error: "Forbidden",
          status: 403,
          timestamp: getKSTISOString(),
          path: "/api/users/referral-stats",
        },
        { status: 403 }
      );
    }

    // 현재 사용자의 referral_code와 referral_views 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("referral_code, referral_views")
      .eq("id", userId)
      .single();

    if (userError || !user || !user.referral_code) {
      return NextResponse.json(
        {
          message: "추천 코드를 찾을 수 없습니다",
          error: "Referral code not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/users/referral-stats",
        },
        { status: 404 }
      );
    }

    // referrals 테이블에서 해당 referral_code로 가입한 사용자 수 조회
    const { count: signupCount, error: countError } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referral_code", user.referral_code);

    if (countError) {
      console.error("Error counting referrals:", countError);
      return NextResponse.json(
        {
          message: "추천 통계 조회 중 오류가 발생했습니다",
          error: "Database error",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/referral-stats",
        },
        { status: 500 }
      );
    }

    // users 테이블의 referral_views를 클릭 수로 사용
    const clickCount = user.referral_views || 0;

    return NextResponse.json({
      referralCode: user.referral_code,
      clickCount,
      signupCount: signupCount || 0,
      message: "추천 통계 조회 성공",
    });
  } catch (error) {
    console.error("Referral stats error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/referral-stats",
      },
      { status: 500 }
    );
  }
}
