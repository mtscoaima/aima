import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNaverSMS } from "@/lib/naverSensApi";
import { replaceTemplateVariables, calculateMessageBytes, determineMessageType } from "@/utils/messageTemplateParser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// JWT 토큰에서 사용자 ID 추출
function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return payload.userId || null;
  } catch (error) {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: "유효하지 않은 토큰입니다" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 요청 본문 파싱
    const body = await request.json();
    const {
      reservationId,
      templateId,
      message,
      sendType = 'immediate', // 'immediate' | 'scheduled'
      scheduledAt
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "메시지 내용이 필요합니다" }, { status: 400 });
    }

    let finalMessage = message;
    let recipientPhone = '';
    let recipientName = '';
    let reservationData = null;

    // 예약 정보가 있으면 조회
    if (reservationId) {
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .select(`
          *,
          spaces (
            id,
            name
          )
        `)
        .eq('id', reservationId)
        .eq('user_id', userId)
        .single();

      if (reservationError || !reservation) {
        return NextResponse.json({ error: "예약을 찾을 수 없습니다" }, { status: 404 });
      }

      reservationData = reservation;
      recipientPhone = reservation.customer_phone;
      recipientName = reservation.customer_name;

      // 템플릿이 선택된 경우 변수 치환
      if (templateId) {
        const { data: template } = await supabase
          .from('reservation_message_templates')
          .select('*')
          .eq('id', templateId)
          .eq('user_id', userId)
          .single();

        if (template) {
          finalMessage = replaceTemplateVariables(message, {
            ...reservation,
            space: reservation.spaces
          });
        }
      } else {
        // 템플릿 없이 직접 입력한 경우에도 변수 치환
        finalMessage = replaceTemplateVariables(message, {
          ...reservation,
          space: reservation.spaces
        });
      }
    } else {
      return NextResponse.json({ error: "예약 ID가 필요합니다" }, { status: 400 });
    }

    // 전화번호 검증
    if (!recipientPhone || !recipientPhone.trim()) {
      return NextResponse.json({ error: "수신자 전화번호가 없습니다" }, { status: 400 });
    }

    // 전화번호 포맷 정리 (하이픈 제거)
    const cleanPhone = recipientPhone.replace(/[^0-9]/g, '');

    // 메시지 타입 결정
    const messageBytes = calculateMessageBytes(finalMessage);
    const messageType = determineMessageType(finalMessage);

    // 광고머니 비용 계산 (기존 시스템 활용)
    const creditRequired = messageType === 'SMS' ? 20 : 50; // SMS 20원, LMS 50원

    // 광고머니 잔액 확인 (transactions 기반)
    const { data: transactions, error: transactionError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (transactionError) {
      console.error('트랜잭션 조회 오류:', transactionError);
      return NextResponse.json({ error: "잔액 조회에 실패했습니다" }, { status: 500 });
    }

    // 광고머니 잔액 계산
    let advertisingBalance = 0;
    for (const transaction of transactions || []) {
      const metadata = transaction.metadata as Record<string, string | number | boolean> | null;

      if (transaction.type === "charge") {
        // 광고머니 충전만 계산 (포인트 제외)
        if (!metadata?.isReward) {
          advertisingBalance += transaction.amount;
        }
      } else if (transaction.type === "usage") {
        // 광고머니 사용만 계산 (포인트 사용 제외)
        if (metadata?.transactionType !== "point") {
          advertisingBalance -= transaction.amount;
        }
      } else if (transaction.type === "refund") {
        advertisingBalance += transaction.amount;
      } else if (transaction.type === "penalty") {
        advertisingBalance -= transaction.amount;
      }
    }

    if (advertisingBalance < creditRequired) {
      return NextResponse.json({
        error: "광고머니가 부족합니다",
        required: creditRequired,
        balance: advertisingBalance
      }, { status: 402 });
    }

    let sendResult;
    let status = 'pending';
    let errorMessage = null;

    // 즉시 발송
    if (sendType === 'immediate') {
      sendResult = await sendNaverSMS(cleanPhone, finalMessage);

      if (sendResult.success) {
        status = 'sent';

        // 광고머니 차감 (usage 트랜잭션 생성)
        await supabase.from('transactions').insert({
          user_id: userId,
          amount: creditRequired,
          type: 'usage',
          status: 'completed',
          description: `예약 메시지 발송 (${messageType})`,
          metadata: {
            transactionType: 'advertising',
            usage_type: 'message_send',
            message_type: messageType,
            reservation_id: reservationId
          },
          created_at: new Date().toISOString()
        });
      } else {
        status = 'failed';
        errorMessage = sendResult.error || '발송 실패';
      }
    } else if (sendType === 'scheduled') {
      // 예약 발송은 추후 구현 (Phase 2.2)
      status = 'pending';
    }

    // 메시지 로그 기록
    const { data: logData, error: logError } = await supabase
      .from('reservation_message_logs')
      .insert({
        user_id: userId,
        reservation_id: reservationId,
        template_id: templateId || null,
        to_number: cleanPhone,
        to_name: recipientName,
        message_content: finalMessage,
        message_type: messageType,
        sent_at: sendType === 'immediate' ? new Date().toISOString() : null,
        status: status,
        error_message: errorMessage
      })
      .select()
      .single();

    if (logError) {
      console.error('메시지 로그 저장 실패:', logError);
    }

    if (status === 'sent') {
      return NextResponse.json({
        success: true,
        messageId: sendResult?.requestId,
        logId: logData?.id,
        messageType: messageType,
        creditUsed: creditRequired,
        message: '메시지가 발송되었습니다'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: errorMessage || '메시지 발송에 실패했습니다',
        logId: logData?.id
      }, { status: 500 });
    }

  } catch (error) {
    console.error("메시지 발송 API 오류:", error);
    return NextResponse.json(
      {
        error: "메시지 발송 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
