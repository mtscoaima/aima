/**
 * 네이버 톡톡 템플릿 수정 API
 *
 * PUT /api/messages/naver/templates/update
 * - 네이버 톡톡 템플릿 수정
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateNaverTalkTemplate } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

/**
 * PUT /api/messages/naver/templates/update
 * 네이버 톡톡 템플릿 수정
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
      text, // 수정할 메시지 내용
      buttons, // 버튼 정보 (선택)
      sampleImageHashId, // 샘플 이미지 해시 ID (선택)
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

    if (!text) {
      return NextResponse.json(
        { error: 'text가 필요합니다.' },
        { status: 400 }
      );
    }

    // MTS API 호출
    const result = await updateNaverTalkTemplate(
      partnerKey,
      templateCode,
      text,
      buttons,
      sampleImageHashId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '템플릿이 성공적으로 수정되었습니다.',
      });
    }

    return NextResponse.json(
      {
        error: result.error || '템플릿 수정 실패',
        errorCode: result.errorCode,
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('네이버 톡톡 템플릿 수정 오류:', error);
    return NextResponse.json(
      {
        error: '템플릿 수정 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
