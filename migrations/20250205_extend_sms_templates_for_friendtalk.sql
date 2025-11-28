-- ============================================================================
-- 친구톡 지원을 위한 sms_message_templates 테이블 확장
-- ============================================================================
-- 작성일: 2025-02-05
-- 목적: 친구톡 템플릿 저장을 위한 필드 추가
-- 영향: sms_message_templates 테이블에 4개 컬럼 추가
-- ============================================================================

-- 1. 컬럼 추가
ALTER TABLE sms_message_templates
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'SMS',
ADD COLUMN IF NOT EXISTS buttons JSONB,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_link TEXT;

-- 2. 기존 데이터 message_type 업데이트
UPDATE sms_message_templates
SET message_type = 'SMS'
WHERE message_type IS NULL;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_sms_templates_message_type
ON sms_message_templates(message_type);

CREATE INDEX IF NOT EXISTS idx_sms_templates_user_type
ON sms_message_templates(user_id, message_type);

-- 4. 컬럼 코멘트 추가
COMMENT ON COLUMN sms_message_templates.message_type IS '메시지 타입: SMS, LMS, MMS, FRIENDTALK 등';
COMMENT ON COLUMN sms_message_templates.buttons IS '친구톡 버튼 정보 (JSONB 배열)';
COMMENT ON COLUMN sms_message_templates.image_url IS '친구톡 이미지 URL (Kakao 서버)';
COMMENT ON COLUMN sms_message_templates.image_link IS '친구톡 이미지 클릭 링크';

-- ============================================================================
-- 마이그레이션 완료
-- ============================================================================
