# MTS Message 프로젝트 코드베이스 분석 (v5.2)

> **최종 업데이트**: 2025-11-05
> **작성**: 전체 코드베이스 실사 완료 + Phase 4 친구톡 완전 완료 ✅

## 📊 프로젝트 개요

### 기술 스택
- **프레임워크**: Next.js 15.3.2 (App Router)
- **언어**: TypeScript 5
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: JWT 기반 커스텀 인증 (Supabase Auth 미사용)
- **스타일링**: Tailwind CSS 4, CSS Modules
- **AI 통합**: OpenAI API (GPT-4, DALL-E 3)
- **메시징 API**: MTS API (Naver SENS 전환 완료 ✅)
  - SMS/LMS/MMS (자동 타입 판단, 이미지 최적화)
  - 카카오 알림톡 (템플릿 기반)
  - 카카오 친구톡 V2 (FT/FI/FW/FL/FC 타입, imageLink 지원)
  - 카카오 브랜드 메시지 (템플릿 기반, 8가지 타입)
  - 네이버 톡톡 스마트알림 (템플릿 기반)
  - 카카오 발신프로필 관리 API (카테고리, 인증, 등록)
  - 템플릿 생성 API (알림톡, 브랜드, 네이버 톡톡)
- **결제**: NicePay (KG이니시스)
- **파일 처리**: Sharp (이미지 최적화, PNG→JPEG, 리사이즈), xlsx (엑셀), html2canvas
- **차트**: Chart.js, react-chartjs-2
- **기타**: bcryptjs, jsonwebtoken, nodemailer, uuid, crypto-js, Lucide React

### 아키텍처 구조
```
클라이언트 (React 19 + Next.js 15)
    ↓ (API 호출, JWT 토큰)
API Routes (Next.js API - 163개)
    ↓ (Service Role Key)
Supabase (PostgreSQL + Storage)
    ↓
외부 서비스 (MTS API, OpenAI, NicePay, 공공데이터 API)
```

**핵심 아키텍처 원칙**:
- 클라이언트에서는 Supabase 직접 접근 불가
- 모든 데이터 작업은 API Routes를 통해서만 수행
- Service Role Key는 서버 사이드에서만 사용
- JWT 토큰 기반 인증 (액세스 토큰: 1시간, 리프레시 토큰: 7일)
- 폴링 기반 실시간 업데이트 (Supabase Realtime 미사용)
- Service Layer를 통한 비즈니스 로직 분리

### 프로젝트 통계 (2025-11-05 기준 - v5.2)

| 구분 | 개수 | 변경사항 | 설명 |
|------|------|---------|------|
| **총 TypeScript/TSX 파일** | 349개 | +1 | FriendtalkButtonModal.tsx 추가 |
| **API 엔드포인트** | 163개 | - | REST API 라우트 |
| **페이지** | 57개 | - | Next.js 페이지 라우트 |
| **컴포넌트** | 78개 | +1 | FriendtalkButtonModal 추가 |
| **라이브러리 모듈** | 16개 | - | Core 라이브러리 |
| **서비스 모듈** | 3개 | - | 비즈니스 로직 서비스 |
| **유틸리티** | 11개 | - | Helper 함수 |
| **컨텍스트** | 4개 | - | Global State 관리 |
| **커스텀 훅** | 3개 | - | React Hook |
| **타입 정의** | 3개 | - | TypeScript 타입 |
| **마이그레이션** | 1개 | +1 | 친구톡 테이블 확장 SQL |

**주요 코드 파일 실측 (v5.2 업데이트)**:
| 파일 | 줄 수 | 함수 개수 | 비고 |
|------|------|-----------|------|
| `src/lib/mtsApi.ts` | **1850줄** | 19개 | MTS API 핵심 함수 |
| `src/utils/kakaoApi.ts` | **336줄** | 6개 | 카카오 API 래퍼 |
| `src/components/messages/FriendtalkTab.tsx` | **804줄** | - | 친구톡 UI (+277줄) |
| `src/components/messages/BrandTab.tsx` | 579줄 | - | 브랜드 메시지 UI |
| `src/components/messages/AlimtalkTab.tsx` | 431줄 | - | 알림톡 UI |
| `src/components/modals/FriendtalkButtonModal.tsx` | **243줄** | - | **신규** 버튼 모달 |

**v5.2 업데이트 내용 (2025-11-05)**:
- ✅ **Phase 4 친구톡 완전 완료**: 버튼, 템플릿 저장/불러오기, 최근발송 기능 구현
- ✅ **DB 마이그레이션**: `sms_message_templates` 테이블 확장 (4개 컬럼, 2개 인덱스)
- ✅ **신규 컴포넌트**: `FriendtalkButtonModal.tsx` (243줄, WL 타입 버튼 관리)
- ✅ **모달 확장**: `SimpleContentSaveModal`, `LoadContentModal` (친구톡 메타데이터 지원)
- ✅ **API 확장**: `/api/sms-templates` (messageType 필터링, JSONB 저장)
- ✅ **FriendtalkTab 대폭 확장**: 527줄 → 804줄 (+277줄, +52% 증가)
- ✅ **테스트 완료**: 모든 기능 정상 작동 확인

**v5.1 업데이트 내용 (2025-11-05)**:
- ✅ **구현 상태 명확화**: 완료 vs 미구현 기능 명시 (Phase 4 친구톡 집중)
- ✅ **Placeholder 식별**: 버튼, 템플릿, 최근발송 UI placeholder 확인
- ✅ **Backend vs Frontend 분리**: 백엔드는 준비되었으나 UI가 없는 기능 구분
- ✅ **구현 우선순위 매트릭스 추가**: 다음 구현해야 할 기능 명시
- ✅ **파일 참조 업데이트**: 정확한 Line 번호와 코드 스니펫 포함

**v5.0 업데이트 내용 (2025-11-04)**:
- ✅ **전체 코드베이스 실사 완료**: 모든 파일 직접 확인, 줄 번호 정확히 반영
- ✅ **MTS API 함수 19개 확인**: 발송(7), 템플릿(8), 발신프로필(4)
- ✅ **카카오 API 래퍼 6개 확인**: 프로필, 알림톡, 친구톡, 브랜드 각 2개씩
- ✅ **API 엔드포인트 전수조사**: 12개 메시지 관련 API 확인
- ✅ **UI 컴포넌트 구조 정리**: 카카오/네이버 전용 컴포넌트 분리 확인
- ✅ **문서 3종 업데이트**: 사용현황, 코드베이스분석, 테스트가이드

**이전 업데이트 (2025-11-03 - v4.2)**:
- ✅ 브랜드 메시지 구조 완전 변경 (수동 입력 → 템플릿 선택 방식)
- ✅ 친구톡 imageLink 기능 추가 (이미지 클릭 링크)
- ✅ BrandTab.tsx 완전 재작성 (575줄 → 579줄)
- ✅ FriendtalkTab.tsx 누락된 UI 요소 복원
- ✅ 빌드 성공 (0 에러, 0 경고)

**이전 업데이트 (2025-10-31 - v4.1)**:
- ✅ 친구톡 발송 API 완전 수정 (DB 스키마, 성공 코드, 데이터 흐름)
- ✅ SMS 템플릿 로딩 버그 수정 (API 응답 파싱, 검색어 초기화)
- ✅ 디버깅 로그 정리 (모든 console.log 제거, 에러 로그만 유지)
- ✅ Database migrations 4건 적용

---

## 📊 기능별 구현 상태 매트릭스 (v5.2 - 2025-11-05)

### 메시지 발송 기능

| 기능 영역 | 컴포넌트 | UI | Backend API | 테스트 | 상태 |
|-----------|----------|-----|-------------|--------|------|
| **SMS/LMS/MMS** | `SmsMessageContent.tsx` | ✅ | ✅ | ✅ | **완료** |
| └ 변수 치환 | `messageVariables.ts` | ✅ | ✅ | ✅ | **완료** |
| └ 템플릿 저장/불러오기 | `SimpleContentSaveModal.tsx`<br/>`LoadContentModal.tsx` | ✅ | ✅ `/api/sms-templates` | ✅ | **완료** |
| └ 최근발송 불러오기 | `LoadContentModal.tsx` (Line 78) | ✅ | ✅ `message_logs` | ✅ | **완료** |
| **카카오 알림톡** | `AlimtalkTab.tsx` | ✅ | ✅ | ✅ | **완료** |
| └ 템플릿 조회/선택 | `fetchAlimtalkTemplates()` | ✅ | ✅ `/api/kakao/templates` | ✅ | **완료** |
| └ 변수 치환 | (MTS 서버 처리) | ✅ | ✅ | ⏸️ | **보류** (템플릿 승인 대기) |
| **카카오 친구톡** | `FriendtalkTab.tsx` | ✅ | ✅ | ✅ | **완료** |
| └ FT (텍스트형) | Line 1-804 | ✅ | ✅ `/api/messages/kakao/friendtalk/send` | ✅ | **완료** |
| └ FI (이미지형) | Line 1-804 | ✅ | ✅ `/api/messages/kakao/upload-image` | ✅ | **완료** |
| └ 변수 치환 | `messageVariables.ts` | ✅ | ✅ | ✅ | **완료** |
| └ **버튼 기능 (WL 타입)** | `FriendtalkButtonModal.tsx` (243줄 신규) | ✅ | ✅ `mtsApi.ts` Line 626-628 | ✅ | **완료** |
| └ **템플릿 저장/불러오기** | `SimpleContentSaveModal.tsx`<br/>`LoadContentModal.tsx` | ✅ | ✅ `/api/sms-templates` (확장) | ✅ | **완료** |
| └ **최근발송 불러오기** | `LoadContentModal.tsx` (확장) | ✅ | ✅ `message_logs.metadata` | ✅ | **완료** |
| └ FW (와이드형) | - | ❌ | ✅ `sendMtsFriendtalk()` | ❌ | **미구현** (백엔드만) |
| └ FC (캐러셀) | - | ❌ | ✅ `sendMtsFriendtalk()` | ❌ | **미구현** (백엔드만) |
| └ AL/BK/MD/BC/BT 버튼 타입 | - | ❌ | ✅ `sendMtsFriendtalk()` | ❌ | **미구현** (백엔드만) |
| **네이버 톡톡** | `NaverTalkTalkTab.tsx` | ✅ | ✅ | ✅ | **완료** |
| └ 템플릿 조회/선택 | `fetchNaverTemplates()` | ✅ | ✅ `/api/naver/templates` | ✅ | **완료** |
| └ 변수 치환 | `messageVariables.ts` | ✅ | ✅ | ✅ | **완료** |
| **카카오 브랜드 메시지** | `BrandTab.tsx` | ✅ | ✅ | ❌ | **미테스트** (권한 필요) |
| └ 템플릿 조회/선택 | `fetchBrandTemplates()` | ✅ | ✅ `/api/kakao/templates` | ❌ | **미테스트** |

### 상태 범례
- ✅ **완료**: 구현 및 테스트 완료
- ❌ **미구현**: 구현되지 않음
- ⏸️ **보류**: 외부 요인으로 대기 중

**v5.2 주요 변경사항**:
- ✅ Phase 4 친구톡 완전 완료 (버튼, 템플릿, 최근발송 모두 구현)
- ✅ FriendtalkTab.tsx: 527줄 → 804줄 (+277줄, +52% 증가)
- ✅ 신규 컴포넌트: FriendtalkButtonModal.tsx (243줄)
- ✅ DB 마이그레이션: sms_message_templates 테이블 확장 (4개 컬럼, 2개 인덱스)

### Phase 4 친구톡 구현 완료 세부 분석 (2025-11-05)

#### ✅ 1. 버튼 기능 (WL 타입) - 완료

**구현 상태**: ✅ 완료 (243줄 신규 모달 컴포넌트)

**신규 파일**: `src/components/modals/FriendtalkButtonModal.tsx` (243 lines)
```typescript
// 주요 인터페이스
interface FriendtalkButton {
  name: string;      // 버튼명 (최대 14자)
  type: 'WL';        // 웹링크 (초기 버전)
  url_mobile: string; // 모바일 URL (필수)
  url_pc?: string;    // PC URL (선택)
}

interface FriendtalkButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  buttons: FriendtalkButton[];
  onSave: (buttons: FriendtalkButton[]) => void;
}

// 주요 기능
- ✅ 버튼 추가/편집/삭제 (최대 5개)
- ✅ 버튼명 14자 제한 + 실시간 검증
- ✅ URL 형식 검증 (try/catch new URL)
- ✅ 모바일 URL 필수, PC URL 선택
- ✅ 개별 버튼 삭제 기능
```

**FriendtalkTab 통합** (Line 634-677, 749-799)
```typescript
// Line 59-60: 상태 관리
const [buttons, setButtons] = useState<Array<{...}>>([]);
const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);

// Line 634-677: 버튼 섹션 UI
{buttons.length === 0 ? (
  <button onClick={() => setIsButtonModalOpen(true)}>
    + 버튼 추가
  </button>
) : (
  <div className="space-y-2">
    {buttons.map((button, index) => (
      <div key={index}>
        <span>{button.name}</span>
        <button onClick={() => setButtons(buttons.filter((_, i) => i !== index))}>
          삭제
        </button>
      </div>
    ))}
    <button onClick={() => setIsButtonModalOpen(true)}>
      + 버튼 추가
    </button>
  </div>
)}

// Line 793-799: 모달 렌더링
<FriendtalkButtonModal
  isOpen={isButtonModalOpen}
  onClose={() => setIsButtonModalOpen(false)}
  buttons={buttons as Array<{...}>}
  onSave={(newButtons) => setButtons(newButtons as Array<{...}>)}
/>
```

**백엔드 지원**: ✅ 완료 (기존 구현 활용)
```typescript
// src/lib/mtsApi.ts Line 626-628
if (buttons && buttons.length > 0) {
  attachment.button = buttons;
}

// FriendtalkTab Line 361: 발송 시 전달
buttons: buttons.length > 0 ? buttons : undefined,
```

**구현된 버튼 타입**:
- ✅ WL (웹링크): URL로 이동

**미구현 버튼 타입** (백엔드 준비됨):
- ❌ AL (앱링크): 앱 실행
- ❌ BK (봇키워드): 봇 키워드 전송
- ❌ MD (메시지전달): 상담톡 연결
- ❌ BC (상담톡전환): 상담톡 전환
- ❌ BT (봇전환): 봇 전환

**테스트 결과**: ✅ 모든 기능 정상 작동 확인

#### ✅ 2. 템플릿 저장/불러오기 - 완료

**구현 상태**: ✅ 완료 (DB 마이그레이션 + 3개 파일 확장)

**1. DB 마이그레이션**: `migrations/20250205_extend_sms_templates_for_friendtalk.sql` (37 lines, 신규)
```sql
-- 기존 sms_message_templates 테이블 확장 (옵션 1 채택)
ALTER TABLE sms_message_templates
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'SMS',
ADD COLUMN IF NOT EXISTS buttons JSONB,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS image_link TEXT;

-- 기존 데이터 업데이트
UPDATE sms_message_templates
SET message_type = 'SMS'
WHERE message_type IS NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_sms_templates_message_type
ON sms_message_templates(message_type);

CREATE INDEX IF NOT EXISTS idx_sms_templates_user_type
ON sms_message_templates(user_id, message_type);
```

**2. API 확장**: `src/app/api/sms-templates/route.ts`
```typescript
// Line 23: GET 핸들러 - messageType 필터 추가
const messageType = searchParams.get("messageType") || "SMS";
query = query.eq("message_type", messageType);

// Line 70-73, 94-97: POST 핸들러 - 새 필드 처리
const {
  name, content, subject, isPrivate = true,
  messageType = 'SMS',  // 추가
  buttons,              // 추가
  imageUrl,            // 추가
  imageLink            // 추가
} = body;

const { data: template, error } = await supabase
  .from("sms_message_templates")
  .insert({
    user_id: userId,
    name: name.trim(),
    content: content.trim(),
    message_type: messageType,     // 추가
    buttons: buttons || null,      // 추가
    image_url: imageUrl || null,   // 추가
    image_link: imageLink || null, // 추가
    // ...
  });
```

**3. 저장 모달 확장**: `src/components/modals/SimpleContentSaveModal.tsx`
```typescript
// Line 14-19: 인터페이스 확장
interface SimpleContentSaveModalProps {
  currentContent: {
    subject?: string;
    content: string;
    isAd?: boolean;
    messageType?: string;  // 추가
    buttons?: Array<{...}>; // 추가
    imageUrl?: string;     // 추가
    imageLink?: string;    // 추가
  };
}

// Line 65-68: POST 요청에 새 필드 포함
body: JSON.stringify({
  name: saveName.trim(),
  content: currentContent.content.trim(),
  messageType: currentContent.messageType || 'SMS',
  buttons: currentContent.buttons || null,
  imageUrl: currentContent.imageUrl || null,
  imageLink: currentContent.imageLink || null,
})
```

**4. 불러오기 모달 확장**: `src/components/modals/LoadContentModal.tsx`
```typescript
// props에 messageTypeFilter 추가
interface LoadContentModalProps {
  messageTypeFilter?: string; // 추가
  onSelect?: (content: {
    subject?: string;
    content: string;
    buttons?: Array<{...}>;  // 추가
    imageUrl?: string;       // 추가
    imageLink?: string;      // 추가
  }) => void;
}

// Line 74: GET 요청에 messageType 쿼리 파라미터
const messageType = messageTypeFilter || 'SMS';
const response = await fetch(`/api/sms-templates?messageType=${messageType}`);

// Line 162-164: 템플릿 선택 시 친구톡 메타데이터 반환
onSelect({
  subject: template.subject,
  content: template.content,
  buttons: template.buttons,       // 추가
  imageUrl: template.image_url,    // 추가
  imageLink: template.image_link,  // 추가
});
```

**5. FriendtalkTab 통합**: (Line 519, 759-774)
```typescript
// Line 519: 저장 버튼 연결
<button onClick={() => setIsSaveModalOpen(true)}>
  <Save size={14} />
  템플릿 저장
</button>

// Line 759-774: 저장 모달 렌더링
<SimpleContentSaveModal
  isOpen={isSaveModalOpen}
  onClose={() => setIsSaveModalOpen(false)}
  currentContent={{
    content: message,
    messageType: 'FRIENDTALK',
    buttons: buttons.length > 0 ? buttons : undefined,
    imageUrl: uploadedImages.length > 0 ? uploadedImages[0].fileId : undefined,
    imageLink: imageLink.trim() || undefined,
  }}
/>
```

**테스트 결과**: ✅ SMS 템플릿과 완전 분리, 친구톡 전용 템플릿 저장/불러오기 정상 작동

#### ✅ 3. 최근발송 불러오기 - 완료

**구현 상태**: ✅ 완료 (LoadContentModal 확장, metadata JSONB 활용)

**DB 준비 상태**: ✅ 이미 완료
- `message_logs` 테이블에 메타데이터 JSONB로 저장 중
- 친구톡 발송 시 buttons, image_urls, message_type, image_link 등 자동 저장됨

**구현된 변경사항**:

**1. LoadContentModal 확장**: `src/components/modals/LoadContentModal.tsx`
```typescript
// Line 176-178: 최근발송 선택 시 친구톡 메타데이터 복원
if (log.metadata) {
  onSelect({
    content: log.message,
    buttons: log.metadata.buttons,              // 추가
    imageUrl: log.metadata.image_urls?.[0],     // 추가
    imageLink: log.metadata.image_link,         // 추가
  });
}
```

**2. FriendtalkTab 통합**: (Line 148-157, 775-791)
```typescript
// Line 148-157: 핸들러 추가
const handleSavedContentClick = () => {
  setLoadModalActiveTab("saved");
  setIsLoadModalOpen(true);
};

const handleRecentSentClick = () => {
  setLoadModalActiveTab("recent");
  setIsLoadModalOpen(true);
};

// Line 775-791: 불러오기 모달 렌더링
<LoadContentModal
  isOpen={isLoadModalOpen}
  onClose={() => setIsLoadModalOpen(false)}
  activeTab={loadModalActiveTab}
  messageTypeFilter="FRIENDTALK"  // 친구톡만 필터링
  onSelect={(content) => {
    setMessage(content.content);
    if (content.buttons) {
      setButtons(content.buttons);
    }
    if (content.imageUrl) {
      setUploadedImages([{
        fileId: content.imageUrl,
        fileName: '불러온 이미지',
        fileSize: 0
      }]);
    }
    if (content.imageLink) {
      setImageLink(content.imageLink);
    }
    setIsLoadModalOpen(false);
  }}
/>
```

**3. metadata JSONB 저장 로직**: (기존 구현 활용)
```typescript
// src/app/api/messages/kakao/friendtalk/send/route.ts
// 발송 시 자동으로 metadata에 저장됨:
metadata: {
  buttons: buttons,
  image_urls: imageUrls,
  image_link: imageLink,
  message_type: messageType
}
```

**테스트 결과**: ✅ 최근 발송한 친구톡 메시지(텍스트, 이미지, 버튼, 링크) 모두 정상 불러오기

### Phase 4 구현 완료 요약

| 기능 | 상태 | 파일 변경 | 코드 줄 수 | 비고 |
|------|------|-----------|----------|------|
| **버튼 (WL)** | ✅ 완료 | +1 신규 | 243 lines | FriendtalkButtonModal.tsx |
| **템플릿 저장/불러오기** | ✅ 완료 | +1 마이그레이션, 3 확장 | 37 lines (SQL) | DB 확장, API/모달 확장 |
| **최근발송** | ✅ 완료 | 1 확장 | - | LoadContentModal 확장 |
| **FriendtalkTab 통합** | ✅ 완료 | 1 대폭 확장 | +277 lines | 527 → 804 lines |

**총 변경사항**: 5개 파일 (신규 2개, 확장 3개), +557 lines

### 미구현 기능 우선순위 매트릭스 (Phase 4 이후)

| 순위 | 기능 | 난이도 | 영향도 | 상태 | 비고 |
|------|------|--------|--------|------|------|
| 1 | 버튼 타입 확장 (AL/BK/MD/BC/BT) | 중 | 중 | ❌ 미구현 | 백엔드 준비됨, UI 확장 필요 |
| 2 | 와이드형 (FW) | 중 | 중 | ❌ 미구현 | 백엔드 준비됨, UI 테스트 필요 |
| 3 | 캐러셀 (FC) | 높음 | 중 | ❌ 미구현 | 복잡한 UI 구조 |

---

## 🆕 v4.2 주요 변경사항 (2025-11-03)

### 1. 브랜드 메시지 아키텍처 변경

#### UI 레벨 완전 재작성
**파일**: `src/components/messages/BrandTab.tsx`

**변경 전 구조** (수동 입력 방식):
```typescript
// 사용자가 직접 입력
const [templateCode, setTemplateCode] = useState("");
const [message, setMessage] = useState("");
const [messageType, setMessageType] = useState<'TEXT' | 'IMAGE' | ...>('TEXT');
```

**변경 후 구조** (템플릿 선택 방식):
```typescript
// 템플릿에서 자동으로 가져옴
interface BrandTemplate {
  template_code: string;
  template_name: string;
  message_type: 'TEXT' | 'IMAGE' | ...;
  template_content: string;
  buttons?: Array<{...}>;
}
const [selectedTemplate, setSelectedTemplate] = useState<BrandTemplate | null>(null);
```

**주요 변경사항**:
- ⚠️ **수동 입력 완전 제거**: message_type, message 내용은 템플릿에서만 가져옴
- ✅ **알림톡과 동일한 워크플로우**: 템플릿 선택 → 내용 확인 → 발송
- ✅ **코드 간소화**: 575줄 → 280줄 (약 51% 감소)
- ✅ **buttons 매핑 수정**: `attachment.button` 형식으로 변환

**영향받는 파일**:
- `src/components/messages/BrandTab.tsx` - UI 컴포넌트 완전 재작성
- `src/utils/kakaoApi.ts` - BrandMessageSendRequest 인터페이스 (변경 없음, 이미 맞음)
- `src/lib/mtsApi.ts` - sendKakaoBrand() 함수 (변경 없음)

**TODO**:
- 브랜드 템플릿 조회 API 구현 필요 (`/api/messages/kakao/brand/templates`)
- `fetchBrandTemplates(senderKey: string)` 함수 구현 필요

### 2. 친구톡 imageLink 기능 추가

#### 인터페이스 업데이트
**파일**: `src/utils/kakaoApi.ts`

**변경사항**:
```typescript
export interface FriendtalkSendRequest {
  // ... 기존 필드들
  imageLink?: string;  // 새로 추가: 이미지 클릭 시 이동할 URL
}
```

#### UI 레벨 수정
**파일**: `src/components/messages/FriendtalkTab.tsx`

**추가된 코드**:
```typescript
// imageLink 파라미터 전달
const result = await sendFriendtalk({
  // ... 기존 파라미터들
  imageLink: imageLink.trim() || undefined,  // 새로 추가
});
```

#### API 레벨 수정
**파일**: `src/app/api/messages/kakao/friendtalk/send/route.ts`

**추가된 코드**:
```typescript
const { imageLink } = body;  // 요청에서 추출

const result = await sendMtsFriendtalk(
  // ... 기존 파라미터들
  imageLink,  // MTS API로 전달
);
```

#### MTS API 호출 수정
**파일**: `src/lib/mtsApi.ts` - `sendMtsFriendtalk()` 함수

**변경사항**:
```typescript
// 함수 시그니처 업데이트 (7번째 파라미터)
export async function sendMtsFriendtalk(
  senderKey: string,
  toNumber: string,
  message: string,
  callbackNumber: string,
  messageType: 'FT' | 'FI' | 'FW' | 'FL' | 'FC' = 'FT',
  adFlag: 'Y' | 'N' = 'N',
  imageUrls?: string[],
  imageLink?: string,  // 새로 추가
  buttons?: Array<{...}>,
  tranType?: 'SMS' | 'LMS' | 'MMS',
  tranMessage?: string,
  sendDate?: string
)

// attachment.image 매핑 수정
if (imageUrls && imageUrls.length > 0) {
  attachment.image = imageUrls.map(url => ({
    img_url: url,
    ...(imageLink ? { img_link: imageLink } : {})  // img_link 추가
  }));
}
```

**기능 설명**:
- 이미지 첨부 시 클릭 가능한 링크 설정 가능
- MTS API의 `attachment.image[].img_link` 파라미터 활용
- 사용자가 이미지를 클릭하면 지정한 URL로 이동

### 3. FriendtalkTab UI 요소 복원

**파일**: `src/components/messages/FriendtalkTab.tsx`

**복원된 UI 요소**:
- ✅ 메시지 입력 툴바 (아이콘 + 텍스트 버튼)
- ✅ 이미지 업로드 영역 (드래그 앤 드롭)
- ✅ 카카오톡 버튼 섹션
- ✅ 텍스트 치환 섹션 (변수 카운팅 포함)

**추가된 핸들러 함수**:
- `addReplaceText()` - 변수 추가
- `handleSavedContentClick()` - 저장된 내용 불러오기
- `handleRecentSentClick()` - 최근 발송 내용 불러오기

---

## 🆕 v4.1 주요 변경사항 (2025-10-31)

### 1. 친구톡 발송 시스템 버그 수정

#### API 레벨 수정
**파일**: `src/app/api/messages/kakao/friendtalk/send/route.ts`
- **MTS API 성공 코드 인식**: `0000` 또는 `1000` 모두 허용
- **DB 스키마 수정**: 실제 테이블 구조에 맞게 컬럼명 변경
  ```typescript
  // Before (잘못된 컬럼명)
  message, recipient, type

  // After (올바른 컬럼명)
  message_content, to_number, to_name, message_type
  ```
- **수신자 이름 저장**: `Recipient[]` 객체에서 `name` 필드 추출 및 저장
- **발송 시간 기록**: `sent_at` 필드에 성공 시 현재 시간 저장

#### 라이브러리 레벨 수정
**파일**: `src/lib/mtsApi.ts`
- **sendMtsFriendtalk 함수**: 성공 코드 체크 로직 수정
  ```typescript
  // 0000 또는 1000 모두 성공으로 인식
  if (result.code === '0000' || result.code === '1000') {
    return { success: true, msgId: result.msg_id, ... };
  }
  ```
- **디버깅 로그 제거**: 모든 console.log 제거, console.error만 유지

#### 컴포넌트 레벨 수정
**파일**:
- `src/components/messages/KakaoMessageContent.tsx`
- `src/components/messages/FriendtalkTab.tsx`
- `src/components/messages/AlimtalkTab.tsx`
- `src/utils/kakaoApi.ts`

**변경사항**:
```typescript
// Before: 전화번호만 전달 (이름 손실)
<FriendtalkTab recipients={recipients.map(r => r.phone_number)} />

// After: 전체 Recipient 객체 전달
interface Recipient {
  phone_number: string;
  name?: string;
}
<FriendtalkTab recipients={recipients} />
```

#### Database Migrations (4건)
1. **message_type 길이 확장**
   ```sql
   ALTER TABLE message_logs
   ALTER COLUMN message_type TYPE varchar(50);
   ```

2. **message_type CHECK constraint 업데이트**
   ```sql
   ALTER TABLE message_logs ADD CONSTRAINT message_logs_message_type_check
   CHECK (message_type IN (
     'SMS', 'LMS', 'MMS',
     'KAKAO_ALIMTALK', 'KAKAO_FRIENDTALK', 'KAKAO_BRAND', 'NAVERTALK'
   ));
   ```

3. **transactions amount CHECK 수정**
   ```sql
   -- 음수 금액을 양수로 변환
   UPDATE transactions SET amount = ABS(amount) WHERE amount < 0;

   -- 양수만 허용하도록 제약조건 변경
   ALTER TABLE transactions ADD CONSTRAINT transactions_amount_check
   CHECK (amount > 0);
   ```

4. **SMS 전송 로직 수정**
   **파일**: `src/lib/messageSender.ts`
   ```typescript
   // Before: 빈 문자열 저장
   to_name: params.toName || ''

   // After: NULL 저장
   to_name: params.toName || null
   ```

### 2. SMS 템플릿 로딩 버그 수정

#### 문제점
- API 응답 구조: `{ success: true, data: { templates: [...] } }`
- 클라이언트 파싱: `data.templates` (❌ 잘못됨)
- 결과: 템플릿 0개로 인식, "저장된 내용이 없습니다" 표시

#### 해결방법
**파일**: `src/components/modals/LoadContentModal.tsx`

```typescript
// Before
setTemplates(data.templates || []);

// After: 중첩된 data 구조 처리
const templates = data.data?.templates || data.templates || [];
setTemplates(templates);
```

**추가 개선**:
- 모달 열 때 검색어 초기화: `setSearchTerm("")`
- 이전 검색어로 인한 필터링 문제 해결

### 3. 코드 정리 및 최적화

#### 디버깅 로그 제거
**대상 파일**:
- `src/app/api/messages/kakao/friendtalk/send/route.ts`
- `src/app/api/sms-templates/route.ts`
- `src/lib/mtsApi.ts` (sendMtsFriendtalk)
- `src/components/modals/LoadContentModal.tsx`

**변경사항**:
- 모든 디버깅용 console.log 제거
- 에러 처리용 console.error만 유지
- 코드 가독성 개선

---

## 🆕 v4.0 주요 변경사항 (2025-10-29)

### 1. 카카오 발신프로필 관리 시스템 추가

#### 신규 API (5개)
```
POST /api/kakao/sender/token       - 카카오 인증 토큰 요청
POST /api/kakao/sender/register    - 발신프로필 등록 (MTS)
GET  /api/kakao/profiles           - 발신프로필 목록 조회
GET  /api/kakao/templates          - 알림톡 템플릿 목록
GET  /api/kakao/categories         - 카테고리 코드 목록
```

#### 신규 컴포넌트
- `src/components/kakao/ChannelRegistrationModal.tsx` - 카카오 채널 등록 모달
  - 3단계 등록 프로세스
  - 카카오톡 인증 토큰 요청
  - MTS API 발신프로필 등록
  - 카테고리 선택 UI

- `src/components/kakao/TemplateCreateModal.tsx` - 알림톡 템플릿 등록 모달
  - 템플릿 코드, 이름, 내용 입력
  - 검수 즉시 요청 옵션
  - MTS API 템플릿 등록 및 검수 요청

- `src/components/messages/kakao/KakaoAlimtalkTab.tsx` - 알림톡 템플릿 관리 탭
  - 발신프로필별 템플릿 목록 조회
  - 템플릿 등록 모달 통합
  - 템플릿 상태 표시 (정상/대기/중지 · 등록됨/검수중/승인됨/반려됨)

- `src/components/messages/AlimtalkTab.tsx` - 알림톡 발송 탭 (메시지 보내기)
  - 템플릿 선택 및 미리보기
  - 수신자 다중 입력 (엔터로 구분)
  - 회신번호 선택
  - SMS 백업 발송 옵션

#### 신규 디렉토리 구조
```
src/
├── components/
│   └── kakao/                      # NEW: 카카오 전용 컴포넌트
│       └── ChannelRegistrationModal.tsx
├── app/api/kakao/                  # NEW: 카카오 API 그룹
│   ├── sender/
│   │   ├── token/route.ts         # 인증 토큰 발급
│   │   └── register/route.ts      # 발신프로필 등록
│   ├── profiles/route.ts
│   ├── templates/route.ts
│   └── categories/route.ts
```

### 2. 신규 커스텀 훅 추가 (2개)

```typescript
// src/hooks/useTargetMarketing.ts - AI 타겟 마케팅 훅
// src/hooks/useTermsContent.ts - 약관 내용 관리 훅
```

### 3. 컴포넌트 구조 개선

#### 새로운 하위 디렉토리
```
src/components/
├── kakao/                          # NEW: 카카오 관련
│   ├── ChannelRegistrationModal.tsx
│   └── TemplateCreateModal.tsx
├── messages/kakao/                 # 카카오 메시지 탭들
│   ├── KakaoAlimtalkTab.tsx       # 알림톡 템플릿 관리
│   ├── KakaoChannelTab.tsx        # 채널/그룹 관리
│   └── KakaoBrandTab.tsx          # 브랜드 템플릿
├── messages/naver/                 # 네이버 메시지 탭들
├── admin/campaign-settings/        # 캠페인 설정
├── admin/system-settings/          # 시스템 설정
├── target-marketing/sections/      # 타겟 마케팅 섹션 (빈 디렉토리)
├── common/                         # 공통 컴포넌트 (빈 디렉토리)
└── history/                        # 히스토리 (빈 디렉토리)
```

### 4. MTS API 통합 중요 발견사항 (2025-10-30)

**알림톡 API 응답 코드 불일치:**
- **문서 명시**: 알림톡 성공 시 `1000` 반환
- **실제 응답**: `0000` 반환 (SMS/LMS/MMS와 동일)
- **해결**: `src/lib/mtsApi.ts`의 `sendMtsAlimtalk()` 함수에서 두 코드 모두 허용
  ```typescript
  // Line 443
  if (result.code === '0000' || result.code === '1000') {
    return { success: true, ... };
  }
  ```

**템플릿 검수 요청 API:**
- 성공 코드: `200`
- 검수 상태: `inspection_status` 컬럼으로 관리
  - `REG`: 등록됨
  - `REQ`: 검수 요청중
  - `APR`: 승인됨
  - `REJ`: 반려됨

**디버깅 로그 정리:**
- Phase 3.1 테스트 중 추가된 38개 console.log 제거
- 프로덕션 배포 준비 완료

---

## 🏗️ 상세 디렉토리 구조

```
src/
├── app/                                    # Next.js App Router
│   ├── api/                                # 163개 API 엔드포인트
│   │   ├── auth/                           # 21개 인증 관련 API
│   │   │   ├── check-username/, check-email/
│   │   │   ├── find-username/, find-password/
│   │   │   ├── google-auth-url/, google-token/, google-login/, google-signup/
│   │   │   ├── kakao-auth-url/, kakao-token/, kakao-login/, kakao-signup/
│   │   │   ├── naver-auth-url/, naver-token/, naver-login/, naver-signup/
│   │   │   ├── validate-referral/, validate-referrer/
│   │   │   └── inicis-auth/ (request/, callback/, result/)
│   │   │
│   │   ├── users/                          # 13개 사용자 관리
│   │   │   ├── login/, signup/, signup-with-files/, refresh/
│   │   │   ├── me/, change-password/, withdraw/
│   │   │   ├── generate-code/, referral-chain/, referral-stats/
│   │   │   ├── update-referral-views/, upload-documents/, social-link/
│   │   │
│   │   ├── admin/                          # 35개 관리자 기능
│   │   │   ├── users/ (5개: 목록, 충전, 비밀번호초기화, 일괄작업, 내보내기)
│   │   │   ├── campaigns/ (6개: 목록, 상세, 승인, 거부, 시작, 일시정지)
│   │   │   ├── campaign-industries/ (3개: 목록, 생성, 수정/삭제)
│   │   │   ├── custom-industries/ (1개)
│   │   │   ├── tax-invoices/ (5개: 목록, 상세, 생성, 내보내기, 업로드, 템플릿)
│   │   │   ├── sms-templates/ (4개: 목록, 생성, 수정, 토글)
│   │   │   ├── sms-logs/ (1개)
│   │   │   ├── inquiries/ (2개: 목록, 상세)
│   │   │   ├── point-charge/ (2개: 단건충전, 일괄충전)
│   │   │   ├── point-status/ (1개)
│   │   │   ├── companies/, grade-settings/, grade-history/
│   │   │   ├── terms/, system-settings/
│   │   │   └── send-approval-notification/
│   │   │
│   │   ├── messages/                       # 10개 메시지 발송
│   │   │   ├── send/                       # SMS/LMS/MMS 통합 발송 (MTS)
│   │   │   ├── upload-image/               # 이미지 업로드 (MTS)
│   │   │   ├── templates/ (목록, 생성, 수정, 삭제)
│   │   │   ├── scheduled/                  # 예약 메시지 (목록, 등록, 삭제)
│   │   │   ├── scheduled-send-check/       # Cron: 예약 발송 체크
│   │   │   ├── kakao/
│   │   │   │   ├── alimtalk/send/         # 카카오 알림톡
│   │   │   │   ├── friendtalk/send/       # 카카오 친구톡 V2
│   │   │   │   └── brand/send/            # 카카오 브랜드 메시지
│   │   │   └── naver/
│   │   │       └── talk/send/             # 네이버 톡톡
│   │   │
│   │   ├── kakao/                          # 5개 카카오 관리 (NEW)
│   │   │   ├── sender/
│   │   │   │   ├── token/                 # 인증 토큰 발급
│   │   │   │   └── register/              # 발신프로필 등록
│   │   │   ├── profiles/                  # 발신프로필 목록
│   │   │   ├── templates/                 # 알림톡 템플릿
│   │   │   └── categories/                # 카테고리 코드
│   │   │
│   │   ├── reservations/                   # 21개 예약 시스템
│   │   │   ├── spaces/ (2개: 목록/생성, 상세/수정/삭제)
│   │   │   ├── bookings/ (2개: 목록/생성, 상세/수정/삭제)
│   │   │   ├── channels/ (2개: 목록/생성, 커스텀)
│   │   │   ├── shared-calendars/ (4개: 목록, 생성, 상세, 수정, 삭제)
│   │   │   ├── message-templates/ (5개)
│   │   │   ├── auto-rules/ (2개: 목록/생성, 상세/수정/삭제)
│   │   │   ├── auto-send-check/           # Cron: 자동 발송
│   │   │   ├── send-message/
│   │   │   ├── message-logs/ (2개: 목록, 상세)
│   │   │   ├── scheduled-messages/
│   │   │   ├── statistics/
│   │   │   ├── export/ (csv/, excel/)
│   │   │   └── [id]/                      # 예약 상세
│   │   │
│   │   ├── campaigns/                      # 4개 캠페인 관리
│   │   │   ├── route.ts (목록, 생성)
│   │   │   ├── [id]/route.ts (상세, 수정, 삭제)
│   │   │   ├── [id]/rejection/
│   │   │   └── ad-costs/
│   │   │
│   │   ├── sender-numbers/                 # 3개 발신번호
│   │   │   ├── route.ts (목록, 등록)
│   │   │   ├── [id]/route.ts (상세, 수정, 삭제)
│   │   │   └── [id]/set-default/
│   │   │
│   │   ├── address-book/                   # 4개 주소록
│   │   │   ├── contacts/
│   │   │   └── groups/ (목록/생성, [id])
│   │   │
│   │   ├── notifications/                  # 4개 알림
│   │   │   ├── route.ts (목록, 발송)
│   │   │   ├── [id]/read/
│   │   │   └── mark-all-read/
│   │   │
│   │   ├── inquiries/                      # 3개 문의
│   │   │   ├── route.ts (목록, 등록)
│   │   │   └── [id]/ (상세, 수정, reply/)
│   │   │
│   │   ├── faqs/                           # 4개 FAQ
│   │   │   ├── route.ts (목록, 생성)
│   │   │   ├── [id]/ (상세, 수정, 삭제)
│   │   │   └── max-order/
│   │   │
│   │   ├── announcements/                  # 2개 공지사항
│   │   ├── payment/                        # 4개 결제 (NicePay)
│   │   ├── tax-invoices/                   # 2개 세금계산서
│   │   ├── transactions/, settlements/     # 거래/정산
│   │   ├── referrals/dashboard/
│   │   ├── rewards/
│   │   ├── business-verification/          # 사업자 인증
│   │   ├── locations/                      # 지역 데이터
│   │   ├── industries/, nts-industries/
│   │   ├── campaign-industries/
│   │   ├── terms/, site-settings/, pricing-settings/
│   │   ├── holidays/
│   │   ├── shared/calendar/[token]/
│   │   ├── cron/send-scheduled-messages/
│   │   ├── ai/ (chat/, send-mms/)
│   │   ├── message/ (send/, upload-file/)
│   │   ├── message-logs/
│   │   ├── templates/ (목록/생성, [id], upload-image/)
│   │   ├── sms-templates/
│   │   ├── naver/templates/
│   │   ├── user/profile/
│   │   └── upload/inquiry/
│   │
│   ├── admin/                              # 11개 관리자 페이지
│   │   ├── campaigns/page.tsx
│   │   ├── user-management/page.tsx
│   │   ├── member-approval/page.tsx
│   │   ├── statistics/
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── CampaignStatistics.tsx
│   │   │       ├── MemberStatistics.tsx
│   │   │       ├── MemberSignupStatistics.tsx
│   │   │       └── MemberLoginStatistics.tsx
│   │   ├── notifications/page.tsx
│   │   ├── customer-support/page.tsx
│   │   ├── tax-invoices/page.tsx
│   │   ├── point-charge-management/page.tsx
│   │   ├── campaign-settings/page.tsx
│   │   ├── system-settings/page.tsx
│   │   └── campaign-industries/page.tsx
│   │
│   ├── messages/                           # 메시지 발송 시스템
│   │   ├── send/page.tsx                   # 통합 메시지 발송
│   │   └── reservations/                   # 예약 관리 (25개 하위 페이지)
│   │       ├── layout.tsx
│   │       ├── page.tsx
│   │       ├── list/page.tsx
│   │       ├── create/page.tsx
│   │       ├── detail/page.tsx
│   │       ├── edit/page.tsx
│   │       ├── calendar/page.tsx
│   │       ├── calendar/shared/
│   │       │   ├── page.tsx
│   │       │   └── create/page.tsx
│   │       ├── places/
│   │       │   ├── page.tsx
│   │       │   ├── add/page.tsx
│   │       │   ├── detail/page.tsx
│   │       │   └── edit/page.tsx
│   │       ├── payments/
│   │       │   ├── page.tsx
│   │       │   └── list/page.tsx
│   │       ├── statistics/page.tsx
│   │       └── message/
│   │           ├── page.tsx
│   │           ├── send/page.tsx
│   │           ├── list/page.tsx
│   │           ├── list/reserved/page.tsx
│   │           ├── templates/page.tsx
│   │           ├── sender-contact/page.tsx
│   │           └── auto/
│   │               ├── page.tsx
│   │               ├── create/page.tsx
│   │               └── edit/[id]/page.tsx
│   │
│   ├── my-site/advertiser/                 # 3개 사용자 대시보드
│   │   ├── dashboard/page.tsx
│   │   ├── profile/page.tsx
│   │   └── business-verification/page.tsx
│   │
│   ├── salesperson/                        # 4개 영업사원
│   │   ├── profile/page.tsx
│   │   ├── referrals/page.tsx
│   │   ├── invite/page.tsx
│   │   └── organization/page.tsx
│   │
│   ├── auth/                               # 4개 인증 페이지
│   │   ├── find-username/page.tsx
│   │   ├── find-password/page.tsx
│   │   └── inicis/
│   │       ├── callback/page.tsx
│   │       └── success/page.tsx
│   │
│   ├── credit-management/page.tsx
│   ├── target-marketing/page.tsx
│   ├── payment/success/ (layout.tsx, page.tsx)
│   ├── support/page.tsx
│   ├── shared/calendar/[token]/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── terms/page.tsx, TermsPageClient.tsx
│   ├── privacy/page.tsx, PrivacyPageClient.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   ├── robots.ts
│   └── sitemap.ts
│
├── components/                             # 77개 React 컴포넌트
│   ├── admin/                              # 8개
│   │   ├── AdminHeader.tsx
│   │   ├── AdminSidebar.tsx
│   │   ├── campaign-settings/
│   │   │   ├── BudgetSettings.tsx
│   │   │   ├── CommissionSettings.tsx
│   │   │   └── PricingSettings.tsx
│   │   └── system-settings/
│   │       ├── GeneralSettings.tsx
│   │       ├── DocumentSettings.tsx
│   │       └── MenuSettings.tsx
│   │
│   ├── messages/                           # 16개
│   │   ├── MessageSendTab.tsx
│   │   ├── TemplateManagementTab.tsx
│   │   ├── ReservationManagementTab.tsx
│   │   ├── KakaoNaverRcsTab.tsx
│   │   ├── SmsMessageContent.tsx
│   │   ├── KakaoMessageContent.tsx
│   │   ├── NaverTalkContent.tsx
│   │   ├── AlimtalkTab.tsx
│   │   ├── FriendtalkTab.tsx
│   │   ├── BrandTab.tsx
│   │   ├── NaverTalkTalkTab.tsx
│   │   ├── kakao/
│   │   │   ├── KakaoAlimtalkTab.tsx
│   │   │   ├── KakaoBrandTab.tsx
│   │   │   └── KakaoChannelTab.tsx
│   │   └── naver/
│   │       ├── NaverTalkIdTab.tsx
│   │       └── NaverTemplateTab.tsx
│   │
│   ├── modals/                             # 23개
│   │   ├── AddressBookModal.tsx
│   │   ├── AddContactModal.tsx
│   │   ├── CreateGroupModal.tsx
│   │   ├── AddressBookExcelModal.tsx
│   │   ├── CampaignModal.tsx
│   │   ├── CampaignDetailModal.tsx
│   │   ├── RejectionReasonModal.tsx
│   │   ├── TemplateModal.tsx
│   │   ├── SaveTemplateModal.tsx
│   │   ├── SaveContentModal.tsx
│   │   ├── SimpleContentSaveModal.tsx
│   │   ├── LoadContentModal.tsx
│   │   ├── VariableSelectModal.tsx
│   │   ├── SenderNumberSelectModal.tsx
│   │   ├── SenderNumberManageModal.tsx
│   │   ├── SenderNumberRegistrationModal.tsx
│   │   ├── ScheduledMessagesModal.tsx
│   │   ├── PreviewModal.tsx
│   │   ├── SendConfirmModal.tsx
│   │   ├── ExcelUploadModal.tsx
│   │   ├── TextUploadModal.tsx
│   │   ├── DateRangeModal.tsx
│   │   └── LimitRemovalModal.tsx
│   │
│   ├── kakao/                              # 1개 (NEW)
│   │   └── ChannelRegistrationModal.tsx    # 카카오 채널 등록
│   │
│   ├── profile/                            # 5개
│   │   ├── MemberInfoTab.tsx
│   │   ├── BusinessInfoTab.tsx
│   │   ├── PasswordTab.tsx
│   │   ├── SendingNumberTab.tsx
│   │   └── TaxInvoiceTab.tsx
│   │
│   ├── credit/                             # 3개
│   │   ├── CreditBalance.tsx
│   │   ├── ChargeInput.tsx
│   │   └── PaymentModal.tsx
│   │
│   ├── support/                            # 3개
│   │   ├── AnnouncementTab.tsx
│   │   ├── FaqTab.tsx
│   │   └── ContactTab.tsx
│   │
│   ├── target-marketing/                   # 3개
│   │   ├── TargetMarketingDetail.tsx
│   │   ├── NumberedParagraph.tsx
│   │   ├── StructuredRecommendationTable.tsx
│   │   └── sections/                       # (빈 디렉토리)
│   │
│   ├── campaigns/                          # 1개
│   │   └── CampaignManagementTab.tsx
│   │
│   ├── approval/                           # 1개
│   │   └── ApprovalRequestComplete.tsx
│   │
│   ├── signup/                             # 1개
│   │   └── GeneralSignupForm.tsx
│   │
│   ├── salesperson/                        # 1개
│   │   └── SalespersonDashboard.tsx
│   │
│   ├── terms/                              # 1개
│   │   └── TermsLayout.tsx
│   │
│   ├── common/                             # (빈 디렉토리)
│   ├── history/                            # (빈 디렉토리)
│   │
│   └── [Root]/                             # 10개
│       ├── Layout.tsx
│       ├── Navigation.tsx
│       ├── Footer.tsx
│       ├── RoleGuard.tsx
│       ├── ConfirmDialog.tsx
│       ├── SuccessModal.tsx
│       ├── TermsModal.tsx
│       ├── Pagination.tsx
│       ├── ReservationTooltip.tsx
│       └── ChannelSelectModal.tsx
│
├── contexts/                               # 4개 Context Providers
│   ├── AuthContext.tsx                     # 인증 상태 관리
│   ├── BalanceContext.tsx                  # 잔액 추적
│   ├── NotificationContext.tsx             # 실시간 알림 (폴링)
│   └── PricingContext.tsx                  # 가격 설정
│
├── hooks/                                  # 3개 Custom Hook
│   ├── useNotificationUtils.tsx            # 알림 포맷팅 훅
│   ├── useTargetMarketing.ts               # NEW: AI 타겟 마케팅 훅
│   └── useTermsContent.ts                  # NEW: 약관 내용 관리 훅
│
├── lib/                                    # 16개 Core 라이브러리
│   ├── api.ts                              # API 베이스 설정
│   ├── apiClient.ts                        # Typed HTTP 클라이언트
│   ├── apiMiddleware.ts                    # JWT 갱신 미들웨어
│   ├── apiResponse.ts                      # 응답 포맷팅
│   ├── mtsApi.ts                           # MTS API 통합 (1100+줄)
│   ├── messageSender.ts                    # 메시지 발송 로직
│   ├── notificationService.ts              # 알림 서비스
│   ├── emailUtils.ts                       # 이메일 발송
│   ├── supabase.ts                         # Supabase 클라이언트
│   ├── storage.ts                          # 파일 스토리지
│   ├── seedCrypto.ts, kisaSeed.ts          # 암호화
│   ├── campaignDraft.ts                    # 캠페인 상태
│   ├── termsService.ts                     # 약관 버전
│   ├── targetOptions.ts                    # 마케팅 옵션
│   └── utils.ts                            # 범용 헬퍼
│
├── services/                               # 3개 Business Services
│   ├── templateService.ts                  # 템플릿 CRUD
│   ├── campaignService.ts                  # 캠페인 로직
│   └── uploadService.ts                    # 파일 업로드
│
├── utils/                                  # 10개 Utilities
│   ├── authUtils.ts                        # JWT 검증
│   ├── dateUtils.ts                        # 날짜 포맷
│   ├── formatUtils.ts                      # 숫자, 전화번호, 통화
│   ├── idUtils.ts                          # UUID 생성
│   ├── validationUtils.ts                  # 입력 검증
│   ├── messageVariables.ts                 # 변수 치환
│   ├── messageTemplateParser.ts            # 템플릿 파싱
│   ├── smsNotification.ts                  # SMS 알림
│   ├── storageUtils.ts                     # 파일 조작
│   └── kakaoApi.ts                         # 카카오 API
│
├── types/                                  # 3개 Type 정의
│   ├── inquiry.ts                          # 문의 타입
│   ├── notificationEvents.ts               # 알림 이벤트
│   └── targetMarketing.ts                  # 마케팅 타입
│
├── constants/                              # 1개 Constants
│   └── targetMarketing.ts                  # 마케팅 상수
│
└── styles/
    └── notifications.css
```

---

## 📡 전체 API 엔드포인트 (163개)

### 인증 관련 (21개)

**기본 인증** (9개):
- `POST /api/users/login` - 로그인
- `POST /api/users/signup` - 회원가입
- `POST /api/users/signup-with-files` - 파일 포함 회원가입
- `POST /api/users/refresh` - 토큰 갱신
- `POST /api/users/change-password` - 비밀번호 변경
- `POST /api/auth/check-username` - 아이디 중복 확인
- `POST /api/auth/check-email` - 이메일 중복 확인
- `POST /api/auth/find-username` - 아이디 찾기
- `POST /api/auth/find-password` - 비밀번호 찾기

**소셜 로그인** (9개):
- `GET /api/auth/google-auth-url` - 구글 인증 URL
- `POST /api/auth/google-token` - 구글 토큰 교환
- `POST /api/auth/google-login` - 구글 로그인
- `POST /api/auth/google-signup` - 구글 회원가입
- `GET /api/auth/kakao-auth-url` - 카카오 인증 URL
- `POST /api/auth/kakao-token` - 카카오 토큰 교환
- `POST /api/auth/kakao-login` - 카카오 로그인
- `POST /api/auth/kakao-signup` - 카카오 회원가입
- `GET /api/auth/naver-auth-url` - 네이버 인증 URL
- `POST /api/auth/naver-token` - 네이버 토큰 교환
- `POST /api/auth/naver-login` - 네이버 로그인
- `POST /api/auth/naver-signup` - 네이버 회원가입

**기타** (3개):
- `POST /api/auth/validate-referral` - 추천인 코드 검증
- `POST /api/auth/validate-referrer` - 추천인 검증
- `POST /api/auth/inicis-auth/request` - 본인인증 요청
- `POST /api/auth/inicis-auth/callback` - 본인인증 콜백
- `POST /api/auth/inicis-auth/result` - 본인인증 결과

### 사용자 관리 (13개)

- `GET /api/user/profile` - 프로필 조회
- `GET|PUT /api/users/me` - 내 정보 조회/수정
- `POST /api/users/upload-documents` - 문서 업로드
- `POST /api/users/generate-code` - 추천인 코드 생성
- `GET /api/users/referral-chain` - 추천인 체인
- `GET /api/users/referral-stats` - 추천 통계
- `POST /api/users/update-referral-views` - 조회수 업데이트
- `POST /api/users/social-link` - SNS 연동
- `POST /api/users/withdraw` - 회원 탈퇴

### 관리자 - 사용자 (5개)

- `GET /api/admin/users` - 사용자 목록
- `POST /api/admin/users/charge` - 포인트 충전
- `POST /api/admin/users/reset-password` - 비밀번호 초기화
- `POST /api/admin/users/bulk` - 일괄 작업
- `GET /api/admin/users/export` - 엑셀 내보내기

### 메시지 발송 (10개)

- `POST /api/messages/send` - SMS/LMS/MMS 발송 (MTS API)
- `POST /api/message/send` - 구 메시지 발송
- `POST /api/message/upload-file` - 파일 업로드
- `POST /api/messages/upload-image` - 이미지 업로드 (MTS)
- `POST /api/messages/kakao/alimtalk/send` - 카카오 알림톡
- `POST /api/messages/kakao/friendtalk/send` - 카카오 친구톡
- `POST /api/messages/kakao/brand/send` - 카카오 브랜드 메시지
- `POST /api/messages/naver/talk/send` - 네이버 톡톡
- `POST /api/ai/chat` - AI 채팅
- `POST /api/ai/send-mms` - AI MMS 생성
- `GET /api/message-logs` - 발송 로그

### 🆕 카카오 발신프로필 관리 (5개) - NEW v4.0

- `POST /api/kakao/sender/token` - 카카오 인증 토큰 요청
- `POST /api/kakao/sender/register` - MTS 발신프로필 등록
- `GET /api/kakao/profiles` - 발신프로필 목록 조회
- `GET /api/kakao/templates` - 알림톡 템플릿 목록
- `GET /api/kakao/categories` - 카테고리 코드 목록

### 메시지 템플릿 (11개)

- `GET /api/messages/templates` - 템플릿 목록
- `POST /api/messages/templates` - 템플릿 생성
- `GET /api/messages/templates/[id]` - 템플릿 상세
- `PUT /api/messages/templates/[id]` - 템플릿 수정
- `DELETE /api/messages/templates/[id]` - 템플릿 삭제
- `GET /api/templates` - 범용 템플릿 목록
- `POST /api/templates` - 범용 템플릿 생성
- `GET /api/templates/[id]` - 범용 템플릿 상세
- `PUT /api/templates/[id]` - 범용 템플릿 수정
- `DELETE /api/templates/[id]` - 범용 템플릿 삭제
- `POST /api/templates/upload-image` - 템플릿 이미지

### 예약 메시지 (4개)

- `GET /api/messages/scheduled` - 예약 메시지 목록
- `POST /api/messages/scheduled` - 예약 메시지 등록
- `DELETE /api/messages/scheduled` - 예약 메시지 삭제
- `GET /api/messages/scheduled-send-check` - 예약 발송 체크 (Cron)

### 예약 시스템 - 공간/예약 (12개)

- `GET /api/reservations/spaces` - 공간 목록
- `POST /api/reservations/spaces` - 공간 생성
- `GET /api/reservations/spaces/[id]` - 공간 상세
- `PUT /api/reservations/spaces/[id]` - 공간 수정
- `DELETE /api/reservations/spaces/[id]` - 공간 삭제
- `GET /api/reservations/bookings` - 예약 목록
- `POST /api/reservations/bookings` - 예약 생성
- `GET /api/reservations/bookings/[id]` - 예약 상세
- `PUT /api/reservations/bookings/[id]` - 예약 수정
- `DELETE /api/reservations/bookings/[id]` - 예약 삭제
- `GET /api/reservations/[id]` - 예약 조회
- `PUT /api/reservations/[id]` - 예약 업데이트

### 예약 시스템 - 자동 발송 (6개)

- `GET /api/reservations/auto-rules` - 자동 규칙 목록
- `POST /api/reservations/auto-rules` - 자동 규칙 생성
- `GET /api/reservations/auto-rules/[id]` - 규칙 상세
- `PUT /api/reservations/auto-rules/[id]` - 규칙 수정
- `DELETE /api/reservations/auto-rules/[id]` - 규칙 삭제
- `GET /api/reservations/auto-send-check` - 자동 발송 체크 (Cron)

### 예약 시스템 - 메시지 템플릿 (5개)

- `GET /api/reservations/message-templates` - 템플릿 목록
- `POST /api/reservations/message-templates` - 템플릿 생성
- `GET /api/reservations/message-templates/[id]` - 템플릿 상세
- `PUT /api/reservations/message-templates/[id]` - 템플릿 수정
- `DELETE /api/reservations/message-templates/[id]` - 템플릿 삭제

### 예약 시스템 - 기타 (14개)

- `GET /api/reservations/channels` - 예약 채널
- `POST /api/reservations/channels` - 채널 추가
- `POST /api/reservations/channels/custom` - 커스텀 채널
- `GET /api/reservations/shared-calendars` - 공유 캘린더 목록
- `POST /api/reservations/shared-calendars` - 공유 캘린더 생성
- `GET /api/reservations/shared-calendars/[id]` - 캘린더 상세
- `PUT /api/reservations/shared-calendars/[id]` - 캘린더 수정
- `DELETE /api/reservations/shared-calendars/[id]` - 캘린더 삭제
- `POST /api/reservations/send-message` - 메시지 발송
- `GET /api/reservations/message-logs` - 메시지 로그
- `GET /api/reservations/message-logs/[id]` - 로그 상세
- `GET /api/reservations/scheduled-messages` - 예약 메시지
- `GET /api/reservations/statistics` - 통계
- `GET /api/reservations/export/csv` - CSV 내보내기
- `GET /api/reservations/export/excel` - 엑셀 내보내기

### 캠페인 (4개)

- `GET /api/campaigns` - 캠페인 목록
- `POST /api/campaigns` - 캠페인 생성
- `GET /api/campaigns/[id]` - 캠페인 상세
- `PUT /api/campaigns/[id]` - 캠페인 수정
- `DELETE /api/campaigns/[id]` - 캠페인 삭제
- `GET /api/campaigns/[id]/rejection` - 거절 사유
- `GET /api/campaigns/ad-costs` - 광고비 계산

### 관리자 - 캠페인 (6개)

- `GET /api/admin/campaigns` - 캠페인 관리 목록
- `GET /api/admin/campaigns/[id]` - 캠페인 관리 상세
- `POST /api/admin/campaigns/[id]/approve` - 캠페인 승인
- `POST /api/admin/campaigns/[id]/reject` - 캠페인 거부
- `POST /api/admin/campaigns/[id]/start` - 캠페인 시작
- `POST /api/admin/campaigns/[id]/pause` - 캠페인 일시정지

### 캠페인 업종 (7개)

- `GET /api/campaign-industries` - 업종 목록
- `GET /api/admin/campaign-industries` - 관리자 업종 목록
- `POST /api/admin/campaign-industries` - 업종 생성
- `GET /api/admin/campaign-industries/[id]` - 업종 상세
- `PUT /api/admin/campaign-industries/[id]` - 업종 수정
- `DELETE /api/admin/campaign-industries/[id]` - 업종 삭제
- `GET /api/admin/custom-industries` - 커스텀 업종
- `POST /api/admin/custom-industries` - 커스텀 업종 생성

### 알림 (4개)

- `GET /api/notifications` - 알림 목록
- `POST /api/notifications` - 알림 발송
- `POST /api/notifications/[id]/read` - 읽음 처리
- `POST /api/notifications/mark-all-read` - 전체 읽음
- `POST /api/admin/send-approval-notification` - 승인 알림

### SMS 알림 템플릿 (5개)

- `GET /api/admin/sms-templates` - 템플릿 목록
- `POST /api/admin/sms-templates` - 템플릿 생성
- `GET /api/admin/sms-templates/[id]` - 템플릿 상세
- `PUT /api/admin/sms-templates/[id]` - 템플릿 수정
- `PATCH /api/admin/sms-templates/[id]/toggle` - ON/OFF 토글
- `GET /api/admin/sms-logs` - SMS 로그

### 주소록 (4개)

- `GET /api/address-book/contacts` - 연락처 목록
- `POST /api/address-book/contacts` - 연락처 추가
- `DELETE /api/address-book/contacts` - 연락처 삭제
- `GET /api/address-book/groups` - 그룹 목록
- `POST /api/address-book/groups` - 그룹 생성
- `GET /api/address-book/groups/[id]` - 그룹 상세
- `PUT /api/address-book/groups/[id]` - 그룹 수정
- `DELETE /api/address-book/groups/[id]` - 그룹 삭제

### 발신번호 (3개)

- `GET /api/sender-numbers` - 발신번호 목록
- `POST /api/sender-numbers` - 발신번호 등록
- `GET /api/sender-numbers/[id]` - 발신번호 상세
- `PUT /api/sender-numbers/[id]` - 발신번호 수정
- `DELETE /api/sender-numbers/[id]` - 발신번호 삭제
- `POST /api/sender-numbers/[id]/set-default` - 기본 설정

### 네이버 통합 (1개)

- `GET /api/naver/templates` - 네이버 톡톡 템플릿

### 결제 (4개)

- `POST /api/payment/confirm` - 결제 확인
- `POST /api/payment/nicepay/request` - NicePay 요청
- `POST /api/payment/nicepay/approve` - NicePay 승인
- `POST /api/payment/nicepay/return` - NicePay 리턴

### 관리자 - 세금계산서 (7개)

- `GET /api/tax-invoices` - 세금계산서 목록
- `GET /api/tax-invoices/excel` - 엑셀 다운로드
- `GET /api/admin/tax-invoices` - 관리자 목록
- `GET /api/admin/tax-invoices/[id]` - 상세
- `POST /api/admin/tax-invoices` - 발행
- `PUT /api/admin/tax-invoices/[id]` - 수정
- `POST /api/admin/tax-invoices/export` - 엑셀 내보내기
- `POST /api/admin/tax-invoices/upload` - 파일 업로드
- `GET /api/admin/tax-invoices/template` - 템플릿

### 거래내역 (2개)

- `GET /api/transactions` - 거래 내역
- `GET /api/settlements` - 정산 내역

### 문의 (5개)

- `GET /api/inquiries` - 문의 목록
- `POST /api/inquiries` - 문의 등록
- `GET /api/inquiries/[id]` - 문의 상세
- `PUT /api/inquiries/[id]` - 문의 수정
- `POST /api/inquiries/[id]/reply` - 답변 등록
- `GET /api/admin/inquiries` - 관리자 문의 목록
- `GET /api/admin/inquiries/[id]` - 관리자 문의 상세
- `POST /api/upload/inquiry` - 문의 파일 업로드

### FAQ (4개)

- `GET /api/faqs` - FAQ 목록
- `POST /api/faqs` - FAQ 생성
- `GET /api/faqs/[id]` - FAQ 상세
- `PUT /api/faqs/[id]` - FAQ 수정
- `DELETE /api/faqs/[id]` - FAQ 삭제
- `GET /api/faqs/max-order` - 최대 순서

### 공지사항 (2개)

- `GET /api/announcements` - 공지 목록
- `POST /api/announcements` - 공지 생성
- `GET /api/announcements/[id]` - 공지 상세
- `PUT /api/announcements/[id]` - 공지 수정
- `DELETE /api/announcements/[id]` - 공지 삭제

### 지역 데이터 (3개)

- `GET /api/locations/cities` - 시/도 목록
- `GET /api/locations/districts` - 시/군/구 목록
- `GET /api/locations/dongs` - 읍/면/동 목록

### 산업 분류 (2개)

- `GET /api/industries` - 산업 분류
- `GET /api/nts-industries` - 국세청 업종

### 추천인/리워드 (2개)

- `GET /api/referrals/dashboard` - 추천인 대시보드
- `GET /api/rewards` - 리워드 내역

### 관리자 - 포인트/설정 (11개)

- `POST /api/admin/point-charge` - 포인트 충전
- `POST /api/admin/point-charge/bulk` - 일괄 충전
- `GET /api/admin/point-status` - 포인트 현황
- `GET /api/admin/companies` - 사업자 정보
- `GET /api/admin/grade-settings` - 등급 설정
- `POST /api/admin/grade-settings` - 등급 설정 저장
- `GET /api/admin/grade-history` - 등급 이력
- `GET /api/admin/terms` - 약관 관리
- `POST /api/admin/terms` - 약관 등록
- `GET /api/admin/terms/versions` - 약관 버전
- `GET /api/admin/system-settings` - 시스템 설정
- `POST /api/admin/system-settings` - 시스템 설정 저장

### 기타 (6개)

- `GET /api/terms` - 약관 조회
- `POST /api/business-verification/verify-business-number` - 사업자번호 검증
- `POST /api/business-verification/submit` - 사업자 인증 제출
- `GET /api/site-settings` - 사이트 설정
- `GET /api/pricing-settings` - 가격 설정
- `GET /api/holidays` - 공휴일
- `GET /api/shared/calendar/[token]` - 공유 캘린더 조회
- `GET /api/cron/send-scheduled-messages` - Cron: 예약 발송
- `GET /api/sms-templates` - SMS 템플릿

---

## 🗂️ 전체 페이지 목록 (57개)

### 공개 페이지 (6개)
- `/` - 홈
- `/login` - 로그인
- `/signup` - 회원가입
- `/terms` - 이용약관
- `/privacy` - 개인정보처리방침
- `/support` - 고객지원

### 인증 페이지 (4개)
- `/auth/find-username` - 아이디 찾기
- `/auth/find-password` - 비밀번호 찾기
- `/auth/inicis/callback` - 본인인증 콜백
- `/auth/inicis/success` - 본인인증 성공

### 사용자 대시보드 (3개)
- `/my-site/advertiser/dashboard` - 메인 대시보드
- `/my-site/advertiser/profile` - 프로필 설정
- `/my-site/advertiser/business-verification` - 사업자 인증

### 메시지 발송 (1개)
- `/messages/send` - 통합 메시지 발송

### 예약 관리 (25개)
- `/messages/reservations` - 예약 홈
- `/messages/reservations/list` - 예약 목록
- `/messages/reservations/create` - 예약 생성
- `/messages/reservations/detail` - 예약 상세
- `/messages/reservations/edit` - 예약 수정
- `/messages/reservations/calendar` - 캘린더 뷰
- `/messages/reservations/calendar/shared` - 공유 캘린더
- `/messages/reservations/calendar/shared/create` - 공유 캘린더 생성
- `/messages/reservations/payments` - 결제 홈
- `/messages/reservations/payments/list` - 결제 목록
- `/messages/reservations/places` - 공간 목록
- `/messages/reservations/places/add` - 공간 추가
- `/messages/reservations/places/detail` - 공간 상세
- `/messages/reservations/places/edit` - 공간 수정
- `/messages/reservations/statistics` - 통계
- `/messages/reservations/message` - 메시지 홈
- `/messages/reservations/message/send` - 메시지 발송
- `/messages/reservations/message/list` - 메시지 목록
- `/messages/reservations/message/list/reserved` - 예약 메시지
- `/messages/reservations/message/templates` - 템플릿 관리
- `/messages/reservations/message/sender-contact` - 발신자 연락처
- `/messages/reservations/message/auto` - 자동 발송
- `/messages/reservations/message/auto/create` - 자동 규칙 생성
- `/messages/reservations/message/auto/edit/[id]` - 자동 규칙 수정

### 크레딧 관리 (1개)
- `/credit-management` - 크레딧 충전

### 타겟 마케팅 (1개)
- `/target-marketing` - AI 타겟 마케팅

### 영업사원 (4개)
- `/salesperson/profile` - 프로필
- `/salesperson/referrals` - 추천인 대시보드
- `/salesperson/invite` - 초대하기
- `/salesperson/organization` - 조직도

### 관리자 (11개)
- `/admin/campaigns` - 캠페인 관리
- `/admin/user-management` - 회원 관리
- `/admin/member-approval` - 회원 승인
- `/admin/statistics` - 통계
- `/admin/notifications` - 알림 관리
- `/admin/customer-support` - 고객지원
- `/admin/tax-invoices` - 세금계산서
- `/admin/point-charge-management` - 포인트 충전 관리
- `/admin/campaign-settings` - 캠페인 설정
- `/admin/system-settings` - 시스템 설정
- `/admin/campaign-industries` - 업종 관리

### 결제 (1개)
- `/payment/success` - 결제 완료

### 공유 (1개)
- `/shared/calendar/[token]` - 공유 캘린더

---

## 🧩 컴포넌트 구조 (77개)

### 관리자 컴포넌트 (8개)
- `AdminHeader.tsx` - 관리자 헤더
- `AdminSidebar.tsx` - 관리자 사이드바
- `BudgetSettings.tsx` - 예산 설정
- `CommissionSettings.tsx` - 수수료 설정
- `PricingSettings.tsx` - 가격 설정
- `GeneralSettings.tsx` - 일반 설정
- `DocumentSettings.tsx` - 문서 설정
- `MenuSettings.tsx` - 메뉴 설정

### 메시지 컴포넌트 (16개)

**탭 컴포넌트** (4개):
- `MessageSendTab.tsx` - 메시지 발송 탭
- `TemplateManagementTab.tsx` - 템플릿 관리 탭
- `ReservationManagementTab.tsx` - 예약 관리 탭
- `KakaoNaverRcsTab.tsx` - 카카오/네이버/RCS 탭

**SMS 관련** (1개):
- `SmsMessageContent.tsx` - SMS 메시지 편집

**카카오 관련** (6개):
- `KakaoMessageContent.tsx` - 카카오 메시지 편집
- `AlimtalkTab.tsx` - 알림톡 탭 (구버전)
- `FriendtalkTab.tsx` - 친구톡 탭 (구버전)
- `BrandTab.tsx` - 브랜드 탭 (구버전)
- `kakao/KakaoAlimtalkTab.tsx` - 카카오 알림톡
- `kakao/KakaoBrandTab.tsx` - 카카오 브랜드
- `kakao/KakaoChannelTab.tsx` - 카카오 채널

**네이버 관련** (3개):
- `NaverTalkContent.tsx` - 네이버 톡톡 편집
- `NaverTalkTalkTab.tsx` - 네이버 톡톡 탭
- `naver/NaverTalkIdTab.tsx` - 네이버 톡 ID 탭
- `naver/NaverTemplateTab.tsx` - 네이버 템플릿 탭

### 🆕 카카오 컴포넌트 (1개) - NEW v4.0
- `kakao/ChannelRegistrationModal.tsx` - 카카오 채널 등록 모달
  - 3단계 등록 프로세스
  - 카카오톡 인증 토큰 발급
  - 카테고리 선택
  - MTS 발신프로필 등록

### 모달 컴포넌트 (23개)

**주소록** (4개):
- `AddressBookModal.tsx` - 주소록 모달
- `AddContactModal.tsx` - 연락처 추가
- `CreateGroupModal.tsx` - 그룹 생성
- `AddressBookExcelModal.tsx` - 엑셀 업로드

**캠페인** (3개):
- `CampaignModal.tsx` - 캠페인 모달
- `CampaignDetailModal.tsx` - 캠페인 상세
- `RejectionReasonModal.tsx` - 거절 사유

**템플릿 & 콘텐츠** (7개):
- `TemplateModal.tsx` - 템플릿 모달
- `SaveTemplateModal.tsx` - 템플릿 저장
- `SaveContentModal.tsx` - 콘텐츠 저장
- `SimpleContentSaveModal.tsx` - 간단 저장
- `LoadContentModal.tsx` - 콘텐츠 불러오기
- `VariableSelectModal.tsx` - 변수 선택

**발신번호** (3개):
- `SenderNumberSelectModal.tsx` - 발신번호 선택
- `SenderNumberManageModal.tsx` - 발신번호 관리
- `SenderNumberRegistrationModal.tsx` - 발신번호 등록

**메시지** (4개):
- `ScheduledMessagesModal.tsx` - 예약 메시지
- `PreviewModal.tsx` - 미리보기
- `SendConfirmModal.tsx` - 발송 확인

**기타** (4개):
- `ExcelUploadModal.tsx` - 엑셀 업로드
- `TextUploadModal.tsx` - 텍스트 업로드
- `DateRangeModal.tsx` - 날짜 범위
- `LimitRemovalModal.tsx` - 제한 해제

### 프로필 컴포넌트 (5개)
- `MemberInfoTab.tsx` - 회원정보
- `BusinessInfoTab.tsx` - 사업자정보
- `PasswordTab.tsx` - 비밀번호 변경
- `SendingNumberTab.tsx` - 발신번호
- `TaxInvoiceTab.tsx` - 세금계산서

### 루트/코어 컴포넌트 (10개)
- `Layout.tsx` - 레이아웃
- `Navigation.tsx` - 네비게이션
- `Footer.tsx` - 푸터
- `RoleGuard.tsx` - 권한 가드
- `ConfirmDialog.tsx` - 확인 다이얼로그
- `SuccessModal.tsx` - 성공 모달
- `TermsModal.tsx` - 약관 모달
- `Pagination.tsx` - 페이지네이션
- `ReservationTooltip.tsx` - 예약 툴팁
- `ChannelSelectModal.tsx` - 채널 선택

### 크레딧 컴포넌트 (3개)
- `CreditBalance.tsx` - 잔액 표시
- `ChargeInput.tsx` - 충전 입력
- `PaymentModal.tsx` - 결제 모달

### 고객지원 컴포넌트 (3개)
- `AnnouncementTab.tsx` - 공지사항 탭
- `FaqTab.tsx` - FAQ 탭
- `ContactTab.tsx` - 문의 탭

### 타겟 마케팅 컴포넌트 (3개)
- `TargetMarketingDetail.tsx` - 타겟 마케팅 상세
- `NumberedParagraph.tsx` - 번호 매긴 단락
- `StructuredRecommendationTable.tsx` - 추천 테이블

### 기타 컴포넌트 (5개)
- `CampaignManagementTab.tsx` - 캠페인 관리 탭
- `ApprovalRequestComplete.tsx` - 승인 요청 완료
- `GeneralSignupForm.tsx` - 일반 회원가입 폼
- `SalespersonDashboard.tsx` - 영업사원 대시보드
- `TermsLayout.tsx` - 약관 레이아웃

---

## 📚 라이브러리 & 서비스 레이어

### Core 라이브러리 (16개)

**API & 네트워크** (5개):
1. `api.ts` - API 베이스 설정, fetch wrapper
2. `apiClient.ts` - 타입 안전 HTTP 클라이언트
3. `apiMiddleware.ts` - JWT 갱신 미들웨어, 401 처리
4. `apiResponse.ts` - 응답 포맷팅 유틸
5. `mtsApi.ts` - MTS SMS API 통합 (SMS/LMS/MMS/카카오/네이버) - 1100+줄

**메시징** (3개):
6. `messageSender.ts` - 메시지 발송 로직
7. `notificationService.ts` - 알림 트리거 및 로깅
8. `emailUtils.ts` - 이메일 발송 (nodemailer)

**데이터베이스 & 스토리지** (2개):
9. `supabase.ts` - Supabase 클라이언트 초기화
10. `storage.ts` - 파일 업로드/다운로드

**보안** (2개):
11. `seedCrypto.ts` - SEED 암호화
12. `kisaSeed.ts` - KISA 보안 모듈

**비즈니스 로직** (2개):
13. `campaignDraft.ts` - 캠페인 초안 관리
14. `termsService.ts` - 약관 버전 관리

**기타** (2개):
15. `targetOptions.ts` - 타겟 마케팅 옵션
16. `utils.ts` - 범용 헬퍼 함수

### 서비스 레이어 (3개)

1. `templateService.ts` - 템플릿 CRUD 비즈니스 로직
2. `campaignService.ts` - 캠페인 비즈니스 로직
3. `uploadService.ts` - 파일 업로드 처리

### 유틸리티 (10개)

1. `authUtils.ts` - JWT 토큰 검증 (`validateAuthWithSuccess`)
2. `dateUtils.ts` - 날짜 포맷팅, 변환
3. `formatUtils.ts` - 숫자, 전화번호, 통화 포맷
4. `idUtils.ts` - UUID 생성
5. `validationUtils.ts` - 입력 검증 (이메일, 전화번호 등)
6. `messageVariables.ts` - 메시지 변수 치환 (`#[변수명]`)
7. `messageTemplateParser.ts` - 템플릿 파싱
8. `smsNotification.ts` - SMS 알림 헬퍼
9. `storageUtils.ts` - 파일 스토리지 헬퍼
10. `kakaoApi.ts` - 카카오 API 헬퍼

### 🆕 커스텀 훅 (3개) - +2 NEW v4.0

1. `useNotificationUtils.tsx` - 알림 포맷팅 훅
2. `useTargetMarketing.ts` - **NEW**: AI 타겟 마케팅 훅 (18KB)
3. `useTermsContent.ts` - **NEW**: 약관 내용 관리 훅

---

## 🔄 주요 비즈니스 로직 플로우

### 1. 카카오 발신프로필 등록 플로우 (NEW v4.0)

```
사용자 → "카카오 채널 등록" 버튼 클릭
   ↓
ChannelRegistrationModal 열림 (Step 1)
   ↓
Step 1: 카카오톡 채널 정보 입력
   ├─ Yellow ID (@channel_id)
   ├─ 관리자 전화번호
   └─ 카테고리 코드 선택 (GET /api/kakao/categories)
   ↓
"인증 토큰 요청" 버튼 클릭
   ↓
POST /api/kakao/sender/token
   ├─ Body: { yellowId, phoneNumber, categoryCode }
   ├─ MTS API 호출: /mts/api/sender/token
   └─ 카카오톡으로 인증 토큰 발송 (6자리)
   ↓
Step 2: 인증 토큰 입력
   ├─ 사용자가 카카오톡에서 받은 토큰 입력
   └─ "등록" 버튼 클릭
   ↓
POST /api/kakao/sender/register
   ├─ Body: { token, phoneNumber, yellowId, categoryCode }
   ├─ MTS API 호출: /mts/api/create/new/senderKey
   ├─ 발신프로필 키(sender_key) 발급
   └─ DB 저장: kakao_sender_profiles 테이블
   ↓
Step 3: 완료
   ├─ 성공 메시지 표시
   └─ 모달 닫힘
```

### 2. MTS API 메시지 발송 플로우

```
사용자 → 메시지 작성 (SMS/LMS/MMS/카카오/네이버)
   ↓
프론트엔드 → POST /api/messages/send
   ↓
API Route → JWT 검증 (validateAuthWithSuccess)
   ↓
사용자 잔액 확인
   ↓
MTS API 호출 (mtsApi.ts)
   ↓
   ├─ SMS/LMS/MMS: sendSmsLmsMms()
   ├─ 카카오 알림톡: sendKakaoAlimtalk()
   ├─ 카카오 친구톡: sendKakaoFriendtalk()
   └─ 네이버 톡톡: sendNaverTalk()
   ↓
성공 시:
   ├─ message_logs 테이블에 로그 저장
   ├─ transactions 테이블에 사용 내역 기록
   ├─ users.balance 차감
   └─ 성공 응답 반환
   ↓
실패 시:
   ├─ 에러 로그 저장
   └─ 에러 응답 반환
```

### 3. 캠페인 승인 워크플로우

```
1. 사용자 캠페인 생성
   ↓
2. POST /api/campaigns
   ↓
3. 예산 검증 및 예약 (reserve 트랜잭션)
   ↓
4. campaigns 테이블 저장 (status='PENDING_APPROVAL')
   ↓
5. 알림 트리거 (campaign.created) → 관리자 SMS
   ↓
6. 관리자 승인 대기
   ↓
7. 관리자 승인/거부
   ├─ 승인: POST /api/admin/campaigns/[id]/approve
   │   ↓
   │   예약 해제 (unreserve) + 실제 사용 (usage)
   │   ↓
   │   status = 'APPROVED'
   │   ↓
   │   알림 트리거 (campaign.approved) → 사용자 SMS
   │   ↓
   │   캠페인 자동 시작
   │
   └─ 거부: POST /api/admin/campaigns/[id]/reject
       ↓
       예약 해제 (unreserve) - 잔액 복구
       ↓
       status = 'REJECTED'
       ↓
       사용자 알림
```

### 4. 예약 시스템 자동 발송

```
Cron Job (매분) → GET /api/reservations/auto-send-check
   ↓
1. auto_rules 테이블 조회 (is_active=true)
   ↓
2. 각 규칙에 대해:
   ↓
   bookings 테이블에서 조건 매칭
   ├─ 예약 3일 전 알림
   ├─ 예약 1일 전 알림
   ├─ 예약 당일 알림
   └─ 예약 후 감사 메시지
   ↓
3. 발송 대상 발견 시:
   ↓
   message_templates에서 템플릿 조회
   ↓
   변수 치환 (예약자명, 날짜, 공간명 등)
   ↓
   MTS API로 메시지 발송
   ↓
   scheduled_messages 테이블에 기록
   ↓
   message_logs에 로그 저장
```

### 5. 사업자 인증 플로우

```
1. 사용자 사업자정보 입력
   ↓
2. POST /api/business-verification/verify-business-number
   ↓
3. 공공데이터 API 호출 (사업자등록번호 검증)
   ↓
   성공 → 4단계
   실패 → 에러 반환
   ↓
4. 사업자등록증 파일 업로드
   ↓
5. POST /api/business-verification/submit
   ↓
6. users 테이블 업데이트:
   ├─ company_info (JSONB)
   ├─ documents (JSONB)
   └─ approval_status = 'PENDING'
   ↓
7. notifications 테이블에 알림 저장
   ↓
8. 알림 트리거 (company.registered) → 관리자 SMS
   ↓
9. 관리자 검토 및 승인
   ↓
10. approval_status = 'APPROVED'
   ↓
11. 사용자 알림
```

### 6. JWT 인증 및 갱신

```
클라이언트 요청 (with Access Token)
   ↓
API Route → validateAuthWithSuccess()
   ↓
JWT 토큰 검증
   ├─ 유효 → 다음 단계
   └─ 만료/무효 → 401 에러
   ↓
401 에러 시 apiMiddleware.ts 동작:
   ↓
1. Refresh Token으로 갱신 요청
   ↓
   POST /api/users/refresh
   ↓
2. Refresh Token 검증
   ├─ 유효 → 새 Access Token 발급
   └─ 만료 → 로그인 페이지로 리다이렉트
   ↓
3. 새 Access Token으로 원래 요청 재시도
   ↓
4. 성공 시 응답 반환
```

---

## 🔐 보안 및 인증

### JWT 토큰 구조

**Access Token (1시간)**:
```typescript
{
  userId: number,
  username: string,
  email: string,
  name: string,
  phoneNumber: string,
  role: string, // 'USER' | 'ADVERTISER' | 'SALESPERSON' | 'ADMIN'
  approval_status: string,
  exp: number // 1시간 후
}
```

**Refresh Token (7일)**:
```typescript
{
  userId: number,
  username: string,
  email: string,
  name: string,
  phoneNumber: string,
  type: "refresh",
  exp: number // 7일 후
}
```

### 역할 기반 접근 제어 (RBAC)

| 역할 | 설명 | 접근 권한 |
|------|------|----------|
| **USER** | 일반 사용자 | 메시지 발송, 예약 관리 |
| **ADVERTISER** | 광고주 (승인된 사용자) | 캠페인 생성, 타겟 마케팅 |
| **SALESPERSON** | 영업사원 | 추천인 관리, 수수료 조회 |
| **ADMIN** | 관리자 | 전체 시스템 관리 |

### 권한 검증 패턴

**컴포넌트 레벨**:
```typescript
<RoleGuard allowedRoles={['ADMIN', 'SALESPERSON']}>
  <AdminDashboard />
</RoleGuard>
```

**API 레벨**:
```typescript
const authResult = validateAuthWithSuccess(request);
if (!authResult.isValid || !authResult.userInfo) {
  return authResult.errorResponse; // 401
}

const { role } = authResult.userInfo;
if (role !== 'ADMIN') {
  return NextResponse.json(
    { error: '권한이 없습니다' },
    { status: 403 }
  );
}
```

### Supabase RLS (Row Level Security)

- **Storage Buckets**: 사용자별 파일 접근 제어
- **Public Buckets**: 템플릿 이미지, 공개 파일
- **Private Buckets**: 사업자등록증, 세금계산서

---

## 🗄️ 데이터베이스 스키마

### 핵심 테이블

#### users (사용자)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20),
  role VARCHAR(20) DEFAULT 'USER',
  approval_status VARCHAR(20) DEFAULT 'PENDING',
  is_active BOOLEAN DEFAULT true,
  balance INTEGER DEFAULT 0,
  last_login_at TIMESTAMP,
  referral_code VARCHAR(20) UNIQUE,
  referred_by INTEGER REFERENCES users(id),
  payment_mode VARCHAR(20),

  -- JSONB 필드
  company_info JSONB,
  tax_invoice_info JSONB,
  documents JSONB,
  agreement_info JSONB,

  -- SNS 연동
  kakao_user_id VARCHAR(255),
  naver_user_id VARCHAR(255),
  google_user_id VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 🆕 kakao_sender_profiles (카카오 발신프로필) - NEW v4.0
```sql
CREATE TABLE kakao_sender_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,

  -- MTS 발신프로필 정보
  sender_key VARCHAR(40) UNIQUE NOT NULL,
  yellow_id VARCHAR(50) NOT NULL,
  channel_name VARCHAR(100),

  -- 등록 정보
  phone_number VARCHAR(20) NOT NULL,
  category_code VARCHAR(11),

  -- 상태 정보
  status VARCHAR(1) DEFAULT 'A',  -- A/C/B/E/D
  block BOOLEAN DEFAULT false,
  dormant BOOLEAN DEFAULT false,
  profile_status VARCHAR(1) DEFAULT 'A',

  -- 추가 정보
  bizchat BOOLEAN DEFAULT false,
  brandtalk BOOLEAN DEFAULT false,
  brand_message BOOLEAN DEFAULT false,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### campaigns (캠페인)
```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  template_id INTEGER REFERENCES message_templates(id),
  status VARCHAR(50) DEFAULT 'PENDING_APPROVAL',

  -- 예산
  budget INTEGER DEFAULT 0,
  campaign_budget INTEGER DEFAULT 0,
  daily_ad_spend_limit INTEGER,

  -- 발송 정책
  send_policy_type VARCHAR(20),
  validity_start_date DATE,
  validity_end_date DATE,
  scheduled_send_date DATE,
  scheduled_send_time TIME,

  -- 타겟 조건
  target_age_groups TEXT[],
  target_locations_detailed JSONB,
  card_amount_max INTEGER,
  card_time_start TIME,
  card_time_end TIME,
  target_industry_top_level VARCHAR(100),
  target_industry_specific VARCHAR(100),
  gender_ratio JSONB,
  desired_recipients TEXT,

  -- 비용
  unit_cost INTEGER DEFAULT 0,
  estimated_total_cost INTEGER DEFAULT 0,

  -- 발송 현황
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,

  -- 기타
  expert_review_requested BOOLEAN DEFAULT false,
  expert_review_notes TEXT,
  message_template TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### transactions (트랜잭션)
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL,  -- charge, usage, refund, penalty, reserve, unreserve
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  reference_id VARCHAR(255),
  metadata JSONB,
  status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### message_logs (메시지 로그)
```sql
CREATE TABLE message_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message_type VARCHAR(20) NOT NULL,  -- SMS, LMS, MMS, KAKAO_ALIMTALK, KAKAO_FRIENDTALK, NAVER_TALK
  sender_number VARCHAR(20) NOT NULL,
  recipient_number VARCHAR(20) NOT NULL,
  content TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  cost INTEGER DEFAULT 0,
  mts_msg_id VARCHAR(100),  -- MTS API 메시지 ID
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### sms_notification_templates (SMS 알림 템플릿)
```sql
CREATE TABLE sms_notification_templates (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL,  -- 'USER' | 'ADMIN'
  message_type VARCHAR(10) NOT NULL,     -- 'SMS' | 'LMS'
  subject VARCHAR(100),
  content_template TEXT NOT NULL,
  variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### reservations_bookings (예약)
```sql
CREATE TABLE reservations_bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  space_id INTEGER NOT NULL REFERENCES reservations_spaces(id),
  customer_name VARCHAR(100) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  channel VARCHAR(50),
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚀 배포 및 환경 설정

### 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx

# JWT
JWT_SECRET=xxx

# MTS API (SMS/MMS/카카오/네이버)
MTS_AUTH_CODE=xxx
MTS_API_URL=https://api.mtsco.co.kr
MTS_TEMPLATE_API_URL=https://talks.mtsco.co.kr

# OpenAI
OPENAI_API_KEY=xxx

# 공공데이터 API
ODCLOUD_SERVICE_KEY=xxx

# NicePay
NICEPAY_CLIENT_ID=xxx
NICEPAY_SECRET_KEY=xxx

# 테스트
TEST_CALLING_NUMBER=010-1234-5678

# 기타
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

### Vercel 배포

**자동 배포**:
- Git push → Vercel 자동 빌드 & 배포
- 환경 변수: Vercel Dashboard에서 설정

**Cron Jobs** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/send-scheduled-messages",
      "schedule": "* * * * *"
    },
    {
      "path": "/api/messages/scheduled-send-check",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/reservations/auto-send-check",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

---

## 📝 최근 업데이트 히스토리

### v4.0 (2025-10-29): 카카오 발신프로필 관리 시스템 추가 ✅

**신규 기능**:
- ✅ 카카오 채널 등록 모달 (3단계 프로세스)
- ✅ 카카오 인증 토큰 발급 API
- ✅ MTS 발신프로필 등록 API
- ✅ 카테고리 코드 조회 API
- ✅ 발신프로필 목록 조회 API
- ✅ 커스텀 훅 2개 추가 (useTargetMarketing, useTermsContent)

**변경 통계**:
- 총 파일: 343개 → 348개 (+5개)
- API 엔드포인트: 160개 → 163개 (+3개)
- 컴포넌트: 75개 → 77개 (+2개)
- 커스텀 훅: 1개 → 3개 (+2개)

### v3.0 (2025-01-28): MTS API 전환 완료 (Phase 0-10) ✅

| Phase | 완료율 | 내용 |
|-------|--------|------|
| **Phase 0-2** | ✅ 100% | SMS/LMS/MMS 발송 (MTS API) |
| **Phase 3-5** | ✅ 100% | 이미지 업로드, 예약 발송 |
| **Phase 6** | ✅ 100% | 카카오 알림톡 |
| **Phase 7** | ✅ 100% | 카카오 친구톡 V2 |
| **Phase 8** | ✅ 100% | 네이버 톡톡 |
| **Phase 9** | ✅ 100% | 카카오 브랜드 메시지 |
| **Phase 10** | ✅ 100% | 카카오/네이버 예약 발송 |

**전환 상세**:
- 총 53개 파일 완료 (100%)
- 새로운 라이브러리: `src/lib/mtsApi.ts` (1100+줄)
- Naver SENS 관련 코드 완전 제거
- 모든 발송 API 엔드포인트 MTS로 전환
- 비용: SMS 25원, LMS 50원, MMS 100원, 알림톡 13원, 친구톡 20원, 톡톡 13원/20원, 브랜드 20원

### Phase 3 (2025-01-24): SMS 알림 시스템
- ✅ SMS 알림 템플릿 관리
- ✅ 5가지 이벤트 알림 (회원가입, 사업자인증, 캠페인생성/승인, 발신번호등록)
- ✅ 관리자 알림 페이지 (템플릿/로그)
- ✅ 변수 치환 시스템 (`{{변수명}}`)
- ✅ ON/OFF 토글 기능

### Phase 2 (2025-01-21~23): 캠페인 업종 관리
- ✅ 업종 관리 시스템 (정식/커스텀)
- ✅ 차등 단가 시스템 (업종별/메시지타입별)
- ✅ 관리자 업종 관리 페이지

### Phase 1 (2024-12~2025-01): 기본 시스템 구축
- ✅ Next.js 15 + Supabase 아키텍처
- ✅ JWT 인증 시스템
- ✅ 예약 관리 시스템 (40개 API)
- ✅ AI 타겟 마케팅 (OpenAI)
- ✅ 추천인 시스템
- ✅ 결제 시스템 (NicePay)

---

## 📊 최종 요약

MTS Message는 **Next.js 15 + Supabase + JWT 인증 + MTS API**를 기반으로 한 **엔터프라이즈급 종합 메시징 플랫폼**입니다.

### 핵심 기능

1. **통합 메시징** - SMS/LMS/MMS, 카카오 알림톡/친구톡, 네이버 톡톡 (MTS API)
2. **🆕 카카오 발신프로필 관리** - 채널 등록, 인증, MTS 연동 자동화
3. **예약 관리 시스템** - 공간 예약, 자동 발송 규칙, 캘린더, 21개 API
4. **AI 타겟 마케팅** - OpenAI 기반 캠페인 추천
5. **캠페인 관리** - 승인 워크플로우, 예산 관리, 차등 단가
6. **다중 역할** - USER, ADVERTISER, SALESPERSON, ADMIN
7. **추천인 시스템** - 2단계 수수료, 리워드 추적
8. **결제 시스템** - NicePay 연동, 크레딧 충전
9. **알림 자동화** - SMS 알림 템플릿, 이벤트 기반
10. **관리자 대시보드** - 통계, 승인, 설정, 11개 페이지
11. **모바일 대응** - 반응형 디자인

### 아키텍처 특징

- **Service-Oriented**: 비즈니스 로직 분리 (services/)
- **Type-Safe**: TypeScript 100% 적용
- **API-First**: 163개 REST API 엔드포인트
- **Secure**: JWT + RLS + 역할 기반 권한
- **Scalable**: Context API + 폴링 기반 상태 관리
- **Modular**: 77개 재사용 가능 컴포넌트

### 기술적 하이라이트

- **348개** TypeScript/TSX 파일
- **163개** API 엔드포인트
- **57개** 페이지 라우트
- **77개** React 컴포넌트
- **16개** Core 라이브러리
- **4개** Context Providers
- **10개** Utility 모듈
- **3개** Service 레이어
- **3개** 커스텀 훅

### MTS API 통합 현황

| 기능 | 상태 | 비용 |
|------|------|------|
| SMS/LMS/MMS | ✅ 완료 | 25/50/100원 |
| 카카오 알림톡 | ✅ 완료 | 13원 |
| 카카오 친구톡 | ✅ 완료 | 20원 |
| 네이버 톡톡 | ✅ 완료 | 13원/20원 |
| 카카오 브랜드 | ✅ 완료 | 20원 |
| **카카오 발신프로필 관리** | ✅ **NEW v4.0** | - |
| 예약 발송 (모든 타입) | ✅ 완료 | - |

---

## 📝 v4.3 변경사항 (2025-11-03)

### 카카오 브랜드 메시지 완전 재구현

**개요**: BrandTab 컴포넌트를 완전히 재작성하여 템플릿 기반 발송 및 Rich UI 구조 적용

#### 1. BrandTab 완전 재작성 ✅
**파일**: `src/components/messages/BrandTab.tsx` (579줄)

**주요 변경사항**:
- **이전**: 수동 입력 방식 (messageType 선택 + 메시지 직접 입력)
- **현재**: 템플릿 선택 방식 (AlimtalkTab과 동일한 워크플로우)

**새로운 UI 구조** (8개 섹션):
1. 카카오 채널 + 브랜드 템플릿 선택 (좌우 분할)
2. 템플릿 미리보기 (8가지 형식 버튼)
   - 텍스트형, 이미지형, 와이드형, 와이드리스트형
   - 캐러셀피드형, 커머스형, 캐러셀커머스형, 프리미엄동영상
3. 템플릿 정보 + 예시 이미지 (좌우 분할)
4. 전체수신번호 + 수신대상 정보 (겹치는 원형 차트 + 탭)
5. 문구 치환 (변수 입력)
6. 전환 발송 설정 (N/S/L/M 버튼)
7. 수신자 정보 (수신자 수 + 예상 비용)
8. 발송 버튼

**핵심 함수**:
- `loadBrandTemplates()` (127-139줄): 발신 프로필 선택 시 템플릿 자동 조회
- `handleSendBrandMessage()` (147-230줄): MTS API 발송 처리

#### 2. kakaoApi.ts 함수 추가 ✅
**파일**: `src/utils/kakaoApi.ts`

**신규 추가된 타입 및 함수**:
```typescript
// BrandTemplate 타입 (72-86줄)
export interface BrandTemplate {
  template_code: string;
  template_name: string;
  template_content: string;
  message_type: 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' |
                'CAROUSEL_FEED' | 'COMMERCE' | 'CAROUSEL_COMMERCE' | 'PREMIUM_VIDEO';
  status: string;
  inspection_status?: string;
  buttons?: Array<...>;
}

// fetchBrandTemplates() (267-304줄)
// - 발신 프로필별 브랜드 템플릿 목록 조회
// - MTS API 템플릿 조회 엔드포인트 호출
// - 브랜드 메시지 타입 필터링

// sendBrandMessage() (309-334줄)
// - 브랜드 메시지 발송 래퍼 함수
// - /api/messages/kakao/brand/send 호출
// - 발송 결과 처리
```

#### 3. mtsApi.ts 상태 확인 ✅
**파일**: `src/lib/mtsApi.ts` (총 1562줄)

**브랜드 메시지 관련 함수**:
- `sendKakaoBrand()` (1073-1220줄)
  - MTS API 브랜드 메시지 발송 함수
  - 템플릿 코드, message_type, attachment 지원
  - 전환 발송 기능 (N/S/L/M)

#### 4. 워크플로우 변경

**이전 워크플로우**:
```
1. 발신 프로필 선택
2. 메시지 타입 수동 선택 (TEXT/IMAGE/WIDE 등)
3. 메시지 내용 직접 입력
4. 템플릿 코드 입력
5. 발송
```

**현재 워크플로우** ✅:
```
1. 발신 프로필 선택
2. 브랜드 템플릿 자동 조회
3. 템플릿 선택 (message_type, 내용 자동 표시)
4. 템플릿 미리보기 확인 (8가지 형식)
5. 수신대상 정보 확인 (원형 차트)
6. 필요 시 변수 치환
7. 전환 발송 설정
8. 발송
```

#### 5. 빌드 상태 ✅
- **빌드 결과**: 성공
- **타입 에러**: 없음
- **경고**: 없음
- **총 줄 수**: BrandTab.tsx 579줄
- **테스트 상태**: UI 구현 완료, MTS API 연동 완료

#### 6. 문서 업데이트 완료 ✅
- `MTS_API_사용_현황_템플릿.txt` v2.0
- `MTS_API_코드_위치_안내.txt` v2.0
- `MTS_MESSAGE_코드베이스_분석_v4.1.md` v4.3 (이 문서)

### MTS API 통합 현황 (업데이트)

| 기능 | 상태 | 비용 | 비고 |
|------|------|------|------|
| SMS/LMS/MMS | ✅ 완료 | 25/50/100원 | - |
| 카카오 알림톡 | ✅ 완료 | 13원 | - |
| 카카오 친구톡 V2 | ✅ 완료 | 20원 | imageLink 지원 |
| 네이버 톡톡 | ✅ 완료 | 13원/20원 | 스마트알림/광고 |
| 카카오 브랜드 | ✅ 완료 | 20원 | ✅ **v4.3 재구현** |
| 카카오 발신프로필 관리 | ✅ 완료 | - | v4.0 추가 |
| 예약 발송 (모든 타입) | ✅ 완료 | - | - |

---

**문서 버전**: v4.3 (Brand Message Complete Redesign)
**최종 업데이트**: 2025-11-03
**작성자**: Claude Code Analysis
**변경사항 (v4.3)**:
- 카카오 브랜드 메시지 완전 재구현 ✅
  - BrandTab.tsx 완전 재작성 (579줄)
  - fetchBrandTemplates(), sendBrandMessage() 추가
  - Rich UI 구조 적용 (8개 섹션)
  - 템플릿 기반 발송 워크플로우로 전환
- kakaoApi.ts: BrandTemplate 타입 및 함수 2개 추가
- 모든 관련 문서 업데이트 완료 (v2.0)

**이전 버전 (v4.0)**:
- 카카오 발신프로필 관리 시스템 추가 (API 5개, 컴포넌트 1개)
- 커스텀 훅 2개 추가 (useTargetMarketing, useTermsContent)
- 전체 코드베이스 재분석 및 통계 업데이트
- 총 348개 파일, 163개 API 엔드포인트, 77개 컴포넌트

이 문서는 실제 코드베이스의 **완전한 재분석**을 기반으로 작성되었으며, 현재 프로젝트의 모든 파일, API, 페이지, 컴포넌트를 포함합니다.

---

## 🆕 v5.1 주요 변경사항 (2025-01-04)

### 1. 변수 형식 통일 작업

#### 목적
- 모든 메시지 발송 타입에서 일관된 변수 형식 사용
- 사용자 경험 개선 및 코드 유지보수성 향상
- MTS API 알림톡 표준 형식으로 통일

#### 변경 사항

**변수 형식 표준화**:
- 기존: SMS/MMS/친구톡 `#[변수명]`, 알림톡 `#{변수명}` (불일치)
- 변경: 모든 메시지 타입에서 `#{변수명}` 통일 (MTS API 표준)
- 표준 변수: `#{이름}`, `#{전화번호}`, `#{오늘날짜}`, `#{현재시간}`, `#{회사명}` 등

**유틸리티 함수 업데이트**:
- 파일: `src/utils/messageVariables.ts`
- 새로운 상수: `VARIABLE_PATTERN = /#{[^}]+}/g`
- 새로운 함수:
  - `countVariables(text: string): number` - 변수 개수 계산
  - `extractVariables(text: string): string[]` - 변수 목록 추출
  - `migrateVariableFormat(text: string): string` - 구 형식 → 신 형식 변환
- 기존 함수 업데이트:
  - `replaceVariables()` - `#{변수명}` 형식 치환
  - `getUnreplacedVariables()` - 패턴 업데이트

**UI 컴포넌트 업데이트**:
1. `SmsMessageContent.tsx` (Line 181, 214)
   - Placeholder 예시: `#{이름}님 #{시간}시 방문 예약입니다.`
   - 변수 카운팅 정규식: `/#{[^}]+}/g`

2. `FriendtalkTab.tsx` (Line 54, 88, 384)
   - 변수 카운팅 정규식 업데이트
   - 치환문구 버튼: `#{변수명}` 삽입
   - Placeholder 예시 업데이트

3. `AlimtalkTab.tsx` (Line 305)
   - 변수 개수 자동 표시 기능 추가
   - 템플릿 선택 시 변수 카운팅

4. `BrandTab.tsx` (Line 562)
   - 변수 개수 자동 표시 기능 추가
   - 템플릿별 변수 카운팅

#### 데이터베이스 마이그레이션

**마이그레이션 완료**:
- 테이블: `sms_message_templates`
- 변환 레코드: 1개
- 변환 내용: `#[변수명]` → `#{변수명}`
- 방법: Supabase MCP를 통한 SQL 실행
- SQL: `UPDATE sms_message_templates SET content = regexp_replace(content, '#\[([^\]]+)\]', '#{\1}', 'g')`

**마이그레이션 스크립트**:
- 파일: `scripts/migrate-variable-format.ts`
- 기능: TypeScript 기반 마이그레이션 스크립트
- 문서: `scripts/README-MIGRATION.md`

#### 변수 시스템 구분 확인

프로젝트에는 3가지 독립적인 변수 시스템이 존재:

1. **일반 메시지** - `#{변수명}` ✅ 통일 완료
   - SMS/MMS, 카카오(알림톡/친구톡/브랜드), 네이버 톡톡
   - 유틸리티: `messageVariables.ts`

2. **예약 시스템** - `{{변수명}}` (독립 시스템)
   - `/messages/reservations` 하위 모든 페이지
   - 유틸리티: `messageTemplateParser.ts`
   - 변수: `{{고객명}}`, `{{공간명}}`, `{{예약날짜}}` 등
   - 변경 불필요 (의도된 설계)

3. **시스템 알림** - `{{변수명}}` (내부 시스템)
   - 테이블: `sms_notification_templates`
   - 변수: `{{companyName}}`, `{{userName}}` 등
   - 변경 불필요 (내부 시스템)

#### 테스트 항목

**변수 치환 기능 테스트**:
- [ ] SMS/MMS 탭에서 `#{이름}` 형식으로 변수 삽입
- [ ] 카카오 친구톡 치환문구 버튼 동작 확인
- [ ] 카카오 알림톡 템플릿 변수 개수 표시
- [ ] 카카오 브랜드 템플릿 변수 개수 표시
- [ ] 변수 실행 시 정상 치환 확인 (#{이름} → 실제 이름)

#### 영향받는 파일 목록

**수정된 파일** (5개):
- `src/utils/messageVariables.ts` - 유틸리티 함수 추가/업데이트
- `src/components/messages/SmsMessageContent.tsx` - SMS/MMS 변수 형식 변경
- `src/components/messages/FriendtalkTab.tsx` - 친구톡 변수 형식 변경
- `src/components/messages/AlimtalkTab.tsx` - 알림톡 변수 카운팅 추가
- `src/components/messages/BrandTab.tsx` - 브랜드 변수 카운팅 추가

**새로 생성된 파일** (2개):
- `scripts/migrate-variable-format.ts` - 마이그레이션 스크립트
- `scripts/README-MIGRATION.md` - 마이그레이션 가이드

**업데이트된 문서** (4개):
- `MTS_API_사용_현황_템플릿.txt` v3.1
- `MTS_API_통합_테스트_가이드.md` v2.1
- `MTS_MESSAGE_코드베이스_분석_v4.1.md` v5.1 (이 문서)
- `VARIABLE_FORMAT_MIGRATION_SUMMARY.md` (신규)

#### 통계 업데이트

| 구분 | 개수 | 변경사항 |
|------|------|---------|
| 유틸리티 함수 | 11개 | - |
| 수정된 컴포넌트 | 4개 | SmsMessage, Friendtalk, Alimtalk, Brand |
| 마이그레이션 스크립트 | 1개 | 신규 생성 |
| 문서 업데이트 | 4개 | 버전 업데이트 |

---

**문서 버전**: v5.1 (Variable Format Unification)
**최종 업데이트**: 2025-01-04
**작성자**: Claude Code Analysis
**변경사항 (v5.1)**:
- 변수 형식 통일 작업 완료 ✅
  - 모든 메시지 타입에서 `#{변수명}` 형식 사용
  - UI 컴포넌트 4개 업데이트
  - 유틸리티 함수 개선
  - 데이터베이스 마이그레이션 완료
  - 변수 시스템 3종 확인 및 구분
- 문서 4개 업데이트 (v3.1, v2.1, v5.1)

---

## 🆕 v5.2 주요 변경사항 (2025-11-06)

### 1. 카카오 브랜드 메시지 에러 해결 진행 중

#### 배경
브랜드 메시지 구현 완료 후 실제 발송 테스트 중 메시지가 전송되지 않는 문제 발견. MTS API 응답 코드는 성공(0000)을 반환하지만, 실제 발송 결과 조회 시 에러 코드 발생.

#### 에러 해결 과정

**Phase 1: 발송 결과 조회 API 구현** ✅
- 파일: `src/app/api/messages/kakao/brand/result/route.ts` (신규 생성)
- 기능: MTS API `/message/kakao/brand/report/send_result` 엔드포인트 호출
- 파라미터:
  - `senderKey`: 발신 프로필 키 (필수)
  - `sendDate`: 발송 일자 YYYYMMDD 형식 (필수)
  - `page`, `count`: 페이징 옵션
- 결과: 각 메시지의 `result_code` 확인 가능 (5분 이상 소요)

**Phase 2: 에러 코드 분석 및 파라미터 조정**

**시도 1**: `targeting: 'I'`, `send_mode: '2'`
- MTS API 응답: `code: '0000'` (성공)
- 발송 결과: `result_code: '1030'` (InvalidParameterException)
- 분석: 파라미터 오류로 판단

**시도 2**: `targeting` 제거, `send_mode: '3'`
- MTS API 응답: `code: 'ER99'` (MessageRegistException)
- 에러 메시지: "전송메시지 등록(DB)에 실패하였습니다"
- 분석: `targeting`은 필수 파라미터임을 확인 (PDF 3-4페이지)

**시도 3**: `targeting: 'I'`, `send_mode: '3'`
- MTS API 응답: `code: '0000'` (성공)
- 발송 결과: `result_code: '1030'` (InvalidParameterException)
- 분석: `targeting: 'I'` (전체+채널친구)는 수신자가 채널 친구여야 함

**시도 4** ⬅️ **현재 상태**:
- 파라미터: `targeting: 'M'`, `send_mode: '3'`
- MTS API 응답: `code: '0000'` (성공)
- 발송 결과: `result_code: '1028'`
- 문제: **에러 코드 1028은 MTS API 공식 문서에 정의되지 않음**

#### 현재 구현 상태

**파일**: `src/lib/mtsApi.ts` - `sendKakaoBrand()` 함수 (1183-1195줄)

```typescript
const requestBody: Record<string, unknown> = {
  auth_code: MTS_AUTH_CODE,
  sender_key: senderKey,
  template_code: templateCode,
  phone_number: cleanToNumber,
  callback_number: cleanCallbackNumber,
  message: message,
  message_type: messageType,
  send_mode: '3',      // 3: 즉시발송 (PDF 예제 참조)
  targeting: targeting, // M: 수신동의, N: 수신동의+채널친구, I: 전체+채널친구
  tran_type: tranType,
  country_code: '82',
};
```

**Targeting 파라미터 의미**:
- **M**: 수신동의 사용자만 (Marketing consent users only)
- **N**: 수신동의 + 채널 친구 (Consent + Channel friends)
- **I**: 전체 + 채널 친구 (All + Channel friends)

#### 발견된 문제점

1. **문서화 불일치**:
   - PDF 문서에서 `targeting` 파라미터가 필수인지 선택인지 명확하지 않음
   - 초기 구현 시 선택 파라미터로 오해
   - 실제로는 필수 파라미터 (제거 시 ER99 에러)

2. **에러 코드 미정의**:
   - 현재 발생한 에러 코드 `1028`이 공식 PDF 문서(v1.0)의 에러 코드 목록(33-38페이지)에 존재하지 않음
   - 정의된 에러 코드: ER99, ER98, 1030, 1042, 1043, 1072, 1071 등
   - 1028 의미 불명확

3. **발송 검증 프로세스**:
   - API 응답(code: 0000)과 실제 발송 결과(result_code)가 분리되어 있음
   - 발송 후 최소 5분 경과 후 결과 조회 API로 확인 필요
   - 즉각적인 에러 피드백 불가

#### 현재 상태

- ✅ API 엔드포인트 구현 완료
- ✅ UI 컴포넌트 완료 (BrandTab.tsx)
- ✅ 백엔드 로직 완료 (mtsApi.ts)
- ✅ 결과 조회 API 완료 (result/route.ts)
- ⚠️ **실제 발송 테스트 실패** - 에러 코드 1028
- ⏸️ MTS 담당자 문의 필요

#### MTS 담당자 문의 사항

다음 내용을 포함한 문의 문서 작성 예정:
1. 에러 코드 1028의 정확한 의미
2. `targeting` 파라미터의 정확한 요구사항
3. 테스트 과정 및 파라미터 변경 이력
4. 권장 설정값 문의

#### 관련 파일

- `src/lib/mtsApi.ts` (1183-1220줄): `sendKakaoBrand()` 함수
- `src/app/api/messages/kakao/brand/send/route.ts`: 발송 API 엔드포인트
- `src/app/api/messages/kakao/brand/result/route.ts`: 결과 조회 API 엔드포인트 (신규)
- `src/components/messages/BrandTab.tsx`: UI 컴포넌트
- `MTS_카카오브랜드메시지_기본형_전문방식_Restful_Interface_Guide_v1.0.pdf`: 공식 API 문서

---

**문서 버전**: v5.2 (Brand Message Error Resolution)
**최종 업데이트**: 2025-11-06
**작성자**: Claude Code Analysis
**변경사항 (v5.2)**:
- 카카오 브랜드 메시지 에러 해결 과정 문서화 ⚠️
  - 발송 결과 조회 API 구현 완료 ✅
  - 에러 코드 1030 → ER99 → 1030 → 1028 진행 과정 기록
  - 파라미터 조정 이력 (send_mode, targeting)
  - 현재 발생 중인 에러 코드 1028 분석
  - MTS 담당자 문의 준비 중
