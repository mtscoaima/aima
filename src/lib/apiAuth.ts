/**
 * API 인증 헬퍼 함수
 *
 * Next.js API Route에서 인증을 쉽게 처리하기 위한 유틸리티 함수들입니다.
 * authUtils.ts를 기반으로 API에 특화된 헬퍼 함수를 제공합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { validateAuth, validateAuthAndAdmin, UserInfo } from "@/utils/authUtils";

/**
 * 인증 필수 체크 (간편 버전)
 *
 * @param request - NextRequest 객체
 * @returns 인증된 사용자 정보 또는 에러 응답
 *
 * @example
 * const authResult = requireAuth(request);
 * if (authResult instanceof NextResponse) return authResult;
 * const { userId, role } = authResult;
 */
export function requireAuth(request: NextRequest): UserInfo | NextResponse {
  const result = validateAuth(request);

  if (!result.isValid) {
    return result.errorResponse!;
  }

  return result.userInfo!;
}

/**
 * 관리자 권한 필수 체크
 *
 * @param request - NextRequest 객체
 * @returns 관리자 사용자 정보 또는 에러 응답
 *
 * @example
 * const authResult = requireAdmin(request);
 * if (authResult instanceof NextResponse) return authResult;
 * const { userId, role } = authResult;
 */
export function requireAdmin(request: NextRequest): UserInfo | NextResponse {
  const result = validateAuthAndAdmin(request);

  if (!result.isValid) {
    return result.errorResponse!;
  }

  return result.userInfo!;
}

/**
 * JWT 토큰에서 사용자 ID만 추출 (레거시 호환용)
 *
 * @param token - JWT 토큰 문자열
 * @returns 사용자 ID 또는 null
 *
 * @deprecated requireAuth()를 사용하세요
 */
export function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return payload.userId || null;
  } catch {
    return null;
  }
}

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 *
 * @param request - NextRequest 객체
 * @returns 토큰 문자열 또는 null
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
}
