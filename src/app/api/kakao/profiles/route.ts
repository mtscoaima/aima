import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 카카오 발신 프로필 목록 조회 API (DB 조회)
 * GET /api/kakao/profiles
 *
 * ⚠️ 변경사항: MTS API 대신 Supabase DB에서 조회
 * MTS API는 프로필 목록 조회 엔드포인트를 제공하지 않습니다.
 */
export async function GET(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    const userId = authResult.userInfo.userId;

    // Supabase에서 프로필 목록 조회
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profiles, error: dbError } = await supabase
      .from('kakao_sender_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'A')  // 정상 상태만 조회
      .eq('block', false) // 차단되지 않은 것만
      .eq('dormant', false) // 휴면 상태가 아닌 것만
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('DB 조회 오류:', dbError);
      return NextResponse.json(
        { error: 'DB 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 응답 형식 변환 (기존 코드와의 호환성 유지)
    const formattedProfiles = (profiles || []).map(profile => ({
      sender_key: profile.sender_key,
      channel_name: profile.channel_name || profile.yellow_id,
      yellow_id: profile.yellow_id,
      status: profile.status,
      block: profile.block,
      dormant: profile.dormant,
      profile_status: profile.profile_status,
      created_at: profile.created_at,
    }));

    return NextResponse.json({
      success: true,
      profiles: formattedProfiles,
      count: formattedProfiles.length,
    });
  } catch (error) {
    console.error('발신 프로필 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
