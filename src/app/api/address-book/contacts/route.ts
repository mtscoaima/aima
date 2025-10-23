import { getSupabaseClient } from "@/lib/apiClient";
import { withAuth } from "@/lib/apiMiddleware";
import { successResponse, errorResponse } from "@/lib/apiResponse";

// GET: 주소록 연락처 조회 (그룹별 또는 전체)
export const GET = withAuth(async (request, userInfo) => {
  const supabase = getSupabaseClient();
  const { userId } = userInfo;

  const { searchParams } = new URL(request.url);
  const groupId = searchParams.get("groupId");
  const query = searchParams.get("query");
  const phone = searchParams.get("phone");

  let dbQuery = supabase
    .from("address_book_contacts")
    .select(`
      *,
      address_book_groups(group_name)
    `)
    .eq("user_id", userId);

  // 그룹 필터링
  if (groupId) {
    dbQuery = dbQuery.eq("group_id", parseInt(groupId));
  }

  // 전화번호로 정확한 조회
  if (phone) {
    dbQuery = dbQuery.eq("phone_number", phone);
  }
  // 검색어 필터링
  else if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,phone_number.ilike.%${query}%`);
  }

  dbQuery = dbQuery.order("created_at", { ascending: false });

  const { data: contacts, error } = await dbQuery;

  if (error) {
    console.error("주소록 연락처 조회 오류:", error);
    return errorResponse("주소록 연락처 조회 실패", 500);
  }

  // 그룹명을 평탄화하여 반환
  const formattedContacts = contacts?.map(contact => ({
    ...contact,
    group_name: contact.address_book_groups?.group_name || null
  }));

  return successResponse({ contacts: formattedContacts });
});

// POST: 주소록 연락처 추가 (단일 또는 다중)
export const POST = withAuth(async (request, userInfo) => {
  const supabase = getSupabaseClient();
  const { userId } = userInfo;

  const body = await request.json();
  const { contacts, group_id } = body;

  if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
    return errorResponse("연락처 데이터가 필요합니다", 400);
  }

  // 연락처 데이터 검증 및 변환
  try {
    const contactsToInsert = contacts.map(contact => {
      if (!contact.phone_number) {
        throw new Error("전화번호는 필수입니다");
      }

      return {
        user_id: userId,
        group_id: group_id || null,
        name: contact.name || null,
        phone_number: contact.phone_number,
        email: contact.email || null,
        memo: contact.memo || null,
        custom_data: contact.custom_data || {}
      };
    });

    const { data: newContacts, error } = await supabase
      .from("address_book_contacts")
      .insert(contactsToInsert)
      .select();

    if (error) {
      console.error("주소록 연락처 추가 오류:", error);
      return errorResponse("주소록 연락처 추가 실패", 500);
    }

    return successResponse(
      {
        contacts: newContacts,
        count: newContacts.length
      },
      201
    );
  } catch (error) {
    console.error("주소록 연락처 추가 에러:", error);
    const message = error instanceof Error ? error.message : "서버 오류";
    return errorResponse(message, 500);
  }
});

// DELETE: 주소록 연락처 삭제
export const DELETE = withAuth(async (request, userInfo) => {
  const supabase = getSupabaseClient();
  const { userId } = userInfo;

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("id");

  if (!contactId) {
    return errorResponse("연락처 ID가 필요합니다", 400);
  }

  const { error } = await supabase
    .from("address_book_contacts")
    .delete()
    .eq("id", parseInt(contactId))
    .eq("user_id", userId);

  if (error) {
    console.error("주소록 연락처 삭제 오류:", error);
    return errorResponse("주소록 연락처 삭제 실패", 500);
  }

  return successResponse({ message: "연락처가 삭제되었습니다" });
});
