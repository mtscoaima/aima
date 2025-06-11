import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseKey = supabaseServiceKey!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let query = supabase
      .from("message_templates")
      .select(
        "id, name, content, image_url, category, usage_count, created_at, is_active"
      )
      .eq("is_active", true);

    // 추천 카테고리인 경우 usage_count 높은 순으로 10개만
    if (category === "추천") {
      query = query.order("usage_count", { ascending: false }).limit(10);
    } else if (category && category !== "추천") {
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
    const templatesWithImages = (templates || []).map((template) => ({
      ...template,
      image_url:
        template.image_url ||
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==",
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
