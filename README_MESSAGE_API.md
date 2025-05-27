# 메시지 전송 API 가이드

## 개요

이 프로젝트는 NAVER SENS API를 사용하여 SMS/LMS 메시지를 전송하는 기능을 제공합니다.

## 환경 변수 설정

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# NAVER SENS API 설정
NAVER_SENS_SERVICE_ID=your_service_id_here
NAVER_ACCESS_KEY_ID=your_access_key_id_here
NAVER_SECRET_KEY=your_secret_key_here
```

### NAVER SENS API 키 발급 방법

1. [NAVER Cloud Platform](https://www.ncloud.com/) 접속
2. 회원가입 및 로그인
3. Console > Services > AI·Application Service > SENS 선택
4. SMS 서비스 신청
5. 프로젝트 생성 후 다음 정보 확인:
   - Service ID: SMS 서비스 ID
   - Access Key ID: 계정의 Access Key
   - Secret Key: 계정의 Secret Key

## API 엔드포인트

### POST /api/message/send

메시지를 전송합니다.

#### 요청 본문

```json
{
  "fromNumber": "01012345678", // 발신번호 (하이픈 없이)
  "toNumber": "01087654321", // 수신번호 (하이픈 없이) - 단일 수신자
  "toNumbers": ["01087654321", "01012345678"], // 수신번호 배열 - 여러 수신자 (toNumber와 둘 중 하나 사용)
  "subject": "제목", // 제목 (선택사항, LMS용)
  "message": "메시지 내용" // 메시지 내용
}
```

#### 응답

성공 시:

```json
{
  "success": true,
  "message": "모든 메시지가 성공적으로 전송되었습니다. (2건)",
  "results": [
    {
      "toNumber": "01087654321",
      "success": true,
      "data": {
        /* NAVER SENS API 응답 데이터 */
      }
    },
    {
      "toNumber": "01012345678",
      "success": true,
      "data": {
        /* NAVER SENS API 응답 데이터 */
      }
    }
  ],
  "summary": {
    "total": 2,
    "success": 2,
    "failed": 0
  }
}
```

일부 실패 시:

```json
{
  "success": false,
  "message": "일부 메시지가 전송되었습니다. 성공: 1건, 실패: 1건",
  "results": [
    {
      "toNumber": "01087654321",
      "success": true,
      "data": {
        /* NAVER SENS API 응답 데이터 */
      }
    },
    {
      "toNumber": "01012345678",
      "success": false,
      "error": "발신번호가 등록되지 않았습니다."
    }
  ],
  "summary": {
    "total": 2,
    "success": 1,
    "failed": 1
  }
}
```

## 메시지 타입 자동 선택

- **SMS**: 메시지 길이가 90자 이하이고 제목이 없는 경우
- **LMS**: 메시지 길이가 90자 초과이거나 제목이 있는 경우

## 주요 기능

### 1. 여러 수신자 지원

- 웹 인터페이스에서 수신번호를 하나씩 추가하여 여러 명에게 동시 전송
- API에서 `toNumbers` 배열을 사용하여 여러 수신자 지정
- 각 수신자별 전송 결과를 개별적으로 확인 가능

### 2. 수신자 관리

- 수신번호 추가/삭제 기능
- 중복 번호 방지
- 전화번호 형식 검증
- Enter 키로 빠른 추가

### 3. 전송 결과 상세 정보

- 전체 전송 건수 및 성공/실패 건수 표시
- 각 수신자별 전송 결과 제공
- 실패한 경우 상세 오류 메시지 제공

## 사용법

### 1. 웹 인터페이스 사용

1. `/messages/send` 페이지 접속
2. 발신번호 선택
3. 수신번호 입력 후 "추가" 버튼 클릭 (여러 번호 추가 가능)
4. 제목 입력 (선택사항)
5. 메시지 내용 입력
6. "전송/예약 준비" 버튼 클릭

### 2. API 직접 호출

#### 단일 수신자

```javascript
const response = await fetch("/api/message/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    fromNumber: "01012345678",
    toNumber: "01087654321",
    subject: "제목",
    message: "메시지 내용",
  }),
});

const result = await response.json();
```

#### 여러 수신자

```javascript
const response = await fetch("/api/message/send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    fromNumber: "01012345678",
    toNumbers: ["01087654321", "01012345678", "01098765432"],
    subject: "제목",
    message: "메시지 내용",
  }),
});

const result = await response.json();
console.log(`총 ${result.summary.total}건 중 ${result.summary.success}건 성공`);
```

## 주의사항

1. **발신번호 등록**: NAVER SENS에서 발신번호를 사전에 등록해야 합니다.
2. **요금**: 메시지 전송 시 NAVER Cloud Platform 요금이 부과됩니다.
3. **제한사항**:
   - SMS: 최대 90자
   - LMS: 최대 2,000자
   - 발신번호는 사전 등록된 번호만 사용 가능

## 문제 해결

### 환경 변수 오류

```
NAVER SENS API 설정이 누락되었습니다.
```

→ `.env.local` 파일의 환경 변수를 확인하세요.

### 인증 오류

```
인증 실패: This account is not allowed. NAVER Cloud Platform 계정 설정을 확인해주세요.
```

→ 다음 사항을 확인하세요:

- NAVER Cloud Platform 계정이 활성화되어 있는지
- Access Key ID와 Secret Key가 올바른지
- SENS 서비스가 활성화되어 있는지
- 계정에 SENS 사용 권한이 있는지

### 발신번호 오류

```
권한 없음: 발신번호가 등록되어 있는지 확인해주세요.
```

→ NAVER SENS 콘솔에서 발신번호를 등록하세요.

### 서비스 ID 오류

```
서비스를 찾을 수 없음: Service ID를 확인해주세요.
```

→ `.env.local` 파일의 `NAVER_SENS_SERVICE_ID`가 올바른지 확인하세요.

### 요청 한도 초과

```
요청 한도 초과: 잠시 후 다시 시도해주세요.
```

→ API 호출 한도를 초과했습니다. 잠시 후 다시 시도하거나 요금제를 확인하세요.

### 네트워크 오류

```
네트워크 오류: NAVER SENS API에 연결할 수 없습니다.
```

→ 인터넷 연결 상태를 확인하세요.

### 일반적인 해결 방법

1. **NAVER Cloud Platform 계정 확인**

   - 계정이 정상적으로 활성화되어 있는지 확인
   - 결제 정보가 등록되어 있는지 확인

2. **SENS 서비스 설정**

   - NAVER Cloud Platform Console > SENS 서비스 활성화
   - SMS 서비스 신청 및 승인 확인

3. **발신번호 등록**

   - SENS 콘솔에서 발신번호 등록
   - 사업자등록증 또는 신분증 인증 완료

4. **API 키 확인**
   - Access Key ID와 Secret Key 재발급
   - Service ID 정확성 확인

## 개발 정보

- **프레임워크**: Next.js 14 (App Router)
- **API**: NAVER SENS SMS API
- **HTTP 클라이언트**: fetch (axios 대신 사용)
- **인증**: HMAC-SHA256 서명 방식
