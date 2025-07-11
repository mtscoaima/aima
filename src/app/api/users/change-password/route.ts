import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 서버 사이드에서는 서비스 역할 키 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // JWT 토큰 검증
    let decoded: {
      userId: string;
      email: string;
      name: string;
      phoneNumber: string;
      role: string;
    };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        name: string;
        phoneNumber: string;
        role: string;
      };
    } catch {
      return NextResponse.json(
        {
          message: "유효하지 않은 토큰",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 401 }
      );
    }

    // 토큰에서 사용자 ID 추출
    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        {
          message: "토큰에 사용자 정보가 없습니다",
          error: "Invalid token payload",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 401 }
      );
    }

    // 요청 본문 파싱
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    }: ChangePasswordRequest = await request.json();

    // 입력값 검증
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          message: "모든 필드를 입력해주세요",
          error: "Missing required fields",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 400 }
      );
    }

    // 새 비밀번호 확인
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          message: "새 비밀번호가 일치하지 않습니다",
          error: "Password confirmation failed",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 400 }
      );
    }

    // 새 비밀번호 길이 검증
    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          message: "새 비밀번호는 8자 이상이어야 합니다",
          error: "Password too short",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, password")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("User query error:", userError);
      return NextResponse.json(
        {
          message: "사용자 정보 조회 중 오류가 발생했습니다",
          error: `Database Error: ${userError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        {
          message: "사용자를 찾을 수 없습니다",
          error: "User not found",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 404 }
      );
    }

    // 현재 비밀번호 확인

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          message: "현재 비밀번호가 올바르지 않습니다",
          error: "Current password is incorrect",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 400 }
      );
    }

    // 새 비밀번호 해싱
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 비밀번호 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password: hashedNewPassword,
        updated_at: getKSTISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json(
        {
          message: "비밀번호 변경 중 오류가 발생했습니다",
          error: `Database Error: ${updateError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/users/change-password",
        },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json(
      {
        message: "비밀번호가 성공적으로 변경되었습니다",
        timestamp: getKSTISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/change-password",
      },
      { status: 500 }
    );
  }
}
