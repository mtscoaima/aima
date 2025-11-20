import { NextRequest, NextResponse } from 'next/server';
import { createNaverTalkTemplate } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

/**
 * POST /api/messages/naver/templates/create
 * 네이버 톡톡 템플릿 생성
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    // 요청 본문 파싱
    const body = await request.json();
    const {
      partnerKey,
      code,
      text,
      productCode,
      categoryCode,
      buttons,
      sampleImageHashId,
    } = body;

    // 필수 파라미터 검증
    if (!partnerKey) {
      return NextResponse.json(
        { error: '파트너키가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        { error: '템플릿 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: '템플릿 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!productCode || !['INFORMATION', 'BENEFIT', 'CARDINFO'].includes(productCode)) {
      return NextResponse.json(
        { error: '상품 코드가 올바르지 않습니다. (INFORMATION, BENEFIT, CARDINFO 중 하나)' },
        { status: 400 }
      );
    }

    if (!categoryCode) {
      return NextResponse.json(
        { error: '카테고리 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // 버튼 검증 (선택 사항)
    if (buttons && buttons.length > 5) {
      return NextResponse.json(
        { error: '버튼은 최대 5개까지 추가할 수 있습니다.' },
        { status: 400 }
      );
    }

    // 네이버 톡톡 템플릿 생성 API 호출
    const result = await createNaverTalkTemplate(
      authResult.userInfo.userId, // userId 추가
      partnerKey,
      code,
      text,
      productCode,
      categoryCode,
      buttons,
      undefined, // templateType
      undefined, // pushNotice
      undefined, // tableInfo
      sampleImageHashId
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.responseData,
        message: '네이버 톡톡 템플릿이 성공적으로 생성되었습니다.',
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('네이버 톡톡 템플릿 생성 API 오류:', error);
    return NextResponse.json(
      {
        error: '템플릿 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
