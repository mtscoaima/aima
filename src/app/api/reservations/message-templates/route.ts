import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const JWT_SECRET = process.env.JWT_SECRET!;

// JWT 토큰에서 userId 추출
function getUserIdFromToken(request: NextRequest): number | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded.userId;
  } catch (error) {
    console.error("JWT 검증 실패:", error);
    return null;
  }
}

/**
 * GET /api/reservations/message-templates
 * 템플릿 목록 조회 (카테고리 필터링 지원)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 쿼리 파라미터에서 카테고리 필터 추출
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // 기본 쿼리: 사용자 본인의 템플릿만
    let query = supabase
      .from("reservation_message_templates")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // 카테고리 필터 적용
    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("템플릿 조회 오류:", error);
      return NextResponse.json(
        { error: "템플릿을 불러오는데 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      templates: data || [],
      count: data?.length || 0,
    });
  } catch (error) {
    console.error("템플릿 목록 조회 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reservations/message-templates
 * 새 템플릿 생성
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, content, category, is_active } = body;

    // 유효성 검증
    if (!name || !content) {
      return NextResponse.json(
        { error: "템플릿 이름과 내용은 필수입니다" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "템플릿 이름은 100자를 초과할 수 없습니다" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "템플릿 내용은 2000자를 초과할 수 없습니다" },
        { status: 400 }
      );
    }

    // 템플릿 생성
    const { data, error } = await supabase
      .from("reservation_message_templates")
      .insert({
        user_id: userId,
        name,
        content,
        category: category || "기타",
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error("템플릿 생성 오류:", error);
      return NextResponse.json(
        { error: "템플릿 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "템플릿이 생성되었습니다",
      template: data,
    }, { status: 201 });
  } catch (error) {
    console.error("템플릿 생성 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
