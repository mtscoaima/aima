import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getKSTISOString } from "@/lib/utils";

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username } = body;

    // 입력 검증
    if (!username) {
      return NextResponse.json(
        {
          message: "아이디는 필수입니다.",
          error: "Missing username",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/check-username",
        },
        { status: 400 }
      );
    }

    // 아이디 형식 검증
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        {
          message:
            "아이디는 영문, 숫자, 언더스코어만 사용하여 3-20자로 입력하세요.",
          error: "Invalid username format",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/auth/check-username",
        },
        { status: 400 }
      );
    }

    // 아이디 중복 확인
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (checkError) {
      console.error("Username check error:", checkError);
      return NextResponse.json(
        {
          message: "아이디 확인 중 오류가 발생했습니다.",
          error: `Database Error: ${checkError.message}`,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/auth/check-username",
        },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        {
          message: "이미 사용 중인 아이디입니다.",
          error: "Username already exists",
          status: 409,
          timestamp: getKSTISOString(),
          path: "/api/auth/check-username",
        },
        { status: 409 }
      );
    }

    // 사용 가능한 아이디
    return NextResponse.json(
      {
        message: "사용 가능한 아이디입니다.",
        available: true,
        timestamp: getKSTISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Username check error:", error);
    return NextResponse.json(
      {
        message: "서버 내부 오류가 발생했습니다.",
        error: "Internal server error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/auth/check-username",
      },
      { status: 500 }
    );
  }
}
