import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { getMtsBrandTemplate } from '@/lib/mtsApi';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/messages/kakao/brand/templates/sync
 * 브랜드 메시지 템플릿 동기화 (MTS API로 최신 검수 상태 확인)
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    const userId = authResult.userInfo.userId;

    // 요청 본문에서 senderKey 추출
    const body = await request.json();
    const { senderKey } = body;

    if (!senderKey) {
      return NextResponse.json(
        { error: 'senderKey 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }


    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // DB에서 해당 senderKey의 모든 브랜드 템플릿 조회
    const { data: templates, error: fetchError } = await supabase
      .from('kakao_brand_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('sender_key', senderKey);

    if (fetchError) {
      console.error('[브랜드 템플릿 동기화] DB 조회 오류:', fetchError);
      return NextResponse.json(
        { error: 'DB 조회 중 오류가 발생했습니다.', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!templates || templates.length === 0) {
      return NextResponse.json({
        success: true,
        message: '동기화할 템플릿이 없습니다.',
        syncedCount: 0,
        failedCount: 0,
      });
    }


    let syncedCount = 0;
    let failedCount = 0;
    const results = [];

    // 각 템플릿에 대해 MTS API로 최신 정보 조회
    for (const template of templates) {
      try {

        const result = await getMtsBrandTemplate(template.template_code);

        if (result.success && result.responseData) {
          const mtsData = result.responseData;

          // DB 업데이트
          const { error: updateError } = await supabase
            .from('kakao_brand_templates')
            .update({
              status: mtsData.status || template.status,
              content: mtsData.content || template.content,
              chat_bubble_type: mtsData.chatBubbleType || template.chat_bubble_type,
              buttons: mtsData.buttons || template.buttons,
              image_url: mtsData.imageUrl || template.image_url,
              image_link: mtsData.imageLink || template.image_link,
              modified_at: mtsData.modifiedAt ? new Date(mtsData.modifiedAt).toISOString() : template.modified_at,
              synced_at: new Date().toISOString(),
            })
            .eq('id', template.id);

          if (updateError) {
            console.error(`[브랜드 템플릿 동기화] 업데이트 실패 (${template.template_code}):`, updateError);
            failedCount++;
            results.push({
              template_code: template.template_code,
              success: false,
              error: updateError.message,
            });
          } else {
            syncedCount++;
            results.push({
              template_code: template.template_code,
              success: true,
              status: mtsData.status,
            });
          }
        } else {
          console.error(`[브랜드 템플릿 동기화] MTS API 조회 실패 (${template.template_code}):`, result.error);
          failedCount++;
          results.push({
            template_code: template.template_code,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        console.error(`[브랜드 템플릿 동기화] 예외 발생 (${template.template_code}):`, error);
        failedCount++;
        results.push({
          template_code: template.template_code,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }


    return NextResponse.json({
      success: true,
      message: `브랜드 템플릿 동기화 완료 (성공: ${syncedCount}, 실패: ${failedCount})`,
      syncedCount,
      failedCount,
      results,
    });
  } catch (error) {
    console.error('[브랜드 템플릿 동기화] API 오류:', error);
    return NextResponse.json(
      {
        error: '브랜드 템플릿 동기화 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
