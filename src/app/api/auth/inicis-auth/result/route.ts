import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { decryptSEED } from "@/lib/seedCrypto";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resultCode, resultMsg, authRequestUrl, txId, token } = body;

    // 필수 파라미터 확인
    if (!resultCode || !authRequestUrl || !txId || !token) {
      console.error("❌ 필수 파라미터 누락:", {
        resultCode,
        authRequestUrl,
        txId,
        token,
      });
      return NextResponse.json(
        {
          error: "필수 파라미터가 누락되었습니다.",
          details: {
            resultCode: !resultCode,
            authRequestUrl: !authRequestUrl,
            txId: !txId,
            token: !token,
          },
        },
        { status: 400 }
      );
    }

    // 결과 코드 확인
    if (resultCode !== "0000") {
      return NextResponse.json(
        { error: `본인인증 실패: ${resultMsg || "알 수 없는 오류"}` },
        { status: 400 }
      );
    }

    // authRequestUrl 검증 (KSSA 또는 FCSA)
    const validUrls = [
      process.env.INICIS_IA_RESULT_URL_KSSA,
      process.env.INICIS_IA_RESULT_URL_FCSA,
    ];

    if (!validUrls.some((url) => authRequestUrl.startsWith(url))) {
      console.error("❌ 잘못된 결과 URL:", authRequestUrl);
      return NextResponse.json(
        { error: "잘못된 결과 URL입니다.", authRequestUrl },
        { status: 400 }
      );
    }

    // 세션 쿠키 확인 및 검증
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("inicis_auth_session");

    if (!sessionCookie) {
      console.error("❌ 세션 쿠키가 없습니다");
      return NextResponse.json(
        {
          error: "세션이 만료되었습니다. 다시 시도해주세요.",
          message: "본인인증을 다시 시도해주세요.",
        },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);

    // 세션과 거래가 같은 시간대(5분 이내)에 발생했는지 확인
    const sessionTimestamp = session.timestamp;
    const currentTime = Date.now();
    const timeDiff = currentTime - sessionTimestamp;

    // 5분 이내에 발생한 거래인지 확인
    const isValidTime = timeDiff < 5 * 60 * 1000;

    if (!isValidTime) {
      console.error("❌ 거래 시간 초과");
      cookieStore.delete("inicis_auth_session");
      return NextResponse.json(
        { error: "세션이 만료되었습니다. 다시 시도해주세요." },
        { status: 401 }
      );
    }

    // 3. KG이니시스에 결과 조회 요청
    try {
      const resultUrl = authRequestUrl; // /result를 추가하지 않음
      const resultBody = {
        mid: session.mid,
        txId, // token은 body에 포함하지 않음
      };

      const resultResponse = await fetch(resultUrl, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultBody),
      });

      if (!resultResponse.ok) {
        const errorText = await resultResponse.text();
        console.error("❌ KG이니시스 API 오류:", errorText);
        throw new Error(
          `결과 조회 실패: ${resultResponse.status} - ${errorText}`
        );
      }

      const resultData = await resultResponse.json();

      // 암호화된 개인정보 복호화
      const seedKey = token; // token을 SEED 키로 사용
      const seedIv = process.env.INICIS_IA_SEED_IV || "SASKGINICIS00000";

      const decryptedName = decryptSEED(resultData.userName, seedKey, seedIv);
      const decryptedPhone = decryptSEED(resultData.userPhone, seedKey, seedIv);
      const decryptedBirthday = decryptSEED(
        resultData.userBirthday,
        seedKey,
        seedIv
      );
      const decryptedCi = decryptSEED(resultData.userCi, seedKey, seedIv);

      // CI로 중복 가입 확인
      const { data: existingUser } = await supabase
        .from("users")
        .select("id, email")
        .eq("ci", decryptedCi)
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

      // 인증 정보를 임시로 저장 (쿠키)
      const verificationId = uuidv4();
      const verificationData = {
        verificationId,
        userInfo: {
          name: decryptedName,
          phoneNumber: decryptedPhone,
          birthDate: decryptedBirthday,
          ci: decryptedCi,
        },
        timestamp: Date.now(),
      };

      // 인증 정보를 쿠키에 저장 (30분 유효)
      cookieStore.set({
        name: "inicis_verification",
        value: JSON.stringify(verificationData),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 30 * 60, // 30분
      });

      // 세션 쿠키 삭제
      cookieStore.delete("inicis_auth_session");

      // 성공 응답
      const response = NextResponse.json({
        success: true,
        userInfo: {
          name: decryptedName,
          phoneNumber: decryptedPhone,
          birthDate: decryptedBirthday,
        },
        verificationId,
      });

      return response;
    } catch (error) {
      console.error("본인인증 콜백 처리 오류:", error);
      return NextResponse.json(
        {
          success: false,
          message: "인증 결과 처리 중 오류가 발생했습니다.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("본인인증 처리 오류:", error);
    return NextResponse.json(
      {
        success: false,
        message: "본인인증 처리 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
