# Nice Payments 운영 환경 전환 가이드

## 📋 체크리스트

운영 환경으로 전환하기 전에 다음 항목들을 **반드시** 확인하세요.

---

## 1️⃣ Nice Payments 관리자 페이지에서 운영 MID 발급

### 절차
1. https://start.nicepay.co.kr/ 로그인
2. **실제 운영 상점** 개설 신청
3. 사업자 정보, 정산 계좌 등록
4. 심사 완료 후 **운영 MID 발급** (R1_xxx 형식)
5. 개발정보 탭에서 다음 정보 확인:
   - **클라이언트 키 (MID)**: `R1_xxxxxx...` (Server 승인)
   - **시크릿 키**: 운영용 Secret Key

---

## 2️⃣ `.env` 파일 수정

### 변경 전 (샌드박스)
```bash
# Nice Payments (결제) - 샌드박스 테스트용
NICEPAY_CLIENT_ID=R2_bab9fcff9483417cb74509c7c53dd8dd
NICEPAY_SECRET_KEY=5c3087fe086e4727854ee53ed856492a
NICEPAY_API_URL=https://sandbox-api.nicepay.co.kr
NEXT_PUBLIC_NICEPAY_JS_SDK_URL=https://pay.nicepay.co.kr/v1/js/
```

### 변경 후 (운영)
```bash
# Nice Payments (결제) - 운영 환경
NICEPAY_CLIENT_ID=R1_실제발급받은MID
NICEPAY_SECRET_KEY=실제발급받은SecretKey
NICEPAY_API_URL=https://api.nicepay.co.kr
NEXT_PUBLIC_NICEPAY_JS_SDK_URL=https://pay.nicepay.co.kr/v1/js/
```

**주의**: JS SDK URL은 샌드박스와 운영이 동일합니다!

---

## 3️⃣ 코드 수정: 임시 승인 로직 제거

### 파일: `src/app/api/payment/nicepay/return/route.ts`

**제거할 부분** (약 121~143번 라인):

```typescript
// ❌ 이 부분 전체 삭제
let approveData;

if (!approveResponse.ok) {
  const errorData = await approveResponse.text();
  console.error("❌ 승인 API 실패:", errorData);

  // 샌드박스 테스트를 위한 임시 처리: 승인 실패해도 크레딧 충전 진행
  approveData = {
    resultCode: "0000",
    resultMsg: "샌드박스 테스트 승인",
    tid: tid,
    orderId: orderId,
    amount: parseInt(amount),
    status: "paid",
    payMethod: "card",
    cardName: "테스트카드",
    approveNo: "TEST000",
  };
} else {
  approveData = await approveResponse.json();
}
```

**변경 후**:

```typescript
// ✅ 정상 로직으로 복구
if (!approveResponse.ok) {
  const errorData = await approveResponse.text();
  console.error("❌ 승인 API 실패:", errorData);
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_BASE_URL}/credit-management?payment=failed&message=승인 실패`
  );
}

const approveData = await approveResponse.json();

// 승인 실패 시 추가 검증
if (approveData.resultCode !== "0000") {
  console.error("❌ 승인 결과 실패:", approveData);
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_BASE_URL}/credit-management?payment=failed&message=${encodeURIComponent(approveData.resultMsg)}`
  );
}
```

---

## 4️⃣ 환경 변수 재확인

Vercel 또는 배포 환경에서 환경 변수를 설정했다면, 다음도 업데이트하세요:

### Vercel 환경 변수
1. Vercel Dashboard → 프로젝트 선택
2. Settings → Environment Variables
3. 다음 변수들을 **Production** 환경에 추가:
   ```
   NICEPAY_CLIENT_ID=R1_실제운영MID
   NICEPAY_SECRET_KEY=실제운영SecretKey
   NICEPAY_API_URL=https://api.nicepay.co.kr
   NEXT_PUBLIC_NICEPAY_JS_SDK_URL=https://pay.nicepay.co.kr/v1/js/
   ```

---

## 5️⃣ 실제 결제 테스트

운영 환경으로 전환한 후 **반드시** 다음을 테스트하세요:

### ✅ 테스트 시나리오
1. **소액 결제 테스트** (1,000원 등)
2. **실제 카드로 결제**
3. **결제 승인 확인**
4. **크레딧 충전 확인**
5. **결제 취소 테스트** (Nice Payments 관리자 페이지에서)
6. **환불 확인**

### ⚠️ 주의사항
- 운영 환경에서는 **실제 결제가 발생**합니다
- 테스트는 **소액**으로 진행하세요
- 테스트 후 **반드시 취소/환불** 처리하세요

---

## 6️⃣ 모니터링 및 로그 확인

### Nice Payments 관리자 페이지
- **개발정보 → 로그** 탭에서 실시간 거래 확인
- 오류 발생 시 상세 로그 확인

### 서버 로그
```bash
# 배포 환경 로그 확인 (Vercel 예시)
vercel logs [deployment-url]
```

---

## 📝 체크리스트 요약

전환 전 반드시 체크:

- [ ] Nice Payments 운영 상점 개설 완료
- [ ] 운영 MID (R1_xxx) 발급 완료
- [ ] `.env` 파일에 운영 MID/Secret Key 설정
- [ ] `NICEPAY_API_URL` 변경: `https://api.nicepay.co.kr`
- [ ] 임시 승인 로직 제거 (`src/app/api/payment/nicepay/return/route.ts`)
- [ ] Vercel 환경 변수 업데이트 (배포 환경 사용 시)
- [ ] 소액 테스트 결제 진행
- [ ] 결제 → 승인 → 충전 → 환불 플로우 확인
- [ ] 운영 로그 모니터링 설정

---

## 🚨 긴급 상황 대응

### 결제 오류 발생 시
1. 즉시 서비스 중단
2. `.env`를 샌드박스로 되돌리기
3. 서버 재시작
4. Nice Payments 고객센터 연락: 1661-0808

### 롤백 절차
```bash
# .env 파일 백업본으로 복구
cp .env.backup .env

# 서버 재시작
npm run build && npm start
```

---

## 📞 문의처

- **Nice Payments 고객센터**: 1661-0808
- **Nice Payments 기술지원**: https://start.nicepay.co.kr/ → 1:1 문의

---

## 마지막 확인사항

운영 환경 전환은 **실제 금융 거래가 발생**하므로 매우 신중하게 진행하세요.

**권장 전환 시간**: 트래픽이 적은 새벽 시간 (오전 2~4시)