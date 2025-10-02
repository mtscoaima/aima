import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET!;

interface JWTPayload {
  userId: number;
  email: string;
}

// JWT 토큰에서 userId 추출
function getUserIdFromToken(request: NextRequest): number | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("Authorization 헤더 없음");
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded.userId;
  } catch (error) {
    console.error("JWT 검증 실패:", error);
    return null;
  }
}

// GET /api/reservations/scheduled-messages - 발송 예정 메시지 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "scheduled_at";

    const offset = (page - 1) * limit;

    // 기본 쿼리
    let query = supabase
      .from("reservation_scheduled_messages")
      .select(
        `
        *,
        reservations (
          id,
          customer_name,
          customer_phone,
          start_datetime,
          end_datetime,
          spaces (
            id,
            name
          )
        ),
        reservation_message_templates (
          id,
          name
        )
      `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .eq("status", "pending");

    // 정렬
    if (sortBy === "scheduled_at") {
      query = query.order("scheduled_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: messages, error, count } = await query;

    if (error) {
      console.error("예약 메시지 조회 오류:", error);
      return NextResponse.json(
        { error: "예약 메시지 조회에 실패했습니다", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages: messages || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("예약 메시지 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/reservations/scheduled-messages?id=123 - 예약 메시지 취소
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const messageId = searchParams.get("id");

    if (!messageId) {
      return NextResponse.json(
        { error: "메시지 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // 소유자 확인 후 삭제
    const { error } = await supabase
      .from("reservation_scheduled_messages")
      .delete()
      .eq("id", messageId)
      .eq("user_id", userId)
      .eq("status", "pending");

    if (error) {
      console.error("예약 메시지 삭제 오류:", error);
      return NextResponse.json(
        { error: "예약 메시지 삭제에 실패했습니다", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("예약 메시지 삭제 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
