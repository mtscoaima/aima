-- 메시지 수신 결과 저장을 위한 컬럼 추가
-- MTS 응답요청 API를 통해 조회한 실제 수신 결과를 저장

-- 1. message_logs 테이블에 수신 결과 관련 컬럼 추가
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS result_code VARCHAR(10);
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS result_message TEXT;
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE message_logs ADD COLUMN IF NOT EXISTS result_checked_at TIMESTAMPTZ;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_message_logs_delivery_status ON message_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_message_logs_result_code ON message_logs(result_code);

-- 3. 코멘트 추가
COMMENT ON COLUMN message_logs.delivery_status IS '수신 상태: pending(대기중), delivered(수신완료), failed(수신실패), unknown(확인불가)';
COMMENT ON COLUMN message_logs.result_code IS 'MTS 결과코드 (1000=성공, 3019=톡유저아님, 3020=수신차단 등)';
COMMENT ON COLUMN message_logs.result_message IS '결과 메시지 설명';
COMMENT ON COLUMN message_logs.delivered_at IS '실제 수신/결과 확인 시간';
COMMENT ON COLUMN message_logs.result_checked_at IS '마지막 결과 조회 시간';

-- 4. 기존 데이터 마이그레이션 (성공 상태인 것들은 delivered로 변경)
UPDATE message_logs 
SET delivery_status = 'delivered' 
WHERE status = 'sent' AND delivery_status = 'pending';

-- 5. 실패 상태인 것들은 failed로 변경
UPDATE message_logs 
SET delivery_status = 'failed' 
WHERE status = 'failed' AND delivery_status = 'pending';

