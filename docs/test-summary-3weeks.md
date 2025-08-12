# MTS 메시징 플랫폼 - 3주 개발 요약 및 테스트 정보

## 🚀 Quick Start

### 1. 개발 서버 실행
```bash
cd /Users/johnlee12/Desktop/git/mts-message
npm install
npm run dev
```

### 2. 접속 URL
- **개발 서버**: http://localhost:3000
- **관리자 페이지**: http://localhost:3000/admin

### 3. 테스트 계정 정보
```javascript
// 일반 사용자 테스트 계정
{
  username: "testuser001",
  password: "Test@1234",
  role: "USER"
}

// 영업사원 테스트 계정
{
  username: "testsales001", 
  password: "Sales@1234",
  role: "SALESPERSON"
}

// 관리자 테스트 계정
{
  username: "admin001",
  password: "Admin@1234",
  role: "ADMIN"
}
```

### 4. 테스트용 사업자등록번호
- 유효한 번호: `123-45-67890` (테스트용)
- 형식: `XXX-XX-XXXXX`

---

## 📊 3주 개발 주요 성과

### 주차별 개발 내용

#### 1주차 (1/5 ~ 1/11)
- ✅ 사업자 정보 인증 시스템 구현
- ✅ 대시보드 UI 개선
- ✅ 알림 시스템 구현
- ✅ 소셜 로그인 (카카오, 네이버, 구글)

#### 2주차 (1/12 ~ 1/18)
- ✅ 고객센터 전면 개편 (공지사항, FAQ, 문의하기)
- ✅ 마이페이지 리뉴얼
- ✅ 발신번호 관리 시스템
- ✅ 세금계산서 관리 기능

#### 3주차 (1/19 ~ 1/26)
- ✅ AI 타겟마케팅 시스템 구축
- ✅ 회원가입 페이지 UI 개선
- ✅ 관리자 회원관리 시스템
- ✅ 관리자 시스템 설정 기능

---

## 🎯 주요 신규 기능

### 1. AI 타겟마케팅 (신규)
- **위치**: `/target-marketing`
- **주요 기능**:
  - AI 채팅 상담
  - 자동 템플릿 생성
  - 이미지 첨부 및 편집
  - 캠페인 저장/불러오기
  - 승인 신청 프로세스

### 2. 관리자 시스템 (신규)
- **위치**: `/admin/*`
- **주요 페이지**:
  - 회원관리: `/admin/user-management`
  - 캠페인 관리: `/admin/campaigns`
  - 세금계산서: `/admin/tax-invoices`
  - 시스템 설정: `/admin/system-settings`
  - 문의사항 관리: `/admin/customer-support`

### 3. 고객센터 (개편)
- **위치**: `/support`
- **개선사항**:
  - 탭 방식 UI
  - 카테고리별 FAQ
  - 파일 첨부 가능한 문의하기
  - SMS 알림 옵션

### 4. 마이페이지 (개편)
- **위치**: `/my-site/advertiser/profile`
- **새로운 탭**:
  - 회원정보 변경
  - 비밀번호 변경
  - 사업자 정보 변경
  - 발신번호 관리
  - 세금계산서 설정

---

## 🔍 테스트 우선순위

### 필수 테스트 (P0)
1. **회원가입/로그인**
   - 일반회원 가입
   - 소셜 로그인
   - 로그인 유지

2. **AI 타겟마케팅**
   - AI 채팅
   - 템플릿 생성
   - 캠페인 저장

3. **관리자 기능**
   - 회원 조회
   - 회원 등급 변경
   - 일괄 처리

### 중요 테스트 (P1)
1. **마이페이지**
   - 정보 수정
   - 발신번호 등록
   - 세금계산서 설정

2. **고객센터**
   - 문의 등록
   - FAQ 검색
   - 공지사항 조회

3. **사업자 인증**
   - 사업자번호 검증
   - 정보 저장

### 선택 테스트 (P2)
1. **알림 시스템**
   - 알림 수신
   - 읽음 처리

2. **세부 기능**
   - 파일 업로드
   - 이미지 편집
   - 엑셀 내보내기

---

## 💡 테스트 팁

### 1. 브라우저 설정
- **팝업 차단 해제 필수** (결제창, 소셜 로그인)
- 권장 브라우저: Chrome, Edge
- 해상도: 1920x1080 이상

### 2. 테스트 데이터
```javascript
// 테스트용 전화번호 생성
const testPhone = `010-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`;

// 테스트용 이메일 생성
const testEmail = `test${Date.now()}@example.com`;

// 테스트용 사업자번호
const testBusinessNumber = "123-45-67890";
```

### 3. 자주 발생하는 이슈
- **로그인 안 됨**: 쿠키/캐시 삭제 후 재시도
- **버튼 클릭 안 됨**: 페이지 로딩 완료 대기
- **파일 업로드 실패**: 10MB 이하, PDF/JPG/PNG만 가능

---

## 📱 주요 API 엔드포인트

### 인증 관련
- `POST /api/users/login` - 로그인
- `POST /api/users/signup` - 회원가입
- `POST /api/users/refresh` - 토큰 갱신
- `GET /api/users/me` - 내 정보 조회

### AI 타겟마케팅
- `POST /api/ai/chat` - AI 채팅
- `POST /api/ai/send-mms` - MMS 발송
- `POST /api/ai/edit-image` - 이미지 편집

### 관리자
- `GET /api/admin/users` - 회원 목록
- `PUT /api/admin/users/bulk` - 일괄 처리
- `GET /api/admin/campaigns` - 캠페인 목록
- `POST /api/admin/campaigns/{id}/approve` - 캠페인 승인

### 고객센터
- `GET /api/inquiries` - 문의 목록
- `POST /api/inquiries` - 문의 등록
- `GET /api/faqs` - FAQ 목록
- `GET /api/announcements` - 공지사항

---

## 🛠️ 환경 설정

### 필수 환경변수 (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-jwt-secret

# OpenAI (AI 기능)
OPENAI_API_KEY=your-openai-key

# 결제 (KG이니시스)
INICIS_MID=INIpayTest
INICIS_SIGNKEY=SU5JTElURV9UUklQTEVERVNfS0VZU1RS

# 기타
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 📈 성능 기준

### 페이지 로딩 시간
- 목표: 3초 이내
- 측정 방법: 첫 화면 렌더링 완료

### API 응답 시간
- 목표: 1초 이내
- 중요 API: 로그인, AI 채팅

### 동시 사용자
- 목표: 100명 동시 접속
- 테스트: 회원가입, AI 사용

---

## 🚨 긴급 연락처

### 개발팀
- 담당자: 이존 (John Lee)
- 프로젝트 경로: `/Users/johnlee12/Desktop/git/mts-message`

### 문제 발생 시
1. 브라우저 콘솔 확인 (F12)
2. 네트워크 탭에서 실패한 요청 확인
3. 스크린샷 첨부하여 보고

---

## 📅 향후 일정

### 테스트 완료 목표
- 기능 테스트: 1/28 (화)
- 버그 수정: 1/29 (수)
- 최종 확인: 1/30 (목)

### 배포 예정
- 스테이징: 1/31 (금)
- 프로덕션: 2/3 (월)

---

**작성일**: 2025년 1월 27일  
**버전**: 1.0  
**문서 위치**: `/docs/test-summary-3weeks.md`
