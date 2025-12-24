import { NextRequest, NextResponse } from "next/server";
import {
  generateTrCert,
  generateCertNum,
  generateDate,
} from "@/lib/kmcCrypto";

/**
 * KMC 본인확인서비스 인증 요청 API
 */
export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱 (필요한 경우 로깅용으로 사용 가능하나 현재는 불필요)
    // const { name, phoneNumber, birthDate } = await request.json();

    const cpId = process.env.KMC_CP_ID || "MMST1001";
    const urlCode = process.env.KMC_URL_CODE || "015001";
    const authUrl = "https://www.kmcert.com/kmcis/web/kmcisReq.jsp";

    const certNum = generateCertNum();
    const date = generateDate();

    // 콜백 URL 설정 (운영 환경 고려하여 동적 생성)
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;
    const trUrl = `${baseUrl}/api/auth/kmc-auth/callback`;

    const trCert = await generateTrCert({
      cpId,
      urlCode,
      certNum,
      date,
      certMet: "M",  // 휴대폰 인증 기본값
      plusInfo: "", // 추가 정보 필드 비움
    });

    console.log("=== KMC 인증 요청 FULL 로그 ===");
    console.log("1. CP_ID:", cpId);
    console.log("2. URL_CODE:", urlCode);
    console.log("3. tr_url:", trUrl);
    console.log("4. certNum:", certNum);
    console.log("5. date:", date);
    console.log("6. tr_cert (FULL):", trCert);
    console.log("===============================");

    // 세션 쿠키 설정 (보안 및 결과 검증용)
    const response = NextResponse.json({
      success: true,
      authUrl,
      params: {
        tr_cert: trCert,
        tr_url: trUrl,
        tr_ver: "V2",
      },
    });

    // 인증 세션 정보를 쿠키에 저장 (10분 유효)
    response.cookies.set({
      name: "kmc_auth_session",
      value: JSON.stringify({
        certNum,
        timestamp: Date.now(),
      }),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // 팝업/리디렉션 환경 고려
      path: "/",
      maxAge: 60 * 10, // 10분
    });

    return response;
  } catch (error) {
    console.error("KMC 본인인증 요청 오류:", error);
    return NextResponse.json({ success: false, message: "인증 요청 중 오류가 발생했습니다." }, { status: 500 });
  }
}
