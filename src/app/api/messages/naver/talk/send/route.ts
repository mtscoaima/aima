/**
 * 네이버 톡톡 발송 API
 *
 * POST /api/messages/naver/talk/send
 * - 네이버 톡톡 스마트알림 발송
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNaverTalk } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/messages/naver/talk/send
 * 네이버 톡톡 스마트알림 발송
 */
export async function POST(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuthWithSuccess(request);
  if (!authResult.isValid || !authResult.userInfo) {
    return authResult.errorResponse;
  }

  const { userId } = authResult.userInfo;

  try {
    // 요청 본문 파싱
    const body = await request.json();
    const {
      navertalkId,
      templateCode,
      recipients, // { phone_number: string, name?: string }[]
      text,
      productCode, // 'INFORMATION' | 'BENEFIT' | 'CARDINFO'
      buttons,
      imageHashId,
      sendDate,
    } = body;

    // 필수 파라미터 확인
    if (!navertalkId) {
      return NextResponse.json(
        { error: 'navertalkId가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!templateCode) {
      return NextResponse.json(
        { error: 'templateCode가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: '수신자 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: 'text가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!productCode || !['INFORMATION', 'BENEFIT', 'CARDINFO'].includes(productCode)) {
      return NextResponse.json(
        { error: 'productCode는 INFORMATION, BENEFIT, CARDINFO 중 하나여야 합니다.' },
        { status: 400 }
      );
    }

    // 사용자 잔액 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, phone_number')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 네이버 톡톡 단가 계산 (가정: 건당 15원)
    const NAVER_TALK_COST = 15;
    const totalCost = recipients.length * NAVER_TALK_COST;

    // 잔액 확인
    if (user.balance < totalCost) {
      return NextResponse.json(
        {
          error: '잔액이 부족합니다.',
          required: totalCost,
          current: user.balance
        },
        { status: 402 }
      );
    }

    // 발송 결과 저장
    const results: Array<{
      phoneNumber: string;
      name?: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }> = [];

    let successCount = 0;
    let failCount = 0;

    // 각 수신자에게 발송
    for (const recipient of recipients) {
      try {
        const result = await sendNaverTalk(
          navertalkId,
          templateCode,
          recipient.phone_number,
          text,
          productCode,
          buttons,
          imageHashId,
          sendDate
        );

        if (result.success) {
          successCount++;

          // message_logs 테이블에 저장
          await supabase.from('message_logs').insert({
            user_id: userId,
            message_type: 'NAVERTALK',
            recipient_number: recipient.phone_number,
            message_content: text,
            status: 'sent',
            metadata: {
              mts_msg_id: result.msgId,
              navertalk_id: navertalkId,
              template_code: templateCode,
              product_code: productCode,
              buttons: buttons || null,
            },
          });

          results.push({
            phoneNumber: recipient.phone_number,
            name: recipient.name,
            success: true,
            messageId: result.msgId,
          });
        } else {
          failCount++;
          results.push({
            phoneNumber: recipient.phone_number,
            name: recipient.name,
            success: false,
            error: result.error || '발송 실패',
          });
        }
      } catch (error) {
        failCount++;
        results.push({
          phoneNumber: recipient.phone_number,
          name: recipient.name,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    // 성공한 건수만큼 잔액 차감
    const actualCost = successCount * NAVER_TALK_COST;

    if (actualCost > 0) {
      // 잔액 차감
      const { error: balanceError } = await supabase
        .from('users')
        .update({
          balance: user.balance - actualCost,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (balanceError) {
        console.error('잔액 차감 실패:', balanceError);
      }

      // transactions 테이블에 기록
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'usage',
        amount: -actualCost,
        description: `네이버 톡톡 발송 (${successCount}건)`,
        metadata: {
          message_type: 'NAVERTALK',
          success_count: successCount,
          fail_count: failCount,
          navertalk_id: navertalkId,
          template_code: templateCode,
        },
        status: 'completed',
      });
    }

    // 응답 반환
    return NextResponse.json({
      success: true,
      message: `네이버 톡톡 발송 완료 (성공: ${successCount}건, 실패: ${failCount}건)`,
      successCount,
      failCount,
      totalCost: actualCost,
      results,
    });

  } catch (error) {
    console.error('네이버 톡톡 발송 오류:', error);
    return NextResponse.json(
      {
        error: '네이버 톡톡 발송 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
