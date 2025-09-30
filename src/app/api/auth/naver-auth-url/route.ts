import { NextResponse } from "next/server";
import { getKSTISOString } from "@/lib/utils";

export async function GET() {
  try {
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const redirectUri =
      process.env.REDIRECT_URI!

    if (!naverClientId) {
      return NextResponse.json(
        {
          message: "네이버 클라이언트 ID가 설정되지 않았습니다.",
          error: "Missing Naver client ID",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/naver-auth-url",
        },
        { status: 500 }
      );
    }

    const state = Math.random().toString(36).substring(2, 15);
    const authUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${naverClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&state=${state}`;

    return NextResponse.json(
      {
        authUrl,
        redirectUri,
        state,
        timestamp: getKSTISOString(),
        path: "/api/auth/naver-auth-url",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [네이버 인증 URL] 전체 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/naver-auth-url",
      },
      { status: 500 }
    );
  }
}
