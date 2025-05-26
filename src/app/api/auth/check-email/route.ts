import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 서버 사이드에서는 서비스 역할 키 우선 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 서비스 키가 있으면 서비스 키 사용, 없으면 anon 키 사용
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // 입력 검증
    if (!email) {
      return NextResponse.json(
        {
          message: "이메일은 필수입니다.",
          error: "Missing email",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/check-email",
        },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          message: "올바른 이메일 형식이 아닙니다.",
          error: "Invalid email format",
          status: 400,
          timestamp: new Date().toISOString(),
          path: "/api/auth/check-email",
          available: false,
        },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (checkError) {
      console.error("Email check error:", checkError);
      return NextResponse.json(
        {
          message: "이메일 확인 중 오류가 발생했습니다.",
          error: `Database Error: ${checkError.message}`,
          status: 500,
          timestamp: new Date().toISOString(),
          path: "/api/auth/check-email",
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          message: "이미 사용 중인 이메일입니다.",
          error: "Email already exists",
          status: 409,
          timestamp: new Date().toISOString(),
          path: "/api/auth/check-email",
          available: false,
        },
        { status: 409 }
      );
    }

    // 사용 가능한 이메일
    return NextResponse.json(
      {
        message: "사용 가능한 이메일입니다.",
        available: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email check error:", error);
    return NextResponse.json(
      {
        message: "이메일 확인 중 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: new Date().toISOString(),
        path: "/api/auth/check-email",
      },
      { status: 500 }
    );
  }
}
