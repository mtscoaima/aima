-- =====================================================
-- 커스텀 캠페인 업종 테이블 생성
-- 작성일: 2025-01-22
-- 설명: 사용자가 "14. 기타(직접입력)" 선택 시 입력한 업종 저장
-- =====================================================

-- 1. custom_campaign_industries 테이블 생성
CREATE TABLE IF NOT EXISTS custom_campaign_industries (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  custom_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_custom_industries_campaign ON custom_campaign_industries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_custom_industries_name ON custom_campaign_industries(custom_name);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Custom campaign industries table created successfully!';
  RAISE NOTICE '- Indexes created for campaign_id and custom_name';
END $$;
