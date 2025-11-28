/**
 * 네이버 톡톡 템플릿 검수 취소 API
 *
 * PUT /api/messages/naver/templates/inspection-cancel
 * - 검수중(PENDING) 상태의 템플릿 검수 요청을 취소합니다.
 * - 검수 취소 후 템플릿은 REGISTERED 상태로 돌아가며, 삭제 또는 수정이 가능해집니다.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cancelNaverTemplateInspection } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PUT /api/messages/naver/templates/inspection-cancel
 * 네이버 톡톡 템플릿 검수 취소
 */
export async function PUT(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuthWithSuccess(request);
  if (!authResult.isValid || !authResult.userInfo) {
    return authResult.errorResponse;
  }

  try {
    // 요청 본문 파싱
    const body = await request.json();
    const {
      partnerKey, // 네이버 톡톡 파트너 키
      templateCode, // 템플릿 코드
      comment, // 검수 취소 사유 (선택, 최대 200자)
    } = body;

    // 필수 파라미터 확인
    if (!partnerKey) {
      return NextResponse.json(
        { error: 'partnerKey가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!templateCode) {
      return NextResponse.json(
        { error: 'templateCode가 필요합니다.' },
        { status: 400 }
      );
    }

    const userId = authResult.userInfo.userId;

    // 1. MTS API 호출 - 검수 취소
    const result = await cancelNaverTemplateInspection(partnerKey, templateCode, comment);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '검수 취소 실패',
          errorCode: result.errorCode,
        },
        { status: 400 }
      );
    }

    // 2. 로컬 DB에서 상태를 REGISTERED로 업데이트
    const { error: updateError } = await supabase
      .from('naver_talk_templates')
      .update({
        status: 'REGISTERED',
        updated_at: new Date().toISOString(),
      })
      .eq('code', templateCode)
      .eq('partner_key', partnerKey)
      .eq('user_id', userId);

    if (updateError) {
      console.error('네이버 톡톡 로컬 DB 상태 업데이트 오류:', updateError);
      // MTS API는 이미 성공했으므로 경고만 로그
      console.warn('MTS API에서는 검수 취소되었으나 로컬 DB 상태 업데이트 실패');
    }

    return NextResponse.json({
      success: true,
      message: '검수 요청이 취소되었습니다. 템플릿을 삭제하거나 수정할 수 있습니다.',
    });

  } catch (error) {
    console.error('네이버 톡톡 템플릿 검수 취소 오류:', error);
    return NextResponse.json(
      {
        error: '검수 취소 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
