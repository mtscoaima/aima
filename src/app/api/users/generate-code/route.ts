import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { generateReferralCode, getKSTISOString } from "@/lib/utils";

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

/**
 * 추천 코드 중복 검증 함수
 */
async function isReferralCodeUnique(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();

  if (error) {
    console.error("Error checking referral code uniqueness:", error);
    return false;
  }

  return !data; // 데이터가 없으면 고유함
}

/**
 * 고유한 추천 코드 생성 (중복 검증 포함)
 */
async function generateUniqueReferralCode(userId: number): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const code = generateReferralCode(userId);
    const isUnique = await isReferralCodeUnique(code);

    if (isUnique) {
      return code;
    }

    attempts++;
  }

  // 최대 시도 횟수 초과 시 타임스탬프를 더 길게 하여 재시도
  const userIdEncoded = userId.toString(36).toUpperCase();
  const randomString = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();
  const timestamp = Date.now().toString().slice(-6);

  return `${userIdEncoded}${randomString}${timestamp}`;
}

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "접근 권한이 없습니다.",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/generate-code",
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
      console.error("JWT 토큰 검증 실패: 세션이 만료되었습니다. 다시 로그인해주세요.");
      return NextResponse.json(
        {
          message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/generate-code",
        },
        { status: 401 }
      );
    }

    const userId = parseInt(decoded.userId);

    // 영업사원 권한 확인
    if (decoded.role !== "SALESPERSON") {
      return NextResponse.json(
        {
          message: "영업사원만 추천 코드를 생성할 수 있습니다",
          error: "Forbidden",
          status: 403,
          timestamp: getKSTISOString(),
          path: "/api/users/generate-code",
        },
        { status: 403 }
      );
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, referral_code, role")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("사용자 조회 실패:", userError);
      return NextResponse.json(
        {
          message: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
          error: "User not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/users/generate-code",
        },
        { status: 404 }
      );
    }

    // 이미 추천 코드가 있는 경우 기존 코드 반환
    if (user.referral_code) {
      return NextResponse.json({
        referralCode: user.referral_code,
        message: "기존 추천 코드를 반환합니다",
        isNew: false,
      });
    }

    // 새로운 추천 코드 생성
    const newReferralCode = await generateUniqueReferralCode(userId);

    // 데이터베이스에 추천 코드 저장
    const { error: updateError } = await supabase
      .from("users")
      .update({
        referral_code: newReferralCode,
        updated_at: getKSTISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating referral code:", updateError);
      return NextResponse.json(
        {
          message: "추천 코드 저장 중 오류가 발생했습니다",
          error: "Database error",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/generate-code",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      referralCode: newReferralCode,
      message: "새로운 추천 코드가 생성되었습니다",
      isNew: true,
    });
  } catch (error) {
    console.error("Generate referral code error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/generate-code",
      },
      { status: 500 }
    );
  }
}
