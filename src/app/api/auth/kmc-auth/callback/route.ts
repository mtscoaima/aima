import { NextRequest, NextResponse } from "next/server";

/**
 * KMC 본인확인서비스 콜백 API
 * POST /api/auth/kmc-auth/callback
 *
 * KMC에서 본인인증 완료 후 POST로 호출하는 엔드포인트
 * apiToken과 certNum을 받아 프론트엔드 페이지로 리디렉션
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // KMC에서 전달하는 파라미터
    const apiToken = formData.get("apiToken") as string;
    const certNum = formData.get("certNum") as string;

    // 필수 파라미터 검증
    if (!apiToken || !certNum) {
      console.error("KMC 콜백 오류: 필수 파라미터 누락", { apiToken: !!apiToken, certNum: !!certNum });
      return NextResponse.redirect(
        getBaseUrl(request) + "/auth/kmc/callback?error=missing_params",
        { status: 303 }
      );
    }

    // URL 파라미터 생성
    const params = new URLSearchParams({
      apiToken,
      certNum,
    });

    const baseUrl = getBaseUrl(request);
    const redirectUrl = `${baseUrl}/auth/kmc/callback?${params.toString()}`;

    // 303 See Other - POST를 GET으로 변환
    return NextResponse.redirect(redirectUrl, { status: 303 });
  } catch (error) {
    console.error("KMC 콜백 처리 오류:", error);

    return NextResponse.redirect(
      getBaseUrl(request) + "/auth/kmc/callback?error=processing_failed",
      { status: 303 }
    );
  }
}

/**
 * 요청에서 베이스 URL 추출
 * (KMC 콜백은 외부에서 들어오므로 host 헤더를 신뢰해야 함)
 */
function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}
