-- =====================================================
-- 카카오 알림톡 템플릿 관리 테이블 생성
-- 작성일: 2025-01-31
-- 설명: MTS API를 통한 알림톡 템플릿 등록/관리/동기화
-- =====================================================

-- 1. 카카오 알림톡 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS kakao_alimtalk_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 사용자 및 발신프로필 정보
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_key TEXT NOT NULL,

  -- 템플릿 기본 정보
  template_code TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_content TEXT NOT NULL,

  -- 템플릿 타입
  template_message_type TEXT DEFAULT 'BA', -- BA: 기본형, EX: 부가정보형, AD: 채널추가형, MI: 복합형
  template_emphasize_type TEXT DEFAULT 'NONE', -- NONE, TEXT, IMAGE, ITEM_LIST

  -- 검수 및 상태
  inspection_status TEXT, -- REG: 등록, REQ: 검수요청, APR: 승인, REJ: 반려
  status TEXT DEFAULT 'A', -- A: 정상, S: 중지, R: 대기

  -- 추가 정보
  buttons JSONB, -- 버튼 정보 (최대 5개)
  quick_replies JSONB, -- 바로연결 정보 (최대 10개)
  category_code TEXT, -- 템플릿 카테고리 코드
  security_flag TEXT DEFAULT 'N', -- Y: 보안템플릿, N: 일반

  -- 강조 표기형 필드
  template_title TEXT, -- 강조 표기할 핵심 정보
  template_subtitle TEXT, -- 강조 표기 보조 문구

  -- 이미지형 필드
  template_image_name TEXT,
  template_image_url TEXT,

  -- 부가 정보
  template_extra TEXT, -- 부가 정보

  -- 메타데이터
  comments JSONB, -- 검수 코멘트

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP, -- 마지막 MTS API 동기화 시간

  -- 제약 조건: 사용자별, sender_key별로 template_code 유일
  UNIQUE(user_id, sender_key, template_code)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_kakao_templates_user_sender
  ON kakao_alimtalk_templates(user_id, sender_key);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_sender_key
  ON kakao_alimtalk_templates(sender_key);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_template_code
  ON kakao_alimtalk_templates(template_code);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_status
  ON kakao_alimtalk_templates(status);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_inspection_status
  ON kakao_alimtalk_templates(inspection_status);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_synced_at
  ON kakao_alimtalk_templates(synced_at DESC);

-- 3. updated_at 자동 갱신 트리거 함수 생성 (존재하지 않을 경우)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. updated_at 트리거 적용
CREATE TRIGGER update_kakao_alimtalk_templates_updated_at
  BEFORE UPDATE ON kakao_alimtalk_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. 주석 추가
COMMENT ON TABLE kakao_alimtalk_templates IS '카카오 알림톡 템플릿 관리 테이블 - MTS API 연동';
COMMENT ON COLUMN kakao_alimtalk_templates.user_id IS '템플릿 소유 사용자';
COMMENT ON COLUMN kakao_alimtalk_templates.sender_key IS '카카오 발신 프로필 키';
COMMENT ON COLUMN kakao_alimtalk_templates.template_code IS '템플릿 코드 (최대 30자)';
COMMENT ON COLUMN kakao_alimtalk_templates.template_name IS '템플릿 이름 (최대 200자)';
COMMENT ON COLUMN kakao_alimtalk_templates.inspection_status IS 'REG(등록), REQ(검수요청), APR(승인), REJ(반려)';
COMMENT ON COLUMN kakao_alimtalk_templates.status IS 'A(정상), S(중지), R(대기)';
COMMENT ON COLUMN kakao_alimtalk_templates.synced_at IS 'MTS API와 마지막 동기화 시간';
