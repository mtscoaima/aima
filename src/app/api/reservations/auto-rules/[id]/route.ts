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

// GET /api/reservations/auto-rules/[id] - 자동 발송 규칙 단건 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const ruleId = id;

    // 자동 발송 규칙 조회
    const { data: rule, error } = await supabase
      .from("reservation_auto_message_rules")
      .select("*")
      .eq("id", ruleId)
      .eq("user_id", userId)
      .single();

    if (error || !rule) {
      return NextResponse.json(
        { error: "자동 발송 규칙을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("자동 발송 규칙 조회 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PUT /api/reservations/auto-rules/[id] - 자동 발송 규칙 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const ruleId = id;
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
      is_active,
    } = body;

    // 소유자 확인
    const { data: existingRule, error: fetchError } = await supabase
      .from("reservation_auto_message_rules")
      .select("*")
      .eq("id", ruleId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { error: "자동 발송 규칙을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (rule_name !== undefined) updateData.rule_name = rule_name;
    if (space_id !== undefined) updateData.space_id = space_id;
    if (template_id !== undefined) updateData.template_id = template_id;
    if (trigger_type !== undefined) updateData.trigger_type = trigger_type;
    if (time_type !== undefined) updateData.time_type = time_type;
    if (time_value !== undefined) updateData.time_value = time_value;
    if (time_direction !== undefined) updateData.time_direction = time_direction;
    if (absolute_time !== undefined) updateData.absolute_time = absolute_time;
    if (is_active !== undefined) updateData.is_active = is_active;

    // 자동 발송 규칙 업데이트
    const { data: rule, error } = await supabase
      .from("reservation_auto_message_rules")
      .update(updateData)
      .eq("id", ruleId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("자동 발송 규칙 수정 오류:", error);
      return NextResponse.json(
        { error: "자동 발송 규칙 수정에 실패했습니다", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rule });
  } catch (error) {
    console.error("자동 발송 규칙 수정 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/reservations/auto-rules/[id] - 자동 발송 규칙 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const ruleId = id;

    // 소유자 확인 후 삭제
    const { error } = await supabase
      .from("reservation_auto_message_rules")
      .delete()
      .eq("id", ruleId)
      .eq("user_id", userId);

    if (error) {
      console.error("자동 발송 규칙 삭제 오류:", error);
      return NextResponse.json(
        { error: "자동 발송 규칙 삭제에 실패했습니다", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("자동 발송 규칙 삭제 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
