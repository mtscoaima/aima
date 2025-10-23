/**
 * SMS 메시지 템플릿 API
 * GET /api/sms-templates - 템플릿 목록 조회
 * POST /api/sms-templates - 템플릿 저장
 */

import { getSupabaseClient } from "@/lib/apiClient";
import { withAuth } from "@/lib/apiMiddleware";
import { successResponse, errorResponse, corsOptionsResponse } from "@/lib/apiResponse";

// ============================================================================
// GET 핸들러 - 템플릿 목록 조회
// ============================================================================

export const GET = withAuth(async (request, userInfo) => {
  const supabase = getSupabaseClient();
  const { userId } = userInfo;

  // 쿼리 파라미터
  const { searchParams } = new URL(request.url);
  const isPrivate = searchParams.get("isPrivate");

  // 템플릿 조회
  let query = supabase
    .from("sms_message_templates")
    .select("*")
    .order("created_at", { ascending: false });

  // 공개 템플릿 또는 본인 템플릿만 조회
  if (isPrivate === "true") {
    query = query.eq("user_id", userId).eq("is_private", true);
  } else if (isPrivate === "false") {
    query = query.eq("is_private", false);
  } else {
    // 기본: 본인의 private 템플릿 + 모든 public 템플릿
    query = query.or(`user_id.eq.${userId},is_private.eq.false`);
  }

  const { data: templates, error } = await query;

  if (error) {
    console.error("템플릿 조회 오류:", error);
    return errorResponse("템플릿 조회 중 오류가 발생했습니다", 500);
  }

  return successResponse({
    count: templates?.length || 0,
    templates: templates || [],
  });
});

// ============================================================================
// POST 핸들러 - 템플릿 저장
// ============================================================================

export const POST = withAuth(async (request, userInfo) => {
  const supabase = getSupabaseClient();
  const { userId } = userInfo;

  // 요청 본문 파싱
  const body = await request.json();
  const { name, content, subject, isPrivate = true } = body;

  // 유효성 검증
  if (!name || !name.trim()) {
    return errorResponse("템플릿 이름이 필요합니다", 400);
  }

  if (!content || !content.trim()) {
    return errorResponse("템플릿 내용이 필요합니다", 400);
  }

  // 템플릿 저장
  const { data: template, error } = await supabase
    .from("sms_message_templates")
    .insert({
      user_id: userId,
      name: name.trim(),
      content: content.trim(),
      subject: subject?.trim() || "",
      is_private: isPrivate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("템플릿 저장 오류:", error);
    return errorResponse("템플릿 저장 중 오류가 발생했습니다", 500);
  }

  return successResponse(
    {
      message: "템플릿이 성공적으로 저장되었습니다",
      template,
    },
    201
  );
});

// ============================================================================
// DELETE 핸들러 - 템플릿 삭제
// ============================================================================

export const DELETE = withAuth(async (request, userInfo) => {
  const supabase = getSupabaseClient();
  const { userId } = userInfo;

  // URL에서 템플릿 ID 추출
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return errorResponse("템플릿 ID가 필요합니다", 400);
  }

  // 템플릿 삭제 (본인 것만)
  const { error } = await supabase
    .from("sms_message_templates")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("템플릿 삭제 오류:", error);
    return errorResponse("템플릿 삭제 중 오류가 발생했습니다", 500);
  }

  return successResponse({
    message: "템플릿이 성공적으로 삭제되었습니다",
  });
});

// ============================================================================
// OPTIONS 핸들러 (CORS)
// ============================================================================

export function OPTIONS() {
  return corsOptionsResponse("GET, POST, DELETE, OPTIONS");
}
