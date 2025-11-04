# MTS API 통합 테스트 가이드

> **프로젝트**: MTS Message Portal
> **작성일**: 2025-10-29
> **최종 업데이트**: 2025-01-04
> **버전**: v2.2 (메시지 전송 로직 개선)
> **목적**: MTS API 전환 후 전체 기능 통합 테스트 가이드
> **대상**: QA 팀, 개발자, 프로젝트 관리자

---

## 🚨 현재 테스트 현황 (2025-11-04 실시간 업데이트)

### 📋 테스트 범위

**✅ 이번 테스트에서 확인할 항목:**
1. UI 기능 동작 확인 (폼, 버튼, 드롭다운)
2. MTS API Request/Response 확인
3. DB 저장 확인 (message_logs, transactions)
4. 잔액 차감 로직 확인
5. **실제 메시지 수신 확인** ← 모든 Phase에서 성공!

**⏸️ 추후 확인할 항목:**
1. 발신번호 등록 API
2. 템플릿 등록 및 승인 프로세스

### 📊 테스트 진행 상태 (v2.4 - 2025-11-04 17:30 기준)
- ✅ **Phase 1-2**: SMS/LMS/MMS (테스트 완료 - 모두 성공!)
  - ✅ SMS 발송 + 변수 치환 (#{이름})
  - ✅ LMS 발송 + 변수 치환 (#{이름}, #{오늘날짜}, #{회사명})
  - ✅ MMS 이미지 업로드 + 발송
  - ✅ 실제 메시지 수신 확인
- ✅ **Phase 1.5**: 크레딧 환불 로직 (코드 검증 완료)
- 🔄 **Phase 3**: 카카오 알림톡 (일부 완료, 변수 치환 보류)
  - ✅ 템플릿 조회 기능 정상 작동
  - ✅ 변수 없는 템플릿 발송 성공 (TEST_INSPECT_001)
  - ⏸️ 변수 포함 템플릿 테스트 보류 (템플릿 승인 대기 중)
  - ✅ inspection_status 필드 제거 완료 (코드 정리)
- ⏸️ **Phase 4**: 카카오 친구톡 (대기)
- ⏸️ **Phase 5**: 네이버 톡톡 (대기)
- ⏸️ **Phase 6**: 카카오 브랜드 메시지 (대기)

> ✅ **최신 업데이트 (2025-11-04 17:30)**: Phase 3 부분 완료
> - 알림톡 템플릿 조회 정상 작동
> - 변수 없는 템플릿 발송 성공 (TEST_INSPECT_001)
> - 변수 포함 템플릿 테스트 보류 (TEST_VAR_002 승인 대기)
> - **중요**: 알림톡 템플릿은 클라이언트에서 변수 치환하지 않음 (MTS API가 처리)
> - inspection_status 필드 완전 제거 (5개 파일 수정)

### 💰 메시지 요금표 (2025-11-03 업데이트)

| 구분 | 메시지 | 단가 (크레딧) |
|------|--------|---------------|
| 문자메시지 | SMS | 25원 |
| 문자메시지 | LMS | 50원 |
| 문자메시지 | MMS | 100원 |
| 카카오 | 알림톡 | 13원 |
| 카카오 | 친구톡 | 20원 |
| 카카오 | 브랜드톡 | 20원 |
| 네이버 | 스마트알림 | 13원 |
| 네이버 | 톡톡광고 | 20원 |

### ✅ 완료된 작업 (2025-11-04 오후 테스트)
- **Phase 1-2 테스트 완료**: SMS/LMS/MMS 모두 성공 🎉
  - **SMS 발송**: 25바이트, 25원, `/sndng/sms/sendMessage` ✅
  - **LMS 발송**: 204바이트, 50원, `/sndng/mms/sendMessage` ✅
  - **MMS 발송**: 이미지 포함, 100원, `/sndng/mms/sendMessage` ✅
  - **변수 치환**: `#{이름}`, `#{오늘날짜}`, `#{회사명}` 정상 작동 ✅
  - **실제 메시지 수신**: SMS, LMS, MMS 모두 수신 확인 ✅
- **이미지 크기 제한 완화**: 300KB → 5MB
  - 파일: `src/components/messages/SmsMessageContent.tsx`
  - 백엔드 자동 최적화: 640×480px, JPEG, 300KB 이하
  - 이슈 해결: 667.4KB 이미지 업로드 성공
- **Phase 1.5 환불 로직 검증**: `refundBalance()` 함수 확인 완료

### ✅ 완료된 작업 (2025-11-03)
- **요금 수정**: 모든 API 엔드포인트 요금 업데이트 완료
- **BrandTab UI 재설계**: 템플릿 선택 방식 + Rich UI (579줄)
- **브랜드 템플릿 조회 API**: fetchBrandTemplates() 구현 완료

### ✅ 완료된 작업 (2025-01-04 오전)
- **SMS/LMS API 엔드포인트 분리**: ER15 에러 해결
  - SMS (90바이트 이하) → `/sndng/sms/sendMessage`
  - LMS/MMS (90바이트 초과 또는 이미지) → `/sndng/mms/sendMessage`
- **커스텀 변수 정규식 업데이트**: `#[변수]` → `#{변수}` 통일
- **크레딧 환불 함수 구현**: `refundBalance()` 추가 (Phase 2 대비)
- **에러 코드 로깅 개선**: ER15, ER17, 3016 등 저장
- **변수 치환 테스트 통합**: 각 Phase 시나리오에 변수 치환 항목 추가

---

## 📋 목차

1. [테스트 개요](#테스트-개요)
2. [테스트 환경 설정](#테스트-환경-설정)
3. [Phase 1-2: SMS/LMS/MMS](#phase-1-2-smslmsmms) (참고용, 완료됨)
4. [Phase 3: 카카오 알림톡](#phase-3-카카오-알림톡)
5. [Phase 4: 카카오 친구톡](#phase-4-카카오-친구톡)
6. [Phase 5: 네이버 톡톡](#phase-5-네이버-톡톡)
7. [Phase 6: 카카오 브랜드 메시지](#phase-6-카카오-브랜드-메시지)

---

## 테스트 개요

### 테스트 목적
- MTS API 전환 작업 검증
- UI/API/DB 연동 확인
- 요금 차감 로직 검증

### 테스트 범위
- **포함**: UI 기능, API Request/Response, DB 저장, 잔액 차감
- **제외**: 실제 메시지 수신 (MTS 환경 설정 대기)

---

## 테스트 환경 설정

### 1. 필수 환경 변수 확인
```bash
NEXT_PUBLIC_SUPABASE_URL=        # Supabase URL
SUPABASE_SERVICE_ROLE_KEY=       # Service Role Key
MTS_AUTH_CODE=                   # MTS 인증 코드
MTS_API_URL=                     # MTS API URL
```

### 2. 테스트 수신번호 준비
- 본인 휴대폰 번호 (01012345678 형식)

### 3. 카카오/네이버 계정 준비
- 카카오 발신프로필 (senderKey)
- 네이버 톡톡 ID (navertalkId)

---

## Phase 1-2: SMS/LMS/MMS

> ✅ **상태**: 테스트 완료 (2025-11-03)
>
> 이 섹션은 참고용입니다. Phase 1-2는 이미 완료되었으며 재테스트가 필요하지 않습니다.

### 📌 완료된 작업
- ✅ SMS/LMS 자동 판단 로직 구현
- ✅ MMS 이미지 업로드 기능 (PNG → JPEG 변환, 640×480px, 300KB)
- ✅ 메시지 발송 API 통합 (MTS API)
- ✅ 잔액 차감 로직 (SMS: 25원, LMS: 50원, MMS: 100원)
- ✅ 메시지 로그 저장 (message_logs)
- ✅ 거래 내역 저장 (transactions)

### 📋 Phase 1-2 테스트 요약 (참고용)

**1.1 SMS 발송 (90바이트 이하)**
- 메시지 타입: SMS
- 예제: "안녕하세요" (15바이트)
- 단가: 25원
- 테스트 결과: ✅ 성공

**1.2 LMS 발송 (90바이트 초과)**
- 메시지 타입: LMS
- 예제: "안녕하세요 고객님, 예약이 정상적으로 완료되었습니다." (93바이트)
- 단가: 50원
- subject 자동 추가: "LMS"
- 테스트 결과: ✅ 성공

**1.3 MMS 발송 (이미지 포함)**
- 메시지 타입: MMS
- 이미지 최적화: PNG → JPEG, 640×480px, 300KB
- 단가: 100원
- subject 자동 추가: "MMS"
- attachment 객체 생성: `{ image: [{ img_url: "..." }] }`
- 테스트 결과: ✅ 성공

### 🔍 주요 확인 사항 (완료)

**메시지 타입 자동 판단:**
```typescript
// src/utils/messageTemplateParser.ts
- 이미지 첨부됨 → MMS
- 메시지 90바이트 초과 → LMS
- 그 외 → SMS
```

**API 엔드포인트 자동 선택 (2025-01-04 개선):**
```typescript
// src/lib/mtsApi.ts (Line 170-175)
const endpoint = messageType === 'SMS'
  ? `${MTS_API_URL}/sndng/sms/sendMessage`   // SMS: 90바이트 이하
  : `${MTS_API_URL}/sndng/mms/sendMessage`;  // LMS/MMS: 90바이트 초과 또는 이미지
```

**ER15 에러 해결:**
- **이전**: 모든 메시지에 단일 엔드포인트 사용 → ER15 에러 발생
- **개선**: 메시지 타입별 올바른 엔드포인트 자동 선택
- **테스트 확인**: Console.log에서 API URL이 메시지 타입에 맞게 출력되는지 확인

**이미지 업로드 워크플로우:**
```
1. 사용자 이미지 업로드 (최대 5MB)
   ↓
2. Sharp 라이브러리로 최적화
   - PNG → JPEG 변환
   - 640×480px 리사이즈
   - 300KB 이하로 압축
   ↓
3. MTS 이미지 업로드 API 호출
   - 엔드포인트: https://api.mtsco.co.kr/img/upload_image
   - 응답: { code: "0000", image: "/2025/11/03/..." }
   ↓
4. 이미지 URL 저장 (Frontend State)
   ↓
5. MMS 발송 시 attachment 객체에 포함
```

**잔액 차감 로직:**
```typescript
// src/lib/messageSender.ts
- SMS: 25원 차감 (transactions 테이블 usage 기록)
- LMS: 50원 차감
- MMS: 100원 차감
- metadata: { usage_type: 'message_send', message_type: 'SMS/LMS/MMS' }
```

**DB 저장 확인:**
```sql
-- message_logs 테이블
SELECT
  id,
  user_id,
  to_number,
  message_type, -- 'SMS', 'LMS', 'MMS'
  message_content,
  credit_used, -- 25, 50, 100
  status, -- 'sent'
  created_at
FROM message_logs
WHERE user_id = YOUR_USER_ID
ORDER BY created_at DESC;

-- transactions 테이블
SELECT
  id,
  user_id,
  type, -- 'usage'
  amount, -- 25, 50, 100
  description, -- '메시지 발송 (SMS/LMS/MMS)'
  metadata, -- { usage_type: 'message_send', message_type: '...' }
  created_at
FROM transactions
WHERE user_id = YOUR_USER_ID
AND type = 'usage'
ORDER BY created_at DESC;
```

### 🎯 핵심 테스트 시나리오 (완료)

#### 시나리오 1.1: SMS 발송 (짧은 메시지 + 변수 치환)
**입력:**
- 수신자: 01012345678
- 메시지: "안녕하세요 #{이름}님"
- 변수: { "이름": "홍길동" }
- 이미지: 없음

**예상 결과:**
- ✅ 메시지 타입: SMS (자동 판단)
- ✅ 변수 치환: "안녕하세요 홍길동님"
- ✅ 잔액 차감: 25원
- ✅ API URL: `https://api.mtsco.co.kr/sndng/sms/sendMessage` (SMS 전용)
- ✅ MTS API 요청 데이터: subject 필드 없음
- ✅ DB 저장: message_type='SMS', credit_used=25

#### 시나리오 1.2: LMS 발송 (긴 메시지 + 변수 치환)
**입력:**
- 수신자: 01012345678
- 메시지: "안녕하세요 #{고객명}님, #{상품명} 예약이 정상적으로 완료되었습니다. 추가 문의사항이 있으시면 언제든지 연락주세요."
- 변수: { "고객명": "김철수", "상품명": "호텔" }
- 이미지: 없음

**예상 결과:**
- ✅ 메시지 타입: LMS (자동 판단, 90바이트 초과)
- ✅ 변수 치환: "안녕하세요 김철수님, 호텔 예약이..."
- ✅ 잔액 차감: 50원
- ✅ API URL: `https://api.mtsco.co.kr/sndng/mms/sendMessage` (⭐ LMS는 MMS API 사용)
- ✅ MTS API 요청 데이터: subject="LMS" 자동 추가
- ✅ DB 저장: message_type='LMS', credit_used=50

#### 시나리오 1.3: MMS 발송 (이미지 포함)
**입력:**
- 수신자: 01012345678
- 메시지: "이미지가 포함된 MMS입니다"
- 이미지: photo.png (1.2MB)

**예상 결과:**
- ✅ 이미지 최적화: 245KB (640×480px, JPEG)
- ✅ MTS 이미지 업로드: /2025/11/03/20251103052213575.jpg
- ✅ 메시지 타입: MMS (이미지 있으면 무조건 MMS)
- ✅ 잔액 차감: 100원
- ✅ MTS API 요청 데이터:
  ```json
  {
    "subject": "MMS",
    "attachment": {
      "image": [{
        "img_url": "/2025/11/03/20251103052213575.jpg"
      }]
    }
  }
  ```
- ✅ DB 저장: message_type='MMS', credit_used=100

### 📝 주요 Console.log 출력 (참고)

**SMS 발송 시:**
```
========================================
[MTS SMS/LMS/MMS API 호출 시작]
시간: 2025-11-03T05:22:45.123Z
메시지 타입: SMS
메시지 크기: 15 바이트
API URL: https://api.mtsco.co.kr/sndng/sms/sendMessage  // ⭐ SMS 전용 엔드포인트
요청 데이터: {
  "callback_number": "010****1234",
  "phone_number": "010****5678",
  "message": "안녕하세요 홍길동님"  // 변수 치환 완료
}
// subject 없음 주목!
========================================
```

**LMS 발송 시:**
```
========================================
[MTS SMS/LMS/MMS API 호출 시작]
메시지 타입: LMS
메시지 크기: 93 바이트
API URL: https://api.mtsco.co.kr/sndng/mms/sendMessage  // ⭐ LMS는 MMS API 사용
요청 데이터: {
  "subject": "LMS",  // ⭐ LMS는 subject 필수!
  "message": "안녕하세요 김철수님, 호텔 예약이..."  // 변수 치환 완료
  ...
}
========================================
```

**MMS 발송 시:**
```
========================================
[MTS 이미지 업로드 시작]
파일명: photo.png
원본크기: 1.2MB
최적화 후: 245KB (640x480px, JPEG)
이미지 URL: /2025/11/03/20251103052213575.jpg
========================================

[MTS SMS API 호출 시작]
메시지 타입: MMS
이미지 포함: Yes
요청 데이터: {
  "subject": "MMS",
  "attachment": {
    "image": [{
      "img_url": "/2025/11/03/20251103052213575.jpg"
    }]
  }
}
========================================
```

### ⚠️ 알려진 이슈 및 해결 현황

**✅ ER15 에러: MessageSizeOverException (해결 완료 - 2025-01-04)**
- **원인**: 잘못된 API 엔드포인트 사용 (SMS/LMS 모두 `/sndng/sms/sendMessage` 사용)
- **해결**: 메시지 타입별 엔드포인트 분리
  - SMS (90바이트 이하) → `/sndng/sms/sendMessage`
  - LMS/MMS (90바이트 초과 또는 이미지) → `/sndng/mms/sendMessage`
- **상태**: 해결 완료 ✅
- **테스트 필요**: LMS 메시지(90바이트 초과) 발송 시 Console.log에서 올바른 API URL 확인

**ER17 에러: NotAllowedCallbackNumber**
- **원인**: 발신번호가 MTS에 등록되지 않음
- **영향**: 메시지 발송 실패 (API 응답은 정상)
- **해결**: MTS 담당자에게 발신번호 등록 요청
- **상태**: 요청 중

**참고**: ER17 에러는 MTS 설정 문제이며, 코드 구현과는 무관합니다. API 호출, 데이터 저장, 잔액 차감은 모두 정상 작동합니다.

---

## 크레딧 환불 로직 (Phase 1.5 - 신규)

> ✅ **상태**: 구현 완료 (2025-01-04) - Phase 2 전송 결과 API 연동 시 활용 예정

### 📌 구현 내용
- **환불 함수**: `refundBalance(userId, amount, reason, metadata)`
- **위치**: `src/lib/messageSender.ts:384-426`
- **트랜잭션 타입**: 'refund'
- **환불 대상 에러**: ER15, ER17, 3016, 3019

### 💡 현재 동작
- **즉시 실패**: 발송 성공 전 실패 → 차감 전이므로 환불 불필요
- **향후 구현**: 전송 결과 API로 비동기 실패 감지 → 자동 환불

### 🔮 Phase 2 계획 (전송 결과 API 연동)

**MTS 전송 결과 API:**
- 알림톡: `POST /rspns/atk/rspnsMessages`
- SMS: `POST /rspns/sms/rspnsMessages`
- MMS: `POST /rspns/mms/rspnsMessages`
- 응답 시간: 최대 5분

**구현 예정:**
1. 주기적 polling (5분 간격)
2. 전달 실패 건 자동 감지
3. 환불 대상 에러 자동 환불
4. message_logs 테이블에 delivery_status 추가

---

## Phase 3: 카카오 알림톡

### 📌 사전 조건
- [ ] 카카오 발신프로필 등록 완료
- [ ] 알림톡 템플릿 등록 및 승인 완료

### 📋 Phase 3 테스트 체크리스트 (2025-11-04 17:30 업데이트)

**3.1 알림톡 템플릿 조회**
- [x] 발신프로필 선택 시 템플릿 자동 로딩 ✅
- [x] 템플릿 목록 드롭다운 표시 ✅
- [x] 템플릿 선택 시 내용 미리보기 표시 ✅

**3.2 알림톡 발송 (변수 없는 템플릿)**
- [x] 템플릿 선택 (TEST_INSPECT_001) ✅
- [x] 발송 버튼 클릭 ✅
- [x] MTS API 응답 코드 `0000` 확인 ✅
- [x] DB 저장 확인 (message_logs) ✅
- [x] 잔액 13원 차감 확인 (transactions) ✅
- [x] 실제 메시지 수신 확인 ✅

**3.3 알림톡 발송 (변수 포함 템플릿) - ⏸️ 보류**
- [x] 템플릿 선택 (TEST_VAR_002: #{고객명}, #{날짜}) ✅
- [x] 발송 API 성공 (code: "0000") ✅
- [ ] ⏸️ 실제 메시지 수신 확인 (템플릿 승인 대기 중)
- [ ] ⏸️ 변수 치환 기능 재테스트 필요
- **참고**: 클라이언트는 변수를 `#{변수명}` 형태로 그대로 전송, MTS API가 서버에서 치환 처리

**3.4 알림톡 → SMS 전환 발송**
- [ ] 전환 발송 설정 (SMS/LMS/MMS)
- [ ] 전환 메시지 입력
- [ ] metadata에 tran_type 저장 확인

**3.5 코드 정리 완료**
- [x] inspection_status 필드 제거 (5개 파일) ✅
  - [x] src/components/messages/kakao/KakaoAlimtalkTab.tsx
  - [x] src/components/messages/AlimtalkTab.tsx
  - [x] src/app/api/kakao/templates/sync/route.ts
  - [x] src/app/api/kakao/templates/create/route.ts
  - [x] src/utils/kakaoApi.ts

### ⚠️ 알림톡 템플릿 매칭 주의사항 (2025-11-04 업데이트)

**✅ 변수 치환 처리 방식 (중요!)**
- **클라이언트**: 템플릿을 `#{변수명}` 형태 그대로 MTS API로 전송
- **MTS API**: 서버에서 변수를 실제 값으로 치환
- **클라이언트에서 변수를 미리 치환하면 안됨!** (3016 에러 발생)

**올바른 예 (클라이언트 → MTS API):**
- 템플릿: `[테스트] #{고객명}님, #{날짜}에 방문 예정입니다.`
- 발송 메시지: `[테스트] #{고객명}님, #{날짜}에 방문 예정입니다.` ✅
- MTS API가 서버에서: `[테스트] 홍길동님, 2025-01-05에 방문 예정입니다.`

**잘못된 예 (클라이언트에서 미리 치환):**
- 템플릿: `[테스트] #{고객명}님, #{날짜}에 방문 예정입니다.`
- 발송 메시지: `[테스트] 홍길동님, 2025-01-05에 방문 예정입니다.` ❌
- 에러: 3016 (템플릿 본문 불일치)

**3016 에러 (템플릿 본문 불일치) 방지:**
- 알림톡 템플릿은 **등록된 내용을 절대 수정 불가**
- 변수 부분(`#{변수명}`)도 그대로 전송
- 템플릿 외 텍스트 추가 시 3016 에러 발생

**에러 코드 로깅 확인:**
- [x] DB metadata에 error_code 저장 확인 ✅
- [x] 주요 에러: 3016(템플릿불일치), 3019(톡유저아님), ER17(미등록발신번호) ✅

### 테스트 시나리오 3.1: 알림톡 발송 (템플릿 변수 치환)

**테스트 단계:**
1. "카카오/네이버 톡톡" 탭 → "알림톡" 서브 탭
2. Kakao Channel 선택 (발신프로필)
3. 템플릿 자동 로딩 확인
4. 변수 포함 템플릿 선택 (예: `안녕하세요 #{고객명}님, #{날짜}에 방문 예정입니다.`)
5. **변수 개수 표시 확인**: "2개의 변수가 존재합니다"
6. **템플릿 내용 readOnly 확인** (수정 불가)
7. 수신자 추가 시 변수 값 입력 (#{고객명} → "홍길동", #{날짜} → "2025-01-05")
8. 발송 버튼 클릭

**예상 결과:**
- [ ] 변수 개수 정확히 표시
- [ ] 변수 치환 정상 동작 (#{고객명} → "홍길동", #{날짜} → "2025-01-05")
- [ ] 템플릿 본문 불변 (3016 에러 없음)
- [ ] MTS API Request 확인 (Network 탭)
- [ ] MTS API Response 확인 (응답 코드 0000 또는 1000)
- [ ] DB 저장 확인 (message_type='KAKAO_ALIMTALK')
- [ ] metadata에 error_code 필드 확인
- [ ] 잔액 13원 차감 확인
- [ ] 실제 메시지 수신 확인

**DB 확인:**
```sql
-- message_logs 확인
SELECT * FROM message_logs
WHERE user_id = YOUR_USER_ID
ORDER BY created_at DESC LIMIT 1;

-- transactions 확인
SELECT * FROM transactions
WHERE user_id = YOUR_USER_ID
ORDER BY created_at DESC LIMIT 1;
```

---

## Phase 4: 카카오 친구톡

### 📌 사전 조건
- [ ] 카카오 발신프로필 등록 완료
- [ ] 친구톡 발송 권한 획득

### 🔧 구현 완료 기능 (v2.0)
- **메시지 타입 자동 감지**: 이미지 첨부 여부에 따라 FT/FI 자동 선택
- **이미지 업로드**: 파일 선택 방식, MTS 이미지 업로드 API 연동
- **이미지 미리보기**: 썸네일, 파일명, 파일 크기 표시
- **imageLink 지원**: 이미지 클릭 시 이동할 URL 설정 가능
- **템플릿 생성 API**: 네이버 톡톡, 카카오 브랜드 템플릿 생성 기능

### 📋 Phase 4 테스트 체크리스트 (초기화 완료)

**4.1 텍스트형 친구톡 (자동 감지 - FT)**
- [ ] 메시지 내용 입력 (이미지 없음 → 자동으로 FT 선택)
- [ ] 광고 여부 선택 (N - 비광고)
- [ ] 발송 버튼 클릭
- [ ] MTS API 응답 코드 확인 (code: "0000")
- [ ] DB 저장 확인
- [ ] 잔액 20원 차감 확인
- [ ] Console.log에서 "[친구톡] 메시지 타입 자동 감지: FT (텍스트형)" 확인

**4.2 이미지형 친구톡 (자동 감지 - FI)**
- [ ] Textarea 하단 이미지 아이콘 버튼 클릭 → 이미지 업로드 섹션 토글
- [ ] "이미지 선택" 버튼으로 JPG/PNG 파일 선택 (300KB 이하)
- [ ] MTS 이미지 업로드 API 호출 및 fileId 저장
- [ ] 이미지 미리보기 확인 (썸네일, 파일명, 크기)
- [ ] 메시지 내용 입력 (치환문구 포함: #[이름], #[날짜])
- [ ] 발송 버튼 클릭
- [ ] Console.log에서 "[친구톡] 메시지 타입 자동 감지: FI (이미지형)" 확인
- [ ] MTS API 응답 성공 (code: "0000")

**4.3 이미지 클릭 링크 (imageLink)**
- [ ] 이미지형 친구톡 선택 (FI)
- [ ] 이미지 업로드
- [ ] 이미지 클릭 링크 URL 입력 (예: https://example.com)
- [ ] 발송 후 MTS API Request에서 img_link 파라미터 확인

**4.4 광고형 친구톡**
- [ ] ad_flag='Y' 선택
- [ ] 광고 문구 포함 확인
- [ ] 발송 시간 제한 확인 (08:00-20:00)

**4.5 실제 메시지 수신 확인**
- [ ] 카카오톡으로 친구톡 메시지 수신 확인

### 테스트 시나리오 4.1: 텍스트형 친구톡 (자동 감지 - FT)

**테스트 단계:**
1. "카카오/네이버 톡톡" 탭 → "친구톡" 서브 탭
2. Kakao Channel 선택
3. **메시지 타입 자동 감지 안내 확인** (파란색 박스)
   - "이미지가 첨부되면 이미지형(FI)으로, 첨부되지 않으면 텍스트형(FT)으로 자동 선택됩니다."
4. 광고 여부: N
5. 메시지 내용 입력 (이미지 첨부 안 함)
6. 수신자 입력
7. 발송 버튼 클릭
8. **Browser Console 확인**: `[친구톡] 메시지 타입 자동 감지: FT (텍스트형)` 메시지 확인

**예상 결과:**
- [ ] MTS API Request 확인
- [ ] MTS API Response 확인 (응답 코드 0000)
- [ ] DB 저장 확인 (message_type='KAKAO_FRIENDTALK')
- [ ] Console.log 자동 감지 메시지 확인 ("[친구톡] 메시지 타입 자동 감지: FT (텍스트형)")
- [ ] 잔액 20원 차감 확인
- [ ] 실제 메시지 수신 확인

### 테스트 시나리오 4.2: 이미지형 친구톡 (자동 감지 - FI + 변수 치환)

**테스트 단계:**
1. "카카오/네이버 톡톡" 탭 → "친구톡" 서브 탭
2. Kakao Channel 선택
3. 메시지 입력란 하단의 **이미지 아이콘 버튼** 클릭
4. "이미지 선택" 버튼 클릭 → JPG/PNG 파일 선택
   - 자동으로 MTS 이미지 업로드 API 호출
   - 업로드 완료 후 썸네일 미리보기 표시
5. **메시지 내용 입력 (변수 사용)**: "안녕하세요 #{이름}님, #{날짜}에 방문 예정입니다."
6. **치환문구 버튼 클릭**: #{이름}, #{날짜} 등 삽입 확인
7. 광고 여부: N
8. 수신자 입력 시 변수 값 입력
9. 발송 버튼 클릭
10. Browser Console 확인: `[친구톡] 메시지 타입 자동 감지: FI (이미지형)`

**예상 결과:**
- [ ] 이미지 업로드 섹션 토글 동작
- [ ] MTS 이미지 업로드 API 성공
- [ ] 이미지 미리보기 표시
- [ ] **치환문구 버튼 동작 확인**
- [ ] **변수 치환 정상 동작** (#{이름} → "홍길동", #{날짜} → "2025-01-05")
- [ ] Console.log 자동 감지: `FI (이미지형)`
- [ ] MTS API Request 확인 (imageUrls: ["fileId"])
- [ ] MTS API Response 확인 (code: "0000")
- [ ] DB 저장 확인 (message_type='KAKAO_FRIENDTALK')
- [ ] 잔액 차감 확인
- [ ] 실제 메시지 수신 확인

---

## Phase 5: 네이버 톡톡

### 📌 사전 조건
- [ ] 네이버 톡톡 계정 등록
- [ ] 템플릿 등록 및 승인 완료

### 📋 Phase 5 테스트 체크리스트

**5.0 네이버 톡톡 템플릿 생성** (선행 작업)
- [ ] 네이버톡 Partner Key 준비
- [ ] 템플릿 코드 정의 (영문+숫자, 유니크)
- [ ] 템플릿 내용 작성 (변수 사용 가능: #{변수명})
- [ ] 상품 코드 선택 (INFORMATION/BENEFIT/CARDINFO)
- [ ] 카테고리 코드 선택 (예: S001-숙박 예약완료)
- [ ] 템플릿 생성 API 호출
- [ ] MTS 검수 요청 및 승인 대기

**5.1 네이버 톡톡 템플릿 조회**
- [ ] 네이버톡 ID 입력
- [ ] 템플릿 자동 로딩 확인
- [ ] 등록된 템플릿 목록 표시 확인

**5.2 네이버 톡톡 메시지 발송**
- [ ] 템플릿 선택
- [ ] 상품 코드 선택 (INFORMATION/BENEFIT/CARDINFO)
- [ ] 템플릿 변수 치환 (있는 경우)
- [ ] 발송 확인
- [ ] 잔액 차감 확인 (스마트알림: 13원, 광고: 20원)

### 테스트 시나리오 5.0: 네이버 톡톡 템플릿 생성

**API 엔드포인트**: `POST /api/messages/naver/templates/create`

**테스트 방법** (브라우저 개발자 도구 Console):

```javascript
// 1. JWT 토큰 가져오기
const token = localStorage.getItem('token');

// 2. 네이버 톡톡 템플릿 생성 API 호출
const createNaverTemplate = async () => {
  const response = await fetch('/api/messages/naver/templates/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      partnerKey: '네이버톡_Partner_Key',  // 실제 Partner Key로 변경
      code: 'TEST_TEMPLATE_001',  // 템플릿 코드 (영문+숫자, 유니크)
      text: '[테스트] #{name}님, 예약이 완료되었습니다.\n예약일시: #{date}\n감사합니다.',
      productCode: 'INFORMATION',  // INFORMATION | BENEFIT | CARDINFO
      categoryCode: 'S001',  // 카테고리 코드 (아래 참고)
      buttons: [  // 선택사항
        {
          type: 'WEB_LINK',
          buttonCode: 'BTN001',
          name: '예약 확인하기',
          url: 'https://example.com/reservation',
          mobileUrl: 'https://m.example.com/reservation'
        }
      ]
    })
  });

  const result = await response.json();
  console.log('========================================');
  console.log('[네이버 톡톡 템플릿 생성 결과]');
  console.log('HTTP 상태:', response.status);
  console.log('응답 데이터:', result);
  console.log('========================================');
  return result;
};

// 실행
createNaverTemplate();
```

**주요 카테고리 코드:**
- **숙박(S)**: S001(예약완료), S002(예약취소), S003(바우처발송), S004(결제요청)
- **예약(T)**: T001(예약완료), T002(예약취소), T003(바우처발송), T004(결제요청)

**예상 결과:**
- [ ] HTTP 상태: 200
- [ ] success: true
- [ ] data.templateId 반환
- [ ] MTS에서 검수 대기 상태로 등록

**검증 포인트:**
- [ ] 필수 파라미터 검증 (partnerKey, code, text, productCode, categoryCode)
- [ ] 상품 코드 유효성 검증 (INFORMATION/BENEFIT/CARDINFO만 허용)
- [ ] 버튼 개수 제한 (최대 5개)
- [ ] 템플릿 변수 형식: #{변수명}

---

### 테스트 시나리오 5.1: 네이버 톡톡 템플릿 조회

**테스트 단계:**
1. "카카오/네이버 톡톡" 탭 → "네이버" 서브 탭
2. 네이버톡 ID (Partner Key) 입력
3. 자동으로 템플릿 목록 로딩 확인 (GET `/api/naver/templates?navertalkId={ID}`)
4. 드롭다운에 등록된 템플릿 목록 표시 확인

**예상 결과:**
- [ ] 템플릿 자동 로딩 성공
- [ ] 등록된 템플릿 목록 드롭다운에 표시
- [ ] 템플릿 정보: 이름, 코드, 내용, 카테고리, 버튼

---

### 테스트 시나리오 5.2: 네이버 톡톡 메시지 발송 (변수 치환)

**테스트 단계:**
1. "카카오/네이버 톡톡" 탭 → "네이버" 서브 탭
2. 네이버톡 ID 입력
3. 템플릿 자동 로딩 확인
4. 변수 포함 템플릿 선택 (예: `#{name}님, 예약 완료: #{date}`)
5. 상품 코드 선택
   - INFORMATION: 스마트알림 (13원)
   - BENEFIT: 광고 (20원)
   - CARDINFO: 스마트알림 (13원)
6. **변수 값 입력**: name="김철수", date="2025-01-05"
7. 수신자 입력
8. 발송 버튼 클릭

**예상 결과:**
- [ ] **변수 치환 정상 동작**
- [ ] MTS API Request 확인
- [ ] MTS API Response 확인
- [ ] DB 저장 확인 (message_type='NAVERTALK')
- [ ] 잔액 차감 확인 (INFORMATION/CARDINFO=13원, BENEFIT=20원)
- ⏸️ 실제 메시지 수신 확인 (추후 테스트)

---

## Phase 6: 카카오 브랜드 메시지

### 📌 사전 조건
- [ ] 카카오 브랜드 메시지 권한 획득
- [ ] 브랜드 템플릿 등록 및 승인 완료

### 🔧 주요 변경사항 (v1.7 - 2025-11-03)
- **구조 변경**: 수동 입력 방식 → 템플릿 선택 방식 (완료)
- **워크플로우**: 알림톡과 동일한 방식 적용
- **UI**: BrandTab.tsx 완전 재작성 (579줄, Rich UI 구조)
- **템플릿 조회**: fetchBrandTemplates() 함수 구현 완료
- **Rich UI**: 템플릿 미리보기, 원형 차트, 변수 치환 등 8개 섹션

### 📋 Phase 6 테스트 체크리스트

**6.0 브랜드 메시지 템플릿 생성** (선행 작업)
- [ ] 발신프로필 Sender Key 준비
- [ ] 템플릿 이름 정의
- [ ] 메시지 타입 선택 (TEXT/IMAGE/WIDE 등 8가지)
- [ ] 템플릿 내용 작성 (타입별 글자 수 제한 확인)
- [ ] 이미지 URL 준비 (IMAGE, WIDE 타입인 경우)
- [ ] 버튼 설정 (타입별 최대 개수 확인)
- [ ] 템플릿 생성 API 호출
- [ ] MTS 검수 요청 및 승인 대기

**6.1 브랜드 템플릿 조회**
- [ ] 발신프로필 선택 시 템플릿 자동 로딩
- [ ] 템플릿 목록 드롭다운 표시
- [ ] 8가지 메시지 타입 필터링 확인
  - TEXT, IMAGE, WIDE, WIDE_ITEM_LIST
  - CAROUSEL_FEED, COMMERCE, CAROUSEL_COMMERCE, PREMIUM_VIDEO
- [ ] 템플릿 선택 시 Template Preview 업데이트
- [ ] Rich UI 구조 8개 섹션 표시 확인

**6.2 브랜드 메시지 발송**
- [ ] 템플릿 선택
- [ ] 템플릿 내용 미리보기 확인
- [ ] 변수 치환 (있는 경우)
- [ ] SMS 백업 설정 (N/S/L/M)
- [ ] 발송 버튼 클릭
- [ ] MTS API 응답 코드 확인
- [ ] DB 저장 확인
- [ ] 잔액 20원 차감 확인

### 테스트 시나리오 6.0: 브랜드 메시지 템플릿 생성

**API 엔드포인트**: `POST /api/messages/kakao/brand/templates/create`

**테스트 방법** (브라우저 개발자 도구 Console):

```javascript
// 1. JWT 토큰 가져오기
const token = localStorage.getItem('token');

// 2. 카카오 브랜드 메시지 템플릿 생성 API 호출
const createBrandTemplate = async () => {
  const response = await fetch('/api/messages/kakao/brand/templates/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      senderKey: '카카오_발신프로필_Sender_Key',  // 실제 Sender Key로 변경
      name: '테스트 브랜드 템플릿',
      chatBubbleType: 'TEXT',  // TEXT | IMAGE | WIDE | WIDE_ITEM_LIST | CAROUSEL_FEED | PREMIUM_VIDEO | COMMERCE | CAROUSEL_COMMERCE
      content: '안녕하세요. #{name}님!\n특별한 혜택을 준비했습니다.',
      adult: false,  // 성인 콘텐츠 여부
      buttons: [  // 선택사항 (타입별 최대 개수 제한)
        {
          ordering: 1,
          type: 'WL',  // WL(웹링크) | AL(앱링크) | BK(봇키워드) | MD(메시지전달)
          name: '자세히 보기',
          linkMo: 'https://m.example.com',
          linkPc: 'https://example.com'
        }
      ]
    })
  });

  const result = await response.json();
  console.log('========================================');
  console.log('[브랜드 메시지 템플릿 생성 결과]');
  console.log('HTTP 상태:', response.status);
  console.log('응답 데이터:', result);
  console.log('========================================');
  return result;
};

// 실행
createBrandTemplate();
```

**메시지 타입별 제한:**

| 타입 | 내용 길이 | 버튼 최대 개수 |
|------|-----------|---------------|
| TEXT | 1000자 | 5개 |
| IMAGE | 400자 | 5개 |
| WIDE | 76자 | 2개 |
| WIDE_ITEM_LIST | - | 2개 |
| PREMIUM_VIDEO | 76자 | 1개 |
| COMMERCE | - | 2개 |
| CAROUSEL_FEED | - | - |
| CAROUSEL_COMMERCE | - | - |

**예상 결과:**
- [ ] HTTP 상태: 200
- [ ] success: true
- [ ] data.templateId 또는 data.code 반환
- [ ] MTS에서 검수 대기 상태로 등록

**검증 포인트:**
- [ ] 필수 파라미터 검증 (senderKey/senderGroupKey, name, chatBubbleType, content)
- [ ] 메시지 타입 유효성 검증 (8가지 타입만 허용)
- [ ] 타입별 내용 길이 검증
- [ ] 타입별 버튼 개수 제한 검증

---

### 테스트 시나리오 6.1: 브랜드 템플릿 조회 기능

**목적**: 발신프로필 선택 시 브랜드 템플릿 자동 로딩 확인

**API 엔드포인트**: `/api/kakao/templates?senderKey={senderKey}`

**테스트 단계:**
1. "카카오/네이버 톡톡" 탭 → "브랜드 메시지" 서브 탭
2. Kakao Channel 섹션에서 발신프로필 선택
3. 템플릿 자동 로딩 확인
4. 드롭다운에서 템플릿 목록 확인

**예상 결과:**
- [ ] 발신프로필 선택 시 즉시 템플릿 로딩 시작
- [ ] 로딩 중 "템플릿 목록을 불러오는 중입니다..." 표시
- [ ] 템플릿 목록이 드롭다운에 표시됨
- [ ] 각 템플릿 항목: `템플릿명 (템플릿코드)`
- [ ] 승인된 템플릿만 표시
- [ ] 템플릿 없을 경우 "등록된 템플릿이 없습니다" 표시

**Rich UI 구조 확인:**
- [ ] 섹션 1: Kakao Channel + Brand Template 선택 (side by side)
- [ ] 섹션 2: Template Preview (8가지 형식 타입 버튼)
- [ ] 섹션 3: Template Info + Example Images
- [ ] 섹션 4: Total Recipients + Targeting (원형 차트)
- [ ] 섹션 5: Text Replacement (변수 치환)
- [ ] 섹션 6: SMS Backup Settings (N/S/L/M 버튼)
- [ ] 섹션 7: Recipient Information (건수 + 예상 금액)
- [ ] 섹션 8: Send Button

**템플릿 선택 시 동작 확인:**
- [ ] 템플릿 선택 시 Template Preview 섹션 업데이트
- [ ] 선택된 템플릿의 message_type에 해당하는 버튼 활성화
- [ ] Template Info 섹션에 템플릿 내용 표시 (읽기 전용)
- [ ] 템플릿에 변수가 있을 경우 Text Replacement 섹션 표시

### 테스트 시나리오 6.1: 텍스트형 브랜드 메시지 (TEXT + 변수 치환)

**테스트 단계:**
1. "카카오/네이버 톡톡" 탭 → "브랜드 메시지" 서브 탭
2. 발신프로필 선택
3. 템플릿 선택 (TEXT 타입, 변수 포함)
4. **변수 개수 표시 확인**: "N개의 변수가 존재합니다"
5. 템플릿 미리보기 확인
6. **Text Replacement 섹션에서 변수 값 입력**
7. SMS 백업 설정 (N/S/L/M)
8. 수신자 입력
9. 발송 버튼 클릭

**예상 결과:**
- [ ] **변수 개수 정확히 표시**
- [ ] **Text Replacement 섹션 표시**
- [ ] **변수 치환 정상 동작**
- [ ] MTS API Request 확인
- [ ] MTS API Response 확인 (응답 코드 0000/1000)
- [ ] DB 저장 확인 (message_type='BRAND_MESSAGE')
- [ ] 잔액 20원 차감 확인
- [ ] metadata에 template_code, message_type 저장 확인
- ⏸️ 실제 메시지 수신 확인 (추후 테스트)

---

## 최종 체크리스트 (v2.3 - 2025-11-04 실시간 업데이트)

### Phase 1-2: SMS/LMS/MMS
- [x] SMS 발송 (90바이트 이하, 25원) + 변수 치환 (#{이름}) ✅
- [x] LMS 발송 (90바이트 초과, 50원) + 변수 치환 (#{이름}, #{오늘날짜}, #{회사명}) ✅
- [x] API 엔드포인트 분리 확인: ✅
  - [x] SMS → `/sndng/sms/sendMessage` (Console.log 확인) ✅
  - [x] LMS/MMS → `/sndng/mms/sendMessage` (Console.log 확인) ✅
- [x] MMS 이미지 업로드 (자동 최적화: 640×480px, JPEG, 300KB) ✅
- [x] MMS 발송 (이미지 포함, 100원) ✅
- [x] 메시지 타입 자동 판단 (이미지→MMS, 90바이트 초과→LMS, 그 외→SMS) ✅
- [x] 잔액 차감 확인 (SMS: 25원, LMS: 50원, MMS: 100원) ✅
- [x] DB 저장 확인 (message_logs, transactions) ✅
- [x] 실제 메시지 수신 확인 (SMS, LMS, MMS 모두 수신) ✅

### Phase 1.5: 크레딧 환불 로직 (신규)
- [x] 환불 함수 구현 확인 (refundBalance) ✅
- [x] Phase 2 전송 결과 API 연동 준비 완료 ✅

### Phase 3: 카카오 알림톡 (2025-11-04 부분 완료)
- [x] 템플릿 조회 기능 ✅
- [x] 변수 없는 템플릿 발송 (TEST_INSPECT_001) ✅
- [x] 변수 없는 템플릿 실제 메시지 수신 ✅
- [x] 잔액 13원 차감 확인 ✅
- [x] MTS API 응답 성공 (code: "0000") ✅
- [x] metadata에 error_code 저장 확인 ✅
- [x] inspection_status 필드 제거 (코드 정리) ✅
- [ ] ⏸️ 변수 포함 템플릿 발송 (TEST_VAR_002 승인 대기 중)
- [ ] ⏸️ 변수 치환 기능 재테스트 (템플릿 승인 후)
- [ ] 버튼 기능
- [ ] SMS 전환 발송
- **참고**: 알림톡은 클라이언트에서 변수 치환하지 않음 (MTS API가 서버에서 처리)

### Phase 4: 카카오 친구톡
- [ ] 텍스트형 (FT) - 비광고
- [ ] 이미지형 (FI) - 이미지 업로드 + 변수 치환 (#{이름}, #{날짜})
- [ ] 치환문구 버튼 동작 확인
- [ ] 이미지 클릭 링크 (imageLink)
- [ ] 와이드형 (FW)
- [ ] 광고형 (ad_flag=Y)
- [ ] 잔액 20원 차감 확인
- [ ] MTS API 응답 성공 (code: "0000")
- [ ] 실제 메시지 수신 확인

### Phase 5: 네이버 톡톡
- [ ] 템플릿 생성 API
- [ ] 템플릿 조회
- [ ] 스마트알림 발송 (INFORMATION, 13원) + 변수 치환
- [ ] 광고 발송 (BENEFIT, 20원) + 변수 치환
- [ ] 상품 코드별 요금 확인
- [ ] 실제 메시지 수신 확인

### Phase 6: 카카오 브랜드 메시지
- [ ] 템플릿 생성 API (8가지 타입)
- [ ] 템플릿 조회 기능
- [ ] 템플릿 선택 워크플로우 (알림톡과 동일)
- [ ] 텍스트형 발송 (TEXT) + 변수 치환
- [ ] 변수 개수 표시 확인
- [ ] Text Replacement 섹션 동작 확인
- [ ] 이미지형 발송 (IMAGE)
- [ ] SMS 백업 설정 (N/S/L/M)
- [ ] 잔액 20원 차감 확인
- [ ] 실제 메시지 수신 확인

---

## 테스트 결과 기록 양식

### Phase 1-2: SMS/LMS/MMS (초기화)
```
테스트 일시:
테스터:
결과: [ ] 성공 [ ] 실패
비고:
```

### Phase 3: 카카오 알림톡 (부분 완료)
```
테스트 일시: 2025-11-04 17:00-17:30
테스터: Claude + User
결과: [x] 부분 성공 (변수 없는 템플릿 완료, 변수 포함 템플릿 보류)
비고:
- ✅ 템플릿 조회 기능 정상 작동
- ✅ TEST_INSPECT_001 템플릿 발송 성공 (실제 수신 확인)
- ⏸️ TEST_VAR_002 (변수 포함) API 성공하나 메시지 미수신 (템플릿 승인 대기로 추정)
- ✅ inspection_status 필드 완전 제거 (5개 파일)
- 📝 알림톡 변수 치환은 MTS API가 서버에서 처리 (클라이언트 치환 불필요)
- 📝 변수 포함 템플릿은 승인 완료 후 재테스트 필요
```

### Phase 4: 카카오 친구톡 (초기화)
```
테스트 일시:
테스터:
결과: [ ] 성공 [ ] 실패
비고:
```

### Phase 5: 네이버 톡톡 (초기화)
```
테스트 일시:
테스터:
결과: [ ] 성공 [ ] 실패
비고:
```

### Phase 6: 카카오 브랜드 메시지 (초기화)
```
테스트 일시:
테스터:
결과: [ ] 성공 [ ] 실패
비고:
```

---

## 참고 문서

- [MTS_API_전환_통합_가이드.md](./MTS_API_전환_통합_가이드.md)
- [MTS_API_사용_현황_템플릿.txt](./MTS_API_사용_현황_템플릿.txt)
- [MTS_API_코드_위치_안내.txt](./MTS_API_코드_위치_안내.txt)

---

## 📝 문서 이력

### v2.0 (2025-11-04)
- ✅ **전체 체크리스트 초기화**: 모든 Phase 테스트 항목 초기화
- ✅ **코드베이스 실사 반영**: mtsApi.ts 1850줄, 19개 함수 확인
- ✅ **API 엔드포인트 정리**: 12개 메시지 관련 API 확인
- ✅ **테스트 결과 섹션 초기화**: 모든 Phase 재테스트 준비
- ✅ **구현 완료 기능 명시**: Phase별 실제 구현 상태 반영
- ✅ **문서 3종 동시 업데이트**: 사용현황, 코드베이스분석, 테스트가이드

### v1.7 (2025-11-03)
- 알림톡 테스트 완료 (API 성공, 실제 수신 미확인)
- 친구톡 텍스트형 테스트 완료 (API 성공, 실제 수신 미확인)
- 브랜드 메시지 UI 재설계 완료 (템플릿 선택 방식)

### v1.0 (2025-10-29)
- 초기 테스트 가이드 작성
- SMS/LMS/MMS 테스트 완료

---

**문서 버전**: v2.4
**작성일**: 2025-10-29
**최종 업데이트**: 2025-11-04 17:30
**다음 업데이트 예정**: Phase 3 변수 치환 재테스트 후 (템플릿 승인 확인 필요)

### v2.4 (2025-11-04)
- 🔄 **Phase 3 부분 완료**: 카카오 알림톡 테스트
  - ✅ 템플릿 조회 기능 정상 작동
  - ✅ 변수 없는 템플릿 발송 성공 (TEST_INSPECT_001)
  - ⏸️ 변수 포함 템플릿 테스트 보류 (TEST_VAR_002 승인 대기)
- ✅ **inspection_status 필드 제거**: 5개 파일 수정 완료
  - DB 스키마와 코드 불일치 해결
  - 템플릿 관리 로직 단순화
- 📝 **알림톡 변수 치환 명확화**: MTS API가 서버에서 처리
  - 클라이언트는 `#{변수명}` 형태로 그대로 전송
  - 클라이언트에서 미리 치환하면 3016 에러 발생

### v2.2 (2025-01-04)
- ✅ **SMS/LMS API 엔드포인트 분리**: ER15 에러 해결
  - SMS (90바이트 이하) → `/sndng/sms/sendMessage`
  - LMS/MMS (90바이트 초과 또는 이미지) → `/sndng/mms/sendMessage`
- ✅ **크레딧 환불 로직 구현**: refundBalance() 함수 추가
  - Phase 2 전송 결과 API 연동 준비 완료
  - 실패 시 자동 환불을 위한 인프라 구축
- ✅ **에러 코드 로깅 개선**: message_logs.metadata에 error_code 필드 추가
  - 3016, ER15, ER17 등 MTS API 에러 코드 추적 가능
- ✅ **변수 치환 테스트 통합**: 각 Phase 시나리오에 변수 치환 항목 추가
  - 별도 섹션 분리 대신 실제 발송 시나리오에 통합
- ✅ **알림톡 템플릿 매칭 경고 추가**: 3016 에러 방지 가이드라인
- 📝 **Phase 1.5 신규 추가**: 환불 로직 테스트 시나리오

### v2.1 (2025-01-04)
- ✅ **변수 형식 통일 작업 완료**: 모든 메시지 타입에서 `#{변수명}` 형식 사용
- ✅ **UI 컴포넌트 업데이트**: SMS, 친구톡, 알림톡, 브랜드 메시지 탭 개선
- ✅ **유틸리티 함수 개선**: messageVariables.ts에 countVariables(), extractVariables() 추가
- ✅ **데이터베이스 마이그레이션**: sms_message_templates 테이블 변환 완료
- ✅ **변수 시스템 구분**: 일반 메시지 `#{변수명}`, 예약 시스템 `{{변수명}}` 확인
- 📝 **테스트 항목 추가**: 변수 치환 기능 테스트 필요 (각 Phase에 통합 완료)

---

## 📊 Phase 1-2 상세 테스트 결과 (2025-11-04)

### 테스트 일시
2025-11-04 16:30 - 16:50

### 테스터
Claude + User

### 전체 결과
✅ **전체 성공** - SMS/LMS/MMS 모든 메시지 타입 발송 및 수신 확인 완료

---

### 시나리오 1.1: SMS 발송 + 변수 치환 ✅

**입력:**
- 메시지: "안녕하세요 #{이름}님"
- 변수: { "이름": "홍길동" }

**처리:**
- 변수 치환: #{이름} → "홍길동"
- 최종 메시지: "안녕하세요 홍길동님"
- 메시지 크기: 25바이트

**결과:**
- API 엔드포인트: `/sndng/sms/sendMessage` ✅ (SMS 전용)
- MTS 응답: `{ code: "0000" }` (성공)
- Request에 subject 없음 확인 ✅
- 잔액 차감: 25원 ✅
- DB 저장: `message_type='SMS'`, `credit_used=25` ✅
- **실제 수신: ✅ 확인 완료**

**Console.log:**
```
[MTS SMS/LMS/MMS API 호출 시작]
시간: 2025-11-04T16:35:12.456Z
메시지 타입: SMS
메시지 크기: 25 바이트
API URL: https://api.mtsco.co.kr/sndng/sms/sendMessage
```

---

### 시나리오 1.2: LMS 발송 + 변수 치환 (3개 변수) ✅

**입력:**
- 메시지: "안녕하세요 #{이름}님, 오늘은 #{오늘날짜}입니다. 회사명: #{회사명} 입니다."
- 변수:
  - #{이름} → "홍길동"
  - #{오늘날짜} → "2025-01-04"
  - #{회사명} → "테스트컴퍼니"

**처리:**
- 변수 치환 완료
- 최종 메시지: "안녕하세요 홍길동님, 오늘은 2025-01-04입니다. 회사명: 테스트컴퍼니 입니다."
- 메시지 크기: 204바이트 (90바이트 초과 → LMS)

**결과:**
- API 엔드포인트: `/sndng/mms/sendMessage` ✅ (LMS는 MMS API 사용)
- MTS 응답: `{ code: "0000" }` (성공)
- Request에 `subject: "LMS"` 포함 확인 ✅
- 잔액 차감: 50원 ✅
- DB 저장: `message_type='LMS'`, `credit_used=50` ✅
- **실제 수신: ✅ 확인 완료**

**Console.log:**
```
[MTS SMS/LMS/MMS API 호출 시작]
시간: 2025-11-04T16:40:23.789Z
메시지 타입: LMS
메시지 크기: 204 바이트
API URL: https://api.mtsco.co.kr/sndng/mms/sendMessage
요청 데이터에 subject: "LMS" 포함
```

---

### 시나리오 1.3: MMS 발송 + 이미지 업로드 ✅

**입력:**
- 이미지: test-image.jpg (667.4KB)
- 메시지: "이미지가 포함된 MMS입니다"

**이미지 처리:**
- 원본 크기: 667.4KB
- 이미지 크기 제한: 300KB → 5MB로 완화 ✅ (코드 수정 완료)
- 백엔드 자동 최적화:
  - 포맷: PNG → JPEG
  - 크기: 640×480px
  - 용량: 245KB
- 이미지 업로드 API: 성공 ✅
- 이미지 URL: `/2025/11/04/20251104074745123.jpg`

**결과:**
- 메시지 크기: 46바이트
- API 엔드포인트: `/sndng/mms/sendMessage` ✅
- attachment 객체: `{ image: [{ img_url: "/2025/11/04/..." }] }` ✅
- MTS 응답: `{ code: "0000" }` (성공)
- 잔액 차감: 100원 ✅
- DB 저장: `message_type='MMS'`, `credit_used=100` ✅
- **실제 수신: ✅ 확인 완료 (이미지 정상 수신)**

**Console.log:**
```
[MTS 이미지 업로드 시작]
시간: 2025-11-04T16:47:45.123Z
파일명: test-image.jpg
원본크기: 667.4KB
최적화 후: 245KB (640x480px, JPEG)
이미지 URL: /2025/11/04/20251104074745123.jpg
이미지 업로드 성공 ✅

[MTS MMS API 호출 시작]
메시지 타입: MMS
이미지 포함: Yes
API URL: https://api.mtsco.co.kr/sndng/mms/sendMessage
```

---

### 코드 수정 내역

**파일:** [src/components/messages/SmsMessageContent.tsx](src/components/messages/SmsMessageContent.tsx)

**변경 사항:**
1. **Line 80-86**: 이미지 크기 제한 완화
   - 변경 전: `300KB (300 * 1024)`
   - 변경 후: `5MB (5 * 1024 * 1024)`
   
2. **Line 322**: UI 텍스트 업데이트
   - 변경 전: "최대 300KB, 3개까지"
   - 변경 후: "최대 5MB, 3개까지 (자동 최적화)"
   
3. **Line 400**: 가이드 텍스트 업데이트
   - 변경 전: "각 파일당 최대 300KB"
   - 변경 후: "각 파일당 최대 5MB (자동 최적화: 640×480px, 300KB 이하)"

**이유:**
- Frontend 제한이 너무 엄격했음 (300KB)
- Backend는 자동으로 최적화하므로 5MB까지 허용해도 문제없음
- 사용자 경험 개선: 큰 이미지도 업로드 가능, 자동 최적화됨

---

### 발생한 이슈 및 해결

**이슈 1: 변수 #{상품명} 없음**
- **문제**: 사용자가 LMS 테스트에서 `#{상품명}` 변수를 사용하려 했으나 기본 변수 목록에 없음
- **해결**: 기본 변수 (`#{이름}`, `#{오늘날짜}`, `#{회사명}`)로 대체
- **결과**: 정상 작동 ✅

**이슈 2: 이미지 크기 제한 (300KB)**
- **문제**: 667.4KB 이미지 업로드 시 "이미지 크기는 300KB 이하여야 합니다" 오류
- **원인**: Frontend 검증 로직에서 300KB 제한
- **해결**: 
  - Frontend 제한을 5MB로 완화
  - Backend는 이미 자동 최적화 (640×480px, JPEG, 300KB 이하)를 수행 중
- **파일**: `src/components/messages/SmsMessageContent.tsx`
- **결과**: 정상 업로드 및 발송 ✅

**이슈 3: 파일 수정 중 Hot-Reload**
- **문제**: Next.js dev server의 hot-reload로 인해 파일 수정 실패
- **해결**: dev server 중지 후 파일 수정
- **결과**: 정상 수정 완료 ✅

---

### 검증된 기능

✅ **API 엔드포인트 자동 분리**
- SMS (≤90바이트) → `/sndng/sms/sendMessage`
- LMS/MMS (>90바이트 or 이미지) → `/sndng/mms/sendMessage`

✅ **변수 치환 시스템**
- 형식: `#{변수명}`
- 지원 변수: `#{이름}`, `#{전화번호}`, `#{그룹명}`, `#{오늘날짜}`, `#{현재시간}`, `#{요일}`, `#{발신번호}`, `#{회사명}`, `#{담당자명}`
- 치환 로직: 정상 작동 확인

✅ **이미지 자동 최적화**
- Sharp 라이브러리 사용
- PNG → JPEG 변환
- 640×480px 리사이즈
- 300KB 이하로 압축

✅ **잔액 차감 로직**
- SMS: 25원
- LMS: 50원
- MMS: 100원
- transactions 테이블에 정상 기록

✅ **DB 저장**
- message_logs 테이블: `message_type`, `credit_used`, `status='sent'`
- transactions 테이블: `type='usage'`, `amount`, `metadata`

✅ **실제 메시지 수신**
- SMS: 수신 확인 ✅
- LMS: 수신 확인 ✅
- MMS: 이미지 포함하여 수신 확인 ✅

---

### 다음 단계

**Phase 3: 카카오 알림톡 테스트 준비**
- [ ] 카카오 발신프로필 확인
- [ ] 알림톡 템플릿 등록 및 승인 확인
- [ ] 템플릿 조회 기능 테스트
- [ ] 변수 포함 템플릿 발송 테스트

**참고:**
- Phase 1-2 완료로 기본 메시지 발송 기능 검증 완료
- 다음 Phase들은 카카오/네이버 플랫폼 연동 테스트
