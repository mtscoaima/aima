/**
 * 메시지 템플릿 API (SMS + 친구톡)
 * GET /api/sms-templates - 템플릿 목록 조회 (?messageType=SMS|FRIENDTALK)
 * POST /api/sms-templates - 템플릿 저장 (messageType, buttons, imageUrl, imageLink 지원)
 * DELETE /api/sms-templates - 템플릿 삭제
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
  const messageType = searchParams.get("messageType") || "SMS"; // 추가: 메시지 타입 필터

  // 템플릿 조회
  let query = supabase
    .from("sms_message_templates")
    .select("*")
    .eq("message_type", messageType) // 추가: 메시지 타입 필터
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
  const {
    name,
    content,
    subject,
    isPrivate = true,
    messageType = 'SMS', // 추가
    buttons, // 추가
    imageUrl, // 추가
    imageLink, // 추가
    // FW/FL/FC 타입 전용 필드 (2025-11-13 추가)
    friendtalkMessageType, // 'FT' | 'FI' | 'FW' | 'FL' | 'FC'
    headerText, // FL 헤더
    listItems, // FL 아이템 배열
    carousels, // FC 캐러셀 배열
    moreLink // FC 더보기 링크
  } = body;

  // 유효성 검증
  if (!name || !name.trim()) {
    return errorResponse("템플릿 이름이 필요합니다", 400);
  }

  // FL/FC 타입은 content가 비어있어도 metadata에 listItems/carousels가 있으면 허용
  const isFLorFC = friendtalkMessageType === 'FL' || friendtalkMessageType === 'FC';
  const hasListItems = listItems && Array.isArray(listItems) && listItems.length > 0;
  const hasCarousels = carousels && Array.isArray(carousels) && carousels.length > 0;

  if (!isFLorFC && (!content || !content.trim())) {
    return errorResponse("템플릿 내용이 필요합니다", 400);
  }

  if (isFLorFC && !hasListItems && !hasCarousels && (!headerText || !headerText.trim())) {
    return errorResponse("FL/FC 타입은 헤더, 아이템 또는 캐러셀이 필요합니다", 400);
  }

  // metadata 구성 (FW/FL/FC 필드 포함)
  const metadata: Record<string, unknown> = {};

  // FW/FL/FC 타입 전용 필드가 있으면 metadata에 추가
  if (friendtalkMessageType) metadata.friendtalkMessageType = friendtalkMessageType;
  if (headerText) metadata.headerText = headerText;
  if (listItems) metadata.listItems = listItems;
  if (carousels) metadata.carousels = carousels;
  if (moreLink) metadata.moreLink = moreLink;

  // 템플릿 저장
  const { data: template, error } = await supabase
    .from("sms_message_templates")
    .insert({
      user_id: userId,
      name: name.trim(),
      content: content.trim(),
      subject: subject?.trim() || "",
      is_private: isPrivate,
      message_type: messageType, // 추가
      buttons: buttons || null, // 추가
      image_url: imageUrl || null, // 추가
      image_link: imageLink || null, // 추가
      metadata: Object.keys(metadata).length > 0 ? metadata : null, // FW/FL/FC 필드 저장
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
