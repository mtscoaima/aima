-- =====================================================
-- 네이버 톡톡 관리 테이블 생성
-- 작성일: 2025-02-04
-- 설명: 네이버 톡톡 계정 및 템플릿 정보 관리
-- =====================================================

-- 1. 네이버 톡톡 계정 테이블 생성
CREATE TABLE IF NOT EXISTS naver_talk_accounts (
  id SERIAL PRIMARY KEY,

  -- 사용자 정보
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- 네이버 톡톡 정보
  navertalk_id VARCHAR(100) UNIQUE NOT NULL,  -- 네이버 톡톡 회원 ID (고유 ID)
  talk_name VARCHAR(100),                     -- 톡 이름

  -- 상태 정보
  status VARCHAR(20) DEFAULT 'active',        -- active, inactive

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT check_status CHECK (status IN ('active', 'inactive'))
);

-- 2. 네이버 톡톡 템플릿 테이블 생성 (MTS 템플릿 정보 캐시)
CREATE TABLE IF NOT EXISTS naver_talk_templates (
  id SERIAL PRIMARY KEY,

  -- 연결 정보
  navertalk_id VARCHAR(100) REFERENCES naver_talk_accounts(navertalk_id) ON DELETE CASCADE NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- 템플릿 정보
  template_id VARCHAR(50),                    -- MTS에서 발급한 템플릿 ID
  code VARCHAR(64) NOT NULL,                  -- 템플릿 코드 (유니크)
  name VARCHAR(100),                          -- 템플릿 이름
  text TEXT NOT NULL,                         -- 템플릿 내용

  -- 상품 정보
  product_code VARCHAR(20) NOT NULL,          -- INFORMATION, BENEFIT, CARDINFO
  category_code VARCHAR(10) NOT NULL,         -- S001, T001 등

  -- 버튼 정보 (JSON)
  buttons JSONB,                              -- 버튼 정보 배열

  -- 상태 정보
  status VARCHAR(20) DEFAULT 'PENDING',       -- PENDING, APPROVED, REJECTED

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- 제약조건
  CONSTRAINT check_product_code CHECK (product_code IN ('INFORMATION', 'BENEFIT', 'CARDINFO')),
  CONSTRAINT check_template_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REGISTERED')),
  CONSTRAINT unique_navertalk_code UNIQUE (navertalk_id, code)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_naver_talk_accounts_user ON naver_talk_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_naver_talk_accounts_navertalk_id ON naver_talk_accounts(navertalk_id);
CREATE INDEX IF NOT EXISTS idx_naver_talk_accounts_status ON naver_talk_accounts(status, user_id);

CREATE INDEX IF NOT EXISTS idx_naver_talk_templates_user ON naver_talk_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_naver_talk_templates_navertalk_id ON naver_talk_templates(navertalk_id);
CREATE INDEX IF NOT EXISTS idx_naver_talk_templates_status ON naver_talk_templates(status, user_id);
CREATE INDEX IF NOT EXISTS idx_naver_talk_templates_code ON naver_talk_templates(navertalk_id, code);

-- 4. updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_naver_talk_accounts_updated_at ON naver_talk_accounts;
CREATE TRIGGER update_naver_talk_accounts_updated_at
  BEFORE UPDATE ON naver_talk_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_naver_talk_templates_updated_at ON naver_talk_templates;
CREATE TRIGGER update_naver_talk_templates_updated_at
  BEFORE UPDATE ON naver_talk_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE naver_talk_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE naver_talk_templates ENABLE ROW LEVEL SECURITY;

-- naver_talk_accounts 정책 (기존 정책 제거 후 재생성)
DROP POLICY IF EXISTS select_own_naver_accounts ON naver_talk_accounts;
CREATE POLICY select_own_naver_accounts ON naver_talk_accounts
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

DROP POLICY IF EXISTS insert_own_naver_accounts ON naver_talk_accounts;
CREATE POLICY insert_own_naver_accounts ON naver_talk_accounts
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

DROP POLICY IF EXISTS update_own_naver_accounts ON naver_talk_accounts;
CREATE POLICY update_own_naver_accounts ON naver_talk_accounts
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::INTEGER)
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

DROP POLICY IF EXISTS delete_own_naver_accounts ON naver_talk_accounts;
CREATE POLICY delete_own_naver_accounts ON naver_talk_accounts
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- naver_talk_templates 정책 (기존 정책 제거 후 재생성)
DROP POLICY IF EXISTS select_own_naver_templates ON naver_talk_templates;
CREATE POLICY select_own_naver_templates ON naver_talk_templates
  FOR SELECT
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

DROP POLICY IF EXISTS insert_own_naver_templates ON naver_talk_templates;
CREATE POLICY insert_own_naver_templates ON naver_talk_templates
  FOR INSERT
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

DROP POLICY IF EXISTS update_own_naver_templates ON naver_talk_templates;
CREATE POLICY update_own_naver_templates ON naver_talk_templates
  FOR UPDATE
  USING (user_id = current_setting('app.current_user_id')::INTEGER)
  WITH CHECK (user_id = current_setting('app.current_user_id')::INTEGER);

DROP POLICY IF EXISTS delete_own_naver_templates ON naver_talk_templates;
CREATE POLICY delete_own_naver_templates ON naver_talk_templates
  FOR DELETE
  USING (user_id = current_setting('app.current_user_id')::INTEGER);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 네이버 톡톡 관리 테이블 생성 완료!';
  RAISE NOTICE '  - naver_talk_accounts: 네이버 톡톡 계정 정보';
  RAISE NOTICE '  - naver_talk_templates: 템플릿 정보 캐시';
  RAISE NOTICE '  - 8개 인덱스 생성 완료';
  RAISE NOTICE '  - RLS 정책 8개 설정 완료 (user_id 기반)';
  RAISE NOTICE '  - updated_at 자동 업데이트 트리거 생성';
END $$;
