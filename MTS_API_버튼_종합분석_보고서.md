# MTS API 버튼 기능 종합 분석 보고서

작성일: 2025-11-10
버전: v2.0 (최종 - 문제 해결 완료)

---

## 📋 목차

1. [문서 분석 개요](#1-문서-분석-개요)
2. [핵심 발견사항](#2-핵심-발견사항)
3. [API별 버튼 형식 비교](#3-api별-버튼-형식-비교)
4. [변수 분리 방식 (Variable Separation)](#4-변수-분리-방식-variable-separation)
5. [버튼 파라미터 상세 분석](#5-버튼-파라미터-상세-분석)
6. [추정 원인 및 해결 방안](#6-추정-원인-및-해결-방안)
7. [추가 테스트 계획](#7-추가-테스트-계획)
8. [MTS 지원팀 문의 내용](#8-mts-지원팀-문의-내용)
9. [🎉 테스트 결과 및 해결](#9-테스트-결과-및-해결-2025-11-10)

---

## 1. 문서 분석 개요

### 1.1 분석 대상 문서

| 문서명 | 버전 | 유형 | 분석 완료 |
|--------|------|------|-----------|
| MTS_카카오브랜드메시지_기본형_전문방식_Restful_Interface_Guide | v1.0 | 발송 API | ✅ |
| 카카오 브랜드메시지 템플릿 API | v1.4 | 비즈 API | ✅ |
| MTS_카카오브랜드메시지_기본형_변수분리방식_Restful_Interface_Guide | v1.1 | 발송 API | ✅ |
| MTS_카카오알림톡_Restful_Interface_Guide | v2.1 | 발송 API | ✅ |

### 1.2 분석 목적

- 브랜드 메시지 버튼 기능 1030 에러 원인 파악
- 템플릿 등록과 발송 API 간 필드명 불일치 확인
- 변수 치환 방식(button_variable) 사용법 확인
- 알림톡과 브랜드 메시지 버튼 형식 차이점 분석

---

## 2. 핵심 발견사항

### 2.1 🔴 치명적 발견: 필드명 불일치

**템플릿 API와 발송 API가 서로 다른 필드명을 사용합니다!**

#### 템플릿 등록 API (비즈 API)
```json
{
  "name": "웹링크 버튼",
  "linkType": "WL",
  "linkMobile": "https://mtsco.co.kr/",
  "linkPc": "https://mtsco.co.kr/"
}
```

#### 발송 API (전문방식)
```json
{
  "name": "웹링크 버튼",
  "type": "WL",
  "url_mobile": "https://www.google.com",
  "url_pc": "https://www.google.com"
}
```

**현재 코드 상태:**
- ✅ 발송 시 `type`, `url_mobile`, `url_pc` 사용 (올바름)
- ⚠️ 템플릿 불러오기 시 `linkType` → `type` 변환 필요

---

### 2.2 🟡 변수 분리 방식 발견

**변수분리방식 v1.1 문서에서 `button_variable` 파라미터를 발견했습니다!**

#### 기존 방식 (전문방식 v1.0)
```json
{
  "attachment": {
    "button": [{
      "name": "자세히보기",
      "type": "WL",
      "url_mobile": "https://www.google.com",
      "url_pc": "https://www.google.com"
    }]
  }
}
```

#### 변수 분리 방식 (v1.1)
```json
{
  "message_variable": {
    "test": "test"
  },
  "button_variable": {
    "link1": "www.mtsco.co.kr"
  }
}
```

**템플릿에서 `#{link1}` 같은 변수를 사용하는 경우, `button_variable` 파라미터로 전달해야 합니다!**

---

### 2.3 🟢 알림톡과의 버튼 형식 비교

**알림톡 API (v2.1)도 동일한 필드명을 사용합니다:**

```json
// 알림톡 버튼 형식
{
  "attachment": {
    "button": [{
      "name": "버튼명",
      "type": "WL",
      "url_mobile": "http://daum.net",
      "url_pc": "http://naver.com"
    }]
  }
}
```

**결론:** 브랜드 메시지와 알림톡의 발송 API 버튼 형식은 동일합니다.

---

## 3. API별 버튼 형식 비교

### 3.1 필드명 매핑표

| 항목 | 템플릿 API | 발송 API (전문방식) | 발송 API (변수분리방식) | 알림톡 API |
|------|------------|---------------------|------------------------|------------|
| 버튼 타입 | `linkType` | `type` | `type` | `type` |
| 모바일 URL | `linkMobile` | `url_mobile` | button_variable 사용 | `url_mobile` |
| PC URL | `linkPc` | `url_pc` | button_variable 사용 | `url_pc` |
| 필수 여부 (url_pc) | 선택 | 선택 (N) | 선택 | 선택 (N) |

### 3.2 버튼 타입별 필수 파라미터

#### WL (웹링크) 타입

**알림톡 API v2.1 기준:**
```
필수: name, type, url_mobile
선택: url_pc
```

**브랜드 메시지 API v1.0 기준:**
```
필수: name, type, url_mobile
선택: url_pc (문서상 "N" = 선택)
```

**결론:** `url_pc`는 선택 필드이므로 생략 가능해야 합니다.

---

## 4. 변수 분리 방식 (Variable Separation)

### 4.1 개요

변수분리방식 v1.1 문서는 **템플릿 변수를 별도 파라미터로 분리하여 전달하는 방식**을 정의합니다.

### 4.2 주요 파라미터

| 파라미터 | 필수 | 설명 | 예시 |
|----------|------|------|------|
| `message_variable` | Y | 메시지 변수 | `{"test":"test"}` |
| `button_variable` | N | 버튼 변수 | `{"link1":"www.mtsco.co.kr"}` |
| `coupon_variable` | N | 쿠폰 변수 | `{"상세내용":"..."}` |
| `image_variable` | N | 이미지 변수 | `[{"img_url":"..."}]` |
| `video_variable` | N | 비디오 변수 | `{"video_url":"..."}` |

### 4.3 button_variable 사용 예시

#### 템플릿 내용 (예상)
```
안녕하세요, #{name}님!
특별 할인 이벤트를 확인하세요.

버튼: 자세히보기 → #{link1}
```

#### 발송 요청
```json
{
  "template_code": "BRAND_001",
  "message_variable": {
    "name": "홍길동"
  },
  "button_variable": {
    "link1": "https://www.mtsco.co.kr/event"
  }
}
```

### 4.4 attachment vs button_variable

**핵심 질문:** 두 가지 방식 중 어느 것을 사용해야 하나?

#### 방식 1: attachment.button (전문방식)
```json
{
  "template_code": "...",
  "message": "메시지 내용",
  "attachment": {
    "button": [{
      "name": "자세히보기",
      "type": "WL",
      "url_mobile": "https://..."
    }]
  }
}
```

#### 방식 2: button_variable (변수분리방식)
```json
{
  "template_code": "...",
  "message_variable": {
    "message": "메시지 내용"
  },
  "button_variable": {
    "link1": "https://..."
  }
}
```

**추정:** 템플릿에 버튼 URL 변수(`#{link1}`)가 있으면 `button_variable` 사용, 없으면 `attachment.button` 사용

---

## 5. 버튼 파라미터 상세 분석

### 5.1 url_pc 필드 처리 방법

**문서 명시사항:**
- 전문방식 v1.0: `url_pc` 필수 여부 "N" (선택)
- 알림톡 v2.1: `url_pc` 필수 여부 "N" (선택)

**테스트 필요:**
1. ✅ `url_pc` 포함 + 동일 URL → 현재 실패 (1030)
2. ⏳ `url_pc` 포함 + 빈 문자열 `""` → 미테스트
3. ⏳ `url_pc` 필드 제거 → 미테스트
4. ⏳ `url_pc` null 값 → 미테스트

### 5.2 버튼 개수 제한

**알림톡 API 기준 (브랜드 메시지도 동일하다고 추정):**

| 메시지 타입 | 최대 버튼 개수 |
|-------------|----------------|
| TEXT | 5개 |
| IMAGE | 5개 |
| WIDE | 2개 |
| WIDE_ITEM_LIST | 2개 |

### 5.3 에러 코드 분석

**현재 발생한 에러:**
- `1030`: InvalidParameterException

**문서상 attachment 관련 에러:**
- `ER33`: AttachmentSizeOverException (attachment 내용이 너무 길거나 큼)

**가능한 원인:**
1. attachment 구조 오류
2. url_pc 필드 처리 문제
3. 템플릿과 발송 버튼 불일치
4. button_variable 파라미터 누락

---

## 6. 추정 원인 및 해결 방안

### 6.1 원인 1: 템플릿에 버튼 변수가 있는데 button_variable 미전달

**증상:**
- 버튼 없는 메시지: 성공 ✅
- 버튼 포함 메시지: 실패 (1030) ❌

**가능한 원인:**
템플릿에 `#{link1}` 같은 버튼 URL 변수가 정의되어 있는데, 발송 시 `button_variable` 파라미터를 전달하지 않고 `attachment.button`만 전달함.

**해결 방안:**
```typescript
// 현재 코드 (src/lib/mtsApi.ts)
const requestBody = {
  attachment: {
    button: [...]
  }
};

// 수정 제안
const requestBody = {
  button_variable: {
    link1: "https://...",
    link2: "https://..."
  }
};
```

---

### 6.2 원인 2: url_pc 필드 처리 문제

**증상:**
`url_pc` 필드를 항상 포함하여 전송 중 (url_mobile과 동일한 값)

**가능한 원인:**
- MTS API가 `url_pc`를 선택 필드로 명시했지만, 실제로는 특정 조건에서 문제 발생
- 빈 문자열 전달 시 에러
- 동일 URL 전달 시 중복으로 판단

**해결 방안:**
```typescript
// 현재 코드
const button = {
  name: "자세히보기",
  type: "WL",
  url_mobile: url,
  url_pc: url  // 항상 포함
};

// 수정 제안 1: url_pc 제거
const button = {
  name: "자세히보기",
  type: "WL",
  url_mobile: url
  // url_pc 생략
};

// 수정 제안 2: url_pc를 url_mobile과 다르게
const button = {
  name: "자세히보기",
  type: "WL",
  url_mobile: url,
  url_pc: url.replace('m.', 'www.')  // 다른 URL
};
```

---

### 6.3 원인 3: 템플릿과 발송 버튼 불일치

**증상:**
템플릿 등록 시 버튼 정보와 발송 시 버튼 정보가 달라서 검증 실패

**가능한 원인:**
- 템플릿에 등록된 버튼: `linkMobile: "https://example.com"`
- 발송 시 전달 버튼: `url_mobile: "https://google.com"`
- URL 불일치로 인한 검증 실패

**해결 방안:**
```typescript
// 템플릿 조회 시 버튼 정보 확인
const template = await getTemplate(templateCode);
const templateButtons = template.buttons;

// 발송 시 템플릿 버튼과 동일한 URL 사용
const requestBody = {
  attachment: {
    button: templateButtons.map(btn => ({
      name: btn.name,
      type: btn.linkType,  // linkType → type 변환
      url_mobile: btn.linkMobile,
      url_pc: btn.linkPc
    }))
  }
};
```

---

### 6.4 원인 4: 템플릿 버튼 등록 자체 문제

**증상:**
템플릿 등록 시 버튼이 올바르게 등록되지 않음

**가능한 원인:**
- 템플릿 등록 API 호출 시 필드명 오류 (`type` 대신 `linkType` 사용해야 함)
- 템플릿 승인 상태 확인 필요

**해결 방안:**
1. 템플릿 상세 조회 API로 버튼 정보 확인
2. 템플릿 재등록 (올바른 필드명 사용)
3. 템플릿 승인 상태 확인

---

## 7. 추가 테스트 계획

### 7.1 우선순위 높은 테스트

#### Test 1: button_variable 파라미터 사용
```json
{
  "template_code": "a8ff71453fac4de5f6876eb1d19bf2d274836389",
  "message_variable": {
    "message": "테스트 메시지"
  },
  "button_variable": {
    "link1": "https://www.mtsco.co.kr"
  }
}
```
**예상 결과:** 성공 (템플릿에 #{link1} 변수가 있는 경우)

---

#### Test 2: url_pc 필드 제거
```json
{
  "attachment": {
    "button": [{
      "name": "자세히보기",
      "type": "WL",
      "url_mobile": "https://www.google.com"
      // url_pc 제거
    }]
  }
}
```
**예상 결과:** 성공 (문서상 선택 필드이므로)

---

#### Test 3: url_pc 빈 문자열
```json
{
  "attachment": {
    "button": [{
      "name": "자세히보기",
      "type": "WL",
      "url_mobile": "https://www.google.com",
      "url_pc": ""
    }]
  }
}
```
**예상 결과:** 실패 (빈 문자열은 유효하지 않음)

---

#### Test 4: 템플릿 버튼 조회 후 동일 정보 전송
```typescript
// 1. 템플릿 조회
const template = await getMtsBrandTemplate(templateCode);

// 2. 템플릿 버튼 정보 그대로 사용
const requestBody = {
  attachment: {
    button: template.buttons.map(btn => ({
      name: btn.name,
      type: btn.linkType || btn.type,
      url_mobile: btn.linkMobile || btn.url_mobile,
      url_pc: btn.linkPc || btn.url_pc
    }))
  }
};
```
**예상 결과:** 성공 (템플릿과 100% 일치)

---

### 7.2 템플릿 재등록 테스트

#### 현재 템플릿 상태 확인
```bash
GET /mts/api/direct/get/template
senderKey: 3916c974ec435ff7a86894ab839b4e8728237435
templateCode: a8ff71453fac4de5f6876eb1d19bf2d274836389
```

#### 버튼 정보 확인 사항
- [ ] 버튼이 등록되어 있는가?
- [ ] 버튼 필드명이 올바른가? (linkType, linkMobile, linkPc)
- [ ] 버튼 URL에 변수가 포함되어 있는가? (#{link1})
- [ ] 템플릿 승인 상태가 정상인가?

---

### 7.3 변수분리방식 전환 테스트

#### 기존 코드 수정
```typescript
// src/lib/mtsApi.ts - sendKakaoBrand() 함수

// 현재 방식 (전문방식)
const requestBody = {
  attachment: {
    button: buttons
  }
};

// 변경 방식 (변수분리방식)
const requestBody = {
  message_variable: {
    // 메시지 변수 추출
  },
  button_variable: {
    // 버튼 URL 변수 추출
    link1: buttons[0]?.url_mobile,
    link2: buttons[1]?.url_mobile,
  }
};
```

---

## 8. MTS 지원팀 문의 내용

### 8.1 긴급 질문 (우선순위 높음)

**Q1. 버튼 포함 TEXT 메시지가 1030 에러를 발생시키는 이유는?**
- 버튼 없으면 성공 (result_code: 1000) ✅
- 버튼 추가하면 실패 (result_code: 1030) ❌
- 버튼 형식은 문서 스펙과 일치함 (type, url_mobile, url_pc)

**Q2. attachment.button vs button_variable 사용 기준은?**
- 템플릿에 버튼 URL 변수(#{link1})가 있으면 `button_variable` 사용?
- 버튼 URL 변수가 없으면 `attachment.button` 사용?
- 두 방식을 혼용할 수 있나요?

**Q3. url_pc 필드 처리 방법은?**
- [ ] 필드 포함 + 동일 URL: 현재 실패 (1030)
- [ ] 필드 포함 + 빈 문자열 "": 가능?
- [ ] 필드 제거: 권장?
- [ ] 필드 포함 + null: 가능?

---

### 8.2 템플릿 관련 질문

**Q4. 템플릿 등록 시와 발송 시 필드명 차이**
- 템플릿 API: `linkType`, `linkMobile`, `linkPc`
- 발송 API: `type`, `url_mobile`, `url_pc`
- 이것이 의도된 설계인가요?
- 자동 변환이 되나요?

**Q5. 템플릿과 발송 버튼 일치 여부**
- 템플릿 등록 시 정의한 버튼 정보와 발송 시 전달하는 버튼 정보가 완벽히 일치해야 하나요?
- URL만 다르게(동적으로) 변경 가능한가요?
- 버튼 name은 정확히 동일해야 하나요?

**Q6. 템플릿 버튼 변수 사용 방법**
- 템플릿에 `#{link1}` 같은 버튼 URL 변수를 사용하는 경우, 발송 시 어떻게 전달해야 하나요?
- `attachment.button`에 직접 URL 전달?
- `button_variable` 파라미터 사용?

---

### 8.3 문서 관련 질문

**Q7. 변수분리방식 사용 권장 여부**
- 전문방식 v1.0과 변수분리방식 v1.1 중 어느 것을 권장하나요?
- 두 방식을 혼용해도 되나요?
- 언제 어떤 방식을 사용해야 하나요?

**Q8. 에러 코드 1030의 상세 원인**
- InvalidParameterException이 발생하는 구체적인 원인은?
- 어떤 파라미터가 잘못되었는지 확인하는 방법은?
- 디버깅을 위한 로그나 상세 에러 메시지는 제공되나요?

---

## 9. 결론 및 권장사항

### 9.1 즉시 시도할 해결 방안

**우선순위 1:** button_variable 파라미터 사용
```typescript
// 변수분리방식으로 전환
const requestBody = {
  message_variable: { ... },
  button_variable: {
    link1: "https://...",
    link2: "https://..."
  }
};
```

**우선순위 2:** url_pc 필드 제거
```typescript
// url_pc 선택 필드이므로 제거 시도
const button = {
  name: "자세히보기",
  type: "WL",
  url_mobile: url
  // url_pc 제거
};
```

**우선순위 3:** 템플릿 버튼 정보 확인 및 동기화
```typescript
// 템플릿 조회 → 버튼 정보 확인 → 동일 정보 전송
const template = await getMtsBrandTemplate(templateCode);
// 템플릿 버튼 정보 그대로 사용
```

---

### 9.2 코드 수정 권장사항

#### 1. 버튼 필드명 변환 함수 추가
```typescript
// src/lib/mtsApi.ts

/**
 * 템플릿 API 버튼 형식을 발송 API 형식으로 변환
 */
function convertTemplateButtonToSendButton(templateButton: any) {
  return {
    name: templateButton.name,
    type: templateButton.linkType || templateButton.type,
    url_mobile: templateButton.linkMobile || templateButton.url_mobile,
    url_pc: templateButton.linkPc || templateButton.url_pc
  };
}
```

#### 2. 변수분리방식 지원 추가
```typescript
// src/lib/mtsApi.ts - sendKakaoBrand() 함수

// 버튼 URL 변수 추출
const buttonVariables: Record<string, string> = {};
attachment?.button?.forEach((btn, idx) => {
  buttonVariables[`link${idx + 1}`] = btn.url_mobile;
});

// button_variable 파라미터 추가
if (Object.keys(buttonVariables).length > 0) {
  requestBody.button_variable = buttonVariables;
  // attachment.button 제거 (중복 방지)
  delete requestBody.attachment?.button;
}
```

#### 3. url_pc 선택적 포함
```typescript
// url_mobile과 url_pc가 다를 때만 url_pc 포함
const button: any = {
  name: btn.name,
  type: btn.type,
  url_mobile: btn.url_mobile
};

if (btn.url_pc && btn.url_pc !== btn.url_mobile) {
  button.url_pc = btn.url_pc;
}
```

---

### 9.3 템플릿 동기화 개선

#### 템플릿 동기화 API 수정
```typescript
// src/app/api/messages/kakao/brand/templates/sync/route.ts

// 템플릿 동기화 시 필드명 변환 추가
const { error: updateError } = await supabase
  .from('kakao_brand_templates')
  .update({
    status: mtsData.status,
    content: mtsData.content,
    chat_bubble_type: mtsData.chatBubbleType,
    // 버튼 정보 저장 시 두 형식 모두 저장
    buttons: mtsData.buttons,
    buttons_normalized: mtsData.buttons?.map((btn: any) => ({
      name: btn.name,
      type: btn.linkType || btn.type,
      url_mobile: btn.linkMobile || btn.url_mobile,
      url_pc: btn.linkPc || btn.url_pc
    })),
    // ...
  });
```

---

### 9.4 MTS 지원팀 답변 대기 사항

| 질문 | 우선순위 | 예상 답변 대기 시간 |
|------|----------|---------------------|
| Q1. 1030 에러 원인 | 긴급 | 1-2일 |
| Q2. button_variable 사용 기준 | 긴급 | 1-2일 |
| Q3. url_pc 처리 방법 | 긴급 | 1-2일 |
| Q4. 필드명 차이 설명 | 보통 | 3-5일 |
| Q5. 템플릿-발송 일치 여부 | 보통 | 3-5일 |

---

## 10. 다음 단계

1. ✅ 문서 분석 완료
2. ⏳ MTS 지원팀 문의 (긴급 질문 3개)
3. ⏳ button_variable 파라미터 테스트
4. ⏳ url_pc 필드 제거 테스트
5. ⏳ 템플릿 버튼 정보 동기화 구현
6. ⏳ 코드 수정 및 재테스트

---

## 부록: 참고 자료

### 문서 위치
- 전문방식 v1.0: `docs/연동규격서md/발송API/MTS_카카오브랜드메시지_기본형_전문방식_Restful_Interface_Guide_v1.0.md`
- 변수분리방식 v1.1: `docs/연동규격서md/발송API/MTS_카카오브랜드메시지_기본형_변수분리방식_Restful_Interface_Guide_v1.1.md`
- 템플릿 API v1.4: `docs/연동규격서md/비즈API/카카오 브랜드메시지 템플릿 API_1.4.md`
- 알림톡 API v2.1: `docs/연동규격서md/발송API/MTS_카카오알림톡_Restful_Interface_Guide_v2.1.md`

### 관련 코드 파일
- [src/lib/mtsApi.ts:1078-1400](src/lib/mtsApi.ts#L1078-L1400) - sendKakaoBrand() 함수 (변수분리방식 v1.1)
- [src/app/api/messages/kakao/brand/send/route.ts](src/app/api/messages/kakao/brand/send/route.ts) - 발송 API
- [src/app/api/messages/kakao/brand/result/route.ts](src/app/api/messages/kakao/brand/result/route.ts) - 결과 조회 API
- [src/app/api/messages/kakao/brand/templates/sync/route.ts](src/app/api/messages/kakao/brand/templates/sync/route.ts) - 템플릿 동기화 API
- [src/components/messages/BrandTab.tsx](src/components/messages/BrandTab.tsx) - UI 컴포넌트

---

## 9. 테스트 결과 및 해결 (2025-11-10)

### 9.1 🎉 문제 해결 완료

**최종 해결 방법: 변수분리방식 v1.1 전환**

기존 "전문방식" 사용 시 `attachment.button` 구조에서 1030 에러가 발생했으나, "변수분리방식 v1.1"로 전환하여 모든 문제 해결.

### 9.2 구현 변경 사항

**파일:** `src/lib/mtsApi.ts` - `sendKakaoBrand()` 함수

**주요 변경:**
1. ❌ **제거:** `attachment.button` 구조 (전문방식)
2. ✅ **추가:** `button_variable`, `image_variable`, `coupon_variable` 등 (변수분리방식)

**변수 분리 방식 구조:**
```typescript
const requestBody = {
  // 기본 파라미터
  auth_code, sender_key, template_code, phone_number, ...

  // 변수 파라미터
  message_variable: { message: "메시지 내용" },
  button_variable: { link1: "url1", link2: "url2" },  // 버튼
  image_variable: [{ img_url: "...", img_link: "..." }],  // 이미지
  coupon_variable: { ... },  // 쿠폰
  commerce_variable: { ... },  // 커머스
  video_variable: { ... },  // 비디오
  carousel_variable: [...]  // 캐러셀
};
```

### 9.3 실제 테스트 결과

#### ✅ Test 1: IMAGE (버튼 없음) - 성공
- **발송 시각:** 17:49:42
- **파라미터:**
  ```json
  {
    "message_type": "IMAGE",
    "message_variable": { "message": "신상품 출시 안내" },
    "image_variable": [{
      "img_url": "https://mud-kage.kakao.com/...",
      "img_link": "https://www.naver.com"
    }]
  }
  ```
- **응답:** code "0000" (MessageRegistComplete)
- **실제 수신:** ✅ 성공

#### ✅ Test 2: TEXT + 버튼 - 성공
- **발송 시각:** 17:51:13
- **파라미터:**
  ```json
  {
    "message_type": "TEXT",
    "message_variable": { "message": "브랜드 메시지 버튼 테스트입니다." },
    "button_variable": { "link1": "https://www.google.com" }
  }
  ```
- **응답:** code "0000" (MessageRegistComplete)
- **실제 수신:** ✅ 성공

#### ✅ Test 3: IMAGE + 버튼 - 성공
- **발송 시각:** 18:03:13
- **파라미터:**
  ```json
  {
    "message_type": "IMAGE",
    "message_variable": { "message": "브랜드 이미지 버튼 테스트" },
    "button_variable": { "link1": "https://www.google.com" },
    "image_variable": [{
      "img_url": "https://mud-kage.kakao.com/...",
      "img_link": "https://www.naver.com"
    }]
  }
  ```
- **응답:** code "0000" (MessageRegistComplete)
- **실제 수신:** ✅ 성공
- **검증:** image_variable + button_variable 동시 사용 정상

#### ✅ Test 4: WIDE + 버튼 - 성공
- **발송 시각:** 18:03:21
- **파라미터:**
  ```json
  {
    "message_type": "WIDE",
    "message_variable": { "message": "브랜드 와이드 버튼 테스트입니다." },
    "button_variable": { "link1": "https://www.naver.com" },
    "image_variable": [{
      "img_url": "https://mud-kage.kakao.com/...",
      "img_link": "https://www.google.com"
    }]
  }
  ```
- **응답:** code "0000" (MessageRegistComplete)
- **실제 수신:** ✅ 성공
- **검증:** WIDE 타입에서도 변수분리방식 정상 작동

### 9.4 결론

**🎉 4가지 테스트 모두 성공 - 1030 에러 완전 해결!**

| 테스트 | 메시지 타입 | 버튼 | 이미지 | 결과 |
|--------|-------------|------|--------|------|
| #1 | IMAGE | ❌ | ✅ | ✅ 성공 |
| #2 | TEXT | ✅ | ❌ | ✅ 성공 |
| #3 | IMAGE | ✅ | ✅ | ✅ 성공 |
| #4 | WIDE | ✅ | ✅ | ✅ 성공 |

**핵심 교훈:**
- ✅ **변수분리방식 v1.1**이 안정적이고 권장되는 방법
- ✅ 버튼, 이미지, 이미지링크 모든 조합 정상 작동
- ✅ 파라미터 검증이 간소화되어 1030 에러 발생 안 함
- ⚠️ 전문방식은 복잡하고 검증 로직 문제 발생 가능

**추후 테스트 필요:**
- 쿠폰 (coupon_variable)
- 커머스 (commerce_variable)
- 비디오 (video_variable)
- 캐러셀 (carousel_variable)

---

**문서 끝**
