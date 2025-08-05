/**
 * SMS 알림 발송 유틸리티
 * 실제 SMS 서비스 (예: 아임포트, KakaoTalk Business API, CoolSMS 등)와 연동하여 사용
 */

export interface SMSMessage {
  to: string; // 수신자 전화번호
  message: string; // 메시지 내용
  from?: string; // 발신자 번호 (옵션)
  subject?: string; // 제목 (LMS의 경우)
  type?: "SMS" | "LMS" | "MMS"; // 메시지 타입
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
 * 단일 SMS 발송
 */
export async function sendSMS(message: SMSMessage): Promise<SMSResult> {
  try {
    // TODO: 실제 SMS 서비스와 연동
    // 예시: CoolSMS API 연동
    /*
    const smsApi = new CoolSMS({
      apiKey: process.env.SMS_API_KEY,
      apiSecret: process.env.SMS_API_SECRET
    });

    const result = await smsApi.send({
      to: message.to,
      from: message.from || process.env.SMS_SENDER_NUMBER,
      text: message.message,
      type: message.type || 'SMS'
    });

    return {
      success: result.success,
      messageId: result.messageId,
      cost: result.cost
    };
    */

    // 현재는 개발 모드로 로그만 출력
    console.log("SMS 발송:", {
      to: message.to,
      message: message.message,
      type: message.type || "SMS",
    });

    // 개발 환경에서는 항상 성공으로 처리
    return {
      success: true,
      messageId: `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
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
  inquiryTitle: string,
  inquiryId: number
): Promise<SMSResult> {
  const message = generateInquiryReplyMessage(
    userName,
    inquiryTitle,
    inquiryId
  );

  return await sendSMS({
    to: formatPhoneNumber(phoneNumber),
    message,
    type: "SMS",
  });
}

/**
 * 문의 상태 변경 알림 SMS 발송
 */
export async function sendInquiryStatusNotification(
  phoneNumber: string,
  userName: string,
  inquiryTitle: string,
  status: string,
  inquiryId: number
): Promise<SMSResult> {
  const statusText = getStatusText(status);
  const message = `안녕하세요 ${userName}님, '${inquiryTitle}' 문의의 상태가 '${statusText}'로 변경되었습니다. 고객센터에서 확인하세요.`;

  return await sendSMS({
    to: formatPhoneNumber(phoneNumber),
    message,
    type: "SMS",
  });
}

/**
 * 문의 답변 완료 메시지 생성
 */
function generateInquiryReplyMessage(
  userName: string,
  inquiryTitle: string,
  inquiryId: number
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://yoursite.com";
  const inquiryUrl = `${baseUrl}/support?inquiry=${inquiryId}`;

  // SMS 길이 제한 고려 (한글 기준 90자 내외)
  const shortTitle =
    inquiryTitle.length > 15
      ? inquiryTitle.substring(0, 15) + "..."
      : inquiryTitle;

  return `안녕하세요 ${userName}님, '${shortTitle}' 문의에 답변이 등록되었습니다. 고객센터를 확인해주세요.`;
}

/**
 * 전화번호 형식 정규화
 */
function formatPhoneNumber(phoneNumber: string): string {
  // 모든 특수문자 제거
  const cleaned = phoneNumber.replace(/\D/g, "");

  // 국가코드 처리
  if (cleaned.startsWith("82")) {
    return "+" + cleaned;
  } else if (
    cleaned.startsWith("010") ||
    cleaned.startsWith("011") ||
    cleaned.startsWith("016") ||
    cleaned.startsWith("017") ||
    cleaned.startsWith("018") ||
    cleaned.startsWith("019")
  ) {
    return "+82" + cleaned.substring(1);
  }

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
