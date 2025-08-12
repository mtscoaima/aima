# MTS 메시징 플랫폼 - 3주 개발 기능 테스트 매뉴얼

## 📋 목차
1. [테스트 환경 설정](#1-테스트-환경-설정)
2. [회원가입 및 로그인 시스템](#2-회원가입-및-로그인-시스템)
3. [관리자 시스템](#3-관리자-시스템)
4. [AI 타겟마케팅](#4-ai-타겟마케팅)
5. [마이페이지](#5-마이페이지)
6. [고객센터](#6-고객센터)
7. [사업자 정보 인증](#7-사업자-정보-인증)
8. [알림 시스템](#8-알림-시스템)
9. [세금계산서 관리](#9-세금계산서-관리)
10. [발신번호 관리](#10-발신번호-관리)

---

## 1. 테스트 환경 설정

### 1.1 개발 서버 실행
```bash
cd /Users/johnlee12/Desktop/git/mts-message
npm install
npm run dev
```

### 1.2 테스트 URL
- **로컬 개발 서버**: http://localhost:3000

### 1.3 Playwright MCP 설정
```javascript
// Playwright로 브라우저 열기
await playwright.browser_navigate({
  url: "http://localhost:3000"
});

// 팝업 차단 해제 필요
// Chrome: 주소창 우측 팝업 차단 아이콘 클릭 → 허용
```

### 1.4 테스트 계정 생성
```javascript
// 일반 회원 테스트 계정 생성 예시
const testUser = {
  username: "testuser001",
  email: "testuser001@example.com",
  password: "Test@1234",
  name: "테스트유저",
  phone: "010-1234-5678"
};

// 영업사원 테스트 계정 생성 예시
const testSalesperson = {
  username: "testsales001",
  email: "testsales001@example.com",
  password: "Sales@1234",
  name: "테스트영업",
  phone: "010-8765-4321",
  role: "SALESPERSON"
};
```

---

## 2. 회원가입 및 로그인 시스템

### 2.1 회원가입 페이지 테스트 (신규 UI 개선)
**URL**: http://localhost:3000/signup

#### 테스트 시나리오:
```javascript
// 1. 회원가입 페이지 접속
await playwright.browser_navigate({ url: "http://localhost:3000/signup" });

// 2. 회원 유형 선택 (일반회원)
await playwright.browser_click({ 
  element: "일반회원 라디오 버튼",
  ref: "input[value='general']" 
});

// 3. 추천인 코드 입력 (선택사항)
await playwright.browser_type({
  element: "추천인 코드 입력란",
  ref: "input[name='referralCode']",
  text: "REF123456"
});

// 4. 기본 정보 입력
await playwright.browser_type({
  element: "아이디 입력란",
  ref: "input[name='username']",
  text: "testuser001"
});

await playwright.browser_type({
  element: "비밀번호 입력란",
  ref: "input[name='password']",
  text: "Test@1234"
});

await playwright.browser_type({
  element: "비밀번호 확인 입력란",
  ref: "input[name='confirmPassword']",
  text: "Test@1234"
});

// 5. 약관 동의
await playwright.browser_click({
  element: "전체 동의 체크박스",
  ref: "input[id='agree-all']"
});

// 6. 회원가입 완료
await playwright.browser_click({
  element: "회원가입 버튼",
  ref: "button[type='submit']"
});
```

### 2.2 소셜 로그인 테스트
**URL**: http://localhost:3000/login

#### 테스트 시나리오:
```javascript
// 1. 로그인 페이지 접속
await playwright.browser_navigate({ url: "http://localhost:3000/login" });

// 2. 카카오 로그인
await playwright.browser_click({
  element: "카카오 로그인 버튼",
  ref: "button.kakao-login"
});

// 3. 네이버 로그인
await playwright.browser_click({
  element: "네이버 로그인 버튼",
  ref: "button.naver-login"
});

// 4. 구글 로그인
await playwright.browser_click({
  element: "구글 로그인 버튼",
  ref: "button.google-login"
});
```

---

## 3. 관리자 시스템

### 3.1 회원관리 페이지
**URL**: http://localhost:3000/admin/user-management

#### 주요 기능:
1. **회원 목록 조회**
2. **회원 등급 시스템**
3. **개인정보 마스킹**
4. **일괄 처리**

#### 테스트 시나리오:
```javascript
// 1. 관리자로 로그인
await playwright.browser_navigate({ url: "http://localhost:3000/login" });
// 관리자 계정으로 로그인

// 2. 회원관리 페이지 접속
await playwright.browser_navigate({ url: "http://localhost:3000/admin/user-management" });

// 3. 회원 검색
await playwright.browser_type({
  element: "검색 입력란",
  ref: "input[placeholder='검색어를 입력하세요']",
  text: "testuser"
});

// 4. 등급 필터링
await playwright.browser_select_option({
  element: "등급 선택",
  ref: "select[name='grade']",
  values: ["일반회원"]
});

// 5. 일괄 처리 - 회원 선택
await playwright.browser_click({
  element: "전체 선택 체크박스",
  ref: "input[type='checkbox'].select-all"
});

// 6. 일괄 등급 변경
await playwright.browser_click({
  element: "일괄 처리 버튼",
  ref: "button.bulk-action"
});
```

### 3.2 시스템 설정
**URL**: http://localhost:3000/admin/system-settings

#### 테스트 시나리오:
```javascript
// 1. 시스템 설정 페이지 접속
await playwright.browser_navigate({ url: "http://localhost:3000/admin/system-settings" });

// 2. 회원 등급 설정
await playwright.browser_click({
  element: "등급 설정 탭",
  ref: "button[data-tab='grade']"
});

// 3. 새 등급 추가
await playwright.browser_type({
  element: "등급명 입력",
  ref: "input[name='gradeName']",
  text: "VIP"
});

await playwright.browser_type({
  element: "할인율 입력",
  ref: "input[name='discountRate']",
  text: "20"
});

// 4. 저장
await playwright.browser_click({
  element: "저장 버튼",
  ref: "button.save-grade"
});
```

---

## 4. AI 타겟마케팅

### 4.1 AI 타겟마케팅 페이지
**URL**: http://localhost:3000/target-marketing

#### 주요 기능:
1. **AI 채팅 상담**
2. **템플릿 생성**
3. **이미지 업로드**
4. **캠페인 관리**

#### 테스트 시나리오:
```javascript
// 1. AI 타겟마케팅 페이지 접속
await playwright.browser_navigate({ url: "http://localhost:3000/target-marketing" });

// 2. AI 상담 시작
await playwright.browser_type({
  element: "채팅 입력란",
  ref: "textarea[placeholder='AI 마케터에게 질문하세요']",
  text: "미용실 홍보 문자를 만들어주세요"
});

await playwright.browser_click({
  element: "전송 버튼",
  ref: "button.send-message"
});

// 3. 이미지 업로드
await playwright.browser_file_upload({
  paths: ["/path/to/test-image.jpg"]
});

// 4. 템플릿 저장
await playwright.browser_click({
  element: "템플릿 저장 버튼",
  ref: "button.save-template"
});

// 5. 캠페인 승인 신청
await playwright.browser_click({
  element: "승인 신청 버튼",
  ref: "button.request-approval"
});
```

### 4.2 캠페인 관리
#### 테스트 시나리오:
```javascript
// 1. 캠페인 관리 탭 이동
await playwright.browser_click({
  element: "캠페인 관리 탭",
  ref: "button[data-tab='campaign-management']"
});

// 2. 캠페인 불러오기
await playwright.browser_click({
  element: "캠페인 불러오기 버튼",
  ref: "button.load-campaign"
});

// 3. 캠페인 선택
await playwright.browser_click({
  element: "캠페인 항목",
  ref: "div.campaign-item:first-child"
});

// 4. 미리보기
await playwright.browser_click({
  element: "미리보기 버튼",
  ref: "button.preview-campaign"
});
```

---

## 5. 마이페이지

### 5.1 회원정보 변경
**URL**: http://localhost:3000/my-site/advertiser/profile

#### 테스트 시나리오:
```javascript
// 1. 마이페이지 접속
await playwright.browser_navigate({ url: "http://localhost:3000/my-site/advertiser/profile" });

// 2. 회원정보 변경 탭
await playwright.browser_click({
  element: "회원정보 변경 탭",
  ref: "button[data-tab='profile']"
});

// 3. 전화번호 변경
await playwright.browser_type({
  element: "전화번호 입력란",
  ref: "input[name='phone']",
  text: "010-9999-8888"
});

// 4. 저장
await playwright.browser_click({
  element: "저장 버튼",
  ref: "button.save-profile"
});
```

### 5.2 비밀번호 변경
#### 테스트 시나리오:
```javascript
// 1. 비밀번호 변경 탭
await playwright.browser_click({
  element: "비밀번호 변경 탭",
  ref: "button[data-tab='password']"
});

// 2. 현재 비밀번호 입력
await playwright.browser_type({
  element: "현재 비밀번호",
  ref: "input[name='currentPassword']",
  text: "Test@1234"
});

// 3. 새 비밀번호 입력
await playwright.browser_type({
  element: "새 비밀번호",
  ref: "input[name='newPassword']",
  text: "NewTest@5678"
});

// 4. 비밀번호 확인
await playwright.browser_type({
  element: "비밀번호 확인",
  ref: "input[name='confirmPassword']",
  text: "NewTest@5678"
});

// 5. 변경하기
await playwright.browser_click({
  element: "변경하기 버튼",
  ref: "button.change-password"
});
```

---

## 6. 고객센터

### 6.1 공지사항
**URL**: http://localhost:3000/support

#### 테스트 시나리오:
```javascript
// 1. 고객센터 접속
await playwright.browser_navigate({ url: "http://localhost:3000/support" });

// 2. 공지사항 탭
await playwright.browser_click({
  element: "공지사항 탭",
  ref: "button[data-tab='notice']"
});

// 3. 공지사항 상세보기
await playwright.browser_click({
  element: "공지사항 항목",
  ref: "tr.notice-item:first-child"
});
```

### 6.2 자주 묻는 질문 (FAQ)
#### 테스트 시나리오:
```javascript
// 1. FAQ 탭
await playwright.browser_click({
  element: "자주 묻는 질문 탭",
  ref: "button[data-tab='faq']"
});

// 2. 카테고리 선택
await playwright.browser_select_option({
  element: "카테고리 선택",
  ref: "select.faq-category",
  values: ["회원가입/로그인"]
});

// 3. 검색
await playwright.browser_type({
  element: "검색 입력란",
  ref: "input.faq-search",
  text: "비밀번호"
});

// 4. FAQ 펼치기
await playwright.browser_click({
  element: "FAQ 항목",
  ref: "div.faq-item:first-child"
});
```

### 6.3 문의하기
#### 테스트 시나리오:
```javascript
// 1. 문의하기 탭
await playwright.browser_click({
  element: "문의하기 탭",
  ref: "button[data-tab='inquiry']"
});

// 2. 문의 유형 선택
await playwright.browser_select_option({
  element: "문의 유형",
  ref: "select[name='inquiryType']",
  values: ["서비스 이용"]
});

// 3. 제목 입력
await playwright.browser_type({
  element: "제목 입력란",
  ref: "input[name='title']",
  text: "테스트 문의입니다"
});

// 4. 내용 입력
await playwright.browser_type({
  element: "내용 입력란",
  ref: "textarea[name='content']",
  text: "문의 내용을 테스트합니다."
});

// 5. 파일 첨부
await playwright.browser_file_upload({
  paths: ["/path/to/test-file.pdf"]
});

// 6. SMS 알림 동의
await playwright.browser_click({
  element: "SMS 알림 체크박스",
  ref: "input[name='smsNotification']"
});

// 7. 문의 등록
await playwright.browser_click({
  element: "문의하기 버튼",
  ref: "button.submit-inquiry"
});
```

---

## 7. 사업자 정보 인증

### 7.1 사업자 인증 페이지
**URL**: http://localhost:3000/my-site/advertiser/business-verification

#### 테스트 시나리오:
```javascript
// 1. 사업자 인증 페이지 접속
await playwright.browser_navigate({ 
  url: "http://localhost:3000/my-site/advertiser/business-verification" 
});

// 2. 사업자등록번호 입력
await playwright.browser_type({
  element: "사업자등록번호 입력란",
  ref: "input[name='businessNumber']",
  text: "123-45-67890"
});

// 3. 확인 버튼 클릭
await playwright.browser_click({
  element: "확인 버튼",
  ref: "button.verify-business"
});

// 4. 추가 정보 입력
await playwright.browser_type({
  element: "회사명 입력란",
  ref: "input[name='companyName']",
  text: "테스트 회사"
});

await playwright.browser_type({
  element: "대표자명 입력란",
  ref: "input[name='ceoName']",
  text: "홍길동"
});

// 5. 인증 완료
await playwright.browser_click({
  element: "인증하기 버튼",
  ref: "button.complete-verification"
});
```

---

## 8. 알림 시스템

### 8.1 알림 확인
#### 테스트 시나리오:
```javascript
// 1. 헤더의 알림 아이콘 확인
await playwright.browser_snapshot();

// 2. 알림 아이콘 클릭
await playwright.browser_click({
  element: "알림 아이콘",
  ref: "button.notification-icon"
});

// 3. 알림 목록 확인
await playwright.browser_wait_for({
  text: "새로운 알림"
});

// 4. 개별 알림 읽음 처리
await playwright.browser_click({
  element: "알림 항목",
  ref: "div.notification-item:first-child"
});

// 5. 모두 읽음 처리
await playwright.browser_click({
  element: "모두 읽음 버튼",
  ref: "button.mark-all-read"
});
```

---

## 9. 세금계산서 관리

### 9.1 세금계산서 발행 내역
**URL**: http://localhost:3000/my-site/advertiser/profile (세금계산서 탭)

#### 테스트 시나리오:
```javascript
// 1. 세금계산서 탭으로 이동
await playwright.browser_click({
  element: "세금계산서 탭",
  ref: "button[data-tab='tax-invoice']"
});

// 2. 담당자 정보 입력
await playwright.browser_type({
  element: "담당자 이메일",
  ref: "input[name='taxEmail']",
  text: "tax@example.com"
});

await playwright.browser_type({
  element: "담당자명",
  ref: "input[name='taxManager']",
  text: "김담당"
});

await playwright.browser_type({
  element: "연락처",
  ref: "input[name='taxContact']",
  text: "02-1234-5678"
});

// 3. 저장
await playwright.browser_click({
  element: "저장 버튼",
  ref: "button.save-tax-info"
});

// 4. 발행 내역 확인
await playwright.browser_wait_for({
  text: "세금계산서 발행 내역"
});
```

### 9.2 관리자 세금계산서 관리
**URL**: http://localhost:3000/admin/tax-invoices

#### 테스트 시나리오:
```javascript
// 1. 관리자 세금계산서 페이지 접속
await playwright.browser_navigate({ url: "http://localhost:3000/admin/tax-invoices" });

// 2. 엑셀 파일 업로드
await playwright.browser_file_upload({
  paths: ["/path/to/tax-invoice.xlsx"]
});

// 3. 데이터 확인
await playwright.browser_wait_for({
  text: "업로드 완료"
});

// 4. 내보내기
await playwright.browser_click({
  element: "내보내기 버튼",
  ref: "button.export-excel"
});
```

---

## 10. 발신번호 관리

### 10.1 발신번호 등록
**URL**: http://localhost:3000/my-site/advertiser/profile (발신번호 관리 탭)

#### 테스트 시나리오:
```javascript
// 1. 발신번호 관리 탭으로 이동
await playwright.browser_click({
  element: "발신번호 관리 탭",
  ref: "button[data-tab='sender-numbers']"
});

// 2. 새 발신번호 추가
await playwright.browser_click({
  element: "발신번호 추가 버튼",
  ref: "button.add-sender-number"
});

// 3. 발신번호 입력
await playwright.browser_type({
  element: "발신번호 입력란",
  ref: "input[name='senderNumber']",
  text: "02-9876-5432"
});

// 4. 번호 유형 선택
await playwright.browser_select_option({
  element: "번호 유형",
  ref: "select[name='numberType']",
  values: ["대표번호"]
});

// 5. 저장
await playwright.browser_click({
  element: "저장 버튼",
  ref: "button.save-sender-number"
});

// 6. 기본 발신번호 설정
await playwright.browser_click({
  element: "기본으로 설정",
  ref: "button.set-default"
});
```

---

## 📝 테스트 체크리스트

### 회원가입/로그인
- [ ] 일반회원 가입
- [ ] 영업사원 가입
- [ ] 추천인 코드 검증
- [ ] 소셜 로그인 (카카오, 네이버, 구글)
- [ ] 아이디/비밀번호 찾기

### 관리자 기능
- [ ] 회원 관리 (조회, 검색, 필터링)
- [ ] 회원 등급 시스템
- [ ] 개인정보 마스킹
- [ ] 일괄 처리
- [ ] 시스템 설정

### AI 타겟마케팅
- [ ] AI 채팅 상담
- [ ] 템플릿 생성
- [ ] 이미지 업로드
- [ ] 캠페인 저장/불러오기
- [ ] 승인 신청

### 마이페이지
- [ ] 회원정보 변경
- [ ] 비밀번호 변경
- [ ] 사업자 정보 변경
- [ ] 발신번호 관리
- [ ] 세금계산서 설정

### 고객센터
- [ ] 공지사항 조회
- [ ] FAQ 검색
- [ ] 문의 등록
- [ ] 문의 내역 확인
- [ ] 파일 첨부

### 기타 기능
- [ ] 사업자 정보 인증
- [ ] 알림 시스템
- [ ] 세금계산서 관리
- [ ] 결제 시스템 (KG이니시스)

---

## 🔧 트러블슈팅

### 팝업 차단 문제
- 브라우저 설정에서 팝업 차단 해제 필요
- 특히 결제창 테스트 시 필수

### 파일 업로드 실패
- 파일 크기 제한: 10MB
- 허용 형식: PDF, JPG, PNG

### API 오류
- 네트워크 연결 확인
- 토큰 만료 시 재로그인

### 권한 오류
- 관리자 기능은 ADMIN 권한 필요
- 일반 사용자는 접근 불가

---

## 📞 지원 정보

테스트 중 문제가 발생하면 다음 정보를 포함하여 보고해주세요:
1. 테스트한 기능
2. 발생한 오류 메시지
3. 브라우저 콘솔 로그
4. 스크린샷
5. 재현 단계

---

**작성일**: 2025년 1월 27일  
**버전**: 1.0  
**개발 기간**: 2025년 1월 5일 - 1월 26일 (3주)
