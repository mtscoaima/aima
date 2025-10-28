# MTS API 전환 통합 가이드

> **프로젝트**: MTS Message Portal
> **작성일**: 2025-10-28
> **최종 수정**: 2025-10-28 (v1.2 - 시스템 알림 SMS 발신번호 추가)
> **목적**: Naver SENS API → MTS API 전환 작업 가이드

---

## 📋 목차

1. [작업 개요](#작업-개요)
2. [수정 대상 파일 목록](#수정-대상-파일-목록)
3. [MTS API 주요 스펙](#mts-api-주요-스펙)
4. [작업 순서](#작업-순서)
5. [구현 주의사항](#구현-주의사항)
6. [테스트 체크리스트](#테스트-체크리스트)

---

## 작업 개요

### 제거 대상
- ❌ Naver SENS API 연동 코드 전체
- ❌ RCS 관련 UI 및 로직 전체
- ❌ Dead Code: `/api/auth/send-verification` (실제 미사용)

### 전환 대상 (MTS API로 교체)
- ✅ SMS/LMS/MMS 발송 기능
- ✅ 카카오톡 (알림톡, 친구톡 V2, 브랜드 메시지)
- ✅ 네이버 톡톡

### 파일 작업 요약

| 구분 | 수정 | 삭제 | 신규 | 합계 |
|-----|-----|-----|-----|-----|
| 핵심 라이브러리 | 2 | 1 | 1 | 4 |
| API 엔드포인트 | 10 | 1 | 0 | 11 |
| UI 컴포넌트 | 2 | 4 | 0 | 6 |
| **합계** | **14** | **6** | **1** | **21** |

---

## 수정 대상 파일 목록

### 1️⃣ 핵심 라이브러리 (4개)

#### ❌ 삭제
```
src/lib/naverSensApi.ts
```

#### ✅ 신규 작성
```
src/lib/mtsApi.ts
```
- MTS API 클라이언트 라이브러리
- SMS/LMS/MMS 발송 함수
- 카카오/네이버 발송 함수
- 에러 처리 및 응답 매핑

#### ⚠️ 수정
```
src/lib/messageSender.ts
src/utils/smsNotification.ts
```

---

### 2️⃣ API 엔드포인트 (11개)

#### 📂 메시지 발송 (2개)
```
src/app/api/messages/send/route.ts
src/app/api/message/send/route.ts
```

#### 📂 예약 메시지 Cron (3개)
```
src/app/api/messages/scheduled-send-check/route.ts
src/app/api/cron/send-scheduled-messages/route.ts
src/app/api/reservations/auto-send-check/route.ts
```

#### 📂 시스템 알림 (3개)
```
src/app/api/business-verification/submit/route.ts (간접)
src/app/api/inquiries/[id]/reply/route.ts (간접)
src/app/api/admin/send-approval-notification/route.ts
```

#### ❌ 삭제 (Dead Code)
```
src/app/api/auth/send-verification/route.ts
```

---

### 3️⃣ UI 컴포넌트 (6개)

#### ❌ 삭제
```
src/components/messages/RcsMessageContent.tsx
src/components/messages/rcs/ (폴더 전체)
```

#### ⚠️ 수정
```
src/components/messages/MessageSendTab.tsx (RCS import 제거)
src/app/messages/send/page.tsx (탭 명칭 변경)
```

---

## MTS API 주요 스펙

### 🔐 인증 방식

**Naver SENS** (기존):
```typescript
// HMAC SHA256 서명 생성 필요
const signature = crypto.createHmac('sha256', SECRET_KEY)
  .update(method + " " + url + "\n" + timestamp + "\n" + accessKey)
  .digest('base64');
```

**MTS API** (신규):
```json
{
  "auth_code": "MTS에서_발급한_인증코드"
}
```

### 📡 API 엔드포인트

| 용도 | URL |
|-----|-----|
| 발송 API | `https://api.mtsco.co.kr/` |
| 템플릿/프로필 관리 | `https://talks.mtsco.co.kr` |

### 📱 SMS/LMS/MMS 발송

#### SMS 발송 (단건)
**엔드포인트**: `POST /sndng/sms/sendMessage`

```json
{
  "auth_code": "인증코드",
  "callback_number": "발신번호",
  "phone_number": "수신번호",
  "message": "메시지 내용",
  "send_date": "20250128150000" // 예약시만
}
```

**응답**:
```json
{
  "code": "0000",
  "message": "정상 처리되었습니다",
  "msg_id": "202501281500001234"
}
```

#### MMS 발송 (단건)
**엔드포인트**: `POST /sndng/mms/sendMessage`

```json
{
  "auth_code": "인증코드",
  "callback_number": "발신번호",
  "phone_number": "수신번호",
  "subject": "제목",
  "message": "메시지 내용",
  "attachment": {
    "image": [
      { "img_url": "/2025/01/28/image.jpg" }
    ]
  }
}
```

### 💬 카카오 알림톡 발송

**엔드포인트**: `POST /sndng/atk/sendMessage`

```json
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "template_code": "템플릿코드",
  "phone_number": "수신번호",
  "message": "템플릿 내용",
  "callback_number": "발신번호",
  "attachment": {
    "button": [
      {
        "name": "버튼명",
        "type": "WL",
        "url_mobile": "http://example.com"
      }
    ]
  }
}
```

### 💬 카카오 친구톡 V2 발송 (신규)

**엔드포인트**: `POST /v2/sndng/ftk/sendMessage`

**중요**: 기존 친구톡 API(`/sndng/ftk/sendMessage`)는 지원 종료 예정. 반드시 V2 사용.

```json
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "phone_number": "수신번호",
  "message": "친구톡 메시지 내용",
  "messageType": "FI",
  "ad_flag": "N",
  "callback_number": "발신번호",
  "attachment": {
    "image": [
      { "img_url": "/2025/01/28/image.jpg" }
    ],
    "button": [
      {
        "name": "버튼명",
        "type": "WL",
        "url_mobile": "http://example.com"
      }
    ]
  }
}
```

**messageType 종류**:
- `FT`: 텍스트형 (기본)
- `FI`: 이미지형
- `FW`: 와이드 이미지형
- `FL`: 와이드 리스트형
- `FC`: 캐러셀형

**ad_flag 설정**:
- `Y`: 광고성 메시지 (08시~20시만 발송 가능)
- `N`: 일반 메시지

### 🔄 전환 전송 (Fallback)

알림톡/친구톡 실패 시 SMS/LMS/MMS로 자동 전환 발송

```json
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "template_code": "템플릿코드",
  "phone_number": "수신번호",
  "message": "알림톡 메시지",
  "callback_number": "발신번호",
  "tran_type": "SMS",
  "tran_callback": "01012345678",
  "tran_message": "전환 발송 시 보낼 문자 메시지"
}
```

**tran_type 종류**:
- `SMS`: 단문 문자로 전환
- `LMS`: 장문 문자로 전환
- `MMS`: 이미지 문자로 전환

### 📸 이미지 업로드

**엔드포인트**: `POST /img/upload_image`
**Content-Type**: `multipart/form-data`

```typescript
const formData = new FormData();
formData.append('auth_code', MTS_AUTH_CODE);
formData.append('image', imageFile);

// Response: { "code": "0000", "images": "/2025/01/28/image.jpg" }
```

**주의**: 응답 필드명은 `images`입니다 (단수 아님).

### 📋 카카오 알림톡 템플릿 관리 API

#### 템플릿 목록 조회
**엔드포인트**: `POST https://talks.mtsco.co.kr/kakaoTalk/atk/getTemplateList`

```json
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "page": 1,
  "count": 100
}
```

#### 템플릿 상세 조회
**엔드포인트**: `POST https://talks.mtsco.co.kr/kakaoTalk/atk/getTemplate`

```json
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "template_code": "템플릿코드"
}
```

#### 템플릿 등록
**엔드포인트**: `POST https://talks.mtsco.co.kr/kakaoTalk/atk/postTemplate`

```json
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "template_code": "custom_template_001",
  "template_name": "템플릿명",
  "template_content": "템플릿 내용 #{변수명}",
  "template_message_type": "BA",
  "template_emphasize_type": "TEXT",
  "category_code": "999999"
}
```

### ⚠️ 에러 코드 (주요 코드만 발췌)

#### 📌 성공 및 일반 오류

| 코드 | 설명 |
|------|------|
| 0000 | 성공 (SMS/LMS/MMS) |
| 1000 | 성공 (알림톡/친구톡) |
| 9999 | 시스템 오류 (패킷 오류) |

#### 📌 인증 및 프로필 관련 (1xxx)

| 코드 | 설명 |
|------|------|
| 1001 | Request Body가 Json 형식이 아님 |
| 1002 | 허브 파트너 키가 유효하지 않음 |
| 1003 | 발신 프로필 키가 유효하지 않음 |
| 1006 | 삭제된 발신프로필 (MTS 담당자 문의 필요) |
| 1007 | 차단 상태의 발신프로필 (MTS 담당자 문의 필요) |
| 1021 | 차단 상태의 카카오톡 채널 |
| 1022 | 닫힘 상태의 카카오톡 채널 |
| 1023 | 삭제된 카카오톡 채널 |
| 1025 | 채널 제재 상태로 인한 메시지 전송 실패 |

#### 📌 메시지 전송 오류 (3xxx)

| 코드 | 설명 |
|------|------|
| 3005 | 메시지를 발송했으나 수신확인 안됨 (성공 불확실) |
| 3006 | 내부 시스템 오류로 메시지 전송 실패 |
| 3008 | 전화번호 오류 |
| 3010 | Json 파싱 오류 |
| 3011 | 메시지가 존재하지 않음 |
| 3012 | 메시지 일련번호가 중복됨 |
| 3013 | 메시지가 비어 있음 |
| 3014 | 메시지 길이 제한 오류 (템플릿별 제한 길이 또는 1000자 초과) |
| 3015 | 템플릿을 찾을 수 없음 |
| 3016 | 메시지 내용이 템플릿과 일치하지 않음 |
| 3018 | 메시지를 전송할 수 없음 |
| 3019 | 톡 유저가 아님 |
| 3020 | 알림톡 수신 차단 |
| 3021 | 카카오톡 최소 버전 미지원 |
| 3022 | 메시지 발송 가능한 시간이 아님 (친구톡/마케팅: 08~20시) |
| 3024 | 메시지에 포함된 이미지를 전송할 수 없음 |
| 3027 | 메시지 버튼/바로연결이 템플릿과 일치하지 않음 |

#### 📌 카카오 서버 오류 (8xxx)

| 코드 | 설명 |
|------|------|
| 8001 | 카카오 서버로 전송 중 오류 발생 |
| 8004 | 카카오 서버로 전송했으나 응답 없음 |

#### 📌 MTS 시스템 오류 (ERxx)

| 코드 | 설명 |
|------|------|
| ER00 | JSON 파싱 중 에러 발생 |
| ER01 | 인증코드 내용이 없거나 유효하지 않음 |
| ER02 | 발신프로필키 내용이 없음 |
| ER03 | 수신자번호 내용이 없음 |

#### 📌 SMS/MMS 이통사 오류 (1xxx, 2xxx, 4xxx)

| 코드 | 설명 |
|------|------|
| 1013 | 결번 |
| 1026 | 음영지역 |
| 2003 | 주소를 MMS Relay/Server가 찾을 수 없음 |
| 2007 | 메시지가 규격에 맞지 않음 / 번호 이동된 가입자 |
| 2103 | 미지원 단말 |
| 4000 | 요구된 서비스가 실행될 수 없음 |
| 4007 | 클라이언트가 permission이 없는 경우 / 전송 실패 |
| 4008 | 이통사 일시적인 트래픽 초과로 인한 실패 |
| 6014 | 수신자가 착신거절 신청자 |
| 8880 | MMS 이미지 발송 시 발송할 수 없는 이미지 파일 |

**전체 에러 코드**: 공식 문서 `MTS_카카오알림톡_Restful_Interface_Guide_v2.1.md` 2558-2779 라인 참조

---

## 작업 순서

### Phase 0: 준비 (필수) ✅ 완료
```
1. ✅ MTS auth_code 발급 확인 (필요 시 담당자 문의)
2. ✅ 테스트 계정 준비
3. ✅ src/lib/mtsApi.ts 신규 작성 완료
4. ✅ .env 파일에 MTS API 환경 변수 추가 완료
```

### Phase 1: 시스템 알림 SMS ✅ 완료
```
4. ✅ src/utils/smsNotification.ts 수정 완료
   - sendNaverSMS → sendMtsSMS 변경
   - sendNaverMMS → sendMtsMMS 변경
   - fileIds → imageUrls 파라미터 변경
   - 시스템 대표 발신번호 자동 조회 기능 추가
5. ⬜ 사업자 인증 알림 테스트
6. ⬜ 문의 답변 알림 테스트
7. ⬜ 관리자 승인 알림 테스트
```

### Phase 2: 메시지 발송 API ✅ 완료
```
8. ✅ src/lib/messageSender.ts 수정 완료
   - sendNaverSMS → sendMtsSMS 전환
   - sendNaverMMS → sendMtsMMS 전환
   - imageFileIds → imageUrls 파라미터 변경
   - 발신번호 자동 조회 로직 추가 (users.phone_number)
   - metadata 필드 변경: naver_request_id → mts_msg_id
9. ✅ /api/messages/send 수정 완료
   - imageFileIds → imageUrls 파라미터 변경
10. ✅ /api/message/send 수정 완료
   - sendNaverSMS → sendMtsSMS 전환
   - sendNaverMMS → sendMtsMMS 전환
   - fileIds → imageUrls 파라미터 변경
   - callbackNumber 파라미터 필수 추가
   - 응답 필드 변경: requestId → messageId
11. ⬜ 즉시 발송 테스트
12. ⬜ 다중 수신자 발송 테스트
```

### Phase 3: 예약 Cron Job
```
13. ⬜ /api/messages/scheduled-send-check 수정
14. ⬜ /api/cron/send-scheduled-messages 수정
15. ⬜ /api/reservations/auto-send-check 수정
```

### Phase 4: UI 정리
```
16. ⬜ RCS 컴포넌트 삭제
17. ⬜ 탭 명칭 변경 (카카오/네이버 톡톡)
```

### Phase 5: 정리
```
18. ⬜ naverSensApi.ts 삭제
19. ⬜ /api/auth/send-verification 삭제
20. ⬜ 환경변수 업데이트 (Naver SENS 제거)
```

---

## 구현 주의사항

### 1. 날짜 형식 변환

| 항목 | Naver SENS | MTS API |
|-----|-----------|---------|
| 형식 | `yyyy-MM-dd HH:mm` | `YYYYMMDDHHmmss` |
| 예시 | `2025-01-28 15:00` | `20250128150000` |

```typescript
// 변환 함수 예시
function convertToMtsDateFormat(naverDate: string): string {
  return naverDate.replace(/[-:\s]/g, '');
}
```

### 2. 메시지 타입 자동 판단

**Naver SENS**: 명시적 타입 지정 (`type: "SMS" | "LMS" | "MMS"`)
**MTS API**:
- SMS/LMS: 90바이트 기준 자동 판단 (같은 엔드포인트)
- MMS: 별도 엔드포인트 사용

```typescript
function determineEndpoint(message: string, hasImage: boolean) {
  if (hasImage) return '/sndng/mms/sendMessage';
  return '/sndng/sms/sendMessage'; // 90바이트 기준 자동 SMS/LMS 판단
}
```

### 3. 발신번호 관리

#### 사용자 메시지 발송
**변경 사항**:
- ❌ `sender_numbers` 테이블 삭제 예정
- ✅ `users.phone_number` 필드 사용

```typescript
// 사용자가 직접 발송하는 메시지 (메시지 발송 페이지, 예약 발송)
const callbackNumber = user.phone_number;
```

#### 시스템 알림 SMS
**발신번호 규칙**:
- ❌ 사용자 개인 번호 사용 불가 (`users.phone_number` 사용 안 함)
- ✅ **시스템 대표 번호 사용**: `system_settings.site_settings.contact_phone`
- ✅ Fallback: Footer 대표번호 `070-8824-1139`

```typescript
// 시스템 알림 SMS 발신번호 조회 함수
async function getSystemContactPhone() {
  const { data: settings } = await supabase
    .from('system_settings')
    .select('site_settings')
    .limit(1)
    .single();

  const siteSettings = settings?.site_settings || {};
  return siteSettings.contact_phone || '070-8824-1139';
}

// 시스템 알림 SMS 발송 시
const systemCallbackNumber = await getSystemContactPhone();
await sendMtsSMS(recipientNumber, message, systemCallbackNumber);
```

**적용 대상**:
1. **사업자 인증 알림** (관리자에게 전송)
2. **문의 답변 알림** (사용자에게 전송, `sms_notification=true`)
3. **회원 승인 알림** (사용자에게 전송)

### 4. 이미지 처리 플로우

**Naver SENS**: 파일 ID 참조
```typescript
const fileIds = ['abc123', 'def456'];
await sendNaverMMS(to, message, subject, fileIds);
```

**MTS API**: 업로드 후 경로 사용
```typescript
// 1. 이미지 업로드
const uploadResult = await uploadImage(imageFile);
// Response: { code: "0000", images: "/2025/01/28/image.jpg" }

// 2. 발송 시 경로 사용
await sendMtsMMS(to, message, subject, {
  attachment: {
    image: [{ img_url: uploadResult.images }]
  }
});
```

**주의**: 응답 필드는 `images` (복수형)이지만, 발송 시에는 `img_url` 사용.

### 5. 친구톡 V2 전환

**기존 API 종료 예정**:
```typescript
// ❌ 사용 금지
POST /sndng/ftk/sendMessage
```

**V2로 전환**:
```typescript
// ✅ 새로운 API 사용
POST /v2/sndng/ftk/sendMessage
POST /v2/sndng/ftk/sendMessages
```

**주요 차이점**:
- `messageType` 파라미터 필수 (FT/FI/FW/FL/FC)
- `ad_flag` 파라미터 추가 (Y/N)
- 응답 타입: `FTKV2` (기존: `FTK`)

### 6. 전환 전송 (Fallback) 구현

알림톡/친구톡 실패 시 자동으로 SMS/LMS/MMS로 전환:

```typescript
// 알림톡 발송 시 SMS 전환 설정
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "template_code": "템플릿코드",
  "phone_number": "01012345678",
  "message": "알림톡 메시지",
  "callback_number": "01087654321",

  // 전환 전송 설정
  "tran_type": "SMS",
  "tran_callback": "01087654321",
  "tran_message": "알림톡 전송 실패 시 보낼 문자"
}
```

**사용 시나리오**:
- 3019 (톡 유저가 아님)
- 3020 (알림톡 수신 차단)
- 3022 (발송 가능 시간 아님)

### 7. 시스템 알림 SMS

#### 사업자 인증 알림
```typescript
// src/app/api/business-verification/submit/route.ts
// Line 228: triggerNotification() 호출
// → smsNotification.ts 수정만으로 자동 반영
```

#### 문의 답변 알림
```typescript
// src/app/api/inquiries/[id]/reply/route.ts
// Line 205: sendInquiryReplyNotification() 호출
// 조건: inquiry.sms_notification === true
// → smsNotification.ts 수정만으로 자동 반영
```

### 8. 예약 발송 Cron Job

| Cron Job | 테이블 | 발송 조건 |
|---------|--------|----------|
| scheduled-send-check | `scheduled_messages` | `status='pending'` AND `scheduled_at <= now` |
| send-scheduled-messages | `reservation_scheduled_messages` | 동일 |
| auto-send-check | `reservation_auto_message_rules` | 규칙 기반 자동 계산 |

### 9. 카카오 템플릿 관리

**템플릿 사전 등록 필수**:
- 알림톡: 템플릿 검수 승인 필요 (1~2일 소요)
- 친구톡: 템플릿 없이 자유 전송 가능 (광고형은 08~20시만)
- 브랜드 메시지: 템플릿 등록 및 검수 필요

**템플릿 관리 플로우**:
1. `postTemplate` - 템플릿 등록
2. 카카오 검수 대기 (1~2일)
3. `getTemplate` - 승인 상태 확인
4. 승인 후 `sendMessage`로 발송

---

## 테스트 체크리스트

### ✅ Phase 0: 준비 (완료)
- [x] MTS auth_code 발급 확인 (필요 시 담당자 문의)
- [x] 테스트 발신번호 등록 확인
- [x] 테스트 수신번호 준비
- [x] mtsApi.ts 작성 완료
- [x] ESLint 에러 수정 (5개 any → Record<string, unknown>)
- [x] Buffer/Blob 타입 에러 수정 완료
- [x] .env 환경 변수 설정 완료
- [x] TypeScript 컴파일 에러 0개 확인

### ✅ Phase 1: 시스템 알림 (코드 완료, 테스트 대기)
- [x] smsNotification.ts MTS API로 전환 완료
- [x] 시스템 대표 발신번호 자동 조회 기능 구현
- [ ] 사업자 인증 신청 → 관리자 SMS 수신 테스트
- [ ] 문의 답변 등록 → 사용자 SMS 수신 테스트 (sms_notification=true)
- [ ] 회원 승인 처리 → 사용자 SMS 수신 테스트
- [ ] 에러 코드 3008 (전화번호 오류) 핸들링 확인

### ✅ Phase 2: 즉시 발송 (코드 완료, 테스트 대기)
- [x] messageSender.ts MTS API로 전환 완료
- [x] /api/messages/send 수정 완료
- [x] /api/message/send 수정 완료
- [x] MtsApiResult 타입에 messageId 필드 추가
- [x] sendMtsSMS에 subject 파라미터 추가
- [x] 발신번호 자동 조회 로직 구현 (users.phone_number)
- [ ] SMS 즉시 발송 (90바이트 이하) 테스트
- [ ] LMS 즉시 발송 (90바이트 초과) 테스트
- [ ] MMS 즉시 발송 (이미지 첨부) 테스트
- [ ] 다중 수신자 발송 테스트
- [ ] 이미지 업로드 응답 필드 (`images`) 확인

### ✅ Phase 3: 예약 발송
- [ ] 예약 메시지 등록
- [ ] Cron Job 실행 (scheduled-send-check)
- [ ] 예약 시간 도래 시 자동 발송 확인
- [ ] 날짜 형식 변환 (YYYYMMDDHHmmss) 확인

### ✅ Phase 4: 예약관리 Cron
- [ ] reservation_scheduled_messages 발송
- [ ] reservation_auto_message_rules 자동 발송
- [ ] 체크인/체크아웃 시점 메시지 발송

### ✅ Phase 5: 카카오 서비스
- [ ] 알림톡 템플릿 등록 및 조회
- [ ] 알림톡 발송 성공 (에러 코드 1000)
- [ ] 친구톡 V2 발송 (messageType: FI)
- [ ] 전환 전송 테스트 (알림톡 → SMS)
- [ ] 에러 코드 3015 (템플릿 없음) 핸들링
- [ ] 에러 코드 3016 (템플릿 불일치) 핸들링
- [ ] 에러 코드 3022 (발송 시간 제한) 핸들링

### ✅ Phase 6: UI 확인
- [ ] RCS 탭 제거 확인
- [ ] "카카오/네이버 톡톡" 탭 명칭 확인
- [ ] 카카오 알림톡 UI 정상 동작
- [ ] 친구톡 V2 선택 옵션 추가 확인

---

## 환경 변수 설정

### ❌ 제거
```bash
NAVER_SENS_SERVICE_ID
NAVER_ACCESS_KEY_ID
NAVER_SECRET_KEY
```

### ✅ 추가
```bash
# MTS API 인증
MTS_AUTH_CODE=your_mts_auth_code_here

# MTS API 엔드포인트
MTS_API_URL=https://api.mtsco.co.kr
MTS_TEMPLATE_API_URL=https://talks.mtsco.co.kr
```

### ⚠️ 유지 (필요시)
```bash
TEST_CALLING_NUMBER=01012345678  # 테스트용 발신번호
```

---

## 참고 문서

### 내부 문서
- `CLAUDE.md` - 프로젝트 개요
- `README.md` - 설치 및 실행 가이드

### MTS API 공식 문서
- `docs/연동규격서md/발송API/` - 발송 API
  - `MTS_카카오알림톡_Restful_Interface_Guide_v2.1.md` (친구톡 V2 포함)
  - `MTS_카카오브랜드메시지_*.md`
- `docs/연동규격서md/비즈API/` - 템플릿 관리 API
  - `카카오 알림톡 템플릿 자동화 API 20250801.md`
  - `카카오 발신프로필관리 자동화 API v20251002.md`
  - `카카오 이미지 업로드 API 20210629.md`

---

## 문의 및 지원

**MTS API 관련**:
- MTS 영업담당자를 통해 auth_code 발급
- 기술 지원: MTS 고객센터

**프로젝트 관련**:
- 작성자: Claude Code
- 최종 수정일: 2025-10-28

---

## 변경 이력

**v1.2 (2025-10-28)**:
- ✅ 시스템 알림 SMS 발신번호 규칙 추가
  - 사용자 메시지: `users.phone_number` 사용
  - 시스템 알림: `system_settings.site_settings.contact_phone` 사용
  - Fallback: `070-8824-1139` (Footer 대표번호)
- ✅ 발신번호 관리 섹션 명확화 (사용자 vs 시스템 구분)

**v1.1 (2025-10-28)**:
- ✅ 에러 코드 수정 (5개 코드 오류 정정)
- ✅ 카카오 친구톡 V2 API 추가
- ✅ 전환 전송 (Fallback) 파라미터 추가
- ✅ 카카오 템플릿 관리 API 추가
- ✅ 이미지 업로드 응답 필드 수정 (`img_url` → `images`)
- ✅ 에러 코드 전체 섹션 확장 (주요 코드 20개 이상)

**v1.0 (2025-10-28)**:
- 초기 통합 가이드 작성
- 이전 문서 통합 완료

**v1.3 (2025-10-28)**:
- ✅ Phase 0 완료: mtsApi.ts 신규 작성 및 ESLint 에러 수정
  - any 타입을 Record<string, unknown> 타입으로 변경
  - 5개의 TypeScript ESLint 에러 수정 완료
- ✅ Phase 1 완료: smsNotification.ts MTS API로 전환
  - sendNaverSMS → sendMtsSMS 변경
  - sendNaverMMS → sendMtsMMS 변경
  - fileIds → imageUrls 파라미터 변경
  - 시스템 대표 발신번호 자동 조회 기능 추가
- ✅ .env 환경 변수 설정 완료

**v1.4 (2025-10-28)**:
- ✅ Buffer/Blob 타입 에러 수정
  - uploadMtsImage 함수의 Buffer → Uint8Array → BlobPart 변환 로직 수정
  - 타입 캐스팅을 통한 TypeScript 호환성 문제 해결
  - 함수 시그니처 개선 (File | Buffer → Buffer, mimeType 파라미터 추가)
- ✅ 모든 TypeScript 컴파일 에러 수정 완료

**v1.5 (2025-10-28)**:
- ✅ Phase 2 완료: 메시지 발송 API MTS 전환
  - src/lib/messageSender.ts 전환 완료
    - sendNaverSMS/sendNaverMMS → sendMtsSMS/sendMtsMMS
    - imageFileIds → imageUrls 파라미터 변경
    - 발신번호 자동 조회 로직 추가 (users.phone_number)
    - metadata 필드명 변경: naver_request_id → mts_msg_id
  - /api/messages/send 수정 완료
  - /api/message/send 완전 재작성 완료
- ✅ MtsApiResult 타입 개선
  - messageId 필드 추가 (msgId의 alias, 호환성)
  - 모든 성공 응답에 messageId 포함
- ✅ sendMtsSMS/sendMtsMMS 함수 시그니처 개선
  - sendMtsSMS에 subject 파라미터 추가 (LMS용)
  - 파라미터 순서 통일 및 문서화
- ✅ TypeScript 에러 수정
  - smsNotification.ts의 any 타입 → Record<string, unknown>로 변경

---

**버전**: 1.5 (최종본)

