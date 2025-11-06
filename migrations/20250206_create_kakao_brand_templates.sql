-- =====================================================
-- 카카오 브랜드 메시지 템플릿 관리 테이블 생성
-- 작성일: 2025-02-06
-- 설명: MTS API를 통한 브랜드 메시지 템플릿 등록/관리/동기화
-- =====================================================

-- 1. 카카오 브랜드 메시지 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS kakao_brand_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 사용자 및 발신프로필 정보
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_key TEXT NOT NULL,
  sender_group_key TEXT, -- 발신프로필 그룹키 (선택)

  -- 템플릿 기본 정보
  template_code TEXT NOT NULL, -- MTS API에서 반환하는 code 필드
  template_name TEXT NOT NULL,
  content TEXT NOT NULL,

  -- 템플릿 타입
  chat_bubble_type TEXT NOT NULL, -- TEXT, IMAGE, VIDEO 등

  -- 검수 및 상태
  status TEXT DEFAULT 'A', -- A: 승인, R: 반려, S: 검수중 등

  -- 추가 정보
  buttons JSONB, -- 버튼 정보 배열
  additional_content TEXT, -- 추가 내용
  image_url TEXT, -- 이미지 URL
  image_name TEXT, -- 이미지 이름
  image_link TEXT, -- 이미지 링크
  adult BOOLEAN DEFAULT false, -- 성인 여부

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP, -- MTS API의 modifiedAt 값 저장
  synced_at TIMESTAMP, -- 마지막 MTS API 동기화 시간

  -- 제약 조건: 사용자별, sender_key별로 template_code 유일
  UNIQUE(user_id, sender_key, template_code)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_brand_templates_user_sender
  ON kakao_brand_templates(user_id, sender_key);

CREATE INDEX IF NOT EXISTS idx_brand_templates_sender_key
  ON kakao_brand_templates(sender_key);

CREATE INDEX IF NOT EXISTS idx_brand_templates_template_code
  ON kakao_brand_templates(template_code);

CREATE INDEX IF NOT EXISTS idx_brand_templates_status
  ON kakao_brand_templates(status);

CREATE INDEX IF NOT EXISTS idx_brand_templates_synced_at
  ON kakao_brand_templates(synced_at DESC);

-- 3. updated_at 자동 갱신 트리거 적용 (기존 함수 재사용)
CREATE TRIGGER update_kakao_brand_templates_updated_at
  BEFORE UPDATE ON kakao_brand_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. 주석 추가
COMMENT ON TABLE kakao_brand_templates IS '카카오 브랜드 메시지 템플릿 관리 테이블 - MTS API 연동';
COMMENT ON COLUMN kakao_brand_templates.user_id IS '템플릿 소유 사용자';
COMMENT ON COLUMN kakao_brand_templates.sender_key IS '카카오 발신 프로필 키';
COMMENT ON COLUMN kakao_brand_templates.sender_group_key IS '카카오 발신 프로필 그룹키 (선택)';
COMMENT ON COLUMN kakao_brand_templates.template_code IS 'MTS API에서 반환하는 템플릿 코드';
COMMENT ON COLUMN kakao_brand_templates.template_name IS '템플릿 이름';
COMMENT ON COLUMN kakao_brand_templates.chat_bubble_type IS 'TEXT, IMAGE, VIDEO 등';
COMMENT ON COLUMN kakao_brand_templates.status IS 'A(승인), R(반려), S(검수중) 등';
COMMENT ON COLUMN kakao_brand_templates.synced_at IS 'MTS API와 마지막 동기화 시간';
