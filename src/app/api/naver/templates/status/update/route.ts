import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { getNaverTalkTemplate } from '@/lib/mtsApi';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/naver/templates/status/update
 * 네이버 톡톡 템플릿 상태 업데이트 (검수중 템플릿만)
 *
 * Request Body:
 * {
 *   // 빈 body 또는 partnerKey 배열 (선택)
 *   partnerKeys?: string[]
 * }
 *
 * Response:
 * {
 *   success: true,
 *   updatedCount: number,
 *   errorCount: number,
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuthWithSuccess(request);
  if (!authResult.isValid || !authResult.userInfo) {
    return authResult.errorResponse || NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const { userId } = authResult.userInfo;

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 요청 body 파싱 (선택사항)
    let body: { partnerKeys?: string[] } = {};
    try {
      body = await request.json();
    } catch {
      // body 없으면 모든 템플릿 조회
    }

    // DB에서 검수중(PENDING) 상태인 템플릿 조회
    let query = supabase
      .from('naver_talk_templates')
      .select('id, partner_key, code, status')
      .eq('user_id', userId)
      .in('status', ['PENDING', 'REGISTERED']); // 검수중 + 등록됨 상태

    // 특정 파트너키만 업데이트하는 경우
    if (body.partnerKeys && body.partnerKeys.length > 0) {
      query = query.in('partner_key', body.partnerKeys);
    }

    const { data: pendingTemplates, error: fetchError } = await query;

    if (fetchError) {
      console.error('[네이버 톡톡] 검수중 템플릿 조회 오류:', fetchError);
      return NextResponse.json(
        { error: '템플릿 조회 실패', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!pendingTemplates || pendingTemplates.length === 0) {
      return NextResponse.json({
        success: true,
        updatedCount: 0,
        errorCount: 0,
        message: '업데이트할 템플릿이 없습니다.',
      });
    }

    // 각 템플릿의 상태를 MTS API에서 조회하여 업데이트
    let updatedCount = 0;
    let errorCount = 0;

    for (const template of pendingTemplates) {
      try {
        // MTS API에서 템플릿 상태 조회
        const result = await getNaverTalkTemplate(
          template.partner_key,
          template.code
        );

        if (!result.success || !result.responseData) {
          console.error(
            `[네이버 톡톡] 템플릿 조회 실패 (code: ${template.code}):`,
            result.error
          );
          errorCount++;
          continue;
        }

        const mtsTemplate = result.responseData as Record<string, unknown>;
        const newStatus = mtsTemplate.templateStatusType as string;

        // DB 상태와 MTS 상태가 다르면 업데이트
        if (newStatus && newStatus !== template.status) {
          const { error: updateError } = await supabase
            .from('naver_talk_templates')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', template.id);

          if (updateError) {
            console.error(
              `[네이버 톡톡] 템플릿 상태 업데이트 실패 (id: ${template.id}):`,
              updateError
            );
            errorCount++;
          } else {
            console.log(
              `[네이버 톡톡] 템플릿 상태 업데이트: ${template.code} (${template.status} → ${newStatus})`
            );
            updatedCount++;
          }
        }
      } catch (err) {
        console.error(
          `[네이버 톡톡] 템플릿 상태 업데이트 중 예외 (code: ${template.code}):`,
          err
        );
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      errorCount,
      totalChecked: pendingTemplates.length,
      message: `${updatedCount}개의 템플릿 상태가 업데이트되었습니다.${errorCount > 0 ? ` (실패: ${errorCount}개)` : ''}`,
    });
  } catch (error) {
    console.error('[네이버 톡톡] 템플릿 상태 업데이트 API 오류:', error);
    return NextResponse.json(
      {
        error: '템플릿 상태 업데이트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
