import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      price,
      goodname,
      buyername,
      buyertel,
      buyeremail,
      oid,
      // redirectUrl, // 현재 사용하지 않음
    } = body;

    if (!price || !goodname || !buyername || !buyertel || !buyeremail || !oid) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // KG이니시스 설정값
    const mid = process.env.INICIS_MID || "INIpayTest"; // 상점아이디
    const signKey =
      process.env.INICIS_SIGNKEY || "SU5JTElURV9UUklQTEVERVNfS0VZU1RS";
    const timestamp = Date.now().toString(); // 타임스탬프

    // SHA256 Hash값 생성
    const mKey = crypto.createHash("sha256").update(signKey).digest("hex");
    const signature = crypto
      .createHash("sha256")
      .update(`oid=${oid}&price=${price}&timestamp=${timestamp}`)
      .digest("hex");
    const verification = crypto
      .createHash("sha256")
      .update(
        `oid=${oid}&price=${price}&signKey=${signKey}&timestamp=${timestamp}`
      )
      .digest("hex");

    // 리턴 URL 설정
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/api/payment/inicis/return`;
    const closeUrl = `${baseUrl}/payment/close`;

    // 결제 폼 데이터 생성
    const paymentForm = {
      mid: mid,
      oid: oid,
      price: price,
      timestamp: timestamp,
      mKey: mKey,
      signature: signature,
      verification: verification,
      goodname: goodname,
      buyername: buyername,
      buyertel: buyertel,
      buyeremail: buyeremail,
      returnUrl: returnUrl,
      closeUrl: closeUrl,
      use_chkfake: "Y",
    };

    return NextResponse.json({
      success: true,
      paymentForm: paymentForm,
      message: "결제 폼 데이터가 생성되었습니다.",
    });
  } catch (error) {
    console.error("KG이니시스 결제 요청 생성 오류:", error);
    return NextResponse.json(
      { error: "결제 요청 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}
