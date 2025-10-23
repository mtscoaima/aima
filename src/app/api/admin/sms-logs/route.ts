import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAuthAndAdminWithSuccess } from "@/utils/authUtils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 발송 로그 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = validateAuthAndAdminWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const eventType = searchParams.get('event_type');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    const offset = (page - 1) * limit;

    // 쿼리 빌더
    let query = supabase
      .from('sms_notification_logs')
      .select('*', { count: 'exact' });

    // 필터링
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    // 페이지네이션 및 정렬
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: logs, error, count } = await query;

    if (error) {
      console.error('로그 조회 오류:', error);
      return NextResponse.json(
        { success: false, message: '로그 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logs: logs || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('로그 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
