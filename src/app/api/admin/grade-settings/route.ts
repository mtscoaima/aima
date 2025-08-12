import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
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

// 관리자 권한 확인
async function verifyAdminToken(request: NextRequest): Promise<{
  isValid: boolean;
  userId?: string;
  error?: string;
}> {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { isValid: false, error: "Authorization 헤더가 없습니다." };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", decoded.userId)
      .single();

    if (!user || user.role !== "ADMIN") {
      return { isValid: false, error: "관리자 권한이 필요합니다." };
    }

    return { isValid: true, userId: decoded.userId };
  } catch {
    return { isValid: false, error: "권한 확인 중 오류가 발생했습니다." };
  }
}

// GET: 등급 설정 조회
export async function GET(request: NextRequest) {
  try {
    const { isValid, error } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json({ message: error }, { status: 403 });
    }

    const { data: gradeSettings, error: dbError } = await supabase
      .from("grade_settings")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json(
        { message: "등급 설정 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 각 등급별 회원 수 계산
    const { data: gradeCounts } = await supabase
      .from("users")
      .select("grade")
      .eq("role", "USER");

    const counts: Record<string, number> = {};
    if (gradeCounts) {
      gradeCounts.forEach((user) => {
        const grade = user.grade || "일반";
        counts[grade] = (counts[grade] || 0) + 1;
      });
    }

    const settingsWithCounts = gradeSettings?.map((setting) => ({
      ...setting,
      userCount: counts[setting.grade_name] || 0,
    }));

    return NextResponse.json({
      success: true,
      gradeSettings: settingsWithCounts,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// PUT: 등급 설정 수정
export async function PUT(request: NextRequest) {
  try {
    const { isValid, error } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json({ message: error }, { status: 403 });
    }

    const { gradeId, updates } = await request.json();

    if (!gradeId || !updates) {
      return NextResponse.json(
        { message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const { data, error: updateError } = await supabase
      .from("grade_settings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gradeId)
      .select()
      .single();

    if (updateError) {
      console.error("Update Error:", updateError);
      return NextResponse.json(
        { message: "등급 설정 수정 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "등급 설정이 수정되었습니다.",
      data,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 새 등급 추가
export async function POST(request: NextRequest) {
  try {
    const { isValid, error } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json({ message: error }, { status: 403 });
    }

    const newGrade = await request.json();

    const { data, error: insertError } = await supabase
      .from("grade_settings")
      .insert(newGrade)
      .select()
      .single();

    if (insertError) {
      console.error("Insert Error:", insertError);
      return NextResponse.json(
        { message: "등급 추가 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "새 등급이 추가되었습니다.",
      data,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}