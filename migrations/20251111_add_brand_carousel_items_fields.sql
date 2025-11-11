-- =====================================================
-- 브랜드 메시지 템플릿 테이블에 다중 아이템/캐러셀 필드 추가
-- 작성일: 2025-11-11
-- 설명: WIDE_ITEM_LIST, CAROUSEL_COMMERCE, CAROUSEL_FEED 타입 지원
-- =====================================================

-- WIDE_ITEM_LIST: 다중 아이템 리스트
ALTER TABLE kakao_brand_templates
ADD COLUMN IF NOT EXISTS items JSONB;

-- CAROUSEL_COMMERCE, CAROUSEL_FEED: 캐러셀 카드 리스트
ALTER TABLE kakao_brand_templates
ADD COLUMN IF NOT EXISTS carousel_cards JSONB;

-- 컬럼 주석 추가
COMMENT ON COLUMN kakao_brand_templates.items IS 'WIDE_ITEM_LIST 타입: 아이템 리스트 배열 [{img_url, url_mobile, title}]';
COMMENT ON COLUMN kakao_brand_templates.carousel_cards IS 'CAROUSEL_COMMERCE/CAROUSEL_FEED 타입: 캐러셀 카드 배열';
