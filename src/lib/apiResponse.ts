/**
 * API 응답 포맷 헬퍼
 *
 * Next.js API Route에서 일관된 응답 형식을 제공하기 위한 유틸리티 함수들입니다.
 */

import { NextResponse } from "next/server";

/**
 * 성공 응답 표준 포맷
 *
 * @param data - 응답 데이터
 * @param status - HTTP 상태 코드 (기본값: 200)
 * @returns NextResponse 객체
 *
 * @example
 * return successResponse({ users: [...] });
 * return successResponse({ message: "Success" }, 201);
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

/**
 * 에러 응답 표준 포맷
 *
 * @param message - 에러 메시지
 * @param status - HTTP 상태 코드 (기본값: 500)
 * @param code - 에러 코드 (선택사항)
 * @returns NextResponse 객체
 *
 * @example
 * return errorResponse("User not found", 404);
 * return errorResponse("Invalid token", 401, "TOKEN_INVALID");
 */
export function errorResponse(
  message: string,
  status = 500,
  code?: string
): NextResponse {
  const response: {
    success: false;
    error: string;
    code?: string;
  } = {
    success: false,
    error: message,
  };

  if (code) {
    response.code = code;
  }

  return NextResponse.json(response, { status });
}

/**
 * 유효성 검증 에러 응답
 *
 * @param errors - 필드별 에러 메시지 객체
 * @returns NextResponse 객체
 *
 * @example
 * return validationErrorResponse({
 *   email: "이메일 형식이 올바르지 않습니다",
 *   password: "비밀번호는 8자 이상이어야 합니다"
 * });
 */
export function validationErrorResponse(
  errors: Record<string, string>
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      errors,
    },
    { status: 400 }
  );
}

/**
 * 인증 실패 응답
 *
 * @param message - 에러 메시지 (기본값: "인증이 필요합니다")
 * @returns NextResponse 객체
 */
export function unauthorizedResponse(
  message = "인증이 필요합니다"
): NextResponse {
  return errorResponse(message, 401, "UNAUTHORIZED");
}

/**
 * 권한 없음 응답
 *
 * @param message - 에러 메시지 (기본값: "접근 권한이 없습니다")
 * @returns NextResponse 객체
 */
export function forbiddenResponse(
  message = "접근 권한이 없습니다"
): NextResponse {
  return errorResponse(message, 403, "FORBIDDEN");
}

/**
 * 리소스 없음 응답
 *
 * @param resource - 리소스 이름 (기본값: "리소스")
 * @returns NextResponse 객체
 */
export function notFoundResponse(resource = "리소스"): NextResponse {
  return errorResponse(`${resource}를 찾을 수 없습니다`, 404, "NOT_FOUND");
}

/**
 * CORS 허용 OPTIONS 응답
 *
 * @param methods - 허용할 HTTP 메서드 (기본값: "GET, POST, PUT, DELETE, OPTIONS")
 * @returns NextResponse 객체
 */
export function corsOptionsResponse(
  methods = "GET, POST, PUT, DELETE, OPTIONS"
): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": methods,
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
