import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Nice Payments 환경변수
const NICEPAY_CLIENT_ID = process.env.NICEPAY_CLIENT_ID!;

/**
 * Nice Payments 결제 요청 API
 *
 * 역할:
 * 1. 주문 정보 생성 (orderId, amount 등)
 * 2. 서명(ediDate) 생성
 * 3. 결제 정보 DB 저장 (임시)
 * 4. 클라이언트에게 결제창 띄우는 데 필요한 정보 반환
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, goodsName, buyerName, buyerEmail, buyerTel, userId } = body;

    // 필수 파라미터 검증
    if (!amount || !goodsName || !buyerEmail || !userId) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // orderId 생성 (고유한 주문번호)
    const timestamp = Date.now();
    const orderId = `credit_${timestamp}_${userId}_${crypto.randomBytes(4).toString("hex")}`;

    // returnUrl 설정 (인증 완료 후 돌아올 URL)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/api/payment/nicepay/return`;

    // DB에 임시 결제 정보 저장 (나중에 검증용)
    try {
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "charge",
        amount: 0, // 아직 인증 완료 전이므로 0
        description: `${goodsName} 결제 인증 시도`,
        reference_id: orderId,
        metadata: {
          orderId,
          requestAmount: amount,
          goodsName,
          buyerName,
          buyerEmail,
          buyerTel,
          paymentMethod: "nicepay",
          paymentStatus: "pending",
        },
        status: "pending",
      });
    } catch (dbError) {
      console.error("DB 저장 실패:", dbError);
      // DB 저장 실패해도 결제는 진행 (나중에 수동 처리 가능)
    }

    // 클라이언트에게 반환할 데이터 (Server 승인 모델)
    const responseData = {
      clientId: NICEPAY_CLIENT_ID,
      orderId,
      amount,
      goodsName,
      buyerName,
      buyerEmail,
      buyerTel,
      returnUrl,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Nice Payments 결제 요청 실패:", error);
    return NextResponse.json(
      {
        error: "결제 요청 처리 중 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}