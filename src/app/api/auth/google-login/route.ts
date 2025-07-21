import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { getKSTISOString, generateReferralCode } from "@/lib/utils";

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
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

interface GoogleUserInfo {
  id: string; // 필수: 구글 사용자 고유 ID
  email?: string; // 선택적
  verified_email?: boolean; // 선택적
  name?: string; // 선택적
  given_name?: string; // 선택적
  family_name?: string; // 선택적
  picture?: string; // 선택적
  locale?: string; // 선택적
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error(
        "❌ [구글 로그인] Supabase 환경 변수가 설정되지 않았습니다"
      );
      return NextResponse.json(
        {
          message: "서버 설정 오류가 발생했습니다.",
          error: "Missing Supabase configuration",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/google-login",
        },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { accessToken } = body;

    if (!accessToken) {
      console.error("❌ [구글 로그인] 액세스 토큰이 없습니다");
      return NextResponse.json(
        {
          message: "구글 액세스 토큰이 필요합니다.",
          error: "Missing Google access token",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/google-login",
        },
        { status: 400 }
      );
    }

    // 구글 API를 통해 사용자 정보 가져오기
    const googleResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      console.error("❌ [구글 로그인] 구글 API 오류:", errorText);
      return NextResponse.json(
        {
          message: "구글 사용자 정보를 가져올 수 없습니다.",
          error: "Failed to fetch Google user info",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/auth/google-login",
        },
        { status: 401 }
      );
    }

    const googleUser: GoogleUserInfo = await googleResponse.json();

    // 구글 사용자 ID 추출 (필수)
    const googleUserId = googleUser.id;

    // 이메일 정보 추출 (선택적 - 사용자가 동의하지 않으면 없을 수 있음)
    const email = googleUser.email || null;

    // 기존 사용자 확인 (구글 ID 우선, 이메일 보조)
    let existingUser = null;

    // 1. 구글 사용자 ID로 조회
    const { data: userByGoogleId, error: googleIdError } = await supabase
      .from("users")
      .select("*")
      .eq("google_user_id", googleUserId)
      .maybeSingle();

    if (googleIdError) {
      console.error(
        "❌ [구글 로그인] 구글 ID로 사용자 조회 중 데이터베이스 오류:",
        googleIdError
      );
      return NextResponse.json(
        {
          message: "데이터베이스 오류가 발생했습니다.",
          error: "Database error",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/google-login",
        },
        { status: 500 }
      );
    }

    if (userByGoogleId) {
      existingUser = userByGoogleId;
    } else if (email) {
      // 2. 이메일로 조회 (구글 ID가 없는 기존 사용자 대응)
      const { data: userByEmail, error: emailError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (emailError) {
        console.error(
          "❌ [구글 로그인] 이메일로 사용자 조회 중 데이터베이스 오류:",
          emailError
        );
        return NextResponse.json(
          {
            message: "데이터베이스 오류가 발생했습니다.",
            error: "Database error",
            status: 500,
            timestamp: getKSTISOString(),
            path: "/api/auth/google-login",
          },
          { status: 500 }
        );
      }

      if (userByEmail) {
        existingUser = userByEmail;

        // 기존 사용자에 구글 ID 업데이트
        await supabase
          .from("users")
          .update({ google_user_id: googleUserId })
          .eq("id", userByEmail.id);

        existingUser.google_user_id = googleUserId;
      }
    }

    if (existingUser) {
      // 기존 사용자 - 로그인 처리

      // 계정 활성화 상태 확인
      if (!existingUser.is_active) {
        return NextResponse.json(
          {
            message: "비활성화된 계정입니다.",
            error: "Account deactivated",
            status: 401,
            timestamp: getKSTISOString(),
            path: "/api/auth/google-login",
          },
          { status: 401 }
        );
      }

      // JWT 토큰 생성
      const accessTokenJWT = jwt.sign(
        {
          userId: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          phoneNumber: existingUser.phone_number,
          role: existingUser.role,
          approval_status: existingUser.approval_status,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      const refreshToken = jwt.sign(
        {
          userId: existingUser.id,
          email: existingUser.email,
          name: existingUser.name,
          phoneNumber: existingUser.phone_number,
          type: "refresh",
        },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      // 영업사원인 경우 추천 코드가 없다면 생성
      let updatedUser = existingUser;
      if (existingUser.role === "SALESPERSON" && !existingUser.referral_code) {
        const referralCode = generateReferralCode(existingUser.id);

        // 중복 검증
        let attempts = 0;
        let uniqueReferralCode = referralCode;

        while (attempts < 10) {
          const { data: existingCode } = await supabase
            .from("users")
            .select("id")
            .eq("referral_code", uniqueReferralCode)
            .maybeSingle();

          if (!existingCode) break;

          uniqueReferralCode = generateReferralCode(existingUser.id + attempts);
          attempts++;
        }

        // 추천 코드 저장
        const { data: updatedUserData, error: referralUpdateError } =
          await supabase
            .from("users")
            .update({ referral_code: uniqueReferralCode })
            .eq("id", existingUser.id)
            .select("*")
            .single();

        if (referralUpdateError) {
          console.error("Failed to update referral code:", referralUpdateError);
        } else if (updatedUserData) {
          updatedUser = updatedUserData;
        }
      }

      // 마지막 로그인 시간 업데이트
      const updateTime = getKSTISOString();
      await supabase
        .from("users")
        .update({ last_login_at: updateTime })
        .eq("id", existingUser.id);

      return NextResponse.json(
        {
          accessToken: accessTokenJWT,
          refreshToken,
          tokenType: "Bearer",
          expiresIn: 3600,
          user: {
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            phoneNumber: updatedUser.phone_number,
            role: updatedUser.role,
            createdAt: updatedUser.created_at,
            updatedAt: updatedUser.updated_at,
            approval_status: updatedUser.approval_status,
            referralCode: updatedUser.referral_code,
          },
        },
        { status: 200 }
      );
    } else {
      // 신규 사용자 - 회원가입 필요
      return NextResponse.json(
        {
          message: "새로운 사용자입니다. 회원가입이 필요합니다.",
          needsSignup: true,
          redirectToSignup: true,
          socialUserId: googleUserId, // 구글 사용자 ID 전달
          timestamp: getKSTISOString(),
          path: "/api/auth/google-login",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("❌ [구글 로그인] 전체 에러:", error);
    console.error("❌ [구글 로그인] 에러 타입:", typeof error);
    console.error(
      "❌ [구글 로그인] 에러 스택:",
      error instanceof Error ? error.stack : "스택 없음"
    );

    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/google-login",
      },
      { status: 500 }
    );
  }
}
