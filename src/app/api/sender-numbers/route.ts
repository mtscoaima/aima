import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 발신번호 목록 조회 API
 * GET /api/sender-numbers
 * 
 * 현재 구현:
 * - users.phone_number를 발신번호로 반환
 * - sender_numbers 테이블이 삭제되어 사용자 프로필 전화번호만 사용
 * - MTS에서 발신번호 차단 기능이 해제되어 있어 검증 불필요
 */
export async function GET(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    const userId = authResult.userInfo.userId;

    // 사용자 전화번호 조회
    const { data: user, error } = await supabase
      .from('users')
      .select('id, phone_number, name')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('사용자 조회 오류:', error);
      return NextResponse.json(
        { error: '사용자 정보를 조회할 수 없습니다.' },
        { status: 500 }
      );
    }

    // 사용자 전화번호를 발신번호로 반환
    const senderNumbers = [];

    if (user.phone_number) {
      senderNumbers.push({
        id: user.id,
        number: user.phone_number,
        name: `${user.name || '사용자'} (내 번호)`,
        registrationDate: new Date().toISOString(),
        status: 'approved',
        isDefault: true,
        isUserPhone: true,
      });
    }

    return NextResponse.json({ senderNumbers });
  } catch (error) {
    console.error('발신번호 조회 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 발신번호 등록 API (호환성 유지용)
 * POST /api/sender-numbers
 * 
 * 현재 구현:
 * - sender_numbers 테이블이 삭제되어 실제 등록은 불가
 * - 안내 메시지 반환
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    // 현재 정책: 발신번호는 프로필 전화번호만 사용
    return NextResponse.json(
      { 
        error: '발신번호는 프로필의 전화번호가 사용됩니다. 전화번호 변경은 마이페이지 > 프로필 설정에서 가능합니다.',
        code: 'PROFILE_PHONE_ONLY'
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('발신번호 등록 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

