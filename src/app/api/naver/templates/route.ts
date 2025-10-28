/**
 * 네이버 톡톡 템플릿 API
 *
 * GET /api/naver/templates?navertalkId=xxx&page=1&count=100
 * - 네이버 톡톡 템플릿 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNaverTalkTemplates } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

/**
 * GET /api/naver/templates
 * 네이버 톡톡 템플릿 목록 조회
 */
export async function GET(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuthWithSuccess(request);
  if (!authResult.isValid) {
    return authResult.errorResponse;
  }

  try {
    // Query 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const navertalkId = searchParams.get('navertalkId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const count = parseInt(searchParams.get('count') || '100', 10);

    // navertalkId 필수 확인
    if (!navertalkId) {
      return NextResponse.json(
        { error: 'navertalkId 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    // MTS API 호출
    const result = await getNaverTalkTemplates(navertalkId, page, count);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '네이버 톡톡 템플릿 조회 실패',
          errorCode: result.errorCode
        },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: result.responseData,
    });

  } catch (error) {
    console.error('네이버 톡톡 템플릿 조회 오류:', error);
    return NextResponse.json(
      {
        error: '네이버 톡톡 템플릿 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
