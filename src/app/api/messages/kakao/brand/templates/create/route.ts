import { NextRequest, NextResponse } from 'next/server';
import { createBrandTemplate } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

/**
 * POST /api/messages/kakao/brand/templates/create
 * 카카오 브랜드 메시지 템플릿 생성
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
      senderKey,
      senderGroupKey,
      name,
      chatBubbleType,
      content,
      adult = false,
      additionalContent,
      imageUrl,
      imageName,
      imageLink,
      buttons,
      // PREMIUM_VIDEO 필드
      videoUrl,
      thumbnailUrl,
      // COMMERCE 필드
      commerceTitle,
      regularPrice,
      discountPrice,
      discountRate,
      discountFixed,
      // WIDE_ITEM_LIST 필드
      items,
      // CAROUSEL_COMMERCE, CAROUSEL_FEED 필드
      carouselCards,
    } = body;

    // senderKey 또는 senderGroupKey 중 하나는 필수
    if (!senderKey && !senderGroupKey) {
      return NextResponse.json(
        { error: 'senderKey 또는 senderGroupKey 중 하나는 필수입니다.' },
        { status: 400 }
      );
    }

    // 필수 파라미터 검증
    if (!name) {
      return NextResponse.json(
        { error: '템플릿 이름이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!chatBubbleType || !['TEXT', 'IMAGE', 'WIDE', 'WIDE_ITEM_LIST', 'CAROUSEL_FEED', 'PREMIUM_VIDEO', 'COMMERCE', 'CAROUSEL_COMMERCE'].includes(chatBubbleType)) {
      return NextResponse.json(
        { error: '메시지 타입이 올바르지 않습니다. (TEXT, IMAGE, WIDE, WIDE_ITEM_LIST, CAROUSEL_FEED, PREMIUM_VIDEO, COMMERCE, CAROUSEL_COMMERCE 중 하나)' },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: '템플릿 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    // 메시지 타입별 내용 길이 검증
    const contentValidation: Record<string, number> = {
      TEXT: 1000,
      IMAGE: 400,
      WIDE: 76,
      PREMIUM_VIDEO: 76,
    };

    if (contentValidation[chatBubbleType] && content.length > contentValidation[chatBubbleType]) {
      return NextResponse.json(
        { error: `${chatBubbleType} 타입의 템플릿 내용은 최대 ${contentValidation[chatBubbleType]}자까지 입력 가능합니다.` },
        { status: 400 }
      );
    }

    // 버튼 개수 검증
    if (buttons && buttons.length > 0) {
      const maxButtons: Record<string, number> = {
        TEXT: 5,
        IMAGE: 5,
        WIDE: 2,
        WIDE_ITEM_LIST: 2,
        PREMIUM_VIDEO: 1,
        COMMERCE: 2,
      };

      const maxButtonCount = maxButtons[chatBubbleType];
      if (maxButtonCount && buttons.length > maxButtonCount) {
        return NextResponse.json(
          { error: `${chatBubbleType} 타입은 최대 ${maxButtonCount}개의 버튼까지 추가할 수 있습니다.` },
          { status: 400 }
        );
      }
    }

    // 카카오 브랜드 메시지 템플릿 생성 API 호출
    // 버튼 형식 변환은 mtsApi.ts에서 처리
    // DB 저장: Frontend 형식 (type, url_mobile, url_pc)
    const result = await createBrandTemplate(
      authResult.userInfo.userId,
      senderKey,
      senderGroupKey,
      name,
      chatBubbleType,
      content,
      adult,
      additionalContent,
      imageUrl,
      imageName,
      imageLink,
      buttons, // Frontend 형식 그대로 전달
      // PREMIUM_VIDEO 필드
      videoUrl,
      thumbnailUrl,
      // COMMERCE 필드
      commerceTitle,
      regularPrice,
      discountPrice,
      discountRate,
      discountFixed,
      // WIDE_ITEM_LIST 필드
      items,
      // CAROUSEL_COMMERCE, CAROUSEL_FEED 필드
      carouselCards
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.responseData,
        message: '카카오 브랜드 메시지 템플릿이 성공적으로 생성되었습니다.',
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
    console.error('카카오 브랜드 메시지 템플릿 생성 API 오류:', error);
    return NextResponse.json(
      {
        error: '템플릿 생성 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
