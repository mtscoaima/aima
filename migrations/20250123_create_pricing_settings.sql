-- =====================================================
-- 차등 단가 설정 테이블 생성
-- 작성일: 2025-01-23
-- 설명: 캠페인 광고 단가 차등 적용을 위한 설정 테이블
-- =====================================================

-- 1. pricing_settings 테이블 생성
CREATE TABLE IF NOT EXISTS pricing_settings (
  id SERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL,      -- 'base', 'media', 'customer'
  sub_category VARCHAR(50),            -- '전체', '가맹점', '고객', '결제정보', '업태', '기타'
  condition_type VARCHAR(50),          -- '기본단가', '위치', '성별', '나이', '결제금액', '업종', '결제이력'
  condition_value VARCHAR(100),        -- 조건 값 (필요 시)
  price INTEGER NOT NULL DEFAULT 0,    -- 차등 단가 (원)
  description TEXT,                    -- 설명
  is_active BOOLEAN DEFAULT TRUE,      -- 활성화 여부
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 초기 데이터 삽입 (표 기준)
INSERT INTO pricing_settings (category, sub_category, condition_type, price, description) VALUES
  ('base', '전체', '기본단가', 100, '공통 > 전체 > 기본단가'),
  ('media', '가맹점', '위치', 20, '매체 > 가맹점 > 위치 (N * 20원, 동단위로 복수 선택 시 개당 20원)'),
  ('customer', '고객', '성별', 0, '고객 > 고객 > 성별 (전체, 남, 여)'),
  ('customer', '고객', '나이', 20, '고객 > 고객 > 나이 (N * 20원, 구간단위로 복수 선택 시 개당 20원)'),
  ('media', '결제정보', '결제금액', 0, '매체 > 결제정보 > 결제금액'),
  ('media', '업태', '업종', 20, '매체 > 업태 > 업종'),
  ('media', '기타', '결제이력', 20, '매체 > 기타 > 결제이력 (결제 승인 시간대 설정)');

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_pricing_category ON pricing_settings(category);
CREATE INDEX IF NOT EXISTS idx_pricing_active ON pricing_settings(is_active);

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE 'Pricing settings table created successfully!';
  RAISE NOTICE '- 7 initial pricing settings inserted';
  RAISE NOTICE '- Indexes created for category and is_active';
END $$;
