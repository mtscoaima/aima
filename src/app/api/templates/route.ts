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
        "id, name, content, image_url, category, usage_count, created_at, updated_at, is_active, is_private, user_id, template_code"
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
      template_code: template.template_code, // 템플릿 코드 추가
      usage_count: template.usage_count,
      created_at: template.created_at,
      updated_at: template.updated_at,
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
    const { name, content, image_url, category, is_private = false, buttons } = body;

    // 필수 필드 검증
    if (!name || !content || !category) {
      return NextResponse.json(
        { error: "Name, content, and category are required" },
        { status: 400 }
      );
    }

    // 새 템플릿 생성
    const insertData: {
      name: string;
      content: string;
      image_url: string | null;
      category: string;
      is_private: boolean;
      user_id: number;
      usage_count: number;
      is_active: boolean;
      template_code: string; // template_code 필드 추가
      buttons?: Array<{
        id: string;
        text: string;
        linkType: 'web' | 'app';
        url?: string;
        iosUrl?: string;
        androidUrl?: string;
      }>;
    } = {
      name,
      content,
      image_url,
      category,
      is_private,
      user_id: parseInt(userId), // 모든 템플릿에 user_id 설정
      usage_count: 0,
      is_active: true,
      template_code: "임시-0", // 임시값, 생성 후 업데이트
    };

    // buttons가 제공된 경우에만 추가
    if (buttons !== undefined) {
      insertData.buttons = buttons;
    }

    const { data: newTemplate, error } = await supabase
      .from("message_templates")
      .insert(insertData)
      .select(
        "id, name, content, image_url, category, usage_count, created_at, updated_at, is_active, is_private, buttons, template_code"
      )
      .single();

    if (error) {
      console.error("Template creation error:", error);
      return NextResponse.json(
        { error: "Failed to create template" },
        { status: 500 }
      );
    }

    // 새로 생성된 템플릿의 template_code 생성 (기본값: 결합메시지-{id})
    const templateCode = `결합메시지-${newTemplate.id}`;
    
    // template_code 업데이트
    const { error: updateError } = await supabase
      .from("message_templates")
      .update({ template_code: templateCode })
      .eq("id", newTemplate.id);

    if (updateError) {
      console.error("Template code update error:", updateError);
      // template_code 업데이트 실패해도 템플릿 생성은 성공으로 처리
    }

    // 응답 데이터 구성 (업데이트된 template_code 사용)
    const responseTemplate = {
      ...newTemplate,
      template_code: templateCode, // 생성된 template_code 사용 (업데이트된 값)
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
