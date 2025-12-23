/**
 * 발송 의뢰 목록 조회 API
 * GET /api/send-requests
 *
 * Query Parameters:
 * - page: 페이지 번호 (기본값: 1)
 * - limit: 페이지당 건수 (기본값: 10)
 * - channelType: 채널 타입 필터 (SMS, LMS, MMS, KAKAO_ALIMTALK, KAKAO_BRAND, NAVER_TALK)
 * - status: 상태 필터 (pending, processing, completed)
 * - startDate: 시작일 (ISO 8601)
 * - endDate: 종료일 (ISO 8601)
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

export async function GET(request: NextRequest) {
  try {
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

    // 2. 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const channelType = searchParams.get('channelType');
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const offset = (page - 1) * limit;

    // 3. 쿼리 빌드
    let query = supabase
      .from('send_requests')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 채널 타입 필터
    if (channelType) {
      query = query.eq('channel_type', channelType);
    }

    // 상태 필터
    if (status) {
      query = query.eq('status', status);
    }

    // 날짜 범위 필터
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // 페이지네이션
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('발송 의뢰 목록 조회 오류:', error);
      return NextResponse.json(
        { error: '발송 의뢰 목록 조회에 실패했습니다' },
        { status: 500 }
      );
    }

    // 4. 통계 정보 조회 (전체 현황)
    const { data: statsData } = await supabase
      .from('send_requests')
      .select('status, channel_type, success_count, fail_count')
      .eq('user_id', userId);

    const stats = {
      total: statsData?.length || 0,
      totalSuccess: statsData?.reduce((sum, r) => sum + (r.success_count || 0), 0) || 0,
      totalFail: statsData?.reduce((sum, r) => sum + (r.fail_count || 0), 0) || 0,
      byChannel: {} as Record<string, number>,
    };

    // 채널별 집계
    statsData?.forEach(r => {
      stats.byChannel[r.channel_type] = (stats.byChannel[r.channel_type] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('발송 의뢰 목록 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

