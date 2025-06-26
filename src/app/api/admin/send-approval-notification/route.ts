import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// NAVER SENS 설정
const NAVER_SENS_SERVICE_ID = process.env.NAVER_SENS_SERVICE_ID;
const NAVER_ACCESS_KEY_ID = process.env.NAVER_ACCESS_KEY_ID;
const NAVER_SECRET_KEY = process.env.NAVER_SECRET_KEY;
const TEST_CALLING_NUMBER = process.env.TEST_CALLING_NUMBER;

// 서명 생성 함수
function makeSignature(
  method: string,
  url: string,
  timestamp: string,
  accessKey: string,
  secretKey: string
) {
  const space = " ";
  const newLine = "\n";

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url);
  hmac.update(newLine);
  hmac.update(timestamp);
  hmac.update(newLine);
  hmac.update(accessKey);

  return hmac.digest("base64");
}

// SMS 발송 함수
async function sendSMS(fromNumber: string, toNumber: string, message: string) {
  const timestamp = Date.now().toString();
  const method = "POST";
  const url = `/sms/v2/services/${NAVER_SENS_SERVICE_ID}/messages`;

  // 서명 생성
  const signature = makeSignature(
    method,
    url,
    timestamp,
    NAVER_ACCESS_KEY_ID!,
    NAVER_SECRET_KEY!
  );

  // 요청 헤더
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "x-ncp-apigw-timestamp": timestamp,
    "x-ncp-iam-access-key": NAVER_ACCESS_KEY_ID!,
    "x-ncp-apigw-signature-v2": signature,
  };

  // 요청 본문
  const data = {
    type: "SMS",
    countryCode: "82",
    from: fromNumber,
    content: message,
    messages: [
      {
        to: toNumber,
      },
    ],
  };

  try {
    // API 호출
    const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // NAVER SENS API 오류 코드별 처리
      if (errorData.error) {
        const { errorCode, message: errorMessage, details } = errorData.error;

        switch (errorCode) {
          case "200":
            throw new Error(
              `인증 실패: ${
                details || errorMessage
              }. NAVER Cloud Platform 계정 설정을 확인해주세요.`
            );
          case "400":
            throw new Error(`잘못된 요청: ${details || errorMessage}`);
          case "403":
            throw new Error(
              `권한 없음: ${
                details || errorMessage
              }. 발신번호가 등록되어 있는지 확인해주세요.`
            );
          case "404":
            throw new Error(
              `서비스를 찾을 수 없음: ${
                details || errorMessage
              }. Service ID를 확인해주세요.`
            );
          case "429":
            throw new Error(
              `요청 한도 초과: ${
                details || errorMessage
              }. 잠시 후 다시 시도해주세요.`
            );
          case "500":
            throw new Error(
              `서버 오류: ${
                details || errorMessage
              }. NAVER Cloud Platform 서비스 상태를 확인해주세요.`
            );
          default:
            throw new Error(
              `SMS 발송 실패 (${errorCode}): ${details || errorMessage}`
            );
        }
      } else {
        throw new Error(
          `SMS 발송 실패: HTTP ${response.status} - ${response.statusText}`
        );
      }
    }

    return await response.json();
  } catch (error) {
    console.error("SMS 발송 오류:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, userName, status } = body;

    // 환경 변수 확인
    if (
      !NAVER_SENS_SERVICE_ID ||
      !NAVER_ACCESS_KEY_ID ||
      !NAVER_SECRET_KEY ||
      !TEST_CALLING_NUMBER
    ) {
      const missingVars = [];
      if (!NAVER_SENS_SERVICE_ID) missingVars.push("NAVER_SENS_SERVICE_ID");
      if (!NAVER_ACCESS_KEY_ID) missingVars.push("NAVER_ACCESS_KEY_ID");
      if (!NAVER_SECRET_KEY) missingVars.push("NAVER_SECRET_KEY");
      if (!TEST_CALLING_NUMBER) missingVars.push("TEST_CALLING_NUMBER");

      return NextResponse.json(
        {
          message: "SMS 서비스 설정이 누락되었습니다.",
          error: `누락된 환경 변수: ${missingVars.join(", ")}`,
          status: 500,
          timestamp: new Date().toISOString(),
          path: "/api/admin/send-approval-notification",
        },
        { status: 500 }
      );
    }

    // 입력 검증
    if (!phoneNumber || !userName || !status) {
      return NextResponse.json(
        {
          message: "필수 파라미터가 누락되었습니다.",
          error: "Missing required parameters",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/admin/send-approval-notification",
        },
        { status: 400 }
      );
    }

    // 승인 시에만 메시지 생성
    if (status !== "APPROVED") {
      return NextResponse.json(
        {
          message: "승인 상태에서만 알림을 전송할 수 있습니다.",
          error: "Only approved status is supported",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/admin/send-approval-notification",
        },
        { status: 400 }
      );
    }

    const smsMessage = `[MTS플러스] ${userName}님, 회원 승인이 완료되었습니다. 이제 모든 서비스를 이용하실 수 있습니다.`;

    // SMS 발송
    try {
      const cleanPhoneNumber = phoneNumber.replace(/-/g, ""); // 하이픈 제거
      await sendSMS(TEST_CALLING_NUMBER, cleanPhoneNumber, smsMessage);

      return NextResponse.json(
        {
          message: "승인 알림이 발송되었습니다.",
          success: true,
          status: status,
          phoneNumber: phoneNumber,
        },
        { status: 200 }
      );
    } catch (smsError) {
      console.error("승인 알림 SMS 발송 실패:", smsError);

      return NextResponse.json(
        {
          message: "승인 알림 발송에 실패했습니다.",
          error: smsError instanceof Error ? smsError.message : "SMS 발송 오류",
          status: 500,
          timestamp: new Date().toISOString(),
          path: "/api/admin/send-approval-notification",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("승인 알림 발송 오류:", error);
    return NextResponse.json(
      {
        message: "승인 알림 발송 중 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: new Date().toISOString(),
        path: "/api/admin/send-approval-notification",
      },
      { status: 500 }
    );
  }
}
