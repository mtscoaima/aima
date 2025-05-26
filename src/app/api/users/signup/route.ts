import { NextRequest, NextResponse } from "next/server";

// 실제 백엔드 API 서버 URL
const BACKEND_API_URL = process.env.BACKEND_API_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phoneNumber } = body;

    // 유효성 검사
    if (!email || !password) {
      return NextResponse.json(
        {
          message: "이메일과 비밀번호는 필수입니다",
          error: "Validation Error",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/users/signup",
        },
        { status: 400 }
      );
    }

    if (!name || !phoneNumber) {
      return NextResponse.json(
        {
          message: "이름과 전화번호는 필수입니다",
          error: "Validation Error",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/users/signup",
        },
        { status: 400 }
      );
    }

    // 백엔드 API가 설정된 경우 백엔드로 요청 전달
    if (BACKEND_API_URL) {
      const apiUrl = `${BACKEND_API_URL}/api/users/signup`;
      console.log("Sending signup request to:", apiUrl);
      console.log("Request body:", body);

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            "User-Agent": "NextJS-Proxy/1.0",
          },
          body: JSON.stringify(body),
        });

        console.log("Response status:", response.status);

        // 응답의 Content-Type 확인
        const contentType = response.headers.get("content-type");
        console.log("Content-Type:", contentType);

        // HTML 응답인 경우
        if (contentType && contentType.includes("text/html")) {
          console.log("Received HTML response from backend");
          // HTML 응답 시 임시 성공 응답 반환 (개발용)
          return NextResponse.json({
            id: Date.now().toString(),
            email,
            name,
            phoneNumber,
            role: "USER",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // JSON 응답 처리
        let data;
        try {
          data = await response.json();
        } catch {
          console.log("Failed to parse JSON from backend");
          // JSON 파싱 실패 시 임시 성공 응답 반환 (개발용)
          return NextResponse.json({
            id: Date.now().toString(),
            email,
            name,
            phoneNumber,
            role: "USER",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        console.log("Parsed response data:", data);

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data);
      } catch (fetchError) {
        console.error("Backend fetch error:", fetchError);
        // 백엔드 연결 실패 시 임시 성공 응답 반환 (개발용)
        return NextResponse.json({
          id: Date.now().toString(),
          email,
          name,
          phoneNumber,
          role: "USER",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // 백엔드 API가 설정되지 않은 경우 임시 응답 반환 (개발용)
    console.log("No backend API configured, returning mock response");
    return NextResponse.json({
      id: Date.now().toString(),
      email,
      name,
      phoneNumber,
      role: "USER",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Signup API Error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다.",
        error: "Internal Server Error",
        status: 500,
        timestamp: new Date().toISOString(),
        path: "/api/users/signup",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
