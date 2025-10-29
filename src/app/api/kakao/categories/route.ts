import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { getMtsCategoryList } from '@/lib/mtsApi';

/**
 * 카카오 발신프로필 카테고리 목록 조회 API
 * GET /api/kakao/categories
 */
export async function GET(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse;
    }

    // MTS API 호출
    const result = await getMtsCategoryList();

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '카테고리 목록 조회 실패',
          errorCode: result.errorCode
        },
        { status: 400 }
      );
    }

    // 성공 시 응답 데이터 반환
    return NextResponse.json({
      success: true,
      categories: result.responseData?.data || [],
    });
  } catch (error) {
    console.error('카테고리 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
