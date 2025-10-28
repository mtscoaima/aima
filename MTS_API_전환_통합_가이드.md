# MTS API 전환 통합 가이드

> **프로젝트**: MTS Message Portal
> **작성일**: 2025-10-28
> **최종 수정**: 2025-10-28 (v2.1 - Phase 7 완료: 카카오 친구톡 V2 구현)
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

**✅ Phase 0-5 완료 (SMS/LMS/MMS 전환 + 정리)**

| 구분 | 수정 | 삭제 | 신규 | 합계 |
|-----|-----|-----|-----|-----|
| 핵심 라이브러리 | 2 | 2 | 1 | 5 |
| API 엔드포인트 | 10 | 2 | 0 | 12 |
| UI 컴포넌트 | 2 | 4 | 0 | 6 |
| 환경 설정 파일 | 2 | 0 | 0 | 2 |
| **Phase 0-5 합계** | **16** | **8** | **1** | **25** |

**✅ Phase 6 완료 (카카오 알림톡 구현)**

| 구분 | 수정 | 삭제 | 신규 | 합계 |
|-----|-----|-----|-----|-----|
| 핵심 라이브러리 | 1 | 0 | 0 | 1 |
| API 엔드포인트 | 0 | 0 | 3 | 3 |
| API 유틸리티 | 0 | 0 | 1 | 1 |
| UI 컴포넌트 | 2 | 0 | 1 | 3 |
| **Phase 6 합계** | **3** | **0** | **5** | **8** |

**✅ Phase 7 완료 (카카오 친구톡 V2 구현)**

| 구분 | 수정 | 삭제 | 신규 | 합계 |
|-----|-----|-----|-----|-----|
| API 엔드포인트 | 0 | 0 | 1 | 1 |
| API 유틸리티 | 1 | 0 | 0 | 1 |
| UI 컴포넌트 | 1 | 0 | 1 | 2 |
| **Phase 7 합계** | **2** | **0** | **2** | **4** |

**✅ Phase 8 완료 (네이버 톡톡 구현)**

| 구분 | 수정 | 삭제 | 신규 | 합계 |
|-----|-----|-----|-----|-----|
| 핵심 라이브러리 | 1 | 0 | 0 | 1 |
| API 엔드포인트 | 0 | 0 | 2 | 2 |
| UI 컴포넌트 | 2 | 0 | 0 | 2 |
| **Phase 8 합계** | **3** | **0** | **2** | **5** |

**⏳ Phase 9-10 예정 (브랜드/통합)**

| 구분 | 수정 | 삭제 | 신규 | 합계 |
|-----|-----|-----|-----|-----|
| API 엔드포인트 | 0 | 0 | 1 | 1 |
| UI 컴포넌트 | 0 | 0 | 0 | 0 |
| **Phase 9-10 합계** | **0** | **0** | **1** | **1** |

**📊 전체 프로젝트 합계**

| 구분 | 수정 | 삭제 | 신규 | 합계 |
|-----|-----|-----|-----|-----|
| 핵심 라이브러리 | 4 | 2 | 1 | 7 |
| API 엔드포인트 | 10 | 2 | 10 | 22 |
| API 유틸리티 | 1 | 0 | 1 | 2 |
| UI 컴포넌트 | 8 | 4 | 2 | 14 |
| 환경 설정 파일 | 2 | 0 | 0 | 2 |
| **총합계** | **25** | **8** | **14** | **47** |

**현재 진행률**: Phase 0-8 완료 (46/47 파일, 97.9%)






















---

## 수정 대상 파일 목록

### 1️⃣ 핵심 라이브러리 (5개 - ✅ 완료)

#### ✅ 삭제 완료 (Phase 5)
```
src/lib/naverSensApi.ts - 삭제됨
```

#### ✅ 신규 작성 완료 (Phase 0)
```
src/lib/mtsApi.ts - 작성 완료
```
- MTS API 클라이언트 라이브러리
- SMS/LMS/MMS 발송 함수 구현 완료
- 카카오/네이버 발송 함수 (Phase 6-8 예정)
- 에러 처리 및 응답 매핑

#### ✅ 수정 완료 (Phase 1-2)
```
src/lib/messageSender.ts - MTS API 전환 완료
src/utils/smsNotification.ts - MTS API 전환 완료
```

---

### 2️⃣ API 엔드포인트 (12개 - ✅ 완료)

#### ✅ 메시지 발송 (2개 - Phase 2 완료)
```
src/app/api/messages/send/route.ts - MTS API 전환 완료
src/app/api/message/send/route.ts - MTS API 전환 완료
```

#### ✅ 예약 메시지 Cron (3개 - Phase 3 완료)
```
src/app/api/messages/scheduled-send-check/route.ts - MTS API 전환 완료
src/app/api/cron/send-scheduled-messages/route.ts - MTS API 전환 완료
src/app/api/reservations/auto-send-check/route.ts - MTS API 전환 완료
```

#### ✅ 시스템 알림 (3개 - Phase 1 완료)
```
src/app/api/business-verification/submit/route.ts - 간접 반영 완료
src/app/api/inquiries/[id]/reply/route.ts - 간접 반영 완료
src/app/api/admin/send-approval-notification/route.ts - MTS API 전환 완료
```

#### ✅ 삭제 완료 (1개 - Phase 5)
```
src/app/api/auth/send-verification/ - Dead Code 삭제 완료
```

#### ✅ 카카오 알림톡 (3개 - Phase 6 완료)
```
src/app/api/kakao/profiles/route.ts - 발신프로필 조회 API
src/app/api/kakao/templates/route.ts - 알림톡 템플릿 목록/상세 조회 API
src/app/api/messages/kakao/alimtalk/send/route.ts - 알림톡 발송 API
```

#### ✅ 카카오 친구톡 (1개 - Phase 7 완료)
```
src/app/api/messages/kakao/friendtalk/send/route.ts - 친구톡 V2 발송 API
```

#### ⏳ 신규 생성 예정 (3개 - Phase 8-10)
```
src/app/api/messages/kakao/brand/send/route.ts - 브랜드 메시지 (선택)
src/app/api/messages/naver/talk/send/route.ts - 네이버 톡톡 발송
src/app/api/naver/templates/route.ts - 네이버 톡톡 템플릿
```

---

### 3️⃣ UI 컴포넌트 (6개 - ✅ 완료)

#### ✅ 삭제 완료 (Phase 4)
```
src/components/messages/RcsMessageContent.tsx - 삭제됨
src/components/messages/rcs/RcsBrandTab.tsx - 삭제됨
src/components/messages/rcs/RcsTemplateTab.tsx - 삭제됨
public/images/kakao_naver_rcs/rcs_slide_type_preview.png - 삭제됨
```

#### ✅ 수정 완료 (Phase 4)
```
src/components/messages/MessageSendTab.tsx - RCS 탭 제거 완료
src/components/messages/KakaoNaverRcsTab.tsx - RCS 관련 코드 제거 완료
src/app/messages/send/page.tsx - 탭 명칭 변경 완료
```


#### ✅ Phase 6 완료 (4개)
```
src/lib/mtsApi.ts - 카카오 알림톡 함수 추가 (getMtsSenderProfiles)
src/utils/kakaoApi.ts - 카카오 API 유틸리티 신규 작성
src/components/messages/AlimtalkTab.tsx - 알림톡 탭 컴포넌트 신규 작성
src/components/messages/KakaoMessageContent.tsx - 알림톡 탭 통합
src/components/messages/MessageSendTab.tsx - props 전달 추가
```

#### ⏳ 수정 예정 (1개 - Phase 7-8)
```
src/components/messages/NaverTalkContent.tsx - 네이버 톡톡 발송 버튼 추가
```

---

### 4️⃣ API 유틸리티 (1개 - ✅ Phase 6 완료)

#### ✅ 신규 작성 완료 (Phase 6)
```
src/utils/kakaoApi.ts - 카카오 API 클라이언트 유틸리티
```
- 발신프로필 조회 함수 (fetchSenderProfiles)
- 알림톡 템플릿 조회 함수 (fetchAlimtalkTemplates)
- 알림톡 발송 함수 (sendAlimtalk)
- TypeScript 인터페이스 정의 (SenderProfile, AlimtalkTemplate, AlimtalkSendRequest)

### 4️⃣ 환경 설정 파일 (2개 - ✅ 완료)

#### ✅ 수정 완료 (Phase 5)
```
.env - Naver SENS 환경변수 제거, MTS API 환경변수 유지
.env.local.example - MTS API 환경변수 추가
```

**주요 변경사항:**
- ❌ 제거: NAVER_SENS_SERVICE_ID, NAVER_ACCESS_KEY_ID, NAVER_SECRET_KEY
- ✅ 추가: MTS_AUTH_CODE, MTS_API_URL, MTS_TEMPLATE_API_URL
- ✅ 유지: TEST_CALLING_NUMBER (용도 명시)

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

## 카카오/네이버 발송 API 스펙

### 🔷 카카오 알림톡

**엔드포인트**: `POST /sndng/atk/sendMessage`

**필수 파라미터**:
```json
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "template_code": "템플릿코드",
  "phone_number": "수신번호",
  "message": "템플릿 내용",
  "callback_number": "발신번호"
}
```

**선택 파라미터**:
- `attachment.button[]` - 버튼 설정
  - `name`: 버튼명
  - `type`: WL(웹링크), AL(앱링크), BK(봇키워드), MD(메시지전달)
  - `url_mobile`: 모바일 URL
- `tran_type` - 전환 발송 타입 (SMS/LMS/MMS)
- `tran_callback` - 전환 발송 번호
- `tran_message` - 전환 발송 메시지

**관리 API**:
- 발신프로필 조회: `POST https://talks.mtsco.co.kr/mts/api/sender/list`
- 템플릿 목록 조회: `POST https://talks.mtsco.co.kr/kakaoTalk/atk/getTemplateList`
- 템플릿 상세 조회: `POST https://talks.mtsco.co.kr/kakaoTalk/atk/getTemplate`
- 템플릿 등록: `POST https://talks.mtsco.co.kr/kakaoTalk/atk/postTemplate`

**성공 응답**:
```json
{
  "code": "1000",
  "message": "정상 처리되었습니다",
  "msg_id": "202501281500001234"
}
```

---

### 🔷 카카오 친구톡 V2 (권장)

**엔드포인트**: `POST /v2/sndng/ftk/sendMessage`

**중요**: 기존 친구톡 API(`/sndng/ftk/sendMessage`)는 지원 종료 예정. 반드시 V2 사용.

**필수 파라미터**:
```json
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "phone_number": "수신번호",
  "message": "메시지 내용",
  "messageType": "FT|FI|FW|FL|FC",
  "ad_flag": "Y|N",
  "callback_number": "발신번호"
}
```

**messageType (필수)**:
- `FT`: 텍스트형 (기본)
- `FI`: 이미지형
- `FW`: 와이드 이미지형
- `FL`: 와이드 리스트형
- `FC`: 캐러셀형

**ad_flag (필수)**:
- `Y`: 광고성 메시지 (08시~20시만 발송 가능)
- `N`: 일반 메시지

**선택 파라미터**:
```json
{
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

---

### 🔷 네이버 톡톡 (스마트알림)

**템플릿 기반 발송 필수**

**필수 파라미터**:
```json
{
  "auth_code": "인증코드",
  "productCode": "INFORMATION|BENEFIT|CARDINFO",
  "code": "템플릿코드",
  "text": "템플릿 내용 (변수 치환)"
}
```

**productCode 종류**:
- `INFORMATION`: 정보성 - 알림
- `BENEFIT`: 마케팅/광고 - 혜택
- `CARDINFO`: 정보성 - 카드알림

**변수 치환 형식**: `#{변수명}`
- 예: `"주문번호 : #{orderNo}"` → `"주문번호 : 12345"`

**템플릿 구성 요소**:
- `text`: 발송할 텍스트 (변수 포함 가능)
- `categoryCode`: 템플릿 카테고리 코드
- `buttons`: 버튼 (최대 5개, WEB_LINK/APP_LINK)
- `sampleImageHashId`: 이미지 해시 ID (선택)
- `sampleCoupon`: 쿠폰 정보 (선택)

---

### 🔷 카카오 브랜드 메시지

**3가지 타입**:
1. **기본형 (전문방식)**: 전체 메시지를 JSON으로 전송
2. **기본형 (변수분리방식)**: 템플릿과 변수를 분리하여 전송
3. **자유형**: 템플릿 없이 자유롭게 작성

**엔드포인트**: `POST /sndng/cbm/sendMessage` (또는 `/v2/sndng/cbm/sendMessage`)

**기본 파라미터**:
```json
{
  "auth_code": "인증코드",
  "sender_key": "발신프로필키",
  "phone_number": "수신번호",
  "template_code": "템플릿코드",
  "message": "메시지 내용",
  "callback_number": "발신번호"
}
```

---

### 🔷 이미지 업로드

**엔드포인트**: `POST /img/upload_image`

**Content-Type**: `multipart/form-data`

```typescript
const formData = new FormData();
formData.append('auth_code', MTS_AUTH_CODE);
formData.append('image', imageFile);

// 응답
{
  "code": "0000",
  "images": "/2025/01/28/image.jpg"  // 주의: 필드명은 "images"
}
```

**제한사항**:
- 최대 파일 크기: 300KB (권장)
- 권장 해상도: 552 x 552 (네이버 톡톡)
- 지원 포맷: JPG, PNG

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

### Phase 3: 예약 Cron Job ✅ 완료
```
13. ✅ /api/messages/scheduled-send-check 수정 완료
   - sendNaverSMS/sendNaverMMS → sendMtsSMS/sendMtsMMS 전환
   - imageFileIds → imageUrls 파라미터 변경
   - 발신번호 자동 조회 로직 추가 (users.phone_number)
   - 예약 시간 날짜 형식 변환 (YYYYMMDDHHmmss)
   - metadata에 mts_msg_id 필드 추가
14. ✅ /api/cron/send-scheduled-messages 수정 완료
   - sendNaverSMS → sendMtsSMS 전환
   - 발신번호 자동 조회 로직 추가 (users.phone_number)
   - 발신번호 누락 시 에러 처리 추가
15. ✅ /api/reservations/auto-send-check 수정 완료
   - sendNaverSMS → sendMtsSMS 전환
   - 호스트 연락처 조회 방식 변경 (sender_numbers → users.phone_number)
   - 발신번호 누락 시 에러 처리 추가
16. ⬜ 예약 메시지 등록 및 발송 테스트
17. ⬜ Cron Job 실행 테스트
18. ⬜ 날짜 형식 변환 검증
```

### Phase 4: UI 정리 ✅ 완료
```
19. ✅ RCS 컴포넌트 삭제 완료
    - RcsMessageContent.tsx 삭제
    - rcs/RcsBrandTab.tsx 삭제
    - rcs/RcsTemplateTab.tsx 삭제
    - rcs_slide_type_preview.png 삭제
20. ✅ 탭 명칭 변경 완료 (카카오/네이버 톡톡)
    - MessageSendTab.tsx RCS 탭 제거
    - KakaoNaverRcsTab.tsx RCS 메인/서브 탭 제거
    - messages/send/page.tsx 탭 명칭 변경
```

### Phase 5: 정리 ✅ 완료
```
21. ✅ naverSensApi.ts 삭제 완료
22. ✅ /api/auth/send-verification 삭제 완료 (Dead Code)
23. ✅ 환경변수 업데이트 완료
    - .env 파일에서 Naver SENS 환경변수 제거
    - .env.local.example MTS API 환경변수 추가
    - TEST_CALLING_NUMBER 용도 명시
24. ✅ .next 캐시 삭제
25. ✅ TypeScript 컴파일 에러 0개 확인
26. ✅ 프로덕션 빌드 성공 (24.0s)
```

### Phase 6: 카카오 알림톡 구현 ✅ 완료
```
27. ✅ mtsApi.ts에 카카오 알림톡 함수 추가
    - getMtsSenderProfiles() - 발신프로필 조회 (페이지네이션 지원)
28. ✅ API 유틸리티 신규 작성
    - src/utils/kakaoApi.ts 작성 완료
    - fetchSenderProfiles() - 발신프로필 조회
    - fetchAlimtalkTemplates() - 템플릿 목록/상세 조회
    - sendAlimtalk() - 알림톡 발송
29. ✅ API 엔드포인트 생성 (3개)
    - /api/kakao/profiles/route.ts - 발신프로필 조회
    - /api/kakao/templates/route.ts - 알림톡 템플릿 목록/상세
    - /api/messages/kakao/alimtalk/send/route.ts - 알림톡 발송
30. ✅ AlimtalkTab 컴포넌트 신규 작성
    - src/components/messages/AlimtalkTab.tsx
    - 발신프로필 자동 로딩 및 선택
    - 템플릿 선택 및 미리보기
    - SMS 백업 옵션 (tran_type, tran_message)
    - 발송 버튼 및 에러 처리
31. ✅ KakaoMessageContent.tsx 알림톡 탭 통합
    - AlimtalkTab 컴포넌트 import
    - recipients, selectedSenderNumber props 추가
    - 알림톡 탭 섹션에 AlimtalkTab 컴포넌트 렌더링
32. ✅ MessageSendTab.tsx 수정
    - KakaoMessageContent에 recipients, selectedSenderNumber props 전달
33. ✅ TypeScript 컴파일 에러 0개 확인
34. ✅ 프로덕션 빌드 성공 (12.0s)
```

### Phase 7: 카카오 친구톡 V2 구현 ✅ 완료
```
35. ✅ mtsApi.ts에 친구톡 V2 함수 확인
    - sendMtsFriendtalk() - V2 발송 함수 이미 구현됨
36. ✅ kakaoApi.ts에 친구톡 V2 함수 추가
    - FriendtalkSendRequest 인터페이스 추가
    - sendFriendtalk() - 친구톡 발송 함수 작성
37. ✅ API 엔드포인트 생성
    - /api/messages/kakao/friendtalk/send/route.ts 생성
    - JWT 인증, 파라미터 검증, 다중 수신자 발송 구현
    - message_logs 및 transactions 테이블 자동 저장
38. ✅ FriendtalkTab 컴포넌트 신규 작성
    - src/components/messages/FriendtalkTab.tsx
    - 발신프로필 자동 로딩
    - messageType 선택 UI (FT/FI/FW/FL/FC)
    - ad_flag 체크박스 (광고성 여부, 08:00-20:00 검증)
    - 이미지 URL 입력 UI
    - SMS 백업 옵션 (tran_type, tran_message)
    - 발송 버튼 및 에러 처리
39. ✅ KakaoMessageContent.tsx 친구톡 탭 통합
    - FriendtalkTab 컴포넌트 import
    - 친구톡 탭 섹션에 FriendtalkTab 렌더링
    - recipients, selectedSenderNumber props 전달
40. ✅ TypeScript 컴파일 에러 0개 확인
41. ✅ 프로덕션 빌드 성공 (170kB for messages/send)
```

### Phase 8: 네이버 톡톡 구현 ✅ 완료
```
42. ✅ mtsApi.ts에 네이버 톡톡 함수 추가
    - sendNaverTalk() - 톡톡 스마트알림 발송
    - getNaverTalkTemplates() - 템플릿 목록 조회
43. ✅ API 엔드포인트 생성 (2개)
    - /api/naver/templates - 템플릿 조회 API (GET)
    - /api/messages/naver/talk/send - 네이버 톡톡 발송 API (POST)
44. ✅ NaverTalkContent.tsx 수정
    - 네이버톡 ID 입력 필드
    - 템플릿 자동 로딩 및 선택
    - 상품 코드 선택 (INFORMATION/BENEFIT/CARDINFO)
    - 템플릿 내용 미리보기 및 변수 치환
    - 발송 버튼 및 에러 처리
45. ✅ MessageSendTab.tsx 수정
    - NaverTalkContent에 recipients props 전달
46. ✅ TypeScript 컴파일 에러 0개 확인
47. ✅ 프로덕션 빌드 성공 (16.0s)
```

### Phase 9: 카카오 브랜드 메시지 구현 (선택사항)
```
34. ⬜ mtsApi.ts에 브랜드 메시지 함수 추가
    - sendKakaoBrand() - 브랜드 메시지 발송
35. ⬜ API 엔드포인트 생성
    - /api/messages/kakao/brand/send
36. ⬜ KakaoMessageContent.tsx 브랜드 탭 수정
    - 타입별 UI (기본형, 자유형)
    - 발송 버튼 추가
```

### Phase 10: 예약 발송 및 통합 (예정)
```
37. ⬜ 카카오/네이버 예약 발송 기능 추가
    - scheduled_messages 테이블에 타입별 저장
38. ⬜ Cron Job 수정 (타입별 발송 처리)
    - /api/messages/scheduled-send-check 수정
39. ⬜ 발송 결과 추적 및 로깅
    - msg_id 저장 및 조회
40. ⬜ 통합 테스트
    - 알림톡/친구톡/네이버 발송
    - 예약 발송 테스트
    - 에러 핸들링 테스트
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

### ✅ Phase 3: 예약 발송 (코드 완료, 테스트 대기)
- [x] /api/messages/scheduled-send-check MTS API로 전환 완료
  - [x] sendNaverSMS/sendNaverMMS → sendMtsSMS/sendMtsMMS 전환
  - [x] imageFileIds → imageUrls 파라미터 변경
  - [x] 발신번호 자동 조회 로직 추가 (users.phone_number)
  - [x] 예약 시간 날짜 형식 변환 (YYYYMMDDHHmmss)
  - [x] metadata에 mts_msg_id 필드 추가
- [x] /api/cron/send-scheduled-messages MTS API로 전환 완료
  - [x] sendNaverSMS → sendMtsSMS 전환
  - [x] 발신번호 자동 조회 로직 추가
  - [x] 발신번호 누락 시 에러 처리 추가
- [x] /api/reservations/auto-send-check MTS API로 전환 완료
  - [x] sendNaverSMS → sendMtsSMS 전환
  - [x] 호스트 연락처 조회 방식 변경 (sender_numbers → users.phone_number)
  - [x] 발신번호 누락 시 에러 처리 추가
- [x] TypeScript 컴파일 에러 0개 확인
- [ ] 예약 메시지 등록 테스트
- [ ] Cron Job 실행 테스트 (scheduled-send-check)
- [ ] 예약 시간 도래 시 자동 발송 확인
- [ ] 날짜 형식 변환 검증 (YYYYMMDDHHmmss)

### ✅ Phase 4: UI 정리 (코드 완료)
- [x] RCS 컴포넌트 파일 삭제
  - [x] RcsMessageContent.tsx 삭제
  - [x] rcs/RcsBrandTab.tsx 삭제
  - [x] rcs/RcsTemplateTab.tsx 삭제
  - [x] public/images/kakao_naver_rcs/rcs_slide_type_preview.png 삭제
- [x] MessageSendTab.tsx 수정
  - [x] RcsMessageContent import 제거
  - [x] RCS 탭 버튼 제거 (🔵 RCS 문자)
  - [x] getThemeColor에서 "rcs" 케이스 제거
  - [x] renderMessageContent에서 "rcs" 케이스 제거
- [x] KakaoNaverRcsTab.tsx 수정
  - [x] RcsBrandTab, RcsTemplateTab import 제거
  - [x] activeRcsSubTab state 제거
  - [x] RCS 메인 탭 버튼 제거
  - [x] RCS 서브 탭 버튼들 제거
  - [x] renderSubTabContent에서 RCS 케이스 제거
- [x] messages/send/page.tsx 수정
  - [x] 탭 명칭 변경: "카카오/네이버/RCS" → "카카오/네이버 톡톡"
  - [x] activeTab 값 변경: "kakao-naver-rcs" → "kakao-naver"
- [x] TypeScript 컴파일 에러 0개 확인
- [x] 빌드 성공 확인 (✓ Compiled successfully in 23.0s)

### ✅ Phase 5: 정리 (완료)
- [x] naverSensApi.ts 삭제
- [x] /api/auth/send-verification 삭제 (Dead Code)
- [x] .env에서 Naver SENS 환경변수 제거
  - [x] NAVER_SENS_SERVICE_ID 제거
  - [x] NAVER_ACCESS_KEY_ID 제거
  - [x] NAVER_SECRET_KEY 제거
  - [x] TEST_CALLING_NUMBER 주석 업데이트 (MTS API용)
- [x] .env.local.example 업데이트 (MTS API 추가)
- [x] .next 캐시 삭제
- [x] TypeScript 컴파일 에러 0개 확인
- [x] 빌드 성공 확인 (✓ Compiled successfully in 24.0s)

### ✅ Phase 6: 카카오 알림톡 구현 (완료)
- [x] mtsApi.ts에 카카오 알림톡 함수 추가
  - [x] getMtsSenderProfiles() - 발신프로필 조회 (페이지네이션)
- [x] API 유틸리티 신규 작성
  - [x] src/utils/kakaoApi.ts 작성
  - [x] fetchSenderProfiles() - 발신프로필 조회
  - [x] fetchAlimtalkTemplates() - 알림톡 템플릿 조회
  - [x] sendAlimtalk() - 알림톡 발송
  - [x] TypeScript 인터페이스 정의 (SenderProfile, AlimtalkTemplate, AlimtalkSendRequest)
- [x] API 엔드포인트 생성 (3개)
  - [x] /api/kakao/profiles/route.ts - 발신프로필 조회
  - [x] /api/kakao/templates/route.ts - 알림톡 템플릿 목록/상세
  - [x] /api/messages/kakao/alimtalk/send/route.ts - 알림톡 발송
- [x] AlimtalkTab 컴포넌트 신규 작성
  - [x] src/components/messages/AlimtalkTab.tsx
  - [x] 발신프로필 자동 로딩 및 선택 드롭다운
  - [x] 템플릿 선택 드롭다운 (프로필 선택 시 자동 로딩)
  - [x] 템플릿 메시지 미리보기
  - [x] SMS 백업 옵션 (tran_type, tran_message)
  - [x] 발송 버튼 및 API 호출
  - [x] 에러 처리 및 로딩 상태
- [x] KakaoMessageContent.tsx 알림톡 탭 통합
  - [x] AlimtalkTab 컴포넌트 import
  - [x] Recipient, KakaoMessageContentProps 인터페이스 추가
  - [x] recipients, selectedSenderNumber props 추가
  - [x] 알림톡 탭에 AlimtalkTab 렌더링 (recipients, callbackNumber 전달)
- [x] MessageSendTab.tsx 수정
  - [x] KakaoMessageContent에 recipients, selectedSenderNumber props 전달
- [x] TypeScript 컴파일 에러 0개 확인
- [x] 프로덕션 빌드 성공 (✓ Compiled successfully in 12.0s)
- [ ] 실제 알림톡 발송 테스트 (선택사항)


### ✅ Phase 7: 카카오 친구톡 V2 구현 (완료)
- [x] mtsApi.ts에 친구톡 V2 함수 확인
  - [x] sendMtsFriendtalk() - V2 발송 함수 이미 구현됨
- [x] kakaoApi.ts에 친구톡 V2 함수 추가
  - [x] FriendtalkSendRequest 인터페이스 추가
  - [x] sendFriendtalk() - 친구톡 발송 함수 작성
- [x] API 엔드포인트 생성
  - [x] /api/messages/kakao/friendtalk/send/route.ts 생성
  - [x] JWT 인증, 파라미터 검증 구현
  - [x] 다중 수신자 발송 구현
  - [x] message_logs 및 transactions 테이블 자동 저장
- [x] FriendtalkTab 컴포넌트 신규 작성
  - [x] src/components/messages/FriendtalkTab.tsx
  - [x] 발신프로필 자동 로딩 및 선택 드롭다운
  - [x] messageType 선택 UI (FT/FI/FW/FL/FC) 버튼 형식
  - [x] ad_flag 체크박스 UI (광고성 여부, 08:00-20:00 시간 검증)
  - [x] 이미지 URL 입력 UI (이미지형 타입만 표시)
  - [x] SMS 백업 옵션 (tran_type, tran_message)
  - [x] 발송 버튼 및 API 호출
  - [x] 에러 처리 및 로딩 상태
- [x] KakaoMessageContent.tsx 친구톡 탭 통합
  - [x] FriendtalkTab 컴포넌트 import
  - [x] 친구톡 탭 섹션에 FriendtalkTab 렌더링
  - [x] recipients, selectedSenderNumber props 전달
- [x] TypeScript 컴파일 에러 0개 확인
- [x] 프로덕션 빌드 성공 (✓ Compiled successfully, 170kB for messages/send)
- [ ] 실제 친구톡 발송 테스트 (선택사항)

### ✅ Phase 8: 네이버 톡톡 구현 (완료)
- [x] mtsApi.ts에 네이버 톡톡 함수 추가
  - [x] sendNaverTalk() - 톡톡 스마트알림 발송
  - [x] getNaverTalkTemplates() - 템플릿 목록 조회
- [x] API 엔드포인트 생성 (2개)
  - [x] /api/naver/templates/route.ts - 템플릿 조회 API
  - [x] /api/messages/naver/talk/send/route.ts - 네이버 톡톡 발송 API
- [x] NaverTalkContent.tsx 수정
  - [x] src/components/messages/NaverTalkContent.tsx 완전 재작성
  - [x] 네이버톡 ID 입력 필드
  - [x] 템플릿 자동 로딩 (navertalkId 입력 시)
  - [x] 템플릿 선택 드롭다운
  - [x] 상품 코드 선택 (INFORMATION/BENEFIT/CARDINFO)
  - [x] 템플릿 내용 미리보기 및 편집
  - [x] 발송 버튼 및 API 호출
  - [x] 에러 처리 및 성공 메시지
- [x] MessageSendTab.tsx 수정
  - [x] NaverTalkContent에 recipients props 전달
- [x] TypeScript 컴파일 에러 0개 확인
- [x] 프로덕션 빌드 성공 (✓ Compiled successfully in 16.0s)
- [ ] 실제 네이버 톡톡 발송 테스트 (선택사항)

### ⏳ Phase 9: 카카오 브랜드 메시지 구현 (선택사항)
- [ ] mtsApi.ts에 브랜드 메시지 함수 추가
  - [ ] sendKakaoBrand() - 브랜드 메시지 발송
- [ ] API 엔드포인트 생성
  - [ ] /api/messages/kakao/brand/send/route.ts
- [ ] KakaoMessageContent.tsx 브랜드 탭 수정
  - [ ] 타입 선택 UI (기본형/자유형)
  - [ ] 발송 버튼 추가
- [ ] TypeScript 컴파일 에러 0개 확인
- [ ] 빌드 성공 확인

### ⏳ Phase 10: 통합 테스트 (마지막)
- [ ] 알림톡 발송 테스트
  - [ ] 템플릿 등록 및 승인 (1-2일 소요)
  - [ ] 단건 발송 테스트
  - [ ] 복수 발송 테스트
  - [ ] 변수 치환 테스트
  - [ ] 버튼 클릭 테스트
  - [ ] SMS 전환 발송 테스트
- [ ] 친구톡 V2 발송 테스트
  - [ ] 텍스트형 (FT) 발송
  - [ ] 이미지형 (FI) 발송
  - [ ] 와이드형 (FW) 발송
  - [ ] 광고형 (ad_flag=Y) 시간 제한 확인
- [ ] 네이버 톡톡 발송 테스트
  - [ ] 템플릿 등록 및 승인
  - [ ] 단건 발송 테스트
  - [ ] 변수 치환 테스트
- [ ] 카카오/네이버 예약 발송 테스트
  - [ ] scheduled_messages 테이블 저장 확인
  - [ ] Cron Job 실행 확인
  - [ ] 타입별 발송 분기 확인
- [ ] 에러 핸들링 테스트
  - [ ] 발신프로필 없음 (1003)
  - [ ] 템플릿 없음 (3015)
  - [ ] 템플릿 불일치 (3016)
  - [ ] 발송 시간 제한 (3022)
- [ ] 발송 결과 추적 확인
  - [ ] msg_id 저장 확인
  - [ ] 발송 이력 조회
  - [ ] 에러 로그 확인

### ✅ Phase 5-10 이후: 카카오 서비스 (추가 기능)
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

### ✅ Phase 5 완료: Naver SENS 제거됨

**Phase 0-4에서 제거된 환경변수:**
```bash
# ❌ 제거됨 (Phase 5)
NAVER_SENS_SERVICE_ID
NAVER_ACCESS_KEY_ID
NAVER_SECRET_KEY
```

### ✅ 현재 필수 환경변수 (.env)

**MTS API 설정 (메시지 전송)**
```bash
# MTS API 인증코드
MTS_AUTH_CODE=7z12bG8oKXrMnHZcJBtycw==

# MTS API 엔드포인트
MTS_API_URL=https://api.mtsco.co.kr
MTS_TEMPLATE_API_URL=https://talks.mtsco.co.kr

# 테스트용 발신번호 (MTS API용)
TEST_CALLING_NUMBER=01042056734
```

**기타 필수 환경변수**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://piulovyzbvlmqdzninbp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# JWT 인증
JWT_SECRET=2070c0183f14ea9d5892cf71e00d858d17d9

# OpenAI (AI 템플릿 생성)
OPENAI_API_KEY=sk-proj-...

# 결제 (NicePay)
NICEPAY_CLIENT_ID=R2_fc94b724a6f84bccad38e00a6fd4518d
NICEPAY_SECRET_KEY=432d5ed59c8b426c91afc3e7a7c6a2ff
NICEPAY_API_URL=https://api.nicepay.co.kr
NICEPAY_JS_SDK_URL=https://pay.nicepay.co.kr/v1/js/

# 본인인증 (KG이니시스)
INICIS_IA_MID=INIiasTest
INICIS_IA_API_KEY=TGdxb2l3enJDWFRTbTgvREU3MGYwUT09
INICIS_IA_AUTH_URL=https://sa.inicis.com/auth

# 소셜 로그인
KAKAO_APP_KEY=033b523430b7e418ea2b7a737851587f
NAVER_CLIENT_ID=wsvDOhjO2EKeVD3bMHFI
NAVER_CLIENT_SECRET=YrpMYweTlU
GOOGLE_CLIENT_ID=546995931986-bg8rfahlefav5j2g8s0b40gk241srk87.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# 이메일 전송 (Gmail SMTP)
GMAIL_USER=iam@undermilli.com
GMAIL_APP_PASSWORD=oeegxfbljgojfacj

# 사업자등록정보 확인 API
ODCLOUD_SERVICE_KEY=32055539b8fd99aafe776cf11f56bff28e54faad583ed09172c19b739a8a9fa6

# 개발 환경
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 📝 .env.local.example 템플릿

**새로운 프로젝트 시작 시 사용할 템플릿:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-jwt-secret

# MTS API (메시지 전송)
MTS_AUTH_CODE=your-mts-auth-code
MTS_API_URL=https://api.mtsco.co.kr
MTS_TEMPLATE_API_URL=https://talks.mtsco.co.kr
TEST_CALLING_NUMBER=your-test-calling-number

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# ODCLOUD (Business Verification)
ODCLOUD_SERVICE_KEY=your-odcloud-service-key

# Base URL (Optional - Vercel에서 자동 감지)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
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

**v1.6 (2025-10-28)**:
- ✅ Phase 3 완료: 예약 메시지 Cron Job MTS 전환
  - **/api/messages/scheduled-send-check** 전환 완료
    - sendNaverSMS/sendNaverMMS → sendMtsSMS/sendMtsMMS
    - imageFileIds → imageUrls 파라미터 변경
    - 발신번호 자동 조회 로직 추가 (users.phone_number)
    - 예약 시간 날짜 형식 변환 (YYYYMMDDHHmmss)
    - metadata에 mts_msg_id 필드 추가
  - **/api/cron/send-scheduled-messages** 전환 완료
    - sendNaverSMS → sendMtsSMS 전환
    - 발신번호 자동 조회 로직 추가 (users.phone_number)
    - 발신번호 누락 시 에러 처리 추가
  - **/api/reservations/auto-send-check** 전환 완료
    - sendNaverSMS → sendMtsSMS 전환
    - 호스트 연락처 조회 방식 변경 (sender_numbers → users.phone_number)
    - 발신번호 누락 시 에러 처리 추가
- ✅ TypeScript 컴파일 에러 0개
  - sendMtsMMS 함수 파라미터 순서 수정
  - 모든 타입 에러 해결 완료
- ✅ 예약 발송 시스템 완전 전환
  - scheduled_messages 테이블 처리 로직 MTS API 전환
  - reservation_scheduled_messages 테이블 처리 로직 MTS API 전환
  - reservation_auto_message_rules 테이블 처리 로직 MTS API 전환

**v1.7 (2025-10-28)**:
- ✅ Phase 4 완료: UI 정리 및 RCS 제거
  - **RCS 컴포넌트 파일 삭제**
    - src/components/messages/RcsMessageContent.tsx 삭제
    - src/components/messages/rcs/RcsBrandTab.tsx 삭제
    - src/components/messages/rcs/RcsTemplateTab.tsx 삭제
    - public/images/kakao_naver_rcs/rcs_slide_type_preview.png 삭제
  - **MessageSendTab.tsx 수정**
    - RcsMessageContent import 제거
    - RCS 탭 버튼 제거 (🔵 RCS 문자)
    - getThemeColor에서 "rcs" 케이스 제거
    - renderMessageContent에서 "rcs" 케이스 제거
  - **KakaoNaverRcsTab.tsx 수정**
    - RcsBrandTab, RcsTemplateTab import 제거
    - activeRcsSubTab state 제거
    - RCS 메인 탭 버튼 제거
    - RCS 서브 탭 및 컨텐츠 렌더링 로직 제거
    - 카카오/네이버톡톡만 남김
  - **messages/send/page.tsx 수정**
    - 탭 명칭 변경: "카카오/네이버/RCS" → "카카오/네이버 톡톡"
    - activeTab 값 변경: "kakao-naver-rcs" → "kakao-naver"
    - URL 파라미터 검증 배열 업데이트
- ✅ TypeScript 컴파일 에러 0개
- ✅ 빌드 성공 확인 (✓ Compiled successfully in 23.0s)

**v1.8 (2025-10-28)**:
- 📋 **카카오/네이버 메시지 발송 기능 구현 계획 수립**
  - **현황 분석 완료**
    - SMS/LMS/MMS 발송만 완전 구현됨 (Phase 0-4 완료)
    - 카카오/네이버 메시지 발송은 UI만 존재, 실제 발송 로직 미구현
    - KakaoMessageContent.tsx: 알림톡/친구톡/브랜드 탭 있으나 발송 버튼 없음
    - NaverTalkContent.tsx: 드롭다운만 존재, 발송 버튼 전무
    - MessageSendTab.tsx: 모든 탭에서 /api/messages/send만 호출 (SMS 전용)
  - **구현 계획 수립 (Phase 5-10)**
    - Phase 5: 정리 (Naver SENS 코드 삭제, 환경변수 정리)
    - Phase 6: 카카오 알림톡 구현 (mtsApi 함수, API 엔드포인트, UI)
    - Phase 7: 카카오 친구톡 V2 구현 (messageType, ad_flag)
    - Phase 8: 네이버 톡톡 구현 (템플릿 기반 발송)
    - Phase 9: 카카오 브랜드 메시지 구현 (선택사항)
    - Phase 10: 예약 발송 및 통합 테스트
  - **신규 파일 구조 설계**
    - 신규 API 엔드포인트 7개 추가 예정
      - /api/messages/kakao/alimtalk/send
      - /api/messages/kakao/friendtalk/send
      - /api/messages/kakao/brand/send (선택)
      - /api/messages/naver/talk/send
      - /api/kakao/profiles
      - /api/kakao/templates
      - /api/naver/templates
    - UI 컴포넌트 2개 수정 예정
      - KakaoMessageContent.tsx (알림톡/친구톡/브랜드 탭)
      - NaverTalkContent.tsx (발송 버튼 추가)
  - **MTS API 문서 분석 완료**
    - 카카오 알림톡 API 스펙 (v2.1)
    - 카카오 친구톡 V2 API 스펙 (기존 API 종료 예정)
    - 카카오 브랜드 메시지 API (3가지 타입)
    - 네이버 톡톡 템플릿 API (v1.7)
    - 발신프로필 관리 API (v2.5)
    - 이미지 업로드 API
  - **카카오/네이버 발송 API 스펙 섹션 추가**
    - 알림톡 필수/선택 파라미터 및 관리 API
    - 친구톡 V2 messageType, ad_flag 설명
    - 네이버 톡톡 productCode, 변수 치환 형식
    - 브랜드 메시지 타입별 설명
    - 이미지 업로드 제한사항
  - **파일 작업 요약 업데이트**
    - Phase 0-4 완료: 21개 파일 작업
    - Phase 5-10 예정: 14개 파일 작업
    - 전체 프로젝트: 35개 파일 작업 예상
  - **테스트 체크리스트 확장**
    - Phase 5-10 각 단계별 상세 체크리스트 추가
    - 통합 테스트 항목 추가 (알림톡/친구톡/네이버/예약/에러)
  - **작업 우선순위 확정**
    - Option A: Phase 5 (정리) 먼저 → 카카오/네이버 순차 구현
    - Option A: 단계별 구현 (알림톡 → 친구톡 → 네이버 → 브랜드)
    - 코드 구현 후 마지막에 통합 테스트 진행
  - **발신프로필 관리 방안 확정**
    - 프로필 하나만 사용 예정
    - API를 통해 프로필 목록 조회 후 자동 선택
    - 템플릿도 API로 조회 및 관리

**v1.9 (2025-10-28)**:
- ✅ **Phase 5 완료: Naver SENS 정리**
  - **파일 삭제 (2개)**
    - src/lib/naverSensApi.ts 삭제
    - src/app/api/auth/send-verification/ 디렉토리 삭제 (Dead Code)
  - **환경변수 정리**
    - .env 파일에서 Naver SENS 환경변수 제거
      - NAVER_SENS_SERVICE_ID 제거
      - NAVER_ACCESS_KEY_ID 제거
      - NAVER_SECRET_KEY 제거
    - TEST_CALLING_NUMBER 주석 업데이트 (MTS API 테스트용)
    - .env.local.example 파일 업데이트 (MTS API 환경변수 추가)
  - **빌드 확인**
    - .next 캐시 삭제 후 클린 빌드
    - TypeScript 컴파일 에러 0개
    - 프로덕션 빌드 성공 (24.0s)
  - **문서 업데이트**
    - 파일 작업 요약 업데이트 (Phase 0-5 완료)
    - 수정 대상 파일 목록 완료 상태 반영
    - 환경 설정 파일 섹션 추가
    - 작업 순서 Phase 5 완료 표시
    - 현재 진행률 추가 (25/35 파일, 71.4%)
  - **결과**
    - Naver SENS 관련 코드 및 설정 완전 제거
    - Phase 0-5 완료 (SMS/LMS/MMS 전환 + 정리)
    - 다음 단계: Phase 6 카카오 알림톡 구현 준비 완료

---

**버전**: 1.9 (현재)
**Phase 0-5 완료율**: 71.4% (25/35 파일)
**남은 작업**: Phase 6-10 (카카오/네이버 발송 구현)


**v2.0 (2025-10-28)**:
- ✅ **Phase 6 완료: 카카오 알림톡 구현**
  - **핵심 라이브러리 (1개 수정)**
    - src/lib/mtsApi.ts에 getMtsSenderProfiles() 함수 추가
      - 발신프로필 목록 조회 기능
      - 페이지네이션 지원 (page, count)
      - MTS Template API 사용
  - **API 유틸리티 신규 작성 (1개)**
    - src/utils/kakaoApi.ts 작성
      - fetchSenderProfiles() - 발신프로필 조회
      - fetchAlimtalkTemplates() - 알림톡 템플릿 목록/상세 조회
      - sendAlimtalk() - 알림톡 발송
      - TypeScript 인터페이스 정의 (SenderProfile, AlimtalkTemplate, AlimtalkSendRequest)
  - **API 엔드포인트 생성 (3개)**
    - /api/kakao/profiles/route.ts - 발신프로필 조회 API
    - /api/kakao/templates/route.ts - 알림톡 템플릿 목록/상세 조회 API
    - /api/messages/kakao/alimtalk/send/route.ts - 알림톡 발송 API
      - 다중 수신자 지원 (recipients 배열)
      - SMS 백업 옵션 (tran_type, tran_message)
      - 트랜잭션 로깅 및 잔액 차감
  - **UI 컴포넌트 (3개 수정/신규)**
    - src/components/messages/AlimtalkTab.tsx 신규 작성
      - 발신프로필 자동 로딩 및 선택 드롭다운
      - 템플릿 선택 드롭다운 (프로필 선택 시 자동 로딩)
      - 템플릿 메시지 미리보기
      - SMS 백업 옵션 UI (체크박스, 메시지 입력)
      - 발송 버튼 및 에러 처리
    - src/components/messages/KakaoMessageContent.tsx 수정
      - AlimtalkTab 컴포넌트 통합
      - recipients, selectedSenderNumber props 추가
      - 알림톡 탭에 AlimtalkTab 렌더링
    - src/components/messages/MessageSendTab.tsx 수정
      - KakaoMessageContent에 recipients, selectedSenderNumber props 전달
  - **빌드 및 컴파일**
    - TypeScript 컴파일 에러 0개 확인
    - unused variable 에러 수정 (templateContent, setTemplateContent 제거)
    - 프로덕션 빌드 성공 (✓ Compiled successfully in 12.0s)
  - **문서 업데이트**
    - 파일 작업 요약 업데이트 (Phase 6 완료)
    - 수정 대상 파일 목록 완료 상태 반영
    - 작업 순서 Phase 6 완료 표시
    - 테스트 체크리스트 Phase 6 완료 표시
    - 현재 진행률 업데이트 (33/38 파일, 86.8%)
  - **결과**
    - 카카오 알림톡 백엔드 API 완성 (프로필, 템플릿, 발송)
    - 카카오 알림톡 프론트엔드 UI 완성 (독립 컴포넌트)
    - 기존 메시지 발송 페이지에 알림톡 기능 통합
    - Phase 0-6 완료 (SMS/LMS/MMS 전환 + 정리 + 알림톡 구현)
    - 다음 단계: Phase 7 카카오 친구톡 V2 구현 준비 완료


**v2.1 (2025-10-28)**:
- ✅ **Phase 7 완료: 카카오 친구톡 V2 구현**
  - **API 유틸리티 수정 (1개)**
    - src/utils/kakaoApi.ts에 친구톡 V2 함수 추가
      - FriendtalkSendRequest 인터페이스 추가
      - sendFriendtalk() - 친구톡 V2 발송 함수 작성
  - **API 엔드포인트 생성 (1개)**
    - /api/messages/kakao/friendtalk/send/route.ts - 친구톡 V2 발송 API
      - JWT 인증 및 파라미터 검증 (messageType, adFlag 필수)
      - 다중 수신자 발송 (recipients 배열)
      - messageType 지원 (FT/FI/FW/FL/FC)
      - 광고형 메시지 시간 검증 (ad_flag=Y일 때 08:00-20:00)
      - 이미지 URL 배열 지원 (이미지형 타입)
      - SMS 백업 옵션 (tran_type, tran_message)
      - message_logs 및 transactions 테이블 자동 저장
  - **UI 컴포넌트 (2개 신규/수정)**
    - src/components/messages/FriendtalkTab.tsx 신규 작성
      - 발신프로필 자동 로딩 및 선택 드롭다운
      - messageType 선택 UI (FT/FI/FW/FL/FC) 버튼 형식
      - ad_flag 체크박스 (광고성 여부, 08:00-20:00 시간 검증)
      - 이미지 URL 입력 UI (이미지형 타입만 표시)
      - 메시지 텍스트 영역 (1000자 제한)
      - SMS 백업 옵션 UI (체크박스, 타입 선택, 메시지 입력)
      - 발송 버튼 및 에러 처리
    - src/components/messages/KakaoMessageContent.tsx 수정
      - FriendtalkTab 컴포넌트 통합
      - 친구톡 탭에 FriendtalkTab 렌더링
      - recipients, selectedSenderNumber props 전달
      - 기존 친구톡 UI 코드 제거 및 정리
  - **빌드 및 컴파일**
    - TypeScript 컴파일 에러 0개 확인
    - unused imports/variables 에러 수정 (HelpCircle, ImageIcon, FileText 등)
    - icon 충돌 수정 (Image → ImageIcon alias)
    - 프로덕션 빌드 성공 (✓ Compiled successfully, 170kB for messages/send)
  - **문서 업데이트**
    - 파일 작업 요약 업데이트 (Phase 7 완료)
    - 수정 대상 파일 목록 완료 상태 반영
    - 작업 순서 Phase 7 완료 표시
    - 테스트 체크리스트 Phase 7 완료 표시
    - 현재 진행률 업데이트 (37/42 파일, 88.1%)
  - **결과**
    - 카카오 친구톡 V2 백엔드 API 완성
    - 카카오 친구톡 V2 프론트엔드 UI 완성 (독립 컴포넌트)
    - 메시지 타입별 발송 기능 (텍스트/이미지/와이드/리스트/캐러셀)
    - 광고형 메시지 시간 제한 기능
    - Phase 0-7 완료 (SMS/LMS/MMS 전환 + 정리 + 알림톡/친구톡 구현)
    - 다음 단계: Phase 8 네이버 톡톡 구현 준비 완료

---

**버전**: 2.1 (현재)
**Phase 0-7 완료율**: 88.1% (37/42 파일)
**남은 작업**: Phase 8-10 (네이버 톡톡/브랜드 메시지/통합 테스트)


**v2.2 (2025-10-28)**:
- ✅ **Phase 8 완료: 네이버 톡톡 구현**
  - **핵심 라이브러리 (1개 수정)**
    - src/lib/mtsApi.ts에 네이버 톡톡 함수 추가
      - getNaverTalkTemplates() - 템플릿 목록 조회
      - sendNaverTalk() - 네이버 톡톡 스마트알림 발송
      - productCode 파라미터 (INFORMATION/BENEFIT/CARDINFO)
      - 버튼 및 이미지 해시 ID 지원
  - **API 엔드포인트 생성 (2개)**
    - /api/naver/templates/route.ts - 템플릿 조회 API
      - JWT 인증 (validateAuthWithSuccess)
      - Query 파라미터: navertalkId, page, count
      - MTS Template API 호출
    - /api/messages/naver/talk/send/route.ts - 네이버 톡톡 발송 API
      - JWT 인증 및 파라미터 검증
      - 다중 수신자 발송 (recipients 배열)
      - 네이버 톡톡 단가: 15원/건
      - message_logs 및 transactions 테이블 자동 저장
      - 잔액 차감 및 발송 결과 추적
  - **UI 컴포넌트 (2개 수정)**
    - src/components/messages/NaverTalkContent.tsx 완전 재작성
      - Recipient 인터페이스 변경 (phoneNumber → phone_number)
      - 네이버톡 ID 입력 필드
      - 템플릿 자동 로딩 (useEffect)
      - 템플릿 선택 드롭다운
      - 상품 코드 선택 (INFORMATION/BENEFIT/CARDINFO)
      - 템플릿 내용 미리보기 및 편집
      - 발송 버튼 및 API 호출
      - 에러 처리 및 성공 메시지 (3초 자동 제거)
    - src/components/messages/MessageSendTab.tsx 수정
      - NaverTalkContent에 recipients, selectedSenderNumber props 전달
  - **빌드 및 컴파일**
    - TypeScript 컴파일 에러 해결
      - authMiddleware 경로 수정 (@/utils/authUtils)
      - Recipient 타입 불일치 해결 (phone_number 통일)
      - userInfo undefined 체크 추가
      - unused parameter 에러 수정
    - TypeScript 컴파일 에러 0개 확인
    - 프로덕션 빌드 성공 (✓ Compiled successfully in 16.0s)
  - **문서 업데이트**
    - 파일 작업 요약 업데이트 (Phase 8 완료)
    - 작업 순서 Phase 8 완료 표시
    - 테스트 체크리스트 Phase 8 완료 표시
    - 현재 진행률 업데이트 (46/47 파일, 97.9%)
  - **결과**
    - 네이버 톡톡 백엔드 API 완성
    - 네이버 톡톡 프론트엔드 UI 완성
    - 템플릿 기반 발송 시스템 구현
    - Phase 0-8 완료 (SMS/LMS/MMS 전환 + 정리 + 카카오 + 네이버 톡톡)
    - 다음 단계: Phase 9 카카오 브랜드 메시지 (선택사항) 또는 Phase 10 통합 테스트

---

**버전**: 2.2 (현재)
**Phase 0-8 완료율**: 97.9% (46/47 파일)
**남은 작업**: Phase 9-10 (브랜드 메시지/통합 테스트) - 선택사항

