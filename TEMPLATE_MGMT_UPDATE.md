# 템플릿 관리 시스템 업데이트 내역 (2025-01-31)

## Phase 3: 카카오 알림톡 테스트 - 사전 조건 추가

### 📌 사전 조건 (업데이트됨)

- ✅ **카카오 발신프로필이 DB에 등록되어 있음** (`kakao_sender_profiles` 테이블)
  - 카카오톡 채널 개설 후 토큰 발급 받기
  - `/api/kakao/sender/register` API로 발신프로필 등록
  - MTS에서 `sender_key` 발급 받아 DB에 자동 저장
  - `status='A'`, `block=false`, `dormant=false` 상태여야 함

- ✅ **알림톡 템플릿이 DB에 등록되어 있음** (`kakao_alimtalk_templates` 테이블) - **NEW**

  **템플릿 등록 방법 1: UI 템플릿 추가 모달 사용**
  1. 메시지 발송 페이지 → "카카오/네이버 톡톡" 탭 → "알림톡" 서브 탭
  2. 발신프로필 선택 후 "템플릿 추가" 버튼 클릭
  3. 템플릿 정보 입력:
     - 템플릿 코드 (최대 30자, 영문/숫자/언더스코어)
     - 템플릿 이름 (최대 200자)
     - 템플릿 내용 (변수 형식: #{변수명})
     - (선택) 즉시 검수 요청 체크박스
  4. "등록" 버튼 클릭 → MTS API로 템플릿 등록 및 DB 저장

  **템플릿 등록 방법 2: API 직접 호출**
  ```bash
  POST /api/kakao/templates/create
  Content-Type: application/json
  Authorization: Bearer {access_token}

  {
    "senderKey": "your_sender_key",
    "templateCode": "WELCOME_001",
    "templateName": "가입환영 메시지",
    "templateContent": "안녕하세요, #{고객명}님!\n가입을 환영합니다.",
    "templateMessageType": "BA",
    "templateEmphasizeType": "NONE",
    "requestInspection": false
  }
  ```

  - 등록 후 MTS에서 검수 요청 및 승인 대기 (2-3 영업일)
  - 승인된 템플릿만 발송 가능 (`inspection_status='APR'`)

- ✅ 템플릿 코드 (template_code) 확인
- ✅ 사용자 잔액 충분 (최소 100원 이상 권장)

**⚠️ 중요**:
- 발신프로필 조회는 **Supabase DB**에서 수행됩니다.
- 템플릿 조회는 **Supabase DB**에서 수행되며, **10분마다 MTS API와 자동 동기화**됩니다.
- 템플릿 등록/삭제는 **MTS Template API**를 통해 실행되고 즉시 DB에 반영됩니다.

**사전 조건 확인 쿼리:**
```sql
-- 1. 카카오 발신프로필 확인
SELECT sender_key, yellow_id, channel_name, status, block, dormant
FROM kakao_sender_profiles
WHERE user_id = 'your_user_id'
  AND status = 'A'
  AND block = false
  AND dormant = false;

-- 2. 알림톡 템플릿 확인 (NEW)
SELECT
  template_code,
  template_name,
  inspection_status,
  status,
  created_at,
  synced_at
FROM kakao_alimtalk_templates
WHERE user_id = 'your_user_id'
  AND sender_key = 'your_sender_key'
  AND inspection_status = 'APR'  -- 승인됨
  AND status = 'A';               -- 정상

-- 3. 사용자 잔액 확인
SELECT balance FROM users WHERE id = 'your_user_id';
```

### 📋 Phase 3 테스트 체크리스트 (업데이트됨)

#### ✅ 3.0 템플릿 등록 및 관리 - **NEW**
- [ ] "알림톡" 서브 탭에서 "템플릿 추가" 버튼 표시 확인
- [ ] "템플릿 추가" 버튼 클릭 시 모달 열림
- [ ] 템플릿 코드 입력 가능 (최대 30자, 문자 카운터 표시)
- [ ] 템플릿 이름 입력 가능 (최대 200자, 문자 카운터 표시)
- [ ] 템플릿 내용 입력 가능 (변수 안내 문구 확인)
- [ ] "즉시 검수 요청" 체크박스 표시
- [ ] "등록" 버튼 클릭 성공
- [ ] MTS API 호출 성공 (POST /mts/api/create/template)
- [ ] DB에 템플릿 저장 확인 (kakao_alimtalk_templates)
- [ ] 모달 닫힌 후 템플릿 목록 자동 새로고침
- [ ] 등록된 템플릿이 목록에 표시됨
- [ ] 템플릿 없을 때 "첫 템플릿 추가하기" 버튼 표시
- [ ] 템플릿 삭제 기능 동작 확인 (DB 및 MTS API 모두 삭제)
- [ ] 10분 후 자동 동기화 확인 (synced_at 업데이트)

#### ✅ 3.1 알림톡 발송 (템플릿 변수 치환)
- [ ] "카카오/네이버 톡톡" 탭 선택 가능
- [ ] "알림톡" 서브 탭 선택 가능
- [ ] 발신프로필 드롭다운 정상 표시
- [ ] 발신프로필 선택 시 템플릿 자동 로딩 (DB에서 조회)
- [ ] 템플릿 선택 가능
- [ ] 템플릿 내용 미리보기 표시
- [ ] 수신번호 입력 정상
- [ ] 변수 입력 필드 자동 생성 확인
- [ ] 모든 변수 값 입력 (고객명, 배송상태, 송장번호)
- [ ] "발송" 버튼 클릭 성공
- [ ] MTS 응답 코드 1000 확인
- [ ] 카카오톡 알림톡 수신 확인 (노란색 배경)
- [ ] 변수 치환 정확성 확인
- [ ] 잔액 15원 차감 확인
- [ ] message_logs에 type='ALIMTALK' 저장 확인
- [ ] metadata에 sender_key, template_code 저장 확인

---

## 신규 API 엔드포인트 (4개)

### 1. POST /api/kakao/templates/create
**기능**: 알림톡 템플릿 등록 (MTS API 호출 + DB 저장)

**Request Body**:
```json
{
  "senderKey": "string (required)",
  "templateCode": "string (required, max 30)",
  "templateName": "string (required, max 200)",
  "templateContent": "string (required)",
  "templateMessageType": "BA | EX | AD | MI (default: BA)",
  "templateEmphasizeType": "NONE | TEXT | IMAGE | ITEM_LIST (default: NONE)",
  "categoryCode": "string (optional)",
  "buttons": [
    {
      "name": "string",
      "type": "WL | AL | BK | MD | BC | BT | AC | P1",
      "url_mobile": "string (optional)",
      "url_pc": "string (optional)"
    }
  ],
  "requestInspection": "boolean (default: false)"
}
```

**Response**:
```json
{
  "success": true,
  "template": {
    "id": "uuid",
    "template_code": "string",
    "inspection_status": "REG | REQ",
    "created_at": "timestamp"
  }
}
```

**테스트 시나리오**:
1. 기본형 템플릿 등록 (검수 요청 안 함)
2. 즉시 검수 요청과 함께 등록
3. 중복 템플릿 코드 에러 처리
4. 필수 필드 누락 검증

### 2. GET /api/kakao/templates
**기능**: 템플릿 목록 조회 (DB 조회 + 자동 동기화)

**Query Parameters**:
- `senderKey`: string (required)

**Response**:
```json
{
  "data": [
    {
      "id": "uuid",
      "sender_key": "string",
      "template_code": "string",
      "template_name": "string",
      "template_content": "string",
      "template_message_type": "BA",
      "inspection_status": "REG | REQ | APR | REJ",
      "status": "A | S | R",
      "buttons": [...],
      "created_at": "timestamp",
      "synced_at": "timestamp"
    }
  ]
}
```

**자동 동기화 로직**:
- 마지막 동기화 시간이 10분 이상 경과 시 백그라운드 동기화 트리거
- 동기화 실행 중에도 즉시 DB 데이터 반환 (Non-blocking)

**테스트 시나리오**:
1. 템플릿 목록 조회 성공
2. 빈 목록 처리
3. 10분 경과 후 자동 동기화 확인

### 3. POST /api/kakao/templates/sync
**기능**: MTS API와 수동 동기화 (모든 템플릿 상태 갱신)

**Query Parameters**:
- `senderKey`: string (required)

**Response**:
```json
{
  "success": true,
  "syncedCount": 5,
  "failedCount": 0
}
```

**동기화 프로세스**:
1. DB에서 해당 sender_key의 모든 템플릿 조회
2. 각 템플릿에 대해 MTS API 호출 (`/mts/api/state/template`)
3. inspection_status, status 업데이트
4. synced_at 타임스탬프 갱신

**테스트 시나리오**:
1. 수동 동기화 버튼 클릭
2. 다수 템플릿 동기화 성공
3. 일부 템플릿 조회 실패 시 에러 핸들링

### 4. DELETE /api/kakao/templates/[templateCode]
**기능**: 템플릿 삭제 (MTS API + DB 양쪽 모두 삭제)

**Query Parameters**:
- `senderKey`: string (required)

**Response**:
```json
{
  "success": true
}
```

**삭제 프로세스**:
1. DB에서 템플릿 조회 (사용자 권한 확인)
2. MTS API 호출 (`/mts/api/delete/template`)
3. MTS 삭제 성공 시 DB에서도 삭제
4. 실패 시 rollback

**테스트 시나리오**:
1. 템플릿 삭제 성공
2. 존재하지 않는 템플릿 삭제 시도
3. 다른 사용자의 템플릿 삭제 시도 (권한 오류)

---

## 데이터베이스 스키마

### kakao_alimtalk_templates 테이블 (NEW)

```sql
CREATE TABLE IF NOT EXISTS kakao_alimtalk_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- 사용자 및 발신프로필 정보
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_key TEXT NOT NULL,

  -- 템플릿 기본 정보
  template_code TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_content TEXT NOT NULL,

  -- 템플릿 타입
  template_message_type TEXT DEFAULT 'BA', -- BA: 기본형, EX: 부가정보형, AD: 채널추가형, MI: 복합형
  template_emphasize_type TEXT DEFAULT 'NONE', -- NONE, TEXT, IMAGE, ITEM_LIST

  -- 검수 및 상태
  inspection_status TEXT, -- REG: 등록, REQ: 검수요청, APR: 승인, REJ: 반려
  status TEXT DEFAULT 'A', -- A: 정상, S: 중지, R: 대기

  -- 추가 정보
  buttons JSONB, -- 버튼 정보 (최대 5개)
  quick_replies JSONB, -- 바로연결 정보 (최대 10개)
  category_code TEXT, -- 템플릿 카테고리 코드
  security_flag TEXT DEFAULT 'N', -- Y: 보안템플릿, N: 일반

  -- 강조 표기형 필드
  template_title TEXT, -- 강조 표기할 핵심 정보
  template_subtitle TEXT, -- 강조 표기 보조 문구

  -- 이미지형 필드
  template_image_name TEXT,
  template_image_url TEXT,

  -- 부가 정보
  template_extra TEXT, -- 부가 정보

  -- 메타데이터
  comments JSONB, -- 검수 코멘트

  -- 타임스탬프
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP, -- 마지막 MTS API 동기화 시간

  -- 제약 조건: 사용자별, sender_key별로 template_code 유일
  UNIQUE(user_id, sender_key, template_code)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_kakao_templates_user_sender
  ON kakao_alimtalk_templates(user_id, sender_key);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_sender_key
  ON kakao_alimtalk_templates(sender_key);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_template_code
  ON kakao_alimtalk_templates(template_code);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_status
  ON kakao_alimtalk_templates(status);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_inspection_status
  ON kakao_alimtalk_templates(inspection_status);

CREATE INDEX IF NOT EXISTS idx_kakao_templates_synced_at
  ON kakao_alimtalk_templates(synced_at DESC);
```

---

## 변경 파일 목록

### 신규 파일 (8개)

**마이그레이션**:
- `migrations/20250131_create_kakao_alimtalk_templates.sql`

**API Routes**:
- `src/app/api/kakao/templates/create/route.ts`
- `src/app/api/kakao/templates/sync/route.ts`
- `src/app/api/kakao/templates/[templateCode]/route.ts`

**유틸리티**:
- `src/utils/kakaoTemplateApi.ts`

**컴포넌트**:
- `src/components/kakao/TemplateCreateModal.tsx`

**MTS API 함수 추가** (기존 파일 수정):
- `src/lib/mtsApi.ts` - createMtsAlimtalkTemplate, requestMtsTemplateInspection, deleteMtsAlimtalkTemplate 함수 추가

### 수정 파일 (2개)

**API Routes**:
- `src/app/api/kakao/templates/route.ts` - DB 조회 로직 + 자동 동기화 추가

**컴포넌트**:
- `src/components/messages/kakao/KakaoAlimtalkTab.tsx` - 템플릿 추가 버튼 및 모달 통합

---

## 통합 플로우

### 템플릿 등록 플로우

```
사용자 → "템플릿 추가" 버튼 클릭
   ↓
TemplateCreateModal 열림
   ↓
Step 1: 템플릿 정보 입력
   ├─ 템플릿 코드 (최대 30자)
   ├─ 템플릿 이름 (최대 200자)
   ├─ 템플릿 내용 (변수 포함)
   └─ (선택) 즉시 검수 요청
   ↓
"등록" 버튼 클릭
   ↓
POST /api/kakao/templates/create
   ├─ 발신프로필 권한 검증
   ├─ MTS API 호출: /mts/api/create/template
   ├─ MTS 등록 성공 시 DB 저장
   └─ (선택) 검수 요청 API 호출
   ↓
성공 알림 표시
   ↓
모달 닫힘 + 템플릿 목록 새로고침
```

### 템플릿 조회 및 동기화 플로우

```
사용자 → 발신프로필 선택
   ↓
GET /api/kakao/templates?senderKey=xxx
   ↓
DB에서 템플릿 조회
   ├─ 템플릿 목록 즉시 반환
   └─ 백그라운드: synced_at 확인
       ↓
   synced_at이 10분 이상 경과?
       ├─ Yes → POST /api/kakao/templates/sync (백그라운드)
       │   ↓
       │   각 템플릿마다 MTS API 호출
       │   ↓
       │   inspection_status, status 업데이트
       │   ↓
       │   synced_at = NOW()
       │
       └─ No → 동기화 스킵
```

---

## 테스트 권장사항

### 템플릿 등록 테스트

1. **기본 템플릿 등록**
   - 변수 없는 간단한 텍스트 템플릿
   - 검수 요청 안 함
   - 상태 확인: `inspection_status='REG'`

2. **변수 포함 템플릿**
   - `#{고객명}`, `#{주문번호}` 등 변수 포함
   - 즉시 검수 요청
   - 상태 확인: `inspection_status='REQ'`

3. **버튼 포함 템플릿** (향후 확장)
   - 웹링크 버튼 추가
   - buttons JSONB 필드 확인

### 동기화 테스트

1. **자동 동기화**
   - 템플릿 조회 후 10분 대기
   - 다시 조회 시 synced_at 업데이트 확인

2. **수동 동기화**
   - "동기화" 버튼 클릭
   - MTS에서 템플릿 상태 변경 후 동기화
   - DB 상태 반영 확인

3. **다수 템플릿 동기화**
   - 10개 이상 템플릿 등록
   - 동기화 성공률 확인
   - 실패 템플릿 에러 로깅

---

**문서 버전**: v1.2 (Template Management Update)
**최종 수정**: 2025-01-31
**작성자**: MTS Message Team
