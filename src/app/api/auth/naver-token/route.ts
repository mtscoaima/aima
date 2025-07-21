import { NextRequest, NextResponse } from "next/server";
import { getKSTISOString } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, state } = body;

    if (!code) {
      return NextResponse.json(
        {
          message: "인증 코드가 필요합니다.",
          error: "Missing authorization code",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/naver-token",
        },
        { status: 400 }
      );
    }

    const naverClientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;
    const redirectUri =
      process.env.NEXT_PUBLIC_NAVER_REDIRECT_URI ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    if (!naverClientId || !naverClientSecret) {
      return NextResponse.json(
        {
          message: "네이버 앱 키가 설정되지 않았습니다.",
          error: "Missing Naver app key",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/naver-token",
        },
        { status: 500 }
      );
    }

    // 네이버 토큰 요청
    const tokenResponse = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: naverClientId,
        client_secret: naverClientSecret,
        redirect_uri: redirectUri,
        code: code,
        state: state,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("네이버 토큰 요청 실패:", errorData);
      return NextResponse.json(
        {
          message: "네이버 토큰 요청에 실패했습니다.",
          error: "Failed to get Naver token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/auth/naver-token",
        },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json(tokenData, { status: 200 });
  } catch (error) {
    console.error("네이버 토큰 교환 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/naver-token",
      },
      { status: 500 }
    );
  }
}
