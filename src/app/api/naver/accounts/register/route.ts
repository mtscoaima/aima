import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuthWithSuccess } from '@/utils/authUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/naver/accounts/register
 * 네이버 톡톡 계정 등록
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    const userId = authResult.userInfo.userId;

    // 요청 본문 파싱
    const body = await request.json();
    const { partnerKey, talkName } = body;

    // 필수 파라미터 검증
    if (!partnerKey) {
      return NextResponse.json(
        { error: '파트너키가 필요합니다.' },
        { status: 400 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 중복 확인
    const { data: existing } = await supabase
      .from('naver_talk_accounts')
      .select('id')
      .eq('partner_key', partnerKey)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '이미 등록된 파트너키입니다.' },
        { status: 400 }
      );
    }

    // 네이버 톡톡 계정 등록
    const { data, error } = await supabase
      .from('naver_talk_accounts')
      .insert({
        user_id: userId,
        partner_key: partnerKey,
        talk_name: talkName || null,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('네이버 톡톡 계정 등록 오류:', error);
      return NextResponse.json(
        { error: '계정 등록 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      message: '네이버 톡톡 계정이 성공적으로 등록되었습니다.',
    });

  } catch (error) {
    console.error('네이버 톡톡 계정 등록 API 오류:', error);
    return NextResponse.json(
      {
        error: '계정 등록 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
