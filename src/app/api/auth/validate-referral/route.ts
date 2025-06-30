import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getKSTISOString, isValidReferralCode } from "@/lib/utils";

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

export async function POST(request: NextRequest) {
  try {
    const { referralCode } = await request.json();

    // 입력값 검증
    if (!referralCode) {
      return NextResponse.json(
        {
          message: "추천인 코드를 입력해주세요.",
          error: "Missing referral code",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/validate-referral",
        },
        { status: 400 }
      );
    }

    // 추천인 코드 형식 검증
    if (!isValidReferralCode(referralCode)) {
      return NextResponse.json(
        {
          message: "올바르지 않은 추천인 코드 형식입니다.",
          error: "Invalid referral code format",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/validate-referral",
          isValid: false,
        },
        { status: 400 }
      );
    }

    // 데이터베이스에서 추천인 정보 확인
    const { data: referrer, error } = await supabase
      .from("users")
      .select("id, name, referral_code, role, is_active")
      .eq("referral_code", referralCode)
      .eq("is_active", true)
      .single();

    if (error || !referrer) {
      return NextResponse.json(
        {
          message: "존재하지 않는 추천인 코드입니다.",
          error: "Referrer not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/auth/validate-referral",
          isValid: false,
        },
        { status: 404 }
      );
    }

    // 영업사원인지 확인 (추천 코드는 영업사원만 가짐)
    if (referrer.role !== "SALESPERSON") {
      return NextResponse.json(
        {
          message: "유효하지 않은 추천인입니다.",
          error: "Invalid referrer role",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/validate-referral",
          isValid: false,
        },
        { status: 400 }
      );
    }

    // 검증 성공
    return NextResponse.json({
      message: "추천인 정보가 확인되었습니다.",
      isValid: true,
      referrer: {
        id: referrer.id,
        name: referrer.name,
        referralCode: referrer.referral_code,
      },
      timestamp: getKSTISOString(),
    });
  } catch (error) {
    console.error("Validate referral error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/validate-referral",
        isValid: false,
      },
      { status: 500 }
    );
  }
}
