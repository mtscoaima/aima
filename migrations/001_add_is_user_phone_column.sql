-- 마이그레이션: sender_numbers 테이블에 is_user_phone 컬럼 추가
-- 실행일: 2024-01-20
-- 목적: 사용자 기본 전화번호와 일반 발신번호를 구분하기 위한 컬럼 추가

-- 1. sender_numbers 테이블에 is_user_phone 컬럼 추가
ALTER TABLE sender_numbers 
ADD COLUMN is_user_phone BOOLEAN DEFAULT FALSE;

-- 2. 인덱스 추가 (성능 최적화)
CREATE INDEX idx_sender_numbers_user_phone 
ON sender_numbers(user_id, is_user_phone);

-- 3. 기존 사용자의 전화번호가 발신번호에 있는지 확인하고 is_user_phone=TRUE 설정
UPDATE sender_numbers 
SET is_user_phone = TRUE 
WHERE (user_id, phone_number) IN (
  SELECT u.id, u.phone_number 
  FROM users u 
  WHERE u.phone_number IS NOT NULL
);

-- 4. 발신번호가 없는 사용자들의 전화번호를 발신번호로 추가
INSERT INTO sender_numbers (user_id, phone_number, display_name, is_default, is_user_phone, is_verified, status, created_at, updated_at)
SELECT 
  u.id,
  u.phone_number,
  CONCAT(u.name, ' (본인)'),
  CASE WHEN NOT EXISTS(SELECT 1 FROM sender_numbers WHERE user_id = u.id) THEN TRUE ELSE FALSE END,
  TRUE,
  FALSE,
  'ACTIVE',
  NOW(),
  NOW()
FROM users u
LEFT JOIN sender_numbers sn ON u.id = sn.user_id AND u.phone_number = sn.phone_number
WHERE u.phone_number IS NOT NULL AND sn.id IS NULL;

-- 5. 데이터 검증 쿼리 (확인용)
-- 다음 쿼리로 마이그레이션이 성공했는지 확인할 수 있습니다:
-- SELECT u.id, u.phone_number, u.name, COUNT(sn.id) as sender_count
-- FROM users u
-- LEFT JOIN sender_numbers sn ON u.id = sn.user_id AND sn.is_user_phone = TRUE
-- WHERE u.phone_number IS NOT NULL
-- GROUP BY u.id, u.phone_number, u.name
-- HAVING COUNT(sn.id) = 0;
-- (위 쿼리 결과가 0개여야 함)