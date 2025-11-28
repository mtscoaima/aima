-- =====================================================
-- 브랜드 메시지 템플릿 테이블에 PREMIUM_VIDEO, COMMERCE 타입 필드 추가
-- 작성일: 2025-11-11
-- 설명: PREMIUM_VIDEO, COMMERCE, CAROUSEL_COMMERCE 타입 지원을 위한 필드 추가
-- =====================================================

-- PREMIUM_VIDEO 필드 추가
ALTER TABLE kakao_brand_templates
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- COMMERCE 필드 추가
ALTER TABLE kakao_brand_templates
ADD COLUMN IF NOT EXISTS commerce_title TEXT,
ADD COLUMN IF NOT EXISTS regular_price INTEGER,
ADD COLUMN IF NOT EXISTS discount_price INTEGER,
ADD COLUMN IF NOT EXISTS discount_rate INTEGER,
ADD COLUMN IF NOT EXISTS discount_fixed INTEGER;

-- 컬럼 주석 추가
COMMENT ON COLUMN kakao_brand_templates.video_url IS 'PREMIUM_VIDEO 타입: 동영상 URL';
COMMENT ON COLUMN kakao_brand_templates.thumbnail_url IS 'PREMIUM_VIDEO 타입: 썸네일 이미지 URL';
COMMENT ON COLUMN kakao_brand_templates.commerce_title IS 'COMMERCE 타입: 상품명';
COMMENT ON COLUMN kakao_brand_templates.regular_price IS 'COMMERCE 타입: 정가 (원)';
COMMENT ON COLUMN kakao_brand_templates.discount_price IS 'COMMERCE 타입: 할인가 (원)';
COMMENT ON COLUMN kakao_brand_templates.discount_rate IS 'COMMERCE 타입: 할인율 (%)';
COMMENT ON COLUMN kakao_brand_templates.discount_fixed IS 'COMMERCE 타입: 할인 금액 (원)';
