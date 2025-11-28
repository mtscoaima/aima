/**
 * 카카오 발신 프로필 그룹 상세 관리 API
 * GET /api/kakao/groups/[groupId] - 그룹 상세 정보 조회
 * DELETE /api/kakao/groups/[groupId] - 그룹 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuth } from '@/utils/authUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// GET 핸들러 - 그룹 상세 정보 조회
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  // JWT 인증 확인
  const authResult = validateAuth(request);
  if (!authResult.isValid) return authResult.errorResponse!;
  const { userId } = authResult.userInfo!;

  try {
    const { groupId } = await params;

    // 그룹 정보 조회 (본인 것만)
    const { data: group, error } = await supabase
      .from('kakao_profile_groups')
      .select('*')
      .eq('id', groupId)
      .eq('user_id', userId)
      .single();

    if (error || !group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 그룹에 속한 프로필 수 조회
    const { data: members, error: membersError } = await supabase
      .from('kakao_profile_group_members')
      .select('profile_id')
      .eq('group_id', groupId);

    if (membersError) {
      console.error('멤버 조회 오류:', membersError);
    }

    return NextResponse.json({
      success: true,
      group: {
        ...group,
        member_count: members?.length || 0,
      },
    });
  } catch (error) {
    console.error('그룹 상세 조회 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE 핸들러 - 그룹 삭제
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  // JWT 인증 확인
  const authResult = validateAuth(request);
  if (!authResult.isValid) return authResult.errorResponse!;
  const { userId } = authResult.userInfo!;

  try {
    const { groupId } = await params;

    // 그룹 존재 확인 (본인 것만)
    const { data: group, error: checkError } = await supabase
      .from('kakao_profile_groups')
      .select('id')
      .eq('id', groupId)
      .eq('user_id', userId)
      .single();

    if (checkError || !group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 그룹 삭제 (CASCADE로 멤버십도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from('kakao_profile_groups')
      .delete()
      .eq('id', groupId)
      .eq('user_id', userId);

    if (deleteError) {
      console.error('그룹 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: '그룹 삭제 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '그룹이 삭제되었습니다',
    });
  } catch (error) {
    console.error('그룹 삭제 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
