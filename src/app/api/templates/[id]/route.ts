import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET!;

const supabaseKey = supabaseServiceKey!;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT 토큰에서 사용자 ID 추출
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
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const templateId = id;

    // 템플릿 조회
    const { data: template, error } = await supabase
      .from("message_templates")
      .select(
        "id, name, content, image_url, category, usage_count, created_at, is_active, is_private, user_id, buttons, template_code"
      )
      .eq("id", parseInt(templateId))
      .eq("is_active", true)
      .single();

    if (error || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // JWT 토큰에서 사용자 ID 추출 (선택적)
    const userId = getUserIdFromToken(request);

    // 비공개 템플릿인 경우 소유자만 접근 가능
    if (
      template.is_private &&
      (!userId || template.user_id !== parseInt(userId))
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 응답 데이터 구성
    const responseTemplate = {
      ...template,
      image_url:
        template.image_url ||
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==",
      is_owner: userId ? template.user_id === parseInt(userId) : false,
    };

    return NextResponse.json({ template: responseTemplate });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (필수)
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const templateId = id;
    const body = await request.json();
    const { name, content, image_url, category, buttons } = body;

    // 필수 필드 검증
    if (!name || !content || !category) {
      return NextResponse.json(
        { error: "Name, content, and category are required" },
        { status: 400 }
      );
    }

    // 기존 템플릿 확인 및 권한 검증
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("message_templates")
      .select("user_id, is_active")
      .eq("id", parseInt(templateId))
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // 소유자 권한 확인
    if (existingTemplate.user_id !== parseInt(userId)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // 템플릿 업데이트 (is_private는 항상 true로 고정)
    const updateData: {
      name: string;
      content: string;
      image_url: string | null;
      category: string;
      is_private: boolean;
      updated_at: string;
      buttons?: Array<{
        id: string;
        text: string;
        linkType: 'web';
        url?: string;
      }>;
    } = {
      name,
      content,
      image_url,
      category,
      is_private: true, // 템플릿 수정 시 항상 비공개로 설정
      updated_at: new Date().toISOString(),
    };

    // buttons가 제공된 경우에만 추가
    if (buttons !== undefined) {
      updateData.buttons = buttons;
    }

    const { data: updatedTemplate, error } = await supabase
      .from("message_templates")
      .update(updateData)
      .eq("id", parseInt(templateId))
      .select(
        "id, name, content, image_url, category, usage_count, created_at, is_active, is_private, buttons, template_code"
      )
      .single();

    if (error) {
      console.error("Template update error:", error);
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    // 템플릿 코드 업데이트 (마지막 사용 캠페인 기반)
    try {
      await supabase.rpc('update_template_code', {
        p_template_id: parseInt(templateId)
      });
    } catch (codeUpdateError) {
      console.error("Template code update error:", codeUpdateError);
      // template_code 업데이트 실패해도 템플릿 수정은 성공으로 처리
    }

    // 응답 데이터 구성
    const responseTemplate = {
      ...updatedTemplate,
      image_url:
        updatedTemplate.image_url ||
        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==",
      is_owner: true,
    };

    return NextResponse.json({ template: responseTemplate });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (필수)
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const templateId = id;
    const body = await request.json();
    const { name } = body;

    // 이름 필드 검증
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // 기존 템플릿 확인 및 권한 검증
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("message_templates")
      .select("user_id, is_active, name, content, image_url, category, buttons, template_code")
      .eq("id", parseInt(templateId))
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // 소유자 권한 확인
    if (existingTemplate.user_id !== parseInt(userId)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // 템플릿 이름만 업데이트
    const { data: updatedTemplate, error } = await supabase
      .from("message_templates")
      .update({
        name,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parseInt(templateId))
      .select(
        "id, name, content, image_url, category, usage_count, created_at, updated_at, is_active, is_private, buttons, template_code"
      )
      .single();

    if (error) {
      console.error("Template name update error:", error);
      return NextResponse.json(
        { error: "Failed to update template name" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      template: updatedTemplate,
      message: "Template name updated successfully"
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (필수)
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const templateId = id;

    // 기존 템플릿 확인 및 권한 검증
    const { data: existingTemplate, error: fetchError } = await supabase
      .from("message_templates")
      .select("user_id, is_active")
      .eq("id", parseInt(templateId))
      .single();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // 소유자 권한 확인
    if (existingTemplate.user_id !== parseInt(userId)) {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    // 템플릿을 비활성화 (soft delete)
    const { error } = await supabase
      .from("message_templates")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parseInt(templateId));

    if (error) {
      console.error("Template delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete template" },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Template deleted successfully"
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
