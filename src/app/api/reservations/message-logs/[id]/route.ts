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

// GET /api/reservations/message-logs/[id] - 메시지 로그 상세 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 메시지 로그 조회
    const { data: log, error } = await supabase
      .from("reservation_message_logs")
      .select(
        `
        *,
        reservations (
          id,
          customer_name,
          customer_phone,
          customer_email,
          start_datetime,
          end_datetime,
          guest_count,
          total_amount,
          deposit_amount,
          special_requirements,
          spaces (
            id,
            name
          )
        ),
        reservation_message_templates (
          id,
          name,
          content
        )
      `
      )
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "메시지를 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      console.error("메시지 로그 상세 조회 오류:", error);
      return NextResponse.json(
        { error: "메시지 조회에 실패했습니다", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ log });
  } catch (error) {
    console.error("메시지 로그 상세 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
