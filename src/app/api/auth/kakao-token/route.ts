import { NextRequest, NextResponse } from "next/server";
import { getKSTISOString } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        {
          message: "인증 코드가 필요합니다.",
          error: "Missing authorization code",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-token",
        },
        { status: 400 }
      );
    }

    const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    const redirectUri =
      process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    if (!kakaoAppKey) {
      return NextResponse.json(
        {
          message: "카카오 앱 키가 설정되지 않았습니다.",
          error: "Missing Kakao app key",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-token",
        },
        { status: 500 }
      );
    }

    // 카카오 토큰 요청
    const tokenResponse = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: kakaoAppKey,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("카카오 토큰 요청 실패:", errorData);
      return NextResponse.json(
        {
          message: "카카오 토큰 요청에 실패했습니다.",
          error: "Failed to get Kakao token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-token",
        },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json(tokenData, { status: 200 });
  } catch (error) {
    console.error("카카오 토큰 교환 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/kakao-token",
      },
      { status: 500 }
    );
  }
}
