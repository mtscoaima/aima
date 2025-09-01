-- ================================================
-- 캠페인 테이블 마이그레이션 및 업종 테이블 생성
-- 작성일: 2024-12-19
-- ================================================

-- 1. 캠페인 상태 enum 타입 정의 및 수정
-- ================================================

-- 기존 enum 타입이 있다면 COMPLETED 값 추가
DO $$ 
BEGIN
    -- campaign_status enum이 존재하는지 확인하고 COMPLETED 값이 없으면 추가
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'campaign_status') AND enumlabel = 'COMPLETED') THEN
            ALTER TYPE campaign_status ADD VALUE 'COMPLETED';
        END IF;
    ELSE
        -- enum 타입이 없다면 생성
        CREATE TYPE campaign_status AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SENDING', 'COMPLETED');
    END IF;
END $$;

-- 2. 업종 테이블 생성
-- ================================================

-- 상위 업종 테이블
CREATE TABLE IF NOT EXISTS top_level_industries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 세부 업종 테이블
CREATE TABLE IF NOT EXISTS industries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    top_level_code VARCHAR(10) REFERENCES top_level_industries(code),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 업종 키워드 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS industry_keywords (
    id SERIAL PRIMARY KEY,
    keyword VARCHAR(100) NOT NULL,
    industry_code VARCHAR(10) REFERENCES industries(code),
    weight INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 캠페인 테이블에 새로운 컬럼 추가
-- ================================================

-- 발송 정책 관련 컬럼들
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS send_policy_type VARCHAR(20) DEFAULT 'realtime';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS validity_start_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS validity_end_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scheduled_send_date DATE;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS scheduled_send_time TIME;

-- 타겟팅 관련 컬럼들
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_gender VARCHAR(10) DEFAULT 'all';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_age_groups TEXT[] DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_locations JSONB DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_locations_detailed JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS card_amount_min INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS card_amount_max INTEGER;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS card_time_start TIME;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS card_time_end TIME;

-- 업종 관련 컬럼들
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_industry_top_level VARCHAR(10);
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_industry_specific VARCHAR(10);

-- 수신자 관련 컬럼들
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS target_count INTEGER DEFAULT 30;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS ad_recipient_count INTEGER DEFAULT 30;

-- 기타 컬럼들
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS unit_cost INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS estimated_total_cost INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expert_review_requested BOOLEAN DEFAULT false;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS expert_review_notes TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS dynamic_buttons JSONB DEFAULT '[]';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS gender_ratio JSONB DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS desired_recipients TEXT;

-- 4. 업종 초기 데이터 삽입
-- ================================================

-- 상위 업종 데이터 삽입
INSERT INTO top_level_industries (code, name, display_order) VALUES
('1', '서비스업', 1),
('2', '제조·화학', 2),
('3', 'IT·웹·통신', 3),
('4', '은행·금융업', 4),
('5', '미디어·디자인', 5),
('6', '교육업', 6),
('7', '의료·제약·복지', 7),
('8', '판매·유통', 8),
('9', '건설업', 9),
('10', '기관·협회', 10)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (서비스업)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('108', '호텔·여행·항공', '1', 1),
('109', '외식업·식음료', '1', 2),
('111', '시설관리·경비·용역', '1', 3),
('115', '레저·스포츠·여가', '1', 4),
('118', 'AS·카센터·주유', '1', 5),
('119', '렌탈·임대', '1', 6),
('120', '웨딩·장례·이벤트', '1', 7),
('121', '기타서비스업', '1', 8),
('122', '뷰티·미용', '1', 9)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (제조·화학)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('201', '전기·전자·제어', '2', 1),
('202', '기계·설비·자동차', '2', 2),
('204', '석유·화학·에너지', '2', 3),
('205', '섬유·의류·패션', '2', 4),
('207', '화장품·뷰티', '2', 5),
('208', '생활용품·소비재·사무', '2', 6),
('209', '가구·목재·제지', '2', 7),
('210', '농업·어업·광업·임업', '2', 8),
('211', '금속·재료·철강·요업', '2', 9),
('212', '조선·항공·우주', '2', 10),
('213', '기타제조업', '2', 11),
('214', '식품가공·개발', '2', 12),
('215', '반도체·광학·LCD', '2', 13),
('216', '환경', '2', 14)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (IT·웹·통신)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('301', '솔루션·SI·ERP·CRM', '3', 1),
('302', '웹에이젼시', '3', 2),
('304', '쇼핑몰·오픈마켓', '3', 3),
('305', '포털·인터넷·컨텐츠', '3', 4),
('306', '네트워크·통신·모바일', '3', 5),
('307', '하드웨어·장비', '3', 6),
('308', '정보보안·백신', '3', 7),
('313', 'IT컨설팅', '3', 8),
('314', '게임', '3', 9)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (은행·금융업)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('401', '은행·금융·저축', '4', 1),
('402', '대출·캐피탈·여신', '4', 2),
('405', '기타금융', '4', 3),
('406', '증권·보험·카드', '4', 4)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (미디어·디자인)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('501', '신문·잡지·언론사', '5', 1),
('502', '방송사·케이블', '5', 2),
('503', '연예·엔터테인먼트', '5', 3),
('504', '광고·홍보·전시', '5', 4),
('505', '영화·배급·음악', '5', 5),
('506', '공연·예술·문화', '5', 6),
('509', '출판·인쇄·사진', '5', 7),
('510', '캐릭터·애니메이션', '5', 8),
('511', '디자인·설계', '5', 9)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (교육업)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('601', '초중고·대학', '6', 1),
('602', '학원·어학원', '6', 2),
('603', '유아·유치원', '6', 3),
('604', '교재·학습지', '6', 4),
('605', '전문·기능학원', '6', 5)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (의료·제약·복지)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('701', '의료(진료과목별)', '7', 1),
('702', '의료(병원종류별)', '7', 2),
('703', '제약·보건·바이오', '7', 3),
('704', '사회복지', '7', 4)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (판매·유통)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('801', '판매(매장종류별)', '8', 1),
('802', '판매(상품품목별)', '8', 2),
('803', '유통·무역·상사', '8', 3),
('804', '운송·운수·물류', '8', 4)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (건설업)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('901', '건설·건축·토목·시공', '9', 1),
('902', '실내·인테리어·조경', '9', 2),
('903', '환경·설비', '9', 3),
('904', '부동산·임대·중개', '9', 4)
ON CONFLICT (code) DO NOTHING;

-- 세부 업종 데이터 삽입 (기관·협회)
INSERT INTO industries (code, name, top_level_code, display_order) VALUES
('1001', '정부·공공기관·공기업', '10', 1),
('1002', '협회·단체', '10', 2),
('1003', '법률·법무·특허', '10', 3),
('1004', '세무·회계', '10', 4),
('1005', '연구소·컨설팅·조사', '10', 5)
ON CONFLICT (code) DO NOTHING;

-- 5. 기존 캠페인 데이터 마이그레이션
-- ================================================

-- target_criteria에서 중복 데이터 제거
UPDATE campaigns 
SET target_criteria = target_criteria - 'templateId' - 'templateTitle' - 'maxRecipients' - 'targetCount' - 'sendPolicy' - 'validityStartDate' - 'validityEndDate' - 'scheduledSendDate' - 'scheduledSendTime' - 'costPerItem'
WHERE target_criteria IS NOT NULL;

-- 중복된 age/ageGroup 정리 (ageGroup 우선 사용)
UPDATE campaigns 
SET target_criteria = target_criteria - 'age'
WHERE target_criteria->'age' = target_criteria->'ageGroup';

-- 중복된 지역 정보 정리 (locations 우선 사용)
UPDATE campaigns 
SET target_criteria = target_criteria - 'city' - 'district' - 'location'
WHERE target_criteria->'locations' IS NOT NULL;

-- 새로운 컬럼들에 데이터 이전 (타입 안전)
UPDATE campaigns 
SET 
  target_gender = COALESCE(target_criteria->>'gender', 'all'),

  target_age_groups = CASE 
    WHEN jsonb_typeof(target_criteria->'ageGroup') = 'array' 
      THEN ARRAY(SELECT jsonb_array_elements_text(target_criteria->'ageGroup'))
    WHEN jsonb_typeof(target_criteria->'ageGroup') = 'string'
      THEN string_to_array(NULLIF(target_criteria->>'ageGroup',''), ',')::text[]
    WHEN jsonb_typeof(target_criteria->'age') = 'array'
      THEN ARRAY(SELECT jsonb_array_elements_text(target_criteria->'age'))
    WHEN jsonb_typeof(target_criteria->'age') = 'string'
      THEN string_to_array(NULLIF(target_criteria->>'age',''), ',')::text[]
    ELSE ARRAY[]::text[]
  END,

  target_locations = CASE
    WHEN jsonb_typeof(target_criteria->'locations') = 'array' 
      THEN target_criteria->'locations'->0
    WHEN jsonb_typeof(target_criteria->'location') = 'object'
      THEN target_criteria->'location'
    ELSE NULL
  END,

  target_locations_detailed = CASE
    WHEN jsonb_typeof(target_criteria->'locations') = 'array'
      THEN target_criteria->'locations'
    ELSE '[]'::jsonb
  END,

  card_amount_min = CASE 
    WHEN target_criteria ? 'cardAmount' AND target_criteria->>'cardAmount' NOT IN ('', 'all')
      THEN NULLIF(regexp_replace(target_criteria->>'cardAmount', '[^0-9]', '', 'g'), '')::int
    ELSE NULL
  END,

  card_amount_max = CASE 
    WHEN target_criteria ? 'cardAmount' AND target_criteria->>'cardAmount' NOT IN ('', 'all')
      THEN NULLIF(regexp_replace(target_criteria->>'cardAmount', '[^0-9]', '', 'g'), '')::int
    ELSE NULL
  END,

  card_time_start = CASE 
    WHEN jsonb_typeof(target_criteria->'cardTime') = 'object' 
         AND (target_criteria->'cardTime') ? 'startTime'
      THEN NULLIF(target_criteria->'cardTime'->>'startTime','')::time
    ELSE NULL
  END,

  card_time_end = CASE 
    WHEN jsonb_typeof(target_criteria->'cardTime') = 'object' 
         AND (target_criteria->'cardTime') ? 'endTime'
      THEN NULLIF(target_criteria->'cardTime'->>'endTime','')::time
    ELSE NULL
  END,

  target_industry_top_level = CASE
    WHEN jsonb_typeof(target_criteria->'industry') = 'object'
      THEN NULLIF(target_criteria->'industry'->>'topLevel','')
    ELSE NULL
  END,

  target_industry_specific = CASE
    WHEN jsonb_typeof(target_criteria->'industry') = 'object'
      THEN NULLIF(target_criteria->'industry'->>'specific','')
    ELSE NULL
  END,

  send_policy_type = NULLIF(target_criteria->>'sendPolicy',''),

  validity_start_date = CASE 
    WHEN target_criteria ? 'validityStartDate'
      THEN NULLIF(target_criteria->>'validityStartDate','')::date
    ELSE NULL
  END,

  validity_end_date = CASE 
    WHEN target_criteria ? 'validityEndDate'
      THEN NULLIF(target_criteria->>'validityEndDate','')::date
    ELSE NULL
  END,

  scheduled_send_date = CASE 
    WHEN target_criteria ? 'scheduledSendDate'
      THEN NULLIF(target_criteria->>'scheduledSendDate','')::date
    ELSE NULL
  END,

  scheduled_send_time = CASE 
    WHEN target_criteria ? 'scheduledSendTime'
      THEN NULLIF(target_criteria->>'scheduledSendTime','')::time
    ELSE NULL
  END,

  target_count = CASE 
    WHEN target_criteria ? 'targetCount'
      THEN NULLIF(target_criteria->>'targetCount','')::int
    ELSE target_count
  END,

  total_recipients = COALESCE(
    NULLIF(target_criteria->>'maxRecipients','')::int,
    total_recipients
  ),

  unit_cost = CASE 
    WHEN target_criteria ? 'costPerItem'
      THEN NULLIF(target_criteria->>'costPerItem','')::int
    ELSE unit_cost
  END,

  expert_review_requested = CASE
    WHEN target_criteria ? 'expertReviewRequested'
      THEN (target_criteria->>'expertReviewRequested')::boolean
    ELSE expert_review_requested
  END,

  dynamic_buttons = CASE
    WHEN jsonb_typeof(target_criteria->'buttons') = 'array'
      THEN target_criteria->'buttons'
    ELSE '[]'::jsonb
  END,

  gender_ratio = CASE
    WHEN jsonb_typeof(target_criteria->'genderRatio') = 'object'
      THEN target_criteria->'genderRatio'
    ELSE '{}'::jsonb
  END,

  desired_recipients = CASE
    WHEN target_criteria ? 'desiredRecipients'
      THEN NULLIF(target_criteria->>'desiredRecipients','')
    ELSE desired_recipients
  END
WHERE target_criteria IS NOT NULL;

-- 6. 인덱스 생성
-- ================================================

-- 업종 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_top_level_industries_code ON top_level_industries(code);
CREATE INDEX IF NOT EXISTS idx_top_level_industries_active ON top_level_industries(is_active);
CREATE INDEX IF NOT EXISTS idx_industries_top_level_code ON industries(top_level_code);
CREATE INDEX IF NOT EXISTS idx_industries_code ON industries(code);
CREATE INDEX IF NOT EXISTS idx_industries_active ON industries(is_active);
CREATE INDEX IF NOT EXISTS idx_industry_keywords_industry_code ON industry_keywords(industry_code);

-- 캠페인 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_schedule_start_date ON campaigns(schedule_start_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_schedule_end_date ON campaigns(schedule_end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_target_gender ON campaigns(target_gender);
CREATE INDEX IF NOT EXISTS idx_campaigns_target_age_groups ON campaigns USING GIN(target_age_groups);
CREATE INDEX IF NOT EXISTS idx_campaigns_target_industry ON campaigns(target_industry_top_level, target_industry_specific);
CREATE INDEX IF NOT EXISTS idx_campaigns_send_policy ON campaigns(send_policy_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_validity_dates ON campaigns(validity_start_date, validity_end_date);

-- 7. 마이그레이션 완료 확인
-- ================================================

-- 업종 데이터 확인
SELECT 'top_level_industries' as table_name, COUNT(*) as count FROM top_level_industries
UNION ALL
SELECT 'industries' as table_name, COUNT(*) as count FROM industries
UNION ALL
SELECT 'campaigns_with_new_columns' as table_name, COUNT(*) as count FROM campaigns WHERE target_gender IS NOT NULL;

-- 업종별 캠페인 통계 확인 (COMPLETED 상태 사용하지 않음)
SELECT 
  tli.name as top_level_industry,
  COUNT(c.id) as campaign_count,
  AVG(c.budget) as avg_budget
FROM campaigns c
LEFT JOIN top_level_industries tli ON c.target_industry_top_level = tli.code
WHERE c.status = 'APPROVED'
GROUP BY tli.name, tli.code
ORDER BY campaign_count DESC;
