import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateAuthAndAdminWithSuccess } from "@/utils/authUtils";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// PATCH: ON/OFF 토글
export async function PATCH(
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
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'is_active 값이 필요합니다.' },
        { status: 400 }
      );
    }

    const { data: updatedTemplate, error } = await supabase
      .from('sms_notification_templates')
      .update({
        is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('템플릿 토글 오류:', error);
      return NextResponse.json(
        { success: false, message: '템플릿 상태 변경에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `템플릿이 ${is_active ? '활성화' : '비활성화'}되었습니다.`,
      is_active: updatedTemplate.is_active,
    });
  } catch (error) {
    console.error('템플릿 토글 오류:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
