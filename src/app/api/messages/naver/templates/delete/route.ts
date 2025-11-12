/**
 * 네이버 톡톡 템플릿 삭제 API
 *
 * DELETE /api/messages/naver/templates/delete
 * - 네이버 톡톡 템플릿 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { deleteNaverTalkTemplate } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

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

    // MTS API 호출
    const result = await deleteNaverTalkTemplate(partnerKey, templateCode);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '템플릿이 성공적으로 삭제되었습니다.',
      });
    }

    return NextResponse.json(
      {
        error: result.error || '템플릿 삭제 실패',
        errorCode: result.errorCode,
      },
      { status: 400 }
    );

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
