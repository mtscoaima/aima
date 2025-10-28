import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { getMtsSenderProfiles } from '@/lib/mtsApi';

/**
 * 카카오 발신 프로필 목록 조회 API
 * GET /api/kakao/profiles
 *
 * 쿼리 파라미터:
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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const count = parseInt(searchParams.get('count') || '100', 10);

    // MTS API 호출
    const result = await getMtsSenderProfiles(page, count);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '발신 프로필 조회 실패',
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
    console.error('발신 프로필 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
