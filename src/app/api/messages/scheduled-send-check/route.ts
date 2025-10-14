/**
 * 예약 메시지 자동 발송 체크 및 실행 API
 * POST /api/messages/scheduled-send-check
 * Cron Job으로 주기적으로 호출되어 예약 시간이 도래한 메시지를 발송합니다.
 *
 * scheduled_messages 테이블 구조 (create_scheduled_messages.sql 참고):
 * - to_number: 단일 수신번호
 * - message_content: 메시지 내용
 * - 기존 reservation 시스템과 동일한 구조
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNaverSMS } from "@/lib/naverSensApi";
import { determineMessageType } from "@/utils/messageTemplateParser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// 광고머니 잔액 계산 함수
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function calculateAdvertisingBalance(userId: number, supabase: any): Promise<number> {
  try {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('트랜잭션 조회 오류:', error);
      return 0;
    }

    let balance = 0;
    for (const transaction of transactions || []) {
      const metadata = transaction.metadata;
      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "charge") {
        if (!metadata?.isReward) {
          balance += amount;
        }
      } else if (transaction.type === "usage") {
        if (metadata?.transactionType !== "point") {
          balance -= amount;
        }
      } else if (transaction.type === "refund") {
        balance += amount;
      } else if (transaction.type === "penalty") {
        balance -= amount;
      }
    }

    return Math.max(0, balance);
  } catch (error) {
    console.error('광고머니 잔액 계산 중 오류:', error);
    return 0;
  }
}

// POST /api/messages/scheduled-send-check
export async function POST(request: NextRequest) {
  try {
    // Cron Secret 검증 (있을 경우에만)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const results = {
      checked: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 1. 발송 대기 중인 예약 메시지 조회
    const { data: scheduledMessages, error: queryError } = await supabase
      .from("scheduled_messages")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", now.toISOString())
      .limit(100); // 한 번에 100개씩 처리

    if (queryError) {
      console.error("[Cron] 예약 메시지 조회 실패:", queryError);
      return NextResponse.json(
        { error: "예약 메시지 조회 실패", details: queryError.message },
        { status: 500 }
      );
    }

    if (!scheduledMessages || scheduledMessages.length === 0) {
      return NextResponse.json({
        success: true,
        processed: 0,
        results
      });
    }

    // 2. 각 메시지 발송
    for (const msg of scheduledMessages) {
      results.checked++;

      try {
        // 메시지 타입 결정
        const messageType = determineMessageType(msg.message_content);
        const creditRequired = messageType === "SMS" ? 20 : 50;

        // 광고머니 잔액 확인
        const balance = await calculateAdvertisingBalance(msg.user_id, supabase);

        if (balance < creditRequired) {
          // 잔액 부족
          await supabase
            .from("scheduled_messages")
            .update({
              status: "failed",
              error_message: "광고머니 부족",
              updated_at: now.toISOString()
            })
            .eq("id", msg.id);

          results.failed++;
          results.errors.push(`메시지 ${msg.id}: 광고머니 부족`);
          continue;
        }

        // Naver SENS API 호출
        const result = await sendNaverSMS(msg.to_number, msg.message_content, msg.subject);

        if (result.success) {
          // 발송 성공
          const sentAt = now.toISOString();

          // 1) 광고머니 차감
          await supabase.from("transactions").insert({
            user_id: msg.user_id,
            amount: creditRequired,
            type: "usage",
            status: "completed",
            description: `예약 메시지 발송 (${messageType})`,
            metadata: {
              transactionType: "advertising",
              usage_type: "scheduled_message_send",
              message_type: messageType,
              scheduled_message_id: msg.id,
              recipient: msg.to_number,
              recipient_name: msg.to_name
            },
            created_at: sentAt
          });

          // 2) message_logs에 기록
          await supabase.from("message_logs").insert({
            user_id: msg.user_id,
            to_number: msg.to_number,
            to_name: msg.to_name,
            message_content: msg.message_content,
            subject: msg.subject,
            message_type: messageType,
            sent_at: sentAt,
            status: "sent",
            credit_used: creditRequired,
            metadata: msg.metadata || {}
          });

          // 3) scheduled_messages 상태 변경
          await supabase
            .from("scheduled_messages")
            .update({
              status: "sent",
              sent_at: sentAt,
              updated_at: sentAt
            })
            .eq("id", msg.id);

          results.sent++;
        } else {
          // 발송 실패
          await supabase
            .from("scheduled_messages")
            .update({
              status: "failed",
              error_message: result.error || "발송 실패",
              updated_at: now.toISOString()
            })
            .eq("id", msg.id);

          results.failed++;
          results.errors.push(`메시지 ${msg.id}: ${result.error || "발송 실패"}`);
        }
      } catch (error) {
        console.error(`[Cron] 메시지 ${msg.id} 처리 중 오류:`, error);

        // 오류 상태로 업데이트
        await supabase
          .from("scheduled_messages")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "알 수 없는 오류",
            updated_at: now.toISOString()
          })
          .eq("id", msg.id);

        results.failed++;
        results.errors.push(`메시지 ${msg.id}: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
      }
    }

    return NextResponse.json({
      success: true,
      processed: scheduledMessages.length,
      successCount: results.sent,
      failCount: results.failed,
      results
    });

  } catch (error) {
    console.error("[Cron] 예약 메시지 자동 발송 중 오류:", error);
    return NextResponse.json(
      {
        error: "예약 메시지 자동 발송 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
