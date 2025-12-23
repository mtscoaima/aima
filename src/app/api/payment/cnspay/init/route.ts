import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getCNSPayConfig,
  generateEncryptData,
  getEdiDate,
  generateMoid,
  encryptPersonalInfo,
} from "@/lib/cnspay";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: "public" },
  auth: { autoRefreshToken: false, persistSession: false },
});

/**
 * CNSPay 거래초기화 API
 *
 * 역할:
 * 1. 거래 고유 ID(TxnId) 발급 요청
 * 2. 인증 Page 연동에 필요한 정보 반환
 * 3. 결제 정보 DB 임시 저장
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, goodsName, buyerName, buyerEmail, buyerTel, userId, cardCd } = body;

    // 필수 파라미터 검증
    if (!amount || !goodsName || !userId) {
      return NextResponse.json(
        { success: false, error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const config = getCNSPayConfig();
    const ediDate = getEdiDate();
    const moid = generateMoid(userId);

    // 환경변수 로드 확인
    console.log("🔑 CNSPay Config:", {
      mid: config.mid,
      merchantKeyLength: config.merchantKey?.length || 0,
      encKeyLength: config.encKey?.length || 0,
    });

    // EncryptData 생성 (거래 검증용 해시)
    // Target String: EdiDate + MID + Amt
    // 문서에 따라 MerchantKey를 salt로 사용해야 함
    const targetString = ediDate + config.mid + amount;
    console.log("📝 Hash Target String:", targetString);
    
    const encryptData = generateEncryptData(ediDate, config.mid, amount, config.merchantKey);

    // CNSPay 거래초기화 API 호출
    const initUrl = `${config.apiUrl}/cnspay/v1/init`;

    const requestBody = {
      MID: config.mid,
      Moid: moid,
      EdiDate: ediDate,
      GoodsNm: goodsName,
      Amt: amount,
      EncryptData: encryptData,
      ...(cardCd && { CardCd: cardCd }),
    };

    console.log("📤 CNSPay 거래초기화 요청:", { url: initUrl, body: requestBody });

    const initResponse = await fetch(initUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=euc-kr",
      },
      body: JSON.stringify(requestBody),
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      console.error("❌ CNSPay 거래초기화 API 실패:", errorText);
      return NextResponse.json(
        { success: false, error: "거래초기화 API 호출에 실패했습니다." },
        { status: 500 }
      );
    }

    const initData = await initResponse.json();
    console.log("📥 CNSPay 거래초기화 응답:", initData);

    // 응답 코드 검증
    if (initData.ResultCd !== "0000") {
      console.error("❌ CNSPay 거래초기화 실패:", initData);
      return NextResponse.json(
        {
          success: false,
          error: initData.ResultMsg || "거래초기화에 실패했습니다.",
          code: initData.ResultCd,
        },
        { status: 400 }
      );
    }

    // DB에 임시 결제 정보 저장
    try {
      await supabase.from("transactions").insert({
        user_id: userId,
        type: "charge",
        amount: 0, // 아직 인증 완료 전이므로 0
        description: `${goodsName} 결제 인증 시도`,
        reference_id: moid,
        metadata: {
          txnId: initData.TxnId,
          moid,
          requestAmount: amount,
          goodsName,
          buyerName,
          buyerEmail,
          buyerTel,
          paymentMethod: "cnspay",
          paymentStatus: "pending",
          ediDate,
        },
        status: "pending",
      });
    } catch (dbError) {
      console.error("DB 저장 실패:", dbError);
      // DB 저장 실패해도 결제는 진행 (나중에 수동 처리 가능)
    }

    // 클라이언트에게 반환할 데이터
    // BuyerNm, BuyerTel, BuyerEmail은 AES256 암호화 필요 (MerchantKey 앞 16바이트 사용)
    const encryptedBuyerName = buyerName ? encryptPersonalInfo(buyerName, config.merchantKey) : "";
    const encryptedBuyerTel = buyerTel ? encryptPersonalInfo(buyerTel, config.merchantKey) : "";
    const encryptedBuyerEmail = buyerEmail ? encryptPersonalInfo(buyerEmail, config.merchantKey) : "";

    console.log("🔒 암호화된 구매자 정보:", {
      originalName: buyerName,
      encryptedName: encryptedBuyerName.substring(0, 20) + "...",
    });

    const responseData = {
      txnId: initData.TxnId,
      mid: config.mid,
      moid,
      amount,
      goodsName,
      buyerName: encryptedBuyerName,
      buyerEmail: encryptedBuyerEmail,
      buyerTel: encryptedBuyerTel,
      ediDate,
      encryptData,
      prDt: initData.PrDt,
      width: initData.Width,
      height: initData.Height,
      pgUrl: config.apiUrl,
      jsPath: config.jsPath,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("CNSPay 거래초기화 실패:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "거래초기화 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

