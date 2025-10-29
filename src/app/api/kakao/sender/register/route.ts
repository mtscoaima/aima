import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import { registerMtsSenderProfile } from '@/lib/mtsApi';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * 카카오 발신프로필 등록 API
 * POST /api/kakao/sender/register
 *
 * Body:
 * - token: 카카오톡으로 받은 인증 토큰
 * - phoneNumber: 관리자 전화번호
 * - yellowId: 카카오톡 채널 ID
 * - categoryCode: 카테고리 코드
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
    const { token, phoneNumber, yellowId, categoryCode } = body;

    // 유효성 검사
    if (!token || !phoneNumber || !yellowId || !categoryCode) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // MTS API 호출 - 발신프로필 등록
    const result = await registerMtsSenderProfile(
      token,
      phoneNumber,
      yellowId,
      categoryCode
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error || '발신프로필 등록 실패',
          errorCode: result.errorCode
        },
        { status: 400 }
      );
    }

    // 등록 성공 - 응답 데이터 추출
    const responseData = result.responseData?.data;
    if (!responseData || !responseData.senderKey) {
      return NextResponse.json(
        { error: 'MTS API 응답에서 senderKey를 찾을 수 없습니다.' },
        { status: 500 }
      );
    }

    // Supabase DB에 저장
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: savedProfile, error: dbError } = await supabase
      .from('kakao_sender_profiles')
      .insert({
        user_id: userId,
        sender_key: responseData.senderKey,
        yellow_id: yellowId,
        channel_name: responseData.name || yellowId,
        phone_number: phoneNumber,
        category_code: categoryCode,
        status: responseData.status || 'A',
        block: responseData.block || false,
        dormant: responseData.dormant || false,
        profile_status: responseData.profileStatus || 'A',
        bizchat: responseData.bizchat || false,
        brandtalk: responseData.brandtalk || false,
        brand_message: responseData.brandMessage || false,
      })
      .select()
      .single();

    if (dbError) {
      console.error('DB 저장 오류:', dbError);

      // 중복 키 에러 처리
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: '이미 등록된 발신프로필입니다.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'DB 저장 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      message: '발신프로필이 성공적으로 등록되었습니다.',
      profile: {
        id: savedProfile.id,
        senderKey: savedProfile.sender_key,
        yellowId: savedProfile.yellow_id,
        channelName: savedProfile.channel_name,
        status: savedProfile.status,
      },
    });
  } catch (error) {
    console.error('발신프로필 등록 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
