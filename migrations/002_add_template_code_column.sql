-- 002_add_template_code_column.sql
-- 템플릿 코드 컬럼 추가 및 기존 데이터 마이그레이션

-- 1. message_templates 테이블에 template_code 컬럼 추가
ALTER TABLE message_templates 
ADD COLUMN template_code VARCHAR(100);

-- 2. 기존 템플릿들의 template_code 생성을 위한 함수 생성
CREATE OR REPLACE FUNCTION generate_template_code(template_id INTEGER)
RETURNS VARCHAR(100) AS $$
DECLARE
    last_campaign RECORD;
    ad_medium_mapping VARCHAR(50);
    template_code VARCHAR(100);
BEGIN
    -- 해당 템플릿을 사용한 가장 마지막 캠페인 찾기
    SELECT ad_medium, created_at
    INTO last_campaign
    FROM campaigns 
    WHERE template_id = template_id
    ORDER BY created_at DESC, updated_at DESC
    LIMIT 1;
    
    -- ad_medium이 없으면 기본값 'naver_talktalk' 사용
    IF last_campaign.ad_medium IS NULL THEN
        last_campaign.ad_medium := 'naver_talktalk';
    END IF;
    
    -- ad_medium을 한글로 매핑
    CASE last_campaign.ad_medium
        WHEN 'naver_talktalk' THEN ad_medium_mapping := '결합메시지';
        WHEN 'sms' THEN ad_medium_mapping := '문자메시지';
        WHEN 'kakao' THEN ad_medium_mapping := '카카오메시지';
        WHEN 'email' THEN ad_medium_mapping := '이메일';
        ELSE ad_medium_mapping := '결합메시지'; -- 기본값
    END CASE;
    
    -- 템플릿 코드 생성: {한글명}-{ID}
    template_code := ad_medium_mapping || '-' || template_id::VARCHAR;
    
    RETURN template_code;
END;
$$ LANGUAGE plpgsql;

-- 3. 기존 모든 템플릿에 대해 template_code 생성 및 업데이트
UPDATE message_templates 
SET template_code = generate_template_code(id)
WHERE template_code IS NULL;

-- 4. template_code 컬럼에 NOT NULL 제약조건 추가
ALTER TABLE message_templates 
ALTER COLUMN template_code SET NOT NULL;

-- 5. template_code에 인덱스 추가 (검색 성능 향상)
CREATE INDEX idx_message_templates_template_code 
ON message_templates(template_code);

-- 6. 임시 함수 삭제 (마이그레이션 완료 후 정리)
-- DROP FUNCTION generate_template_code(INTEGER);

COMMENT ON COLUMN message_templates.template_code IS '템플릿 코드: 마지막 사용 캠페인의 ad_medium 기반으로 생성된 의미있는 식별자';