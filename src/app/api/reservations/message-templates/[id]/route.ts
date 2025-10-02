import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET!;

// JWT 토큰에서 userId 추출
function getUserIdFromToken(request: NextRequest): number | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch (error) {
    console.error("JWT 검증 실패:", error);
    return null;
  }
}

/**
 * GET /api/reservations/message-templates/[id]
 * 특정 템플릿 조회
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const templateId = parseInt(id);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "유효하지 않은 템플릿 ID입니다" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("reservation_message_templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error("템플릿 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/reservations/message-templates/[id]
 * 템플릿 수정
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const templateId = parseInt(id);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "유효하지 않은 템플릿 ID입니다" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, content, category, is_active } = body;

    // 템플릿 소유권 확인
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("reservation_message_templates")
      .select("id")
      .eq("id", templateId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없거나 권한이 없습니다" },
        { status: 404 }
      );
    }

    // 유효성 검증
    if (name && name.length > 100) {
      return NextResponse.json(
        { error: "템플릿 이름은 100자를 초과할 수 없습니다" },
        { status: 400 }
      );
    }

    if (content && content.length > 2000) {
      return NextResponse.json(
        { error: "템플릿 내용은 2000자를 초과할 수 없습니다" },
        { status: 400 }
      );
    }

    // 업데이트할 필드만 추출
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (content !== undefined) updates.content = content;
    if (category !== undefined) updates.category = category;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabase
      .from("reservation_message_templates")
      .update(updates)
      .eq("id", templateId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("템플릿 수정 오류:", error);
      return NextResponse.json(
        { error: "템플릿 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "템플릿이 수정되었습니다",
      template: data,
    });
  } catch (error) {
    console.error("템플릿 수정 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reservations/message-templates/[id]
 * 템플릿 삭제
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const templateId = parseInt(id);

    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "유효하지 않은 템플릿 ID입니다" },
        { status: 400 }
      );
    }

    // 템플릿 삭제
    const { error } = await supabase
      .from("reservation_message_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", userId);

    if (error) {
      console.error("템플릿 삭제 오류:", error);
      return NextResponse.json(
        { error: "템플릿 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "템플릿이 삭제되었습니다",
    });
  } catch (error) {
    console.error("템플릿 삭제 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
