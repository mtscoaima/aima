import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { parseRecCert, generateDate, kmcDecryptSimple } from "@/lib/kmcCrypto";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * KMC 토큰 API 응답 코드
 */
const KMC_RESULT_CODES: Record<string, string> = {
  APR01: "성공",
  APR02: "토큰 만료 (30분)",
  APR03: "토큰 없음",
  APR04: "요청일시 길이 오류",
  APR05: "토큰 길이 오류",
  APR06: "재요청 횟수 초과 (3회)",
};

/**
 * KMC 본인확인서비스 결과 조회 API
 * POST /api/auth/kmc-auth/result
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiToken, certNum } = body;

    // 필수 파라미터 확인
    if (!apiToken || !certNum) {
      console.error("KMC 결과 조회 오류: 필수 파라미터 누락", {
        apiToken: !!apiToken,
        certNum: !!certNum,
      });
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 세션 쿠키 확인
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("kmc_auth_session");

    if (!sessionCookie) {
      console.error("KMC 결과 조회 오류: 세션 쿠키 없음");
      return NextResponse.json(
        { error: "세션이 만료되었습니다. 다시 시도해주세요." },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    // 세션 시간 확인 (30분 이내)
    const sessionTimestamp = session.timestamp;
    const currentTime = Date.now();
    const timeDiff = currentTime - sessionTimestamp;
    const isValidTime = timeDiff < 30 * 60 * 1000; // 30분

    if (!isValidTime) {
      console.error("KMC 결과 조회 오류: 세션 시간 초과");
      cookieStore.delete("kmc_auth_session");
      return NextResponse.json(
        { error: "세션이 만료되었습니다. 다시 시도해주세요." },
        { status: 401 }
      );
    }

    // [중요] apiToken과 certNum은 암호화되어 오므로 반드시 복호화해서 사용해야 함
    const decryptedToken = await kmcDecryptSimple(apiToken);
    const decryptedCertNum = await kmcDecryptSimple(certNum);

    if (process.env.NODE_ENV !== "production") {
      console.log("[KMC Debug] Decrypted Token:", decryptedToken);
      console.log("[KMC Debug] Decrypted CertNum:", decryptedCertNum);
    }

    // KMC 토큰 API 호출 (결과를 먼저 받아온 뒤 요청번호 검증 진행)
    const tokenApiUrl = process.env.KMC_TOKEN_API_URL || "https://www.kmcert.com/kmcis/api/kmcisToken_api.jsp";
    const apiDate = generateDate();

    const tokenResponse = await fetch(tokenApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiToken: decryptedToken,
        apiDate,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("KMC 토큰 API 오류:", errorText);
      return NextResponse.json(
        { error: "KMC 서버 연결 오류입니다." },
        { status: 502 }
      );
    }

    const tokenResult = await tokenResponse.json();
    
    if (process.env.NODE_ENV !== "production") {
      console.log("[KMC Debug] Token API Raw Response:", tokenResult);
    }

    // 응답 코드 확인 (KMC 샘플은 result_cd 사용)
    const resultCode = tokenResult.result_cd || tokenResult.resultCode || tokenResult.result_code;
    
    if (resultCode !== "APR01") {
      const errorMessage = KMC_RESULT_CODES[resultCode as string] || "알 수 없는 오류";
      console.error("KMC 토큰 검증 실패:", resultCode, errorMessage);
      return NextResponse.json(
        { error: `본인인증 실패: ${errorMessage} (${resultCode})` },
        { status: 400 }
      );
    }

    // rec_cert 복호화 (KMC 샘플은 apiRecCert 사용)
    const recCert = tokenResult.apiRecCert || tokenResult.rec_cert || tokenResult.recCert;
    if (!recCert) {
      console.error("KMC 결과 조회 오류: rec_cert 없음");
      return NextResponse.json(
        { error: "인증 결과를 받지 못했습니다." },
        { status: 400 }
      );
    }

    // 2단계 복호화 및 파싱
    const userData = await parseRecCert(recCert);

    if (process.env.NODE_ENV !== "production") {
      console.log("[KMC Debug] User Data Object:", userData);
    }

    // [중요] 복호화된 데이터 내부의 요청번호와 세션 요청번호 비교
    if (session.certNum !== userData.certNum) {
      console.error("KMC 결과 조회 오류: 요청번호 불일치 (검증 실패)", {
        sessionCertNum: session.certNum,
        decryptedCertNum: userData.certNum,
      });
      return NextResponse.json(
        { error: "잘못된 요청입니다. (인증번호 불일치)" },
        { status: 400 }
      );
    }

    // 인증 결과 확인
    if (userData.result !== "Y") {
      console.error("KMC 본인인증 실패 - 결과 코드:", userData.result);
      console.error("데이터 전체:", userData);
      return NextResponse.json(
        { error: `본인인증에 실패했습니다. (결과코드: ${userData.result})` },
        { status: 400 }
      );
    }

    // CI로 중복 가입 확인
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("ci", userData.ci)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: `이미 가입된 사용자입니다. 등록된 이메일: ${existingUser.email}`,
        },
        { status: 409 }
      );
    }

    // 인증 정보를 쿠키에 저장
    const verificationId = uuidv4();
    const verificationData = {
      verificationId,
      userInfo: {
        name: userData.name,
        phoneNumber: userData.phoneNo,
        birthDate: userData.birthDay,
        ci: userData.ci,
        di: userData.di,
        gender: userData.gender,
        nation: userData.nation,
      },
      timestamp: Date.now(),
    };

    // 인증 정보를 쿠키에 저장 (30분 유효)
    cookieStore.set({
      name: "kmc_verification",
      value: JSON.stringify(verificationData),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 60, // 30분
      path: "/",
    });

    // 세션 쿠키 삭제
    cookieStore.delete("kmc_auth_session");

    // 성공 응답
    return NextResponse.json({
      success: true,
      userInfo: {
        name: userData.name,
        phoneNumber: userData.phoneNo,
        birthDate: userData.birthDay,
      },
      verificationId,
    });
  } catch (error) {
    console.error("KMC 결과 조회 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "인증 결과 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
