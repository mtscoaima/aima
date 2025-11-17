-- ============================================================================
-- 카카오 발신 프로필 그룹 관리 테이블 생성
-- Created: 2025-11-17
-- Purpose: MTS API 그룹 관리 기능 지원을 위한 데이터베이스 스키마
-- ============================================================================

-- 1. 카카오 프로필 그룹 테이블
-- groupKey는 MTS 영업팀을 통해 수동으로 발급받아야 함
CREATE TABLE IF NOT EXISTS kakao_profile_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 그룹 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_kakao_profile_groups_user_id
  ON kakao_profile_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_kakao_profile_groups_group_key
  ON kakao_profile_groups(group_key);

-- 그룹 테이블 코멘트
COMMENT ON TABLE kakao_profile_groups IS '카카오 발신 프로필 그룹 메타데이터 (groupKey는 MTS 영업팀 발급)';
COMMENT ON COLUMN kakao_profile_groups.group_key IS 'MTS API에서 사용하는 그룹 고유 키 (MTS 영업팀 발급 필요)';
COMMENT ON COLUMN kakao_profile_groups.name IS '사용자가 설정한 그룹 이름 (UI 표시용)';

-- ============================================================================
-- 2. 카카오 프로필 그룹 멤버십 테이블 (다대다 관계)
-- ============================================================================
CREATE TABLE IF NOT EXISTS kakao_profile_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES kakao_profile_groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES kakao_sender_profiles(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(group_id, profile_id)
);

-- 멤버십 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_kakao_profile_group_members_group_id
  ON kakao_profile_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_kakao_profile_group_members_profile_id
  ON kakao_profile_group_members(profile_id);

-- 멤버십 테이블 코멘트
COMMENT ON TABLE kakao_profile_group_members IS '카카오 발신 프로필과 그룹 간 다대다 관계 (Junction Table)';
COMMENT ON COLUMN kakao_profile_group_members.added_by IS '프로필을 그룹에 추가한 사용자 (추적용)';

-- ============================================================================
-- 3. Row Level Security (RLS) 정책
-- ============================================================================

-- kakao_profile_groups 테이블 RLS 활성화
ALTER TABLE kakao_profile_groups ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인의 그룹만 조회 가능
CREATE POLICY "Users can view own groups"
  ON kakao_profile_groups FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 본인의 그룹만 생성 가능
CREATE POLICY "Users can create own groups"
  ON kakao_profile_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 본인의 그룹만 수정 가능
CREATE POLICY "Users can update own groups"
  ON kakao_profile_groups FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 본인의 그룹만 삭제 가능
CREATE POLICY "Users can delete own groups"
  ON kakao_profile_groups FOR DELETE
  USING (auth.uid() = user_id);

-- kakao_profile_group_members 테이블 RLS 활성화
ALTER TABLE kakao_profile_group_members ENABLE ROW LEVEL SECURITY;

-- 사용자는 본인 그룹의 멤버십만 조회 가능
CREATE POLICY "Users can view own group memberships"
  ON kakao_profile_group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM kakao_profile_groups
      WHERE id = group_id AND user_id = auth.uid()
    )
  );

-- 사용자는 본인 그룹에만 프로필 추가 가능
CREATE POLICY "Users can add profiles to own groups"
  ON kakao_profile_group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM kakao_profile_groups
      WHERE id = group_id AND user_id = auth.uid()
    )
  );

-- 사용자는 본인 그룹의 멤버십만 삭제 가능
CREATE POLICY "Users can remove profiles from own groups"
  ON kakao_profile_group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM kakao_profile_groups
      WHERE id = group_id AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. updated_at 자동 갱신 트리거
-- ============================================================================

-- 트리거 함수 생성 (이미 존재하면 무시)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- kakao_profile_groups 테이블에 트리거 적용
DROP TRIGGER IF EXISTS update_kakao_profile_groups_updated_at ON kakao_profile_groups;
CREATE TRIGGER update_kakao_profile_groups_updated_at
  BEFORE UPDATE ON kakao_profile_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- 1. groupKey는 MTS 영업팀(support@mtsco.co.kr)에 요청하여 발급받아야 함
-- 2. 그룹 생성 API는 존재하지 않으므로, groupKey를 받은 후 수동으로 등록
-- 3. 프로필은 여러 그룹에 속할 수 있음 (다대다 관계)
-- 4. 그룹 삭제 시 멤버십도 CASCADE로 자동 삭제됨
-- 5. RLS 정책으로 사용자는 본인의 그룹만 관리 가능
