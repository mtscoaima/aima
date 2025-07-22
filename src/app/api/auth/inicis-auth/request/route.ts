import { NextRequest, NextResponse } from "next/server";
import { sha256 } from "@/lib/seedCrypto";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { name, phoneNumber, birthDate } = await request.json();

    // 환경변수 확인
    const requiredEnvVars = [
      "INICIS_IA_MID",
      "INICIS_IA_API_KEY",
      "INICIS_IA_SEED_IV",
      "INICIS_IA_AUTH_URL",
      "INICIS_IA_RESULT_URL_KSSA",
      "INICIS_IA_RESULT_URL_FCSA",
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        return NextResponse.json(
          { error: `환경변수 ${envVar}가 설정되지 않았습니다.` },
          { status: 500 }
        );
      }
    }

    // 본인인증 요청 파라미터 생성
    // 한국 시간(KST)으로 타임스탬프 생성
    const kstDate = new Date();
    kstDate.setHours(kstDate.getHours() + 9); // UTC to KST
    const timestamp = kstDate
      .toISOString()
      .replace(/[-:T.]/g, "")
      .slice(0, 14); // YYYYMMDDHHmmss

    const uniqueId = uuidv4().slice(0, 10);
    const mTxId = `${process.env.INICIS_IA_MID}${timestamp}${uniqueId}`;

    const authHash = sha256(
      `${process.env.INICIS_IA_MID}${mTxId}${process.env.INICIS_IA_API_KEY}`
    );
    const userHash = phoneNumber ? sha256(phoneNumber) : "";

    // 콜백 URL 설정 - API 라우트로 변경
    const baseUrl = request.headers.get("origin") || "http://localhost:3000";
    const returnUrl = `${baseUrl}/api/auth/inicis-auth/callback`;
    const notiUrl = returnUrl;

    // 요청 구분 코드 (01: 간편인증, 02: 전자서명)
    const reqSvcCd = "01";

    // 필수 파라미터 추가
    const successUrl = returnUrl; // 성공 시 리디렉션 URL (POST 요청을 받을 수 있는 route)
    const failUrl = returnUrl; // 실패 시 리디렉션 URL (동일하게 설정)
    const identifier = "테스트 본인인증"; // 인증 시 표시될 문구
    const directAgency = ""; // 특정 통신사 지정 (빈값이면 전체)

    // reservedMsg: 결과조회 응답시 개인정보 SEED 암호화 처리 요청
    const reservedMsg = "isUseToken=Y";

    // 세션에 거래 정보 저장 (나중에 결과 검증용)
    // TODO: Redis 또는 데이터베이스에 저장하는 것이 더 안전합니다
    const sessionData = {
      mTxId,
      mid: process.env.INICIS_IA_MID,
      reqSvcCd,
      timestamp: Date.now(),
      expectedName: name,
      expectedPhone: phoneNumber,
      expectedBirth: birthDate,
    };

    // 쿠키에 임시 저장 (실제로는 Redis나 DB 사용 권장)
    const response = NextResponse.json({
      success: true,
      authUrl: process.env.INICIS_IA_AUTH_URL,
      params: {
        mid: process.env.INICIS_IA_MID,
        mTxId,
        reqSvcCd,
        returnUrl,
        notiUrl,
        authHash,
        userHash,
        flgFixedUser: "N", // 사용자 정보가 제공되지 않아 고정 사용자 옵션 비활성화
        userName: name || "",
        userPhone: phoneNumber || "",
        userBirth: birthDate || "",
        reservedMsg,
        identifier,
        successUrl,
        failUrl,
        directAgency,
      },
    });

    // 세션 데이터를 쿠키에 저장 (HttpOnly, Secure)
    response.cookies.set("inicis_auth_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10분
    });

    return response;
  } catch (error) {
    console.error("본인인증 요청 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "본인인증 요청 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
