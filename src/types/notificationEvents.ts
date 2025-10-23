/**
 * SMS 알림 시스템 - 이벤트 타입 정의
 */

export enum NotificationEventType {
  USER_SIGNUP = 'user.signup',
  COMPANY_REGISTERED = 'company.registered',
  CAMPAIGN_CREATED = 'campaign.created',
  CAMPAIGN_APPROVED = 'campaign.approved',
  SENDER_NUMBER_REGISTERED = 'sender_number.registered',
}

export interface NotificationEventData {
  eventType: NotificationEventType;
  userId?: number;  // 이벤트 주체 사용자 (USER 타입일 때 수신자)
  data: Record<string, string | number>;  // 템플릿 변수 데이터
}

export interface NotificationTemplate {
  id: number;
  event_type: string;
  name: string;
  recipient_type: 'USER' | 'ADMIN';
  message_type: 'SMS' | 'LMS';
  subject: string | null;
  content_template: string;
  variables: Record<string, string> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: number;
  template_id: number | null;
  event_type: string;
  recipient_user_id: number | null;
  recipient_phone_number: string;
  message_type: string;
  subject: string | null;
  content: string;
  status: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
