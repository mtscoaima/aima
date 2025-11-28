import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { sendKakaoBrand, convertToMtsDateFormat } from '@/lib/mtsApi';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 카카오 브랜드 메시지 발송 API (기본형: 전문방식)
 * POST /api/messages/kakao/brand/send
 *
 * Request Body:
 * {
 *   senderKey: string;                // 발신 프로필 키
 *   templateCode: string;             // 템플릿 코드
 *   recipients: string[];             // 수신자 목록
 *   message: string;                  // 메시지 내용
 *   callbackNumber: string;           // 발신번호
 *   messageType: 'TEXT'|'IMAGE'|'WIDE'|'WIDE_ITEM_LIST'|'CAROUSEL_FEED'|'PREMIUM_VIDEO'; // 메시지 타입
 *   targeting?: 'M'|'N'|'I';          // 수신 대상 타입 (M: 수신동의, N: 수신동의+채널친구, I: 전체+채널친구, 기본값: I)
 *   attachment?: {                    // 첨부 내용 (선택)
 *     button?: Array<{
 *       type: 'WL'|'AL'|'BK'|'MD'|'AC';
 *       url_mobile?: string;
 *       url_pc?: string;
 *     }>;
 *     image?: {
 *       img_url: string;
 *       img_link?: string;
 *     };
 *     coupon?: {
 *       description?: string;
 *       url_pc?: string;
 *       url_mobile?: string;
 *     };
 *     item?: {
 *       list: Array<{
 *         img_url: string;
 *         url_mobile?: string;
 *       }>;
 *     };
 *   };
 *   tranType?: 'N'|'S'|'L'|'M';       // 전환 발송 타입 (N: 전환안함, S: SMS, L: LMS, M: MMS)
 *   tranMessage?: string;             // 전환 발송 메시지 (선택)
 *   subject?: string;                 // LMS 전송 시 제목 (선택)
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
      templateCode,
      recipients,
      message,
      callbackNumber,
      messageType = 'TEXT',
      attachment,
      targeting = 'I', // 수신 대상 타입 (M: 수신동의, N: 수신동의+채널친구, I: 전체+채널친구)
      tranType = 'N',
      tranMessage,
      subject,
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

    const validMessageTypes = ['TEXT', 'IMAGE', 'WIDE', 'WIDE_ITEM_LIST', 'CAROUSEL_FEED', 'PREMIUM_VIDEO', 'COMMERCE', 'CAROUSEL_COMMERCE'];
    if (!validMessageTypes.includes(messageType)) {
      return NextResponse.json(
        { error: `메시지 타입이 올바르지 않습니다. (${validMessageTypes.join(', ')} 중 하나)` },
        { status: 400 }
      );
    }

    // Targeting 검증 및 경고
    if (targeting === 'M' || targeting === 'N') {
      console.warn(`⚠️ [브랜드 메시지] M/N 타게팅 사용됨. 필수 조건 확인 필요:`, {
        targeting,
        requirements: [
          '비즈니스 인증받은 채널',
          '채널 전화번호 등록',
          '채널 친구수 5만 이상',
          '광고성 정보 수신동의 증적파일',
          '3개월 이내 알림톡 발송이력'
        ],
        warning: '조건 미충족 시 에러 1028 발생',
        recommendation: '테스트는 targeting=I 사용 권장'
      });
    }

    // 예약 발송 시간 변환 (있는 경우)
    const sendDate = scheduledAt ? convertToMtsDateFormat(scheduledAt) : undefined;

    // 비용 계산 (브랜드 메시지: 20원)
    const costPerMessage = 20;

    // 수신자 배열 생성 (MTS API 복수 발송 형식)
    const recipientsArray = recipients.map((r: { phone_number: string; name?: string; replacedMessage?: string }) => ({
      phone_number: r.phone_number,
      message: r.replacedMessage || message,
      name: r.name,
    }));

    // 복수 발송 API 호출
    const result = await sendKakaoBrand(
      senderKey,
      templateCode,
      recipientsArray,
      message,
      callbackNumber,
      messageType as 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'PREMIUM_VIDEO' | 'COMMERCE' | 'CAROUSEL_COMMERCE',
      targeting as 'M' | 'N' | 'I',
      attachment,
      tranType as 'N' | 'S' | 'L' | 'M',
      tranMessage,
      subject,
      sendDate
    );

    // 결과 처리 (복수 API는 전체 성공/실패 반환)
    const successCount = result.success ? recipients.length : 0;
    const failCount = result.success ? 0 : recipients.length;

    // 개별 결과 생성
    const results = recipients.map((recipient: { phone_number: string; name?: string; replacedMessage?: string }) => ({
      recipient,
      success: result.success,
      msgId: result.msgId,
      error: result.error,
      errorCode: result.errorCode,
    }));

    // DB에 발송 이력 일괄 저장
    const logEntries = recipients.map((recipient: { phone_number: string; name?: string; replacedMessage?: string }) => ({
      user_id: userId,
      message_type: 'KAKAO_BRAND',
      to_number: recipient.phone_number,
      to_name: recipient.name || null,
      message_content: recipient.replacedMessage || message,
      subject: null,
      sent_at: result.success ? new Date().toISOString() : null,
      status: result.success ? 'sent' : 'failed',
      credit_used: result.success ? costPerMessage : 0,
      error_message: result.error || null,
      metadata: {
        sender_number: callbackNumber,
        sender_key: senderKey,
        template_code: templateCode,
        message_type: messageType,
        tran_type: tranType,
        mts_msg_id: result.msgId || null,
        error_code: result.errorCode,
        recipient_name: recipient.name,
      },
    }));

    const { error: logError } = await supabase.from('message_logs').insert(logEntries);
    if (logError) {
      console.error('[브랜드 메시지 API] message_logs 저장 실패:', logError);
    }

    // 성공한 건수가 있으면 transactions에 한번에 기록
    if (successCount > 0) {
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'usage',
        amount: successCount * costPerMessage,
        description: `브랜드 메시지 발송 (${successCount}건)`,
        metadata: {
          message_type: 'BRAND_MESSAGE',
          template_code: templateCode,
          success_count: successCount,
          fail_count: failCount,
        },
      });

      if (txError) {
        console.error('[브랜드 메시지 API] transactions 저장 실패:', txError);
      }
    }

    // 응답 반환
    return NextResponse.json({
      success: true,
      message: `브랜드 메시지 발송 완료 (성공: ${successCount}, 실패: ${failCount})`,
      results,
      totalCost: successCount * costPerMessage,
    });
  } catch (error) {
    console.error('브랜드 메시지 발송 API 오류:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '브랜드 메시지 발송 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
