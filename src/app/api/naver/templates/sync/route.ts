import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { syncNaverTalkTemplates } from '@/lib/mtsApi';

/**
 * ⚠️ 사용 불가: MTS API에 템플릿 목록 조회 엔드포인트 미존재
 *
 * POST /api/naver/templates/sync
 * MTS에서 네이버 톡톡 템플릿 목록 조회 후 DB 동기화
 *
 * 이 엔드포인트는 MTS API가 네이버 톡톡 템플릿 목록 조회를 지원하지 않아
 * 항상 실패합니다 (HTML 응답 → JSON 파싱 에러).
 *
 * MTS API는 개별 템플릿 조회만 지원:
 * - 엔드포인트: /naver/v1/template/{partnerKey}/{templateCode}
 *
 * 네이버 톡톡 템플릿 관리 방식:
 * 1. createNaverTalkTemplate() 호출 시 자동 DB 저장
 * 2. /api/naver/templates/list에서 DB 기반 목록 조회
 * 3. MTS 웹 콘솔 생성 템플릿은 개별 조회 후 수동 등록 필요
 *
 * @deprecated MTS API 미지원
 *
 * Request Body:
 * {
 *   partnerKey: string  // 네이버 톡톡 파트너 키
 * }
 *
 * Response:
 * {
 *   success: true,
 *   syncCount: number,
 *   totalCount: number,
 *   errorCount: number,
 *   message: string
 * }
 */
export async function POST(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuthWithSuccess(request);
  if (!authResult.isValid || !authResult.userInfo) {
    return authResult.errorResponse || NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const { userId } = authResult.userInfo;

  try {
    const body = await request.json();
    const { partnerKey } = body;

    // 필수 파라미터 검증
    if (!partnerKey) {
      return NextResponse.json(
        { error: '파트너키가 필요합니다.' },
        { status: 400 }
      );
    }

    // MTS에서 템플릿 동기화
    const result = await syncNaverTalkTemplates(userId, partnerKey);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '템플릿 동기화 실패',
          errorCode: result.errorCode,
        },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      ...result.responseData,
    });
  } catch (error) {
    console.error('템플릿 동기화 API 오류:', error);
    return NextResponse.json(
      {
        error: '템플릿 동기화 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
