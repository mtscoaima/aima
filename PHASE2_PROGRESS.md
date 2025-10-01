# Phase 2: 메시지 시스템 구현 진행 상황

**최종 업데이트**: 2025-10-01

## 📊 전체 진행률: 60% (3/5 단계 완료)

---

## ✅ 완료된 작업

### 1. 데이터베이스 마이그레이션 (완료)
- ✅ `reservation_message_logs` 테이블 생성
- ✅ Supabase DB 마이그레이션 실행 완료
- ✅ 인덱스 및 구조 검증 완료

### 2. 변수 치환 유틸리티 (완료)
- ✅ `src/utils/messageTemplateParser.ts` 작성
- ✅ 11개 템플릿 변수 지원
  - `{{고객명}}`, `{{공간명}}`, `{{예약날짜}}`, `{{체크인시간}}`, `{{체크아웃시간}}`
  - `{{인원수}}`, `{{총금액}}`, `{{입금액}}`, `{{잔금}}`, `{{전화번호}}`, `{{특이사항}}`
- ✅ 바이트 계산 및 SMS/LMS 자동 판단 기능
- ✅ 미리보기 기능 (샘플 데이터 치환)

### 3. 템플릿 CRUD API (완료)
- ✅ `GET /api/reservations/message-templates` - 템플릿 목록 조회 (카테고리 필터 지원)
- ✅ `POST /api/reservations/message-templates` - 템플릿 생성
- ✅ `GET /api/reservations/message-templates/[id]` - 템플릿 상세 조회
- ✅ `PUT /api/reservations/message-templates/[id]` - 템플릿 수정
- ✅ `DELETE /api/reservations/message-templates/[id]` - 템플릿 삭제

**구현된 기능:**
- JWT 인증 기반 사용자 권한 체크
- 소유자 검증 (user_id 매칭)
- 입력 데이터 검증 (이름 100자, 내용 2000자 제한)
- Next.js 15 Promise params 호환성

### 4. 템플릿 UI 연동 (완료)
- ✅ `/reservations/message/templates` 페이지 API 연동
- ✅ 템플릿 생성 모달 (변수 안내 포함)
- ✅ 템플릿 수정 모달 (기존 데이터 로드)
- ✅ 템플릿 삭제 기능 (확인 다이얼로그)
- ✅ 실시간 미리보기 (변수 치환 표시)
- ✅ 글자 수 카운터 (이름/내용)
- ✅ 카테고리 선택 (6개 카테고리)

---

## ⏳ 진행 중인 작업

### 5. 메시지 발송 API 구현 (다음 단계)
**예상 소요 시간**: 3-4시간

**구현 예정:**
- [ ] `POST /api/reservations/send-message` 엔드포인트
- [ ] 예약 데이터 조회 (JOIN spaces)
- [ ] 템플릿 변수 치환 통합
- [ ] Naver SENS API 호출 연동
- [ ] 크레딧 차감 로직 연동
- [ ] `reservation_message_logs` 테이블에 발송 이력 저장
- [ ] 에러 핸들링 및 롤백 처리

**API 스펙:**
```typescript
POST /api/reservations/send-message
Body: {
  reservationId: number,
  templateId?: number,     // 선택사항
  message: string,         // 최종 메시지 내용
  toNumber?: string        // 선택사항 (기본값: customer_phone)
}

Response: {
  success: boolean,
  messageId?: string,
  log?: {
    id: number,
    sent_at: string,
    message_type: 'SMS' | 'LMS'
  },
  error?: string
}
```

---

## 📋 남은 작업

### 6. 메시지 발송 UI 연동 (Day 4)
**예상 소요 시간**: 2-3시간

- [ ] `/reservations/message/send` 페이지 수정
  - [ ] "예약 리스트에서 선택하기" 모달 구현
  - [ ] "내 템플릿에서 불러오기" 드롭다운 연동
  - [ ] "자동 문구 넣기" 변수 삽입 버튼
  - [ ] 바이트 수 계산 표시 (SMS/LMS 구분)
  - [ ] 발송 API 연결
  - [ ] 발송 성공/실패 피드백

- [ ] `/reservations/detail/[id]` 페이지 수정
  - [ ] "메시지 보내기" 버튼 추가
  - [ ] `/message/send?reservationId={id}` 이동 연동

---

## 📁 생성된 파일

### 백엔드
```
src/
├── utils/
│   └── messageTemplateParser.ts              ✅ 완료 (273 lines)
└── app/
    └── api/
        └── reservations/
            └── message-templates/
                ├── route.ts                   ✅ 완료 (GET, POST)
                └── [id]/
                    └── route.ts               ✅ 완료 (GET, PUT, DELETE)
```

### 데이터베이스
```
migrations/
├── 20251001_add_reservation_message_logs.sql    ✅ 완료 (실행됨)
├── 20251001_add_reservation_auto_messages.sql   ✅ 준비 (Phase 2.5용)
└── README_PHASE2_MIGRATIONS.md                  ✅ 완료
```

### 프론트엔드
```
src/app/reservations/message/templates/page.tsx  ✅ 완료 (API 연동, 622 lines)
```

---

## 🎯 다음 단계 체크리스트

1. **메시지 발송 API 구현**
   - [ ] 기존 Naver SENS API 함수 확인 (`src/lib/naverSensApi.ts`)
   - [ ] 예약 데이터 조회 쿼리 작성 (JOIN spaces)
   - [ ] 크레딧 잔액 확인 로직
   - [ ] 메시지 발송 후 로그 저장
   - [ ] 트랜잭션 처리 (크레딧 차감 + 로그 저장)

2. **UI 연동 및 테스트**
   - [ ] 메시지 발송 페이지 기능 구현
   - [ ] 예약 상세 페이지 버튼 추가
   - [ ] 통합 테스트 (실제 SMS 발송)
   - [ ] 에러 케이스 테스트

---

## 📝 참고사항

### 기존 시스템 활용
- **Naver SENS API**: `src/lib/naverSensApi.ts` 기존 로직 재사용
- **크레딧 시스템**: 기존 메시지 크레딧 차감 로직 활용
- **발신번호**: `TEST_CALLING_NUMBER` 환경변수 고정 사용

### 제약사항
- 발신번호 변경 불가 (시스템 제약)
- SMS: 90자 이하 / LMS: 90~2000자
- 예약 소유자만 메시지 발송 가능 (JWT 인증)

### 예상 일정
- **Day 3**: 메시지 발송 API 구현 (3-4시간)
- **Day 4**: UI 연동 및 테스트 (2-3시간)
- **총 남은 시간**: 5-7시간

---

## ✨ 완성된 기능

현재까지 완성된 기능들:

1. **템플릿 생성** - 변수 안내와 미리보기 포함
2. **템플릿 수정** - 기존 템플릿 불러오기 및 수정
3. **템플릿 삭제** - 확인 후 삭제
4. **템플릿 미리보기** - 샘플 데이터로 변수 치환 확인
5. **카테고리 필터링** - 6개 카테고리 지원
6. **변수 치환 엔진** - 11개 예약 관련 변수 자동 치환
7. **메시지 타입 자동 판단** - 바이트 계산으로 SMS/LMS 선택

---

**문서 버전**: 1.0
**작성자**: MTS Message 개발팀
