import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { createClient } from '@supabase/supabase-js';
import { getMtsAlimtalkTemplate } from '@/lib/mtsApi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 카카오 알림톡 템플릿 동기화 API
 * POST /api/kakao/templates/sync
 *
 * Query Parameters:
 * - senderKey: 발신 프로필 키 (필수)
 *
 * 설명:
 * - DB에 저장된 템플릿들의 최신 상태를 MTS API로 조회하여 동기화
 * - status 등 변경사항 반영
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

    // 각 템플릿에 대해 MTS API 조회 및 업데이트
    const syncResults = [];
    let syncedCount = 0;
    let failedCount = 0;

    for (const template of templates) {
      try {
        // MTS API로 최신 정보 조회
        const result = await getMtsAlimtalkTemplate(
          senderKey,
          template.template_code,
          'S'
        );

        if (result.success && result.responseData) {
          const mtsData = result.responseData as Record<string, unknown>;

          // DB 업데이트
          const { error: updateError } = await supabase
            .from('kakao_alimtalk_templates')
            .update({
              template_name: (mtsData.templateName as string) || template.template_name,
              template_content: (mtsData.templateContent as string) || template.template_content,
              template_message_type: (mtsData.templateMessageType as string) || template.template_message_type,
              template_emphasize_type: (mtsData.templateEmphasizeType as string) || template.template_emphasize_type,
              status: (mtsData.status as string) || template.status,
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
              inspectionStatus: mtsData.inspectionStatus,
              status: mtsData.status,
            });
          }
        } else {
          // MTS API 조회 실패 (템플릿이 삭제되었을 수 있음)
          failedCount++;
          syncResults.push({
            templateCode: template.template_code,
            success: false,
            error: result.error || 'MTS API 조회 실패',
            errorCode: result.errorCode,
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
