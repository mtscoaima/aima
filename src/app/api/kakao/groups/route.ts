/**
 * 카카오 발신 프로필 그룹 관리 API
 * GET /api/kakao/groups - 그룹 목록 조회
 * POST /api/kakao/groups - 그룹 생성 (메타데이터 저장)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuth } from '@/utils/authUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// GET 핸들러 - 그룹 목록 조회
// ============================================================================

export async function GET(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuth(request);
  if (!authResult.isValid) return authResult.errorResponse!;
  const { userId } = authResult.userInfo!;

  try {
    // 사용자의 그룹 목록 조회
    const { data: groups, error } = await supabase
      .from('kakao_profile_groups')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('그룹 목록 조회 오류:', error);
      return NextResponse.json(
        { error: '그룹 목록 조회 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      groups: groups || [],
      count: groups?.length || 0,
    });
  } catch (error) {
    console.error('그룹 목록 조회 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST 핸들러 - 그룹 생성 (메타데이터 저장)
// ============================================================================

export async function POST(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuth(request);
  if (!authResult.isValid) return authResult.errorResponse!;
  const { userId } = authResult.userInfo!;

  try {
    // 요청 본문 파싱
    const body = await request.json();
    const { groupKey, name, description } = body;

    // 유효성 검증
    if (!groupKey || !groupKey.trim()) {
      return NextResponse.json(
        { error: 'groupKey가 필요합니다' },
        { status: 400 }
      );
    }

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'name이 필요합니다' },
        { status: 400 }
      );
    }

    // groupKey 중복 확인
    const { data: existing, error: checkError } = await supabase
      .from('kakao_profile_groups')
      .select('id')
      .eq('group_key', groupKey.trim())
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 groupKey입니다' },
        { status: 409 }
      );
    }

    // 그룹 생성
    const { data: group, error: insertError } = await supabase
      .from('kakao_profile_groups')
      .insert({
        user_id: userId,
        group_key: groupKey.trim(),
        name: name.trim(),
        description: description?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('그룹 생성 오류:', insertError);
      return NextResponse.json(
        { error: '그룹 생성 중 오류가 발생했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: '그룹이 생성되었습니다',
        group,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('그룹 생성 예외:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
