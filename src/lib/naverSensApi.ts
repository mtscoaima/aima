import crypto from "crypto";

// NAVER SENS 설정
const NAVER_SENS_SERVICE_ID = process.env.NAVER_SENS_SERVICE_ID;
const NAVER_ACCESS_KEY_ID = process.env.NAVER_ACCESS_KEY_ID;
const NAVER_SECRET_KEY = process.env.NAVER_SECRET_KEY;
const TEST_CALLING_NUMBER = process.env.TEST_CALLING_NUMBER;

// 서명 생성 함수 (다른 파일에서도 사용 가능하도록 export)
export function makeSignature(
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

// SMS 발송 결과 타입
export interface NaverSensResult {
  success: boolean;
  requestId?: string;
  error?: string;
}

// SMS 발송 함수
export async function sendNaverSMS(
  toNumber: string,
  message: string,
  subject?: string,
  fromNumber?: string
): Promise<NaverSensResult> {
  try {
    // 환경 변수 확인
    if (
      !NAVER_SENS_SERVICE_ID ||
      !NAVER_ACCESS_KEY_ID ||
      !NAVER_SECRET_KEY ||
      !TEST_CALLING_NUMBER
    ) {
      return {
        success: false,
        error: "NAVER SENS API 설정이 누락되었습니다.",
      };
    }

    const timestamp = Date.now().toString();
    const method = "POST";
    const url = `/sms/v2/services/${NAVER_SENS_SERVICE_ID}/messages`;

    // 서명 생성
    const signature = makeSignature(
      method,
      url,
      timestamp,
      NAVER_ACCESS_KEY_ID,
      NAVER_SECRET_KEY
    );

    // 요청 헤더
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": NAVER_ACCESS_KEY_ID,
      "x-ncp-apigw-signature-v2": signature,
    };

    // 메시지 타입 결정 (90자 이하면 SMS, 초과하거나 제목이 있으면 LMS)
    const messageType = message.length <= 90 && !subject ? "SMS" : "LMS";

    // 발신번호 결정: fromNumber가 있으면 사용, 없으면 TEST_CALLING_NUMBER 사용
    const callingNumber = fromNumber || TEST_CALLING_NUMBER;

    // 요청 본문
    const data: {
      type: string;
      countryCode: string;
      from: string;
      content: string;
      subject?: string;
      messages: { to: string }[];
    } = {
      type: messageType,
      countryCode: "82",
      from: callingNumber,
      content: message,
      messages: [
        {
          to: toNumber,
        },
      ],
    };

    // LMS인 경우 제목 추가
    if (messageType === "LMS") {
      data.subject = subject || "";
    }

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
        return {
          success: false,
          error: `SMS 발송 실패 (${errorCode}): ${details || errorMessage}`,
        };
      } else {
        return {
          success: false,
          error: `SMS 발송 실패: HTTP ${response.status} - ${response.statusText}`,
        };
      }
    }

    const result = await response.json();
    return {
      success: true,
      requestId: result.requestId,
    };
  } catch (error) {
    console.error("NAVER SENS API 호출 오류:", error);

    // fetch 자체 오류 (네트워크 오류 등)
    if (error instanceof TypeError) {
      return {
        success: false,
        error: "네트워크 오류: NAVER SENS API에 연결할 수 없습니다.",
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

// MMS 발송 함수
export async function sendNaverMMS(
  toNumber: string,
  message: string,
  subject: string,
  fileIds: string[],
  fromNumber?: string
): Promise<NaverSensResult> {
  try {
    // 환경 변수 확인
    if (
      !NAVER_SENS_SERVICE_ID ||
      !NAVER_ACCESS_KEY_ID ||
      !NAVER_SECRET_KEY ||
      !TEST_CALLING_NUMBER
    ) {
      return {
        success: false,
        error: "NAVER SENS API 설정이 누락되었습니다.",
      };
    }

    const timestamp = Date.now().toString();
    const method = "POST";
    const url = `/sms/v2/services/${NAVER_SENS_SERVICE_ID}/messages`;

    const signature = makeSignature(
      method,
      url,
      timestamp,
      NAVER_ACCESS_KEY_ID,
      NAVER_SECRET_KEY
    );

    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "x-ncp-apigw-timestamp": timestamp,
      "x-ncp-iam-access-key": NAVER_ACCESS_KEY_ID,
      "x-ncp-apigw-signature-v2": signature,
    };

    // 발신번호 결정: fromNumber가 있으면 사용, 없으면 TEST_CALLING_NUMBER 사용
    const callingNumber = fromNumber || TEST_CALLING_NUMBER;

    const data = {
      type: "MMS",
      contentType: "COMM",
      countryCode: "82",
      from: callingNumber,
      subject: subject,
      content: message,
      messages: [
        {
          to: toNumber,
        },
      ],
      files: fileIds.map((fileId) => ({ fileId })),
    };

    const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();

      if (errorData.error) {
        const { errorCode, message: errorMessage, details } = errorData.error;
        return {
          success: false,
          error: `MMS 발송 실패 (${errorCode}): ${details || errorMessage}`,
        };
      } else {
        return {
          success: false,
          error: `MMS 발송 실패: HTTP ${response.status} - ${response.statusText}`,
        };
      }
    }

    const result = await response.json();
    return {
      success: true,
      requestId: result.requestId,
    };
  } catch (error) {
    console.error("NAVER SENS API 호출 오류:", error);

    if (error instanceof TypeError) {
      return {
        success: false,
        error: "네트워크 오류: NAVER SENS API에 연결할 수 없습니다.",
      };
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

