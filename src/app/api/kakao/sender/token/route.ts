import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { requestMtsSenderToken } from '@/lib/mtsApi';

/**
 * 카카오 발신프로필 인증 토큰 요청 API
 * POST /api/kakao/sender/token
 *
 * Body:
 * - yellowId: 카카오톡 채널 ID (예: @example)
 * - phoneNumber: 관리자 전화번호
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse;
    }

    // 요청 본문 파싱
    const body = await request.json();
    const { yellowId, phoneNumber } = body;

    // 유효성 검사
    if (!yellowId || !phoneNumber) {
      return NextResponse.json(
        { error: '카카오톡 채널 ID와 전화번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // yellowId 형식 검증 (@로 시작)
    if (!yellowId.startsWith('@')) {
      return NextResponse.json(
        { error: '카카오톡 채널 ID는 @로 시작해야 합니다. (예: @example)' },
        { status: 400 }
      );
    }

    // 전화번호 형식 검증 (숫자와 하이픈만 허용)
    if (!/^[0-9-]+$/.test(phoneNumber)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // MTS API 호출
    const result = await requestMtsSenderToken(yellowId, phoneNumber);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '인증 토큰 요청 실패',
          errorCode: result.errorCode
        },
        { status: 400 }
      );
    }

    // 성공 시 응답
    return NextResponse.json({
      success: true,
      message: '인증 토큰이 카카오톡으로 전송되었습니다. (유효기간: 7일)',
      data: result.responseData,
    });
  } catch (error) {
    console.error('토큰 요청 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
