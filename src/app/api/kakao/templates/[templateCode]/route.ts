import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { createClient } from '@supabase/supabase-js';
import { deleteMtsAlimtalkTemplate } from '@/lib/mtsApi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 카카오 알림톡 템플릿 삭제 API
 * DELETE /api/kakao/templates/[templateCode]
 *
 * Query Parameters:
 * - senderKey: 발신 프로필 키 (필수)
 *
 * Path Parameters:
 * - templateCode: 삭제할 템플릿 코드
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { templateCode: string } }
) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse || NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }

    const userId = authResult.userInfo.userId;
    const templateCode = params.templateCode;

    // 쿼리 파라미터 추출
    const searchParams = request.nextUrl.searchParams;
    const senderKey = searchParams.get('senderKey');

    // senderKey 필수 확인
    if (!senderKey) {
      return NextResponse.json(
        { error: '발신 프로필 키가 필요합니다.' },
        { status: 400 }
      );
    }

    // DB에서 템플릿 확인
    const { data: template, error: templateError } = await supabase
      .from('kakao_alimtalk_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('sender_key', senderKey)
      .eq('template_code', templateCode)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없거나 권한이 없습니다.' },
        { status: 404 }
      );
    }

    // MTS API로 템플릿 삭제
    const result = await deleteMtsAlimtalkTemplate(senderKey, templateCode, 'S');

    if (!result.success) {
      // MTS API 삭제 실패해도 계속 진행 (이미 MTS에서 삭제되었을 수 있음)
      console.warn('MTS API 템플릿 삭제 실패:', result.error);
    }

    // DB에서 템플릿 삭제
    const { error: deleteError } = await supabase
      .from('kakao_alimtalk_templates')
      .delete()
      .eq('id', template.id);

    if (deleteError) {
      console.error('DB 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: 'DB 삭제 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '템플릿이 삭제되었습니다.',
      deletedTemplate: {
        templateCode: template.template_code,
        templateName: template.template_name,
      },
      mtsDeleted: result.success,
    });
  } catch (error) {
    console.error('템플릿 삭제 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
