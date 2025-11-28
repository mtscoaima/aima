-- ============================================================================
-- 마이그레이션: sender_numbers 테이블 완전 제거
-- 날짜: 2025-11-14
-- 목적: 모든 메시지 발송이 users.phone_number를 직접 사용하도록 통일
-- ============================================================================

-- Step 1: spaces 테이블의 외래키 제약 조건 삭제
-- spaces.host_contact_number_id -> sender_numbers.id 참조 제거
ALTER TABLE spaces
DROP CONSTRAINT IF EXISTS spaces_host_contact_number_id_fkey;

-- Step 2: spaces 테이블의 host_contact_number_id 컬럼 삭제
-- 더 이상 공간별 호스트 연락처를 관리하지 않음
-- 모든 메시지는 사용자의 phone_number로 발송됨
ALTER TABLE spaces
DROP COLUMN IF EXISTS host_contact_number_id;

-- Step 3: sender_numbers 테이블 완전 삭제
-- CASCADE 옵션으로 모든 종속 객체도 함께 삭제
DROP TABLE IF EXISTS sender_numbers CASCADE;

-- Step 4: 관련 인덱스 삭제 (있을 경우)
-- sender_numbers 테이블과 함께 자동 삭제되지만, 명시적으로 확인
DROP INDEX IF EXISTS idx_sender_numbers_user_id;
DROP INDEX IF EXISTS idx_sender_numbers_phone_number;
DROP INDEX IF EXISTS idx_sender_numbers_is_default;

-- ============================================================================
-- 마이그레이션 완료 후 확인 사항
-- ============================================================================
-- 1. users.phone_number 컬럼이 모든 사용자에게 설정되어 있는지 확인
--    SELECT id, email, name, phone_number FROM users WHERE phone_number IS NULL;
--
-- 2. 예약 메시지 발송 테스트
--    - reservations 테이블의 메시지 발송이 정상 작동하는지 확인
--
-- 3. 일반 메시지 발송 테스트
--    - /api/messages/send 엔드포인트 정상 작동 확인
--
-- ============================================================================
-- 롤백 방법 (긴급 시)
-- ============================================================================
-- sender_numbers 테이블 재생성은 복잡하므로, 마이그레이션 전 백업 필수
--
-- 백업 명령어 (실행 전):
-- pg_dump -t sender_numbers -t spaces > backup_sender_numbers_20251114.sql
--
-- 복구 명령어:
-- psql -f backup_sender_numbers_20251114.sql
-- ============================================================================
