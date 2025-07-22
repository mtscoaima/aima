import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const resultCode = formData.get("resultCode") as string;
    const resultMsg = formData.get("resultMsg") as string;
    const authRequestUrl = formData.get("authRequestUrl") as string;
    const txId = formData.get("txId") as string;
    const token = formData.get("token") as string;

    // 필수 파라미터 검증
    if (!resultCode || resultCode === "null" || resultCode === "undefined") {
      console.error("❌ resultCode가 유효하지 않습니다:", resultCode);
      return NextResponse.redirect(
        "http://localhost:3000/auth/inicis/callback?error=invalid_resultCode",
        { status: 303 } // POST를 GET으로 변환
      );
    }

    // 파라미터 안전 처리 - null, undefined, "null", "undefined" 문자열 모두 처리
    const safeParams = {
      resultCode: resultCode || "",
      resultMsg: resultMsg || "",
      authRequestUrl:
        !authRequestUrl ||
        authRequestUrl === "null" ||
        authRequestUrl === "undefined"
          ? ""
          : authRequestUrl,
      txId: !txId || txId === "null" || txId === "undefined" ? "" : txId,
      token: !token || token === "null" || token === "undefined" ? "" : token,
    };

    // 안전한 URL 파라미터 생성
    const params = new URLSearchParams();
    Object.entries(safeParams).forEach(([key, value]) => {
      if (value) {
        params.append(key, value);
      }
    });

    // 기본 URL 설정
    let baseUrl = "http://localhost:3000";

    // 1. host 헤더 사용 (가장 신뢰할 수 있음)
    const host = request.headers.get("host");
    if (host) {
      const protocol = request.headers.get("x-forwarded-proto") || "http";
      baseUrl = `${protocol}://${host}`;
    }

    // 2. origin 헤더 확인
    const origin = request.headers.get("origin");
    if (origin && origin !== "null") {
      baseUrl = origin;
    }

    // 3. referer 헤더에서 추출
    const referer = request.headers.get("referer");
    if (referer && !baseUrl.includes("localhost")) {
      try {
        const refererUrl = new URL(referer);
        baseUrl = `${refererUrl.protocol}//${refererUrl.host}`;
      } catch (e) {
        console.error("Referer URL 파싱 실패:", e);
      }
    }

    const redirectUrl = `${baseUrl}/auth/inicis/callback?${params.toString()}`;

    // 303 See Other - POST를 GET으로 변환
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    console.error("❌ 본인인증 POST 콜백 처리 오류:", error);

    // 에러 시에도 안전한 리디렉션 (303 사용)
    return NextResponse.redirect(
      "http://localhost:3000/auth/inicis/callback?error=processing_failed",
      { status: 303 }
    );
  }
}
