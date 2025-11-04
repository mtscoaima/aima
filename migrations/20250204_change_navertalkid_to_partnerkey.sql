-- =====================================================
-- 네이버 톡톡 navertalk_id를 partner_key로 변경
-- 작성일: 2025-02-04
-- 설명: MTS API 문서에 따라 partnerKey를 사용하도록 변경
-- =====================================================

-- 1. 외래키 제약조건 제거
ALTER TABLE naver_talk_templates
  DROP CONSTRAINT IF EXISTS naver_talk_templates_navertalk_id_fkey;

-- 2. UNIQUE 제약조건 제거
ALTER TABLE naver_talk_accounts
  DROP CONSTRAINT IF EXISTS naver_talk_accounts_navertalk_id_key;

ALTER TABLE naver_talk_templates
  DROP CONSTRAINT IF EXISTS unique_navertalk_code;

-- 3. 컬럼명 변경 (컬럼이 존재하는 경우만)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'naver_talk_accounts' AND column_name = 'navertalk_id'
  ) THEN
    ALTER TABLE naver_talk_accounts RENAME COLUMN navertalk_id TO partner_key;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'naver_talk_templates' AND column_name = 'navertalk_id'
  ) THEN
    ALTER TABLE naver_talk_templates RENAME COLUMN navertalk_id TO partner_key;
  END IF;
END $$;

-- 4. UNIQUE 제약조건 재생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'naver_talk_accounts_partner_key_key'
  ) THEN
    ALTER TABLE naver_talk_accounts
      ADD CONSTRAINT naver_talk_accounts_partner_key_key UNIQUE (partner_key);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_partner_code'
  ) THEN
    ALTER TABLE naver_talk_templates
      ADD CONSTRAINT unique_partner_code UNIQUE (partner_key, code);
  END IF;
END $$;

-- 5. 외래키 제약조건 재생성
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'naver_talk_templates_partner_key_fkey'
  ) THEN
    ALTER TABLE naver_talk_templates
      ADD CONSTRAINT naver_talk_templates_partner_key_fkey
      FOREIGN KEY (partner_key) REFERENCES naver_talk_accounts(partner_key) ON DELETE CASCADE;
  END IF;
END $$;

-- 6. 인덱스 재생성
DROP INDEX IF EXISTS idx_naver_talk_accounts_navertalk_id;
DROP INDEX IF EXISTS idx_naver_talk_templates_navertalk_id;
DROP INDEX IF EXISTS idx_naver_talk_templates_code;

CREATE INDEX IF NOT EXISTS idx_naver_talk_accounts_partner_key ON naver_talk_accounts(partner_key);
CREATE INDEX IF NOT EXISTS idx_naver_talk_templates_partner_key ON naver_talk_templates(partner_key);
CREATE INDEX IF NOT EXISTS idx_naver_talk_templates_code ON naver_talk_templates(partner_key, code);

-- 7. 컬럼 설명 업데이트
COMMENT ON COLUMN naver_talk_accounts.partner_key IS '네이버 톡톡 파트너키 (MTS API에서 사용)';
COMMENT ON COLUMN naver_talk_templates.partner_key IS '네이버 톡톡 파트너키';

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '✅ 네이버 톡톡 컬럼명 변경 완료!';
  RAISE NOTICE '  - navertalk_id → partner_key';
  RAISE NOTICE '  - 외래키 및 인덱스 재생성 완료';
END $$;
