import { NextRequest, NextResponse } from "next/server";

// 실제 백엔드 API 서버 URL
const BACKEND_API_URL = process.env.BACKEND_API_URL;

// 개발용 Mock 데이터 (백엔드 API가 준비되지 않은 경우)
const MOCK_USER_DATA = {
  id: "1",
  email: "test@example.com",
  name: "홍길동",
  phoneNumber: "010-1234-5678",
  role: "USER",
  createdAt: "2025-01-15T00:00:00.000Z",
  updatedAt: "2025-01-15T00:00:00.000Z",
};

export async function GET(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: new Date().toISOString(),
          path: "/api/users/me",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    const apiUrl = `${BACKEND_API_URL}/api/users/me`;
    console.log("Sending request to:", apiUrl);

    try {
      // 백엔드 API로 요청 전달
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          // ngrok을 사용하는 경우 필요한 헤더들
          "ngrok-skip-browser-warning": "true",
          "User-Agent": "NextJS-Proxy/1.0",
        },
      });

      console.log("Response status:", response.status);

      // 404 에러인 경우 Mock 데이터 반환 (개발용)
      if (response.status === 404) {
        console.log(
          "Backend API not found, returning mock data for development"
        );
        return NextResponse.json(MOCK_USER_DATA);
      }

      // 응답의 Content-Type 확인
      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      // HTML 응답인 경우 텍스트로 읽기
      if (contentType && contentType.includes("text/html")) {
        const htmlText = await response.text();
        console.log("HTML Response:", htmlText.substring(0, 500));

        // HTML 응답도 Mock 데이터로 대체 (개발용)
        console.log(
          "Received HTML response, returning mock data for development"
        );
        return NextResponse.json(MOCK_USER_DATA);
      }

      // JSON 응답 처리
      let data;
      try {
        data = await response.json();
      } catch {
        const textResponse = await response.text();
        console.log("Failed to parse JSON. Raw response:", textResponse);

        // JSON 파싱 실패 시도 Mock 데이터로 대체 (개발용)
        console.log("JSON parsing failed, returning mock data for development");
        return NextResponse.json(MOCK_USER_DATA);
      }

      console.log("Parsed response data:", data);

      if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
      }

      return NextResponse.json(data);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      // 네트워크 에러 등의 경우 Mock 데이터 반환 (개발용)
      console.log("Network error, returning mock data for development");
      return NextResponse.json(MOCK_USER_DATA);
    }
  } catch (error) {
    console.error("User info API Error:", error);
    return NextResponse.json(
      {
        message: "서버 오류가 발생했습니다.",
        error: "Internal Server Error",
        status: 500,
        timestamp: new Date().toISOString(),
        path: "/api/users/me",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
