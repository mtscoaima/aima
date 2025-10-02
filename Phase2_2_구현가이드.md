# Phase 2.2: 보낸 메시지 & 자동 메시지 구현 가이드

🎯 **목표:**
- 발송된 메시지 이력 관리 (보낸 메시지 페이지)
- 자동 발송 규칙 관리 (자동 메시지 설정)
- Cron Job 기반 자동 발송 실행

---

## 1. 보낸 메시지 기능 구현

### 1.1 데이터베이스 테이블 (이미 계획서에 포함)

```sql
CREATE TABLE reservation_message_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT8 REFERENCES users(id),
    reservation_id INT8 REFERENCES reservations(id),
    template_id INT8 REFERENCES reservation_message_templates(id),

    -- 메시지 내용
    message_content TEXT NOT NULL,
    recipient_phone VARCHAR NOT NULL,
    recipient_name VARCHAR,

    -- 발송 정보
    message_type VARCHAR NOT NULL, -- 'SMS' | 'LMS'
    send_type VARCHAR NOT NULL, -- 'immediate' | 'scheduled' | 'auto'
    scheduled_at TIMESTAMPTZ, -- 예약 발송 시간
    sent_at TIMESTAMPTZ, -- 실제 발송 시간

    -- 발송 결과
    status VARCHAR NOT NULL, -- 'pending' | 'sent' | 'failed'
    sens_request_id VARCHAR,
    sens_message_id VARCHAR,
    error_message TEXT,

    -- 비용
    message_bytes INT,
    credit_used INT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_message_logs_user ON reservation_message_logs(user_id);
CREATE INDEX idx_message_logs_reservation ON reservation_message_logs(reservation_id);
CREATE INDEX idx_message_logs_status ON reservation_message_logs(status);
CREATE INDEX idx_message_logs_sent_at ON reservation_message_logs(sent_at);
```

### 1.2 API 엔드포인트

#### GET /api/reservations/message-logs

보낸 메시지 목록 조회

**Query Parameters:**
```typescript
interface MessageLogsQuery {
  page?: number;
  limit?: number;
  status?: 'pending' | 'sent' | 'failed';
  send_type?: 'immediate' | 'scheduled' | 'auto';
  start_date?: string;
  end_date?: string;
  search?: string; // 고객명, 전화번호 검색
}
```

**Response:**
```typescript
interface MessageLog {
  id: number;
  reservation: {
    id: number;
    customer_name: string;
    space_name: string;
  };
  message_content: string;
  recipient_phone: string;
  message_type: 'SMS' | 'LMS';
  send_type: 'immediate' | 'scheduled' | 'auto';
  sent_at: string;
  status: 'sent' | 'failed';
  error_message?: string;
}
```

#### GET /api/reservations/message-logs/[id]

메시지 상세 조회

### 1.3 UI 연동

**페이지:** `/reservations/message/list/page.tsx`

**주요 기능:**
- 보낸 메시지 목록 (페이지네이션)
- 필터링: 상태, 발송 타입, 날짜 범위
- 검색: 고객명, 전화번호
- 상세보기 모달: 메시지 내용, 발송 결과

**UI 수정 포인트:**
```typescript
// 샘플 데이터 제거
// API 호출로 실제 데이터 로드
const fetchMessageLogs = async () => {
  const token = localStorage.getItem('accessToken');
  const response = await fetch('/api/reservations/message-logs', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  setMessageLogs(data.logs);
};
```

### 1.4 메시지 발송 API 수정

**기존:** `POST /api/reservations/send-message`
**추가:** 발송 후 `reservation_message_logs` 테이블에 기록

```typescript
// 메시지 발송 성공 후
await supabase.from('reservation_message_logs').insert({
  user_id: userId,
  reservation_id: reservationId,
  template_id: templateId,
  message_content: finalMessage,
  recipient_phone: toNumber,
  recipient_name: customerName,
  message_type: messageType, // 'SMS' | 'LMS'
  send_type: 'immediate', // or 'scheduled'
  sent_at: new Date().toISOString(),
  status: 'sent',
  sens_request_id: sensResponse.requestId,
  sens_message_id: sensResponse.messageId,
  message_bytes: messageBytes,
  credit_used: creditUsed
});
```

---

## 2. 자동 메시지 기능 구현

### 2.1 데이터베이스 테이블 (이미 계획서에 포함)

```sql
CREATE TABLE reservation_auto_message_rules (
    id BIGSERIAL PRIMARY KEY,
    user_id INT8 REFERENCES users(id),
    space_id INT8 REFERENCES spaces(id),
    template_id INT8 REFERENCES reservation_message_templates(id),

    -- 규칙 정보
    name VARCHAR NOT NULL,
    is_active BOOL DEFAULT true,

    -- 발송 시점 설정
    trigger_event VARCHAR NOT NULL, -- 'checkin' | 'checkout'
    timing_type VARCHAR NOT NULL, -- 'relative' | 'absolute'

    -- 상대적 시점 (예: 입실 2시간 전)
    relative_value INT,
    relative_unit VARCHAR, -- 'minutes' | 'hours' | 'days'
    relative_direction VARCHAR, -- 'before' | 'after'

    -- 절대적 시점 (예: 1일 전 09:00)
    absolute_days_before INT,
    absolute_time TIME,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auto_rules_user ON reservation_auto_message_rules(user_id);
CREATE INDEX idx_auto_rules_space ON reservation_auto_message_rules(space_id);
CREATE INDEX idx_auto_rules_active ON reservation_auto_message_rules(is_active);
```

### 2.2 API 엔드포인트

#### GET /api/reservations/auto-rules

자동 규칙 목록 조회

**Response:**
```typescript
interface AutoRule {
  id: number;
  name: string;
  space: { id: number; name: string };
  template: { id: number; name: string };
  trigger_event: 'checkin' | 'checkout';
  timing_display: string; // "입실 2시간 전" or "1일 전 09:00"
  is_active: boolean;
}
```

#### POST /api/reservations/auto-rules

자동 규칙 생성

**Body:**
```typescript
interface CreateAutoRuleBody {
  name: string;
  space_id: number;
  template_id: number;
  trigger_event: 'checkin' | 'checkout';
  timing_type: 'relative' | 'absolute';

  // 상대적 시점 (timing_type === 'relative')
  relative_value?: number;
  relative_unit?: 'minutes' | 'hours' | 'days';
  relative_direction?: 'before' | 'after';

  // 절대적 시점 (timing_type === 'absolute')
  absolute_days_before?: number;
  absolute_time?: string; // "09:00"
}
```

#### PUT /api/reservations/auto-rules/[id]

자동 규칙 수정

#### DELETE /api/reservations/auto-rules/[id]

자동 규칙 삭제

### 2.3 UI 연동

**페이지 1:** `/reservations/message/auto/page.tsx`
- 자동 규칙 목록
- 규칙 만들기 버튼
- 활성화/비활성화 토글

**페이지 2:** `/reservations/message/auto/create/page.tsx`
- 규칙 제목 입력
- 대상 공간 선택 (드롭다운)
- 발송 시점 선택 (상대적/절대적)
- 템플릿 선택 (드롭다운)
- 발신자 정보 표시

**UI 수정 포인트:**
```typescript
// auto/page.tsx
const fetchAutoRules = async () => {
  const response = await fetch('/api/reservations/auto-rules', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  setRules(data.rules);
};

// auto/create/page.tsx
const handleCreateRule = async () => {
  const response = await fetch('/api/reservations/auto-rules', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(formData)
  });
};
```

### 2.4 자동 발송 실행 로직 (Cron Job)

**API:** `GET /api/reservations/auto-send-check`

**실행 주기:** 1분마다 (Vercel Cron)

```typescript
// /api/reservations/auto-send-check/route.ts
export async function GET(request: Request) {
  // 1. 활성화된 모든 자동 발송 규칙 조회
  const { data: rules } = await supabase
    .from('reservation_auto_message_rules')
    .select('*, spaces(*), reservation_message_templates(*)')
    .eq('is_active', true);

  for (const rule of rules) {
    // 2. 발송 대상 예약 찾기
    const targetReservations = await findTargetReservations(rule);

    for (const reservation of targetReservations) {
      // 3. 이미 발송된 기록 확인
      const alreadySent = await checkIfAlreadySent(reservation.id, rule.id);

      if (!alreadySent && shouldSendNow(reservation, rule)) {
        // 4. 메시지 발송
        await sendAutoMessage(reservation, rule);
      }
    }
  }

  return NextResponse.json({ success: true });
}

function shouldSendNow(reservation: Reservation, rule: AutoRule): boolean {
  const now = new Date();
  const targetTime = calculateSendTime(reservation, rule);

  // 발송 시간이 지났고, 15분 이내라면 발송
  const diff = now.getTime() - targetTime.getTime();
  return diff >= 0 && diff <= 15 * 60 * 1000; // 15분 이내
}

function calculateSendTime(reservation: Reservation, rule: AutoRule): Date {
  const baseTime = rule.trigger_event === 'checkin'
    ? new Date(reservation.start_datetime)
    : new Date(reservation.end_datetime);

  if (rule.timing_type === 'relative') {
    // 상대적 시점: "입실 2시간 전"
    const multiplier = rule.relative_direction === 'before' ? -1 : 1;
    const offset = rule.relative_value * getMilliseconds(rule.relative_unit);
    return new Date(baseTime.getTime() + multiplier * offset);
  } else {
    // 절대적 시점: "1일 전 09:00"
    const [hours, minutes] = rule.absolute_time.split(':').map(Number);
    const targetDate = new Date(baseTime);
    targetDate.setDate(targetDate.getDate() - rule.absolute_days_before);
    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate;
  }
}

function getMilliseconds(unit: string): number {
  switch (unit) {
    case 'minutes': return 60 * 1000;
    case 'hours': return 60 * 60 * 1000;
    case 'days': return 24 * 60 * 60 * 1000;
    default: return 0;
  }
}
```

### 2.5 Vercel Cron 설정

**파일:** `vercel.json` (프로젝트 루트)

```json
{
  "crons": [
    {
      "path": "/api/reservations/auto-send-check",
      "schedule": "* * * * *"
    }
  ]
}
```

**주의사항:**
- Vercel Pro 플랜 이상 필요
- Cron Job은 UTC 기준으로 실행
- 한국 시간(KST) = UTC + 9시간

---

## 3. 구현 우선순위

### Step 1: 메시지 발송 API 완성 (2-3시간)
- POST /api/reservations/send-message
- reservation_message_logs 기록 로직 추가
- 크레딧 차감 연동

### Step 2: 보낸 메시지 페이지 (2-3시간)
- GET /api/reservations/message-logs
- GET /api/reservations/message-logs/[id]
- /message/list 페이지 연동

### Step 3: 자동 규칙 CRUD API (3-4시간)
- GET /api/reservations/auto-rules
- POST /api/reservations/auto-rules
- PUT /api/reservations/auto-rules/[id]
- DELETE /api/reservations/auto-rules/[id]

### Step 4: 자동 메시지 페이지 연동 (2-3시간)
- /message/auto 페이지 연동
- /message/auto/create 페이지 연동

### Step 5: 자동 발송 Cron Job (4-5시간)
- GET /api/reservations/auto-send-check
- 발송 시간 계산 로직
- 중복 발송 방지 로직
- Vercel Cron 설정

**총 예상 시간: 13-18시간 (2-3일)**

---

## 4. 테스트 시나리오

### 보낸 메시지 기능 테스트
1. 메시지 발송 후 즉시 목록에 표시되는지 확인
2. 필터링 (상태, 발송 타입, 날짜) 동작 확인
3. 검색 (고객명, 전화번호) 동작 확인
4. 상세보기 모달에서 전체 내용 확인
5. 발송 실패 시 에러 메시지 표시 확인

### 자동 메시지 기능 테스트
1. 자동 규칙 생성 (상대적 시점)
2. 자동 규칙 생성 (절대적 시점)
3. 규칙 활성화/비활성화 토글
4. 규칙 수정 및 삭제
5. Cron Job 수동 실행 (테스트용 API 추가)
6. 실제 예약에 대해 자동 발송 확인
7. 중복 발송 방지 확인
8. 발송 시간 계산 정확도 확인

---

## 5. 주의사항

### ⚠️ Cron Job 제약
- Vercel Hobby 플랜: Cron Job 미지원
- Vercel Pro 플랜 이상 필요
- 대안: GitHub Actions, AWS Lambda 등

### ⚠️ 중복 발송 방지
- 같은 예약에 대해 같은 규칙으로 1회만 발송
- `reservation_message_logs`에 `(reservation_id, rule_id)` 조합 확인

### ⚠️ 발송 시간 정확도
- Cron Job이 1분마다 실행되므로 최대 1분 오차 발생
- 15분 이내 발송 대상만 처리 (너무 늦은 발송 방지)

### ⚠️ 타임존 처리
- 모든 시간은 UTC로 저장
- 표시할 때만 KST로 변환
- 사용자 입력 시간(예: "09:00")은 KST로 간주

---

## 6. 성공 기준

### ✅ 보낸 메시지 기능
- 발송 즉시 목록에 반영
- 필터링 및 검색 정확도 100%
- 발송 실패 시 명확한 에러 메시지

### ✅ 자동 메시지 기능
- 자동 규칙 생성/수정/삭제 동작
- 발송 시간 계산 정확도 95% 이상
- 중복 발송 0%
- Cron Job 안정성 99% 이상

### ✅ 사용자 경험
- 보낸 메시지 확인 3클릭 이내
- 자동 규칙 설정 5분 이내 완료
- 모바일 반응형 지원
