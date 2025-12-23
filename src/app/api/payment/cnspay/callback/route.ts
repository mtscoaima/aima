import { NextRequest, NextResponse } from "next/server";

/**
 * CNSPay 인증 결과 콜백 API
 *
 * 역할:
 * 1. CNSPay 인증 결과를 받아 처리
 * 2. 성공 시 승인 API 호출 또는 클라이언트로 리다이렉트
 *
 * 주의: CNSPay Non-PG는 기본적으로 클라이언트 측에서 인증 결과를 받음
 * 이 API는 필요 시 서버 측 처리용으로 사용
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ResultCd, ResultMsg, TrKey, TxnId, Moid } = body;

    console.log("📥 CNSPay 인증 콜백:", body);

    // 인증 실패 처리
    if (ResultCd !== "0000") {
      console.error("❌ CNSPay 인증 실패:", ResultMsg);
      return NextResponse.json(
        {
          success: false,
          error: ResultMsg || "인증에 실패했습니다.",
          code: ResultCd,
        },
        { status: 400 }
      );
    }

    // 인증 성공 - TrKey 반환
    return NextResponse.json({
      success: true,
      data: {
        trKey: TrKey,
        txnId: TxnId,
        moid: Moid,
      },
    });
  } catch (error) {
    console.error("CNSPay 인증 콜백 처리 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "인증 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET 요청 처리 (리다이렉트용)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const resultCd = searchParams.get("ResultCd");
  const resultMsg = searchParams.get("ResultMsg");
  const trKey = searchParams.get("TrKey");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  if (resultCd !== "0000") {
    return NextResponse.redirect(
      `${baseUrl}/credit-management?payment=failed&message=${encodeURIComponent(resultMsg || "인증 실패")}`,
      303
    );
  }

  // 성공 시 결제 페이지로 리다이렉트 (추가 처리 필요 시)
  return NextResponse.redirect(
    `${baseUrl}/credit-management?payment=auth_success&trKey=${trKey}`,
    303
  );
}

