/**
 * 카카오 발신 프로필 그룹 멤버 관리 API
 * GET /api/kakao/groups/[groupId]/profiles - MTS API에서 그룹 프로필 목록 조회
 * POST /api/kakao/groups/[groupId]/profiles - MTS API로 그룹에 프로필 추가
 * DELETE /api/kakao/groups/[groupId]/profiles - MTS API로 그룹에서 프로필 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuth } from '@/utils/authUtils';
import {
  fetchGroupProfiles,
  addProfileToGroup,
  removeProfileFromGroup
} from '@/lib/mtsApi';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// GET 핸들러 - MTS API로부터 그룹 프로필 목록 조회
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
    const { data: group, error: groupError } = await supabase
      .from('kakao_profile_groups')
      .select('group_key')
      .eq('id', groupId)
      .eq('user_id', userId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // MTS API 호출: 그룹에 속한 프로필 목록 조회
    const result = await fetchGroupProfiles(group.group_key);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'MTS API 호출 실패',
          errorCode: result.errorCode
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profiles: result.profiles || [],
      count: result.profiles?.length || 0,
    });
  } catch (error) {
    console.error('그룹 프로필 조회 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST 핸들러 - MTS API로 그룹에 프로필 추가
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  // JWT 인증 확인
  const authResult = validateAuth(request);
  if (!authResult.isValid) return authResult.errorResponse!;
  const { userId } = authResult.userInfo!;

  try {
    const { groupId } = await params;
    const body = await request.json();
    const { senderKey, profileId } = body;

    // 유효성 검증
    if (!senderKey || !senderKey.trim()) {
      return NextResponse.json(
        { error: 'senderKey가 필요합니다' },
        { status: 400 }
      );
    }

    if (!profileId || !profileId.trim()) {
      return NextResponse.json(
        { error: 'profileId가 필요합니다' },
        { status: 400 }
      );
    }

    // 그룹 정보 조회 (본인 것만)
    const { data: group, error: groupError } = await supabase
      .from('kakao_profile_groups')
      .select('group_key')
      .eq('id', groupId)
      .eq('user_id', userId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // MTS API 호출: 그룹에 프로필 추가
    const result = await addProfileToGroup(group.group_key, senderKey.trim());

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'MTS API 호출 실패',
          errorCode: result.errorCode
        },
        { status: 500 }
      );
    }

    // 로컬 DB에 멤버십 저장 (멤버십 이력 관리)
    const { error: insertError } = await supabase
      .from('kakao_profile_group_members')
      .insert({
        group_id: groupId,
        profile_id: profileId.trim(),
        added_by: userId,
        added_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('멤버십 저장 오류:', insertError);
      // MTS에는 추가되었으므로 경고만 로그
      console.warn('MTS API에는 추가되었으나 로컬 DB 저장 실패');
    }

    // 프로필의 group_id 업데이트
    const { error: updateError } = await supabase
      .from('kakao_sender_profiles')
      .update({ group_id: groupId })
      .eq('id', profileId.trim());

    if (updateError) {
      console.error('프로필 group_id 업데이트 오류:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: '그룹에 프로필이 추가되었습니다',
    });
  } catch (error) {
    console.error('그룹에 프로필 추가 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE 핸들러 - MTS API로 그룹에서 프로필 삭제
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

    // URL에서 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const senderKey = searchParams.get('senderKey');
    const profileId = searchParams.get('profileId');

    // 유효성 검증
    if (!senderKey || !senderKey.trim()) {
      return NextResponse.json(
        { error: 'senderKey가 필요합니다' },
        { status: 400 }
      );
    }

    if (!profileId || !profileId.trim()) {
      return NextResponse.json(
        { error: 'profileId가 필요합니다' },
        { status: 400 }
      );
    }

    // 그룹 정보 조회 (본인 것만)
    const { data: group, error: groupError } = await supabase
      .from('kakao_profile_groups')
      .select('group_key')
      .eq('id', groupId)
      .eq('user_id', userId)
      .single();

    if (groupError || !group) {
      return NextResponse.json(
        { error: '그룹을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // MTS API 호출: 그룹에서 프로필 삭제
    const result = await removeProfileFromGroup(group.group_key, senderKey.trim());

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || 'MTS API 호출 실패',
          errorCode: result.errorCode
        },
        { status: 500 }
      );
    }

    // 로컬 DB에서 멤버십 삭제
    const { error: deleteError } = await supabase
      .from('kakao_profile_group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('profile_id', profileId.trim());

    if (deleteError) {
      console.error('멤버십 삭제 오류:', deleteError);
      console.warn('MTS API에서는 삭제되었으나 로컬 DB 삭제 실패');
    }

    // 프로필의 group_id 제거
    const { error: updateError } = await supabase
      .from('kakao_sender_profiles')
      .update({ group_id: null })
      .eq('id', profileId.trim());

    if (updateError) {
      console.error('프로필 group_id 제거 오류:', updateError);
    }

    return NextResponse.json({
      success: true,
      message: '그룹에서 프로필이 제거되었습니다',
    });
  } catch (error) {
    console.error('그룹에서 프로필 제거 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
