import { NextRequest, NextResponse } from "next/server";

// Nice Payments 환경변수
const NICEPAY_CLIENT_ID = process.env.NICEPAY_CLIENT_ID!;
const NICEPAY_SECRET_KEY = process.env.NICEPAY_SECRET_KEY!;
const NICEPAY_API_URL = process.env.NICEPAY_API_URL!;

/**
 * Nice Payments 승인 API (수동 호출용)
 *
 * 역할:
 * 1. tid를 받아서 Nice Payments 승인 API를 직접 호출
 * 2. 승인 결과를 반환
 *
 * 참고:
 * - 일반적으로는 /return에서 자동으로 승인 처리되므로 이 API는 잘 사용되지 않음
 * - 에러 처리나 재시도가 필요한 경우 수동으로 호출할 수 있음
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tid, amount } = body;

    // 필수 파라미터 검증
    if (!tid || !amount) {
      return NextResponse.json(
        { error: "tid와 amount는 필수입니다." },
        { status: 400 }
      );
    }

    // Nice Payments 승인 API 호출
    const approveUrl = `${NICEPAY_API_URL}/v1/payments/${tid}`;
    const authHeader = Buffer.from(
      `${NICEPAY_CLIENT_ID}:${NICEPAY_SECRET_KEY}`
    ).toString("base64");

    console.log("🔄 수동 승인 API 호출:", approveUrl);

    const approveResponse = await fetch(approveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount,
      }),
    });

    const approveData = await approveResponse.json();

    console.log("📦 수동 승인 API 응답:", approveData);

    // 승인 실패한 경우
    if (!approveResponse.ok || approveData.resultCode !== "0000") {
      return NextResponse.json(
        {
          success: false,
          error: approveData.resultMsg || "승인에 실패했습니다.",
          code: approveData.resultCode,
          data: approveData,
        },
        { status: 400 }
      );
    }

    // 승인 성공
    return NextResponse.json({
      success: true,
      message: "승인이 성공적으로 완료되었습니다.",
      data: approveData,
    });
  } catch (error) {
    console.error("❌ Nice Payments 승인 API 호출 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: "승인 처리 중 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}