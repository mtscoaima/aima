/**
 * 발송 의뢰 상세 조회 API
 * GET /api/send-requests/[id]
 *
 * Query Parameters:
 * - page: 메시지 로그 페이지 번호 (기본값: 1)
 * - limit: 메시지 로그 페이지당 건수 (기본값: 20)
 * - status: 메시지 상태 필터 (sent, failed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * JWT 토큰에서 사용자 ID 추출
 */
function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );
    return payload.userId || null;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. JWT 인증
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다' },
        { status: 401 }
      );
    }

    // 2. 발송 의뢰 조회
    const { data: sendRequest, error: requestError } = await supabase
      .from('send_requests')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (requestError || !sendRequest) {
      return NextResponse.json(
        { error: '발송 의뢰를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 3. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // 4. 해당 의뢰의 개별 메시지 로그 조회
    let logsQuery = supabase
      .from('message_logs')
      .select('*', { count: 'exact' })
      .eq('send_request_id', id)
      .order('sent_at', { ascending: false });

    if (status) {
      logsQuery = logsQuery.eq('status', status);
    }

    logsQuery = logsQuery.range(offset, offset + limit - 1);

    const { data: logs, error: logsError, count: logsCount } = await logsQuery;

    if (logsError) {
      console.error('메시지 로그 조회 오류:', logsError);
    }

    // 5. 메시지 상태별 통계
    const { data: statusStats } = await supabase
      .from('message_logs')
      .select('status')
      .eq('send_request_id', id);

    const messageStats = {
      total: statusStats?.length || 0,
      sent: statusStats?.filter(s => s.status === 'sent').length || 0,
      failed: statusStats?.filter(s => s.status === 'failed').length || 0,
    };

    return NextResponse.json({
      success: true,
      sendRequest,
      messages: {
        data: logs || [],
        pagination: {
          page,
          limit,
          total: logsCount || 0,
          totalPages: Math.ceil((logsCount || 0) / limit),
        },
        stats: messageStats,
      },
    });
  } catch (error) {
    console.error('발송 의뢰 상세 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

