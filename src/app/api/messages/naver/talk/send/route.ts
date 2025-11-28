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
import { checkBalance } from '@/lib/messageSender';

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
      navertalkId, // partnerKey
      templateCode,
      message, // 메시지 내용 (템플릿 내용)
      callbackNumber, // 발신번호
      recipients, // { phone_number: string, name?: string, variables?: Record<string, string> }[]
      templateParams, // 템플릿 변수 객체 (공통 변수)
      productCode, // 'INFORMATION' | 'BENEFIT'
      attachments, // { buttons?: Array<...>, imageHashId?: string }
      tranType, // 전환전송 유형 ('S' | 'L' | 'N')
      tranMessage, // 전환전송 메시지
      sendDate,
      addEtc2, // 추가 정보 2 (선택)
      addEtc3, // 추가 정보 3 (선택)
      addEtc4, // 추가 정보 4 (선택)
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

    if (!productCode || !['INFORMATION', 'BENEFIT'].includes(productCode)) {
      return NextResponse.json(
        { error: 'productCode는 INFORMATION, BENEFIT 중 하나여야 합니다.' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'message(메시지 내용)가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!callbackNumber) {
      return NextResponse.json(
        { error: 'callbackNumber(발신번호)가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자 잔액 조회 (transactions 테이블 기반)
    const currentBalance = await checkBalance(userId);

    // 네이버 톡톡 단가 계산
    // INFORMATION/CARDINFO: 스마트알림 13원
    // BENEFIT: 광고 20원
    const NAVER_TALK_COST = productCode === 'BENEFIT' ? 20 : 13;
    const totalCost = recipients.length * NAVER_TALK_COST;

    // 잔액 확인
    if (currentBalance < totalCost) {
      return NextResponse.json(
        {
          error: '잔액이 부족합니다.',
          required: totalCost,
          current: currentBalance
        },
        { status: 402 }
      );
    }

    // 수신자 배열 생성 (MTS API 복수 발송 형식)
    // 수신자별 변수가 있으면 병합, 없으면 공통 변수만 사용
    const recipientsArray = recipients.map((r: { phone_number: string; name?: string; variables?: Record<string, string> }) => ({
      phone_number: r.phone_number,
      templateParams: r.variables ? { ...templateParams, ...r.variables } : undefined,
      name: r.name,
    }));

    // 복수 발송 API 호출
    const result = await sendNaverTalk(
      navertalkId,
      templateCode,
      recipientsArray,
      message,
      callbackNumber,
      templateParams,
      productCode,
      attachments,
      tranType,
      tranMessage,
      sendDate,
      addEtc2,
      addEtc3,
      addEtc4
    );

    // 결과 처리 (복수 API는 전체 성공/실패 반환)
    const successCount = result.success ? recipients.length : 0;
    const failCount = result.success ? 0 : recipients.length;

    // 개별 결과 생성
    const results = recipients.map((recipient: { phone_number: string; name?: string }) => ({
      phoneNumber: recipient.phone_number,
      name: recipient.name,
      success: result.success,
      messageId: result.msgId,
      error: result.success ? undefined : (result.error || '발송 실패'),
    }));

    // DB에 발송 이력 일괄 저장
    const logEntries = recipients.map((recipient: { phone_number: string; name?: string; variables?: Record<string, string> }) => {
      const recipientParams = recipient.variables
        ? { ...templateParams, ...recipient.variables }
        : templateParams;
      return {
        user_id: userId,
        to_number: recipient.phone_number,
        to_name: recipient.name || null,
        message_content: JSON.stringify(recipientParams),
        subject: null,
        message_type: 'NAVERTALK',
        sent_at: result.success ? new Date().toISOString() : null,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error || null,
        credit_used: result.success ? NAVER_TALK_COST : 0,
        metadata: {
          navertalk_id: navertalkId,
          template_code: templateCode,
          product_code: productCode,
          template_params: recipientParams,
          attachments: attachments || null,
          tran_type: tranType || null,
          mts_msg_id: result.msgId,
          add_etc2: addEtc2 || null,
          add_etc3: addEtc3 || null,
          add_etc4: addEtc4 || null,
        },
      };
    });

    const { error: logError } = await supabase.from('message_logs').insert(logEntries);
    if (logError) {
      console.error('네이버 톡톡 발송 이력 저장 실패:', logError);
    }

    // 성공한 건수만큼 잔액 차감 (transactions 테이블에 기록)
    const actualCost = successCount * NAVER_TALK_COST;

    if (actualCost > 0) {
      // transactions 테이블에 기록
      const { error: transactionError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'usage',
        amount: actualCost, // 양수로 저장 (type='usage'일 때 차감으로 처리)
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

      if (transactionError) {
        console.error('네이버 톡톡 거래 기록 실패:', transactionError);
      }
    }

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
