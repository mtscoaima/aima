import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 자동 동기화 간격 (밀리초) - 10분
const AUTO_SYNC_INTERVAL = 10 * 60 * 1000;

/**
 * 카카오 알림톡 템플릿 목록 조회 API (DB 기반)
 * GET /api/kakao/templates
 *
 * 쿼리 파라미터:
 * - senderKey: 발신 프로필 키 (필수)
 * - templateCode: 템플릿 코드 (선택, 있으면 특정 템플릿만 조회)
 * - sync: 강제 동기화 여부 (true/false, 기본: false)
 *
 * 동작:
 * 1. DB에서 템플릿 목록 조회
 * 2. 마지막 동기화 후 10분 경과 시 백그라운드 동기화 실행
 * 3. 즉시 DB 데이터 반환 (동기화 대기 안 함)
 */
export async function GET(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse || NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = authResult.userInfo.userId;

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const senderKey = searchParams.get('senderKey');
    const templateCode = searchParams.get('templateCode');
    const forceSync = searchParams.get('sync') === 'true';

    // senderKey 필수 확인
    if (!senderKey) {
      return NextResponse.json(
        { error: '발신 프로필 키가 필요합니다.' },
        { status: 400 }
      );
    }

    // 발신프로필 소유권 확인
    const { data: profile, error: profileError } = await supabase
      .from('kakao_sender_profiles')
      .select('*')
      .eq('sender_key', senderKey)
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: '해당 발신 프로필을 찾을 수 없거나 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // DB에서 템플릿 조회
    let query = supabase
      .from('kakao_alimtalk_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('sender_key', senderKey)
      .order('created_at', { ascending: false });

    // 특정 템플릿 코드로 필터링
    if (templateCode) {
      query = query.eq('template_code', templateCode);
    }

    const { data: templates, error: templatesError } = await query;

    if (templatesError) {
      console.error('템플릿 조회 오류:', templatesError);
      return NextResponse.json(
        { error: 'DB 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 자동 동기화 체크
    let needsSync = forceSync;
    if (!needsSync && templates && templates.length > 0) {
      // 가장 최근 동기화 시간 확인
      const mostRecentSync = templates.reduce((latest, template) => {
        if (!template.synced_at) return latest;
        const syncTime = new Date(template.synced_at).getTime();
        return syncTime > latest ? syncTime : latest;
      }, 0);

      const now = Date.now();
      const timeSinceLastSync = now - mostRecentSync;

      // 10분 이상 경과 시 동기화 필요
      if (timeSinceLastSync > AUTO_SYNC_INTERVAL) {
        needsSync = true;
      }
    }

    // 동기화 처리
    if (needsSync) {
      if (forceSync) {
        // 사용자가 명시적으로 요청 시: 동기화 완료 대기
        try {
          const syncResponse = await fetch(`${request.nextUrl.origin}/api/kakao/templates/sync?senderKey=${senderKey}`, {
            method: 'POST',
            headers: {
              'Authorization': request.headers.get('Authorization') || '',
            },
          });

          if (syncResponse.ok) {
            // 동기화 완료 후 DB 재조회
            const { data: updatedTemplates } = await supabase
              .from('kakao_alimtalk_templates')
              .select('*')
              .eq('user_id', userId)
              .eq('sender_key', senderKey)
              .order('created_at', { ascending: false });

            return NextResponse.json({
              success: true,
              data: {
                list: updatedTemplates || [],
              },
              count: updatedTemplates?.length || 0,
              syncCompleted: true,
            });
          }
        } catch (error) {
          console.error('동기화 오류:', error);
          // 동기화 실패해도 DB 데이터는 반환
        }
      } else {
        // 일반 조회: 백그라운드 동기화 (현행 유지)
        fetch(`${request.nextUrl.origin}/api/kakao/templates/sync?senderKey=${senderKey}`, {
          method: 'POST',
          headers: {
            'Authorization': request.headers.get('Authorization') || '',
          },
        }).catch((error) => {
          console.error('백그라운드 동기화 오류:', error);
        });
      }
    }

    // DB 데이터 즉시 반환 (forceSync=false인 경우)
    return NextResponse.json({
      success: true,
      data: {
        list: templates || [],
      },
      count: templates?.length || 0,
      syncTriggered: needsSync && !forceSync,
    });
  } catch (error) {
    console.error('템플릿 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
