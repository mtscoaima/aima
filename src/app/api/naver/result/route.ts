/**
 * 네이버 톡톡 발송 결과 조회 API
 *
 * POST /api/naver/result
 * - 네이버 톡톡 메시지 발송 결과 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getNaverTalkResult } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

/**
 * POST /api/naver/result
 * 네이버 톡톡 발송 결과 조회
 */
export async function POST(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuthWithSuccess(request);

  if (!authResult.isValid || !authResult.userInfo) {
    return authResult.errorResponse;
  }

  try {
    const body = await request.json();

    const {
      partnerKey,
      sendDate,
      templateCode,
      messageKey, // add_etc1에 해당
      page = 1,
      count = 100,
      addEtc2, // 추가 정보 2 필터 (선택)
      addEtc3, // 추가 정보 3 필터 (선택)
      addEtc4, // 추가 정보 4 필터 (선택)
    } = body;

    // 필수 파라미터 확인
    if (!partnerKey) {
      return NextResponse.json(
        { error: 'partnerKey가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!sendDate) {
      return NextResponse.json(
        { error: 'sendDate가 필요합니다. (YYYYMMDD 또는 YYYY-MM-DD 형식)' },
        { status: 400 }
      );
    }

    // MTS API 호출
    const result = await getNaverTalkResult(
      partnerKey,
      sendDate,
      templateCode,
      messageKey,
      page,
      count,
      addEtc2,
      addEtc3,
      addEtc4
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.responseData,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        errorCode: result.errorCode,
        data: result.responseData,
      }, { status: 400 });
    }

  } catch (error) {
    console.error('네이버 톡톡 결과조회 API 오류:', error);

    return NextResponse.json(
      {
        error: '결과 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
