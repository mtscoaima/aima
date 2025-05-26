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
  last_login_at TIMESTAMP WITH TIME ZONE
);
```

**데이터베이스 직접 연결:**

- 이 프로젝트는 Supabase를 직접 사용하여 사용자 인증을 처리합니다
- 별도의 백엔드 서버 없이 Next.js API 라우트에서 직접 데이터베이스에 연결합니다
- 비밀번호는 bcrypt로 해싱되어 안전하게 저장됩니다

**중요:** 환경변수를 변경한 후에는 개발 서버를 재시작해야 합니다.

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
- JWT token management
- Automatic logout functionality
- Protected routes and user state management
- Form validation and error handling

### API Integration

- Login API: `POST /api/users/login`
- Signup API: `POST /api/users/signup`
- Login request body: `{ "email": "user@example.com", "password": "Password123!" }`
- Signup request body: `{ "email": "user@example.com", "password": "Password123!", "name": "홍길동", "phoneNumber": "010-1234-5678" }`
- Response includes access token, refresh token, and user information

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
