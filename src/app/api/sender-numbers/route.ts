import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 서버 사이드에서는 서비스 역할 키 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// JWT 토큰 검증 및 사용자 ID 추출 함수
async function verifyTokenAndGetUserId(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name: string;
      phoneNumber: string;
      role: string;
    };

    return decoded.userId;
  } catch {
    return null;
  }
}

// GET: 사용자의 발신번호 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyTokenAndGetUserId(request);

    if (!userId) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 401 }
      );
    }

    // 발신번호 목록 조회 (기본번호가 먼저 오도록 정렬)
    const { data: senderNumbers, error } = await supabase
      .from("sender_numbers")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ 발신번호 조회 에러:", error);
      return NextResponse.json(
        {
          message: "발신번호 목록 조회 중 오류가 발생했습니다",
          error: `Database Error: ${error.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 500 }
      );
    }

    // 기본 발신번호 찾기
    const defaultNumber = senderNumbers.find((num) => num.is_default);

    // 기본 발신번호 결정 (모든 사용자가 본인 발신번호를 가지고 있으므로 fallback 불필요)
    const finalDefaultNumber = defaultNumber?.phone_number || null;

    const responseData = {
      senderNumbers: senderNumbers.map((num) => ({
        id: num.id,
        number: num.phone_number,
        name: num.display_name,
        registrationDate: new Date(num.created_at)
          .toISOString()
          .slice(2, 10)
          .replace(/-/g, "-"),
        status: num.status === "ACTIVE" ? "정상" : num.status,
        isDefault: num.is_default,
        isVerified: num.is_verified,
        isUserPhone: num.is_user_phone || false, // 본인 전화번호 여부 추가
      })),
      defaultNumber: finalDefaultNumber,
      totalCount: senderNumbers.length,
      maxCount: 10,
      remainingCount: 10 - senderNumbers.length,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Sender numbers API Error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다.",
        error: "Internal Server Error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/sender-numbers",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// POST: 새 발신번호 추가
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyTokenAndGetUserId(request);
    if (!userId) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 401 }
      );
    }

    const { phoneNumber, displayName } = await request.json();

    // 입력 검증
    if (!phoneNumber) {
      return NextResponse.json(
        {
          message: "전화번호는 필수입니다",
          error: "Bad Request",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 및 정규화
    let normalizedPhoneNumber = phoneNumber;

    // 하이픈 제거 후 숫자만 추출
    const digitsOnly = phoneNumber.replace(/[^0-9]/g, "");

    // 두 가지 형식 모두 허용: 010-XXXX-XXXX 또는 01XXXXXXXXX
    const phoneRegexWithHyphen = /^010-[0-9]{4}-[0-9]{4}$/;
    const phoneRegexWithoutHyphen = /^010[0-9]{8}$/;

    if (phoneRegexWithHyphen.test(phoneNumber)) {
      // 이미 하이픈 형식인 경우
      normalizedPhoneNumber = phoneNumber;
    } else if (phoneRegexWithoutHyphen.test(digitsOnly)) {
      // 숫자만 입력된 경우, 하이픈 형식으로 변환
      normalizedPhoneNumber = digitsOnly.replace(
        /(\d{3})(\d{4})(\d{4})/,
        "$1-$2-$3"
      );
    } else {
      return NextResponse.json(
        {
          message:
            "올바른 전화번호 형식이 아닙니다 (010-XXXX-XXXX 또는 01XXXXXXXXX)",
          error: "Bad Request",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 400 }
      );
    }

    // 현재 등록된 발신번호 개수 확인
    const { count } = await supabase
      .from("sender_numbers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (count && count >= 10) {
      return NextResponse.json(
        {
          message: "최대 10개까지만 등록할 수 있습니다",
          error: "Bad Request",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 400 }
      );
    }

    // 본인 전화번호와의 중복 체크
    const { data: userData } = await supabase
      .from("users")
      .select("phone_number")
      .eq("id", userId)
      .single();

    if (userData?.phone_number) {
      // 사용자 전화번호 정규화
      let userNormalizedPhone = userData.phone_number;
      const userDigitsOnly = userData.phone_number.replace(/[^0-9]/g, "");
      if (phoneRegexWithoutHyphen.test(userDigitsOnly)) {
        userNormalizedPhone = userDigitsOnly.replace(
          /(\d{3})(\d{4})(\d{4})/,
          "$1-$2-$3"
        );
      }

      if (normalizedPhoneNumber === userNormalizedPhone) {
        return NextResponse.json(
          {
            message: "본인 전화번호는 이미 자동으로 등록되어 있습니다",
            error: "User Phone Already Registered",
            status: 409,
            timestamp: getKSTISOString(),
            path: "/api/sender-numbers",
          },
          { status: 409 }
        );
      }
    }

    // 중복 번호 확인 (정규화된 전화번호로)
    const { data: existing } = await supabase
      .from("sender_numbers")
      .select("id")
      .eq("user_id", userId)
      .eq("phone_number", normalizedPhoneNumber)
      .single();

    if (existing) {
      return NextResponse.json(
        {
          message: "이미 등록된 발신번호입니다",
          error: "Conflict",
          status: 409,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 409 }
      );
    }

    // 첫 번째 발신번호인 경우 기본번호로 설정
    const isFirstNumber = count === 0;

    // 새 발신번호 추가 (정규화된 전화번호로)
    const { data: newSenderNumber, error } = await supabase
      .from("sender_numbers")
      .insert({
        user_id: userId,
        phone_number: normalizedPhoneNumber,
        display_name: displayName || "미등록",
        is_default: isFirstNumber,
        is_user_phone: false, // 일반 발신번호 (본인 번호가 아님)
        is_verified: false, // 실제로는 인증 과정이 필요
        status: "ACTIVE",
      })
      .select()
      .single();

    if (error) {
      console.error("Sender number insert error:", error);
      return NextResponse.json(
        {
          message: "발신번호 추가 중 오류가 발생했습니다",
          error: `Database Error: ${error.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "발신번호가 성공적으로 추가되었습니다",
        senderNumber: {
          id: newSenderNumber.id,
          number: newSenderNumber.phone_number,
          name: newSenderNumber.display_name,
          registrationDate: new Date(newSenderNumber.created_at)
            .toISOString()
            .slice(2, 10)
            .replace(/-/g, "-"),
          status: "정상",
          isDefault: newSenderNumber.is_default,
          isVerified: newSenderNumber.is_verified,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add sender number error:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/sender-numbers",
      },
      { status: 500 }
    );
  }
}

// DELETE: 선택된 발신번호들 삭제
export async function DELETE(request: NextRequest) {
  try {
    const userId = await verifyTokenAndGetUserId(request);
    if (!userId) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 401 }
      );
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          message: "삭제할 발신번호 ID가 필요합니다",
          error: "Bad Request",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 400 }
      );
    }

    // 삭제하려는 번호 중 기본번호나 본인번호가 있는지 확인
    const { data: numbersToDelete } = await supabase
      .from("sender_numbers")
      .select("id, is_default, is_user_phone, phone_number")
      .eq("user_id", userId)
      .in("id", ids);

    const hasDefaultNumber = numbersToDelete?.some((num) => num.is_default);
    if (hasDefaultNumber) {
      return NextResponse.json(
        {
          message: "기본 발신번호는 삭제할 수 없습니다",
          error: "Bad Request",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 400 }
      );
    }

    // 본인 전화번호 삭제 방지
    const hasUserPhone = numbersToDelete?.some((num) => num.is_user_phone);
    if (hasUserPhone) {
      return NextResponse.json(
        {
          message: "본인 전화번호는 삭제할 수 없습니다",
          error: "Bad Request",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 400 }
      );
    }

    // 발신번호 삭제
    const { error } = await supabase
      .from("sender_numbers")
      .delete()
      .eq("user_id", userId)
      .in("id", ids);

    if (error) {
      console.error("Sender number delete error:", error);
      return NextResponse.json(
        {
          message: "발신번호 삭제 중 오류가 발생했습니다",
          error: `Database Error: ${error.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/sender-numbers",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "선택한 발신번호가 성공적으로 삭제되었습니다",
      deletedIds: ids,
    });
  } catch (error) {
    console.error("Delete sender numbers error:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/sender-numbers",
      },
      { status: 500 }
    );
  }
}
