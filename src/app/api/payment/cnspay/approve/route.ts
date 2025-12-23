import { NextRequest, NextResponse } from "next/server";
import {
  getCNSPayConfig,
  generateEncryptData,
  getEdiDate,
  encryptPersonalInfo,
} from "@/lib/cnspay";

/**
 * CNSPay 결제 승인 API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      txnId,
      trKey,
      moid,
      amount,
      goodsName,
      buyerName,
      buyerEmail,
      buyerTel,
      userId,
      payMethod = "CARD",
    } = body;

    // 필수 파라미터 검증
    if (!txnId || !trKey || !moid || !amount) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const config = getCNSPayConfig();
    const ediDate = getEdiDate();

    // EncryptData 생성 (문서에 따라 MerchantKey를 salt로 사용)
    const encryptData = generateEncryptData(ediDate, config.mid, amount, config.merchantKey);

    // 개인정보 암호화 (MerchantKey 앞 16바이트 사용)
    const encryptedBuyerNm = buyerName ? encryptPersonalInfo(buyerName, config.merchantKey) : undefined;
    const encryptedBuyerTel = buyerTel ? encryptPersonalInfo(buyerTel, config.merchantKey) : undefined;
    const encryptedBuyerEmail = buyerEmail ? encryptPersonalInfo(buyerEmail, config.merchantKey) : undefined;

    // CNSPay 결제 승인 API 호출
    const approveUrl = `${config.apiUrl}/cnspay/v1/approve`;

    const requestBody = {
      PayMethod: payMethod,
      GoodsCnt: "1",
      GoodsNm: goodsName,
      Amt: amount,
      MID: config.mid,
      BuyerNm: encryptedBuyerNm,
      BuyerTel: encryptedBuyerTel,
      BuyerEmail: encryptedBuyerEmail,
      EdiDate: ediDate,
      EncryptData: encryptData,
      Moid: moid,
      Currency: "KRW",
      TxnId: txnId,
      TrKey: trKey,
    };

    console.log("📤 CNSPay 결제승인 요청:", { url: approveUrl, body: { ...requestBody, EncryptData: "[HIDDEN]" } });

    const approveResponse = await fetch(approveUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=euc-kr",
      },
      body: JSON.stringify(requestBody),
    });

    if (!approveResponse.ok) {
      const errorText = await approveResponse.text();
      console.error("❌ CNSPay 결제승인 API 실패:", errorText);
      return NextResponse.json(
        { success: false, error: "결제승인 API 호출에 실패했습니다." },
        { status: 500 }
      );
    }

    const approveData = await approveResponse.json();
    console.log("📥 CNSPay 결제승인 응답:", approveData);

    // 응답 코드 검증
    if (approveData.ResultCd !== "0000") {
      console.error("❌ CNSPay 결제승인 실패:", approveData);
      return NextResponse.json(
        {
          success: false,
          error: approveData.ResultMsg || "결제승인에 실패했습니다.",
          code: approveData.ResultCd,
        },
        { status: 400 }
      );
    }

    // 결제 완료 처리 - confirm API 호출
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const confirmResponse = await fetch(`${baseUrl}/api/payment/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentKey: approveData.TID,
        orderId: moid,
        amount: amount,
        paymentData: {
          ...approveData,
          provider: "cnspay",
          userId,
        },
      }),
    });

    if (!confirmResponse.ok) {
      const confirmError = await confirmResponse.text();
      console.error("❌ confirm API 실패:", confirmError);
      // 승인은 됐지만 confirm 실패 - 추후 처리 필요
      return NextResponse.json(
        {
          success: false,
          error: "크레딧 충전 처리에 실패했습니다. 고객센터에 문의해주세요.",
          paymentCompleted: true,
          tid: approveData.TID,
        },
        { status: 500 }
      );
    }

    const confirmData = await confirmResponse.json();

    return NextResponse.json({
      success: true,
      data: {
        tid: approveData.TID,
        moid: approveData.Moid,
        amount: approveData.Amt,
        authDate: approveData.AuthDate,
        authCd: approveData.AuthCd,
        payMethod: approveData.PayMethod,
        cardNm: approveData.CardNm,
        cardNo: approveData.CardNo,
        cardQuota: approveData.CardQuota,
        newBalance: confirmData.newBalance,
      },
    });
  } catch (error) {
    console.error("CNSPay 결제승인 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "결제승인 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

