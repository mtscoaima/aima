This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Environment Setup

Create a `.env.local` file in the root directory and add your backend API server URL:

```bash
# 백엔드 API 서버 URL (서버 사이드에서 사용) - /api 경로 제외
BACKEND_API_URL=https://ea3d-211-243-12-130.ngrok-free.app

# 클라이언트 사이드 API URL (선택사항, 기본값은 빈 문자열)
NEXT_PUBLIC_API_BASE_URL=
```

**CORS 해결 방법:**

- 이 프로젝트는 Next.js API 라우트를 프록시로 사용하여 CORS 문제를 해결합니다
- 클라이언트에서는 `/api/users/login`으로 요청하고, Next.js 서버에서 실제 백엔드 API로 프록시합니다
- `BACKEND_API_URL`에는 실제 백엔드 서버 주소를 설정하세요

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
