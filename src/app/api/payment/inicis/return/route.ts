import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// KG이니시스 승인 URL 설정
const getAuthUrl = (idc_name: string) => {
  const url = "stdpay.inicis.com/api/payAuth";
  switch (idc_name) {
    case "fc":
      return `https://fc${url}`;
    case "ks":
      return `https://ks${url}`;
    case "stg":
      return `https://stg${url}`;
    default:
      return `https://stdpay.inicis.com/api/payAuth`;
  }
};

// 망취소 URL 설정 (필요시 사용)
// const getNetCancel = (idc_name: string) => {
//   const url = "stdpay.inicis.com/api/netCancel";
//   switch (idc_name) {
//     case "fc":
//       return `https://fc${url}`;
//     case "ks":
//       return `https://ks${url}`;
//     case "stg":
//       return `https://stg${url}`;
//     default:
//       return `https://stdpay.inicis.com/api/netCancel`;
//   }
// };

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();

    // FormData에서 값 추출
    const resultCode = body.get("resultCode")?.toString();
    const mid = body.get("mid")?.toString();
    const authToken = body.get("authToken")?.toString();
    // const netCancelUrl = body.get("netCancelUrl")?.toString();
    const idc_name = body.get("idc_name")?.toString();
    const authUrl = body.get("authUrl")?.toString();
    // const oid = body.get("MOID")?.toString() || body.get("oid")?.toString();
    // const price = body.get("TotPrice")?.toString() || body.get("price")?.toString();

    if (resultCode === "0000") {
      // 결제 성공 - 승인 요청 진행
      const signKey =
        process.env.INICIS_SIGNKEY || "SU5JTElURV9UUklQTEVERVNfS0VZU1RS";
      const timestamp = Date.now().toString();
      const charset = "UTF-8";
      const format = "JSON";

      if (!authToken || !idc_name || !mid) {
        throw new Error("승인에 필요한 정보가 누락되었습니다.");
      }

      // 승인 URL 확인
      const expectedAuthUrl = getAuthUrl(idc_name);

      if (authUrl !== expectedAuthUrl) {
        throw new Error("승인 URL이 일치하지 않습니다.");
      }

      // SHA256 Hash값 생성
      const signature = crypto
        .createHash("sha256")
        .update(`authToken=${authToken}&timestamp=${timestamp}`)
        .digest("hex");
      const verification = crypto
        .createHash("sha256")
        .update(
          `authToken=${authToken}&signKey=${signKey}&timestamp=${timestamp}`
        )
        .digest("hex");

      // 승인 요청 데이터
      const approvalData = {
        mid: mid,
        authToken: authToken,
        timestamp: timestamp,
        signature: signature,
        verification: verification,
        charset: charset,
        format: format,
      };

      // KG이니시스 승인 API 호출
      const response = await fetch(expectedAuthUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(approvalData).toString(),
      });

      if (!response.ok) {
        throw new Error("승인 요청에 실패했습니다.");
      }

      const approvalResult = await response.json();

      if (approvalResult.resultCode === "0000") {
        // 승인 성공 - 자체 결제 승인 API 호출
        const paymentKey = approvalResult.tid; // KG이니시스의 tid를 paymentKey로 사용
        const orderId = approvalResult.MOID;
        const amount = parseInt(approvalResult.TotPrice);

        // 자체 결제 승인 API 호출
        const confirmResponse = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/confirm`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              paymentKey: paymentKey,
              orderId: orderId,
              amount: amount,
              paymentData: approvalResult, // KG이니시스 승인 결과 전체 전달
            }),
          }
        );

        if (confirmResponse.ok) {
          // 결제 성공 페이지로 리다이렉트
          const redirectUrl = new URL(
            "/payment/success",
            process.env.NEXT_PUBLIC_BASE_URL
          );
          redirectUrl.searchParams.set("paymentKey", paymentKey);
          redirectUrl.searchParams.set("orderId", orderId);
          redirectUrl.searchParams.set("amount", amount.toString());

          return NextResponse.redirect(redirectUrl.toString());
        } else {
          throw new Error("결제 승인 처리에 실패했습니다.");
        }
      } else {
        throw new Error(`승인 실패: ${approvalResult.resultMsg}`);
      }
    } else {
      // 결제 실패
      const errorMsg =
        body.get("resultMsg")?.toString() || "결제에 실패했습니다.";

      // 실패 페이지로 리다이렉트
      const redirectUrl = new URL(
        "/payment/fail",
        process.env.NEXT_PUBLIC_BASE_URL
      );
      redirectUrl.searchParams.set("message", errorMsg);
      redirectUrl.searchParams.set("code", resultCode || "UNKNOWN");

      return NextResponse.redirect(redirectUrl.toString());
    }
  } catch (error) {
    console.error("KG이니시스 결제 처리 오류:", error);

    // 오류 발생 시 실패 페이지로 리다이렉트
    const redirectUrl = new URL(
      "/payment/fail",
      process.env.NEXT_PUBLIC_BASE_URL
    );
    redirectUrl.searchParams.set(
      "message",
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다."
    );

    return NextResponse.redirect(redirectUrl.toString());
  }
}

// GET 요청 처리 (결제창에서 GET으로 호출될 수도 있음)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const resultCode = url.searchParams.get("resultCode");

  if (resultCode !== "0000") {
    // 결제 실패 시 실패 페이지로 리다이렉트
    const errorMsg =
      url.searchParams.get("resultMsg") || "결제에 실패했습니다.";
    const redirectUrl = new URL(
      "/payment/fail",
      process.env.NEXT_PUBLIC_BASE_URL
    );
    redirectUrl.searchParams.set("message", errorMsg);
    redirectUrl.searchParams.set("code", resultCode || "UNKNOWN");

    return NextResponse.redirect(redirectUrl.toString());
  }

  // GET 방식으로는 승인 처리를 할 수 없으므로 에러 처리
  const redirectUrl = new URL(
    "/payment/fail",
    process.env.NEXT_PUBLIC_BASE_URL
  );
  redirectUrl.searchParams.set("message", "잘못된 결제 요청입니다.");

  return NextResponse.redirect(redirectUrl.toString());
}
