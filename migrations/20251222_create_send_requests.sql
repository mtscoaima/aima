-- 발송 의뢰내역 관리를 위한 send_requests 테이블 생성
-- 한 번의 발송 요청(여러 수신자에게 동시 발송)을 하나의 의뢰로 그룹화

-- 1. send_requests 테이블 생성
CREATE TABLE IF NOT EXISTS send_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL,
  channel_type VARCHAR(50) NOT NULL,  -- SMS, LMS, MMS, KAKAO_ALIMTALK, KAKAO_BRAND, NAVER_TALK
  message_preview TEXT,               -- 메시지 미리보기 (첫 100자)
  total_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  fail_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'completed',  -- pending, processing, completed
  scheduled_at TIMESTAMPTZ,           -- 예약발송인 경우
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- 2. send_requests 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_send_requests_user_id ON send_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_send_requests_created_at ON send_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_send_requests_channel_type ON send_requests(channel_type);
CREATE INDEX IF NOT EXISTS idx_send_requests_status ON send_requests(status);

-- 3. message_logs 테이블에 send_request_id 컬럼 추가
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS send_request_id UUID REFERENCES send_requests(id);
CREATE INDEX IF NOT EXISTS idx_message_logs_send_request_id ON message_logs(send_request_id);

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE send_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 발송 의뢰만 조회 가능
CREATE POLICY "Users can view own send_requests" ON send_requests
  FOR SELECT USING (auth.uid()::text = user_id::text OR 
    EXISTS (SELECT 1 FROM users WHERE id = user_id AND role = 'ADMIN'));

-- 사용자는 자신의 발송 의뢰만 생성 가능
CREATE POLICY "Users can insert own send_requests" ON send_requests
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 사용자는 자신의 발송 의뢰만 수정 가능
CREATE POLICY "Users can update own send_requests" ON send_requests
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 5. 코멘트 추가
COMMENT ON TABLE send_requests IS '발송 의뢰내역 - 한 번의 발송 요청을 하나의 의뢰로 그룹화';
COMMENT ON COLUMN send_requests.channel_type IS '발송 채널: SMS, LMS, MMS, KAKAO_ALIMTALK, KAKAO_BRAND, NAVER_TALK';
COMMENT ON COLUMN send_requests.message_preview IS '메시지 미리보기 (최대 100자)';
COMMENT ON COLUMN send_requests.total_count IS '총 발송 대상 수';
COMMENT ON COLUMN send_requests.success_count IS '발송 성공 건수';
COMMENT ON COLUMN send_requests.fail_count IS '발송 실패 건수';
COMMENT ON COLUMN send_requests.status IS '발송 상태: pending(대기), processing(진행중), completed(완료)';
COMMENT ON COLUMN send_requests.scheduled_at IS '예약 발송 시간 (즉시 발송인 경우 NULL)';
COMMENT ON COLUMN message_logs.send_request_id IS '발송 의뢰 ID (send_requests 테이블 참조)';

