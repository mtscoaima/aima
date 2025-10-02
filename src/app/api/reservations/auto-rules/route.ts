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

// GET /api/reservations/auto-rules - 자동 발송 규칙 목록 조회
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 자동 발송 규칙 조회 (공간, 템플릿 정보 포함)
    const { data: rules, error } = await supabase
      .from("reservation_auto_message_rules")
      .select(
        `
        *,
        spaces (
          id,
          name
        ),
        reservation_message_templates (
          id,
          name
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("자동 발송 규칙 조회 오류:", error);
      return NextResponse.json(
        { error: "자동 발송 규칙 조회에 실패했습니다", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rules: rules || [] });
  } catch (error) {
    console.error("자동 발송 규칙 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/reservations/auto-rules - 자동 발송 규칙 생성
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      rule_name,
      space_id,
      template_id,
      trigger_type,
      time_type,
      time_value,
      time_direction,
      absolute_time,
    } = body;

    // 필수 필드 검증
    if (!rule_name || !space_id || !template_id || !trigger_type || !time_type) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다" },
        { status: 400 }
      );
    }

    // 시간 설정 검증
    if (time_type === "relative") {
      if (!time_value || !time_direction) {
        return NextResponse.json(
          { error: "상대적 시점에는 time_value와 time_direction이 필요합니다" },
          { status: 400 }
        );
      }
    } else if (time_type === "absolute") {
      if (!absolute_time) {
        return NextResponse.json(
          { error: "절대적 시점에는 absolute_time이 필요합니다" },
          { status: 400 }
        );
      }
    }

    // 자동 발송 규칙 생성
    const { data: rule, error } = await supabase
      .from("reservation_auto_message_rules")
      .insert({
        user_id: userId,
        rule_name,
        space_id,
        template_id,
        trigger_type,
        time_type,
        time_value: time_value || null,
        time_direction: time_direction || null,
        absolute_time: absolute_time || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("자동 발송 규칙 생성 오류:", error);
      return NextResponse.json(
        { error: "자동 발송 규칙 생성에 실패했습니다", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("자동 발송 규칙 생성 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
