# MTS Message 데이터베이스 ERD (Entity Relationship Diagram)

## 📊 데이터베이스 개요

- **총 테이블 수**: 36개
- **핵심 도메인**: 사용자 관리, 메시징, 캠페인, 결제, 추천 시스템
- **데이터베이스**: PostgreSQL (Supabase)
- **작성일**: 2025년 1월

## 🗂️ 테이블 분류

### 1. 사용자 관리 (User Management)
- `users` - 사용자 정보
- `companies` - 회사 정보
- `company_documents` - 회사 서류
- `user_balances` - 사용자 잔액
- `user_behavior_logs` - 사용자 행동 로그
- `user_credit_stats` - 사용자 크레딧 통계
- `user_terms_agreements` - 사용자 약관 동의
- `terms_agreements` - 약관 정보

### 2. 메시징 시스템 (Messaging System)
- `campaigns` - 캠페인
- `campaign_messages` - 캠페인 메시지
- `campaign_targets` - 캠페인 대상
- `campaign_rejections` - 캠페인 거부 사유
- `message_templates` - 메시지 템플릿
- `message_logs` - 메시지 로그
- `sender_numbers` - 발신번호

### 3. 결제 및 정산 (Payment & Settlement)
- `transactions` - 거래 내역
- `payments` - 결제 정보
- `payment_methods` - 결제 수단
- `credit_packages` - 크레딧 패키지
- `tax_invoices` - 세금계산서
- `settlements` - 정산
- `postpaid_subscriptions` - 후불 구독
- `postpaid_usage` - 후불 사용량
- `monthly_usage_stats` - 월별 사용 통계

### 4. 추천 시스템 (Referral System)
- `referrals` - 추천 관계
- `rewards` - 리워드

### 5. 고객 지원 (Customer Support)
- `inquiries` - 문의사항
- `inquiry_replies` - 문의 답변
- `inquiry_attachments` - 문의 첨부파일
- `faqs` - 자주 묻는 질문
- `announcements` - 공지사항

### 6. 알림 시스템 (Notification System)
- `notifications` - 알림
- `notification_reads` - 알림 읽음 상태

### 7. 시스템 설정 (System Settings)
- `system_settings` - 시스템 설정
- `grade_settings` - 등급 설정
- `grade_history` - 등급 변경 이력

## 🔗 주요 테이블 관계

### Foreign Key 관계 목록

```
campaigns.template_id → message_templates.id
campaign_messages.campaign_id → campaigns.id
campaign_targets.campaign_id → campaigns.id
campaign_rejections.campaign_id → campaigns.id
campaign_rejections.admin_user_id → users.id

sender_numbers.user_id → users.id
message_logs.campaign_message_id → campaign_messages.id

referrals.referrer_id → users.id
referrals.referred_user_id → users.id
rewards.campaign_id → campaigns.id

inquiries.user_id → users.id
inquiry_attachments.inquiry_id → inquiries.id
inquiry_replies.inquiry_id → inquiries.id
inquiry_replies.admin_id → users.id

notifications.recipient_user_id → users.id
notifications.sender_user_id → users.id
notification_reads.notification_id → notifications.id
notification_reads.user_id → users.id

payments.campaign_id → campaigns.id
tax_invoices.user_id → users.id

company_documents.company_id → companies.id
grade_history.user_id → users.id
grade_history.changed_by → users.id

postpaid_usage.subscription_id → postpaid_subscriptions.id
user_terms_agreements.terms_agreement_id → terms_agreements.id
```

## 📋 핵심 테이블 상세 구조

### 1. users 테이블 (사용자)
```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    role USER_ROLE DEFAULT 'USER',  -- USER, ADMIN, SALESPERSON
    referral_code VARCHAR(20),  -- 미사용 (referrals 테이블로 대체)
    approval_status VARCHAR(20) DEFAULT 'PENDING',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,  -- 미사용
    identity_verified BOOLEAN DEFAULT false,
    ci VARCHAR(255),  -- 본인인증 CI
    birth_date DATE,
    
    -- JSONB 필드
    company_info JSONB,
    tax_invoice_info JSONB,
    documents JSONB,
    approval_log JSONB,
    
    -- 소셜 로그인
    kakao_user_id TEXT,
    naver_user_id TEXT,
    google_user_id TEXT,
    
    -- 약관 동의
    agree_terms BOOLEAN DEFAULT false,
    agree_privacy BOOLEAN DEFAULT false,
    agree_sms_marketing BOOLEAN DEFAULT false,
    agree_email_marketing BOOLEAN DEFAULT false,
    agreed_at TIMESTAMP,
    
    -- 결제 모드
    payment_mode VARCHAR(20) DEFAULT 'prepaid',
    
    -- 등급
    grade VARCHAR(50) DEFAULT '일반',
    grade_updated_at TIMESTAMP,
    monthly_usage_amount INTEGER DEFAULT 0,
    
    -- 추천 통계
    referral_views INTEGER DEFAULT 0,
    total_referrals INTEGER DEFAULT 0,
    active_referrals INTEGER DEFAULT 0,
    
    -- 타임스탬프
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    identity_verified_at TIMESTAMP
);
```

### 2. campaigns 테이블 (캠페인)
```sql
CREATE TABLE campaigns (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    template_id BIGINT REFERENCES message_templates(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status CAMPAIGN_STATUS DEFAULT 'DRAFT',
    
    -- 발송 통계
    total_recipients INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    
    -- 예산
    budget NUMERIC,
    actual_cost NUMERIC,
    
    -- 승인
    approved_by BIGINT,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- 스케줄링
    scheduled_at TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    schedule_start_date TIMESTAMP,
    schedule_end_date TIMESTAMP,
    schedule_send_time_start TIME,
    schedule_send_time_end TIME,
    schedule_timezone VARCHAR DEFAULT 'Asia/Seoul',
    schedule_days_of_week INTEGER[],
    
    -- 타겟팅
    target_criteria JSONB DEFAULT '{}',
    message_template TEXT NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. transactions 테이블 (거래)
```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,  -- charge, usage, refund, penalty
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reference_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. message_templates 테이블 (템플릿)
```sql
CREATE TABLE message_templates (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    category VARCHAR(100),
    variables JSONB,
    buttons JSONB,
    is_private BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_ai_generated BOOLEAN DEFAULT false,
    ai_model VARCHAR(100),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. referrals 테이블 (추천)
```sql
CREATE TABLE referrals (
    id BIGINT PRIMARY KEY,
    referrer_id BIGINT NOT NULL REFERENCES users(id),
    referred_user_id BIGINT REFERENCES users(id),
    referral_code TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT now()
);
```

### 6. notifications 테이블 (알림)
```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY,
    recipient_user_id BIGINT REFERENCES users(id),
    recipient_role VARCHAR(50),
    sender_user_id BIGINT REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    action_url VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🎨 ERD 다이어그램 (dbdiagram.io 형식)

```dbml
// 사용자 관리
Table users {
  id bigint [pk]
  email varchar [unique, not null]
  username varchar [unique]
  password varchar [not null]
  name varchar [not null]
  phone_number varchar [not null]
  role varchar [default: 'USER']
  approval_status varchar
  company_info jsonb
  payment_mode varchar
  grade varchar
  created_at timestamp
}

Table user_balances {
  user_id bigint [pk, ref: > users.id]
  current_balance integer
  updated_at timestamp
}

// 캠페인 시스템
Table campaigns {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  template_id bigint [ref: > message_templates.id]
  name varchar [not null]
  status varchar
  total_recipients integer
  sent_count integer
  created_at timestamp
}

Table campaign_messages {
  id bigint [pk]
  campaign_id bigint [ref: > campaigns.id]
  recipient_phone varchar
  message_content text
  sent_at timestamp
}

Table message_templates {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  name varchar [not null]
  content text [not null]
  category varchar
  is_private boolean
  created_at timestamp
}

// 거래 시스템
Table transactions {
  id uuid [pk]
  user_id bigint [ref: > users.id]
  type varchar [not null]
  amount integer [not null]
  description text
  metadata jsonb
  created_at timestamp
}

Table credit_packages {
  id integer [pk]
  credits integer [not null]
  price numeric [not null]
  is_popular boolean
  is_active boolean
}

// 추천 시스템
Table referrals {
  id bigint [pk]
  referrer_id bigint [ref: > users.id]
  referred_user_id bigint [ref: > users.id]
  referral_code text
  status text
  created_at timestamp
}

Table rewards {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  campaign_id bigint [ref: > campaigns.id]
  reward_type varchar
  amount numeric
  created_at timestamp
}

// 발신번호
Table sender_numbers {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  phone_number varchar [not null]
  is_default boolean
  is_verified boolean
  created_at timestamp
}

// 문의 시스템
Table inquiries {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  category varchar
  title varchar
  content text
  status varchar
  created_at timestamp
}

Table inquiry_replies {
  id bigint [pk]
  inquiry_id bigint [ref: > inquiries.id]
  admin_id bigint [ref: > users.id]
  reply_content text
  created_at timestamp
}

// 알림 시스템
Table notifications {
  id bigint [pk]
  recipient_user_id bigint [ref: > users.id]
  sender_user_id bigint [ref: > users.id]
  title varchar
  message text
  type varchar
  is_read boolean
  created_at timestamp
}

Table notification_reads {
  notification_id bigint [ref: > notifications.id]
  user_id bigint [ref: > users.id]
  read_at timestamp
}

// 정산 시스템
Table settlements {
  id bigint [pk]
  user_id bigint [ref: > users.id]
  settlement_month varchar
  total_amount numeric
  commission_amount numeric
  status varchar
  created_at timestamp
}

Table tax_invoices {
  id integer [pk]
  user_id integer [ref: > users.id]
  invoice_number varchar
  total_amount numeric
  issue_date date
  created_at timestamp
}
```

## 📊 테이블 통계

| 분류 | 테이블 수 | 주요 테이블 |
|-----|----------|------------|
| 사용자 관리 | 8 | users, user_balances, companies |
| 메시징 | 7 | campaigns, message_templates, sender_numbers |
| 결제/정산 | 9 | transactions, payments, credit_packages |
| 추천 시스템 | 2 | referrals, rewards |
| 고객 지원 | 5 | inquiries, faqs, announcements |
| 알림 | 2 | notifications, notification_reads |
| 시스템 | 3 | system_settings, grade_settings |

## 🔍 특이사항

### 실제 존재하지만 API에서 미사용
- `rewards` 테이블 - 별도 테이블 존재하지만 API는 transactions 사용
- `settlements` 테이블 - 별도 테이블 존재하지만 API는 transactions 사용
- `companies`, `company_documents` - 테이블은 있지만 users.company_info JSONB 사용
- `payment_methods` - 테이블은 있지만 활용 안됨
- `postpaid_subscriptions`, `postpaid_usage` - 후불제 관련 테이블 미사용

### 미사용 컬럼
- `users.referral_code` - referrals 테이블로 대체
- `users.email_verified` - 이메일 인증 기능 미구현

### JSONB 필드 활용
- `users.company_info` - 회사 정보
- `users.tax_invoice_info` - 세금계산서 정보
- `users.documents` - 제출 서류
- `transactions.metadata` - 거래 메타데이터
- `campaigns.target_criteria` - 타겟팅 조건

## 🎯 최적화 권장사항

1. **중복 테이블 정리**
   - rewards, settlements 테이블 활용 또는 제거
   - companies 테이블과 users.company_info JSONB 통합

2. **미사용 컬럼 제거**
   - users.referral_code
   - users.email_verified

3. **인덱스 추가**
   - transactions(user_id, type, created_at)
   - campaigns(user_id, status)
   - notifications(recipient_user_id, is_read)

4. **JSONB 최적화**
   - 자주 조회되는 JSONB 필드를 별도 컬럼으로 분리

---

*이 ERD는 2025년 1월 Supabase 실제 테이블 조회를 통해 작성되었습니다.*