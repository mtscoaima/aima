# 알림 기능 설정 및 테스트 가이드

## 1. 데이터베이스 설정

### 1.1 마이그레이션 실행

Supabase 대시보드의 SQL 에디터에서 다음 파일을 실행하세요:

```bash
migrations/create_notifications_tables.sql
```

### 1.2 테이블 확인

다음 테이블들이 생성되었는지 확인하세요:

- `notifications` - 알림 데이터 저장
- `notification_reads` - 역할 기반 알림의 읽음 상태 관리

### 1.3 테스트 데이터 삽입 (선택사항)

개발/테스트 환경에서 알림 기능을 확인하려면 다음 SQL을 실행하세요:

```sql
-- 관리자 역할 사용자에게 테스트 알림
INSERT INTO notifications (recipient_role, title, message, type, action_url) VALUES
('ADMIN', '새로운 사업자 인증 신청', '김철수님이 사업자 인증을 신청했습니다. 검토가 필요합니다.', 'BUSINESS_VERIFICATION', '/admin/user-management?tab=verification&user_id=1'),
('ADMIN', '시스템 점검 알림', '오늘 밤 12시부터 시스템 점검이 예정되어 있습니다.', 'INFO', '/admin/user-management');

-- 특정 사용자에게 개별 알림 (user_id는 실제 존재하는 사용자 ID로 변경)
INSERT INTO notifications (recipient_user_id, title, message, type, action_url) VALUES
(1, '결제 완료', '크레딧 충전이 완료되었습니다.', 'SUCCESS', '/credit-management'),
(1, '캠페인 승인', 'AI 타겟마케팅 캠페인이 승인되었습니다.', 'SUCCESS', '/target-marketing');
```

## 2. 기능 테스트

### 2.1 사업자 인증 알림 테스트

1. 일반 사용자로 로그인
2. 사업자 인증 페이지(`/my-site/advertiser/business-verification`)로 이동
3. 사업자 인증 신청 완료
4. 관리자 계정으로 로그인하여 알림 확인

### 2.2 알림 조회 테스트

1. 로그인 후 상단 네비게이션의 알림 아이콘 클릭
2. 알림 목록 표시 확인
3. 읽지 않은 알림 배지 표시 확인

### 2.3 알림 읽음 처리 테스트

1. 읽지 않은 알림 클릭
2. 알림이 읽음 상태로 변경되는지 확인
3. "모두 읽음" 버튼 클릭하여 전체 읽음 처리 확인

### 2.4 관리자 알림 테스트

1. 관리자 계정으로 로그인
2. 관리자 헤더의 알림 아이콘 클릭
3. 사업자 인증 관련 알림 확인
4. 알림 클릭 시 해당 페이지로 이동 확인

## 3. API 엔드포인트

### 3.1 알림 조회

```http
GET /api/notifications?page=1&limit=20&unread_only=false
Authorization: Bearer {token}
```

### 3.2 알림 읽음 처리

```http
PUT /api/notifications/{id}/read
Authorization: Bearer {token}
```

### 3.3 모든 알림 읽음 처리

```http
PUT /api/notifications/mark-all-read
Authorization: Bearer {token}
```

### 3.4 알림 전송 (내부 시스템용)

```http
POST /api/notifications/send
Content-Type: application/json

{
  "recipient_role": "ADMIN",
  "title": "테스트 알림",
  "message": "테스트 메시지입니다.",
  "type": "INFO",
  "action_url": "/admin/user-management"
}
```

## 4. 주요 특징

### 4.1 알림 타입

- `INFO`: 일반 정보 알림 (파란색)
- `SUCCESS`: 성공 알림 (초록색)
- `WARNING`: 경고 알림 (노란색)
- `ERROR`: 오류 알림 (빨간색)
- `BUSINESS_VERIFICATION`: 사업자 인증 관련 (파란색)

### 4.2 수신자 타입

- **개별 사용자**: `recipient_user_id` 지정
- **역할 기반**: `recipient_role` 지정 (ADMIN, SALESPERSON, USER)

### 4.3 폴링 시스템

- 30초마다 자동으로 새 알림 확인
- 페이지가 다시 포커스될 때 즉시 새로고침

### 4.4 읽음 상태 관리

- **개별 사용자 알림**: `notifications.is_read` 필드 사용
- **역할 기반 알림**: `notification_reads` 테이블로 사용자별 읽음 상태 관리

## 5. 향후 확장 계획

### 5.1 실시간 알림

- WebSocket 또는 Server-Sent Events 도입
- 즉시 알림 표시

### 5.2 알림 설정

- 사용자별 알림 수신 설정
- 이메일/SMS 알림 연동

### 5.3 전체 알림 페이지

- `/notifications` 페이지 구현
- 무한 스크롤 또는 페이지네이션

### 5.4 알림 카테고리

- 알림 타입별 필터링
- 중요도별 분류

## 6. 문제 해결

### 6.1 알림이 표시되지 않는 경우

1. 브라우저 콘솔에서 네트워크 오류 확인
2. JWT 토큰 유효성 확인
3. 데이터베이스 연결 상태 확인

### 6.2 읽음 처리가 안 되는 경우

1. 사용자 권한 확인 (본인 알림인지)
2. 데이터베이스 외래키 제약 조건 확인

### 6.3 성능 이슈

1. 알림 목록이 많을 경우 페이지네이션 적용
2. 오래된 알림 자동 삭제 정책 수립

## 7. 보안 고려사항

### 7.1 권한 검증

- 본인 알림만 조회 가능
- 역할 기반 알림은 해당 역할 사용자만 조회

### 7.2 입력 검증

- XSS 방지를 위한 HTML 태그 필터링
- SQL 인젝션 방지

### 7.3 Rate Limiting

- 알림 전송 API 요청 제한
- 폴링 요청 간격 제한

이제 알림 기능이 완전히 구현되었습니다. 위 가이드를 따라 테스트해보세요!
