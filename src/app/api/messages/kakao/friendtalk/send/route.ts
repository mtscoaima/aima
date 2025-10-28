import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { sendMtsFriendtalk, convertToMtsDateFormat } from '@/lib/mtsApi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 카카오 친구톡 V2 발송 API
 * POST /api/messages/kakao/friendtalk/send
 *
 * Request Body:
 * {
 *   senderKey: string;                // 발신 프로필 키
 *   recipients: string[];             // 수신자 목록
 *   message: string;                  // 메시지 내용
 *   callbackNumber: string;           // 발신번호
 *   messageType: 'FT'|'FI'|'FW'|'FL'|'FC'; // 메시지 타입
 *   adFlag: 'Y'|'N';                  // 광고 여부
 *   imageUrls?: string[];             // 이미지 URL 배열 (선택)
 *   buttons?: Array<{                 // 버튼 (선택)
 *     name: string;
 *     type: string;
 *     url_mobile?: string;
 *     url_pc?: string;
 *   }>;
 *   tranType?: 'SMS'|'LMS'|'MMS';     // 전환 발송 타입 (선택)
 *   tranMessage?: string;             // 전환 발송 메시지 (선택)
 *   scheduledAt?: string;             // 예약 발송 시간 (yyyy-MM-dd HH:mm 형식, 선택)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    const { userId } = authResult.userInfo;
    const body = await request.json();

    // 필수 파라미터 검증
    const {
      senderKey,
      recipients,
      message,
      callbackNumber,
      messageType,
      adFlag,
      imageUrls,
      buttons,
      tranType,
      tranMessage,
      scheduledAt,
    } = body;

    if (!senderKey) {
      return NextResponse.json(
        { error: '발신 프로필 키가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: '수신자 목록이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: '메시지 내용이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!callbackNumber) {
      return NextResponse.json(
        { error: '발신번호가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!messageType || !['FT', 'FI', 'FW', 'FL', 'FC'].includes(messageType)) {
      return NextResponse.json(
        { error: '메시지 타입이 올바르지 않습니다. (FT, FI, FW, FL, FC 중 하나)' },
        { status: 400 }
      );
    }

    if (!adFlag || !['Y', 'N'].includes(adFlag)) {
      return NextResponse.json(
        { error: '광고 여부가 올바르지 않습니다. (Y 또는 N)' },
        { status: 400 }
      );
    }

    // 예약 발송 시간 변환 (있는 경우)
    const sendDate = scheduledAt ? convertToMtsDateFormat(scheduledAt) : undefined;

    // 발송 결과 저장
    const results = [];
    let successCount = 0;
    let failCount = 0;

    // 각 수신자에게 발송
    for (const recipient of recipients) {
      try {
        const result = await sendMtsFriendtalk(
          senderKey,
          recipient,
          message,
          callbackNumber,
          messageType,
          adFlag,
          imageUrls,
          buttons,
          tranType,
          tranMessage,
          sendDate
        );

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }

        results.push({
          recipient,
          success: result.success,
          msgId: result.msgId,
          error: result.error,
          errorCode: result.errorCode,
        });

        // DB에 발송 이력 저장
        await supabase.from('message_logs').insert({
          user_id: userId,
          type: 'FRIENDTALK',
          recipient: recipient,
          message: message,
          status: result.success ? 'sent' : 'failed',
          scheduled_at: scheduledAt || null,
          metadata: {
            sender_key: senderKey,
            callback_number: callbackNumber,
            message_type: messageType,
            ad_flag: adFlag,
            image_urls: imageUrls,
            mts_msg_id: result.msgId,
            error_code: result.errorCode,
            error_message: result.error,
            buttons: buttons,
            tran_type: tranType,
            tran_message: tranMessage,
          },
        });
      } catch (error) {
        failCount++;
        console.error(`친구톡 발송 실패 (수신자: ${recipient}):`, error);
        results.push({
          recipient,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    // 사용자 잔액 차감 (성공한 건수만)
    if (successCount > 0) {
      // 친구톡 단가 조회 (기본 15원)
      const { data: pricingData } = await supabase
        .from('pricing_settings')
        .select('friendtalk_price')
        .single();

      const unitPrice = pricingData?.friendtalk_price || 15;
      const totalCost = successCount * unitPrice;

      // 트랜잭션 생성
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'usage',
        amount: -totalCost,
        description: `카카오 친구톡 발송 (${successCount}건)`,
        reference_id: results.filter(r => r.success).map(r => r.msgId).join(','),
        metadata: {
          message_type: 'FRIENDTALK',
          recipient_count: successCount,
          unit_price: unitPrice,
          message_type_detail: messageType,
          ad_flag: adFlag,
        },
        status: 'completed',
      });
    }

    // 응답 반환
    return NextResponse.json({
      success: true,
      totalCount: recipients.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('친구톡 발송 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
