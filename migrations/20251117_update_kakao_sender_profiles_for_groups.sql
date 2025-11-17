-- ============================================================================
-- 카카오 발신 프로필 테이블 그룹 지원 확장
-- Created: 2025-11-17
-- Purpose: 기존 kakao_sender_profiles 테이블에 그룹 관련 필드 추가
-- ============================================================================

-- 1. group_id 컬럼 추가 (nullable - 그룹에 속하지 않은 프로필 허용)
ALTER TABLE kakao_sender_profiles
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES kakao_profile_groups(id) ON DELETE SET NULL;

-- 2. 인덱스 추가 (그룹별 프로필 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_kakao_sender_profiles_group_id
  ON kakao_sender_profiles(group_id);

-- 3. 컬럼 코멘트
COMMENT ON COLUMN kakao_sender_profiles.group_id IS '프로필이 속한 그룹 (nullable, 그룹 없이도 사용 가능)';

-- ============================================================================
-- Migration Notes
-- ============================================================================
-- 1. group_id는 nullable이므로 기존 프로필에 영향 없음
-- 2. 그룹 삭제 시 ON DELETE SET NULL로 프로필은 유지됨
-- 3. 프로필은 하나의 그룹에만 속할 수 있음 (1:N 관계)
-- 4. kakao_profile_group_members 테이블과의 관계:
--    - group_id: UI에서 빠른 그룹 필터링용 (denormalized)
--    - kakao_profile_group_members: 실제 멤버십 이력 관리용 (normalized)
-- 5. 두 테이블의 데이터 일관성은 애플리케이션 레벨에서 관리됨
