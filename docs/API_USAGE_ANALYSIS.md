# API 및 데이터베이스 사용 분석 보고서

## 📊 분석 개요
- **분석 일자**: 2025년 1월
- **총 API 엔드포인트 수**: 96개
- **분석된 테이블 수**: 16개

## 🗂️ API에서 사용되는 테이블 목록

### 핵심 테이블 (Core Tables)

| 테이블명 | 사용 빈도 | 주요 작업 | 담당 기능 |
|---------|----------|---------|----------|
| `users` | 매우 높음 | SELECT, INSERT, UPDATE, DELETE | 사용자 관리, 인증, 프로필 |
| `campaigns` | 높음 | SELECT, INSERT, UPDATE | 캠페인 관리 |
| `transactions` | 높음 | SELECT, INSERT | 결제/충전 기록 |
| `message_templates` | 높음 | SELECT, INSERT, UPDATE | 템플릿 관리 |
| `sender_numbers` | 중간 | SELECT, INSERT, UPDATE, DELETE | 발신번호 관리 |
| `notifications` | 중간 | SELECT, INSERT, UPDATE | 알림 시스템 |
| `user_balances` | 중간 | SELECT | 잔액 조회 |
| `tax_invoices` | 낮음 | SELECT, INSERT | 세금계산서 |
| `inquiries` | 낮음 | SELECT, INSERT | 문의사항 |
| `faqs` | 낮음 | SELECT, INSERT, UPDATE | FAQ 관리 |
| `announcements` | 낮음 | SELECT, INSERT | 공지사항 |
| `referrals` | 낮음 | SELECT, INSERT | 추천인 시스템 |
| `system_settings` | 낮음 | SELECT, UPDATE | 시스템 설정 |

### 보조 테이블 (JOIN으로만 사용)

| 테이블명 | 용도 |
|---------|-----|
| `notification_reads` | 알림 읽음 상태 추적 |
| `inquiry_attachments` | 문의 첨부파일 |
| `inquiry_replies` | 문의 답변 |

## 📋 테이블별 사용 컬럼 상세

### 1. `users` 테이블
**사용되는 컬럼들:**
```
- id, email, username, name, phone_number
- password, role, created_at, updated_at
- last_login_at, is_active, approval_status
- company_info (JSONB), tax_invoice_info (JSONB)
- documents (JSONB), agree_terms, agree_privacy
- agree_sms_marketing, agree_email_marketing
- agreed_at, kakao_user_id, naver_user_id, google_user_id
- payment_mode, grade, withdrawal_type, withdrawal_date
- withdrawal_reason, status_reason, change_logs (JSONB)
- approval_log (JSONB)
```

### 2. `campaigns` 테이블
**사용되는 컬럼들:**
```
- id, user_id, name, description, template_id
- status, total_recipients, sent_count
- success_count, failed_count, budget
- target_criteria (JSONB), message_template
- schedule_start_date, schedule_end_date
- schedule_send_time_start, schedule_send_time_end
- schedule_timezone, schedule_days_of_week
- created_at, updated_at
```

### 3. `transactions` 테이블
**사용되는 컬럼들:**
```
- id, user_id, type, amount, description
- reference_id, metadata (JSONB), status
- created_at, updated_at
```

### 4. `message_templates` 테이블
**사용되는 컬럼들:**
```
- id, user_id, name, content, image_url
- category, usage_count, is_active, is_private
- is_ai_generated, ai_model, buttons (JSONB)
- created_at, updated_at
```

### 5. `sender_numbers` 테이블
**사용되는 컬럼들:**
```
- id, user_id, phone_number, display_name
- is_default, is_verified, is_user_phone
- status, created_at, updated_at
```

## 🔍 README에 언급되었지만 API에서 사용되지 않는 가능성이 있는 항목

### 잠재적으로 사용되지 않는 테이블/컬럼
1. **users 테이블**
   - `referral_code` - API에서 직접 참조 없음 (referrals 테이블로 대체된 것으로 보임)
   - `email_verified` - README에 있지만 API에서 미사용

2. **별도 테이블 가능성**
   - `rewards` - README에 언급되었지만 API에서 직접 사용 안됨
   - `settlements` - API 엔드포인트는 있지만 테이블 직접 참조 없음
   - `credit_packages` - API 엔드포인트는 있지만 테이블 참조 없음

## 📈 API 엔드포인트별 테이블 사용 매핑

### /api/users/* 엔드포인트
- **사용 테이블**: users, referrals, transactions
- **주요 작업**: 인증, 프로필 관리, 소셜 로그인

### /api/admin/* 엔드포인트
- **사용 테이블**: users, campaigns, tax_invoices, inquiries, system_settings
- **주요 작업**: 관리자 기능, 승인 관리, 시스템 설정

### /api/campaigns/* 엔드포인트
- **사용 테이블**: campaigns, users
- **주요 작업**: 캠페인 CRUD, 상태 관리

### /api/templates/* 엔드포인트
- **사용 테이블**: message_templates, users
- **주요 작업**: 템플릿 CRUD, 카테고리 관리

### /api/notifications/* 엔드포인트
- **사용 테이블**: notifications, notification_reads
- **주요 작업**: 알림 생성, 읽음 처리

### /api/transactions/* 엔드포인트
- **사용 테이블**: transactions, user_balances
- **주요 작업**: 거래 기록, 잔액 조회

## 🚨 권장 사항

### 1. 데이터베이스 정리
- `referral_code` 컬럼이 users 테이블에 있지만 사용되지 않는다면 제거 고려
- `email_verified` 컬럼 활용 여부 확인 필요

### 2. 누락된 테이블 확인
- `rewards`, `settlements`, `credit_packages` 테이블 존재 여부 확인
- 존재한다면 API 구현 필요, 아니면 엔드포인트 제거 고려

### 3. JSONB 필드 최적화
- 자주 쿼리되는 JSONB 필드는 별도 컬럼으로 분리 고려
- 인덱싱 전략 재검토

### 4. 미사용 API 엔드포인트
다음 엔드포인트들은 구현이 불완전하거나 테이블 참조가 없음:
- `/api/credit-packages/route.ts` - 테이블 참조 없음
- `/api/settlements/route.ts` - 테이블 참조 없음
- `/api/rewards/route.ts` - rewards 테이블 직접 참조 없음

## 📝 결론

전체적으로 데이터베이스 구조는 잘 설계되어 있으나, 몇 가지 정리가 필요한 부분이 있습니다:

1. **활발히 사용되는 테이블** (13개): users, campaigns, transactions, message_templates, sender_numbers, notifications, user_balances, tax_invoices, inquiries, faqs, announcements, referrals, system_settings

2. **JOIN으로만 사용되는 테이블** (3개): notification_reads, inquiry_attachments, inquiry_replies

3. **확인 필요한 테이블** (3개): rewards, settlements, credit_packages

4. **미사용 가능성 있는 컬럼**: users.referral_code, users.email_verified

이 분석을 바탕으로 데이터베이스 스키마를 최적화하고 불필요한 부분을 정리할 수 있을 것입니다.