import { NextRequest, NextResponse } from "next/server";

// 메모리에 인증번호를 저장 (실제 운영에서는 Redis 등 사용)
const verificationCodes = new Map<
  string,
  { code: string; expiresAt: number }
>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

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

    // 콘솔에 인증번호 출력 (개발용)
    console.log(`📱 휴대폰 인증번호 발송`);
    console.log(`전화번호: ${phoneNumber}`);
    console.log(`인증번호: ${verificationCode}`);
    console.log(`만료시간: ${new Date(expiresAt).toLocaleString()}`);
    console.log(`-----------------------------------`);

    // 실제 운영에서는 SMS API를 호출하여 인증번호를 발송
    // 예: await sendSMS(phoneNumber, `인증번호: ${verificationCode}`);

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
