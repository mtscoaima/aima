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

interface NaverUserInfo {
  resultcode: string;
  message: string;
  response: {
    id: string;
    nickname: string;
    name: string;
    email: string;
    gender: string;
    age: string;
    birthday: string;
    profile_image: string;
    birthyear: string;
    mobile: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 네이버 로그인 API 호출 시작");

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
          path: "/api/auth/naver-login",
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
          message: "네이버 액세스 토큰이 필요합니다.",
          error: "Missing Naver access token",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/naver-login",
        },
        { status: 400 }
      );
    }

    console.log("🔵 네이버 사용자 정보 요청 시작");

    // 네이버 API를 통해 사용자 정보 가져오기
    const naverResponse = await fetch("https://openapi.naver.com/v1/nid/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("🔵 네이버 API 응답 상태:", naverResponse.status);

    if (!naverResponse.ok) {
      const errorText = await naverResponse.text();
      console.error("❌ 네이버 API 오류:", errorText);
      return NextResponse.json(
        {
          message: "네이버 사용자 정보를 가져올 수 없습니다.",
          error: "Failed to fetch Naver user info",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/auth/naver-login",
        },
        { status: 401 }
      );
    }

    const naverUser: NaverUserInfo = await naverResponse.json();
    console.log("🔵 네이버 사용자 정보 받음:", {
      resultcode: naverUser.resultcode,
      hasResponse: !!naverUser.response,
      fullResponse: naverUser, // 전체 응답 구조 확인용
    });

    // 네이버 API 응답 확인
    if (naverUser.resultcode !== "00" || !naverUser.response) {
      console.error("❌ 네이버 API 응답 오류:", naverUser.message);
      return NextResponse.json(
        {
          message: "네이버 사용자 정보를 가져올 수 없습니다.",
          error: "Invalid Naver API response",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/naver-login",
        },
        { status: 400 }
      );
    }

    // 이메일 정보 확인
    if (!naverUser.response.email) {
      console.error("❌ 네이버 계정에 이메일 정보가 없습니다");
      return NextResponse.json(
        {
          message:
            "네이버 계정에 이메일 정보가 없습니다. 네이버 로그인 시 이메일 제공에 동의해주세요.",
          error: "No email provided",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/naver-login",
        },
        { status: 400 }
      );
    }

    const email = naverUser.response.email;
    const name = naverUser.response.name || naverUser.response.nickname;

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
          path: "/api/auth/naver-login",
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
            path: "/api/auth/naver-login",
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
          naverInfo: {
            email: email,
            name: name,
            profileImage: naverUser.response.profile_image,
          },
          timestamp: getKSTISOString(),
          path: "/api/auth/naver-login",
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("네이버 로그인 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/naver-login",
      },
      { status: 500 }
    );
  }
}
