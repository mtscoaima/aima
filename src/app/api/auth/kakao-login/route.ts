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

interface KakaoUserInfo {
  id: number;
  connected_at: string;
  properties: {
    nickname: string;
    profile_image?: string;
    thumbnail_image?: string;
  };
  kakao_account: {
    profile_nickname_needs_agreement: boolean;
    profile_image_needs_agreement: boolean;
    profile: {
      nickname: string;
      thumbnail_image_url?: string;
      profile_image_url?: string;
      is_default_image: boolean;
    };
    has_email: boolean;
    email_needs_agreement: boolean;
    is_email_valid: boolean;
    is_email_verified: boolean;
    email: string;
    has_phone_number?: boolean;
    phone_number_needs_agreement?: boolean;
    phone_number?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 카카오 로그인 API 호출 시작");

    // 환경 변수 확인
    console.log("🔵 환경 변수 체크:");
    console.log("- NEXT_PUBLIC_SUPABASE_URL:", !!supabaseUrl);
    console.log("- SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
    console.log("- JWT_SECRET:", !!JWT_SECRET);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Supabase 환경 변수가 설정되지 않았습니다");
      return NextResponse.json(
        {
          message: "서버 설정 오류가 발생했습니다.",
          error: "Missing Supabase configuration",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-login",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("🔵 요청 본문:", { hasAccessToken: !!body.accessToken });

    const { accessToken } = body;

    if (!accessToken) {
      console.error("❌ 액세스 토큰이 없습니다");
      return NextResponse.json(
        {
          message: "카카오 액세스 토큰이 필요합니다.",
          error: "Missing Kakao access token",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-login",
        },
        { status: 400 }
      );
    }

    console.log("🔵 카카오 사용자 정보 요청 시작");

    // 카카오 API를 통해 사용자 정보 가져오기
    const kakaoResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
    });

    console.log("🔵 카카오 API 응답 상태:", kakaoResponse.status);

    if (!kakaoResponse.ok) {
      const errorText = await kakaoResponse.text();
      console.error("❌ 카카오 API 오류:", errorText);
      return NextResponse.json(
        {
          message: "카카오 사용자 정보를 가져올 수 없습니다.",
          error: "Failed to fetch Kakao user info",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-login",
        },
        { status: 401 }
      );
    }

    const kakaoUser: KakaoUserInfo = await kakaoResponse.json();
    console.log("🔵 카카오 사용자 정보 받음:", {
      id: kakaoUser.id,
      hasKakaoAccount: !!kakaoUser.kakao_account,
      fullResponse: kakaoUser, // 전체 응답 구조 확인용
    });

    // 카카오 계정 정보 구조 확인
    if (!kakaoUser.kakao_account) {
      console.error("❌ 카카오 계정 정보가 없습니다");
      console.log("🔍 카카오 응답 구조:", JSON.stringify(kakaoUser, null, 2));
      return NextResponse.json(
        {
          message:
            "카카오 계정 정보를 가져올 수 없습니다. 이메일 제공에 동의해주세요.",
          error: "No kakao_account data",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-login",
        },
        { status: 400 }
      );
    }

    // 이메일 정보 확인
    if (!kakaoUser.kakao_account.has_email || !kakaoUser.kakao_account.email) {
      console.error("❌ 카카오 계정에 이메일 정보가 없습니다");
      console.log(
        "🔍 카카오 계정 구조:",
        JSON.stringify(kakaoUser.kakao_account, null, 2)
      );
      return NextResponse.json(
        {
          message:
            "카카오 계정에 이메일 정보가 없습니다. 카카오 로그인 시 이메일 제공에 동의해주세요.",
          error: "No email provided",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-login",
        },
        { status: 400 }
      );
    }

    const email = kakaoUser.kakao_account.email;
    const name = kakaoUser.kakao_account.profile.nickname;

    console.log("🔵 데이터베이스에서 기존 사용자 확인 시작");
    console.log("- 이메일:", email);

    // 기존 사용자 확인
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    console.log("🔵 사용자 조회 결과:", {
      userFound: !!existingUser,
      errorCode: userError?.code,
      errorMessage: userError?.message,
    });

    if (userError && userError.code !== "PGRST116") {
      // PGRST116은 "No rows found" 에러
      console.error("❌ 데이터베이스 오류:", userError);
      return NextResponse.json(
        {
          message: "데이터베이스 오류가 발생했습니다.",
          error: "Database error",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-login",
        },
        { status: 500 }
      );
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
            path: "/api/auth/kakao-login",
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
          kakaoInfo: {
            email: email,
            name: name,
            profileImage: kakaoUser.kakao_account.profile.profile_image_url,
          },
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-login",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("카카오 로그인 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/kakao-login",
      },
      { status: 500 }
    );
  }
}
