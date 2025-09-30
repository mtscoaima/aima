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
          path: "/api/auth/google-token",
        },
        { status: 400 }
      );
    }

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.REDIRECT_URI!

    if (!googleClientId || !googleClientSecret) {
      return NextResponse.json(
        {
          message: "구글 앱 키가 설정되지 않았습니다.",
          error: "Missing Google app key",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/google-token",
        },
        { status: 500 }
      );
    }

    // 구글 토큰 요청
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("구글 토큰 요청 실패:", errorData);
      return NextResponse.json(
        {
          message: "구글 토큰 요청에 실패했습니다.",
          error: "Failed to get Google token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/auth/google-token",
        },
        { status: 401 }
      );
    }

    const tokenData = await tokenResponse.json();

    return NextResponse.json(tokenData, { status: 200 });
  } catch (error) {
    console.error("구글 토큰 교환 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/google-token",
      },
      { status: 500 }
    );
  }
}
