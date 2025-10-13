/**
 * 메시지 템플릿 개별 API
 * PUT /api/messages/templates/[id] - 템플릿 수정
 * DELETE /api/messages/templates/[id] - 템플릿 삭제
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
// PUT 핸들러 - 템플릿 수정
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 2. ID 파싱
    const templateId = parseInt(params.id, 10);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "유효하지 않은 템플릿 ID입니다" },
        { status: 400 }
      );
    }

    // 3. 요청 본문 파싱
    const body = await request.json();
    const { name, content, subject, category, isPrivate } = body;

    // 4. 기존 템플릿 조회 (권한 확인)
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("message_templates")
      .select("*")
      .eq("id", templateId)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: "템플릿을 찾을 수 없거나 수정 권한이 없습니다" },
        { status: 404 }
      );
    }

    // 5. 업데이트 데이터 준비
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (subject !== undefined) updateData.subject = subject?.trim() || "";
    if (category !== undefined) updateData.category = category;
    if (isPrivate !== undefined) updateData.is_private = isPrivate;

    // 6. 템플릿 업데이트
    const { data: updatedTemplate, error: updateError } = await supabase
      .from("message_templates")
      .update(updateData)
      .eq("id", templateId)
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) {
      console.error("템플릿 수정 오류:", updateError);
      return NextResponse.json(
        { error: "템플릿 수정 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "템플릿이 성공적으로 수정되었습니다",
      template: updatedTemplate,
    });
  } catch (error) {
    console.error("템플릿 수정 예외:", error);

    return NextResponse.json(
      {
        error: "템플릿 수정 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE 핸들러 - 템플릿 삭제
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 2. ID 파싱
    const templateId = parseInt(params.id, 10);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: "유효하지 않은 템플릿 ID입니다" },
        { status: 400 }
      );
    }

    // 3. 템플릿 삭제 (user_id 조건으로 권한 확인)
    const { error } = await supabase
      .from("message_templates")
      .delete()
      .eq("id", templateId)
      .eq("user_id", userId);

    if (error) {
      console.error("템플릿 삭제 오류:", error);
      return NextResponse.json(
        { error: "템플릿 삭제 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "템플릿이 성공적으로 삭제되었습니다",
    });
  } catch (error) {
    console.error("템플릿 삭제 예외:", error);

    return NextResponse.json(
      {
        error: "템플릿 삭제 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS 핸들러 (CORS)
// ============================================================================

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
