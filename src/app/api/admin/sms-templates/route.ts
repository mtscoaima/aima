import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAuthAndAdminWithSuccess } from "@/utils/authUtils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 템플릿 목록 조회
export async function GET(request: NextRequest) {
  try {
    const authResult = validateAuthAndAdminWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const { data: templates, error } = await supabase
      .from('sms_notification_templates')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('템플릿 조회 오류:', error);
      return NextResponse.json(
        { success: false, message: '템플릿 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templates: templates || [],
    });
  } catch (error) {
    console.error('템플릿 조회 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 템플릿 생성 (필요 시)
export async function POST(request: NextRequest) {
  try {
    const authResult = validateAuthAndAdminWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const body = await request.json();
    const { event_type, name, recipient_type, message_type, subject, content_template, variables } = body;

    // 유효성 검증
    if (!event_type || !name || !recipient_type || !message_type || !content_template) {
      return NextResponse.json(
        { success: false, message: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const { data: newTemplate, error } = await supabase
      .from('sms_notification_templates')
      .insert({
        event_type,
        name,
        recipient_type,
        message_type,
        subject: subject || null,
        content_template,
        variables: variables || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('템플릿 생성 오류:', error);
      return NextResponse.json(
        { success: false, message: '템플릿 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '템플릿이 생성되었습니다.',
      template: newTemplate,
    });
  } catch (error) {
    console.error('템플릿 생성 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
