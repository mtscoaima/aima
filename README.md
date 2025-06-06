This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Setup

Create a `.env.local` file in the root directory and add your Supabase configuration:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT 토큰 시크릿 키 (로그인 시 사용)
JWT_SECRET=your_jwt_secret_key_here
```

**Supabase 설정 방법:**

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성합니다
2. 프로젝트 설정에서 API 키를 확인합니다:
   - `NEXT_PUBLIC_SUPABASE_URL`: 프로젝트 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon/public 키
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role 키 (서버 사이드 전용)

### Database Setup

3. SQL Editor에서 다음 테이블을 생성합니다:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  role VARCHAR(20) DEFAULT 'USER',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,

  -- JSON 객체로 저장되는 정보들
  company_info JSONB,           -- 기업 정보
  tax_invoice_info JSONB,       -- 세금계산서 정보
  documents JSONB,              -- 제출 서류 (Storage URL)
  agreement_info JSONB,         -- 약관 동의 정보
  agree_marketing BOOLEAN DEFAULT false  -- 기존 호환성을 위해 유지
);

-- JSON 필드 검색 성능을 위한 인덱스
CREATE INDEX idx_users_company_info ON users USING GIN (company_info);
CREATE INDEX idx_users_tax_invoice_info ON users USING GIN (tax_invoice_info);
CREATE INDEX idx_users_documents ON users USING GIN (documents);
CREATE INDEX idx_users_agreement_info ON users USING GIN (agreement_info);
```

### Storage Setup

4. Storage 버킷과 정책을 설정합니다. SQL Editor에서 다음을 실행하세요:

```sql
-- Supabase Storage 버킷 생성 및 정책 설정

-- 1. user-documents 버킷 생성 (private 버킷)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false,  -- private 버킷
  10485760,  -- 10MB 제한
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- 2. 사용자별 폴더 접근 정책 설정

-- 업로드 정책: 인증된 사용자가 자신의 폴더에만 업로드 가능
CREATE POLICY "Users can upload to their own folder" ON storage.objects
FOR INSERT WITH CHECK (
  auth.uid()::text = (storage.foldername(name))[1]
  AND bucket_id = 'user-documents'
);

-- 조회 정책: 인증된 사용자가 자신의 파일만 조회 가능
CREATE POLICY "Users can view their own files" ON storage.objects
FOR SELECT USING (
  auth.uid()::text = (storage.foldername(name))[1]
  AND bucket_id = 'user-documents'
);

-- 업데이트 정책: 인증된 사용자가 자신의 파일만 업데이트 가능
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  auth.uid()::text = (storage.foldername(name))[1]
  AND bucket_id = 'user-documents'
);

-- 삭제 정책: 인증된 사용자가 자신의 파일만 삭제 가능
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  auth.uid()::text = (storage.foldername(name))[1]
  AND bucket_id = 'user-documents'
);

-- 3. 버킷 접근 정책 (선택사항)
-- 모든 인증된 사용자가 버킷을 볼 수 있도록 허용
CREATE POLICY "Authenticated users can access user-documents bucket" ON storage.buckets
FOR SELECT USING (
  auth.role() = 'authenticated'
  AND id = 'user-documents'
);
```

**JSON 데이터 구조:**

```json
// company_info 예시
{
  "companyName": "(주)회사명",
  "ceoName": "대표자명",
  "businessNumber": "123-45-67890",
  "companyAddress": "서울시 강남구...",
  "companyAddressDetail": "상세주소",
  "companyPhone": "02-1234-5678",
  "toll080Number": "080-123-4567",
  "customerServiceNumber": "1588-1234"
}

// tax_invoice_info 예시
{
  "email": "tax@company.com",
  "manager": "담당자명",
  "contact": "010-1234-5678"
}

// documents 예시
{
  "businessRegistration": {
    "fileName": "사업자등록증.pdf",
    "fileUrl": "https://supabase-storage-url/documents/user123/business_registration.pdf",
    "uploadedAt": "2025-01-15T10:30:00Z"
  },
  "employmentCertificate": {
    "fileName": "재직증명서.pdf",
    "fileUrl": "https://supabase-storage-url/documents/user123/employment_certificate.pdf",
    "uploadedAt": "2025-01-15T10:35:00Z"
  }
}

// agreement_info 예시
{
  "terms": true,           // 서비스 이용약관 동의
  "privacy": true,         // 개인정보 수집 및 이용 동의
  "marketing": false,      // 마케팅 정보 수집 및 활용 동의 (선택)
  "agreedAt": "2025-01-15T10:30:00Z"  // 동의 시점
}
```

**데이터베이스 직접 연결:**

- 이 프로젝트는 Supabase를 직접 사용하여 사용자 인증을 처리합니다
- 별도의 백엔드 서버 없이 Next.js API 라우트에서 직접 데이터베이스에 연결합니다
- 비밀번호는 bcrypt로 해싱되어 안전하게 저장됩니다
- 파일은 Supabase Storage에 안전하게 저장되며 사용자별 접근 제어가 적용됩니다

**기존 데이터베이스 업데이트 (마이그레이션):**

기존에 users 테이블이 있는 경우, 다음 SQL을 실행하여 약관 동의 정보 필드를 추가하세요:

```sql
-- agreement_info 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS agreement_info JSONB;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_users_agreement_info ON users USING GIN (agreement_info);

-- 기존 사용자들의 약관 동의 정보 초기화 (선택사항)
UPDATE users
SET agreement_info = jsonb_build_object(
  'terms', false,
  'privacy', false,
  'marketing', COALESCE(agree_marketing, false),
  'agreedAt', created_at
)
WHERE agreement_info IS NULL;
```

**중요:** 환경변수를 변경한 후에는 개발 서버를 재시작해야 합니다.

## Vercel 배포 가이드

### 1. 환경변수 설정

Vercel 대시보드에서 다음 환경변수들을 설정해주세요:

**필수 환경변수:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase 서비스 역할 키
- `JWT_SECRET`: JWT 토큰 암호화 키
- `NAVER_SENS_SERVICE_ID`: 네이버 SENS 서비스 ID
- `NAVER_ACCESS_KEY_ID`: 네이버 클라우드 액세스 키
- `NAVER_SECRET_KEY`: 네이버 클라우드 시크릿 키
- `TEST_CALLING_NUMBER`: 테스트용 발신번호
- `OPENAI_API_KEY`: OpenAI API 키

**선택적 환경변수:**
- `NEXT_PUBLIC_BASE_URL`: 베이스 URL (설정하지 않으면 자동으로 감지됨)

### 2. 자동 URL 감지

이 프로젝트는 Vercel 배포 시 다음과 같이 자동으로 URL을 감지합니다:

1. `NEXT_PUBLIC_BASE_URL` 환경변수가 있으면 사용
2. Vercel 환경에서는 `VERCEL_URL` 자동 사용
3. 요청 헤더에서 호스트 정보 추출
4. 개발 환경에서는 `localhost:3000` 사용

따라서 `NEXT_PUBLIC_BASE_URL`을 설정하지 않아도 정상적으로 작동합니다.

### 3. 배포 확인사항

- 모든 필수 환경변수가 설정되었는지 확인
- Supabase 데이터베이스와 Storage가 올바르게 설정되었는지 확인
- 네이버 SENS와 OpenAI API 키가 유효한지 확인

### Running the Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

### Authentication

- User login with email and password
- User signup with email, password, name, and phone number
- JWT token management with automatic refresh
- Automatic logout functionality
- Protected routes and user state management
- Form validation and error handling
- Phone number verification with SMS-like functionality

### Token Management

- **Access Token**: 1시간 유효기간
- **Refresh Token**: 장기간 유효 (로그인 시 발급)
- **자동 토큰 갱신**:
  - API 호출 시 401 에러 발생 시 자동으로 토큰 갱신 후 재시도
  - 55분마다 정기적으로 토큰 갱신 (백그라운드)
  - 토큰 갱신 실패 시 자동 로그아웃
- **보안**: 리프레시 토큰 만료 시 재로그인 필요

### File Upload

- Document upload during signup (business registration, employment certificate)
- Secure file storage using Supabase Storage
- User-specific access control policies
- File type validation (PDF, JPG, PNG)
- File size limits (10MB per file)
- Automatic file URL generation and database storage

### API Integration

- Login API: `POST /api/users/login`
- Signup API: `POST /api/users/signup` (basic info only)
- Signup with Files API: `POST /api/users/signup-with-files` (with file upload)
- Upload Documents API: `POST /api/users/upload-documents` (requires authentication)
- User Info API: `GET /api/users/me` (requires authentication)
- **Token Refresh API: `POST /api/users/refresh`** (토큰 갱신)

### Form Features

- Multi-step signup form with progress indicator
- Real-time form validation
- Email duplicate checking
- Password strength indicator
- Phone number verification
- File upload with drag & drop support
- Terms and conditions with bulk agreement option

### Advanced Features

- **Automatic Token Refresh**:
  - 모든 API 호출에서 401 에러 시 자동 토큰 갱신
  - 사용자 경험 중단 없이 seamless 인증 유지
- **Background Token Refresh**: 55분마다 자동 갱신
- **Error Handling**: 토큰 만료, 네트워크 오류 등 다양한 상황 처리
- **Security**: JWT 기반 stateless 인증

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
