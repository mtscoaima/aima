import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET!;

const supabaseKey = supabaseServiceKey!;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT 토큰에서 사용자 ID 추출 (선택적)
function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    // 토큰이 없거나 유효하지 않은 경우 null 반환 (공개 템플릿만 조회)
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    // 사용자 ID 추출 (로그인하지 않은 경우 null)
    const userId = getUserIdFromToken(request);

    let query = supabase
      .from("message_templates")
      .select(
        "id, name, content, image_url, category, usage_count, created_at, is_active, is_private, user_id"
      )
      .eq("is_active", true);

    // 개인 템플릿 필터링 로직
    if (userId) {
      // 로그인한 사용자: 공개 템플릿 + 자신의 개인 템플릿
      query = query.or(
        `is_private.eq.false,and(is_private.eq.true,user_id.eq.${userId})`
      );
    } else {
      // 비로그인 사용자: 공개 템플릿만
      query = query.eq("is_private", false);
    }

    // 추천 카테고리인 경우 usage_count 높은 순으로 10개만
    if (category === "추천") {
      query = query.order("usage_count", { ascending: false }).limit(10);
    } else if (category === "커스텀") {
      // 커스텀 카테고리인 경우 현재 로그인한 유저의 템플릿만 표시
      if (!userId) {
        // 로그인하지 않은 경우 빈 결과 반환
        return NextResponse.json({ templates: [] });
      }
      // 현재 유저가 생성한 템플릿만 필터링 (공개/비공개 상관없이)
      query = query.eq("user_id", parseInt(userId));
    } else if (category && category !== "추천" && category !== "커스텀") {
      // 특정 카테고리 필터링
      query = query.eq("category", category);
    }

    // 기본 정렬: created_at 내림차순
    if (category !== "추천") {
      query = query.order("created_at", { ascending: false });
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error("Templates fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch templates" },
        { status: 500 }
      );
    }

    // image_url이 null인 경우 더미 이미지 URL 설정
    // 응답에서 user_id는 제외 (보안상)
    const templatesWithImages = (templates || []).map((template) => ({
      id: template.id,
      name: template.name,
      content: template.content,
      image_url:
        template.image_url ||
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==",
      category: template.category,
      usage_count: template.usage_count,
      created_at: template.created_at,
      is_private: template.is_private,
      is_owner: userId ? template.user_id === parseInt(userId) : false, // 현재 사용자가 소유자인지 여부
    }));

    return NextResponse.json({ templates: templatesWithImages });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (필수)
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, content, image_url, category, is_private = false } = body;

    // 필수 필드 검증
    if (!name || !content || !category) {
      return NextResponse.json(
        { error: "Name, content, and category are required" },
        { status: 400 }
      );
    }

    // 새 템플릿 생성
    const { data: newTemplate, error } = await supabase
      .from("message_templates")
      .insert({
        name,
        content,
        image_url,
        category,
        is_private,
        user_id: is_private ? parseInt(userId) : null, // 개인 템플릿인 경우에만 user_id 설정
        usage_count: 0,
        is_active: true,
      })
      .select(
        "id, name, content, image_url, category, usage_count, created_at, is_active, is_private"
      )
      .single();

    if (error) {
      console.error("Template creation error:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    // 응답 데이터 구성
    const responseTemplate = {
      ...newTemplate,
      image_url:
        newTemplate.image_url ||
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==",
      is_owner: true,
    };

    return NextResponse.json({ template: responseTemplate }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
