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

// GET /api/reservations/message-logs - 보낸 메시지 목록 조회
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
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const messageType = searchParams.get("messageType") || "";

    const offset = (page - 1) * limit;

    // 기본 쿼리
    let query = supabase
      .from("reservation_message_logs")
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
      .order("sent_at", { ascending: false });

    // 검색 필터
    if (search) {
      query = query.or(`to_name.ilike.%${search}%,to_number.ilike.%${search}%`);
    }

    // 상태 필터
    if (status) {
      query = query.eq("status", status);
    }

    // 메시지 타입 필터
    if (messageType) {
      query = query.eq("message_type", messageType);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error("메시지 로그 조회 오류:", error);
      return NextResponse.json(
        { error: "메시지 로그 조회에 실패했습니다", details: error.message },
        { status: 500 }
      );
    }

    // 통계 정보 조회
    const { data: stats } = await supabase
      .from("reservation_message_logs")
      .select("status, message_type")
      .eq("user_id", userId);

    const statistics = {
      total: stats?.length || 0,
      sent: stats?.filter((s) => s.status === "sent").length || 0,
      failed: stats?.filter((s) => s.status === "failed").length || 0,
      sms: stats?.filter((s) => s.message_type === "SMS").length || 0,
      lms: stats?.filter((s) => s.message_type === "LMS").length || 0,
    };

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics,
    });
  } catch (error) {
    console.error("메시지 로그 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
