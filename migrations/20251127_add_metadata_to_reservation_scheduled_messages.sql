-- reservation_scheduled_messages 테이블에 metadata, subject 컬럼 추가
-- 예약 발송 기능에서 메타데이터 저장을 위해 필요

ALTER TABLE reservation_scheduled_messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE reservation_scheduled_messages
ADD COLUMN IF NOT EXISTS subject TEXT DEFAULT '';

-- 컬럼 설명 추가
COMMENT ON COLUMN reservation_scheduled_messages.metadata IS '예약 메시지 메타데이터 (source, reservation_id, template_id, message_type, from_number, image_urls 등)';
COMMENT ON COLUMN reservation_scheduled_messages.subject IS '메시지 제목 (LMS/MMS용)';
