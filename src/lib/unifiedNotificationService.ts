/**
 * 통합 알림 서비스
 *
 * SMS, 이메일, 인앱 알림을 하나의 함수로 처리
 */

import { createClient } from "@supabase/supabase-js";
import { triggerNotification } from "./notificationService";
import { sendEmail } from "./emailUtils";
import { NotificationEventType } from "@/types/notificationEvents";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 인앱 알림 타입
type InAppNotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

// 통합 알림 파라미터
interface UnifiedNotificationParams {
  // 이벤트 정보
  eventType: NotificationEventType;
  userId?: number;

  // 인앱 알림
  inAppTitle: string;
  inAppMessage: string;
  inAppType?: InAppNotificationType;
  actionUrl?: string;

  // SMS 템플릿 변수 (triggerNotification용)
  smsData?: Record<string, string | number>;

  // 이메일
  emailTo?: string; // 이메일 주소 (없으면 userId로 조회)
  emailSubject?: string;
  emailHtml?: string;
  emailText?: string;

  // 채널별 on/off 옵션
  sendSms?: boolean;
  sendEmail?: boolean;
  sendInApp?: boolean;
}

// 통합 알림 결과
interface UnifiedNotificationResult {
  success: boolean;
  inApp?: { success: boolean; error?: string };
  sms?: { success: boolean; error?: string };
  email?: { success: boolean; error?: string };
}

/**
 * 사용자 이메일 조회
 */
async function getUserEmail(userId: number): Promise<string | null> {
  const { data: user, error } = await supabase
    .from("users")
    .select("email")
    .eq("id", userId)
    .single();

  if (error || !user) {
    return null;
  }

  return user.email;
}

/**
 * 인앱 알림 저장
 */
async function saveInAppNotification(params: {
  recipientUserId: number;
  title: string;
  message: string;
  type: InAppNotificationType;
  actionUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("notifications").insert({
      recipient_user_id: params.recipientUserId,
      title: params.title,
      message: params.message,
      type: params.type,
      action_url: params.actionUrl || null,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("인앱 알림 저장 실패:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("인앱 알림 저장 중 예외:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * 통합 알림 발송
 *
 * SMS, 이메일, 인앱 알림을 동시에 처리합니다.
 *
 * @example
 * ```typescript
 * import { sendUnifiedNotification } from "@/lib/unifiedNotificationService";
 * import { createWelcomeEmailTemplate } from "@/lib/emailUtils";
 * import { NotificationEventType } from "@/types/notificationEvents";
 *
 * // 회원가입 성공 후
 * const emailTemplate = createWelcomeEmailTemplate(user.name);
 *
 * await sendUnifiedNotification({
 *   eventType: NotificationEventType.USER_SIGNUP,
 *   userId: user.id,
 *
 *   // 인앱 알림
 *   inAppTitle: "회원가입을 환영합니다!",
 *   inAppMessage: "MTS플러스 서비스 가입이 완료되었습니다.",
 *   inAppType: "SUCCESS",
 *   actionUrl: "/dashboard",
 *
 *   // SMS
 *   smsData: { userName: user.name },
 *
 *   // 이메일
 *   sendEmail: true,
 *   emailSubject: emailTemplate.subject,
 *   emailHtml: emailTemplate.html,
 *   emailText: emailTemplate.text,
 * });
 * ```
 */
export async function sendUnifiedNotification(
  params: UnifiedNotificationParams
): Promise<UnifiedNotificationResult> {
  const {
    eventType,
    userId,
    inAppTitle,
    inAppMessage,
    inAppType = "INFO",
    actionUrl,
    smsData,
    emailTo,
    emailSubject,
    emailHtml,
    emailText,
    sendSms = true,
    sendEmail: shouldSendEmail = false,
    sendInApp = true,
  } = params;

  const result: UnifiedNotificationResult = {
    success: true,
  };

  // 1. 인앱 알림 저장
  if (sendInApp && userId) {
    const inAppResult = await saveInAppNotification({
      recipientUserId: userId,
      title: inAppTitle,
      message: inAppMessage,
      type: inAppType,
      actionUrl,
    });

    result.inApp = inAppResult;
    if (!inAppResult.success) {
      result.success = false;
    }
  }

  // 2. SMS 알림 발송
  if (sendSms && smsData) {
    try {
      await triggerNotification({
        eventType,
        userId,
        data: smsData,
      });
      result.sms = { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("SMS 알림 발송 실패:", error);
      result.sms = { success: false, error: errorMessage };
      result.success = false;
    }
  }

  // 3. 이메일 발송
  if (shouldSendEmail && emailSubject && (emailHtml || emailText)) {
    try {
      // 이메일 주소 결정
      let targetEmail = emailTo;
      if (!targetEmail && userId) {
        targetEmail = await getUserEmail(userId) ?? undefined;
      }

      if (targetEmail) {
        const emailResult = await sendEmail({
          to: targetEmail,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        });

        result.email = {
          success: emailResult.success,
          error: emailResult.success ? undefined : String(emailResult.error),
        };

        if (!emailResult.success) {
          result.success = false;
        }
      } else {
        result.email = { success: false, error: "이메일 주소를 찾을 수 없습니다" };
        result.success = false;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("이메일 발송 실패:", error);
      result.email = { success: false, error: errorMessage };
      result.success = false;
    }
  }

  // 결과 로그
  const channels = [];
  if (result.inApp) channels.push(`인앱:${result.inApp.success ? "성공" : "실패"}`);
  if (result.sms) channels.push(`SMS:${result.sms.success ? "성공" : "실패"}`);
  if (result.email) channels.push(`이메일:${result.email.success ? "성공" : "실패"}`);

  if (channels.length > 0) {
    console.log(`📬 통합 알림 발송 (${eventType}): ${channels.join(", ")}`);
  }

  return result;
}

/**
 * 회원가입 환영 알림 발송 (헬퍼 함수)
 *
 * SMS, 이메일, 인앱 알림을 모두 발송합니다.
 */
export async function sendWelcomeNotification(params: {
  userId: number;
  userName: string;
  userEmail?: string;
}): Promise<UnifiedNotificationResult> {
  const { userId, userName, userEmail } = params;

  // 동적 import로 순환 참조 방지
  const { createWelcomeEmailTemplate } = await import("./emailUtils");
  const emailTemplate = createWelcomeEmailTemplate(userName);

  return sendUnifiedNotification({
    eventType: NotificationEventType.USER_SIGNUP,
    userId,

    // 인앱 알림
    inAppTitle: "회원가입을 환영합니다!",
    inAppMessage:
      "MTS플러스 서비스 가입이 완료되었습니다. 지금 바로 시작해보세요.",
    inAppType: "SUCCESS",
    actionUrl: "/dashboard",

    // SMS
    smsData: { userName },

    // 이메일
    sendEmail: true,
    emailTo: userEmail,
    emailSubject: emailTemplate.subject,
    emailHtml: emailTemplate.html,
    emailText: emailTemplate.text,
  });
}

/**
 * 기업 인증 완료 알림 발송 (헬퍼 함수)
 */
export async function sendCompanyVerifiedNotification(params: {
  userId: number;
  userName: string;
  companyName: string;
  userEmail?: string;
}): Promise<UnifiedNotificationResult> {
  const { userId, userName, companyName, userEmail } = params;

  // 동적 import
  const { createCampaignReadyEmailTemplate } = await import("./emailUtils");
  const emailTemplate = createCampaignReadyEmailTemplate(userName, companyName);

  return sendUnifiedNotification({
    eventType: NotificationEventType.COMPANY_REGISTERED,
    userId,

    // 인앱 알림
    inAppTitle: "기업 인증이 완료되었습니다",
    inAppMessage: `${companyName}의 기업 인증이 완료되었습니다. 이제 캠페인을 등록할 수 있습니다.`,
    inAppType: "SUCCESS",
    actionUrl: "/campaigns/create",

    // SMS
    smsData: { userName, companyName },

    // 이메일
    sendEmail: true,
    emailTo: userEmail,
    emailSubject: emailTemplate.subject,
    emailHtml: emailTemplate.html,
    emailText: emailTemplate.text,
  });
}

/**
 * 캠페인 승인 알림 발송 (헬퍼 함수)
 */
export async function sendCampaignApprovedNotification(params: {
  userId: number;
  userName: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  userEmail?: string;
}): Promise<UnifiedNotificationResult> {
  const { userId, userName, campaignName, startDate, endDate, userEmail } =
    params;

  // 동적 import
  const { createCampaignApprovedEmailTemplate } = await import("./emailUtils");
  const emailTemplate = createCampaignApprovedEmailTemplate(
    userName,
    campaignName,
    startDate,
    endDate
  );

  return sendUnifiedNotification({
    eventType: NotificationEventType.CAMPAIGN_APPROVED,
    userId,

    // 인앱 알림
    inAppTitle: "캠페인이 승인되었습니다",
    inAppMessage: `"${campaignName}" 캠페인이 승인되었습니다. 설정하신 조건에 따라 광고가 노출됩니다.`,
    inAppType: "SUCCESS",
    actionUrl: "/campaigns",

    // SMS
    smsData: { userName, campaignName, startDate, endDate },

    // 이메일
    sendEmail: true,
    emailTo: userEmail,
    emailSubject: emailTemplate.subject,
    emailHtml: emailTemplate.html,
    emailText: emailTemplate.text,
  });
}

