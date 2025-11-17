/**
 * 카카오 알림톡 템플릿 관리 API
 * DELETE /api/messages/kakao/alimtalk/templates - 알림톡 템플릿 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuth } from '@/utils/authUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// DELETE 핸들러 - 알림톡 템플릿 삭제
// ============================================================================

export async function DELETE(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuth(request);
  if (!authResult.isValid) return authResult.errorResponse!;
  const { userId } = authResult.userInfo!;

  try {
    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // 유효성 검증
    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: '템플릿 ID가 필요합니다' },
        { status: 400 }
      );
    }

    // 템플릿 존재 여부 및 권한 확인
    const { data: template, error: fetchError } = await supabase
      .from('kakao_alimtalk_templates')
      .select('id, user_id')
      .eq('id', id.trim())
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        { error: '템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 권한 체크 (본인 템플릿만 삭제 가능)
    if (template.user_id !== userId) {
      return NextResponse.json(
        { error: '템플릿을 삭제할 권한이 없습니다' },
        { status: 403 }
      );
    }

    // 템플릿 삭제
    const { error: deleteError } = await supabase
      .from('kakao_alimtalk_templates')
      .delete()
      .eq('id', id.trim())
      .eq('user_id', userId);

    if (deleteError) {
      console.error('알림톡 템플릿 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: '템플릿 삭제에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '템플릿이 삭제되었습니다',
    });
  } catch (error) {
    console.error('알림톡 템플릿 삭제 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
