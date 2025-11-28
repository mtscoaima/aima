import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { getMtsBrandTemplate } from '@/lib/mtsApi';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 자동 동기화 간격 (10분)
const AUTO_SYNC_INTERVAL = 10 * 60 * 1000;

/**
 * GET /api/messages/kakao/brand/templates
 * 카카오 브랜드 메시지 템플릿 목록 조회
 *
 * 쿼리 파라미터:
 * - senderKey: 발신 프로필 키 (필수)
 * - sync: true로 설정 시 강제 동기화
 */
export async function GET(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    const userId = authResult.userInfo.userId;

    // URL 파라미터에서 senderKey, sync 추출
    const { searchParams } = new URL(request.url);
    const senderKey = searchParams.get('senderKey');
    const forceSync = searchParams.get('sync') === 'true';

    if (!senderKey) {
      return NextResponse.json(
        { error: 'senderKey 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 브랜드 템플릿 조회
    const { data: templates, error } = await supabase
      .from('kakao_brand_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('sender_key', senderKey)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('브랜드 템플릿 조회 오류:', error);
      return NextResponse.json(
        { error: '템플릿 조회 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      );
    }

    // 자동 동기화 체크
    const shouldSync = forceSync || shouldAutoSync(templates || []);

    if (shouldSync && templates && templates.length > 0) {

      // 백그라운드에서 동기화 (Promise 반환 없이)
      syncTemplatesInBackground(supabase, templates);
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
      count: templates?.length || 0,
    });
  } catch (error) {
    console.error('브랜드 템플릿 조회 API 오류:', error);
    return NextResponse.json(
      {
        error: '템플릿 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 자동 동기화가 필요한지 확인
 */
function shouldAutoSync(templates: Array<{ synced_at: string | null }>): boolean {
  if (templates.length === 0) return false;

  // synced_at이 없거나 10분 이상 지난 경우
  const now = Date.now();
  return templates.some(template => {
    if (!template.synced_at) return true;
    const syncedTime = new Date(template.synced_at).getTime();
    return now - syncedTime > AUTO_SYNC_INTERVAL;
  });
}

/**
 * 백그라운드에서 템플릿 동기화 (비동기, 결과 반환 없음)
 */
async function syncTemplatesInBackground(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  templates: Array<{ id: string; template_code: string; status: string; [key: string]: unknown }>
) {
  try {
    for (const template of templates) {
      try {
        const result = await getMtsBrandTemplate(template.template_code);

        if (result.success && result.responseData) {
          const mtsData = result.responseData;

          await supabase
            .from('kakao_brand_templates')
            .update({
              status: mtsData.status || template.status,
              content: mtsData.content,
              chat_bubble_type: mtsData.chatBubbleType,
              buttons: mtsData.buttons,
              image_url: mtsData.imageUrl,
              image_link: mtsData.imageLink,
              // PREMIUM_VIDEO 필드
              video_url: mtsData.videoUrl,
              thumbnail_url: mtsData.thumbnailUrl,
              // COMMERCE 필드
              commerce_title: mtsData.commerceTitle,
              regular_price: mtsData.regularPrice,
              discount_price: mtsData.discountPrice,
              discount_rate: mtsData.discountRate,
              discount_fixed: mtsData.discountFixed,
              // WIDE_ITEM_LIST 필드
              items: mtsData.items,
              // CAROUSEL_COMMERCE, CAROUSEL_FEED 필드
              carousel_cards: mtsData.carouselCards,
              modified_at: mtsData.modifiedAt ? new Date(mtsData.modifiedAt as string).toISOString() : null,
              synced_at: new Date().toISOString(),
            })
            .eq('id', template.id);

        }
      } catch (err) {
        console.error(`[백그라운드 동기화] 실패: ${template.template_code}`, err);
      }
    }
  } catch (error) {
    console.error('[백그라운드 동기화] 전체 실패:', error);
  }
}

/**
 * DELETE /api/messages/kakao/brand/templates
 * 카카오 브랜드 메시지 템플릿 삭제
 *
 * 쿼리 파라미터:
 * - id: 템플릿 ID (필수)
 */
export async function DELETE(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    const userId = authResult.userInfo.userId;

    // URL 파라미터에서 id 추출
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: '템플릿 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 템플릿 존재 여부 및 권한 확인
    const { data: template, error: fetchError } = await supabase
      .from('kakao_brand_templates')
      .select('id, user_id')
      .eq('id', id.trim())
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 권한 체크 (본인 템플릿만 삭제 가능)
    if (template.user_id !== userId) {
      return NextResponse.json(
        { error: '템플릿을 삭제할 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 템플릿 삭제
    const { error: deleteError } = await supabase
      .from('kakao_brand_templates')
      .delete()
      .eq('id', id.trim())
      .eq('user_id', userId);

    if (deleteError) {
      console.error('브랜드 템플릿 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: '템플릿 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '템플릿이 삭제되었습니다',
    });
  } catch (error) {
    console.error('브랜드 템플릿 삭제 API 오류:', error);
    return NextResponse.json(
      {
        error: '템플릿 삭제 중 오류가 발생했습니다',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
