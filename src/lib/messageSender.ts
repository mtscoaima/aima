/**
 * 메시지 발송 공통 로직
 * reservations/message와 messages/send 모두에서 사용
 */

import { createClient } from "@supabase/supabase-js";
import { sendMtsSMS } from "@/lib/mtsApi";
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
  skipCreditDeduction?: boolean; // 크레딧 차감 스킵 (시스템 메시지용)
  sendRequestId?: string; // 발송 의뢰 ID (그룹화용)
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
  const { userId, fromNumber, toNumber, toName, message, subject, imageUrls, skipCreditDeduction, sendRequestId, metadata } = params;

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

  // 단가 계산 (예약관리는 80원 고정, 일반 메시지는 타입별 단가)
  const creditRequired = skipCreditDeduction ? 0 : getMessageCredit(messageType, metadata);

  // 1. 잔액 확인 (시스템 메시지는 스킵)
  if (!skipCreditDeduction) {
    const balance = await checkBalance(userId);
    if (balance < creditRequired) {
      return {
        success: false,
        messageType,
        creditUsed: 0,
        error: `광고머니가 부족합니다 (필요: ${creditRequired}원, 현재: ${balance}원)`
      };
    }
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

  // 3. 메시지 발송 (단건도 배열로 처리 - 복수 API 사용)
  let sendResult;

  // 단건 수신자 배열 생성
  const recipients = [{ phone_number: cleanPhone, message }];

  if (messageType === 'MMS' && imageUrls && imageUrls.length > 0) {
    // MMS 발송 (첫 번째 이미지만 사용 - MTS API는 최대 3개 지원하지만 현재는 1개만)
    sendResult = await sendMtsSMS(
      recipients,
      callbackNumber,
      subject || 'MMS',
      undefined, // sendDate
      imageUrls[0] // 첫 번째 이미지 URL
    );
  } else {
    // SMS/LMS 발송 (MTS API가 자동으로 90바이트 기준 판단)
    sendResult = await sendMtsSMS(
      recipients,
      callbackNumber,
      subject
    );
  }

  if (!sendResult.success) {
    // 즉시 실패: 아직 차감하지 않았으므로 환불 불필요
    // 에러 코드 로깅 (ER15: 메시지 크기 초과, ER17: 미등록 발신번호 등)

    // TODO: 전송 결과 API 연동 시, 비동기 전달 실패 케이스 처리
    // 1. 발송 성공 후 차감 완료
    // 2. 전송 결과 API에서 실패 확인 (3016, 3019 등)
    // 3. refundBalance() 호출하여 환불 처리

    return {
      success: false,
      messageType,
      creditUsed: 0,
      error: sendResult.error || '발송 실패'
    };
  }

  // 4. 잔액 차감 (시스템 메시지는 스킵)
  if (!skipCreditDeduction) {
    await deductBalance(userId, creditRequired, messageType, {
      ...metadata,
      recipient: cleanPhone,
      recipient_name: toName || '',
      from_number: callbackNumber
    });
  }

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
    sendRequestId,
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
// 발송 의뢰 관리 함수
// ============================================================================

/**
 * 발송 의뢰 생성
 * 한 번의 발송 요청을 하나의 의뢰로 그룹화
 */
export async function createSendRequest(params: {
  userId: number;
  channelType: string;
  messagePreview: string;
  totalCount: number;
  scheduledAt?: string;
  metadata?: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('send_requests')
      .insert({
        user_id: params.userId,
        channel_type: params.channelType,
        message_preview: params.messagePreview.substring(0, 100),
        total_count: params.totalCount,
        success_count: 0,
        fail_count: 0,
        status: 'processing',
        scheduled_at: params.scheduledAt || null,
        metadata: params.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error) {
      console.error('발송 의뢰 생성 오류:', error);
      return null;
    }

    return data?.id;
  } catch (error) {
    console.error('발송 의뢰 생성 예외:', error);
    return null;
  }
}

/**
 * 발송 의뢰 결과 업데이트
 */
export async function updateSendRequest(
  sendRequestId: string,
  successCount: number,
  failCount: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('send_requests')
      .update({
        success_count: successCount,
        fail_count: failCount,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', sendRequestId);

    if (error) {
      console.error('발송 의뢰 업데이트 오류:', error);
    }
  } catch (error) {
    console.error('발송 의뢰 업데이트 예외:', error);
  }
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
    // 기본 insert 데이터
    const insertData: Record<string, unknown> = {
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
        source: metadata?.source || 'sms_tab',
        from_number: fromNumber,
        image_urls: imageUrls && imageUrls.length > 0 ? JSON.stringify(imageUrls) : null
      }
    };

    // reservation_scheduled_messages 테이블인 경우 reservation_id 추가
    if (tableName === 'reservation_scheduled_messages' && metadata?.reservation_id) {
      insertData.reservation_id = metadata.reservation_id;
    }

    const { data, error } = await supabase
      .from(tableName)
      .insert(insertData)
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
 * 사용자 잔액 확인 (광고머니 + 포인트 합산)
 * transactions 테이블에서 계산
 * 포인트가 있으면 광고머니보다 포인트를 먼저 사용하는 정책 반영
 *
 * @param userId - 사용자 ID
 * @returns 총 사용 가능 잔액 (광고머니 + 포인트)
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

    let creditBalance = 0; // 광고머니
    let pointBalance = 0;  // 포인트

    for (const transaction of transactions || []) {
      const metadata = transaction.metadata as Record<string, string | number | boolean> | null;

      if (transaction.type === "charge") {
        if (metadata?.isReward) {
          // 포인트 충전
          pointBalance += transaction.amount;
        } else {
          // 광고머니 충전
          creditBalance += transaction.amount;
        }
      } else if (transaction.type === "usage") {
        if (metadata?.transactionType === "point") {
          // 포인트 사용
          pointBalance -= transaction.amount;
        } else {
          // 광고머니 사용
          creditBalance -= transaction.amount;
        }
      } else if (transaction.type === "refund") {
        // 환불 (광고머니로 처리)
        creditBalance += transaction.amount;
      } else if (transaction.type === "penalty") {
        // 페널티 (광고머니에서 차감)
        creditBalance -= transaction.amount;
      }
    }

    // 총 사용 가능 잔액 = 광고머니 + 포인트
    const totalBalance = Math.max(creditBalance, 0) + Math.max(pointBalance, 0);
    return totalBalance;
  } catch (error) {
    console.error('잔액 조회 예외:', error);
    return 0;
  }
}

/**
 * 잔액 차감 (포인트 우선 사용)
 * 포인트가 있으면 포인트를 먼저 사용하고, 부족하면 광고머니에서 차감
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
    // 현재 포인트 잔액 계산
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed');

    if (fetchError) {
      console.error('트랜잭션 조회 오류:', fetchError);
      return;
    }

    let pointBalance = 0;
    for (const transaction of transactions || []) {
      const txMetadata = transaction.metadata as Record<string, string | number | boolean> | null;
      if (transaction.type === "charge" && txMetadata?.isReward) {
        pointBalance += transaction.amount;
      } else if (transaction.type === "usage" && txMetadata?.transactionType === "point") {
        pointBalance -= transaction.amount;
      }
    }
    pointBalance = Math.max(pointBalance, 0);

    // 포인트 우선 사용, 부족분은 광고머니에서 차감
    let pointUsage = 0;
    let creditUsage = 0;

    if (pointBalance >= amount) {
      // 포인트만으로 충분한 경우
      pointUsage = amount;
    } else {
      // 포인트 부족 - 포인트 전액 사용 + 나머지는 광고머니
      pointUsage = pointBalance;
      creditUsage = amount - pointBalance;
    }

    // 포인트 차감 기록
    if (pointUsage > 0) {
      const { error: pointError } = await supabase.from('transactions').insert({
        user_id: userId,
        amount: pointUsage,
        type: 'usage',
        status: 'completed',
        description: `메시지 발송 - 포인트 (${messageType})`,
        metadata: {
          transactionType: 'point',
          usage_type: 'message_send',
          message_type: messageType,
          source: 'sms_tab',
          ...metadata
        },
        created_at: new Date().toISOString()
      });

      if (pointError) {
        console.error('포인트 차감 오류:', pointError);
      }
    }

    // 광고머니 차감 기록
    if (creditUsage > 0) {
      const { error: creditError } = await supabase.from('transactions').insert({
        user_id: userId,
        amount: creditUsage,
        type: 'usage',
        status: 'completed',
        description: `메시지 발송 - 광고머니 (${messageType})`,
        metadata: {
          transactionType: 'advertising',
          usage_type: 'message_send',
          message_type: messageType,
          source: 'sms_tab',
          ...metadata
        },
        created_at: new Date().toISOString()
      });

      if (creditError) {
        console.error('광고머니 차감 오류:', creditError);
      }
    }
  } catch (error) {
    console.error('잔액 차감 예외:', error);
  }
}

/**
 * 잔액 환불
 * transactions 테이블에 refund 기록 추가
 *
 * @param userId - 사용자 ID
 * @param amount - 환불 금액
 * @param reason - 환불 사유
 * @param metadata - 추가 메타데이터
 * @returns 환불 성공 여부
 */
export async function refundBalance(
  userId: number,
  amount: number,
  reason: string,
  metadata?: Record<string, string | number | boolean>
): Promise<boolean> {
  try {
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      amount: amount,
      type: 'refund',
      status: 'completed',
      description: reason,
      metadata: {
        transactionType: 'advertising',
        refund_reason: reason,
        ...metadata
      },
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error('잔액 환불 오류:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('잔액 환불 예외:', error);
    return false;
  }
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 메시지 타입별 단가 반환
 */
function getMessageCredit(
  messageType: 'SMS' | 'LMS' | 'MMS',
  metadata?: Record<string, unknown>
): number {
  // 예약관리 출처인 경우 80원 고정 (정책표 기준)
  if (metadata?.source === 'reservation') {
    return 80;
  }

  // 일반 메시지
  switch (messageType) {
    case 'SMS':
      return 25;
    case 'LMS':
      return 50;
    case 'MMS':
      return 100;
    default:
      return 25;
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
  sendRequestId?: string;
  metadata?: Record<string, string | number | boolean>;
}): Promise<number | undefined> {
  try {
    const insertData: Record<string, unknown> = {
      user_id: params.userId,
      to_number: params.toNumber,
      to_name: params.toName || null,
      message_content: params.messageContent,
      subject: params.subject || null,
      message_type: params.messageType,
      sent_at: new Date().toISOString(),
      status: params.status,
      credit_used: params.creditUsed,
      metadata: params.metadata || {},
      created_at: new Date().toISOString()
    };

    // send_request_id가 있으면 추가
    if (params.sendRequestId) {
      insertData.send_request_id = params.sendRequestId;
    }

    const { data, error } = await supabase
      .from('message_logs')
      .insert(insertData)
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
