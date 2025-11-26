import { NextRequest, NextResponse } from 'next/server';
import { createNaverTalkTemplate, requestNaverTemplateInspection } from '@/lib/mtsApi';
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
      // BENEFIT 전용 필드
      templateType,
      benefit,
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

    // BENEFIT이 아닌 경우 categoryCode 필수
    if (productCode !== 'BENEFIT' && !categoryCode) {
      return NextResponse.json(
        { error: '카테고리 코드가 필요합니다.' },
        { status: 400 }
      );
    }

    // BENEFIT인 경우 benefit 객체 필수 검증
    if (productCode === 'BENEFIT') {
      if (!benefit) {
        return NextResponse.json(
          { error: 'BENEFIT 템플릿의 경우 혜택 정보(benefit)가 필요합니다.' },
          { status: 400 }
        );
      }
      if (!benefit.title) {
        return NextResponse.json(
          { error: '혜택 제목(benefit.title)이 필요합니다.' },
          { status: 400 }
        );
      }
      if (!benefit.benefitTypes || benefit.benefitTypes.length === 0) {
        return NextResponse.json(
          { error: '혜택 유형(benefit.benefitTypes)을 1개 이상 선택해주세요.' },
          { status: 400 }
        );
      }
      if (!benefit.feedDisplayEndedAt) {
        return NextResponse.json(
          { error: '피드 표시 종료일(benefit.feedDisplayEndedAt)이 필요합니다.' },
          { status: 400 }
        );
      }
      if (!benefit.feedDisplayImageHashId) {
        return NextResponse.json(
          { error: '피드 이미지(benefit.feedDisplayImageHashId)가 필요합니다.' },
          { status: 400 }
        );
      }
      if (!benefit.blockCallNumber && !benefit.blockMessageUrl) {
        return NextResponse.json(
          { error: '수신거부 전화번호 또는 URL 중 하나 이상 필요합니다.' },
          { status: 400 }
        );
      }
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
      authResult.userInfo.userId,
      partnerKey,
      code,
      text,
      productCode,
      categoryCode || '', // BENEFIT의 경우 빈 문자열 전달
      buttons,
      templateType, // BENEFIT 전용 templateType
      undefined, // pushNotice
      undefined, // tableInfo
      sampleImageHashId,
      benefit // BENEFIT 전용 benefit 객체
    );

    if (result.success) {
      // 템플릿 생성 성공 후 자동으로 검수 요청
      let inspectionResult = null;
      let inspectionError = null;

      try {
        inspectionResult = await requestNaverTemplateInspection(partnerKey, code);
        if (!inspectionResult.success) {
          inspectionError = inspectionResult.error || '검수 요청 실패';
          console.warn('템플릿 검수 요청 실패:', inspectionError);
        }
      } catch (inspectionErr) {
        inspectionError = inspectionErr instanceof Error ? inspectionErr.message : '검수 요청 중 오류';
        console.error('템플릿 검수 요청 오류:', inspectionErr);
      }

      return NextResponse.json({
        success: true,
        data: result.responseData,
        message: inspectionResult?.success
          ? '네이버 톡톡 템플릿이 생성되고 검수 요청되었습니다.'
          : '네이버 톡톡 템플릿이 생성되었습니다. (검수 요청 실패: ' + inspectionError + ')',
        inspectionRequested: inspectionResult?.success || false,
        inspectionError: inspectionError,
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
