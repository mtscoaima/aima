# MTS API 전환 통합 가이드

> **프로젝트**: MTS Message Portal
> **작성일**: 2025-10-28
> **최종 수정**: 2025-11-03 (v3.0 - 요금 업데이트 및 문서 정리)
> **목적**: Naver SENS API → MTS API 전환 작업 가이드
> **상태**: ✅ **프로젝트 완료 (100%)**

---

## 📋 목차

1. [작업 개요](#작업-개요)
2. [메시지 요금표](#메시지-요금표)
3. [Phase별 구현 내용](#phase별-구현-내용)
4. [구현 주의사항](#구현-주의사항)
5. [테스트 체크리스트](#테스트-체크리스트)

---

## 작업 개요

### 전환 범위

**제거 대상**
- ❌ Naver SENS API 연동 코드 전체
- ❌ RCS 관련 UI 및 로직 전체
- ❌ Dead Code: `/api/auth/send-verification`

**전환 완료**
- ✅ SMS/LMS/MMS 발송 (Phase 0-5)
- ✅ 카카오 알림톡 (Phase 6)
- ✅ 카카오 친구톡 V2 (Phase 7)
- ✅ 네이버 톡톡 (Phase 8)
- ✅ 카카오 브랜드 메시지 (Phase 9)
- ✅ 예약 발송 (Phase 10)

### 파일 작업 요약

| Phase | 수정 | 삭제 | 신규 | 합계 | 설명 |
|-------|-----|-----|-----|-----|------|
| 0-5 | 16 | 8 | 1 | 25 | SMS/LMS/MMS 전환 |
| 6 | 3 | 0 | 5 | 8 | 카카오 알림톡 |
| 7 | 2 | 0 | 2 | 4 | 카카오 친구톡 V2 |
| 8 | 3 | 0 | 2 | 5 | 네이버 톡톡 |
| 9 | 3 | 0 | 2 | 5 | 카카오 브랜드 |
| 10 | 1 | 0 | 0 | 1 | 예약 발송 |
| **합계** | **28** | **8** | **12** | **48** | |

---

## 메시지 요금표

**최종 업데이트**: 2025-11-03

| 구분 | 메시지 타입 | 단가 (크레딧) | 코드 상수 |
|------|------------|--------------|----------|
| 문자메시지 | SMS | 25원 | - |
| 문자메시지 | LMS | 50원 | - |
| 문자메시지 | MMS | 100원 | - |
| 카카오 | 알림톡 | 13원 | KAKAO_ALIMTALK |
| 카카오 | 친구톡 | 20원 | KAKAO_FRIENDTALK |
| 카카오 | 브랜드톡 | 20원 | KAKAO_BRAND |
| 네이버 | 스마트알림 | 13원 | NAVER_TALK |
| 네이버 | 톡톡광고 | 20원 | NAVER_TALK (BENEFIT) |

**MESSAGE_COSTS 객체 정의** (`scheduled-send-check/route.ts`):
```typescript
const MESSAGE_COSTS: Record<string, number> = {
  SMS: 25,
  LMS: 50,
  MMS: 100,
  KAKAO_ALIMTALK: 13,
  KAKAO_FRIENDTALK: 20,
  NAVER_TALK: 13, // 스마트알림 기본, 광고는 20원
  KAKAO_BRAND: 20,
};
```

---

## Phase별 구현 내용

### Phase 0-5: SMS/LMS/MMS 전환 (완료)

#### 핵심 변경사항

**1. MTS API 라이브러리 구현** (`src/lib/mtsApi.ts`)
- `sendMtsSms()` - SMS 발송 (25원/건)
- `sendMtsLms()` - LMS 발송 (50원/건)
- `sendMtsMms()` - MMS 발송 (100원/건)
- MTS API 인증: `authCode` 헤더 방식
- 날짜 포맷 변환: `convertToMtsDateFormat()`

**2. API 엔드포인트 교체**
- `/api/messages/sms/send` - SMS 발송
- `/api/messages/lms/send` - LMS 발송
- `/api/messages/mms/send` - MMS 발송
- `/api/messages/scheduled` - 예약 발송 등록
- `/api/messages/scheduled-send-check` - 예약 발송 크론잡

**3. Naver SENS 제거**
- 삭제: `src/lib/naverApi.ts`
- 삭제: `src/lib/naverAuth.ts`
- 삭제: RCS 관련 UI 컴포넌트 4개
- 삭제: Dead code `/api/auth/send-verification`

**4. 환경 변수**
```env
MTS_AUTH_CODE=xxx
MTS_API_URL=https://api.mtsco.co.kr
```

---

### Phase 6: 카카오 알림톡 (완료)

#### 구현 내용

**1. MTS API 함수** (`src/lib/mtsApi.ts`)
```typescript
sendMtsAlimtalk(
  senderKey: string,
  templateCode: string,
  phoneNumber: string,
  message: string,
  callbackNumber: string,
  buttons?: any[],
  tranType?: 'SMS'|'LMS'|'MMS',
  tranMessage?: string,
  sendDate?: string
): Promise<MtsSendResult>
```

**2. API 엔드포인트**
- `/api/kakao/templates` - 알림톡 템플릿 조회
- `/api/kakao/sender-keys` - 발신프로필 조회
- `/api/messages/kakao/alimtalk/send` - 알림톡 발송 (13원/건)

**3. UI 컴포넌트**
- `AlimtalkContent.tsx` - 알림톡 발송 UI
  - 발신프로필 선택
  - 템플릿 선택 (자동 로딩)
  - 템플릿 내용 미리보기
  - 대체 발송 설정 (SMS/LMS/MMS)
  - 수신자 목록 입력
  - 발송 및 결과 처리

**4. 가격 로직**
```typescript
// message_logs
credit_used: result.success ? 13 : 0

// transactions
const unitPrice = pricingData?.alimtalk_price || 13;
const totalCost = successCount * unitPrice;
```

---

### Phase 7: 카카오 친구톡 V2 (완료)

#### 구현 내용

**1. MTS API 함수** (`src/lib/mtsApi.ts`)
```typescript
sendMtsFriendtalk(
  senderKey: string,
  phoneNumber: string,
  message: string,
  callbackNumber: string,
  messageType: 'FT'|'FI'|'FW'|'FL'|'FC',
  adFlag: 'Y'|'N',
  imageUrls?: string[],
  imageLink?: string,
  buttons?: any[],
  tranType?: 'SMS'|'LMS'|'MMS',
  tranMessage?: string,
  sendDate?: string
): Promise<MtsSendResult>
```

**2. API 엔드포인트**
- `/api/messages/kakao/friendtalk/send` - 친구톡 발송 (20원/건)

**3. UI 컴포넌트**
- `FriendtalkContent.tsx` - 친구톡 발송 UI
  - 발신프로필 선택
  - 메시지 타입 선택 (FT/FI/FW/FL/FC)
  - 광고 여부 선택 (Y/N)
  - 이미지 URL 입력
  - 버튼 설정
  - 대체 발송 설정

**4. 가격 로직**
```typescript
// message_logs
credit_used: result.success ? 20 : 0

// transactions
const unitPrice = 20;
const totalCost = successCount * unitPrice;
```

**중요**: 기존 친구톡 API(`/sndng/ftk/sendMessage`)는 지원 종료 예정. V2 필수 사용.

---

### Phase 8: 네이버 톡톡 (완료)

#### 구현 내용

**1. MTS API 함수** (`src/lib/mtsApi.ts`)
```typescript
sendMtsNaverTalk(
  navertalkId: string,
  templateCode: string,
  phoneNumber: string,
  productCode: 'INFORMATION'|'BENEFIT'|'CARDINFO',
  message: string,
  sendDate?: string
): Promise<MtsSendResult>
```

**2. API 엔드포인트**
- `/api/naver/templates` - 네이버톡 템플릿 조회
- `/api/messages/naver/talk/send` - 네이버톡 발송 (조건부 가격)

**3. 가격 로직**
```typescript
// productCode에 따른 조건부 가격
const NAVER_TALK_COST = productCode === 'BENEFIT' ? 20 : 13;

// message_logs
credit_used: NAVER_TALK_COST

// transactions
description: productCode === 'BENEFIT'
  ? '네이버 톡톡광고 발송'
  : '네이버 스마트알림 발송'
```

**4. UI 컴포넌트**
- `NaverTalkContent.tsx` - 네이버톡 발송 UI
  - 네이버톡 ID 입력
  - 템플릿 자동 로딩
  - 상품 코드 선택 (INFORMATION/BENEFIT/CARDINFO)
  - 템플릿 내용 미리보기

---

### Phase 9: 카카오 브랜드 메시지 (완료)

#### 구현 내용

**1. MTS API 함수** (`src/lib/mtsApi.ts`)
```typescript
sendMtsBrandMessage(
  senderKey: string,
  templateCode: string,
  phoneNumber: string,
  message: string,
  callbackNumber: string,
  messageType?: string,
  tranType?: 'N'|'S'|'L'|'M',
  tranMessage?: string,
  attachment?: any,
  sendDate?: string
): Promise<MtsSendResult>
```

**2. API 엔드포인트**
- `/api/messages/kakao/brand/send` - 브랜드 메시지 발송 (20원/건)

**3. 가격 로직**
```typescript
// 고정 단가
const costPerMessage = 20;

// message_logs
credit_used: costPerMessage

// transactions
const totalCost = successCount * costPerMessage;
```

**4. UI 컴포넌트** (2025-11-02 재설계)
- `BrandTab.tsx` - 템플릿 선택 기반 UI
  - 발신프로필 선택 → 템플릿 자동 로딩
  - 템플릿 선택 드롭다운
  - 템플릿 내용 자동 로딩 및 미리보기
  - 대체 발송 설정 (N/S/L/M)
  - Rich UI 구조 (8 sections)

**Rich UI 구조**:
1. 발신프로필 선택
2. 템플릿 조회 및 선택
3. 템플릿 정보 표시
4. 템플릿 내용 미리보기
5. 대체 발송 설정
6. 수신자 목록
7. 발송 버튼
8. 에러/성공 메시지

---

### Phase 10: 카카오/네이버 예약 발송 (완료)

#### 구현 내용

**1. Cron Job 수정** (`/api/messages/scheduled-send-check/route.ts`)

**MESSAGE_COSTS 정의**:
```typescript
const MESSAGE_COSTS: Record<string, number> = {
  SMS: 25,
  LMS: 50,
  MMS: 100,
  KAKAO_ALIMTALK: 13,
  KAKAO_FRIENDTALK: 20,
  NAVER_TALK: 13, // 스마트알림 기본, 광고는 20원
  KAKAO_BRAND: 20,
};
```

**타입별 발송 로직**:
```typescript
switch (messageType) {
  case 'KAKAO_ALIMTALK':
    result = await sendMtsAlimtalk(...);
    break;
  case 'KAKAO_FRIENDTALK':
    result = await sendMtsFriendtalk(...);
    break;
  case 'NAVER_TALK':
    result = await sendMtsNaverTalk(...);
    break;
  case 'KAKAO_BRAND':
    result = await sendMtsBrandMessage(...);
    break;
}
```

**2. 레거시 호환성**
- `message_type`이 없으면 자동 판단
- metadata 필드명 다중 지원 (snake_case/camelCase)

**3. 에러 처리**
- 발송 실패 시 `scheduled_messages` 상태 업데이트
- `message_logs` 및 `transactions` 테이블 자동 저장

---

## 구현 주의사항

### 1. 인증 방식

**MTS API 인증**:
```typescript
headers: {
  'Content-Type': 'application/json',
  'authCode': process.env.MTS_AUTH_CODE!
}
```

**JWT 인증** (모든 API 엔드포인트):
```typescript
const authResult = validateAuthWithSuccess(request);
if (!authResult.isValid || !authResult.userInfo) {
  return authResult.errorResponse;
}
```

### 2. 날짜 포맷 변환

**입력**: `yyyy-MM-dd HH:mm` (사용자 입력)
**출력**: `yyyyMMddHHmmss` (MTS API 형식)

```typescript
// 예: "2025-11-03 14:30" → "20251103143000"
const sendDate = scheduledAt ? convertToMtsDateFormat(scheduledAt) : undefined;
```

### 3. 에러 처리

**공통 패턴**:
```typescript
try {
  const result = await sendMts...();

  if (result.success) {
    // message_logs 저장 (status: 'sent')
    // transactions 생성 (type: 'usage')
  } else {
    // message_logs 저장 (status: 'failed', error_message)
    // 잔액 차감 안 함
  }
} catch (error) {
  // 예외 처리 및 로깅
}
```

### 4. 잔액 차감 로직

**트랜잭션 생성** (성공 건수만):
```typescript
if (successCount > 0) {
  const totalCost = successCount * unitPrice;

  await supabase.from('transactions').insert({
    user_id: userId,
    type: 'usage',
    amount: totalCost, // 양수로 저장 (UI에서 type='usage'일 때 - 표시)
    description: `${메시지타입} 발송 (${successCount}건)`,
    reference_id: msgIds.join(','),
    metadata: {...},
    status: 'completed',
  });
}
```

### 5. 다중 수신자 처리

**루프 내부에서 개별 발송**:
```typescript
for (const recipient of recipients) {
  try {
    const result = await sendMts...(recipient.phone_number, ...);

    // 개별 결과 저장
    results.push({
      recipient: phoneNumber,
      success: result.success,
      msgId: result.msgId,
      error: result.error,
    });

    // 개별 message_logs 저장
  } catch (error) {
    // 개별 에러 처리
  }
}

// 루프 종료 후 transactions 한 번만 생성
```

### 6. 템플릿 기반 메시지

**알림톡/브랜드 메시지**:
- 발신프로필 키 필수 (`senderKey`)
- 템플릿 코드 필수 (`templateCode`)
- 템플릿 내용은 MTS에서 검증
- 변수 치환은 클라이언트에서 수동 입력

**네이버톡**:
- 네이버톡 ID 필수 (`navertalkId`)
- 템플릿 코드 필수 (`templateCode`)
- 상품 코드에 따라 가격 차등 (BENEFIT=20원, others=13원)

---

## 테스트 체크리스트

### Phase 0-5: SMS/LMS/MMS (✅ 완료)

**기본 발송 테스트**
- [x] SMS 발송 (25원 차감 확인)
- [x] LMS 발송 (50원 차감 확인)
- [x] MMS 발송 (100원 차감 확인)
- [x] 다중 수신자 발송
- [x] 예약 발송 (즉시/예약)

**데이터 검증**
- [x] `message_logs` 테이블 저장 확인
- [x] `transactions` 테이블 저장 확인 (type='usage', amount 양수)
- [x] 사용자 잔액 차감 확인
- [x] 발송 실패 시 잔액 차감 안 됨 확인

### Phase 6: 카카오 알림톡 (✅ 완료)

**템플릿 조회**
- [x] 발신프로필 목록 조회
- [x] 템플릿 목록 조회 (senderKey 기반)
- [x] 템플릿 내용 로딩 및 표시

**발송 테스트**
- [x] 알림톡 발송 (13원 차감 확인)
- [x] 버튼 포함 발송
- [x] 대체 발송 설정 (SMS/LMS/MMS)
- [x] 다중 수신자 발송

### Phase 7: 카카오 친구톡 V2 (✅ 완료)

**발송 테스트**
- [x] 친구톡 텍스트 발송 (FT) (20원 차감 확인)
- [x] 이미지 포함 발송 (FI)
- [x] 와이드 이미지 발송 (FW)
- [x] 광고성 메시지 (adFlag='Y')
- [x] 버튼 포함 발송

### Phase 8: 네이버 톡톡 (✅ 완료)

**템플릿 조회**
- [x] 네이버톡 템플릿 목록 조회
- [x] 템플릿 내용 로딩

**발송 테스트**
- [x] 스마트알림 발송 (INFORMATION) (13원 차감 확인)
- [x] 톡톡광고 발송 (BENEFIT) (20원 차감 확인)
- [x] 카드형 발송 (CARDINFO) (13원 차감 확인)

### Phase 9: 카카오 브랜드 메시지 (✅ 완료)

**템플릿 조회** (2025-11-02 재설계)
- [x] 발신프로필 선택 시 템플릿 자동 로딩
- [x] 템플릿 선택 시 내용 자동 표시
- [x] 템플릿 정보 표시 (코드, 이름, 타입)

**발송 테스트**
- [x] 텍스트 발송 (20원 차감 확인)
- [x] 이미지 발송
- [x] 대체 발송 설정 (N/S/L/M)
- [x] Rich UI 8 sections 동작 확인

### Phase 10: 예약 발송 (✅ 완료)

**Cron Job 테스트**
- [x] SMS/LMS/MMS 예약 발송
- [x] 카카오 알림톡 예약 발송
- [x] 카카오 친구톡 예약 발송
- [x] 네이버 톡톡 예약 발송
- [x] 카카오 브랜드 예약 발송
- [x] MESSAGE_COSTS 단가 적용 확인

**에러 처리**
- [x] 발송 실패 시 `scheduled_messages` 상태 업데이트
- [x] 레거시 데이터 호환성 (message_type 자동 판단)

---

## 마무리

### 완료된 작업

1. ✅ **Naver SENS → MTS API 전환 완료** (Phase 0-5)
2. ✅ **카카오 알림톡 구현** (Phase 6)
3. ✅ **카카오 친구톡 V2 구현** (Phase 7)
4. ✅ **네이버 톡톡 구현** (Phase 8)
5. ✅ **카카오 브랜드 메시지 구현** (Phase 9, UI 재설계 완료)
6. ✅ **예약 발송 통합** (Phase 10)
7. ✅ **요금 업데이트** (2025-11-03)

### 최종 상태

- **총 53개 파일 작업** (수정 29, 삭제 8, 신규 16)
- **모든 Phase 완료** (Phase 0-10)
- **모든 테스트 통과**
- **프로덕션 배포 완료**

### 관련 문서

- [MTS API 통합 테스트 가이드](./MTS_API_통합_테스트_가이드.md)
- [MTS API 코드 위치 안내](./MTS_API_코드_위치_안내.txt)
- [코드베이스 분석 v4.1](./MTS_MESSAGE_코드베이스_분석_v4.1.md)

---

**문서 끝**
