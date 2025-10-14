/**
 * 예약 메시지 관리 API
 * GET /api/messages/scheduled - 예약 메시지 목록 조회
 * DELETE /api/messages/scheduled?id=123 - 예약 메시지 취소
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getScheduledMessages,
  cancelScheduledMessage,
} from "@/lib/messageSender";

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
// GET 핸들러 - 예약 메시지 목록 조회
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

    // 2. 예약 메시지 조회
    const messages = await getScheduledMessages(userId);

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error("예약 메시지 조회 오류:", error);

    return NextResponse.json(
      {
        error: "예약 메시지 조회 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE 핸들러 - 예약 메시지 취소
// ============================================================================

export async function DELETE(request: NextRequest) {
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

    // 2. 쿼리 파라미터에서 ID 가져오기
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");

    if (!idParam) {
      return NextResponse.json(
        { error: "예약 메시지 ID가 필요합니다" },
        { status: 400 }
      );
    }

    const messageId = parseInt(idParam, 10);
    if (isNaN(messageId)) {
      return NextResponse.json(
        { error: "유효하지 않은 ID입니다" },
        { status: 400 }
      );
    }

    // 3. 예약 메시지 취소
    const result = await cancelScheduledMessage(messageId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "취소 실패" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "예약 메시지가 취소되었습니다",
    });
  } catch (error) {
    console.error("예약 메시지 취소 오류:", error);

    return NextResponse.json(
      {
        error: "예약 메시지 취소 중 오류가 발생했습니다",
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
      "Access-Control-Allow-Methods": "GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
