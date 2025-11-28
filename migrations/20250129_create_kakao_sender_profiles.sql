-- =====================================================
-- 카카오 발신프로필 관리 테이블 생성
-- 작성일: 2025-01-29
-- 설명: MTS에 등록된 카카오 발신프로필 정보를 DB에 저장하여 관리
-- =====================================================

-- 1. 카카오 발신프로필 테이블 생성
CREATE TABLE IF NOT EXISTS kakao_sender_profiles (
  id SERIAL PRIMARY KEY,

  -- 사용자 정보
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- MTS 발신프로필 정보
  sender_key VARCHAR(40) UNIQUE NOT NULL,  -- MTS에서 발급한 발신프로필 키
  yellow_id VARCHAR(50) NOT NULL,          -- 카카오톡 채널 ID (예: @example)
  channel_name VARCHAR(100),                -- 카카오톡 채널 이름

  -- 등록 정보
  phone_number VARCHAR(20) NOT NULL,        -- 관리자 전화번호
  category_code VARCHAR(11),                -- 카테고리 코드

  -- 상태 정보
  status VARCHAR(1) DEFAULT 'A',            -- A: activated, C: deactivated, B: block, E: deleting, D: deleted
  block BOOLEAN DEFAULT false,              -- 발신프로필 차단 여부
  dormant BOOLEAN DEFAULT false,            -- 발신프로필 휴면 여부
  profile_status VARCHAR(1) DEFAULT 'A',    -- 카카오톡 채널 상태

  -- 추가 정보
  bizchat BOOLEAN DEFAULT false,            -- 상담톡 사용 여부
  brandtalk BOOLEAN DEFAULT false,          -- 브랜드톡 사용 여부 (deprecated)
  brand_message BOOLEAN DEFAULT false,      -- 브랜드 메시지 사용 여부

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT check_status CHECK (status IN ('A', 'C', 'B', 'E', 'D')),
  CONSTRAINT check_profile_status CHECK (profile_status IN ('A', 'C', 'B', 'E', 'D'))
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_kakao_sender_profiles_user ON kakao_sender_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_kakao_sender_profiles_sender_key ON kakao_sender_profiles(sender_key);
CREATE INDEX IF NOT EXISTS idx_kakao_sender_profiles_status ON kakao_sender_profiles(status, user_id);
CREATE INDEX IF NOT EXISTS idx_kakao_sender_profiles_active ON kakao_sender_profiles(user_id, status)
  WHERE status = 'A' AND block = false AND dormant = false;

-- 3. updated_at 자동 업데이트 트리거 (기존 함수 재사용)
DROP TRIGGER IF EXISTS update_kakao_sender_profiles_updated_at ON kakao_sender_profiles;
CREATE TRIGGER update_kakao_sender_profiles_updated_at
  BEFORE UPDATE ON kakao_sender_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. RLS (Row Level Security) 정책 설정
ALTER TABLE kakao_sender_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 발신프로필만 조회 가능
CREATE POLICY select_own_profiles ON kakao_sender_profiles
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- 사용자는 자신의 발신프로필만 생성 가능
CREATE POLICY insert_own_profiles ON kakao_sender_profiles
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

-- 사용자는 자신의 발신프로필만 수정 가능
CREATE POLICY update_own_profiles ON kakao_sender_profiles
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::INTEGER)
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

-- 사용자는 자신의 발신프로필만 삭제 가능
CREATE POLICY delete_own_profiles ON kakao_sender_profiles
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 카카오 발신프로필 관리 테이블 생성 완료!';
  RAISE NOTICE '  - kakao_sender_profiles: 발신프로필 정보 저장';
  RAISE NOTICE '  - 4개 인덱스 생성 완료';
  RAISE NOTICE '  - RLS 정책 4개 설정 완료 (user_id 기반)';
  RAISE NOTICE '  - updated_at 자동 업데이트 트리거 생성';
END $$;
