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

// 안전한 baseUrl 생성 함수 - 강화된 버전
const getBaseUrl = (request: NextRequest): string => {
  try {
    // 1순위: request의 headers에서 host 추출
    const host = request.headers.get("host");
    const protocol =
      request.headers.get("x-forwarded-proto") ||
      (host?.includes("localhost") ? "http" : "https");

    if (host && host !== "null" && host.trim() !== "") {
      const baseUrl = `${protocol}://${host}`;
      return baseUrl;
    }

    // 2순위: request URL에서 origin 추출
    if (request.url && request.url !== "null") {
      try {
        const requestUrl = new URL(request.url);
        if (requestUrl.origin && requestUrl.origin !== "null") {
          return requestUrl.origin;
        }
      } catch (urlError) {
        console.warn("request.url 파싱 실패:", urlError);
      }
    }

    // 3순위: 환경변수
    const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (
      envBaseUrl &&
      envBaseUrl !== "null" &&
      envBaseUrl !== "undefined" &&
      envBaseUrl.startsWith("http")
    ) {
      return envBaseUrl;
    }

    // 4순위: 안전한 fallback (도메인에 맞게 수정 필요)
    const fallbackUrl = "http://localhost:3000"; // 실제 도메인으로 변경 필요
    console.warn("⚠️ Fallback baseUrl 사용:", fallbackUrl);
    return fallbackUrl;
  } catch (error) {
    console.error("❌ baseUrl 생성 중 오류:", error);
    const emergencyFallback = "http://localhost:3000";
    console.warn("🚨 Emergency fallback 사용:", emergencyFallback);
    return emergencyFallback;
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

        // 안전한 baseUrl 생성
        const baseUrl = getBaseUrl(request);

        // 자체 결제 승인 API 호출
        const confirmResponse = await fetch(`${baseUrl}/api/payment/confirm`, {
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
        });

        if (confirmResponse.ok) {
          await confirmResponse.json();

          // 결제 성공 페이지로 안전하게 리다이렉트
          try {
            // baseUrl 유효성 1차 검증
            if (!baseUrl || baseUrl === "null" || baseUrl === "undefined") {
              throw new Error("baseUrl이 유효하지 않습니다.");
            }

            // URL 파라미터 안전하게 인코딩
            const params = new URLSearchParams({
              paymentKey: paymentKey,
              orderId: orderId,
              amount: amount.toString(),
            });

            const successUrl = `${baseUrl}/payment/success?${params.toString()}`;

            // URL 유효성 검증 (실제 URL 객체 생성해서 확인)
            const validUrl = new URL(successUrl);

            return NextResponse.redirect(validUrl.toString(), 303);
          } catch (redirectError) {
            console.error("리다이렉트 URL 생성 오류:", redirectError);
            // 리다이렉트 실패 시 직접 성공 응답 반환
            return new Response(
              `
              <html>
                <head>
                  <meta charset="utf-8">
                  <title>결제 완료</title>
                </head>
                <body>
                  <script>
                    alert('결제가 완료되었습니다!');
                    window.location.href = '/credit-management';
                  </script>
                </body>
              </html>
            `,
              {
                status: 200,
                headers: { "Content-Type": "text/html; charset=utf-8" },
              }
            );
          }
        } else {
          const errorText = await confirmResponse.text();
          console.error(
            "결제 승인 API 실패:",
            confirmResponse.status,
            errorText
          );
          throw new Error(
            `결제 승인 처리에 실패했습니다. Status: ${confirmResponse.status}`
          );
        }
      } else {
        throw new Error(`승인 실패: ${approvalResult.resultMsg}`);
      }
    } else {
      // 결제 실패
      const errorMsg =
        body.get("resultMsg")?.toString() || "결제에 실패했습니다.";

      // 실패 페이지로 안전하게 리다이렉트
      const baseUrl = getBaseUrl(request);
      try {
        // baseUrl 유효성 검증
        if (!baseUrl || baseUrl === "null" || baseUrl === "undefined") {
          throw new Error("baseUrl이 유효하지 않습니다.");
        }

        const params = new URLSearchParams({
          message: errorMsg,
          code: resultCode || "UNKNOWN",
        });

        const failUrl = `${baseUrl}/payment/fail?${params.toString()}`;

        // URL 유효성 검증
        const validFailUrl = new URL(failUrl);

        return NextResponse.redirect(validFailUrl.toString(), 303);
      } catch (redirectError) {
        console.error("실패 페이지 리다이렉트 오류:", redirectError);
        return new Response(
          `
          <html>
            <head>
              <meta charset="utf-8">
              <title>결제 실패</title>
            </head>
            <body>
              <script>
                alert('결제에 실패했습니다: ${errorMsg}');
                window.location.href = '/credit-management';
              </script>
            </body>
          </html>
        `,
          {
            status: 200,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          }
        );
      }
    }
  } catch (error) {
    console.error("KG이니시스 결제 처리 오류:", error);

    // 오류 발생 시 실패 페이지로 안전하게 리다이렉트
    const baseUrl = getBaseUrl(request);
    try {
      // baseUrl 유효성 검증
      if (!baseUrl || baseUrl === "null" || baseUrl === "undefined") {
        throw new Error("baseUrl이 유효하지 않습니다.");
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.";

      const params = new URLSearchParams({
        message: errorMessage,
      });

      const failUrl = `${baseUrl}/payment/fail?${params.toString()}`;

      // URL 유효성 검증
      const validErrorUrl = new URL(failUrl);

      return NextResponse.redirect(validErrorUrl.toString(), 303);
    } catch (redirectError) {
      console.error("오류 페이지 리다이렉트 실패:", redirectError);
      return new Response(
        `
        <html>
          <head>
            <meta charset="utf-8">
            <title>결제 오류</title>
          </head>
          <body>
            <script>
              alert('결제 처리 중 오류가 발생했습니다.');
              window.location.href = '/credit-management';
            </script>
          </body>
        </html>
      `,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
  }
}

// GET 요청 처리 (결제창에서 GET으로 호출될 수도 있음)
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const resultCode = url.searchParams.get("resultCode");

  if (resultCode !== "0000") {
    // 결제 실패 시 실패 페이지로 안전하게 리다이렉트
    const errorMsg =
      url.searchParams.get("resultMsg") || "결제에 실패했습니다.";
    const baseUrl = getBaseUrl(request);
    try {
      // baseUrl 유효성 검증
      if (!baseUrl || baseUrl === "null" || baseUrl === "undefined") {
        throw new Error("baseUrl이 유효하지 않습니다.");
      }

      const params = new URLSearchParams({
        message: errorMsg,
        code: resultCode || "UNKNOWN",
      });

      const failUrl = `${baseUrl}/payment/fail?${params.toString()}`;

      // URL 유효성 검증
      const validGetFailUrl = new URL(failUrl);

      return NextResponse.redirect(validGetFailUrl.toString(), 303);
    } catch (redirectError) {
      console.error("GET 실패 페이지 리다이렉트 오류:", redirectError);
      return new Response(
        `
        <html>
          <head>
            <meta charset="utf-8">
            <title>결제 실패</title>
          </head>
          <body>
            <script>
              alert('결제에 실패했습니다.');
              window.location.href = '/credit-management';
            </script>
          </body>
        </html>
      `,
        {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
  }

  // GET 방식으로는 승인 처리를 할 수 없으므로 에러 처리
  const baseUrl = getBaseUrl(request);
  try {
    // baseUrl 유효성 검증
    if (!baseUrl || baseUrl === "null" || baseUrl === "undefined") {
      throw new Error("baseUrl이 유효하지 않습니다.");
    }

    const params = new URLSearchParams({
      message: "잘못된 결제 요청입니다.",
    });

    const failUrl = `${baseUrl}/payment/fail?${params.toString()}`;

    // URL 유효성 검증
    const validGetErrorUrl = new URL(failUrl);

    return NextResponse.redirect(validGetErrorUrl.toString(), 303);
  } catch (redirectError) {
    console.error("GET 에러 처리 리다이렉트 오류:", redirectError);
    return new Response(
      `
      <html>
        <head>
          <meta charset="utf-8">
          <title>결제 오류</title>
        </head>
        <body>
          <script>
            alert('잘못된 결제 요청입니다.');
            window.location.href = '/credit-management';
          </script>
        </body>
      </html>
    `,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }
}
