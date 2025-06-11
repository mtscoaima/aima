import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 서버 사이드에서는 서비스 역할 키 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 서비스 키 사용
const supabaseKey = supabaseServiceKey;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      "Content-Type": "application/json",
    },
  },
});

interface RefreshTokenPayload {
  userId: number;
  email: string;
  type: string;
  iat?: number;
  exp?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        {
          message: "리프레시 토큰이 필요합니다.",
          error: "Missing refresh token",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/refresh",
        },
        { status: 400 }
      );
    }

    // 리프레시 토큰 검증
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, JWT_SECRET) as RefreshTokenPayload;
    } catch {
      return NextResponse.json(
        {
          message: "유효하지 않은 리프레시 토큰입니다.",
          error: "Invalid refresh token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/refresh",
        },
        { status: 401 }
      );
    }

    // 토큰 타입 확인
    if (decoded.type !== "refresh") {
      return NextResponse.json(
        {
          message: "잘못된 토큰 타입입니다.",
          error: "Invalid token type",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/refresh",
        },
        { status: 401 }
      );
    }

    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", decoded.userId)
      .eq("email", decoded.email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          message: "사용자를 찾을 수 없습니다.",
          error: "User not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/users/refresh",
        },
        { status: 404 }
      );
    }

    // 계정 활성화 상태 확인
    if (!user.is_active) {
      return NextResponse.json(
        {
          message: "비활성화된 계정입니다.",
          error: "Account deactivated",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/refresh",
        },
        { status: 401 }
      );
    }

    // 새로운 액세스 토큰 생성
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phone_number,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 토큰 갱신 시 마지막 로그인 시간 업데이트
    console.log(
      "Updating last_login_at for user during token refresh:",
      user.id
    );
    const updateTime = getKSTISOString();
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({ last_login_at: updateTime })
      .eq("id", user.id)
      .select("last_login_at");

    if (updateError) {
      console.error(
        "Failed to update last_login_at during token refresh:",
        updateError
      );
      console.error("Refresh update error details:", {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
    } else {
      console.log(
        "Successfully updated last_login_at during token refresh for user:",
        user.id
      );
      console.log("Refresh update result:", updateData);
    }

    // 성공 응답
    return NextResponse.json(
      {
        accessToken: newAccessToken,
        tokenType: "Bearer",
        expiresIn: 3600,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phone_number,
          role: user.role,
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("토큰 갱신 에러:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/refresh",
      },
      { status: 500 }
    );
  }
}
