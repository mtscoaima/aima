import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface UserInfo {
  userId: number;
  role: string;
}

export interface AuthValidationResult {
  isValid: boolean;
  userInfo?: UserInfo;
  error?: string;
  errorResponse?: NextResponse;
}

/**
 * JWT 토큰을 검증하고 사용자 정보를 반환합니다.
 * @param request - NextRequest 객체
 * @returns 검증 결과와 사용자 정보 또는 에러 응답
 */
export function validateAuth(request: NextRequest): AuthValidationResult {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("인증 실패: Authorization 헤더가 없거나 형식이 잘못됨");
      return {
        isValid: false,
        error: "로그인이 필요합니다. 다시 로그인해주세요.",
        errorResponse: NextResponse.json(
          { error: "로그인이 필요합니다. 다시 로그인해주세요." },
          { status: 401 }
        )
      };
    }

    const token = authHeader.substring(7);

    // JWT 토큰 검증
    let decodedToken: { userId: string | number; role: string; exp?: number };
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as { userId: string | number; role: string; exp?: number };
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        console.error("JWT 토큰 만료됨:", error.message);
        return {
          isValid: false,
          error: "토큰이 만료되었습니다. 클라이언트에서 자동으로 갱신됩니다.",
          errorResponse: NextResponse.json(
            {
              error: "토큰이 만료되었습니다. 클라이언트에서 자동으로 갱신됩니다.",
              code: "TOKEN_EXPIRED"
            },
            { status: 401 }
          )
        };
      }
      console.error("JWT 토큰 검증 실패:", error);
      return {
        isValid: false,
        error: "유효하지 않은 토큰입니다. 다시 로그인해주세요.",
        errorResponse: NextResponse.json(
          { error: "유효하지 않은 토큰입니다. 다시 로그인해주세요." },
          { status: 401 }
        )
      };
    }

    // 토큰에 사용자 ID가 없는 경우
    if (!decodedToken.userId) {
      console.error("JWT 토큰에 사용자 ID가 없음");
      return {
        isValid: false,
        error: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
        errorResponse: NextResponse.json(
          { error: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요." },
          { status: 401 }
        )
      };
    }

    const userId = typeof decodedToken.userId === 'string'
      ? parseInt(decodedToken.userId)
      : decodedToken.userId;

    return {
      isValid: true,
      userInfo: {
        userId,
        role: decodedToken.role || 'USER'
      }
    };
  } catch (error) {
    console.error("인증 검증 중 예상치 못한 오류:", error);
    return {
      isValid: false,
      error: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      errorResponse: NextResponse.json(
        { error: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 }
      )
    };
  }
}

/**
 * 관리자 권한을 확인합니다.
 * @param userInfo - 사용자 정보
 * @returns 권한 확인 결과
 */
export function validateAdminAuth(userInfo: UserInfo): AuthValidationResult {
  if (!userInfo || userInfo.role !== 'ADMIN') {
    console.error(`관리자 권한 체크 실패: 사용자 ID ${userInfo?.userId}, 역할 ${userInfo?.role}`);
    return {
      isValid: false,
      error: "접근 권한이 없습니다.",
      errorResponse: NextResponse.json(
        { error: "접근 권한이 없습니다." },
        { status: 403 }
      )
    };
  }

  return { isValid: true, userInfo };
}

/**
 * 인증을 검증하고 관리자 권한까지 확인합니다.
 * @param request - NextRequest 객체
 * @returns 검증 결과와 사용자 정보 또는 에러 응답
 */
export function validateAuthAndAdmin(request: NextRequest): AuthValidationResult {
  const authResult = validateAuth(request);
  if (!authResult.isValid || !authResult.userInfo) {
    return authResult;
  }

  return validateAdminAuth(authResult.userInfo);
}

/**
 * 간단한 인증 검증 (레거시 호환용)
 * @param request - NextRequest 객체
 * @returns 사용자 정보 또는 null
 */
export function getUserInfoFromToken(request: NextRequest): UserInfo | null {
  const result = validateAuth(request);
  return result.isValid ? result.userInfo || null : null;
}

/**
 * NextResponse용 에러 메시지 생성 (success 필드 포함)
 * @param message - 에러 메시지
 * @param status - HTTP 상태 코드
 * @returns NextResponse 객체
 */
export function createAuthErrorResponse(message: string, status: number = 401): NextResponse {
  return NextResponse.json(
    { success: false, message },
    { status }
  );
}

/**
 * 인증 검증 후 success 필드가 포함된 에러 응답 반환
 * @param request - NextRequest 객체
 * @returns 검증 결과 (success 필드 포함된 응답)
 */
export function validateAuthWithSuccess(request: NextRequest): AuthValidationResult {
  const result = validateAuth(request);

  if (!result.isValid && result.error) {
    return {
      ...result,
      errorResponse: createAuthErrorResponse(result.error, 401)
    };
  }

  return result;
}

/**
 * 관리자 권한 검증 후 success 필드가 포함된 에러 응답 반환
 * @param request - NextRequest 객체
 * @returns 검증 결과 (success 필드 포함된 응답)
 */
export function validateAuthAndAdminWithSuccess(request: NextRequest): AuthValidationResult {
  const result = validateAuthAndAdmin(request);

  if (!result.isValid && result.error) {
    const status = result.error.includes("접근 권한") ? 403 : 401;
    return {
      ...result,
      errorResponse: createAuthErrorResponse(result.error, status)
    };
  }

  return result;
}