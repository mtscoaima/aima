/**
 * 메시지 발송 공통 로직
 * reservations/message와 messages/send 모두에서 사용
 */

import { createClient } from "@supabase/supabase-js";
import { sendMtsSMS, sendMtsMMS } from "@/lib/mtsApi";
import { determineMessageType } from "@/utils/messageTemplateParser";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// 타입 정의
// ============================================================================

export interface SendMessageParams {
  userId: number;
  fromNumber?: string; // 발신번호 (없으면 TEST_CALLING_NUMBER 사용)
  toNumber: string;
  toName?: string;
  message: string;
  subject?: string;
  messageType?: 'SMS' | 'LMS' | 'MMS';
  imageUrls?: string[]; // MMS용 이미지 파일 ID
  metadata?: Record<string, string | number | boolean>;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  logId?: number;
  messageType: 'SMS' | 'LMS' | 'MMS';
  creditUsed: number;
  error?: string;
}

export interface ScheduleMessageParams {
  userId: number;
  fromNumber?: string; // 발신번호 (없으면 TEST_CALLING_NUMBER 사용)
  toNumber: string;
  toName?: string;
  message: string;
  subject?: string;
  scheduledAt: string;
  imageUrls?: string[]; // MMS용 이미지 파일 ID
  metadata?: Record<string, string | number | boolean>;
}

export interface ScheduleMessageResult {
  success: boolean;
  scheduledId?: number;
  error?: string;
}

// ============================================================================
// 메시지 발송 함수
// ============================================================================

/**
 * 메시지 즉시 발송
 * SMS/LMS/MMS 자동 판단 및 발송
 *
 * @param params - 발송 파라미터
 * @returns 발송 결과
 */
export async function sendMessage(
  params: SendMessageParams
): Promise<SendMessageResult> {
  const { userId, fromNumber, toNumber, toName, message, subject, imageUrls, metadata } = params;

  // 전화번호 정리 (하이픈 제거)
  const cleanPhone = toNumber.replace(/[^0-9]/g, '');

  // 전화번호 유효성 검증
  if (!/^01[0-9]{8,9}$/.test(cleanPhone)) {
    return {
      success: false,
      messageType: 'SMS',
      creditUsed: 0,
      error: `올바르지 않은 전화번호입니다: ${toNumber}`
    };
  }

  // 메시지 타입 결정
  let messageType: 'SMS' | 'LMS' | 'MMS';
  if (imageUrls && imageUrls.length > 0) {
    messageType = 'MMS';
  } else if (params.messageType) {
    messageType = params.messageType;
  } else {
    messageType = determineMessageType(message);
  }

  // 단가 계산
  const creditRequired = getMessageCredit(messageType);

  // 1. 잔액 확인
  const balance = await checkBalance(userId);
  if (balance < creditRequired) {
    return {
      success: false,
      messageType,
      creditUsed: 0,
      error: `광고머니가 부족합니다 (필요: ${creditRequired}원, 현재: ${balance}원)`
    };
  }

  // 2. 발신번호 조회 (fromNumber가 없으면 users.phone_number 사용)
  let callbackNumber = fromNumber;
  if (!callbackNumber) {
    const { data: userData } = await supabase
      .from('users')
      .select('phone_number')
      .eq('id', userId)
      .single();

    callbackNumber = userData?.phone_number || process.env.TEST_CALLING_NUMBER || '';
  }

  if (!callbackNumber) {
    return {
      success: false,
      messageType,
      creditUsed: 0,
      error: '발신번호가 없습니다. 사용자 프로필에서 전화번호를 등록해주세요.'
    };
  }

  // 3. 메시지 발송
  let sendResult;

  if (messageType === 'MMS' && imageUrls && imageUrls.length > 0) {
    // MMS 발송
    sendResult = await sendMtsMMS(
      cleanPhone,
      message,
      subject || '',
      imageUrls,
      callbackNumber
    );
  } else {
    // SMS/LMS 발송 (MTS API가 자동으로 90바이트 기준 판단)
    sendResult = await sendMtsSMS(
      cleanPhone,
      message,
      callbackNumber,
      subject
    );
  }

  if (!sendResult.success) {
    return {
      success: false,
      messageType,
      creditUsed: 0,
      error: sendResult.error || '발송 실패'
    };
  }

  // 4. 잔액 차감
  await deductBalance(userId, creditRequired, messageType, {
    ...metadata,
    recipient: cleanPhone,
    recipient_name: toName || '',
    from_number: callbackNumber
  });

  // 5. 발송 로그 저장 (optional)
  const logId = await saveMessageLog({
    userId,
    toNumber: cleanPhone,
    toName,
    messageContent: message,
    subject,
    messageType,
    status: 'sent',
    creditUsed: creditRequired,
    metadata: {
      ...metadata,
      mts_msg_id: sendResult.messageId || '',
      from_number: callbackNumber
    }
  });

  return {
    success: true,
    messageId: sendResult.messageId,
    logId,
    messageType,
    creditUsed: creditRequired
  };
}

// ============================================================================
// 예약 발송 함수
// ============================================================================

/**
 * 메시지 예약 발송
 *
 * @param params - 예약 발송 파라미터
 * @param tableName - 저장할 테이블명 (기본: scheduled_messages)
 * @returns 예약 결과
 */
export async function scheduleMessage(
  params: ScheduleMessageParams,
  tableName: string = 'scheduled_messages'
): Promise<ScheduleMessageResult> {
  const { userId, fromNumber, toNumber, toName, message, subject, scheduledAt, imageUrls, metadata } = params;

  // 과거 시간 체크
  const scheduledTime = new Date(scheduledAt);
  const now = new Date();

  if (scheduledTime <= now) {
    return {
      success: false,
      error: "예약 시간은 현재 시간 이후여야 합니다"
    };
  }

  // 전화번호 정리
  const cleanPhone = toNumber.replace(/[^0-9]/g, '');

  // 전화번호 유효성 검증
  if (!/^01[0-9]{8,9}$/.test(cleanPhone)) {
    return {
      success: false,
      error: `올바르지 않은 전화번호입니다: ${toNumber}`
    };
  }

  // 메시지 타입 결정
  let messageType: 'SMS' | 'LMS' | 'MMS';
  if (imageUrls && imageUrls.length > 0) {
    messageType = 'MMS';
  } else {
    messageType = determineMessageType(message);
  }

  try {
    const { data, error } = await supabase
      .from(tableName)
      .insert({
        user_id: userId,
        to_number: cleanPhone,
        to_name: toName || '',
        message_content: message,
        subject: subject || '',
        scheduled_at: scheduledAt,
        status: 'pending',
        metadata: {
          ...metadata,
          message_type: messageType,
          source: 'sms_tab',
          from_number: fromNumber,
          image_urls: imageUrls && imageUrls.length > 0 ? JSON.stringify(imageUrls) : null
        }
      })
      .select()
      .single();

    if (error) {
      console.error('예약 메시지 저장 실패:', error);
      return {
        success: false,
        error: "예약 메시지 저장 실패"
      };
    }

    return {
      success: true,
      scheduledId: data.id
    };
  } catch (error) {
    console.error('예약 메시지 저장 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "알 수 없는 오류"
    };
  }
}

// ============================================================================
// 잔액 관리 함수
// ============================================================================

/**
 * 사용자 잔액 확인
 * transactions 테이블에서 계산
 *
 * @param userId - 사용자 ID
 * @returns 잔액 (원)
 */
export async function checkBalance(userId: number): Promise<number> {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('잔액 조회 오류:', error);
      return 0;
    }

    let balance = 0;

    for (const transaction of transactions || []) {
      const metadata = transaction.metadata as Record<string, string | number | boolean> | null;

      if (transaction.type === "charge") {
        // 충전 (리워드 제외)
        if (!metadata?.isReward) {
          balance += transaction.amount;
        }
      } else if (transaction.type === "usage") {
        // 사용 (포인트 제외)
        if (metadata?.transactionType !== "point") {
          balance -= transaction.amount;
        }
      } else if (transaction.type === "refund") {
        // 환불
        balance += transaction.amount;
      } else if (transaction.type === "penalty") {
        // 페널티
        balance -= transaction.amount;
      }
    }

    return Math.max(balance, 0);
  } catch (error) {
    console.error('잔액 조회 예외:', error);
    return 0;
  }
}

/**
 * 잔액 차감
 * transactions 테이블에 usage 기록 추가
 *
 * @param userId - 사용자 ID
 * @param amount - 차감 금액
 * @param messageType - 메시지 타입
 * @param metadata - 추가 메타데이터
 */
async function deductBalance(
  userId: number,
  amount: number,
  messageType: string,
  metadata?: Record<string, string | number | boolean>
): Promise<void> {
  try {
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      amount: amount,
      type: 'usage',
      status: 'completed',
      description: `메시지 발송 (${messageType})`,
      metadata: {
        transactionType: 'advertising',
        usage_type: 'message_send',
        message_type: messageType,
        source: 'sms_tab',
        ...metadata
      },
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('잔액 차감 오류:', error);
    }
  } catch (error) {
    console.error('잔액 차감 예외:', error);
  }
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 메시지 타입별 단가 반환
 */
function getMessageCredit(messageType: 'SMS' | 'LMS' | 'MMS'): number {
  switch (messageType) {
    case 'SMS':
      return 20;
    case 'LMS':
      return 50;
    case 'MMS':
      return 200;
    default:
      return 20;
  }
}

/**
 * 메시지 발송 로그 저장
 * message_logs 테이블이 있는 경우에만 저장
 */
async function saveMessageLog(params: {
  userId: number;
  toNumber: string;
  toName?: string;
  messageContent: string;
  subject?: string;
  messageType: string;
  status: string;
  creditUsed: number;
  metadata?: Record<string, string | number | boolean>;
}): Promise<number | undefined> {
  try {
    const { data, error } = await supabase
      .from('message_logs')
      .insert({
        user_id: params.userId,
        to_number: params.toNumber,
        to_name: params.toName || '',
        message_content: params.messageContent,
        subject: params.subject || '',
        message_type: params.messageType,
        sent_at: new Date().toISOString(),
        status: params.status,
        credit_used: params.creditUsed,
        metadata: params.metadata || {},
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      // 테이블이 없으면 무시 (optional 기능)
      if (error.code === '42P01') { // relation does not exist
        return undefined;
      }
      console.error('메시지 로그 저장 오류:', error);
      return undefined;
    }

    return data?.id;
  } catch (error) {
    console.error('메시지 로그 저장 예외:', error);
    return undefined;
  }
}

/**
 * 예약 메시지 목록 조회
 */
export async function getScheduledMessages(
  userId: number,
  tableName: string = 'scheduled_messages'
) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending'])
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('예약 메시지 조회 오류:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('예약 메시지 조회 예외:', error);
    return [];
  }
}

/**
 * 예약 메시지 취소
 */
export async function cancelScheduledMessage(
  messageId: number,
  userId: number,
  tableName: string = 'scheduled_messages'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from(tableName)
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('예약 메시지 취소 오류:', error);
      return { success: false, error: '취소 실패' };
    }

    return { success: true };
  } catch (error) {
    console.error('예약 메시지 취소 예외:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}
