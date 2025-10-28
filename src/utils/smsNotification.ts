/**
 * SMS 알림 발송 유틸리티
 * MTS API를 사용하여 SMS/LMS/MMS 발송
 */

import { sendMtsSMS, sendMtsMMS } from "@/lib/mtsApi";

export interface SMSMessage {
  to: string; // 수신자 전화번호
  message: string; // 메시지 내용
  from?: string; // 발신자 번호 (옵션)
  subject?: string; // 제목 (LMS의 경우)
  type?: "SMS" | "LMS" | "MMS"; // 메시지 타입
  imageUrls?: string[]; // MMS 이미지 URL (MTS 업로드 후 받은 경로)
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export interface SMSBatchResult {
  total: number;
  success: number;
  failed: number;
  results: Array<SMSResult & { to: string }>;
}

/**
 * 시스템 대표 발신번호 조회
 * system_settings.site_settings.contact_phone 사용
 * Fallback: 070-8824-1139 (Footer 대표번호)
 */
async function getSystemCallbackNumber(): Promise<string> {
  try {
    // Supabase 클라이언트를 동적으로 import하여 순환 참조 방지
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: settings } = await supabase
      .from('system_settings')
      .select('site_settings')
      .limit(1)
      .single();

    const siteSettings = (settings?.site_settings as Record<string, unknown>) || {};
    return (siteSettings.contact_phone as string) || '070-8824-1139';
  } catch (error) {
    console.error('시스템 발신번호 조회 오류:', error);
    return '070-8824-1139'; // Fallback
  }
}

/**
 * 단일 SMS 발송
 */
export async function sendSMS(message: SMSMessage): Promise<SMSResult> {
  try {
    // 전화번호 형식 검증
    const formattedPhoneNumber = formatPhoneNumber(message.to);
    if (!validatePhoneNumber(formattedPhoneNumber)) {
      throw new Error("유효하지 않은 전화번호입니다.");
    }

    // 발신번호 결정: message.from이 있으면 사용, 없으면 시스템 대표번호
    const callbackNumber = message.from || await getSystemCallbackNumber();

    let result;

    // MMS 발송 (이미지가 있는 경우)
    if (
      message.type === "MMS" &&
      message.imageUrls &&
      message.imageUrls.length > 0
    ) {
      result = await sendMtsMMS(
        formattedPhoneNumber,
        message.message,
        message.subject || "",
        message.imageUrls,
        callbackNumber
      );
    } else {
      // SMS/LMS 발송 (MTS API에서 자동 판단)
      result = await sendMtsSMS(
        formattedPhoneNumber,
        message.message,
        callbackNumber
      );
    }

    if (result.success) {
      return {
        success: true,
        messageId: result.msgId,
        cost: calculateSMSCost(message.message, message.type),
      };
    } else {
      throw new Error(result.error || "SMS 발송 실패");
    }
  } catch (error) {
    console.error("SMS 발송 오류:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "SMS 발송 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 다중 SMS 발송
 */
export async function sendBatchSMS(
  messages: SMSMessage[]
): Promise<SMSBatchResult> {
  const results: Array<SMSResult & { to: string }> = [];
  let successCount = 0;
  let failedCount = 0;

  for (const message of messages) {
    const result = await sendSMS(message);

    results.push({
      to: message.to,
      ...result,
    });

    if (result.success) {
      successCount++;
    } else {
      failedCount++;
    }
  }

  return {
    total: messages.length,
    success: successCount,
    failed: failedCount,
    results,
  };
}

/**
 * 문의 답변 완료 알림 SMS 발송
 */
export async function sendInquiryReplyNotification(
  phoneNumber: string,
  userName: string,
  inquiryTitle: string
): Promise<SMSResult> {
  const message = generateInquiryReplyMessage(userName, inquiryTitle);

  return await sendSMS({
    to: formatPhoneNumber(phoneNumber),
    message,
    type: "SMS",
    // from 없음: 시스템 대표번호 사용
  });
}

/**
 * 문의 상태 변경 알림 SMS 발송
 */
export async function sendInquiryStatusNotification(
  phoneNumber: string,
  userName: string,
  inquiryTitle: string,
  status: string
): Promise<SMSResult> {
  const statusText = getStatusText(status);
  const message = `안녕하세요 ${userName}님, '${inquiryTitle}' 문의의 상태가 '${statusText}'로 변경되었습니다. 고객센터에서 확인하세요.`;

  return await sendSMS({
    to: formatPhoneNumber(phoneNumber),
    message,
    type: "SMS",
    // from 없음: 시스템 대표번호 사용
  });
}

/**
 * 문의 답변 완료 메시지 생성
 */
function generateInquiryReplyMessage(
  userName: string,
  inquiryTitle: string
): string {
  // SMS 길이 제한 고려 (한글 기준 90자 내외)
  const shortTitle =
    inquiryTitle.length > 15
      ? inquiryTitle.substring(0, 15) + "..."
      : inquiryTitle;

  return `안녕하세요 ${userName}님, '${shortTitle}' 문의에 답변이 등록되었습니다. 고객센터를 확인해주세요.`;
}

/**
 * 전화번호 형식 정규화 (MTS API용 - 하이픈 제거)
 */
function formatPhoneNumber(phoneNumber: string): string {
  // 모든 특수문자 제거
  const cleaned = phoneNumber.replace(/\D/g, "");

  // 이미 올바른 형식인 경우 (11자리 휴대폰 번호)
  if (cleaned.length === 11 && cleaned.startsWith("010")) {
    return cleaned;
  }

  // 국가코드가 포함된 경우 (+82로 시작)
  if (cleaned.startsWith("82") && cleaned.length === 12) {
    return "0" + cleaned.substring(2);
  }

  // 기본적으로 그대로 반환 (이미 올바른 형식이라고 가정)
  return cleaned;
}

/**
 * 상태 텍스트 변환
 */
function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "접수완료",
    ANSWERED: "답변완료",
    CLOSED: "처리완료",
  };

  return statusMap[status] || status;
}

/**
 * 전화번호 유효성 검사
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const cleaned = phoneNumber.replace(/\D/g, "");

  // 한국 휴대폰 번호 패턴 (010, 011, 016, 017, 018, 019로 시작하는 11자리)
  const mobilePattern = /^01[0-9]\d{7,8}$/;

  // 한국 일반전화 번호 패턴 (02, 03~, 04~, 05~, 06~로 시작)
  const landlinePattern = /^(02|0[3-6][0-9])\d{6,8}$/;

  return mobilePattern.test(cleaned) || landlinePattern.test(cleaned);
}

/**
 * SMS 발송 비용 계산 (예시)
 */
export function calculateSMSCost(
  message: string,
  type: "SMS" | "LMS" | "MMS" = "SMS"
): number {
  const costs = {
    SMS: 20, // 20원 (90바이트 이하)
    LMS: 40, // 40원 (2000바이트 이하)
    MMS: 200, // 200원 (이미지 포함)
  };

  // 메시지 길이에 따른 타입 자동 결정
  const byteLength = new TextEncoder().encode(message).length;

  if (type === "SMS" && byteLength > 90) {
    type = "LMS";
  }

  return costs[type];
}

/**
 * SMS 발송 가능 시간 확인 (야간 발송 제한)
 */
export function canSendSMS(now: Date = new Date()): boolean {
  const hour = now.getHours();

  // 오전 8시부터 오후 10시까지만 발송 가능
  return hour >= 8 && hour < 22;
}

/**
 * SMS 발송 예약 (야간 시간대인 경우 다음날 오전 8시로 예약)
 */
export function getNextSendTime(now: Date = new Date()): Date {
  if (canSendSMS(now)) {
    return now; // 즉시 발송 가능
  }

  const nextSendTime = new Date(now);

  if (now.getHours() >= 22) {
    // 오후 10시 이후인 경우 다음날 오전 8시
    nextSendTime.setDate(nextSendTime.getDate() + 1);
    nextSendTime.setHours(8, 0, 0, 0);
  } else {
    // 오전 8시 이전인 경우 당일 오전 8시
    nextSendTime.setHours(8, 0, 0, 0);
  }

  return nextSendTime;
}

/**
 * SMS 템플릿 관리
 */
export const SMS_TEMPLATES = {
  INQUIRY_REPLY: (userName: string, inquiryTitle: string) =>
    `안녕하세요 ${userName}님, '${inquiryTitle}' 문의에 답변이 등록되었습니다. 고객센터를 확인해주세요.`,

  INQUIRY_RECEIVED: (userName: string, inquiryTitle: string) =>
    `안녕하세요 ${userName}님, '${inquiryTitle}' 문의가 접수되었습니다. 빠른 시일 내에 답변드리겠습니다.`,

  INQUIRY_STATUS_CHANGE: (
    userName: string,
    inquiryTitle: string,
    status: string
  ) =>
    `안녕하세요 ${userName}님, '${inquiryTitle}' 문의 상태가 '${getStatusText(
      status
    )}'로 변경되었습니다.`,
};
