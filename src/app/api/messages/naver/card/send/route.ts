/**
 * 네이버 카드 승인 알림 발송 API
 *
 * POST /api/messages/naver/card/send
 * - 네이버 카드 승인 알림 발송 (CARDINFO 전용 서버)
 *
 * NOTE: CARDINFO는 별도 서버(mtscard1.mtsco.co.kr:41310)를 사용하므로
 * 현재 미구현 상태입니다. 별도 API 엔드포인트 확인 필요.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';

/**
 * POST /api/messages/naver/card/send
 * 네이버 카드 승인 알림 발송 - 현재 미지원
 */
export async function POST(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuthWithSuccess(request);
  if (!authResult.isValid || !authResult.userInfo) {
    return authResult.errorResponse;
  }

  // CARDINFO는 별도 서버를 사용하므로 현재 미지원
  return NextResponse.json(
    {
      error: '카드 승인 알림(CARDINFO)은 현재 지원되지 않습니다. MTS 담당자에게 문의하세요.',
      details: 'CARDINFO requires separate server (mtscard1.mtsco.co.kr:41310)'
    },
    { status: 501 }
  );

  /*
  // 향후 구현 시 별도 함수 필요
  // 아래 코드는 참고용으로 남겨둡니다.

  try {
    const body = await request.json();
    const {
      navertalkId, // partnerKey
      templateCode,
      recipients, // { phone_number: string, name?: string, variables?: Record<string, string> }[]
      templateParams, // 템플릿 변수 객체 (공통 변수)
      asyncSend, // 'Y' | 'N' (필수 - 카드 승인 알림)
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

    if (!templateParams || typeof templateParams !== 'object') {
      return NextResponse.json(
        { error: 'templateParams 객체가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!asyncSend || !['Y', 'N'].includes(asyncSend)) {
      return NextResponse.json(
        { error: 'asyncSend는 Y 또는 N이어야 합니다.' },
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

    // 네이버 카드 승인 알림 단가 (13원)
    const NAVER_CARD_COST = 13;
    const totalCost = recipients.length * NAVER_CARD_COST;

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
        // 수신자별 변수가 있으면 병합, 없으면 공통 변수 사용
        const recipientParams = recipient.variables
          ? { ...templateParams, ...recipient.variables }
          : templateParams;

        // productCode를 CARDINFO로 강제 설정하여 카드 승인 알림 전용 서버로 라우팅
        const result = await sendNaverTalk(
          navertalkId,
          templateCode,
          recipient.phone_number,
          recipientParams,
          'CARDINFO', // 카드 승인 알림 전용
          undefined, // attachments는 카드 승인 알림에서 사용 안 함
          asyncSend,
          sendDate
        );

        if (result.success) {
          successCount++;

          // message_logs 테이블에 저장
          await supabase.from('message_logs').insert({
            user_id: userId,
            to_number: recipient.phone_number,
            to_name: recipient.name || null,
            message_content: JSON.stringify(recipientParams), // 변수 객체 저장
            subject: null,
            message_type: 'NAVERTALK_CARD',
            sent_at: new Date().toISOString(),
            status: 'sent',
            error_message: null,
            credit_used: NAVER_CARD_COST, // 카드 승인 알림 13원
            metadata: {
              navertalk_id: navertalkId,
              template_code: templateCode,
              product_code: 'CARDINFO',
              template_params: recipientParams,
              async_send: asyncSend,
              mts_msg_id: result.msgId,
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
    const actualCost = successCount * NAVER_CARD_COST;

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
        description: `네이버 카드 승인 알림 발송 (${successCount}건)`,
        metadata: {
          message_type: 'NAVERTALK_CARD',
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
      message: `네이버 카드 승인 알림 발송 완료 (성공: ${successCount}건, 실패: ${failCount}건)`,
      successCount,
      failCount,
      totalCost: actualCost,
      results,
    });

  } catch (error) {
    console.error('네이버 카드 승인 알림 발송 오류:', error);
    return NextResponse.json(
      {
        error: '네이버 카드 승인 알림 발송 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
  */
}
