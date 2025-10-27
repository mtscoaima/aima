-- =====================================================
-- 예약 채널 관리 시스템 테이블 생성 (통합 테이블)
-- 작성일: 2025-01-27
-- 설명: 시스템 기본 채널 + 사용자 커스텀 채널을 하나의 테이블로 관리
--       user_id IS NULL → 시스템 채널
--       user_id IS NOT NULL → 사용자 커스텀 채널
-- =====================================================

-- 1. 통합 예약 채널 테이블 생성
CREATE TABLE IF NOT EXISTS booking_channels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,  -- NULL이면 시스템 채널
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 커스텀 채널: (user_id, name) 조합이 UNIQUE
  CONSTRAINT unique_user_channel UNIQUE (user_id, name)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_booking_channels_active ON booking_channels(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_booking_channels_user ON booking_channels(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_booking_channels_system ON booking_channels(user_id) WHERE user_id IS NULL;

-- 3. 시스템 채널의 UNIQUE 제약을 위한 부분 유니크 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS unique_system_channel_name
  ON booking_channels(name)
  WHERE user_id IS NULL;

-- 4. 초기 시스템 채널 데이터 삽입 (10개, "직접입력" 제외)
-- user_id IS NULL → 시스템 채널
INSERT INTO booking_channels (name, user_id, display_order, is_active) VALUES
  ('아워플레이스', NULL, 1, true),
  ('스페이스클라우드', NULL, 2, true),
  ('여기어때', NULL, 3, true),
  ('웨이닛', NULL, 4, true),
  ('빌리오', NULL, 5, true),
  ('카카오 채널', NULL, 6, true),
  ('네이버 예약', NULL, 7, true),
  ('전화', NULL, 8, true),
  ('인스타그램', NULL, 9, true),
  ('홈페이지', NULL, 10, true)
ON CONFLICT (user_id, name) DO NOTHING;  -- 이미 존재하면 건너뛰기

-- 5. updated_at 자동 업데이트 트리거 함수 (재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 트리거 생성
DROP TRIGGER IF EXISTS update_booking_channels_updated_at ON booking_channels;
CREATE TRIGGER update_booking_channels_updated_at
  BEFORE UPDATE ON booking_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 예약 채널 관리 시스템 테이블 생성 완료 (통합 테이블)!';
  RAISE NOTICE '  - booking_channels: 통합 테이블 (시스템 + 사용자 커스텀)';
  RAISE NOTICE '  - 시스템 채널: 10개 (user_id IS NULL)';
  RAISE NOTICE '  - 커스텀 채널: 사용자별 (user_id IS NOT NULL)';
  RAISE NOTICE '  - 4개 인덱스 생성 완료 (시스템 채널 유니크 인덱스 포함)';
  RAISE NOTICE '  - updated_at 자동 업데이트 트리거 생성';
END $$;
