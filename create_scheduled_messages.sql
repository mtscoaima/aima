-- ============================================================================
-- 메시지 발송 기능 DB 마이그레이션
-- ============================================================================
-- 작성일: 2025-10-13
-- 목적: messages/send 페이지용 예약 메시지 및 발송 로그 테이블 생성
-- ============================================================================

-- 1. scheduled_messages 테이블 생성
-- messages/send 페이지 전용 예약 메시지
-- ============================================================================
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_number VARCHAR(20) NOT NULL,
  to_name VARCHAR(100),
  message_content TEXT NOT NULL,
  subject VARCHAR(100),
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_id ON scheduled_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status ON scheduled_messages(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_scheduled_at ON scheduled_messages(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_user_status ON scheduled_messages(user_id, status);

-- 코멘트 추가
COMMENT ON TABLE scheduled_messages IS 'messages/send 페이지 예약 메시지';
COMMENT ON COLUMN scheduled_messages.id IS '예약 메시지 ID';
COMMENT ON COLUMN scheduled_messages.user_id IS '사용자 ID';
COMMENT ON COLUMN scheduled_messages.to_number IS '수신 전화번호 (숫자만)';
COMMENT ON COLUMN scheduled_messages.to_name IS '수신자 이름';
COMMENT ON COLUMN scheduled_messages.message_content IS '메시지 내용';
COMMENT ON COLUMN scheduled_messages.subject IS '메시지 제목 (LMS/MMS용)';
COMMENT ON COLUMN scheduled_messages.scheduled_at IS '예약 발송 시간';
COMMENT ON COLUMN scheduled_messages.status IS '상태 (pending/sent/failed/cancelled)';
COMMENT ON COLUMN scheduled_messages.sent_at IS '실제 발송 시간';
COMMENT ON COLUMN scheduled_messages.error_message IS '발송 실패 시 에러 메시지';
COMMENT ON COLUMN scheduled_messages.metadata IS '추가 정보 (JSON)';


-- 2. message_logs 테이블 생성 (선택 사항)
-- 모든 메시지 발송 내역 로그
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_number VARCHAR(20) NOT NULL,
  to_name VARCHAR(100),
  message_content TEXT NOT NULL,
  subject VARCHAR(100),
  message_type VARCHAR(10) NOT NULL CHECK (message_type IN ('SMS', 'LMS', 'MMS')),
  sent_at TIMESTAMP,
  status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed')),
  error_message TEXT,
  credit_used INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_message_logs_user_id ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_sent_at ON message_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_message_logs_message_type ON message_logs(message_type);
CREATE INDEX IF NOT EXISTS idx_message_logs_user_sent ON message_logs(user_id, sent_at DESC);

-- 코멘트 추가
COMMENT ON TABLE message_logs IS '메시지 발송 내역 로그';
COMMENT ON COLUMN message_logs.id IS '로그 ID';
COMMENT ON COLUMN message_logs.user_id IS '사용자 ID';
COMMENT ON COLUMN message_logs.to_number IS '수신 전화번호';
COMMENT ON COLUMN message_logs.to_name IS '수신자 이름';
COMMENT ON COLUMN message_logs.message_content IS '발송된 메시지 내용';
COMMENT ON COLUMN message_logs.subject IS '메시지 제목';
COMMENT ON COLUMN message_logs.message_type IS '메시지 타입 (SMS/LMS/MMS)';
COMMENT ON COLUMN message_logs.sent_at IS '발송 시간';
COMMENT ON COLUMN message_logs.status IS '발송 상태 (sent/failed)';
COMMENT ON COLUMN message_logs.error_message IS '실패 시 에러 메시지';
COMMENT ON COLUMN message_logs.credit_used IS '차감된 크레딧';
COMMENT ON COLUMN message_logs.metadata IS '추가 정보 (JSON)';


-- 3. RLS (Row Level Security) 정책 설정
-- ============================================================================
-- ⚠️ 주의: 이 프로젝트는 SERVICE_ROLE_KEY를 사용하므로 RLS를 비활성화합니다.
--         API에서 JWT 인증 + user_id 필터링으로 보안을 관리합니다.

-- scheduled_messages 테이블 RLS 비활성화
ALTER TABLE scheduled_messages DISABLE ROW LEVEL SECURITY;

-- message_logs 테이블 RLS 비활성화
ALTER TABLE message_logs DISABLE ROW LEVEL SECURITY;


-- 4. 트리거 생성 (updated_at 자동 업데이트)
-- ============================================================================

-- updated_at 자동 업데이트 함수 (이미 있을 수 있음)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- scheduled_messages에 트리거 적용
DROP TRIGGER IF EXISTS update_scheduled_messages_updated_at ON scheduled_messages;
CREATE TRIGGER update_scheduled_messages_updated_at
  BEFORE UPDATE ON scheduled_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 5. 마이그레이션 완료 확인
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '메시지 발송 DB 마이그레이션 완료';
  RAISE NOTICE '========================================';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - scheduled_messages (예약 메시지)';
  RAISE NOTICE '  - message_logs (발송 로그)';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS: 비활성화 (API에서 보안 관리)';
  RAISE NOTICE 'Trigger: 적용 완료';
  RAISE NOTICE '========================================';
END $$;
