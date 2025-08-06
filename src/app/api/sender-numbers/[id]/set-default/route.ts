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

// PATCH: 기본 발신번호 변경
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await verifyTokenAndGetUserId(request);
    if (!userId) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}/set-default`,
        },
        { status: 401 }
      );
    }

    // 발신번호 존재 및 소유권 확인
    const { data: numberToSetDefault } = await supabase
      .from("sender_numbers")
      .select("id, user_id, phone_number, display_name, is_default")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (!numberToSetDefault) {
      return NextResponse.json(
        {
          message: "발신번호를 찾을 수 없습니다",
          error: "Not Found",
          status: 404,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}/set-default`,
        },
        { status: 404 }
      );
    }

    // 이미 기본번호인 경우
    if (numberToSetDefault.is_default) {
      return NextResponse.json(
        {
          message: "이미 기본 발신번호입니다",
          error: "Bad Request",
          status: 400,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}/set-default`,
        },
        { status: 400 }
      );
    }

    // 트랜잭션으로 기본번호 변경
    // 1. 기존 기본번호 해제
    const { error: resetError } = await supabase
      .from("sender_numbers")
      .update({ is_default: false })
      .eq("user_id", userId)
      .eq("is_default", true);

    if (resetError) {
      console.error("Reset default number error:", resetError);
      return NextResponse.json(
        {
          message: "기본번호 변경 중 오류가 발생했습니다",
          error: `Database Error: ${resetError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}/set-default`,
        },
        { status: 500 }
      );
    }

    // 2. 새로운 기본번호 설정
    const { data: updatedNumber, error: setError } = await supabase
      .from("sender_numbers")
      .update({ is_default: true })
      .eq("id", params.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (setError) {
      console.error("Set default number error:", setError);
      return NextResponse.json(
        {
          message: "기본번호 설정 중 오류가 발생했습니다",
          error: `Database Error: ${setError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}/set-default`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "기본 발신번호가 성공적으로 변경되었습니다",
      defaultNumber: {
        id: updatedNumber.id,
        number: updatedNumber.phone_number,
        name: updatedNumber.display_name,
        registrationDate: new Date(updatedNumber.created_at)
          .toISOString()
          .slice(2, 10)
          .replace(/-/g, "-"),
        status: "정상",
        isDefault: updatedNumber.is_default,
        isVerified: updatedNumber.is_verified,
      },
    });
  } catch (error) {
    console.error("Set default sender number error:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        timestamp: getKSTISOString(),
        path: `/api/sender-numbers/${params.id}/set-default`,
      },
      { status: 500 }
    );
  }
}
