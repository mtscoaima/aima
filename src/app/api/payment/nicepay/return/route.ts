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
const NICEPAY_SECRET_KEY = process.env.NICEPAY_SECRET_KEY!;
const NICEPAY_API_URL = process.env.NICEPAY_API_URL!;

/**
 * Nice Payments 결제 결과 수신 API (returnUrl)
 *
 * 역할:
 * 1. Nice Payments 결제창에서 POST로 전달된 데이터 수신
 * 2. 위변조 검증 (서명 확인)
 * 3. 승인 API 호출
 * 4. 결제 완료 처리 또는 실패 처리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      tid,
      authResultCode,
      authResultMsg,
      signature,
      ediDate,
    } = body;

    console.log("✅ Nice Payments 결제 결과 수신:", {
      orderId,
      amount,
      tid,
      authResultCode,
      authResultMsg,
    });

    // 결제 실패한 경우
    if (authResultCode !== "0000") {
      console.error("❌ 결제 실패:", authResultMsg);

      // DB에서 해당 거래 조회 및 상태 업데이트
      const { data: transaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("reference_id", orderId)
        .single();

      if (transaction) {
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            metadata: {
              ...transaction.metadata,
              authResultCode,
              authResultMsg,
              tid,
              failedAt: new Date().toISOString(),
            },
          })
          .eq("id", transaction.id);
      }

      return NextResponse.json(
        {
          success: false,
          error: authResultMsg || "결제에 실패했습니다.",
          code: authResultCode,
        },
        { status: 400 }
      );
    }

    // 위변조 검증 (서명 확인)
    const signData = ediDate + NICEPAY_CLIENT_ID + amount + NICEPAY_CLIENT_ID;
    const expectedSignature = crypto
      .createHash("sha256")
      .update(signData)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ 서명 검증 실패: 위변조 가능성");
      return NextResponse.json(
        {
          success: false,
          error: "서명 검증에 실패했습니다.",
        },
        { status: 400 }
      );
    }

    console.log("✅ 서명 검증 성공");

    // Nice Payments 승인 API 호출
    const approveUrl = `${NICEPAY_API_URL}/v1/payments/${tid}`;
    const authHeader = Buffer.from(
      `${NICEPAY_CLIENT_ID}:${NICEPAY_SECRET_KEY}`
    ).toString("base64");

    console.log("🔄 승인 API 호출 시도:", approveUrl);

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

    console.log("📦 승인 API 응답:", approveData);

    // 승인 실패한 경우
    if (!approveResponse.ok || approveData.resultCode !== "0000") {
      console.error("❌ 승인 실패:", approveData);

      // DB 상태 업데이트
      const { data: transaction } = await supabase
        .from("transactions")
        .select("*")
        .eq("reference_id", orderId)
        .single();

      if (transaction) {
        await supabase
          .from("transactions")
          .update({
            status: "failed",
            metadata: {
              ...transaction.metadata,
              authResultCode: approveData.resultCode,
              authResultMsg: approveData.resultMsg,
              tid,
              approveData,
              failedAt: new Date().toISOString(),
            },
          })
          .eq("id", transaction.id);
      }

      return NextResponse.json(
        {
          success: false,
          error: approveData.resultMsg || "승인에 실패했습니다.",
          code: approveData.resultCode,
        },
        { status: 400 }
      );
    }

    console.log("✅ 승인 성공");

    // 승인 성공 - /api/payment/confirm으로 전달하여 크레딧 충전 처리
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const confirmUrl = `${baseUrl}/api/payment/confirm`;

    const confirmResponse = await fetch(confirmUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey: tid,
        orderId,
        amount,
        paymentData: {
          ...approveData,
          tid,
          orderId,
          amount,
          resultCode: "0000",
          resultMsg: "정상처리",
          method: "nicepay",
          goodName: approveData.goodsName || body.goodsName,
          buyerEmail: approveData.buyerEmail || body.buyerEmail,
          applDate: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
          applTime: new Date().toISOString().slice(11, 19).replace(/:/g, ""),
        },
      }),
    });

    const confirmData = await confirmResponse.json();

    if (!confirmResponse.ok) {
      console.error("❌ 크레딧 충전 실패:", confirmData);
      return NextResponse.json(
        {
          success: false,
          error: "결제는 완료되었으나 크레딧 충전에 실패했습니다.",
          details: confirmData,
        },
        { status: 500 }
      );
    }

    console.log("✅ 크레딧 충전 완료");

    // 성공 응답 반환
    return NextResponse.json({
      success: true,
      message: "결제가 성공적으로 완료되었습니다.",
      data: {
        tid,
        orderId,
        amount,
        creditInfo: confirmData.creditInfo,
      },
    });
  } catch (error) {
    console.error("❌ Nice Payments return 처리 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: "결제 처리 중 오류가 발생했습니다.",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}