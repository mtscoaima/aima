-- 네이버 톡톡 템플릿 스키마 확장
-- 날짜: 2025-01-12
-- 목적: 네이버 톡톡 템플릿 테이블에 템플릿 타입, 테이블 정보, 이미지, 혜택 정보 필드 추가

-- sms_message_templates 테이블에 네이버 톡톡 관련 필드 추가 (JSONB metadata 확장)
COMMENT ON COLUMN sms_message_templates.metadata IS '
메타데이터 (JSONB) - 메시지 타입별 추가 정보
- Kakao AlimTalk: { sender_key, template_code, buttons: [...], imageUrl }
- Kakao FriendTalk: { sender_key, ad_flag, buttons: [...], imageUrl, imageLink, wide_image_url, wide_image_link }
- Kakao Brand: { sender_key, template_code, message_type, buttons: [...], image: {...}, coupon: {...}, item: {...} }
- Naver TalkTalk: {
    partner_key,
    template_code,
    product_code: INFORMATION|BENEFIT|CARDINFO,
    category_code,
    buttons: [...],
    template_type: BASIC|CARD_PAYMENT|TABLE (선택),
    push_notice: string (선택, 테이블형 알림 제목),
    table_info: { elementList: [...] } (선택, 테이블형 구조),
    sample_image_hash_id: string (선택),
    benefit: object (선택, BENEFIT 타입용)
  }
';

-- 네이버 톡톡 템플릿 타입에 대한 제약 조건 추가 (metadata validation)
-- Note: PostgreSQL에서 JSONB 유효성 검사는 트리거나 체크 제약으로 구현 가능
-- 현재는 애플리케이션 레벨에서 검증하므로 주석으로 명세만 기록

/*
네이버 톡톡 metadata 구조 명세:

1. 기본형 (BASIC):
{
  "partner_key": "string",
  "template_code": "string",
  "product_code": "INFORMATION" | "BENEFIT" | "CARDINFO",
  "category_code": "string",
  "buttons": [
    {
      "type": "WEB_LINK" | "APP_LINK",
      "buttonCode": "string",
      "buttonName": "string",
      "pcUrl": "string (optional)",
      "mobileUrl": "string (optional)",
      "iOsAppScheme": "string (optional)",
      "aOsAppScheme": "string (optional)"
    }
  ],
  "sample_image_hash_id": "string (optional)"
}

2. 카드 결제형 (CARD_PAYMENT):
{
  ...기본형 필드,
  "template_type": "CARD_PAYMENT"
}

3. 테이블형 (TABLE):
{
  ...기본형 필드,
  "template_type": "TABLE",
  "push_notice": "테이블형 알림 제목",
  "table_info": {
    "elementList": [
      {
        "title": "string",
        "strikeTitle": boolean (optional),
        "subtitle": "string (optional)",
        "thumbnailImageUrl": "string (optional)",
        "thumbnailImageHashId": "string (optional)",
        "table": [
          {
            "title": "string",
            "content": "string"
          }
        ],
        "buttons": [...],
        "text": "string (optional)"
      }
    ]
  }
}

4. 혜택형 (BENEFIT):
{
  ...기본형 필드,
  "product_code": "BENEFIT",
  "benefit": {
    "description": "혜택 설명",
    "url_pc": "string (optional)",
    "url_mobile": "string (optional)"
  }
}
*/

-- 네이버 톡톡 productCode 인덱스 추가 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_sms_templates_naver_product_code
ON sms_message_templates ((metadata->>'product_code'))
WHERE message_type = 'NAVERTALK';

-- 네이버 톡톡 templateType 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_sms_templates_naver_template_type
ON sms_message_templates ((metadata->>'template_type'))
WHERE message_type = 'NAVERTALK';

-- 네이버 톡톡 partnerKey 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_sms_templates_naver_partner_key
ON sms_message_templates ((metadata->>'partner_key'))
WHERE message_type = 'NAVERTALK';

-- 마이그레이션 완료 로그
DO $$
BEGIN
  RAISE NOTICE '네이버 톡톡 템플릿 스키마 확장 완료 - 20250112';
  RAISE NOTICE '- metadata 필드 확장 (template_type, push_notice, table_info, sample_image_hash_id, benefit)';
  RAISE NOTICE '- 인덱스 추가 (product_code, template_type, partner_key)';
END $$;
