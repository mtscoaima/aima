# Phase 2: 예약 메시지 시스템 DB 마이그레이션

## 📋 마이그레이션 개요

예약 관리 시스템에 메시지 발송 기능을 추가하기 위한 데이터베이스 마이그레이션입니다.

---

## 🗂️ 마이그레이션 파일

### 1. `20251001_add_reservation_message_logs.sql` ✅ **Phase 2.1 (필수)**

**목적**: 메시지 발송 이력 저장

**테이블**:
- `reservation_message_logs` - 보낸 메시지 이력

**주요 기능**:
- 발송된 메시지 내용 및 결과 저장
- SMS/LMS/MMS 타입 구분
- 예약과 연결 (선택사항)
- 템플릿 추적 (선택사항)
- 사용자별 발송 통계

**UI 연동**:
- `/reservations/message/list` (보낸 메시지)

**실행 우선순위**: ⭐⭐⭐ 즉시 실행 필요

---

### 2. `20251001_add_reservation_auto_messages.sql` ⏳ **Phase 2.5 (추후)**

**목적**: 자동 메시지 발송 규칙 및 예약 발송

**테이블**:
- `reservation_auto_message_rules` - 자동 발송 규칙
- `reservation_scheduled_messages` - 발송 예정 메시지 큐

**주요 기능**:
- 입실/퇴실 기준 자동 발송
- 상대적/절대적 시점 설정
- 공간별 규칙 적용
- 발송 예정 메시지 관리
- 발송 취소 기능

**UI 연동**:
- `/reservations/message/auto` (자동 메시지 설정)
- `/reservations/message/auto/create` (발송 규칙 만들기)
- `/reservations/message/list/reserved` (발송 예정 메시지)

**실행 우선순위**: ⏸️ Phase 2.5에서 실행

---

## 🚀 실행 방법

### Supabase Dashboard에서 실행

1. Supabase 프로젝트 대시보드 접속
2. **SQL Editor** 메뉴로 이동
3. **New Query** 클릭
4. 아래 파일 내용을 순서대로 복사 & 실행

#### Phase 2.1 (지금 실행)
```sql
-- 1. reservation_message_logs 테이블 생성
-- 파일: 20251001_add_reservation_message_logs.sql
```

#### Phase 2.5 (나중에 실행)
```sql
-- 2. 자동 메시지 테이블 생성
-- 파일: 20251001_add_reservation_auto_messages.sql
```

---

## 📊 테이블 관계도

```
users (기존)
  ↓
  ├─→ reservation_message_templates (기존) ←─┐
  │                                          │
  ├─→ spaces (기존) ─┐                      │
  │                   ↓                      │
  ├─→ reservations (기존) ←─┐               │
  │                           │               │
  └─→ reservation_message_logs ──────────────┤
      (Phase 2.1 - 발송 이력)               │
                                              │
      reservation_auto_message_rules ────────┘
      (Phase 2.5 - 자동 규칙)
              ↓
      reservation_scheduled_messages
      (Phase 2.5 - 발송 예정)
              ↓
      reservations (예약)
```

---

## 🔐 보안 설정 (RLS)

모든 테이블에 Row Level Security가 적용되어 있습니다:

- ✅ 사용자는 자신의 데이터만 조회/수정 가능
- ✅ JWT 토큰 기반 인증 (`auth.uid()`)
- ✅ CASCADE 설정으로 관련 데이터 자동 삭제

---

## 📈 인덱스 최적화

각 테이블에는 성능 최적화를 위한 인덱스가 포함되어 있습니다:

### reservation_message_logs
- `user_id` - 사용자별 메시지 조회
- `reservation_id` - 예약별 메시지 조회
- `sent_at DESC` - 최근 메시지 조회
- `status` - 발송 상태별 필터링

### reservation_auto_message_rules (Phase 2.5)
- `user_id` - 사용자별 규칙 조회
- `space_id` - 공간별 규칙 조회
- `is_active` (Partial) - 활성 규칙만 조회

### reservation_scheduled_messages (Phase 2.5)
- `user_id` - 사용자별 메시지 조회
- `reservation_id` - 예약별 메시지 조회
- `scheduled_at` - 발송 예정 시간 조회
- `status` - 발송 상태별 필터링
- `(scheduled_at, status)` (Partial) - 발송 대기 메시지 빠른 조회

---

## 🧪 테스트 쿼리

### 1. reservation_message_logs 테스트

```sql
-- 테이블 생성 확인
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reservation_message_logs'
ORDER BY ordinal_position;

-- 샘플 데이터 삽입 (실제 user_id 사용)
INSERT INTO reservation_message_logs (
    user_id,
    to_number,
    to_name,
    message_content,
    message_type,
    status
) VALUES (
    1, -- 실제 user_id로 변경
    '010-1234-5678',
    '홍길동',
    '예약이 확정되었습니다.',
    'SMS',
    'sent'
);

-- 발송 이력 조회
SELECT id, to_name, message_content, message_type, sent_at, status
FROM reservation_message_logs
WHERE user_id = 1 -- 실제 user_id로 변경
ORDER BY sent_at DESC;
```

### 2. reservation_auto_message_rules 테스트 (Phase 2.5)

```sql
-- 테이블 생성 확인
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name IN ('reservation_auto_message_rules', 'reservation_scheduled_messages')
ORDER BY table_name, ordinal_position;

-- 자동 규칙 샘플 데이터
INSERT INTO reservation_auto_message_rules (
    user_id,
    rule_name,
    space_id,
    template_id,
    trigger_type,
    time_type,
    time_value,
    time_direction
) VALUES (
    1, -- 실제 user_id
    '입실 2시간 전 안내',
    1, -- 실제 space_id
    1, -- 실제 template_id
    'check_in',
    'relative',
    120, -- 2시간 = 120분
    'before'
);
```

---

## 🔄 롤백 방법

각 마이그레이션 파일 하단에 롤백 스크립트가 포함되어 있습니다.

### Phase 2.1 롤백
```sql
DROP VIEW IF EXISTS reservation_message_stats;
DROP POLICY IF EXISTS "Users can insert their own message logs" ON reservation_message_logs;
DROP POLICY IF EXISTS "Users can view their own message logs" ON reservation_message_logs;
DROP TABLE IF EXISTS reservation_message_logs CASCADE;
```

### Phase 2.5 롤백
```sql
DROP TRIGGER IF EXISTS trigger_create_scheduled_messages ON reservations;
DROP FUNCTION IF EXISTS create_scheduled_messages_for_reservation();
DROP TRIGGER IF EXISTS update_scheduled_messages_updated_at ON reservation_scheduled_messages;
DROP TRIGGER IF EXISTS update_auto_rules_updated_at ON reservation_auto_message_rules;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP POLICY IF EXISTS "Users can update their own scheduled messages" ON reservation_scheduled_messages;
DROP POLICY IF EXISTS "Users can view their own scheduled messages" ON reservation_scheduled_messages;
DROP POLICY IF EXISTS "Users can manage their own auto rules" ON reservation_auto_message_rules;
DROP TABLE IF EXISTS reservation_scheduled_messages CASCADE;
DROP TABLE IF EXISTS reservation_auto_message_rules CASCADE;
```

---

## ⚠️ 주의사항

1. **Phase 2.1과 Phase 2.5는 독립적**: Phase 2.1만 먼저 실행해도 문제없습니다.

2. **기존 데이터 영향 없음**: 새 테이블만 추가되며 기존 테이블은 수정되지 않습니다.

3. **RLS 정책**: Supabase Auth를 사용하지 않는 경우, RLS 정책을 수정해야 할 수 있습니다.

4. **트리거 비활성화**: Phase 2.5의 자동 메시지 생성 트리거는 기본적으로 비활성화되어 있습니다. 필요 시 주석 해제하여 활성화하세요.

5. **백업 권장**: 프로덕션 환경에서는 실행 전 데이터베이스 백업을 권장합니다.

---

## 📞 문제 발생 시

- SQL 실행 오류: Supabase 대시보드에서 에러 메시지 확인
- RLS 권한 문제: 테스트 시 Service Role Key 사용
- 인덱스 성능 문제: `EXPLAIN ANALYZE` 쿼리로 확인

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-10-01 | 1.0 | 초기 마이그레이션 생성 |
