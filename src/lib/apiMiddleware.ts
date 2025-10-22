/**
 * API 미들웨어 (Higher-Order Functions)
 *
 * Next.js API Route에서 인증, 권한 검증 등을 간편하게 처리하기 위한 미들웨어 함수들입니다.
 * HOF(Higher-Order Function) 패턴을 사용하여 핸들러를 래핑합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateAuth, validateAuthAndAdmin, UserInfo } from "@/utils/authUtils";

/**
 * API 핸들러 타입 정의
 */
export type ApiHandler = (
  request: NextRequest,
  userInfo: UserInfo
) => Promise<NextResponse>;

/**
 * 인증 필수 미들웨어
 *
 * API 핸들러를 래핑하여 자동으로 인증을 검증합니다.
 * 인증에 실패하면 401 에러를 반환하고, 성공하면 핸들러를 실행합니다.
 *
 * @param handler - 인증된 사용자 정보를 받는 API 핸들러
 * @returns 래핑된 API 핸들러
 *
 * @example
 * export const GET = withAuth(async (request, userInfo) => {
 *   const { userId, role } = userInfo;
 *   // ... 로직
 *   return NextResponse.json({ data });
 * });
 */
export function withAuth(handler: ApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = validateAuth(request);

    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    return handler(request, authResult.userInfo!);
  };
}

/**
 * 관리자 권한 필수 미들웨어
 *
 * API 핸들러를 래핑하여 자동으로 관리자 권한을 검증합니다.
 * 인증 실패 시 401, 권한 없음 시 403 에러를 반환합니다.
 *
 * @param handler - 관리자 사용자 정보를 받는 API 핸들러
 * @returns 래핑된 API 핸들러
 *
 * @example
 * export const GET = withAdminAuth(async (request, userInfo) => {
 *   // userInfo.role === 'ADMIN' 보장됨
 *   // ... 관리자 전용 로직
 *   return NextResponse.json({ data });
 * });
 */
export function withAdminAuth(handler: ApiHandler) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = validateAuthAndAdmin(request);

    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    return handler(request, authResult.userInfo!);
  };
}

/**
 * 에러 핸들링 미들웨어
 *
 * API 핸들러에서 발생하는 예외를 자동으로 처리합니다.
 *
 * @param handler - API 핸들러
 * @returns 래핑된 API 핸들러
 *
 * @example
 * export const GET = withErrorHandling(async (request) => {
 *   // 에러가 발생해도 자동으로 500 응답 반환
 *   throw new Error("Something went wrong");
 * });
 */
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      console.error("API Error:", error);

      return NextResponse.json(
        {
          success: false,
          error: "서버 내부 오류가 발생했습니다",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    }
  };
}

/**
 * 여러 미들웨어를 조합하는 헬퍼 함수
 *
 * @param middlewares - 미들웨어 배열
 * @param handler - 최종 API 핸들러
 * @returns 래핑된 API 핸들러
 *
 * @example
 * export const GET = compose(
 *   [withAuth, withErrorHandling],
 *   async (request, userInfo) => {
 *     return NextResponse.json({ data });
 *   }
 * );
 */
export function compose(
  middlewares: Array<(handler: ApiHandler) => (request: NextRequest) => Promise<NextResponse>>,
  handler: ApiHandler
) {
  return middlewares.reduceRight(
    (acc, middleware) => middleware(acc as ApiHandler) as unknown as ApiHandler,
    handler
  ) as (request: NextRequest) => Promise<NextResponse>;
}
