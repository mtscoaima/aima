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
      return { isValid: false, error: "로그인이 필요합니다. 다시 로그인해주세요." };
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const { data: user } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", decoded.userId)
      .single();

    if (!user || user.role !== "ADMIN") {
      return { isValid: false, error: "접근 권한이 없습니다." };
    }

    return { isValid: true, userId: decoded.userId };
  } catch {
    return { isValid: false, error: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요." };
  }
}

// GET: 등급 변경 이력 조회
export async function GET(request: NextRequest) {
  try {
    const { isValid, error } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json({ message: error }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("grade_history")
      .select(`
        *,
        user:users!user_id(id, name, username, email),
        changer:users!changed_by(id, name, username)
      `, { count: "exact" });

    if (userId) {
      query = query.eq("user_id", userId);
    }

    if (startDate) {
      query = query.gte("created_at", startDate);
    }

    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const offset = (page - 1) * limit;
    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: history, error: dbError, count } = await query;

    if (dbError) {
      console.error("DB Error:", dbError);
      return NextResponse.json(
        { message: "등급 이력 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      history,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// POST: 수동 등급 조정
export async function POST(request: NextRequest) {
  try {
    const { isValid, userId: adminId, error } = await verifyAdminToken(request);
    if (!isValid) {
      return NextResponse.json({ message: error }, { status: 403 });
    }

    const { userId, newGrade, reason } = await request.json();

    if (!userId || !newGrade || !reason) {
      return NextResponse.json(
        { message: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, grade, name")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("사용자 조회 실패:", userError);
      return NextResponse.json(
        { message: "계정 정보를 찾을 수 없습니다. 다시 로그인해주세요." },
        { status: 404 }
      );
    }

    const previousGrade = user.grade || "일반";

    // 트랜잭션처럼 처리
    // 1. 사용자 등급 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({
        grade: newGrade,
        grade_updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Update Error:", updateError);
      return NextResponse.json(
        { message: "등급 변경 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 2. 등급 변경 이력 기록
    const { error: historyError } = await supabase
      .from("grade_history")
      .insert({
        user_id: userId,
        previous_grade: previousGrade,
        new_grade: newGrade,
        change_reason: reason,
        change_type: "MANUAL",
        changed_by: adminId,
      });

    if (historyError) {
      console.error("History Error:", historyError);
      // 롤백이 필요하지만 Supabase에서는 트랜잭션이 제한적
    }

    return NextResponse.json({
      success: true,
      message: `${user.name}님의 등급이 ${previousGrade}에서 ${newGrade}로 변경되었습니다.`,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}