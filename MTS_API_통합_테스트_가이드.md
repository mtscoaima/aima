# MTS API 통합 테스트 가이드

> **프로젝트**: MTS Message Portal  
> **작성일**: 2025-10-29  
> **최종 업데이트**: 2025-11-14  
> **버전**: v4.4 (ER17 해결 · 브랜드 신규 4개 타입 실발송 완료)  
> **대상**: QA 엔지니어, 개발자, 프로젝트 관리자  
> **목적**: 채널별(UI → API → DB → 정산 → 실단말) 흐름을 한눈에 정리하고, 남은 검증 항목을 명확히 공유한다.

---

## 1. 테스트 현황 요약 (2025-11-14)

### 1.1 커버된 범위 ✅ **대부분 완료 (95%)**
- UI 플로우: 탭, 템플릿 저장/불러오기, 최근 발송 모달, 이미지 업로드 전 구간 ✅
- API 연동: SMS/LMS/MMS, 카카오 알림톡/친구톡(5개 타입)/브랜드(8개 타입), 네이버 톡톡 ✅
- 데이터 검증: `message_logs`, `transactions`, `kakao_brand_templates`, Supabase Storage 버킷 ✅
- 정산: 채널별 단가(알림톡 13/20원, 친구톡 17/23원, SMS 25원 등) 차감 및 환불 트랜잭션 생성 ✅
- 실 단말 수신: 문자/알림톡/친구톡(전 5개 타입)/브랜드(전 8개 타입) 모두 확인 ✅
- 발신번호 등록: ER17 해결, MTS 시스템 등록 완료 ✅ **← NEW!**

### 1.2 미완료/대기 항목
1. ~~발신번호 등록/변경 API 및 승인 자동화~~ ✅ **완료** (MTS 시스템 등록 완료, ER17 해결)
2. 네이버·카카오 템플릿 검수 자동 모니터링 및 반려 대응.
3. 전송 결과 API 기반 자동 환불(Phase 2) – `rspns/*/rspnsMessages` 주기 호출 필요.
4. 네이버 톡톡 실 단말 수신/버튼 동작 (검수 승인 후 재테스트).

### 1.3 Phase 진행표
| Phase | 범위 | UI | Backend | 테스트 | 주요 메모 |
| --- | --- | --- | --- | --- | --- |
| 1-2 | SMS/LMS/MMS | ✅ | ✅ | ✅ 실메시지 | ✅ **ER15/ER17 모두 해결 완료** |
| 1.5 | 크레딧 환불 | ✅ | ✅ | ⏸ 비동기 결과 대기 | `refundBalance()` 구현 (ER15/ER17/3016/3019) |
| 3 | 카카오 알림톡 | ✅ | ✅ | ✅ 실메시지 | 템플릿 상태 동기화 + SMS 전환 확인 |
| 4 | 친구톡 FT/FI | ✅ | ✅ | ✅ 실메시지 | 이미지 업로드/GIF 제한, SMS 백업 확인 |
| 4.5 | 친구톡 FW/FL/FC | ✅ | ✅ | ✅ 실메시지 | 리스트·캐러셀 이미지 업로드, adFlag 자동화, ER99 Fix |
| 5 | 네이버 톡톡 (예약관리) | ✅ | ✅ | 🟡 API 응답만 확인 | 실 단말/버튼 검증은 검수 승인 후 진행 |
| 6 | 카카오 브랜드 메시지 | ✅ | ✅ | ✅ **8개 타입 전부 실발송 완료** | 변수분리 v1.1, 전 타입 검증 완료 (2025-11-14) |

### 1.4 운영 원칙
1. 모든 시나리오는 **UI 입력 → API 응답 → DB 기록 → 잔액 변동 → 실단말 수신** 순서로 검증한다.
2. 실 발송 시 테스트 번호(010-4057-1331, 010-4057-1332 등)만 사용한다.
3. `metadata.tran_type`, `message_logs.metadata.recipients`, `inspection_status` 등 감사 필드를 확인한다.
4. 장애 재현 시 DevTools Network Log + `result_code` + 템플릿 상태 스크린샷을 동시에 남긴다.

---

## 2. 테스트 목적 · 범위 · 역할

### 2.1 목적
- 채널별 발송 화면과 API가 동일한 규칙을 따르는지 확인.
- 템플릿·버튼·이미지·변수·전환전송이 저장/불러오기/실제 발송 단계에서 일관되게 처리되는지 검증.
- 정산(단가) 및 사후 처리(환불, SMS 백업)가 누락 없이 기록되도록 보장.

### 2.2 범위
- **포함**: UI 플로우, API Request/Response, DB 적재, 크레딧 차감/환불, 이미지 업로드, 템플릿 상태 동기화.
- **제외**: 무제한 실 발송, 외부 검수 자동 승인, 통합 로그 분석 시스템(별도 문서 참조).

### 2.3 역할
| 역할 | 책임 |
| --- | --- |
| QA | 시나리오 작성, 체크리스트 유지, 실 단말 확인, 장애 재현/기록 |
| 프론트엔드 | 탭/모달/폼/이미지 업로드/템플릿 저장 기능 유지 및 Regression 대응 |
| 백엔드 | MTS·카카오·네이버 프록시 API, Supabase Storage 업로드, 정산·환불 로직 |
| PM/PO | 발신번호·템플릿 검수 요청, 외부 권한 확보, 릴리즈 스케줄 관리 |

---

## 3. 환경 및 사전 준비

### 3.1 환경 변수
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MTS_API_BASE_URL=
MTS_API_KEY=
KAKAO_SENDER_KEY=
KAKAO_CHANNEL_ID=
NAVER_TALK_PARTNER_KEY=
```

### 3.2 필수 계정/키
- 카카오 발신프로필(senderKey) & 채널 관리자 계정.
- 네이버 톡톡 파트너키 & 톡톡 ID.
- 테스트 발신번호: 010-4057-1331 / 02-501-1980 (MTS 등록 완료).
- Supabase Storage 버킷: `friendtalk-images`, `kakao-videos` (200MB 이하 mp4 허용).

### 3.3 템플릿 & 데이터
- 알림톡: TEST_INSPECT_001(변수 없음), TEST_VAR_002(#{고객명}, #{날짜}).
- 친구톡: FT/FI/FW/FL/FC 기본 템플릿 각 1개 저장.
- 네이버: 숙박(S001), 예약(T001) 카테고리 템플릿.
- 브랜드: TEXT/IMAGE/WIDE/WIDE_ITEM_LIST/CAROUSEL 템플릿 승인이 완료된 상태.

---

## 4. 공통 테스트 절차
1. **UI 입력** – 템플릿 선택 → 변수 입력 → 이미지/버튼 설정 → targeting 선택 → 잔여 크레딧 확인.
2. **API 응답** – DevTools에서 Request/Response (HTTP 200 + `code: "0000"`) 확인.
3. **DB 기록** – `message_logs`(metadata 포함), `transactions`(단가/환불) 값 확인.
4. **정산 검증** – 단가·tran_type·backup_sent 여부 확인.
5. **실 단말 확인** – 스크린샷/화면 녹화, 버튼·링크·전환전송 동작 확인.

---

## 5. Phase별 핵심 요약

### 5.1 Phase 1-2 · 문자 채널
- 메시지 타입 자동 분기: 이미지 포함 → MMS, 90바이트 초과 → LMS, 그 외 SMS.
- API 엔드포인트: SMS `/sndng/sms/sendMessage`, LMS/MMS `/sndng/mms/sendMessage`.
- 이미지 제한: PNG 업로드 시 JPEG(640×480px, 300KB 이하)로 변환.
- 단가 검증: SMS 25원, LMS 50원, MMS 100원.
- ✅ **오류 대응 완료**: ER15(엔드포인트) 해결, ER17(발신번호 미등록) **MTS 시스템 등록 완료**.

### 5.2 Phase 1.5 · 크레딧 환불
- 함수: `refundBalance(userId, amount, reason, metadata)` (`messageSender.ts:384-426`).
- 대상: ER15, ER17, 3016, 3019 실패 케이스.
- 현재: 즉시 실패 시만 차감 이전 회피 → 환불 없음. 전송결과 API 연동 후 비동기 환불 예정.

### 5.3 Phase 3 · 카카오 알림톡
- 템플릿 동기화: `inspection_status` 컬럼 + 새로고침 버튼.
- 변수 포함 템플릿 (#{고객명} 등) 재검증 완료, 실제 수신 확인.
- 알림톡 실패 → SMS 전환: tran_type, tran_message, backup_sent 저장 확인.

### 5.4 Phase 4/4.5 · 카카오 친구톡
- **FT/FI**: Kakao 전용 이미지 업로드 API, 버튼 타입(WL/AL/BK/MD) 확장, SMS 백업 체크박스 도입.
- **FW**: 76자 본문 + 최대 2버튼, 실 발송 완료.
- **FL**: 헤더+리스트(3~4), 아이템별 2:1 이미지 업로드, 광고 전용(adFlag='Y') 자동 세팅, ER99 해결.
- **FC**: 2~6 캐러셀 카드, 카드별 이미지/버튼/moreLink, 실제 발송 완료.
- 공통: 템플릿 저장/불러오기, 최근 발송 내역 재사용, Hidden input 기반 업로드 UX.

### 5.5 Phase 5 · 네이버 톡톡(예약관리)
- 템플릿 생성/조회/발송/수신자별 변수 UI 구현 및 API 검증.
- TemplateVariableInputModal 로 공통/개별 변수 관리.
- 버튼(APP_LINK, WEB_LINK) payload 전송은 확인, 실제 클릭 검증은 검수 승인 후 진행 예정.

### 5.6 Phase 6 · 카카오 브랜드 메시지 ✅ **완전 완료 (2025-11-14)**
- 변수분리 방식 v1.1 사용, `message_variable` · `button_variable` · `image_variable` · `coupon_variable` 등 구성.
- 구현 위치: `src/lib/mtsApi.ts (sendKakaoBrand)`.
- ✅ **실 발송 완료 (전 8개 타입)**:
  - TEXT, IMAGE(+버튼), WIDE(+버튼), WIDE_ITEM_LIST
  - **PREMIUM_VIDEO, COMMERCE, CAROUSEL_FEED, CAROUSEL_COMMERCE** ← 모두 실제 발송 및 수신 확인 완료
- DB 마이그레이션: `kakao_brand_templates` 필드 추가, Supabase `kakao-videos` 버킷 생성.
- 모든 타입에 대한 템플릿 검수 승인 및 실단말 수신 검증 완료.

---

## 6. 현재 시스템 구성

### 6.1 프론트엔드 구성요소
| 파일 | 역할 |
| --- | --- |
| `BrandTab.tsx` | 문자/브랜드 공통 발송 탭, targeting·SMS 백업·변수 치환 로직 포함 |
| `FriendtalkTab.tsx` | FT/FI/FW/FL/FC UI + 이미지 업로드 + 버튼 모달 + 템플릿 저장 |
| `KakaoBrandTab.tsx` | 브랜드/네이버 템플릿 조회, inspection 상태 표시, 369라인 리팩터링 |
| `SimpleContentSaveModal` / `SimpleContentLoadModal` | 템플릿 저장/불러오기 |
| `LoadContentModal` | 최근 발송 내역 로딩 (message_logs.metadata) |
| `TemplateVariableInputModal` | 네이버/브랜드 변수 편집 (공통 + 수신자별) |

### 6.2 백엔드/API
- `/api/messages/kakao/friendtalk/send`: 타입별 payload 조립, adFlag·tran_type 처리.
- `/api/messages/kakao/upload-image`, `/upload-video`: Supabase Storage 업로드.
- `/api/messages/naver/templates/*`, `/api/messages/naver/send`: 톡톡 템플릿/발송 프록시.
- `/api/messages/kakao/brand/send`: 변수분리 방식 파라미터 구성.

### 6.3 데이터 & 스토리지
- `message_logs.metadata`: recipients, targeting, buttons, backup_sent 등 JSONB 저장.
- `transactions`: 단가, 환불, tran_type, reason code 기록.
- `kakao_brand_templates`: message/button/image/carousel 변수 필드 추가.
- Supabase Storage: `friendtalk-images`(2:1, 1:1) / `kakao-videos`(200MB 이하).

### 6.4 모니터링 포인트
- `inspection_status`: REG/PENDING/APR/REJ 배지 색상으로 표시.
- `adFlag`, `targeting`, `tran_type`: 체크리스트와 최근 발송 모달에서 확인.
- 오류 로그: DevTools Network + `result_code` + 템플릿 상태 스크린샷.

---

## 7. 예약 관리 (네이버 톡톡)

### 7.1 카테고리 & 상태
- **숙박(S)**: S001(예약완료), S002(예약취소), S003(바우처발송), S004(결제요청).
- **예약(T)**: T001(예약완료), T002(예약취소), T003(바우처발송), T004(결제요청).
- 템플릿 기본 구성: 본문 `#{name}`, `#{date}` 변수 + “예약 확인하기” 버튼.

### 7.2 템플릿 생성 플로우
1. 파트너키·카테고리 코드(S001 등) 선택.
2. 템플릿 코드(영문+숫자), 상품 코드(INFORMATION/BENEFIT/CARDINFO) 입력.
3. 본문/버튼/이미지 작성(선택), `#{변수명}` 패턴 사용.
4. `POST /api/messages/naver/templates/create` 호출.
5. 상태: 생성 → 검수요청 → 승인(APR) / 반려(REJ) / 취소(CAN).

### 7.3 템플릿 조회/동기화
- 발신 ID 선택 시 템플릿 자동 로딩 + 미리보기 표시.
- `inspection_status` 기준 REG(대기), APR(승인), REJ(반려) 배지.
- 새로고침 버튼으로 MTS 상태 동기화 (`sync=true`).

### 7.4 메시지 발송 (공통 변수)
- 템플릿 선택 → 카테고리/상품 자동 설정.
- 추출된 변수 목록에 공통 값 입력 → `templateParams` + `recipientList` 로 전송.
- `message_logs`, `transactions` 에 정보성 13원/광고 20원 차감 기록 확인.

### 7.5 수신자별 변수 치환
- “고급 설정” 클릭 → TemplateVariableInputModal.
- Excel 스타일 표에 전화번호 + 변수 입력, 빈 값은 전송 제외.
- 저장 시 `recipients[].variables` 구조로 변환 후 API 호출.

### 7.6 버튼/액션
- `attachments.buttons`: WEB_LINK(pcUrl, mobileUrl), APP_LINK(iOsAppScheme, aOsAppScheme).
- 기본 CTA: “예약 확인하기”. 필요 시 추가 버튼 등록 가능.
- 실제 클릭 검증은 검수 승인 후 재테스트.

### 7.7 샘플 페이로드
```javascript
await fetch('/api/messages/naver/templates/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  },
  body: JSON.stringify({
    partnerKey,
    code: 'S001_BOOKING_DONE',
    categoryCode: 'S001',
    productCode: 'INFORMATION',
    text: '[테스트] #{name}님, 예약이 완료되었습니다.\n예약일시: #{date}\n감사합니다.',
    buttons: [{
      name: '예약 확인하기',
      type: 'WEB_LINK',
      mobileUrl: 'https://m.booking.com',
      pcUrl: 'https://booking.com'
    }]
  })
});
```

### 7.8 추가 체크 항목
- ⏸ 검수 승인 후 실 단말/버튼 클릭 확인.
- ⏸ S003~T004 카테고리 템플릿 확대.
- ⏸ 템플릿 취소/삭제 API 예외 처리 시나리오.
- ⏸ `{{예약시스템변수}}` + `#{일반변수}` 혼합 케이스 재검증.

---

## 8. 카카오 브랜드 메시지 (Phase 6)

### 8.1 변수 구조 (v1.1)
```json
{
  "auth_code": "...",
  "sender_key": "...",
  "message_type": "WIDE_ITEM_LIST",
  "targeting": "M",
  "template_code": "A001",
  "message_variable": {"message": "본문"},
  "button_variable": {"link1": "https://..."},
  "image_variable": [{"img_url": "https://...", "img_link": "https://..."}],
  "coupon_variable": {"할인금액": "5000"},
  "commerce_variable": {"정상가격": "1000", "할인가": "700"},
  "carousel_variable": [ ... ],
  "add_etc1": "캠페인ID",
  "tran_type": "S|L|N",
  "callback_url": "https://customer/callback"
}
```

### 8.2 구현 포인트
- `sendKakaoBrand()` (`src/lib/mtsApi.ts`)에서 타입별 필수 필드를 분기하여 JSON 작성.
- 이미지/비디오 업로드: Supabase `kakao-videos` 버킷 사용, 200MB 제한.
- 템플릿 데이터: `kakao_brand_templates` 테이블에 message/button/image/carousel 필드를 저장.
- targeting: `M`(수신 동의), `N`(수신 동의 + 채널 친구), `I`(전체 + 친구) – 설명 문구 UI에 표시.
- SMS 백업: 45자 이하 자동 SMS, 1000자 이하 LMS(제목 필요), 초과 MMS.

### 8.3 테스트 체크리스트 ✅ **전 타입 완료 (2025-11-14)**
| 타입 | 상태 | 비고 |
| --- | --- | --- |
| TEXT | ✅ | 버튼/쿠폰 변수 포함 발송 확인 |
| IMAGE | ✅ | 2:1 이미지 업로드 + 링크 |
| WIDE | ✅ | 76자 제한, imageLink |
| WIDE_ITEM_LIST | ✅ | 첫 카드 확대 노출, 이미지 업로드 API `/upload-wide-item-image` |
| PREMIUM_VIDEO | ✅ | **실발송 완료** - 비디오/썸네일 업로드, kakao-videos 버킷, 실단말 수신 확인 |
| COMMERCE | ✅ | **실발송 완료** - 상품명/가격/쿠폰 필드, commerce 객체 구조, 실단말 수신 확인 |
| CAROUSEL_FEED | ✅ | **실발송 완료** - 카드별 이미지/버튼 구성, list 중첩 구조, 실단말 수신 확인 |
| CAROUSEL_COMMERCE | ✅ | **실발송 완료** - CAROUSEL_FEED + commerce 객체 조합, 실단말 수신 확인 |

### 8.4 장애/오류 대응
| result_code | 원인 | 대응 |
| --- | --- | --- |
| 3020 | 수신자 차단 | 다른 테스트 번호 사용 |
| 3022 | 시간 제한(08~20시 외) | 발송 시간 조정 |
| 3016 | 템플릿 내용 불일치 | 템플릿/변수 동기화 |
| 4000 | 결과 지연 | 5분 추가 대기 후 재조회 |
| ER99 | payload 오류 | 타입별 필수 필드 확인 (예: FL message 제거) |

---

## 9. 공통 체크리스트 & 오류 대응

### 9.1 발송 전
- [ ] 템플릿 최신 상태 동기화 (inspection_status).
- [ ] targeting·tran_type·adFlag UI 설명 노출.
- [ ] 이미지 용량/비율 안내(친구톡 2:1, 브랜드 1:1/2:1 등).
- [ ] SMS 백업 타입 자동 판별 값 확인.

### 9.2 발송 후
- [ ] message_logs.metadata에 recipients/targeting/backup_sent 기록 확인.
- [ ] transactions에 단가/환불 정보 확인.
- [ ] Supabase Storage 업로드 성공/삭제 여부 확인.
- [ ] 실 단말 수신 스크린샷 확보.

### 9.3 오류 코드 표 (공통)
| 코드 | 설명 | 조치 |
| --- | --- | --- |
| ER15 | 잘못된 엔드포인트 | SMS/LMS/MMS API 분리 확인 |
| ER17 | 미등록 발신번호 | MTS 고객센터에 번호 등록 요청 |
| 1028 | targeting 미지원 | targeting 옵션 재설정(M/N/I) |
| 잔액부족 | 크레딧 부족 | 충전 후 재시도 |
| 시간제한 | 08~20시 외 요청 | 허용 시간대 재전송 |

---

## 10. 향후 계획

### ✅ 완료된 항목 (2025-11-14)
1. ~~**발신번호 등록**~~ → ✅ MTS 시스템 등록 완료, ER17 해결
2. ~~**카카오 브랜드 전체 타입 실발송**~~ → ✅ 8개 타입 전부 실발송 및 수신 검증 완료

### ⏸️ 진행 중/대기 항목
1. **전송 결과 API 연동** – 5분 주기 polling → 실패 건 자동 환불 → delivery_status 컬럼 추가.
2. **템플릿 검수 자동화** – MTS/네이버 상태 웹훅 또는 스케줄러 도입.
3. **네이버 실 발송** – 검수 승인 완료 시 버튼/수신자별 변수 리그레션 테스트.
4. **문서 자동화** – 테스트 이력(스크린샷·로그) 링크화, 체크리스트 Notion 연동.
5. **성능 최적화** – 대량 발송 시나리오 부하 테스트, 병렬 처리 개선.

### 📊 Phase별 완료율 (2025-11-14 기준)
- Phase 1-2 (SMS/LMS/MMS): **100%** ✅
- Phase 1.5 (크레딧 환불): **80%** (비동기 환불 대기)
- Phase 3 (알림톡): **100%** ✅
- Phase 4 (친구톡 FT/FI): **100%** ✅
- Phase 4.5 (친구톡 FW/FL/FC): **100%** ✅
- Phase 5 (네이버 톡톡): **90%** (실단말 검증 대기)
- Phase 6 (브랜드 메시지): **100%** ✅ **← NEW!**

**전체 완료율**: ~95% (6개 Phase 중 5개 완전 완료, 1개 대부분 완료)

> 문의/업데이트: QA 슬랙 `#mts-api-qa` 또는 PM에게 공유.
