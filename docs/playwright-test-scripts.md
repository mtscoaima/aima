# Playwright MCP 자동화 테스트 스크립트

## 📋 전체 테스트 자동화 스크립트

이 문서는 외주 클라이언트가 Playwright MCP를 사용하여 모든 기능을 자동으로 테스트할 수 있는 완전한 스크립트를 제공합니다.

---

## 1. 초기 설정 및 브라우저 시작

```javascript
// 브라우저 열기
await mcp_playwright_browser_navigate({ 
  url: "http://localhost:3000" 
});

// 브라우저 크기 조정 (옵션)
await mcp_playwright_browser_resize({ 
  width: 1920, 
  height: 1080 
});

// 현재 페이지 스냅샷 확인
await mcp_playwright_browser_snapshot();
```

---

## 2. 회원가입 전체 플로우 테스트

```javascript
// === 회원가입 테스트 ===
async function testSignup() {
  // 1. 회원가입 페이지로 이동
  await mcp_playwright_browser_navigate({ 
    url: "http://localhost:3000/signup" 
  });
  
  // 2초 대기
  await mcp_playwright_browser_wait_for({ time: 2 });
  
  // 2. 일반회원 선택
  await mcp_playwright_browser_click({ 
    element: "일반회원 라디오 버튼",
    ref: "input[value='general']" 
  });
  
  // 3. 기본 정보 입력
  await mcp_playwright_browser_type({
    element: "아이디 입력란",
    ref: "input[name='username']",
    text: "testuser" + Date.now() // 고유한 아이디 생성
  });
  
  await mcp_playwright_browser_type({
    element: "비밀번호 입력란",
    ref: "input[name='password']",
    text: "Test@1234"
  });
  
  await mcp_playwright_browser_type({
    element: "비밀번호 확인 입력란",
    ref: "input[name='confirmPassword']",
    text: "Test@1234"
  });
  
  await mcp_playwright_browser_type({
    element: "이름 입력란",
    ref: "input[name='name']",
    text: "테스트사용자"
  });
  
  await mcp_playwright_browser_type({
    element: "이메일 입력란",
    ref: "input[name='email']",
    text: "test" + Date.now() + "@example.com"
  });
  
  await mcp_playwright_browser_type({
    element: "휴대폰번호 입력란",
    ref: "input[name='phone']",
    text: "010-1234-" + Math.floor(Math.random() * 9000 + 1000)
  });
  
  // 4. 회사 정보 입력
  await mcp_playwright_browser_type({
    element: "회사명 입력란",
    ref: "input[name='companyName']",
    text: "테스트 회사"
  });
  
  await mcp_playwright_browser_type({
    element: "사업자등록번호 입력란",
    ref: "input[name='businessNumber']",
    text: "123-45-67890"
  });
  
  // 5. 약관 전체 동의
  await mcp_playwright_browser_click({
    element: "전체 동의 체크박스",
    ref: "input#agree-all"
  });
  
  // 6. 회원가입 버튼 클릭
  await mcp_playwright_browser_click({
    element: "회원가입 버튼",
    ref: "button[type='submit']"
  });
  
  // 결과 확인
  await mcp_playwright_browser_wait_for({ 
    text: "회원가입이 완료되었습니다", 
    time: 5 
  });
  
  // 스크린샷 저장
  await mcp_playwright_browser_take_screenshot({ 
    filename: "signup-complete.png" 
  });
}
```

---

## 3. 로그인 테스트

```javascript
// === 로그인 테스트 ===
async function testLogin(username, password) {
  // 1. 로그인 페이지로 이동
  await mcp_playwright_browser_navigate({ 
    url: "http://localhost:3000/login" 
  });
  
  await mcp_playwright_browser_wait_for({ time: 2 });
  
  // 2. 로그인 정보 입력
  await mcp_playwright_browser_type({
    element: "아이디 입력란",
    ref: "input[name='username']",
    text: username
  });
  
  await mcp_playwright_browser_type({
    element: "비밀번호 입력란",
    ref: "input[name='password']",
    text: password
  });
  
  // 3. 로그인 버튼 클릭
  await mcp_playwright_browser_click({
    element: "로그인 버튼",
    ref: "button[type='submit']"
  });
  
  // 4. 로그인 성공 확인
  await mcp_playwright_browser_wait_for({ 
    text: "대시보드", 
    time: 5 
  });
  
  console.log("로그인 성공!");
}
```

---

## 4. AI 타겟마케팅 전체 테스트

```javascript
// === AI 타겟마케팅 테스트 ===
async function testAIMarketing() {
  // 1. AI 타겟마케팅 페이지로 이동
  await mcp_playwright_browser_navigate({ 
    url: "http://localhost:3000/target-marketing" 
  });
  
  await mcp_playwright_browser_wait_for({ time: 3 });
  
  // 2. AI 채팅 테스트
  await mcp_playwright_browser_type({
    element: "AI 채팅 입력란",
    ref: "textarea[placeholder*='AI']",
    text: "미용실 개업 홍보 문자를 만들어주세요",
    submit: false
  });
  
  // 전송 버튼 클릭
  await mcp_playwright_browser_click({
    element: "전송 버튼",
    ref: "button.send-message"
  });
  
  // AI 응답 대기
  await mcp_playwright_browser_wait_for({ time: 5 });
  
  // 3. 템플릿 저장
  await mcp_playwright_browser_click({
    element: "템플릿 저장 버튼",
    ref: "button.save-template"
  });
  
  // 모달에서 템플릿명 입력
  await mcp_playwright_browser_type({
    element: "템플릿명 입력란",
    ref: "input[name='templateName']",
    text: "미용실 개업 홍보"
  });
  
  // 저장 확인
  await mcp_playwright_browser_click({
    element: "저장 확인 버튼",
    ref: "button.confirm-save"
  });
  
  // 4. 캠페인 관리 탭으로 이동
  await mcp_playwright_browser_click({
    element: "캠페인 관리 탭",
    ref: "button[data-tab='campaign-management']"
  });
  
  await mcp_playwright_browser_wait_for({ time: 2 });
  
  // 스크린샷 저장
  await mcp_playwright_browser_take_screenshot({ 
    filename: "ai-marketing-test.png" 
  });
}
```

---

## 5. 고객센터 전체 테스트

```javascript
// === 고객센터 테스트 ===
async function testCustomerSupport() {
  // 1. 고객센터 페이지로 이동
  await mcp_playwright_browser_navigate({ 
    url: "http://localhost:3000/support" 
  });
  
  await mcp_playwright_browser_wait_for({ time: 2 });
  
  // 2. 공지사항 테스트
  await mcp_playwright_browser_click({
    element: "공지사항 탭",
    ref: "button[data-tab='notice']"
  });
  
  // 첫 번째 공지사항 클릭
  await mcp_playwright_browser_click({
    element: "첫 번째 공지사항",
    ref: "tr.notice-item:first-child"
  });
  
  await mcp_playwright_browser_wait_for({ time: 1 });
  
  // 3. FAQ 테스트
  await mcp_playwright_browser_click({
    element: "자주 묻는 질문 탭",
    ref: "button[data-tab='faq']"
  });
  
  // 검색 테스트
  await mcp_playwright_browser_type({
    element: "FAQ 검색란",
    ref: "input.faq-search",
    text: "비밀번호"
  });
  
  // 4. 문의하기 테스트
  await mcp_playwright_browser_click({
    element: "문의하기 탭",
    ref: "button[data-tab='inquiry']"
  });
  
  // 문의 양식 작성
  await mcp_playwright_browser_select_option({
    element: "문의 유형 선택",
    ref: "select[name='inquiryType']",
    values: ["서비스 이용"]
  });
  
  await mcp_playwright_browser_type({
    element: "문의 제목",
    ref: "input[name='title']",
    text: "자동화 테스트 문의"
  });
  
  await mcp_playwright_browser_type({
    element: "문의 내용",
    ref: "textarea[name='content']",
    text: "Playwright MCP로 자동화 테스트 중입니다."
  });
  
  // SMS 알림 동의
  await mcp_playwright_browser_click({
    element: "SMS 알림 동의",
    ref: "input[name='smsNotification']"
  });
  
  // 문의 등록
  await mcp_playwright_browser_click({
    element: "문의하기 버튼",
    ref: "button.submit-inquiry"
  });
  
  // 결과 확인
  await mcp_playwright_browser_wait_for({ 
    text: "문의가 등록되었습니다", 
    time: 3 
  });
}
```

---

## 6. 마이페이지 테스트

```javascript
// === 마이페이지 테스트 ===
async function testMyPage() {
  // 1. 마이페이지로 이동
  await mcp_playwright_browser_navigate({ 
    url: "http://localhost:3000/my-site/advertiser/profile" 
  });
  
  await mcp_playwright_browser_wait_for({ time: 2 });
  
  // 2. 발신번호 관리 테스트
  await mcp_playwright_browser_click({
    element: "발신번호 관리 탭",
    ref: "button[data-tab='sender-numbers']"
  });
  
  // 발신번호 추가
  await mcp_playwright_browser_click({
    element: "발신번호 추가 버튼",
    ref: "button.add-sender-number"
  });
  
  await mcp_playwright_browser_type({
    element: "발신번호 입력",
    ref: "input[name='senderNumber']",
    text: "02-1234-5678"
  });
  
  await mcp_playwright_browser_select_option({
    element: "번호 유형",
    ref: "select[name='numberType']",
    values: ["대표번호"]
  });
  
  await mcp_playwright_browser_click({
    element: "저장 버튼",
    ref: "button.save-sender-number"
  });
  
  // 3. 세금계산서 탭 테스트
  await mcp_playwright_browser_click({
    element: "세금계산서 탭",
    ref: "button[data-tab='tax-invoice']"
  });
  
  await mcp_playwright_browser_type({
    element: "담당자 이메일",
    ref: "input[name='taxEmail']",
    text: "tax@testcompany.com"
  });
  
  await mcp_playwright_browser_type({
    element: "담당자명",
    ref: "input[name='taxManager']",
    text: "김테스트"
  });
  
  await mcp_playwright_browser_type({
    element: "연락처",
    ref: "input[name='taxContact']",
    text: "02-8765-4321"
  });
  
  await mcp_playwright_browser_click({
    element: "저장 버튼",
    ref: "button.save-tax-info"
  });
}
```

---

## 7. 전체 테스트 실행 스크립트

```javascript
// === 전체 자동화 테스트 실행 ===
async function runAllTests() {
  try {
    console.log("=== MTS 메시징 플랫폼 자동화 테스트 시작 ===");
    
    // 1. 브라우저 초기화
    await mcp_playwright_browser_navigate({ 
      url: "http://localhost:3000" 
    });
    await mcp_playwright_browser_resize({ width: 1920, height: 1080 });
    
    // 2. 회원가입 테스트
    console.log("\n[1/6] 회원가입 테스트 시작...");
    await testSignup();
    console.log("✅ 회원가입 테스트 완료");
    
    // 3. 로그인 테스트
    console.log("\n[2/6] 로그인 테스트 시작...");
    await testLogin("testuser001", "Test@1234");
    console.log("✅ 로그인 테스트 완료");
    
    // 4. AI 타겟마케팅 테스트
    console.log("\n[3/6] AI 타겟마케팅 테스트 시작...");
    await testAIMarketing();
    console.log("✅ AI 타겟마케팅 테스트 완료");
    
    // 5. 고객센터 테스트
    console.log("\n[4/6] 고객센터 테스트 시작...");
    await testCustomerSupport();
    console.log("✅ 고객센터 테스트 완료");
    
    // 6. 마이페이지 테스트
    console.log("\n[5/6] 마이페이지 테스트 시작...");
    await testMyPage();
    console.log("✅ 마이페이지 테스트 완료");
    
    // 7. 알림 확인
    console.log("\n[6/6] 알림 시스템 테스트...");
    await mcp_playwright_browser_click({
      element: "알림 아이콘",
      ref: "button.notification-icon"
    });
    await mcp_playwright_browser_wait_for({ time: 2 });
    console.log("✅ 알림 시스템 테스트 완료");
    
    // 최종 스크린샷
    await mcp_playwright_browser_take_screenshot({ 
      filename: "test-complete-final.png",
      fullPage: true 
    });
    
    console.log("\n=== 모든 테스트 완료! ===");
    console.log("테스트 결과: 6/6 성공");
    
  } catch (error) {
    console.error("❌ 테스트 실패:", error);
    await mcp_playwright_browser_take_screenshot({ 
      filename: "test-error.png" 
    });
  }
}

// 테스트 실행
runAllTests();
```

---

## 8. 유용한 테스트 유틸리티

```javascript
// === 테스트 헬퍼 함수들 ===

// 랜덤 데이터 생성
function generateTestData() {
  const timestamp = Date.now();
  return {
    username: `testuser${timestamp}`,
    email: `test${timestamp}@example.com`,
    phone: `010-${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
    businessNumber: `${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 90000 + 10000)}`
  };
}

// 로그인 상태 확인
async function checkLoginStatus() {
  const snapshot = await mcp_playwright_browser_snapshot();
  return snapshot.includes("로그아웃") || snapshot.includes("대시보드");
}

// 에러 메시지 확인
async function checkErrorMessage() {
  const snapshot = await mcp_playwright_browser_snapshot();
  const errorPatterns = ["오류", "실패", "error", "fail"];
  return errorPatterns.some(pattern => snapshot.toLowerCase().includes(pattern));
}

// 페이지 로딩 대기
async function waitForPageLoad(timeout = 5) {
  await mcp_playwright_browser_wait_for({ time: timeout });
  const snapshot = await mcp_playwright_browser_snapshot();
  return !snapshot.includes("로딩") && !snapshot.includes("loading");
}

// 모달 닫기
async function closeModal() {
  try {
    await mcp_playwright_browser_click({
      element: "모달 닫기 버튼",
      ref: "button.close-modal, .modal-close, [aria-label='Close']"
    });
  } catch (e) {
    await mcp_playwright_browser_press_key({ key: "Escape" });
  }
}
```

---

## 9. 디버깅 및 문제 해결

```javascript
// === 디버깅 도구 ===

// 현재 페이지 정보 출력
async function debugCurrentPage() {
  console.log("\n=== 현재 페이지 디버그 정보 ===");
  
  // URL 확인
  const snapshot = await mcp_playwright_browser_snapshot();
  console.log("현재 페이지 스냅샷:", snapshot.substring(0, 200) + "...");
  
  // 콘솔 메시지 확인
  const consoleMessages = await mcp_playwright_browser_console_messages();
  console.log("콘솔 메시지:", consoleMessages);
  
  // 네트워크 요청 확인
  const networkRequests = await mcp_playwright_browser_network_requests();
  console.log("최근 네트워크 요청:", networkRequests.slice(-5));
  
  // 스크린샷 저장
  await mcp_playwright_browser_take_screenshot({ 
    filename: `debug-${Date.now()}.png` 
  });
}

// 에러 발생 시 자동 디버깅
async function withErrorHandling(testName, testFunction) {
  try {
    console.log(`\n🧪 ${testName} 시작...`);
    await testFunction();
    console.log(`✅ ${testName} 성공`);
  } catch (error) {
    console.error(`❌ ${testName} 실패:`, error);
    await debugCurrentPage();
    throw error;
  }
}
```

---

## 10. 성능 테스트

```javascript
// === 성능 측정 ===
async function measurePerformance(testName, testFunction) {
  const startTime = Date.now();
  
  try {
    await testFunction();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⏱️ ${testName}: ${duration}ms`);
    
    if (duration > 5000) {
      console.warn(`⚠️ ${testName}이(가) 5초 이상 소요됨`);
    }
    
    return duration;
  } catch (error) {
    console.error(`❌ ${testName} 성능 측정 실패:`, error);
    throw error;
  }
}

// 페이지 로딩 시간 측정
async function measurePageLoadTime(url) {
  const startTime = Date.now();
  await mcp_playwright_browser_navigate({ url });
  await mcp_playwright_browser_wait_for({ time: 0.5 });
  const endTime = Date.now();
  
  return endTime - startTime;
}
```

---

## 📝 테스트 실행 방법

1. **Playwright MCP 시작**
2. **위 스크립트를 복사하여 실행**
3. **결과 확인 및 스크린샷 검토**

## 🔧 문제 해결 팁

- **요소를 찾을 수 없음**: CSS 선택자 확인, 페이지 로딩 대기 시간 증가
- **클릭이 작동하지 않음**: 요소가 가려져 있는지 확인, 스크롤 필요 여부 확인
- **타이핑이 안 됨**: 입력 필드가 활성화되었는지 확인, 포커스 필요 여부 확인

---

**작성일**: 2025년 1월 27일  
**버전**: 1.0  
**Playwright MCP 호환 버전**: 최신
