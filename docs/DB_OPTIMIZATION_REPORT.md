# 데이터베이스 최적화 보고서

## 📊 분석 요약

API 코드 분석 결과, **실제로 사용되지 않는 테이블과 컬럼**을 발견했습니다.

## ❌ 사용되지 않는 테이블

### 1. **실제로 존재하지 않는 테이블** (API는 있지만 테이블 없음)
이 테이블들은 API 엔드포인트는 있지만 실제 테이블이 없어서 API 호출 시 오류가 발생합니다:

| 테이블명 | API 파일 | 상태 | 권장사항 |
|---------|---------|------|---------|
| `credit_packages` | `/api/credit-packages/route.ts` | ❌ 테이블 없음 | 테이블 생성 또는 API 제거 |
| `rewards` | 없음 (transactions 테이블 사용) | ✅ 정상 | 별도 테이블 불필요 |
| `settlements` | 없음 (transactions 테이블 사용) | ✅ 정상 | 별도 테이블 불필요 |

### 2. **README에 언급되었지만 사용되지 않는 가능성이 있는 테이블**

현재 API 분석 결과 모든 주요 테이블은 사용되고 있습니다. 하지만 다음 사항 확인 필요:

- `rewards` 테이블: `/api/rewards/route.ts`가 있지만 실제로는 `transactions` 테이블을 사용
- `settlements` 테이블: `/api/settlements/route.ts`가 있지만 실제로는 `transactions` 테이블을 사용

## ⚠️ 사용되지 않는 컬럼

### `users` 테이블의 미사용 컬럼

| 컬럼명 | README 언급 | API 사용 | 권장사항 |
|--------|------------|---------|---------|
| `referral_code` | ✅ 있음 | ❌ 없음 | `referrals` 테이블로 대체됨, 제거 고려 |
| `email_verified` | ✅ 있음 | ❌ 없음 | 이메일 인증 기능 미구현, 제거 또는 구현 필요 |

## 🔧 즉시 수정 필요 사항

### 1. **credit_packages 테이블 생성** (긴급)
```sql
CREATE TABLE IF NOT EXISTS credit_packages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount INTEGER NOT NULL,           -- 크레딧 양
  price INTEGER NOT NULL,             -- 가격
  discount_rate INTEGER DEFAULT 0,    -- 할인율
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 샘플 데이터
INSERT INTO credit_packages (name, amount, price, discount_rate, display_order) VALUES
('스타터 패키지', 1000, 10000, 0, 1),
('베이직 패키지', 5000, 45000, 10, 2),
('프로 패키지', 10000, 80000, 20, 3),
('엔터프라이즈', 50000, 350000, 30, 4);
```

### 2. **미사용 컬럼 제거** (선택사항)
```sql
-- referral_code 컬럼 제거 (referrals 테이블로 대체됨)
ALTER TABLE users DROP COLUMN IF EXISTS referral_code;

-- email_verified 컬럼 제거 (사용 안함)
ALTER TABLE users DROP COLUMN IF EXISTS email_verified;
```

## ✅ 정상 동작 확인 사항

### 가상 테이블로 동작 (정상)
다음 API들은 별도 테이블 없이 `transactions` 테이블을 활용하여 정상 동작:

1. **`/api/rewards/route.ts`**
   - transactions 테이블에서 리워드 관련 데이터 필터링
   - metadata 필드로 리워드 레벨 구분
   - ✅ 정상 동작

2. **`/api/settlements/route.ts`**
   - transactions 테이블에서 월별 집계
   - 동적으로 정산 내역 생성
   - ✅ 정상 동작

## 📈 성능 최적화 제안

### 1. 인덱스 추가 권장
```sql
-- transactions 테이블 리워드 조회 성능 개선
CREATE INDEX idx_transactions_reward 
ON transactions(user_id, type, status) 
WHERE description LIKE '%리워드%';

-- users 테이블 미사용 컬럼 인덱스 제거
DROP INDEX IF EXISTS idx_users_referral_code;
```

### 2. JSONB 필드 최적화
```sql
-- 자주 조회되는 JSONB 필드를 별도 컬럼으로 분리 고려
-- 예: company_info->>'companyName'을 company_name 컬럼으로
ALTER TABLE users ADD COLUMN company_name VARCHAR(255);
UPDATE users SET company_name = company_info->>'companyName';
```

## 📋 권장 작업 순서

1. **즉시 수행** (Critical)
   - [ ] `credit_packages` 테이블 생성
   - [ ] 테이블 생성 후 `/api/credit-packages/` API 테스트

2. **단기 수행** (1주일 내)
   - [ ] `users.referral_code` 컬럼 제거
   - [ ] `users.email_verified` 컬럼 제거 또는 이메일 인증 기능 구현
   - [ ] 성능 개선 인덱스 추가

3. **장기 검토** (1개월 내)
   - [ ] JSONB 필드 중 자주 사용되는 항목 별도 컬럼화
   - [ ] 미사용 API 엔드포인트 정리

## 💡 추가 발견 사항

1. **user_balances 테이블**: SELECT만 수행되고 UPDATE가 없음
   - transactions 테이블과 동기화 방식 확인 필요
   - 트리거나 별도 프로세스로 업데이트되는지 확인 필요

2. **notification_reads 테이블**: JOIN으로만 사용
   - notifications 테이블과 통합 고려

3. **inquiry_attachments, inquiry_replies 테이블**: JOIN으로만 사용
   - 실제 데이터 입력 API 없음
   - 구현 필요하거나 제거 고려

## 📊 영향도 분석

| 작업 | 영향도 | 리스크 | 우선순위 |
|-----|-------|-------|---------|
| credit_packages 테이블 생성 | 높음 | 낮음 | 1 |
| referral_code 컬럼 제거 | 낮음 | 중간 | 3 |
| email_verified 컬럼 제거 | 낮음 | 낮음 | 2 |
| 인덱스 추가 | 중간 | 낮음 | 2 |

---

*이 보고서는 2025년 1월 기준 코드 분석을 바탕으로 작성되었습니다.*