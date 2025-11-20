import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 카카오 알림톡 템플릿 동기화 API (Bulk 최적화)
 * POST /api/kakao/templates/sync
 *
 * Query Parameters:
 * - senderKey: 발신 프로필 키 (필수)
 *
 * 설명:
 * - DB에 저장된 템플릿들의 최신 상태를 MTS API Bulk 엔드포인트로 조회하여 동기화
 * - 1회 API 호출로 모든 템플릿 조회 (이전: N번 호출)
 * - status, inspection_status 등 변경사항 반영
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse || NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userId = authResult.userInfo.userId;

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const senderKey = searchParams.get('senderKey');

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

    // DB에서 해당 sender_key의 모든 템플릿 조회
    const { data: templates, error: templatesError } = await supabase
      .from('kakao_alimtalk_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('sender_key', senderKey);

    if (templatesError) {
      console.error('템플릿 조회 오류:', templatesError);
      return NextResponse.json(
        { error: 'DB 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json({
        success: true,
        message: '동기화할 템플릿이 없습니다.',
        syncedCount: 0,
        failedCount: 0,
        templates: [],
      });
    }

    // MTS API Bulk 조회로 변경 (최적화)
    const syncResults = [];
    let syncedCount = 0;
    let failedCount = 0;

    try {
      // Bulk API로 모든 템플릿 조회 (1회 호출)
      const { getMtsAlimtalkTemplates } = await import('@/lib/mtsApi');
      const bulkResult = await getMtsAlimtalkTemplates(senderKey, 1, 1000);

      if (!bulkResult.success || !bulkResult.responseData) {
        return NextResponse.json({
          success: false,
          error: bulkResult.error || 'MTS API Bulk 조회 실패',
          errorCode: bulkResult.errorCode,
          syncedCount: 0,
          failedCount: templates.length,
        });
      }

      // MTS API 응답에서 template_list 추출
      const mtsResponse = bulkResult.responseData as Record<string, unknown>;
      const mtsTemplates = (mtsResponse.template_list as Array<Record<string, unknown>>) || [];

      if (mtsTemplates.length === 0) {
        return NextResponse.json({
          success: true,
          message: 'MTS에 등록된 템플릿이 없습니다.',
          syncedCount: 0,
          failedCount: 0,
          totalCount: 0,
        });
      }

      // 템플릿 코드로 매핑 (빠른 조회)
      const mtsTemplateMap = new Map<string, Record<string, unknown>>();
      for (const mtsTemplate of mtsTemplates) {
        const code = mtsTemplate.code as string;
        if (code) {
          mtsTemplateMap.set(code, mtsTemplate);
        }
      }

      // DB 템플릿과 MTS 템플릿 매칭 및 업데이트
      for (const template of templates) {
        const mtsData = mtsTemplateMap.get(template.template_code);

        if (!mtsData) {
          // MTS에 없는 템플릿 (삭제됨)
          failedCount++;
          syncResults.push({
            templateCode: template.template_code,
            success: false,
            error: 'MTS에 템플릿이 존재하지 않습니다 (삭제되었을 수 있음)',
          });
          continue;
        }

        try {
          // DB 업데이트
          const { error: updateError } = await supabase
            .from('kakao_alimtalk_templates')
            .update({
              template_name: (mtsData.name as string) || template.template_name,
              template_content: (mtsData.text as string) || template.template_content,
              template_message_type: (mtsData.templateMessageType as string) || template.template_message_type,
              template_emphasize_type: (mtsData.templateEmphasizeType as string) || template.template_emphasize_type,
              status: (mtsData.status as string) || template.status,
              inspection_status: (mtsData.templateStatusType as string) || template.inspection_status,
              buttons: mtsData.buttons ? (mtsData.buttons as object) : template.buttons,
              quick_replies: mtsData.quickReplies ? (mtsData.quickReplies as object) : template.quick_replies,
              category_code: (mtsData.categoryCode as string) || template.category_code,
              comments: mtsData.comments ? (mtsData.comments as object) : template.comments,
              synced_at: new Date().toISOString(),
            })
            .eq('id', template.id);

          if (updateError) {
            console.error(`템플릿 ${template.template_code} 업데이트 오류:`, updateError);
            failedCount++;
            syncResults.push({
              templateCode: template.template_code,
              success: false,
              error: 'DB 업데이트 실패',
            });
          } else {
            syncedCount++;
            syncResults.push({
              templateCode: template.template_code,
              success: true,
              inspectionStatus: mtsData.templateStatusType,
              status: mtsData.status,
            });
          }
        } catch (error) {
          console.error(`템플릿 ${template.template_code} 동기화 오류:`, error);
          failedCount++;
          syncResults.push({
            templateCode: template.template_code,
            success: false,
            error: error instanceof Error ? error.message : '알 수 없는 오류',
          });
        }
      }
    } catch (error) {
      console.error('Bulk 동기화 오류:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Bulk 동기화 중 오류 발생',
        syncedCount: 0,
        failedCount: templates.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: `동기화 완료: ${syncedCount}개 성공, ${failedCount}개 실패`,
      syncedCount,
      failedCount,
      totalCount: templates.length,
      results: syncResults,
    });
  } catch (error) {
    console.error('템플릿 동기화 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
