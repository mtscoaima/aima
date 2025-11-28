import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuthWithSuccess } from '@/utils/authUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const mtsAuthCode = process.env.MTS_AUTH_CODE!;
// 네이버 톡톡 API는 https://api.mtsco.co.kr 사용 (카카오는 talks.mtsco.co.kr)
const mtsApiUrl = 'https://api.mtsco.co.kr';

/**
 * POST /api/naver/partner/create
 * 네이버 톡톡 파트너 키 자동 발급
 *
 * MTS API를 호출하여 partnerId로 partnerKey를 발급받고 DB에 저장
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
    const { partnerId, talkName } = body;

    // 필수 파라미터 검증
    if (!partnerId) {
      return NextResponse.json(
        { error: 'partnerId가 필요합니다.' },
        { status: 400 }
      );
    }

    // MTS API 호출 - 파트너 키 발급
    const mtsUrl = `${mtsApiUrl}/naver/v1/partner/${partnerId}/create`;

    const mtsResponse = await fetch(mtsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'auth_code': mtsAuthCode,
      },
    });

    // 응답을 텍스트로 먼저 받아서 확인
    const responseText = await mtsResponse.text();

    // JSON 파싱 시도
    let mtsResult;
    try {
      mtsResult = JSON.parse(responseText);
    } catch {
      return NextResponse.json(
        {
          error: 'MTS API가 유효하지 않은 응답을 반환했습니다. 이 API 엔드포인트가 존재하지 않을 수 있습니다.',
          details: {
            url: mtsUrl,
            status: mtsResponse.status,
            responsePreview: responseText.substring(0, 200),
          },
        },
        { status: 500 }
      );
    }

    // MTS API 에러 처리
    if (!mtsResponse.ok) {
      const errorMessage = mtsResult.errorMessage || mtsResult.message || 'MTS API 호출 실패';
      return NextResponse.json(
        {
          error: `파트너 키 발급 실패: ${errorMessage}`,
          details: mtsResult,
        },
        { status: mtsResponse.status }
      );
    }

    // partnerKey 추출
    const partnerKey = mtsResult.partnerKey || mtsResult.partner_key;

    if (!partnerKey) {
      return NextResponse.json(
        {
          error: '파트너 키 발급 실패: MTS API 응답에 partnerKey가 없습니다.',
          message: mtsResult.message || mtsResult.errorMessage || 'MTS API가 partnerKey를 반환하지 않았습니다.',
          troubleshooting: [
            '네이버 톡톡 파트너센터에서 계정 승인 상태 확인',
            'partnerId 형식이 W+6자리 영문/숫자인지 확인',
            '파트너센터에서 사업자 정보 등록 확인',
            '계정 검수 대기 중이라면 1-2일 후 재시도',
            '문제 지속 시 MTS 고객지원(1577-1603) 문의'
          ],
          details: mtsResult,
        },
        { status: 500 }
      );
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 중복 확인 (같은 partnerKey가 이미 등록되어 있는지)
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
        talk_name: talkName || `네이버톡톡_${partnerId}`,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: '계정 등록 중 오류가 발생했습니다.', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      partnerKey,
      data,
      message: '파트너 키가 성공적으로 발급되고 등록되었습니다.',
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: '파트너 키 발급 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
