import { NextResponse } from "next/server";
import { getKSTISOString } from "@/lib/utils";

export async function GET() {
  try {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
      process.env.REDIRECT_URI!

    if (!googleClientId) {
      return NextResponse.json(
        {
          message: "구글 클라이언트 ID가 설정되지 않았습니다.",
          error: "Missing Google client ID",
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/google-auth-url",
        },
        { status: 500 }
      );
    }

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=email%20profile&access_type=offline&prompt=consent`;

    return NextResponse.json(
      {
        authUrl,
        redirectUri,
        timestamp: getKSTISOString(),
        path: "/api/auth/google-auth-url",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [구글 인증 URL] 전체 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/google-auth-url",
      },
      { status: 500 }
    );
  }
}
