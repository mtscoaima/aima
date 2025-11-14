import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { replaceTemplateVariables } from "@/utils/messageTemplateParser";
import { sendMessage, scheduleMessage } from "@/lib/messageSender";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// JWT 토큰에서 사용자 ID 추출
function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    return payload.userId || null;
  } catch {
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
        console.error('예약 조회 오류:', reservationError);
        return NextResponse.json({ error: "예약을 찾을 수 없습니다" }, { status: 404 });
      }

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

    // 즉시 발송
    if (sendType === 'immediate') {
      // 공통 로직 사용 (messageSender.ts)
      const result = await sendMessage({
        userId,
        toNumber: recipientPhone,
        toName: recipientName,
        message: finalMessage,
        metadata: {
          source: 'reservation',
          reservation_id: reservationId,
          template_id: templateId || null
        }
      });

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || '메시지 발송에 실패했습니다'
        }, { status: 500 });
      }

      // 예약 메시지 로그 기록 (기존 reservation_message_logs 테이블)
      await supabase.from('reservation_message_logs').insert({
        user_id: userId,
        reservation_id: reservationId,
        template_id: templateId || null,
        to_number: recipientPhone.replace(/[^0-9]/g, ''),
        to_name: recipientName,
        message_content: finalMessage,
        message_type: result.messageType,
        sent_at: new Date().toISOString(),
        status: 'sent',
        error_message: null
      });

      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        logId: result.logId,
        messageType: result.messageType,
        creditUsed: result.creditUsed,
        message: '메시지가 발송되었습니다'
      });
    }
    // 예약 발송
    else if (sendType === 'scheduled') {
      if (!scheduledAt) {
        return NextResponse.json({ error: "예약 시간이 필요합니다" }, { status: 400 });
      }

      // 과거 시간 체크
      const scheduledTime = new Date(scheduledAt);
      if (scheduledTime <= new Date()) {
        return NextResponse.json({ error: "예약 시간은 현재 시간 이후여야 합니다" }, { status: 400 });
      }

      // 공통 로직 사용 (reservation_scheduled_messages 테이블에 저장)
      const result = await scheduleMessage(
        {
          userId,
          toNumber: recipientPhone,
          toName: recipientName,
          message: finalMessage,
          scheduledAt: scheduledAt,
          metadata: {
            source: 'reservation',
            reservation_id: reservationId,
            template_id: templateId || null
          }
        },
        'reservation_scheduled_messages' // 테이블명 명시
      );

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || '예약 메시지 저장에 실패했습니다'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        scheduledId: result.scheduledId,
        scheduledAt: scheduledAt,
        message: '메시지 예약이 완료되었습니다'
      });
    }

    return NextResponse.json({ error: "유효하지 않은 발송 타입입니다" }, { status: 400 });

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
