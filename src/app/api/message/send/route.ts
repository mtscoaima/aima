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
    // fetch 자체 오류 (네트워크 오류 등)
    if (error instanceof TypeError) {
      throw new Error(
        `네트워크 오류: NAVER SENS API에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.`
      );
    }
    // 이미 처리된 오류는 그대로 전달
    throw error;
  }
}

// LMS (장문 메시지) 발송 함수
async function sendLMS(
  fromNumber: string,
  toNumber: string,
  subject: string,
  message: string
) {
  const timestamp = Date.now().toString();
  const method = "POST";
  const url = `/sms/v2/services/${NAVER_SENS_SERVICE_ID}/messages`;

  const signature = makeSignature(
    method,
    url,
    timestamp,
    NAVER_ACCESS_KEY_ID!,
    NAVER_SECRET_KEY!
  );

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "x-ncp-apigw-timestamp": timestamp,
    "x-ncp-iam-access-key": NAVER_ACCESS_KEY_ID!,
    "x-ncp-apigw-signature-v2": signature,
  };

  const data = {
    type: "LMS",
    countryCode: "82",
    from: fromNumber,
    subject: subject,
    content: message,
    messages: [
      {
        to: toNumber,
      },
    ],
  };

  try {
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
              `LMS 발송 실패 (${errorCode}): ${details || errorMessage}`
            );
        }
      } else {
        throw new Error(
          `LMS 발송 실패: HTTP ${response.status} - ${response.statusText}`
        );
      }
    }

    return await response.json();
  } catch (error) {
    // fetch 자체 오류 (네트워크 오류 등)
    if (error instanceof TypeError) {
      throw new Error(
        `네트워크 오류: NAVER SENS API에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.`
      );
    }
    // 이미 처리된 오류는 그대로 전달
    throw error;
  }
}

// MMS (멀티미디어 메시지) 발송 함수
async function sendMMS(
  fromNumber: string,
  toNumber: string,
  subject: string,
  message: string,
  fileIds: string[]
) {
  const timestamp = Date.now().toString();
  const method = "POST";
  const url = `/sms/v2/services/${NAVER_SENS_SERVICE_ID}/messages`;

  const signature = makeSignature(
    method,
    url,
    timestamp,
    NAVER_ACCESS_KEY_ID!,
    NAVER_SECRET_KEY!
  );

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "x-ncp-apigw-timestamp": timestamp,
    "x-ncp-iam-access-key": NAVER_ACCESS_KEY_ID!,
    "x-ncp-apigw-signature-v2": signature,
  };

  const data = {
    type: "MMS",
    contentType: "COMM",
    countryCode: "82",
    from: fromNumber,
    subject: subject,
    content: message,
    messages: [
      {
        to: toNumber,
      },
    ],
    files: fileIds.map((fileId) => ({ fileId })),
  };

  try {
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
              `MMS 발송 실패 (${errorCode}): ${details || errorMessage}`
            );
        }
      } else {
        throw new Error(
          `MMS 발송 실패: HTTP ${response.status} - ${response.statusText}`
        );
      }
    }

    return await response.json();
  } catch (error) {
    // fetch 자체 오류 (네트워크 오류 등)
    if (error instanceof TypeError) {
      throw new Error(
        `네트워크 오류: NAVER SENS API에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.`
      );
    }
    // 이미 처리된 오류는 그대로 전달
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
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
          error: "NAVER SENS API 설정이 누락되었습니다.",
          details: `누락된 환경 변수: ${missingVars.join(
            ", "
          )}. .env.local 파일을 확인하세요.`,
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { toNumber, toNumbers, subject, message, fileIds } = body;

    // 환경변수에서 발신번호 사용
    const fromNumber = TEST_CALLING_NUMBER;

    // 필수 필드 검증
    if (!message) {
      return NextResponse.json(
        { error: "메시지 내용은 필수입니다." },
        { status: 400 }
      );
    }

    // 수신번호 배열 처리 (단일 번호 또는 배열 지원)
    let recipients: string[] = [];
    if (toNumbers && Array.isArray(toNumbers)) {
      recipients = toNumbers;
    } else if (toNumber) {
      recipients = [toNumber];
    } else {
      return NextResponse.json(
        { error: "수신번호가 필요합니다." },
        { status: 400 }
      );
    }

    const results = [];

    // 각 수신자에게 메시지 전송
    for (const recipient of recipients) {
      if (!recipient.trim()) continue;

      try {
        let result;
        if (fileIds && fileIds.length > 0) {
          // MMS 발송 (파일 첨부)
          result = await sendMMS(
            fromNumber,
            recipient,
            subject || "",
            message,
            fileIds
          );
        } else if (message.length <= 90 && !subject) {
          // SMS 발송 (90자 이하, 제목 없음)
          result = await sendSMS(fromNumber, recipient, message);
        } else {
          // LMS 발송 (90자 초과 또는 제목 있음)
          result = await sendLMS(fromNumber, recipient, subject || "", message);
        }

        results.push({
          toNumber: recipient,
          success: true,
          data: result,
        });
      } catch (error) {
        console.error(`메시지 전송 실패 (${recipient}):`, error);
        results.push({
          toNumber: recipient,
          success: false,
          error: error instanceof Error ? error.message : "알 수 없는 오류",
        });
      }
    }

    // 결과 집계
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: failCount === 0,
      message:
        failCount === 0
          ? `모든 메시지가 성공적으로 전송되었습니다. (${successCount}건)`
          : successCount === 0
          ? `모든 메시지 전송에 실패했습니다. (${failCount}건)`
          : `일부 메시지가 전송되었습니다. 성공: ${successCount}건, 실패: ${failCount}건`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("메시지 전송 오류:", error);

    return NextResponse.json(
      {
        error: "메시지 전송에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
