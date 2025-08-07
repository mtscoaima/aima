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

// PUT: 발신번호 별칭 수정
export async function PUT(
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
          path: `/api/sender-numbers/${params.id}`,
        },
        { status: 401 }
      );
    }

    const { displayName } = await request.json();

    if (!displayName) {
      return NextResponse.json(
        {
          message: "발신번호명은 필수입니다",
          error: "Bad Request",
          status: 400,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}`,
        },
        { status: 400 }
      );
    }

    // 발신번호 존재 및 소유권 확인
    const { data: existingNumber } = await supabase
      .from("sender_numbers")
      .select("id, user_id")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (!existingNumber) {
      return NextResponse.json(
        {
          message: "발신번호를 찾을 수 없습니다",
          error: "Not Found",
          status: 404,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}`,
        },
        { status: 404 }
      );
    }

    // 발신번호명 업데이트
    const { data: updatedNumber, error } = await supabase
      .from("sender_numbers")
      .update({ display_name: displayName })
      .eq("id", params.id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Sender number update error:", error);
      return NextResponse.json(
        {
          message: "발신번호명 수정 중 오류가 발생했습니다",
          error: `Database Error: ${error.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "발신번호명이 성공적으로 수정되었습니다",
      senderNumber: {
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
    console.error("Update sender number error:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        timestamp: getKSTISOString(),
        path: `/api/sender-numbers/${params.id}`,
      },
      { status: 500 }
    );
  }
}

// DELETE: 개별 발신번호 삭제
export async function DELETE(
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
          path: `/api/sender-numbers/${params.id}`,
        },
        { status: 401 }
      );
    }

    // 발신번호 존재 및 소유권 확인
    const { data: numberToDelete } = await supabase
      .from("sender_numbers")
      .select("id, user_id, is_default")
      .eq("id", params.id)
      .eq("user_id", userId)
      .single();

    if (!numberToDelete) {
      return NextResponse.json(
        {
          message: "발신번호를 찾을 수 없습니다",
          error: "Not Found",
          status: 404,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}`,
        },
        { status: 404 }
      );
    }

    // 기본 발신번호는 삭제 불가
    if (numberToDelete.is_default) {
      return NextResponse.json(
        {
          message: "기본 발신번호는 삭제할 수 없습니다",
          error: "Bad Request",
          status: 400,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}`,
        },
        { status: 400 }
      );
    }

    // 발신번호 삭제
    const { error } = await supabase
      .from("sender_numbers")
      .delete()
      .eq("id", params.id)
      .eq("user_id", userId);

    if (error) {
      console.error("Sender number delete error:", error);
      return NextResponse.json(
        {
          message: "발신번호 삭제 중 오류가 발생했습니다",
          error: `Database Error: ${error.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: `/api/sender-numbers/${params.id}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "발신번호가 성공적으로 삭제되었습니다",
      deletedId: params.id,
    });
  } catch (error) {
    console.error("Delete sender number error:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        timestamp: getKSTISOString(),
        path: `/api/sender-numbers/${params.id}`,
      },
      { status: 500 }
    );
  }
}
