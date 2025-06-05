import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// NAVER SENS 설정
const NAVER_SENS_SERVICE_ID = process.env.NAVER_SENS_SERVICE_ID;
const NAVER_ACCESS_KEY_ID = process.env.NAVER_ACCESS_KEY_ID;
const NAVER_SECRET_KEY = process.env.NAVER_SECRET_KEY;
const TEST_CALLING_NUMBER = process.env.TEST_CALLING_NUMBER;

// 메모리에 인증번호를 저장 (실제 운영에서는 Redis 등 사용)
const verificationCodes = new Map<
  string,
  { code: string; expiresAt: number }
>();

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

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
          path: "/api/auth/send-verification",
        },
        { status: 500 }
      );
    }

    // 입력 검증
    if (!phoneNumber) {
      return NextResponse.json(
        {
          message: "휴대폰 번호는 필수입니다.",
          error: "Missing phone number",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/send-verification",
        },
        { status: 400 }
      );
    }

    // 휴대폰 번호 형식 검증 (간단한 검증)
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phoneNumber.replace(/-/g, ""))) {
      return NextResponse.json(
        {
          message: "올바른 휴대폰 번호 형식이 아닙니다.",
          error: "Invalid phone number format",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/send-verification",
        },
        { status: 400 }
      );
    }

    // 6자리 랜덤 인증번호 생성
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // 만료 시간 설정 (5분)
    const expiresAt = Date.now() + 5 * 60 * 1000;

    // 메모리에 저장
    verificationCodes.set(phoneNumber, {
      code: verificationCode,
      expiresAt,
    });

    // 실제 SMS로 인증번호 발송
    try {
      const smsMessage = `[MTS플러스] 인증번호: ${verificationCode}`;
      const cleanPhoneNumber = phoneNumber.replace(/-/g, ""); // 하이픈 제거

      await sendSMS(TEST_CALLING_NUMBER, cleanPhoneNumber, smsMessage);

      console.log(`✅ 인증번호 SMS 발송 성공: ${phoneNumber}`);
    } catch (smsError) {
      console.error("SMS 발송 실패:", smsError);

      // SMS 발송 실패 시 저장된 인증번호 삭제
      verificationCodes.delete(phoneNumber);

      return NextResponse.json(
        {
          message: "인증번호 발송에 실패했습니다.",
          error: smsError instanceof Error ? smsError.message : "SMS 발송 오류",
          status: 500,
          timestamp: new Date().toISOString(),
          path: "/api/auth/send-verification",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "인증번호가 발송되었습니다.",
        success: true,
        expiresIn: 300, // 5분 (초 단위)
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("인증번호 발송 오류:", error);
    return NextResponse.json(
      {
        message: "인증번호 발송 중 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: new Date().toISOString(),
        path: "/api/auth/send-verification",
      },
      { status: 500 }
    );
  }
}

// 인증번호 확인 API
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, code } = body;

    // 입력 검증
    if (!phoneNumber || !code) {
      return NextResponse.json(
        {
          message: "휴대폰 번호와 인증번호는 필수입니다.",
          error: "Missing required fields",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/send-verification",
        },
        { status: 400 }
      );
    }

    // 저장된 인증번호 확인
    const storedData = verificationCodes.get(phoneNumber);

    if (!storedData) {
      return NextResponse.json(
        {
          message: "인증번호를 먼저 요청해주세요.",
          error: "No verification code found",
          status: 404,
          timestamp: new Date().toISOString(),
          path: "/api/auth/send-verification",
        },
        { status: 404 }
      );
    }

    // 만료 시간 확인
    if (Date.now() > storedData.expiresAt) {
      verificationCodes.delete(phoneNumber);
      return NextResponse.json(
        {
          message: "인증번호가 만료되었습니다. 다시 요청해주세요.",
          error: "Verification code expired",
          status: 410,
          timestamp: new Date().toISOString(),
          path: "/api/auth/send-verification",
        },
        { status: 410 }
      );
    }

    // 인증번호 확인
    if (storedData.code !== code) {
      return NextResponse.json(
        {
          message: "인증번호가 일치하지 않습니다.",
          error: "Invalid verification code",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/send-verification",
        },
        { status: 400 }
      );
    }

    // 인증 성공 - 저장된 인증번호 삭제
    verificationCodes.delete(phoneNumber);

    console.log(`✅ 휴대폰 인증 성공: ${phoneNumber}`);

    return NextResponse.json(
      {
        message: "휴대폰 인증이 완료되었습니다.",
        success: true,
        verified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("인증번호 확인 오류:", error);
    return NextResponse.json(
      {
        message: "인증번호 확인 중 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: new Date().toISOString(),
        path: "/api/auth/send-verification",
      },
      { status: 500 }
    );
  }
}
