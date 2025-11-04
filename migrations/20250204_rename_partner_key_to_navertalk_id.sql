-- =====================================================
-- 네이버 톡톡 테이블 컬럼명 변경
-- 작성일: 2025-02-04
-- 설명: partner_key → navertalk_id로 변경 (회원 ID 사용)
-- =====================================================

-- 1. 외래키 제약조건 제거
ALTER TABLE naver_talk_templates
  DROP CONSTRAINT IF EXISTS naver_talk_templates_partner_key_fkey;

-- 2. UNIQUE 제약조건 제거
ALTER TABLE naver_talk_templates
  DROP CONSTRAINT IF EXISTS unique_partner_code;

-- 3. 인덱스 제거
DROP INDEX IF EXISTS idx_naver_talk_accounts_partner_key;
DROP INDEX IF EXISTS idx_naver_talk_templates_partner_key;

-- 4. 컬럼명 변경
ALTER TABLE naver_talk_accounts
  RENAME COLUMN partner_key TO navertalk_id;

ALTER TABLE naver_talk_templates
  RENAME COLUMN partner_key TO navertalk_id;

-- 5. 외래키 제약조건 재생성
ALTER TABLE naver_talk_templates
  ADD CONSTRAINT naver_talk_templates_navertalk_id_fkey
  FOREIGN KEY (navertalk_id) REFERENCES naver_talk_accounts(navertalk_id) ON DELETE CASCADE;

-- 6. UNIQUE 제약조건 재생성
ALTER TABLE naver_talk_templates
  ADD CONSTRAINT unique_navertalk_code UNIQUE (navertalk_id, code);

-- 7. 인덱스 재생성
CREATE INDEX IF NOT EXISTS idx_naver_talk_accounts_navertalk_id ON naver_talk_accounts(navertalk_id);
CREATE INDEX IF NOT EXISTS idx_naver_talk_templates_navertalk_id ON naver_talk_templates(navertalk_id);
CREATE INDEX IF NOT EXISTS idx_naver_talk_templates_code ON naver_talk_templates(navertalk_id, code);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 네이버 톡톡 테이블 컬럼명 변경 완료!';
  RAISE NOTICE '  - partner_key → navertalk_id';
  RAISE NOTICE '  - 외래키 제약조건 재생성';
  RAISE NOTICE '  - 인덱스 재생성';
END $$;
