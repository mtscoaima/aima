/**
 * 메시지 발송 로그 API
 * GET /api/message-logs - 최근 발송 내역 조회
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// JWT 인증
// ============================================================================

function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return payload.userId || null;
  } catch {
    return null;
  }
}

// ============================================================================
// GET 핸들러 - 최근 발송 내역 조회
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. JWT 인증
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      );
    }

    // 2. 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    // 3. 발송 내역 조회 (최근 순, 성공한 것만)
    const { data: logs, error, count } = await supabase
      .from("message_logs")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "sent")
      .order("sent_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("발송 내역 조회 오류:", error);
      return NextResponse.json(
        { error: "발송 내역 조회 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: count || 0,
      logs: logs || [],
    });
  } catch (error) {
    console.error("발송 내역 조회 예외:", error);

    return NextResponse.json(
      {
        error: "발송 내역 조회 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS 핸들러 (CORS)
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
