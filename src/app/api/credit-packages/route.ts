import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 크레딧 패키지 목록 조회 (GET)
export async function GET() {
  try {
    // 활성화된 크레딧 패키지만 조회
    const { data: packages, error } = await supabase
      .from("credit_packages")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("크레딧 패키지 조회 오류:", error);
      return NextResponse.json(
        { error: "크레딧 패키지 조회에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      packages: packages || [],
    });
  } catch (error) {
    console.error("크레딧 패키지 조회 오류:", error);
    return NextResponse.json(
      { error: "크레딧 패키지 조회에 실패했습니다." },
      { status: 500 }
    );
  }
}
