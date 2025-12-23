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
    await request.json(); // 파라미터가 오더라도 현재는 사용하지 않음

    const cpId = process.env.KMC_CP_ID || "MMST1001";
    const urlCode = "015001";
    const authUrl = "https://www.kmcert.com/kmcis/web/kmcisReq.jsp";

    const certNum = generateCertNum();
    const date = generateDate();
    const trUrl = "http://localhost:3000/api/auth/kmc-auth/callback";

    const trCert = generateTrCert({
      cpId,
      urlCode,
      certNum,
      date,
      certMet: "",
      plusInfo: "",
    });

    console.log("=== KMC 인증 요청 진단 로그 (시나리오 O) ===");
    console.log("tr_url:", trUrl);
    console.log("tr_cert head:", trCert.substring(0, 50));
    console.log("===============================");

    // 시나리오 O: 파라미터를 최소화하여 서버 기본값 유도
    return NextResponse.json({
      success: true,
      authUrl,
      params: {
        tr_cert: trCert,
        tr_url: trUrl,
        // tr_ver와 tr_add를 제거하여 서버 기본 설정 사용 시도
      },
    });
  } catch {
    return NextResponse.json({ success: false, message: "오류 발생" }, { status: 500 });
  }
}
