import { NextResponse } from "next/server";
import { getKSTISOString } from "@/lib/utils";

export async function GET() {
  try {
    const kakaoAppKey = process.env.KAKAO_APP_KEY;
    const redirectUri =
      process.env.KAKAO_REDIRECT_URI ||
      process.env.SITE_URL ||
      "http://localhost:3000";

    if (!kakaoAppKey) {
      return NextResponse.json(
        {
          message: "카카오 앱 키가 설정되지 않았습니다.",
          error: "Missing Kakao app key",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/kakao-auth-url",
        },
        { status: 500 }
      );
    }

    const authUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoAppKey}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code`;

    return NextResponse.json(
      {
        authUrl,
        redirectUri,
        timestamp: getKSTISOString(),
        path: "/api/auth/kakao-auth-url",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [카카오 인증 URL] 전체 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/kakao-auth-url",
      },
      { status: 500 }
    );
  }
}
