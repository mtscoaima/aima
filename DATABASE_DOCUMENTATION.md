# MTS Message 데이터베이스 문서

## 📊 데이터베이스 구조

### 1. 테이블 목록 및 설명

| 테이블명 | 설명 | 주요 용도 |
|---------|------|----------|
| users | 사용자 정보 | 회원 관리, 인증, 권한 |
| message_templates | 메시지 템플릿 | SMS/MMS 템플릿 관리 |
| campaigns | 캠페인 | 마케팅 캠페인 관리 |
| transactions | 거래 내역 | 결제/충전 내역 |
| sender_numbers | 발신번호 | 등록된 발신번호 관리 |
| notifications | 알림 | 사용자 알림 메시지 |
| referrals | 추천인 | 추천 시스템 관리 |
| rewards | 리워드 | 추천 보상 관리 |
| inquiries | 문의사항 | 고객 문의 관리 |
| faqs | FAQ | 자주 묻는 질문 |
| announcements | 공지사항 | 시스템 공지 |

### 2. 핵심 테이블 상세 스키마

#### 📌 users 테이블
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  role VARCHAR(20) DEFAULT 'USER',  -- USER, ADMIN, SALESPERSON
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  referral_code VARCHAR(20) UNIQUE,  -- 영업사원 추천 코드
  approval_status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING, APPROVED, REJECTED
  
  -- JSON 필드들
  company_info JSONB,           -- 기업 정보
  tax_invoice_info JSONB,       -- 세금계산서 정보
  documents JSONB,              -- 제출 서류
  agreement_info JSONB,         -- 약관 동의 정보
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);
```

**company_info JSON 구조:**
```json
{
  "companyName": "주식회사 예시",
  "ceoName": "홍길동",
  "businessNumber": "123-45-67890",
  "companyAddress": "서울시 강남구 테헤란로 123",
  "companyAddressDetail": "5층 501호",
  "companyPhone": "02-1234-5678",
  "toll080Number": "080-123-4567",
  "customerServiceNumber": "1588-1234"
}
```

#### 📌 message_templates 테이블
```sql
CREATE TABLE message_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,        -- 템플릿 이름
  content TEXT NOT NULL,              -- 템플릿 내용
  image_url TEXT,                     -- 이미지 URL (MMS용)
  category VARCHAR(100) NOT NULL,     -- 카테고리
  usage_count INTEGER DEFAULT 0,      -- 사용 횟수
  is_active BOOLEAN DEFAULT true,
  is_private BOOLEAN DEFAULT false,   -- 개인/공개 구분
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 📌 campaigns 테이블
```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  target_count INTEGER,               -- 발송 대상 수
  sent_count INTEGER DEFAULT 0,       -- 발송 완료 수
  success_count INTEGER DEFAULT 0,    -- 성공 건수
  fail_count INTEGER DEFAULT 0,       -- 실패 건수
  status VARCHAR(50),                 -- DRAFT, PENDING, APPROVED, REJECTED, SENDING, COMPLETED
  scheduled_at TIMESTAMP,              -- 예약 발송 시간
  sent_at TIMESTAMP,                  -- 실제 발송 시간
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. 테이블 관계도

```
users (1) ─────┬──── (N) campaigns
               ├──── (N) message_templates
               ├──── (N) transactions
               ├──── (N) sender_numbers
               ├──── (N) notifications
               ├──── (1) referrals
               └──── (N) inquiries

campaigns (1) ────── (N) campaign_recipients
                └──── (N) campaign_logs

referrals (1) ────── (N) rewards
```

### 4. 샘플 데이터

#### users 테이블 샘플
```sql
INSERT INTO users (email, password, name, phone_number, role, company_info) VALUES
('admin@mts.com', '$2a$10$...', '관리자', '010-0000-0000', 'ADMIN', NULL),
('sales01@mts.com', '$2a$10$...', '김영업', '010-1111-1111', 'SALESPERSON', NULL),
('user01@company.com', '$2a$10$...', '이대표', '010-2222-2222', 'USER', 
  '{"companyName":"테스트상사","businessNumber":"123-45-67890"}'),
('user02@shop.com', '$2a$10$...', '박사장', '010-3333-3333', 'USER',
  '{"companyName":"우리가게","businessNumber":"234-56-78901"}');
```

#### message_templates 테이블 샘플
```sql
INSERT INTO message_templates (name, content, category, usage_count) VALUES
('[봄 세일] 최대 50% 할인', '🌸 봄맞이 특별 세일!\n전 품목 최대 50% 할인\n기간: 3/1~3/31\n\n▶ 바로가기: {링크}', '쇼핑/이커머스', 152),
('[생일 축하] 특별 쿠폰', '🎂 {고객명}님, 생일 축하드립니다!\n특별 할인 쿠폰을 드립니다.\n쿠폰코드: BIRTH2024\n\n▶ 사용하기: {링크}', '고객관리', 89),
('[예약 확인] 방문 알림', '📅 예약이 확인되었습니다.\n일시: {날짜} {시간}\n장소: {지점명}\n\n변경/취소: {링크}', '예약/알림', 234),
('[신메뉴] 출시 안내', '🍔 신메뉴가 출시되었습니다!\n{메뉴명}\n특별가: {가격}원\n\n주문하기: {링크}', '음식점/카페', 67);
```

#### campaigns 테이블 샘플
```sql
INSERT INTO campaigns (user_id, title, content, target_count, status, scheduled_at) VALUES
(3, '3월 봄맞이 프로모션', '봄맞이 특별 할인 행사 안내', 1500, 'APPROVED', '2024-03-01 10:00:00'),
(4, '신메뉴 출시 안내', '이달의 신메뉴를 소개합니다', 800, 'SENDING', '2024-03-15 12:00:00'),
(3, '회원 등급 혜택 안내', 'VIP 회원 특별 혜택', 350, 'COMPLETED', '2024-02-28 14:00:00');
```

### 5. 주요 인덱스

```sql
-- 성능 최적화를 위한 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_templates_category ON message_templates(category);
CREATE INDEX idx_templates_user_id ON message_templates(user_id);
```

### 6. 권한 및 보안

- **Row Level Security (RLS)**: 사용자별 데이터 접근 제한
- **Storage Policies**: 파일 업로드 권한 관리
- **Service Role Key**: 서버 사이드 전용 접근 키

### 7. 백업 및 복구

- **자동 백업**: Supabase에서 매일 자동 백업
- **Point-in-time Recovery**: 최근 7일간 특정 시점 복구 가능
- **수동 백업**: pg_dump 명령어로 수동 백업 가능

## 📝 API 엔드포인트 문서

### 인증 관련
- `POST /api/users/login` - 로그인
- `POST /api/users/signup` - 회원가입
- `POST /api/users/refresh` - 토큰 갱신
- `GET /api/users/me` - 내 정보 조회

### 캠페인 관련
- `GET /api/campaigns` - 캠페인 목록
- `POST /api/campaigns` - 캠페인 생성
- `PUT /api/campaigns/[id]` - 캠페인 수정
- `DELETE /api/campaigns/[id]` - 캠페인 삭제

### 템플릿 관련
- `GET /api/templates` - 템플릿 목록
- `POST /api/templates` - 템플릿 생성
- `PUT /api/templates/[id]` - 템플릿 수정
- `DELETE /api/templates/[id]` - 템플릿 삭제

## 📊 데이터 통계 (예시)

| 구분 | 건수 | 비고 |
|-----|------|-----|
| 총 사용자 수 | 1,234명 | USER: 1,180명, ADMIN: 4명, SALESPERSON: 50명 |
| 활성 캠페인 | 45건 | 일일 평균 15건 |
| 템플릿 수 | 892개 | 공개: 750개, 비공개: 142개 |
| 월 발송량 | 125,000건 | 평균 성공률 98.5% |

## 🔄 최근 변경사항

- 2024.03.01: `users` 테이블에 `payment_mode` 필드 추가
- 2024.02.15: `campaigns` 테이블에 예약발송 기능 추가
- 2024.02.01: `message_templates` 테이블 구조 개선

---

*이 문서는 2024년 3월 기준으로 작성되었습니다.*