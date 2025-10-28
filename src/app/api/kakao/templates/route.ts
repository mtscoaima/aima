import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { getMtsAlimtalkTemplates, getMtsAlimtalkTemplate } from '@/lib/mtsApi';

/**
 * 카카오 알림톡 템플릿 목록 조회 API
 * GET /api/kakao/templates
 *
 * 쿼리 파라미터:
 * - senderKey: 발신 프로필 키 (필수)
 * - templateCode: 템플릿 코드 (선택, 있으면 상세 조회)
 * - page: 페이지 번호 (기본: 1)
 * - count: 페이지당 개수 (기본: 100)
 */
export async function GET(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse;
    }

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const senderKey = searchParams.get('senderKey');
    const templateCode = searchParams.get('templateCode');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const count = parseInt(searchParams.get('count') || '100', 10);

    // senderKey 필수 확인
    if (!senderKey) {
      return NextResponse.json(
        { error: '발신 프로필 키가 필요합니다.' },
        { status: 400 }
      );
    }

    // 템플릿 코드가 있으면 상세 조회, 없으면 목록 조회
    let result;
    if (templateCode) {
      result = await getMtsAlimtalkTemplate(senderKey, templateCode);
    } else {
      result = await getMtsAlimtalkTemplates(senderKey, page, count);
    }

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '템플릿 조회 실패',
          errorCode: result.errorCode
        },
        { status: 400 }
      );
    }

    // 성공 시 응답 데이터 반환
    return NextResponse.json({
      success: true,
      data: result.responseData,
    });
  } catch (error) {
    console.error('템플릿 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
