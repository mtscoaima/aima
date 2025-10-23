import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAuthAndAdminWithSuccess } from "@/utils/authUtils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PUT: 템플릿 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = validateAuthAndAdminWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const { id } = await params;
    const body = await request.json();
    const { subject, content_template, message_type } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (subject !== undefined) updateData.subject = subject;
    if (content_template !== undefined) updateData.content_template = content_template;
    if (message_type !== undefined) updateData.message_type = message_type;

    const { data: updatedTemplate, error } = await supabase
      .from('sms_notification_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('템플릿 수정 오류:', error);
      return NextResponse.json(
        { success: false, message: '템플릿 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '템플릿이 수정되었습니다.',
      template: updatedTemplate,
    });
  } catch (error) {
    console.error('템플릿 수정 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 템플릿 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = validateAuthAndAdminWithSuccess(request);
    if (!authResult.isValid) {
      return authResult.errorResponse!;
    }

    const { id } = await params;

    const { error } = await supabase
      .from('sms_notification_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('템플릿 삭제 오류:', error);
      return NextResponse.json(
        { success: false, message: '템플릿 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '템플릿이 삭제되었습니다.',
    });
  } catch (error) {
    console.error('템플릿 삭제 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
