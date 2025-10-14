/**
 * 메시지 템플릿 API
 * GET /api/messages/templates - 템플릿 목록 조회
 * POST /api/messages/templates - 템플릿 저장
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// JWT 인증
// ============================================================================

function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return payload.userId || null;
  } catch {
    return null;
  }
}

// ============================================================================
// GET 핸들러 - 템플릿 목록 조회
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. JWT 인증
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      );
    }

    // 2. 쿼리 파라미터
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isPrivate = searchParams.get("isPrivate");

    // 3. 템플릿 조회
    let query = supabase
      .from("message_templates")
      .select("*")
      .order("created_at", { ascending: false });

    // 공개 템플릿 또는 본인 템플릿만 조회
    if (isPrivate === "true") {
      query = query.eq("user_id", userId).eq("is_private", true);
    } else if (isPrivate === "false") {
      query = query.eq("is_private", false);
    } else {
      // 기본: 본인의 private 템플릿 + 모든 public 템플릿
      query = query.or(`user_id.eq.${userId},is_private.eq.false`);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("템플릿 조회 오류:", error);
      return NextResponse.json(
        { error: "템플릿 조회 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: templates?.length || 0,
      templates: templates || [],
    });
  } catch (error) {
    console.error("템플릿 조회 예외:", error);

    return NextResponse.json(
      {
        error: "템플릿 조회 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST 핸들러 - 템플릿 저장
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. JWT 인증
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body = await request.json();
    const { name, content, subject, category, isPrivate = true } = body;

    // 3. 유효성 검증
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "템플릿 이름이 필요합니다" },
        { status: 400 }
      );
    }

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "템플릿 내용이 필요합니다" },
        { status: 400 }
      );
    }

    // 4. 템플릿 저장
    const { data: template, error } = await supabase
      .from("message_templates")
      .insert({
        user_id: userId,
        name: name.trim(),
        content: content.trim(),
        subject: subject?.trim() || "",
        category: category || "기타",
        is_private: isPrivate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("템플릿 저장 오류:", error);
      return NextResponse.json(
        { error: "템플릿 저장 중 오류가 발생했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "템플릿이 성공적으로 저장되었습니다",
        template,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("템플릿 저장 예외:", error);

    return NextResponse.json(
      {
        error: "템플릿 저장 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS 핸들러 (CORS)
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
