import { NextRequest, NextResponse } from "next/server";
import {
  generateTrCert,
  generateCertNum,
  generateDate,
} from "@/lib/kmcCrypto";

/**
 * KMC 본인확인서비스 인증 요청 API
 * POST /api/auth/kmc-auth/request
 */
export async function POST(request: NextRequest) {
  try {
    const { name, phoneNumber, birthDate } = await request.json();

    // 환경변수 확인 (빈 문자열도 체크)
    const requiredEnvVars = [
      "KMC_CP_ID",
      "KMC_URL_CODE",
      "KMC_AUTH_URL",
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]?.trim()) {
        console.error(`환경변수 ${envVar}가 설정되지 않았거나 빈 값입니다.`);
        return NextResponse.json(
          {
            success: false,
            message: "본인인증 서비스 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.",
          },
          { status: 500 }
        );
      }
    }

    const cpId = process.env.KMC_CP_ID!;
    const urlCode = process.env.KMC_URL_CODE!;
    const authUrl = process.env.KMC_AUTH_URL!;

    // 요청번호 및 일시 생성
    const certNum = generateCertNum();
    const date = generateDate();

    // 콜백 URL 설정
    const baseUrl = request.headers.get("origin") || "http://localhost:3000";
    const trUrl = `${baseUrl}/api/auth/kmc-auth/callback`;

    // plusInfo에 사용자 입력 정보 저장 (선택적)
    const plusInfo = JSON.stringify({
      name: name || "",
      phone: phoneNumber || "",
      birth: birthDate || "",
    });

    // tr_cert 생성 (2단계 암호화)
    const trCert = generateTrCert({
      cpId,
      urlCode,
      certNum,
      date,
      certMet: "", // 본인확인방법 미지정 (사용자가 선택)
      plusInfo,
    });

    // 세션 데이터 생성
    const sessionData = {
      certNum,
      timestamp: Date.now(),
      expectedName: name,
      expectedPhone: phoneNumber,
      expectedBirth: birthDate,
    };

    const response = NextResponse.json({
      success: true,
      authUrl,
      params: {
        tr_cert: trCert,
        tr_url: trUrl,
        tr_ver: "V2",
      },
    });

    // 세션 데이터를 쿠키에 저장 (HttpOnly, Secure)
    response.cookies.set("kmc_auth_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30, // 30분 (KMC 토큰 만료시간)
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("KMC 본인인증 요청 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "본인인증 요청 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
