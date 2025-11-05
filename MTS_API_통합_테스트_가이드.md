# MTS API 통합 테스트 가이드

> **프로젝트**: MTS Message Portal
> **작성일**: 2025-10-29
> **최종 업데이트**: 2025-11-05
> **버전**: v2.9 (Phase 4 친구톡 완전 완료)
> **목적**: MTS API 전환 후 전체 기능 통합 테스트 가이드
> **대상**: QA 팀, 개발자, 프로젝트 관리자

---

## 🚨 현재 테스트 현황 (2025-11-05 실시간 업데이트)

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

### 📊 테스트 진행 상태 (v2.8 - 2025-11-05 기준)
- ✅ **Phase 1-2**: SMS/LMS/MMS (테스트 완료 - 모두 성공!)
  - ✅ SMS 발송 + 변수 치환 (#{이름})
  - ✅ LMS 발송 + 변수 치환 (#{이름}, #{오늘날짜}, #{회사명})
  - ✅ MMS 이미지 업로드 + 발송
  - ✅ 실제 메시지 수신 확인
  - ✅ 템플릿 저장/불러오기 (모달 방식)
  - ✅ 최근발송 불러오기 (모달 방식)
- ✅ **Phase 1.5**: 크레딧 환불 로직 (코드 검증 완료)
- ✅ **Phase 3**: 카카오 알림톡 (완료 - 변수 치환 추후 확인)
  - ✅ 템플릿 조회 기능 정상 작동
  - ✅ 변수 없는 템플릿 발송 성공 및 수신 확인 (TEST_INSPECT_001)
  - ✅ `inspection_status` 필드 추가 및 UI 업데이트 완료
  - ✅ 템플릿 상태 표시 개선 (승인됨 ✅, 등록됨, 검수중 ⏳, 반려됨 ❌)
  - ⏸️ 변수 포함 템플릿 테스트 보류 (템플릿 승인 대기 중)
  - **참고**: 알림톡 템플릿은 클라이언트에서 변수 치환하지 않음 (MTS API가 서버에서 처리)
- ✅ **Phase 4**: 카카오 친구톡 (완료)
  - ✅ 텍스트형 친구톡 (FT) 완벽 작동 + 변수 치환 성공
  - ✅ 이미지형 친구톡 (FI) 완료!
    - ✅ Kakao 전용 이미지 업로드 API 구현 완료
    - ✅ 이미지 + 문구 전송 성공
    - ✅ 실제 메시지 수신 확인
    - ✅ 이미지 규격 안내 문구 추가 (2:1 비율)
  - ✅ 버튼 기능 (WL 타입) 완료
  - ✅ 템플릿 저장/불러오기 완료
  - ✅ 최근발송 불러오기 완료
  - ❌ 미구현 기능: AL/BK 등 추가 버튼 타입, 와이드형(FW), 캐러셀(FC)
- ❌ **Phase 5**: 네이버 톡톡 (미테스트)
  - UI 구현 완료
  - 백엔드 API 준비 완료
  - 실제 발송 테스트 필요
- ⏸️ **Phase 6**: 카카오 브랜드 메시지 (스켈레톤 UI만 존재, 백엔드 준비 완료)

> ✅ **최신 업데이트 (2025-11-05)**: Phase 4 완전 완료! 🎉
> - ✅ Phase 3 알림톡 완료 (변수 치환 제외)
> - ✅ Phase 4 카카오 친구톡 완전 완료
>   - ✅ Phase 4.1 텍스트형 친구톡 (FT) + 변수 치환
>   - ✅ Phase 4.2 이미지형 친구톡 (FI) 완료
>     - **이슈 발견**: MTS 서버 이미지를 Kakao 서버에서 접근 불가
>     - **해결 완료**: Kakao 전용 이미지 업로드 API 구현
>     - **테스트 성공**: 이미지 + 문구 전송 및 수신 확인
>     - **UI 개선**: 2:1 비율 안내 문구 추가
>   - ✅ Phase 4.3 친구톡 버튼/템플릿/최근발송 완료
>     - **DB 마이그레이션**: `sms_message_templates` 테이블 확장 (message_type, buttons, image_url, image_link)
>     - **버튼 기능**: WL (웹링크) 타입 버튼 추가/편집/삭제 (최대 5개, 14자 제한, URL 검증)
>     - **템플릿 시스템**: SMS 모달 재사용 (messageType 필터링)
>     - **최근발송**: metadata JSONB 활용

---

## 📊 전체 구현 현황 매트릭스 (v2.9 - 2025-11-05)

### 기능별 구현 상태

| Phase | 기능 | UI | Backend | 테스트 | 상태 |
|-------|------|-----|---------|--------|------|
| **Phase 1-2** | SMS/LMS/MMS | ✅ | ✅ | ✅ | **완료** |
| | 템플릿 저장/불러오기 | ✅ | ✅ | ✅ | **완료** |
| | 최근발송 불러오기 | ✅ | ✅ | ✅ | **완료** |
| | 변수 치환 | ✅ | ✅ | ✅ | **완료** |
| **Phase 3** | 알림톡 발송 | ✅ | ✅ | ✅ | **완료** |
| | 템플릿 조회/선택 | ✅ | ✅ | ✅ | **완료** |
| | 변수 치환 | ✅ | ✅ | ⏸️ | **보류** (템플릿 승인 대기) |
| **Phase 4** | 친구톡 FT (텍스트) | ✅ | ✅ | ✅ | **완료** |
| | 친구톡 FI (이미지) | ✅ | ✅ | ✅ | **완료** |
| | 변수 치환 | ✅ | ✅ | ✅ | **완료** |
| | **버튼 기능 (WL 타입)** | ✅ | ✅ | ✅ | **완료** |
| | **템플릿 저장/불러오기** | ✅ | ✅ | ✅ | **완료** |
| | **최근발송 불러오기** | ✅ | ✅ | ✅ | **완료** |
| | 와이드형 (FW) | ❌ | ✅ | ❌ | **미구현** (UI만) |
| | 캐러셀 (FC) | ❌ | ✅ | ❌ | **미구현** (UI만) |
| | AL/BK 등 추가 버튼 타입 | ❌ | ✅ | ❌ | **미구현** (UI만) |
| **Phase 5** | 네이버 톡톡 발송 | ✅ | ✅ | ❌ | **미테스트** |
| | 템플릿 조회/선택 | ✅ | ✅ | ❌ | **미테스트** |
| | 변수 치환 | ✅ | ✅ | ❌ | **미테스트** |
| **Phase 6** | 브랜드 메시지 발송 | ✅ | ✅ | ❌ | **미테스트** (권한 필요) |
| | 템플릿 조회/선택 | ✅ | ✅ | ❌ | **미테스트** (권한 필요) |

### 상태 범례
- ✅ **완료**: 구현 및 테스트 완료
- 🔶 **부분 완료**: 일부 구현됨
- ❌ **미구현**: 구현되지 않음
- ⏸️ **보류**: 외부 요인으로 대기 중

### Phase 4 구현 완료 세부사항 (2025-11-05)

#### ✅ 1. 버튼 기능 (WL 타입)
**구현 파일**: `FriendtalkButtonModal.tsx` (신규, 243 lines)
- **기능**:
  - WL (웹링크) 타입 버튼 추가/편집/삭제
  - 최대 5개 버튼 지원
  - 버튼명 14자 제한 및 실시간 검증
  - 모바일 URL 필수, PC URL 선택
  - URL 형식 검증 (try/catch new URL)
- **UI**: 모달 방식, 버튼별 개별 삭제 기능
- **백엔드 지원**: `mtsApi.ts` Line 626-628에서 buttons 파라미터 처리
- **테스트 완료**: 버튼 추가/삭제/수정 모두 정상 작동

#### ✅ 2. 템플릿 저장/불러오기
**구현 파일**:
- `SimpleContentSaveModal.tsx` (확장, Line 65-68)
- `LoadContentModal.tsx` (확장, Line 74, 162-164)
- `migrations/20250205_extend_sms_templates_for_friendtalk.sql` (신규)
- `/api/sms-templates/route.ts` (확장, Line 23, 70-73, 94-97)

**변경 사항**:
1. **DB 마이그레이션**: `sms_message_templates` 테이블 확장
   - `message_type VARCHAR(20) DEFAULT 'SMS'`
   - `buttons JSONB`
   - `image_url TEXT`
   - `image_link TEXT`
   - 인덱스: `idx_sms_templates_message_type`, `idx_sms_templates_user_type`

2. **API 확장**:
   - GET: `?messageType=FRIENDTALK` 쿼리 파라미터 지원
   - POST: messageType, buttons, imageUrl, imageLink 필드 저장

3. **모달 확장**:
   - `SimpleContentSaveModal`: messageType, buttons, imageUrl, imageLink 전달
   - `LoadContentModal`: messageTypeFilter prop 추가, 친구톡 메타데이터 반환

- **테스트 완료**: SMS 템플릿과 분리하여 친구톡 전용 템플릿 저장/불러오기 정상 작동

#### ✅ 3. 최근발송 불러오기
**구현 파일**: `LoadContentModal.tsx` (Line 176-178)
- **DB 활용**: `message_logs.metadata` JSONB 컬럼
- **반환 데이터**:
  - `metadata.buttons`: 버튼 배열
  - `metadata.image_urls[0]`: 이미지 URL
  - `metadata.image_link`: 이미지 클릭 링크
- **UI**: "최근발송" 탭에서 친구톡 발송 이력 조회 및 재사용
- **테스트 완료**: 최근 발송한 친구톡 메시지 불러오기 정상 작동

#### ✅ 4. FriendtalkTab 통합
**파일**: `FriendtalkTab.tsx` (527 lines → 804 lines, +277 lines)
- **상태 관리**: buttons, isSaveModalOpen, isLoadModalOpen, isButtonModalOpen 추가
- **핸들러**: handleSavedContentClick, handleRecentSentClick 구현
- **UI 업데이트**:
  - Line 519: 저장 버튼 연결
  - Line 634-677: 버튼 섹션 UI (추가/삭제 기능)
  - Line 749-799: 3개 모달 렌더링
- **테스트 완료**: 모든 기능 통합 및 정상 작동 확인

---

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

### 📋 테스트 결과 요약

| 메시지 타입 | 조건 | 단가 | 결과 | 비고 |
|------------|-----|-----|------|------|
| **SMS** | 90바이트 이하 | 25원 | ✅ 성공 | 변수 치환 포함 |
| **LMS** | 90바이트 초과 | 50원 | ✅ 성공 | subject 자동 추가 |
| **MMS** | 이미지 포함 | 100원 | ✅ 성공 | PNG→JPEG 최적화 |

### 🔍 주요 기술 사항

**핵심 로직:**
- 메시지 타입 자동 판단 (이미지 → MMS, 90바이트 초과 → LMS, 그 외 → SMS)
- API 엔드포인트 자동 선택 (SMS: `/sndng/sms/sendMessage`, LMS/MMS: `/sndng/mms/sendMessage`)
- 이미지 최적화 (PNG → JPEG, 640×480px, 300KB 이하)
- 변수 치환 지원 (#{변수명} 형식)

### ⚠️ 주요 이슈 및 해결

| 이슈 | 원인 | 해결 방법 | 상태 |
|-----|------|----------|------|
| **ER15** | 잘못된 엔드포인트 사용 | 메시지 타입별 엔드포인트 분리 | ✅ 해결 완료 |
| **ER17** | 미등록 발신번호 | MTS에 발신번호 등록 필요 | ⏸️ 외부 요청 중 |

**참고:** ER17은 MTS 설정 문제이며, 코드 구현과 무관. API 호출/DB 저장/잔액 차감은 정상 작동.

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

**3.5 템플릿 상태 관리 시스템 구현 완료** ✅
- [x] DB 스키마 업데이트 (inspection_status 컬럼 추가) ✅
- [x] MTS API 응답 파싱 수정 (responseData.data.inspectionStatus) ✅
- [x] 템플릿 동기화 API 개선 (sync=true 파라미터 지원) ✅
- [x] UI 상태 표시 업데이트 ✅
  - [x] src/components/messages/kakao/KakaoAlimtalkTab.tsx (템플릿 관리 페이지)
  - [x] src/components/messages/AlimtalkTab.tsx (메시지 발송 페이지)
- [x] 템플릿 생성 시 inspection_status 초기화 (REG) ✅
- [x] 새로고침 버튼 추가 (수동 동기화 지원) ✅

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

**에러 코드 로깅:**
- [x] DB metadata에 error_code 저장 확인 ✅
- [x] 주요 에러: 3016(템플릿불일치), 3019(톡유저아님), ER17(미등록발신번호) ✅

### 📋 추가 검증 필요 항목

- [ ] 변수 포함 템플릿 발송 (템플릿 승인 후)
- [ ] 알림톡 → SMS 전환 발송 테스트
- [ ] 3016 에러 (템플릿 불일치) 처리 확인

---

## Phase 4: 카카오 친구톡

### 📌 사전 조건
- [ ] 카카오 발신프로필 등록 완료
- [ ] 친구톡 발송 권한 획득

### 🔧 구현 완료 기능 (v2.7 - 2025-11-05)
- ✅ **메시지 타입 자동 감지**: 이미지 첨부 여부에 따라 FT/FI 자동 선택
- ✅ **Kakao 전용 이미지 업로드**: `/api/messages/kakao/upload-image` (2:1 비율 자동 조정)
- ✅ **이미지 미리보기**: 썸네일, 파일명, 파일 크기 표시
- ✅ **이미지 규격 안내**: 2:1 비율, 500KB 제한 UI 안내
- ✅ **변수 치환**: #{이름}, #{날짜} 등 SMS 호환 변수 시스템
- ✅ **실제 메시지 수신**: FT, FI 모두 테스트 완료

### ❌ 미구현 기능
- **버튼 기능**: 백엔드 지원 완료, UI는 placeholder만 존재 (Line 621-634)
  - `onClick={() => alert("친구톡 버튼 기능은 추후 구현 예정입니다.")}`
- **템플릿 저장/불러오기**: SMS만 지원, 친구톡은 미지원
- **최근발송 불러오기**: placeholder만 존재 (Line 513-518)
- **와이드형(FW), 캐러셀(FC)**: 백엔드 지원, UI 없음
- **광고형 시간 제한**: 로직 없음 (08:00-20:00 검증 미구현)

### 📋 Phase 4 테스트 체크리스트 (2025-11-05 업데이트)

**4.1 텍스트형 친구톡 (자동 감지 - FT)** ✅ 완료
- [x] 메시지 내용 입력 (이미지 없음 → 자동으로 FT 선택) ✅
- [x] 광고 여부 선택 (N - 비광고) ✅
- [x] 변수 치환 테스트 (#{이름}, #{날짜}) ✅
- [x] 발송 버튼 클릭 ✅
- [x] MTS API 응답 코드 확인 (code: "0000") ✅
- [x] DB 저장 확인 ✅
- [x] 잔액 20원 차감 확인 ✅
- [x] 실제 메시지 수신 확인 ✅
- [x] Console.log에서 "[친구톡] 메시지 타입 자동 감지: FT (텍스트형)" 확인 ✅

**4.2 이미지형 친구톡 (FI)** ✅ 완료
- [x] 이미지 업로드 및 미리보기 ✅
- [x] Kakao 전용 이미지 업로드 API 구현 ✅
- [x] 2:1 비율 자동 조정 ✅
- [x] 변수 치환 포함 발송 ✅
- [x] 실제 메시지 수신 확인 ✅

**4.3 버튼/템플릿/최근발송** ✅ 완료
- [x] WL (웹링크) 버튼 추가/편집/삭제 (최대 5개, 14자 제한) ✅
- [x] 템플릿 저장/불러오기 (SMS 모달 재사용, messageType 필터링) ✅
- [x] 최근발송 불러오기 (metadata JSONB 활용) ✅
- [x] DB 마이그레이션 완료 (sms_message_templates 테이블 확장) ✅

### 🔍 주요 이슈 해결

**이슈: 이미지형 친구톡 미수신**
- **문제**: MTS 서버 이미지를 Kakao 서버에서 접근 불가
- **해결**: Kakao 전용 이미지 업로드 API 구현 (`/api/messages/kakao/upload-image`)
- **결과**: Kakao 서버 URL 사용으로 정상 수신 ✅
- **규격**: 2:1 비율, 500px 이상, 500KB 이하

### 📋 추가 검증 필요 항목

- [ ] AL/BK 등 추가 버튼 타입 구현 (백엔드 준비됨)
- [ ] 와이드형 (FW) 발송 테스트 (백엔드 준비됨)
- [ ] 캐러셀 (FC) 발송 테스트 (백엔드 준비됨)
- [ ] 광고형 시간 제한 (08:00-20:00) 로직 구현
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

### 🔧 구현 현황 (v2.8 - 2025-11-05)
- ✅ **UI 구현 완료**: BrandTab.tsx 전체 구조 완성 (579줄)
- ✅ **템플릿 조회**: fetchBrandTemplates() 함수 구현 완료
- ✅ **백엔드 API**: `/api/messages/kakao/brand/send` 준비 완료
- ✅ **8가지 메시지 타입 지원**: TEXT, IMAGE, WIDE, WIDE_ITEM_LIST, CAROUSEL_FEED, COMMERCE, CAROUSEL_COMMERCE, PREMIUM_VIDEO
- ⚠️ **테스트 필요**: 실제 브랜드 메시지 템플릿 등록 및 발송 테스트 미진행
- ⚠️ **권한 필요**: 카카오 브랜드 메시지 권한 미획득 상태

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

### Phase 4: 카카오 친구톡 🔶 부분 완료 (2025-11-05)

**✅ 완료된 기능:**
- [x] 텍스트형 (FT) - 비광고 ✅
- [x] 이미지형 (FI) - Kakao 이미지 업로드 + 변수 치환 ✅
- [x] 치환문구 버튼 동작 확인 ✅
- [x] 이미지 규격 안내 문구 (2:1 비율) ✅
- [x] 잔액 20원 차감 확인 ✅
- [x] MTS API 응답 성공 (code: "0000") ✅
- [x] 실제 메시지 수신 확인 (FT, FI 모두) ✅
- [x] Kakao 전용 이미지 업로드 API 구현 ✅

**❌ 미구현 (백엔드 지원, UI 없음):**
- [ ] 버튼 기능 (WL, AL, BK, MD 등)
- [ ] 템플릿 저장/불러오기
- [ ] 최근발송 불러오기
- [ ] 이미지 클릭 링크 (imageLink)
- [ ] 와이드형 (FW)
- [ ] 캐러셀 (FC)
- [ ] 광고형 시간 제한 (08:00-20:00)

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

### Phase 3: 카카오 알림톡 (완료 - 변수 치환 제외)
```
테스트 일시: 2025-11-05
테스터: Claude + User
결과: [x] 성공 (변수 없는 템플릿 완료, 변수 포함 템플릿 승인 대기 중)

주요 성과:
- ✅ 템플릿 조회 기능 정상 작동
- ✅ TEST_INSPECT_001 템플릿 발송 성공 (실제 수신 확인)
- ✅ inspection_status 필드 추가 및 동기화 로직 구현
- ✅ 템플릿 상태 표시 시스템 구축
  - APR (승인됨 ✅)
  - REG (등록됨)
  - REQ (검수중 ⏳)
  - REJ (반려됨 ❌)
  - S (중지됨 ⛔)
- ✅ DB 스키마 업데이트 (inspection_status 컬럼 추가)
- ✅ MTS API 응답 파싱 개선 (responseData.data.inspectionStatus)
- ✅ 템플릿 동기화 API 개선 (sync=true 파라미터)
- ✅ 새로고침 버튼 추가 (수동 동기화)
- ✅ UI 업데이트 (메시지 발송 페이지 + 템플릿 관리 페이지)

보류 항목:
- ⏸️ TEST_VAR_002 (변수 포함 템플릿) - 승인 대기 중
- ⏸️ 변수 치환 기능 테스트 - 템플릿 승인 후 재테스트 예정

참고사항:
- 알림톡 변수 치환은 MTS API가 서버에서 처리 (클라이언트 치환 불필요)
- 클라이언트는 #{변수명} 형태로 그대로 전송
```

### Phase 4: 카카오 친구톡 (완료 - 2025-11-05)
```
테스트 일시: 2025-11-05
테스터: Claude + User
결과: [x] 성공 ✅

주요 성과:
- ✅ 텍스트형 친구톡 (FT) 완벽 작동
  - 변수 치환 정상 (#{이름}, #{날짜})
  - 실제 메시지 수신 확인
- ✅ 이미지형 친구톡 (FI) 완료
  - **이슈 발견 및 해결**: MTS 서버 이미지 vs Kakao 서버 이미지 차이
  - Kakao 전용 이미지 업로드 API 구현
  - 이미지 + 문구 정상 전송 및 수신 확인
- ✅ 이미지 attachment 구조 수정 (array → single object)
- ✅ 이미지 최적화 (2:1 비율, 500px 이상, 500KB 이하)
- ✅ UI 개선: 이미지 규격 안내 문구 추가
- ✅ 잔액 20원 차감 확인
- ✅ DB 저장 확인

구현 완료된 파일:
1. `src/app/api/messages/kakao/upload-image/route.ts` (신규 생성)
   - Kakao 전용 이미지 업로드 엔드포인트
   - Sharp 이미지 최적화 (2:1 비율 자동 조정)
2. `src/components/messages/FriendtalkTab.tsx` (수정)
   - Kakao 업로드 API 호출로 변경
   - 이미지 규격 안내 문구 추가 (Line 558-573)
3. `src/lib/mtsApi.ts` (수정)
   - 이미지 attachment 구조 수정 (Line 617-624)

미테스트 항목:
- [ ] 이미지 클릭 링크 (imageLink)
- [ ] 와이드형 (FW)
- [ ] 광고형 (ad_flag=Y)

참고사항:
- 친구톡은 클라이언트에서 변수 치환 처리 (알림톡과 다름)
- 이미지는 반드시 Kakao 서버에 업로드 필요
- 2:1 비율 권장, 자동 잘림 안내 제공
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

### v2.7 (2025-11-05)
- 🎉 **Phase 4 완료**: 카카오 친구톡 테스트 완료
  - ✅ 텍스트형 친구톡 (FT) + 변수 치환
  - ✅ 이미지형 친구톡 (FI) + 변수 치환
  - ✅ Kakao 전용 이미지 업로드 API 구현 (`src/app/api/messages/kakao/upload-image/route.ts`)
  - ✅ 이미지 attachment 구조 수정 (array → single object)
  - ✅ 이미지 최적화 로직 (2:1 비율, 500px 이상, 500KB 이하)
  - ✅ UI 개선: 이미지 규격 안내 문구 추가
  - ✅ 실제 메시지 수신 확인 (FT, FI 모두)
- 🔍 **이슈 발견 및 해결**: MTS 서버 이미지 vs Kakao 서버 이미지 아키텍처 차이
  - 문제: MMS는 MTS 서버 이미지 사용, 친구톡은 Kakao 서버 이미지 필요
  - 해결: 별도의 Kakao 이미지 업로드 API 구현
- 📝 **테스트 결과 문서화**: Phase 4 테스트 결과 상세 기록

### v2.6 (2025-11-05)
- 📊 **Phase 4 진행 상황 업데이트**
  - Phase 4.1 완료 (텍스트형 친구톡)
  - Phase 4.2 이슈 발견 (이미지형 친구톡)

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

**문서 버전**: v2.7
**작성일**: 2025-10-29
**최종 업데이트**: 2025-11-05
**다음 업데이트 예정**: Phase 5 네이버 톡톡 테스트 시작 시

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

