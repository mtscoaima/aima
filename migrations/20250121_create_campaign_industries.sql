-- =====================================================
-- 캠페인 업종 분류 테이블 생성 및 campaigns 테이블 수정
-- 작성일: 2025-01-21
-- 설명: 기존 target_industry_* 컬럼 삭제 후 campaign_industry_id 컬럼 추가
-- =====================================================

-- 1. campaign_industries 테이블 생성
CREATE TABLE IF NOT EXISTS campaign_industries (
  id SERIAL PRIMARY KEY,
  order_number INTEGER NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 초기 데이터 삽입 (1~14번 업종)
INSERT INTO campaign_industries (order_number, name, is_active) VALUES
(1, '음식점', true),
(2, '주점/주류 판매점', true),
(3, '편의점', true),
(4, '마트 / SSM', true),
(5, '학원 / 교육업종', true),
(6, 'PC방 / 게임 / 오락시설', true),
(7, '주유소/정비/자동차관련', true),
(8, '병원 / 약국', true),
(9, '뷰티 / 미용', true),
(10, '반려동물 관련', true),
(11, '호텔 / 숙박', true),
(12, '운동시설', true),
(13, '커피', true),
(14, '기타 (직접입력)', true)
ON CONFLICT (order_number) DO NOTHING;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaign_industries_order ON campaign_industries(order_number);
CREATE INDEX IF NOT EXISTS idx_campaign_industries_active ON campaign_industries(is_active);

-- 4. updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_campaign_industries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_campaign_industries_updated_at ON campaign_industries;
CREATE TRIGGER trigger_update_campaign_industries_updated_at
  BEFORE UPDATE ON campaign_industries
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_industries_updated_at();

-- 6. campaigns 테이블에 새 컬럼 추가
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS campaign_industry_id INTEGER
REFERENCES campaign_industries(id) ON DELETE SET NULL;

-- 7. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaigns_industry_id ON campaigns(campaign_industry_id);

-- 8. 기존 데이터 마이그레이션 (옵션)
-- target_industry_top_level 값을 campaign_industries.name과 매칭하여 ID 할당
-- 주의: 이 부분은 기존 데이터가 있을 경우만 실행
UPDATE campaigns
SET campaign_industry_id = (
  SELECT id FROM campaign_industries
  WHERE name = campaigns.target_industry_top_level
  LIMIT 1
)
WHERE target_industry_top_level IS NOT NULL
  AND target_industry_top_level != '';

-- 9. 기존 컬럼 삭제
ALTER TABLE campaigns
DROP COLUMN IF EXISTS target_industry_top_level,
DROP COLUMN IF EXISTS target_industry_specific;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '- campaign_industries table created with 14 initial industries';
  RAISE NOTICE '- campaigns table updated: added campaign_industry_id, removed target_industry_*';
END $$;
