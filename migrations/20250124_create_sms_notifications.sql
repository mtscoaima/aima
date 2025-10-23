-- =====================================================
-- SMS 알림 시스템 테이블 생성
-- 작성일: 2025-01-24
-- 설명: SMS/LMS 알림 템플릿 및 발송 로그 관리
-- =====================================================

-- 1. SMS 알림 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS sms_notification_templates (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL UNIQUE,  -- 이벤트 타입 (예: 'user.signup')
  name VARCHAR(200) NOT NULL,                -- 템플릿 이름 (한글)
  recipient_type VARCHAR(20) NOT NULL,       -- 'USER' | 'ADMIN'
  message_type VARCHAR(10) NOT NULL,         -- 'SMS' | 'LMS'
  subject VARCHAR(100),                      -- LMS 제목 (LMS일 경우)
  content_template TEXT NOT NULL,            -- 메시지 내용 ({{변수}} 형식)
  variables JSONB,                           -- 사용 가능한 변수 설명
  is_active BOOLEAN DEFAULT TRUE,            -- ON/OFF 토글
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. SMS 발송 로그 테이블 생성
CREATE TABLE IF NOT EXISTS sms_notification_logs (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES sms_notification_templates(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  recipient_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  recipient_phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(10) NOT NULL,
  subject VARCHAR(100),
  content TEXT NOT NULL,                     -- 실제 발송될 내용 (변수 치환 후)
  status VARCHAR(20) DEFAULT 'LOGGED',       -- 'LOGGED' (실제 전송 안함)
  metadata JSONB,                            -- 추가 정보
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sms_templates_event_type ON sms_notification_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_sms_templates_is_active ON sms_notification_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_sms_logs_event_type ON sms_notification_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_notification_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_recipient_user ON sms_notification_logs(recipient_user_id);

-- 4. 초기 템플릿 데이터 삽입 (5개)
INSERT INTO sms_notification_templates (event_type, name, recipient_type, message_type, subject, content_template, variables) VALUES

-- 1. 회원가입 축하 LMS
('user.signup', '회원가입 축하문자', 'USER', 'LMS', '[예미마] 회원가입을 환영합니다!',
'[예미마] 회원가입을 환영합니다!
앞으로 맞춤형 마케팅 혜택과 다양한 지원 서비스를 편리하게 이용하실 수 있습니다.

첫번째게 타겟팅한 목표고객이 완성결제 시 광고노출!

[예탁1]
10만원 충전 시, 10만 포인트 추가지급
기간 연장 1+1 혜택, 총 20만원 광고머니

[예탁2]
중고나라 ''맛집'' 게시판 홍보
2,300만 회원 대상 게시판 단독운영 – 플레이스 순위 상승 기대
월 4회 (9.9만원 상당)

광고문의 : 070-8824-1139 / aima@mtsco.co.kr',
'{"userName": "사용자 이름"}'),

-- 2. 기업 검수요청 SMS
('company.registered', '기업 검수요청', 'ADMIN', 'SMS', NULL,
'기업 검수요청 : [{{companyName}}][{{userName}}]',
'{"companyName": "법인명", "userName": "계정"}'),

-- 3. 캠페인 검수요청 SMS
('campaign.created', '캠페인 검수요청', 'ADMIN', 'SMS', NULL,
'캠페인 검수요청 : [{{companyName}}][{{userName}}][{{campaignName}}]',
'{"companyName": "법인명", "userName": "계정", "campaignName": "캠페인명"}'),

-- 4. 캠페인 검수완료 SMS
('campaign.approved', '캠페인 검수완료', 'USER', 'SMS', NULL,
'캠페인이 최종등록되었습니다.
- 캠페인명 : {{campaignName}}
- 캠페인기간 : {{startDate}} ~ {{endDate}}',
'{"campaignName": "캠페인명", "startDate": "시작일", "endDate": "종료일"}'),

-- 5. 발신번호 검수요청 SMS
('sender_number.registered', '발신번호 검수요청', 'ADMIN', 'SMS', NULL,
'발신번호 검수요청 : [{{companyName}}][{{userName}}]',
'{"companyName": "법인명", "userName": "계정"}');

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ SMS 알림 시스템 테이블 생성 완료!';
  RAISE NOTICE '  - sms_notification_templates: 5개 초기 템플릿';
  RAISE NOTICE '  - sms_notification_logs: 발송 로그 테이블';
  RAISE NOTICE '  - 5개 인덱스 생성 완료';
END $$;
