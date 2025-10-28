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

    const validMessageTypes = ['TEXT', 'IMAGE', 'WIDE', 'WIDE_ITEM_LIST', 'CAROUSEL_FEED', 'PREMIUM_VIDEO'];
    if (!validMessageTypes.includes(messageType)) {
      return NextResponse.json(
        { error: `메시지 타입이 올바르지 않습니다. (${validMessageTypes.join(', ')} 중 하나)` },
        { status: 400 }
      );
    }

    // 예약 발송 시간 변환 (있는 경우)
    const sendDate = scheduledAt ? convertToMtsDateFormat(scheduledAt) : undefined;

    // 비용 계산 (브랜드 메시지: 15원)
    const costPerMessage = 15;
    const totalCost = recipients.length * costPerMessage;

    // 사용자 잔액 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (userData.balance < totalCost) {
      return NextResponse.json(
        {
          error: '잔액이 부족합니다.',
          required: totalCost,
          current: userData.balance,
        },
        { status: 400 }
      );
    }

    // 발송 결과 저장
    const results = [];
    let successCount = 0;
    let failCount = 0;

    // 각 수신자에게 발송
    for (const recipient of recipients) {
      try {
        const result = await sendKakaoBrand(
          senderKey,
          templateCode,
          recipient,
          message,
          callbackNumber,
          messageType as 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'PREMIUM_VIDEO',
          'M', // 타겟팅 타입 (M: 전화번호)
          attachment,
          tranType as 'N' | 'S' | 'L' | 'M',
          tranMessage,
          subject,
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
          message_type: 'BRAND_MESSAGE',
          sender_number: callbackNumber,
          recipient_number: recipient,
          content: message,
          status: result.success ? 'sent' : 'failed',
          cost: result.success ? costPerMessage : 0,
          mts_msg_id: result.msgId || null,
          error_message: result.error || null,
          metadata: {
            sender_key: senderKey,
            template_code: templateCode,
            message_type: messageType,
            tran_type: tranType,
            error_code: result.errorCode,
          },
        });

        // 성공 시 transactions 테이블에 사용 내역 기록
        if (result.success) {
          await supabase.from('transactions').insert({
            user_id: userId,
            type: 'usage',
            amount: -costPerMessage,
            description: `브랜드 메시지 발송 (${recipient})`,
            reference_id: result.msgId,
            metadata: {
              message_type: 'BRAND_MESSAGE',
              recipient,
              template_code: templateCode,
            },
          });

          // 사용자 잔액 차감
          await supabase.rpc('decrement_balance', {
            user_id_param: userId,
            amount_param: costPerMessage,
          });
        }
      } catch (error) {
        failCount++;
        results.push({
          recipient,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });

        // 실패 로그 저장
        await supabase.from('message_logs').insert({
          user_id: userId,
          message_type: 'BRAND_MESSAGE',
          sender_number: callbackNumber,
          recipient_number: recipient,
          content: message,
          status: 'failed',
          cost: 0,
          error_message: error instanceof Error ? error.message : '알 수 없는 오류',
          metadata: {
            sender_key: senderKey,
            template_code: templateCode,
            message_type: messageType,
          },
        });
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
