/**
 * 네이버 톡톡 템플릿 삭제 API
 *
 * DELETE /api/messages/naver/templates/delete
 * - MTS API에서 템플릿 삭제 + 로컬 DB에서도 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { deleteNaverTalkTemplate } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * DELETE /api/messages/naver/templates/delete
 * 네이버 톡톡 템플릿 삭제
 */
export async function DELETE(request: NextRequest) {
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

    // 1. MTS API에서 템플릿 삭제
    const result = await deleteNaverTalkTemplate(partnerKey, templateCode);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '템플릿 삭제 실패',
          errorCode: result.errorCode,
        },
        { status: 400 }
      );
    }

    // 2. 로컬 DB에서도 템플릿 삭제
    const { error: deleteError } = await supabase
      .from('naver_talk_templates')
      .delete()
      .eq('code', templateCode)
      .eq('partner_key', partnerKey)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('네이버 톡톡 로컬 DB 삭제 오류:', deleteError);
      // MTS API는 이미 삭제되었으므로 경고만 로그
      console.warn('MTS API에서는 삭제되었으나 로컬 DB 삭제 실패');
    }

    return NextResponse.json({
      success: true,
      message: '템플릿이 성공적으로 삭제되었습니다.',
    });

  } catch (error) {
    console.error('네이버 톡톡 템플릿 삭제 오류:', error);
    return NextResponse.json(
      {
        error: '템플릿 삭제 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
