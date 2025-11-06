import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { getBrandMessageResult } from '@/lib/mtsApi';

/**
 * GET /api/messages/kakao/brand/result
 * 브랜드 메시지 발송 결과 조회
 *
 * 쿼리 파라미터:
 * - senderKey: 발신 프로필 키 (필수)
 * - sendDate: 발송 일자 YYYYMMDD 형식 (필수, 최소 8자리)
 * - page: 페이지 번호 (선택, 기본값: 1)
 * - count: 페이지당 건수 (선택, 기본값: 1000)
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[브랜드 메시지 결과 조회 API] 요청 수신');

    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      console.error('[브랜드 메시지 결과 조회 API] 인증 실패');
      return authResult.errorResponse;
    }

    // URL 파라미터에서 정보 추출
    const { searchParams } = new URL(request.url);
    const senderKey = searchParams.get('senderKey');
    const sendDate = searchParams.get('sendDate');
    const page = parseInt(searchParams.get('page') || '1');
    const count = parseInt(searchParams.get('count') || '1000');

    // 필수 파라미터 검증
    if (!senderKey) {
      return NextResponse.json(
        { error: 'senderKey 파라미터가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!sendDate) {
      return NextResponse.json(
        { error: 'sendDate 파라미터가 필요합니다. (YYYYMMDD 형식)' },
        { status: 400 }
      );
    }

    // sendDate 형식 검증 (YYYYMMDD, 최소 8자리)
    if (sendDate.length < 8 || !/^\d{8,}$/.test(sendDate)) {
      return NextResponse.json(
        { error: 'sendDate는 YYYYMMDD 형식이어야 합니다. (최소 8자리)' },
        { status: 400 }
      );
    }

    console.log('[브랜드 메시지 결과 조회 API] 요청 파라미터:', {
      senderKey,
      sendDate,
      page,
      count,
    });

    // MTS API 호출
    const result = await getBrandMessageResult(senderKey, sendDate, page, count);

    if (!result.success) {
      console.error('[브랜드 메시지 결과 조회 API] MTS API 호출 실패:', result.error);
      return NextResponse.json(
        {
          error: result.error || '발송 결과 조회 중 오류가 발생했습니다.',
          errorCode: result.errorCode,
        },
        { status: 500 }
      );
    }

    // 성공 응답
    const responseData = result.responseData as {
      code: string;
      received_at: string;
      message?: string;
      data?: Array<{
        result_code: string;
        result_date: string;
        real_send_date: string;
        sender_key: string;
        send_date: string;
        phone_number: string;
        template_code: string;
        message_type: string;
        [key: string]: unknown;
      }>;
    };

    console.log('[브랜드 메시지 결과 조회 API] 성공:', {
      dataCount: responseData.data?.length || 0,
      receivedAt: responseData.received_at,
    });

    return NextResponse.json({
      success: true,
      code: responseData.code,
      receivedAt: responseData.received_at,
      data: responseData.data || [],
      count: responseData.data?.length || 0,
    });
  } catch (error) {
    console.error('[브랜드 메시지 결과 조회 API] 오류:', error);
    return NextResponse.json(
      {
        error: '발송 결과 조회 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
