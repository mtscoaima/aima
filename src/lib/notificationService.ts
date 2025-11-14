/**
 * SMS 알림 시스템 - 통합 알림 서비스
 *
 * MTS API를 통한 실제 SMS 발송 및 로그 저장
 */

import { createClient } from '@supabase/supabase-js';
import { NotificationEventData, NotificationTemplate } from '@/types/notificationEvents';
import { sendMessage } from '@/lib/messageSender';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 템플릿 변수 치환
 * 예: "안녕하세요 {{userName}}님" → "안녕하세요 홍길동님"
 */
function replaceTemplateVariables(
  template: string,
  data: Record<string, string | number>
): string {
  let result = template;

  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, String(value));
  }

  return result;
}

/**
 * 관리자 전화번호 목록 조회
 */
async function getAdminPhoneNumbers(): Promise<Array<{ id: number; phone: string; name: string }>> {
  const { data: admins, error } = await supabase
    .from('users')
    .select('id, phone_number, name')
    .eq('role', 'ADMIN')
    .eq('is_active', true);

  if (error) {
    console.error('❌ 관리자 조회 실패:', error);
    return [];
  }

  return (admins || [])
    .filter(admin => admin.phone_number)
    .map(admin => ({
      id: admin.id,
      phone: admin.phone_number,
      name: admin.name || '관리자'
    }));
}

/**
 * 사용자 전화번호 조회
 */
async function getUserPhoneNumber(userId: number): Promise<{ phone: string; name: string } | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('phone_number, name')
    .eq('id', userId)
    .single();

  if (error || !user || !user.phone_number) {
    console.error('❌ 사용자 전화번호 조회 실패:', error);
    return null;
  }

  return {
    phone: user.phone_number,
    name: user.name || '사용자'
  };
}

/**
 * 첫 번째 관리자 ID 조회 (시스템 메시지 발신자용)
 */
async function getFirstAdminUserId(): Promise<number> {
  const { data: admin, error } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'ADMIN')
    .eq('is_active', true)
    .order('id', { ascending: true })
    .limit(1)
    .single();

  if (error || !admin) {
    console.error('❌ 관리자 조회 실패, 기본 ID 1 사용:', error);
    return 1; // Fallback
  }

  return admin.id;
}

/**
 * 알림 발송 로그 저장
 */
async function saveNotificationLog(
  templateId: number,
  eventType: string,
  recipientUserId: number | null,
  recipientPhone: string,
  messageType: string,
  subject: string | null,
  content: string,
  status: 'LOGGED' | 'SENT' | 'FAILED',
  metadata: Record<string, unknown> = {}
): Promise<number | null> {
  const { data, error } = await supabase
    .from('sms_notification_logs')
    .insert({
      template_id: templateId,
      event_type: eventType,
      recipient_user_id: recipientUserId,
      recipient_phone_number: recipientPhone,
      message_type: messageType,
      subject: subject,
      content: content,
      status: status,
      metadata: metadata,
    })
    .select('id')
    .single();

  if (error) {
    console.error('❌ 알림 로그 저장 실패:', error);
    return null;
  }

  return data.id;
}

/**
 * 이벤트 발생 시 알림 전송
 *
 * @param eventData - 이벤트 데이터 (이벤트 타입, 사용자 ID, 템플릿 변수)
 *
 * 동작:
 * 1. event_type으로 활성화된 템플릿 조회
 * 2. is_active가 false면 로그만 남기고 종료
 * 3. recipient_type에 따라 수신자 결정
 *    - USER: eventData.userId의 전화번호
 *    - ADMIN: role='ADMIN'인 모든 사용자
 * 4. 템플릿 변수 치환
 * 5. DB에 로그 저장
 * 6. Console에 출력
 */
export async function triggerNotification(
  eventData: NotificationEventData
): Promise<void> {
  try {
    // 1. 템플릿 조회
    const { data: template, error: templateError } = await supabase
      .from('sms_notification_templates')
      .select('*')
      .eq('event_type', eventData.eventType)
      .single();

    if (templateError || !template) {
      console.error(`❌ 템플릿 조회 실패 (${eventData.eventType}):`, templateError);
      return;
    }

    // 2. 비활성화된 템플릿이면 종료
    if (!template.is_active) {
      return;
    }

    const typedTemplate = template as unknown as NotificationTemplate;

    // 3. 수신자 결정
    let recipients: Array<{ id: number | null; phone: string; name: string }> = [];

    if (typedTemplate.recipient_type === 'ADMIN') {
      // 관리자 전체
      const admins = await getAdminPhoneNumbers();
      recipients = admins.map(admin => ({
        id: admin.id,
        phone: admin.phone,
        name: admin.name
      }));
    } else if (typedTemplate.recipient_type === 'USER') {
      // 특정 사용자
      if (!eventData.userId) {
        console.error('❌ USER 타입인데 userId가 없습니다');
        return;
      }

      const userInfo = await getUserPhoneNumber(eventData.userId);
      if (!userInfo) {
        console.error(`❌ 사용자 전화번호 없음 (userId: ${eventData.userId})`);
        return;
      }

      recipients = [{
        id: eventData.userId,
        phone: userInfo.phone,
        name: userInfo.name
      }];
    }

    if (recipients.length === 0) {
      console.warn(`⚠️  수신자 없음 (${eventData.eventType})`);
      return;
    }

    // 4. 각 수신자에게 실제 메시지 발송
    for (const recipient of recipients) {
      // 템플릿 변수 치환
      const subject = typedTemplate.subject
        ? replaceTemplateVariables(typedTemplate.subject, eventData.data)
        : null;

      const content = replaceTemplateVariables(
        typedTemplate.content_template,
        eventData.data
      );

      // 발신자 ID 결정
      // 모든 시스템 메시지는 첫 번째 관리자의 번호로 발송
      const senderUserId = await getFirstAdminUserId();

      try {
        // 실제 SMS 발송 (시스템 메시지는 크레딧 차감 안 함)
        const result = await sendMessage({
          userId: senderUserId,
          toNumber: recipient.phone,
          toName: recipient.name,
          message: content,
          subject: subject || undefined,
          skipCreditDeduction: true, // ✅ 시스템 메시지는 크레딧 차감 안 함
          metadata: {
            source: 'system_notification',
            event_type: eventData.eventType,
            template_id: typedTemplate.id,
            template_name: typedTemplate.name,
          }
        });

        if (result.success) {
          // 발송 성공 시 SENT 상태로 로그 저장
          await saveNotificationLog(
            typedTemplate.id,
            eventData.eventType,
            recipient.id,
            recipient.phone,
            typedTemplate.message_type,
            subject,
            content,
            'SENT',
            {
              event_data: eventData.data,
              template_name: typedTemplate.name,
              message_id: result.messageId,
              message_type: result.messageType,
              credit_used: result.creditUsed,
            }
          );

          console.log(`✅ 시스템 알림 발송 성공 (${eventData.eventType}) → ${recipient.phone}`);
        } else {
          // 발송 실패 시 FAILED 상태로 로그 저장
          await saveNotificationLog(
            typedTemplate.id,
            eventData.eventType,
            recipient.id,
            recipient.phone,
            typedTemplate.message_type,
            subject,
            content,
            'FAILED',
            {
              event_data: eventData.data,
              template_name: typedTemplate.name,
              error: result.error || 'Unknown error',
            }
          );

          console.error(`❌ 시스템 알림 발송 실패 (${eventData.eventType}) → ${recipient.phone}: ${result.error}`);
        }
      } catch (error) {
        // 예외 발생 시 FAILED 상태로 로그 저장
        const errorMessage = error instanceof Error ? error.message : String(error);

        await saveNotificationLog(
          typedTemplate.id,
          eventData.eventType,
          recipient.id,
          recipient.phone,
          typedTemplate.message_type,
          subject,
          content,
          'FAILED',
          {
            event_data: eventData.data,
            template_name: typedTemplate.name,
            error: errorMessage,
          }
        );

        console.error(`❌ 시스템 알림 발송 중 예외 (${eventData.eventType}) → ${recipient.phone}:`, error);
      }
    }

  } catch (error) {
    console.error('❌ 알림 처리 중 오류:', error);
  }
}
