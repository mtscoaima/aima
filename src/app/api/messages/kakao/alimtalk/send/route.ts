import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { sendMtsAlimtalk, convertToMtsDateFormat } from '@/lib/mtsApi';
import { createSendRequest, updateSendRequest } from '@/lib/messageSender';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 카카오 알림톡 발송 API
 * POST /api/messages/kakao/alimtalk/send
 *
 * Request Body:
 * {
 *   senderKey: string;           // 발신 프로필 키
 *   templateCode: string;        // 템플릿 코드
 *   recipients: Array<{          // 수신자 목록
 *     phone_number: string;
 *     name?: string;
 *   }>;
 *   message: string;             // 메시지 내용
 *   callbackNumber: string;      // 발신번호
 *   buttons?: Array<{            // 버튼 (선택)
 *     name: string;
 *     type: string;
 *     url_mobile?: string;
 *     url_pc?: string;
 *   }>;
 *   tranType?: 'SMS'|'LMS'|'MMS'; // 전환 발송 타입 (선택)
 *   tranMessage?: string;        // 전환 발송 메시지 (선택)
 *   scheduledAt?: string;        // 예약 발송 시간 (yyyy-MM-dd HH:mm 형식, 선택)
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
      templateCode,
      recipients,
      message,
      callbackNumber,
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

    if (!templateCode) {
      return NextResponse.json(
        { error: '템플릿 코드가 필요합니다.' },
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

    // 예약 발송 시간 변환 (있는 경우)
    const sendDate = scheduledAt ? convertToMtsDateFormat(scheduledAt) : undefined;

    // 발송 의뢰 생성
    const sendRequestId = await createSendRequest({
      userId,
      channelType: 'KAKAO_ALIMTALK',
      messagePreview: message,
      totalCount: recipients.length,
      scheduledAt: scheduledAt || undefined,
      metadata: {
        sender_key: senderKey,
        template_code: templateCode,
        callback_number: callbackNumber,
        has_buttons: !!buttons,
        tran_type: tranType || null,
      }
    });

    // 수신자 배열 생성 (MTS API 복수 발송 형식)
    const recipientsWithMessage = recipients.map((r: { phone_number: string; name?: string; replacedMessage?: string }) => ({
      phone_number: r.phone_number,
      message: r.replacedMessage || message,
      name: r.name,
    }));

    // 복수 발송 API 호출
    const result = await sendMtsAlimtalk(
      senderKey,
      templateCode,
      recipientsWithMessage,
      callbackNumber,
      buttons,
      tranType,
      tranMessage,
      sendDate
    );

    // 결과 처리 (복수 API는 전체 성공/실패 반환)
    const successCount = result.success ? recipients.length : 0;
    const failCount = result.success ? 0 : recipients.length;

    // 개별 결과 생성
    const results = recipients.map((recipient: { phone_number: string; name?: string; replacedMessage?: string }) => ({
      recipient: recipient.phone_number,
      success: result.success,
      msgId: result.msgId,
      error: result.error,
      errorCode: result.errorCode,
    }));

    // DB에 발송 이력 일괄 저장
    const logEntries = recipients.map((recipient: { phone_number: string; name?: string; replacedMessage?: string }) => ({
      user_id: userId,
      to_number: recipient.phone_number,
      to_name: recipient.name || null,
      message_content: recipient.replacedMessage || message,
      subject: null,
      message_type: 'KAKAO_ALIMTALK',
      sent_at: result.success ? new Date().toISOString() : null,
      status: result.success ? 'sent' : 'failed',
      error_message: result.error || null,
      credit_used: result.success ? 13 : 0,
      send_request_id: sendRequestId,
      metadata: {
        sender_key: senderKey,
        template_code: templateCode,
        callback_number: callbackNumber,
        buttons: buttons,
        tran_type: tranType,
        tran_message: tranMessage,
        scheduled_at: scheduledAt,
        mts_msg_id: result.msgId,
        error_code: result.errorCode || null,
      },
    }));

    const { error: logError } = await supabase.from('message_logs').insert(logEntries);
    if (logError) {
      console.error('알림톡 발송 이력 저장 실패:', logError);
    }

    // 발송 의뢰 결과 업데이트
    if (sendRequestId) {
      await updateSendRequest(sendRequestId, successCount, failCount);
    }

    // 사용자 잔액 차감 (성공한 건수만)
    if (successCount > 0) {
      // 알림톡 단가 조회 (기본 15원)
      const { data: pricingData } = await supabase
        .from('pricing_settings')
        .select('alimtalk_price')
        .single();

      const unitPrice = pricingData?.alimtalk_price || 13;
      const totalCost = successCount * unitPrice;

      // 트랜잭션 생성 (amount는 양수로 저장, UI에서 type='usage'일 때 - 표시)
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'usage',
        amount: totalCost, // 양수로 저장
        description: `카카오 알림톡 발송 (${successCount}건)`,
        reference_id: results.filter(r => r.success).map(r => r.msgId).join(','),
        metadata: {
          message_type: 'ALIMTALK',
          recipient_count: successCount,
          unit_price: unitPrice,
        },
        status: 'completed',
      });
    }

    // 응답 반환
    return NextResponse.json({
      success: true,
      sendRequestId,
      totalCount: recipients.length,
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error('알림톡 발송 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
