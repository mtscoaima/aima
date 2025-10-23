# MTS Message 프로젝트 코드베이스 분석 (v2.0)

## 📊 프로젝트 개요

### 기술 스택
- **프레임워크**: Next.js 15.3.2 (App Router)
- **언어**: TypeScript 5
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: JWT 기반 커스텀 인증 (Supabase Auth 미사용)
- **스타일링**: Tailwind CSS 4, CSS Modules
- **AI 통합**: OpenAI API (GPT-4, DALL-E 3)
- **SMS/MMS**: Naver SENS API
- **결제**: NicePay (KG이니시스)
- **파일 처리**: Sharp (이미지), xlsx (엑셀), html2canvas
- **차트**: Chart.js, react-chartjs-2
- **기타**: bcryptjs, jsonwebtoken, nodemailer, uuid, crypto-js

### 아키텍처 구조
```
클라이언트 (React/Next.js)
    ↓ (API 호출, JWT 토큰)
API Routes (Next.js API)
    ↓ (Service Role Key)
Supabase (PostgreSQL + Storage)
    ↓
외부 서비스 (Naver SENS, OpenAI, NicePay, 공공데이터 API)
```

**핵심 아키텍처 원칙**:
- 클라이언트에서는 Supabase 직접 접근 불가
- 모든 데이터 작업은 API Routes를 통해서만 수행
- Service Role Key는 서버 사이드에서만 사용
- JWT 토큰 기반 인증 (액세스 토큰: 1시간, 리프레시 토큰: 7일)
- 폴링 기반 실시간 업데이트 (Supabase Realtime 미사용)

### 프로젝트 통계 (2025-01-24 기준)
- **총 TypeScript 파일**: 346개
- **API 엔드포인트**: 151개
- **페이지**: 63개
- **컨텍스트**: 4개 (Auth, Balance, Notification, Pricing)

---

## 🏗️ 디렉토리 구조

### 주요 페이지 그룹

**관리자 페이지** (`/admin/`):
- `campaigns/`: 캠페인 관리 및 승인
- `campaign-industries/`: 캠페인 업종 관리
- `campaign-settings/`: 캠페인 설정
- `user-management/`: 회원 관리
- `member-approval/`: 회원 승인 관리
- `point-charge-management/`: 포인트 충전 관리
- `tax-invoices/`: 세금계산서 관리
- `customer-support/`: 고객지원 (문의, FAQ 관리)
- `statistics/`: 통계 대시보드
- `system-settings/`: 시스템 설정
- **`notifications/`**: 🆕 SMS 알림 관리 (템플릿/로그)

---

## 🆕 최신 업데이트 (Phase 3 - SMS 알림 시스템)

### SMS 알림 시스템 개요
관리자에게 중요한 이벤트를 SMS로 자동 알림하는 시스템입니다.
- **실제 SMS 발송 없음**: DB 로그 및 콘솔 출력만 수행 (테스트/추적용)
- **관리자 대상**: role='ADMIN'인 모든 사용자에게 발송
- **5가지 이벤트**: 회원가입, 사업자 인증, 캠페인 생성/승인, 발신번호 등록

### 구현 파일

#### 1. 데이터베이스
**마이그레이션**: `migrations/20250124_create_sms_notifications.sql`
- `sms_notification_templates`: 알림 템플릿 관리
- `sms_notification_logs`: 발송 로그 저장
- 5개 초기 템플릿 데이터 삽입

```sql
-- 템플릿 테이블
CREATE TABLE sms_notification_templates (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL,  -- 'USER' | 'ADMIN'
  message_type VARCHAR(10) NOT NULL,     -- 'SMS' | 'LMS'
  subject VARCHAR(100),                  -- LMS 제목
  content_template TEXT NOT NULL,        -- {{변수}} 형식
  variables JSONB,                       -- 변수 설명
  is_active BOOLEAN DEFAULT TRUE,        -- ON/OFF 토글
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 로그 테이블
CREATE TABLE sms_notification_logs (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES sms_notification_templates(id),
  event_type VARCHAR(100) NOT NULL,
  recipient_user_id INTEGER REFERENCES users(id),
  recipient_phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(10) NOT NULL,
  subject VARCHAR(100),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'LOGGED',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. 백엔드 로직

**타입 정의**: `src/types/notificationEvents.ts`
```typescript
export enum NotificationEventType {
  USER_SIGNUP = 'user.signup',
  COMPANY_REGISTERED = 'company.registered',
  CAMPAIGN_CREATED = 'campaign.created',
  CAMPAIGN_APPROVED = 'campaign.approved',
  SENDER_NUMBER_REGISTERED = 'sender_number.registered'
}

export interface NotificationEventData {
  eventType: NotificationEventType;
  userId?: number;
  data: Record<string, string>;
}
```

**알림 서비스**: `src/lib/notificationService.ts`
```typescript
export async function triggerNotification(
  eventData: NotificationEventData
): Promise<void> {
  // 1. 템플릿 조회
  // 2. 수신자 결정 (USER/ADMIN)
  // 3. 변수 치환
  // 4. DB 로그 저장
  // 5. 콘솔 출력
}
```

#### 3. API 통합
다음 API에서 알림 트리거:
- `POST /api/users/signup-with-files`: 회원가입 시 → `user.signup`
- `POST /api/business-verification/submit`: 사업자 인증 신청 시 → `company.registered`
- `POST /api/campaigns`: 캠페인 생성 시 → `campaign.created`
- `POST /api/admin/campaigns/[id]/approve`: 캠페인 승인 시 → `campaign.approved`
- `POST /api/sender-numbers`: 발신번호 등록 시 → `sender_number.registered`

#### 4. 관리자 API
**템플릿 관리**:
- `GET /api/admin/sms-templates`: 템플릿 목록 조회
- `PUT /api/admin/sms-templates/[id]`: 템플릿 수정
- `PATCH /api/admin/sms-templates/[id]/toggle`: ON/OFF 토글

**로그 조회**:
- `GET /api/admin/sms-logs`: 발송 로그 조회 (필터링, 페이지네이션)

#### 5. 관리자 UI
**통합 페이지**: `/admin/notifications` (page.tsx)
- **템플릿 관리 탭**: 5개 템플릿 ON/OFF, 내용 수정
- **발송 로그 탭**: 발송 이력 조회, 상세 보기

**스타일**: `styles.css` (탭 네비게이션, 카드, 테이블, 모달)

### 5가지 알림 이벤트

| 이벤트 | 이벤트 타입 | 수신자 | 타입 | 설명 |
|--------|------------|--------|------|------|
| 회원가입 축하 | `user.signup` | 사용자 | LMS | 가입 완료 시 환영 메시지 |
| 기업 검수요청 | `company.registered` | 관리자 | SMS | 사업자 인증 신청 시 알림 |
| 캠페인 검수요청 | `campaign.created` | 관리자 | SMS | 캠페인 생성 시 승인 요청 |
| 캠페인 검수완료 | `campaign.approved` | 사용자 | SMS | 캠페인 승인 완료 알림 |
| 발신번호 검수요청 | `sender_number.registered` | 관리자 | SMS | 발신번호 등록 시 알림 |

### 템플릿 변수 치환
템플릿에서 `{{변수명}}` 형식으로 동적 데이터 삽입:
- `{{userName}}`: 사용자 이름
- `{{companyName}}`: 회사명
- `{{campaignName}}`: 캠페인명
- `{{startDate}}`, `{{endDate}}`: 날짜

**예시**:
```
템플릿: "캠페인 검수요청 : [{{companyName}}][{{userName}}][{{campaignName}}]"
실제 발송: "캠페인 검수요청 : [언더밀리][홍길동][신제품 출시 캠페인]"
```

### 발송 로직
```typescript
// 1. 이벤트 발생 (예: 캠페인 생성)
await triggerNotification({
  eventType: NotificationEventType.CAMPAIGN_CREATED,
  userId: userId,
  data: {
    companyName: "언더밀리",
    userName: "홍길동",
    campaignName: "신제품 출시"
  }
});

// 2. 템플릿 조회 및 변수 치환
// 3. 관리자 전화번호 조회 (role='ADMIN')
// 4. 로그 저장 + 콘솔 출력
```

### 콘솔 출력 형식
```
📱 [SMS 알림 로그]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 이벤트: campaign.created
👤 수신자: 관리자 (010-1234-5678)
📝 타입: SMS
💬 내용:
   캠페인 검수요청 : [언더밀리][홍길동][신제품 출시 캠페인]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 로그 저장 완료 (ID: 123)
```

---

## 📡 API 엔드포인트 (151개)

### 🆕 SMS 알림 API
**관리자 전용**:
- `GET /api/admin/sms-templates`: 템플릿 목록
- `PUT /api/admin/sms-templates/[id]`: 템플릿 수정
- `PATCH /api/admin/sms-templates/[id]/toggle`: 활성화 토글
- `GET /api/admin/sms-logs`: 발송 로그 (필터링, 페이지네이션)

### 인증 관련 (`/api/auth/`)
- `check-email`: 이메일 중복 확인
- `check-username`: 아이디 중복 확인
- `send-verification`: 이메일 인증 발송
- `find-username`: 아이디 찾기
- `find-password`: 비밀번호 찾기
- **Google 소셜 로그인**: `google-auth-url`, `google-token`, `google-login`, `google-signup`
- **Kakao 소셜 로그인**: `kakao-auth-url`, `kakao-token`, `kakao-login`, `kakao-signup`
- **Naver 소셜 로그인**: `naver-auth-url`, `naver-token`, `naver-login`, `naver-signup`
- **KG이니시스 본인인증**: `inicis-auth/request`, `inicis-auth/callback`, `inicis-auth/result`
- `validate-referral`: 추천인 코드 검증
- `validate-referrer`: 추천인 검증

### 사용자 관리 (`/api/users/`)
- `login`: 로그인
- `signup`: 회원가입
- `signup-with-files`: 파일 포함 회원가입 🔔 (user.signup 알림)
- `refresh`: 토큰 갱신
- `me`: 사용자 정보 조회/수정
- `change-password`: 비밀번호 변경
- `withdraw`: 회원 탈퇴
- `update-referral-views`: 추천인 조회수 업데이트
- `generate-code`: 추천인 코드 생성
- `referral-chain`: 추천인 체인 조회
- `referral-stats`: 추천 통계
- `social-link`: 소셜 계정 연동
- `upload-documents`: 문서 업로드

### 메시지 발송 (`/api/messages/`, `/api/message/`)
- `send`: 즉시/예약 발송
- `scheduled`: 예약 메시지 조회
- `scheduled-send-check`: 예약 발송 체크 (Cron)
- `upload-image`: 이미지 업로드
- **템플릿 관리** (`templates/`): GET/POST, `[id]` (상세/수정/삭제)

### 캠페인 관리 (`/api/campaigns/`)
- GET/POST: 캠페인 목록 조회/생성 🔔 (campaign.created 알림)
- `[id]`: 상세 조회/수정/삭제
- `[id]/rejection`: 거절 사유 조회
- `ad-costs`: 광고비 계산

### 관리자 기능 (`/api/admin/`)

**캠페인 관리**:
- `campaigns/[id]/approve`: 캠페인 승인 🔔 (campaign.approved 알림)
- `campaigns/[id]/reject`: 캠페인 거부
- `campaigns/[id]/start`: 캠페인 시작
- `campaigns/[id]/pause`: 캠페인 일시정지

**사용자 관리**:
- `users`: 사용자 목록
- `users/bulk`: 일괄 작업
- `users/charge`: 포인트 충전
- `users/reset-password`: 비밀번호 초기화
- `users/export`: 엑셀 내보내기

**포인트 관리**:
- `point-charge`: 충전 내역 조회/승인
- `point-charge/bulk`: 일괄 충전
- `point-status`: 포인트 현황 조회

**세금계산서**:
- `tax-invoices`: 목록/발행
- `tax-invoices/[id]`: 상세
- `tax-invoices/template`: 템플릿
- `tax-invoices/upload`: 파일 업로드
- `tax-invoices/export`: 엑셀 내보내기

**기타**:
- `inquiries`: 문의 관리
- `terms`: 약관 관리
- `system-settings`: 시스템 설정
- `grade-settings`: 등급 설정
- `companies`: 사업자 정보 조회

### 발신번호 관리 (`/api/sender-numbers/`)
- GET/POST: 발신번호 목록/등록 🔔 (sender_number.registered 알림)
- `[id]`: 발신번호 상세/수정/삭제
- `[id]/set-default`: 기본 발신번호 설정

### 사업자 인증 (`/api/business-verification/`)
- `verify-business-number`: 사업자번호 검증
- `submit`: 사업자 인증 제출 🔔 (company.registered 알림)

### 예약 시스템 (`/api/reservations/`)
- `spaces/`: 공간 관리
- `bookings/`: 예약 관리
- `auto-rules/`: 자동 메시지 규칙
- `message-templates/`: 메시지 템플릿
- `message-logs/`: 메시지 로그
- `scheduled-messages/`: 예약된 메시지
- `send-message/`: 메시지 발송
- `shared-calendars/`: 공유 캘린더
- `statistics/`: 예약 통계
- `export/csv`, `export/excel`: 데이터 내보내기
- `auto-send-check/`: 자동 발송 체크 (Cron)

### 알림 (`/api/notifications/`)
- GET: 알림 목록
- POST: 알림 발송
- `[id]/read`: 알림 읽음 처리
- `mark-all-read`: 전체 읽음 처리

### 기타 API
- `/api/ai/chat`: OpenAI 채팅
- `/api/ai/send-mms`: AI MMS 생성
- `/api/payment/nicepay/*`: NicePay 결제
- `/api/transactions`: 거래 내역
- `/api/locations/*`: 지역 데이터
- `/api/pricing-settings`: 가격 설정
- `/api/site-settings`: 사이트 설정
- `/api/cron/send-scheduled-messages`: 예약 메시지 자동 발송

---

## 🗄️ 데이터베이스 스키마

### 🆕 SMS 알림 테이블

#### sms_notification_templates
```sql
CREATE TABLE sms_notification_templates (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL,  -- 'USER' | 'ADMIN'
  message_type VARCHAR(10) NOT NULL,     -- 'SMS' | 'LMS'
  subject VARCHAR(100),
  content_template TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_sms_templates_event_type ON sms_notification_templates(event_type);
CREATE INDEX idx_sms_templates_is_active ON sms_notification_templates(is_active);
```

#### sms_notification_logs
```sql
CREATE TABLE sms_notification_logs (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES sms_notification_templates(id),
  event_type VARCHAR(100) NOT NULL,
  recipient_user_id INTEGER REFERENCES users(id),
  recipient_phone_number VARCHAR(20) NOT NULL,
  message_type VARCHAR(10) NOT NULL,
  subject VARCHAR(100),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'LOGGED',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_sms_logs_event_type ON sms_notification_logs(event_type);
CREATE INDEX idx_sms_logs_created_at ON sms_notification_logs(created_at DESC);
CREATE INDEX idx_sms_logs_recipient_user ON sms_notification_logs(recipient_user_id);
```

### 기존 핵심 테이블

#### users (사용자)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  role VARCHAR(20) DEFAULT 'USER',
  approval_status VARCHAR(20) DEFAULT 'PENDING',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  referral_code VARCHAR(20) UNIQUE,
  referred_by INTEGER REFERENCES users(id),
  payment_mode VARCHAR(20),

  -- JSONB 필드
  company_info JSONB,
  tax_invoice_info JSONB,
  documents JSONB,
  agreement_info JSONB,

  -- SNS 연동
  kakao_user_id VARCHAR(255),
  naver_user_id VARCHAR(255),
  google_user_id VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### campaigns (캠페인)
```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  template_id INTEGER REFERENCES message_templates(id),
  status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',

  -- 예산 관련
  budget INTEGER DEFAULT 0,
  campaign_budget INTEGER DEFAULT 0,
  daily_ad_spend_limit INTEGER,

  -- 발송 정책
  send_policy_type VARCHAR(20),
  validity_start_date DATE,
  validity_end_date DATE,
  scheduled_send_date DATE,
  scheduled_send_time TIME,

  -- 타겟 조건
  target_age_groups TEXT[],
  target_locations_detailed JSONB,
  card_amount_max INTEGER,
  card_time_start TIME,
  card_time_end TIME,
  target_industry_top_level VARCHAR(100),
  target_industry_specific VARCHAR(100),
  gender_ratio JSONB,
  desired_recipients TEXT,

  -- 비용 및 예상
  unit_cost INTEGER DEFAULT 0,
  estimated_total_cost INTEGER DEFAULT 0,

  -- 발송 현황
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  -- 기타
  expert_review_requested BOOLEAN DEFAULT false,
  expert_review_notes TEXT,
  message_template TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### transactions (트랜잭션)
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL,  -- charge, usage, refund, penalty, reserve, unreserve
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_id VARCHAR(255),
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔄 주요 비즈니스 로직

### SMS 알림 발송 플로우
```
1. 이벤트 발생 (예: 캠페인 생성)
   ↓
2. triggerNotification() 호출
   ↓
3. 템플릿 조회 (event_type)
   ↓
4. is_active 확인 (OFF면 종료)
   ↓
5. 수신자 결정 (USER/ADMIN)
   - USER: 해당 사용자
   - ADMIN: role='ADMIN'인 모든 사용자
   ↓
6. 변수 치환 ({{변수}} → 실제 값)
   ↓
7. DB 로그 저장 (sms_notification_logs)
   ↓
8. 콘솔 출력 (포맷팅된 메시지)
```

### 캠페인 승인 워크플로우 (알림 포함)
```
1. 사용자가 캠페인 생성
   ↓
2. status = 'PENDING_APPROVAL'
   ↓
3. 예산 예약 (reserve 트랜잭션)
   ↓
4. 🔔 campaign.created 알림 → 관리자
   ↓
5. 관리자 승인 대기
   ↓
6. 관리자 승인 (approve API)
   ↓
7. 예약 해제 (unreserve) + 실제 사용 (usage)
   ↓
8. status = 'APPROVED'
   ↓
9. 🔔 campaign.approved 알림 → 사용자
   ↓
10. 자동 발송 시작
```

### 사업자 인증 플로우 (알림 포함)
```
1. 사용자가 사업자 정보 입력
   ↓
2. 사업자등록번호 검증 (공공데이터 API)
   ↓
3. 검증 성공 → 서류 제출
   ↓
4. users 테이블 업데이트
   - company_info (JSONB)
   - documents (JSONB)
   - approval_status = 'PENDING'
   ↓
5. notifications 테이블에 알림 저장
   ↓
6. 🔔 company.registered SMS 알림 → 관리자
   ↓
7. 관리자 승인 대기
   ↓
8. 승인 시 approval_status = 'APPROVED'
```

---

## 🔐 보안 및 인증

### JWT 토큰 관리
```typescript
// 액세스 토큰 payload
{
  userId: number,
  username: string,
  email: string,
  name: string,
  phoneNumber: string,
  role: string,
  approval_status: string,
  exp: number // 1시간
}

// 리프레시 토큰 payload
{
  userId: number,
  username: string,
  email: string,
  name: string,
  phoneNumber: string,
  type: "refresh",
  exp: number // 7일
}
```

### 역할 기반 권한 관리
- `USER`: 일반 사용자
- `ADVERTISER`: 광고주 (승인된 사용자)
- `SALESPERSON`: 영업사원
- `ADMIN`: 관리자

### RoleGuard 컴포넌트
```typescript
<RoleGuard allowedRoles={['ADMIN']}>
  <AdminDashboard />
</RoleGuard>
```

### API 레벨 권한 검증
```typescript
const authResult = validateAuthWithSuccess(request);
if (!authResult.isValid) {
  return authResult.errorResponse;
}

const { role } = authResult.userInfo;
if (role !== 'ADMIN') {
  return NextResponse.json(
    { error: '권한이 없습니다' },
    { status: 403 }
  );
}
```

---

## 🚀 배포 및 환경 설정

### 환경 변수
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# JWT
JWT_SECRET=xxx

# Naver SENS
NAVER_SENS_SERVICE_ID=xxx
NAVER_ACCESS_KEY_ID=xxx
NAVER_SECRET_KEY=xxx

# OpenAI
OPENAI_API_KEY=xxx

# 공공데이터 API
ODCLOUD_SERVICE_KEY=xxx

# NicePay
NICEPAY_CLIENT_ID=xxx
NICEPAY_SECRET_KEY=xxx

# 기타
TEST_CALLING_NUMBER=010-1234-5678
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Vercel 배포
- **자동 배포**: Git push 시 자동 배포
- **환경 변수**: Vercel Dashboard에서 설정
- **Cron Jobs**: `vercel.json`에 정의

```json
{
  "crons": [
    {
      "path": "/api/cron/send-scheduled-messages",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## 📝 최근 업데이트 히스토리

### Phase 3 (2025-01-24): SMS 알림 시스템
- ✅ SMS 알림 템플릿 관리 시스템
- ✅ 5가지 이벤트 알림 구현
- ✅ 관리자 알림 관리 페이지 (템플릿/로그)
- ✅ 변수 치환 시스템
- ✅ ON/OFF 토글 기능
- ✅ 발송 로그 조회 및 필터링

### Phase 2 (2025-01-21~23): 캠페인 업종 관리
- ✅ 캠페인 업종 관리 시스템 (정식/커스텀)
- ✅ 차등 단가 시스템 (업종별/메시지 타입별)
- ✅ 관리자 업종 관리 페이지

### Phase 1 (2024-12~2025-01): 기본 시스템 구축
- ✅ Next.js 15 + Supabase 기본 구조
- ✅ JWT 인증 시스템
- ✅ 메시지 발송 시스템 (Naver SENS)
- ✅ AI 타겟 마케팅 (OpenAI)
- ✅ 예약 관리 시스템
- ✅ 추천인 시스템
- ✅ 결제 시스템 (NicePay)

---

## 📊 요약

MTS Message는 **Next.js 15 + Supabase + JWT 인증**을 기반으로 한 종합 마케팅 플랫폼입니다.

**핵심 기능**:
1. **메시지 발송**: SMS/LMS/MMS 즉시/예약 발송
2. **AI 타겟 마케팅**: OpenAI 기반 캠페인 자동 생성
3. **예약 관리**: 공간 예약 및 자동 메시지
4. **다중 역할**: 일반 사용자, 광고주, 영업사원, 관리자
5. **추천인 시스템**: 2단계 수수료 구조
6. **결제 시스템**: NicePay 연동 포인트 충전
7. **업종별 차등 단가**: 정식 업종/커스텀 업종 관리
8. **🆕 SMS 알림 시스템**: 관리자 알림 자동화

**아키텍처 특징**:
- 클라이언트는 API Routes를 통해서만 데이터 접근
- JWT 토큰 기반 인증 (Supabase Auth 미사용)
- 폴링 기반 실시간 업데이트 (30초 간격)
- JSONB 필드를 활용한 유연한 데이터 구조
- 차등 단가 시스템으로 업종별 다른 가격 적용
- 🆕 이벤트 기반 알림 시스템 (템플릿 변수 치환)

**보안**:
- Service Role Key는 서버 사이드에서만 사용
- 역할 기반 권한 관리 (RoleGuard)
- 자동 토큰 갱신 및 재시도
- 파일 업로드 RLS 정책

---

**문서 버전**: v2.0
**최종 업데이트**: 2025-01-24
**작성자**: Claude Code Analysis

이 문서는 코드베이스의 전체적인 구조와 주요 기능을 이해하는데 도움이 될 것입니다.
