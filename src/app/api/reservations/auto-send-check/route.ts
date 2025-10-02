import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendNaverSMS } from "@/lib/naverSensApi";
import { replaceTemplateVariables, determineMessageType } from "@/utils/messageTemplateParser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST /api/reservations/auto-send-check - 자동 발송 체크 및 실행 (Cron)
export async function POST(request: NextRequest) {
  try {
    // Cron Secret 검증 (보안)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "your-secret-key";

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();
    const results = {
      checked: 0,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 1. 활성화된 자동 발송 규칙 조회
    const { data: rules, error: rulesError } = await supabase
      .from("reservation_auto_message_rules")
      .select(`
        *,
        spaces (
          id,
          name,
          host_contact_number_id
        ),
        reservation_message_templates (
          id,
          name,
          content
        )
      `)
      .eq("is_active", true);

    if (rulesError) {
      console.error("규칙 조회 오류:", rulesError);
      return NextResponse.json(
        { error: "규칙 조회 실패", details: rulesError.message },
        { status: 500 }
      );
    }

    if (!rules || rules.length === 0) {
      return NextResponse.json({
        message: "활성화된 규칙이 없습니다",
        results,
      });
    }

    // 2. 각 규칙에 대해 처리
    for (const rule of rules) {
      try {
        // 해당 공간의 확정된 예약 조회
        const { data: reservations, error: reservationsError } = await supabase
          .from("reservations")
          .select(`
            *,
            spaces (
              id,
              name
            )
          `)
          .eq("space_id", rule.space_id)
          .eq("status", "confirmed");

        if (reservationsError || !reservations) {
          console.error(`예약 조회 오류 (규칙 ${rule.id}):`, reservationsError);
          results.errors.push(`규칙 ${rule.id}: 예약 조회 실패`);
          continue;
        }

        // 3. 각 예약에 대해 발송 시간 계산 및 체크
        for (const reservation of reservations) {
          results.checked++;

          // 발송 시간 계산
          let scheduledTime: Date;
          const triggerTime = new Date(
            rule.trigger_type === "check_in"
              ? reservation.start_datetime
              : reservation.end_datetime
          );

          if (rule.time_type === "relative") {
            // 상대적 시점: 분 단위로 계산
            const timeValueInMs = (rule.time_value || 0) * 60 * 1000;
            scheduledTime = new Date(
              rule.time_direction === "before"
                ? triggerTime.getTime() - timeValueInMs
                : triggerTime.getTime() + timeValueInMs
            );
          } else {
            // 절대적 시점: 특정 시간에 발송
            const daysBeforeMs = (rule.time_value || 0) * 24 * 60 * 60 * 1000;
            const [hours, minutes] = (rule.absolute_time || "09:00:00").split(":");

            scheduledTime = new Date(triggerTime.getTime() - daysBeforeMs);
            scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          }

          // 발송 시간이 도래했는지 확인 (15분 이내)
          const timeDiff = scheduledTime.getTime() - now.getTime();
          const shouldSend = timeDiff <= 0 && timeDiff > -15 * 60 * 1000; // 과거 15분 이내

          if (!shouldSend) {
            continue; // 발송 시간이 아님
          }

          // 4. 중복 발송 방지: 이미 발송했는지 확인
          const { data: existingLog, error: logCheckError } = await supabase
            .from("reservation_message_logs")
            .select("id")
            .eq("reservation_id", reservation.id)
            .eq("auto_rule_id", rule.id)
            .single();

          if (existingLog) {
            continue; // 이미 발송됨
          }

          // 5. 호스트 연락처 조회
          let hostContactNumber = null;
          if (rule.spaces?.host_contact_number_id) {
            const { data: senderNumber } = await supabase
              .from("sender_numbers")
              .select("phone_number")
              .eq("id", rule.spaces.host_contact_number_id)
              .single();

            hostContactNumber = senderNumber?.phone_number || null;
          }

          // 6. 메시지 내용 생성 (변수 치환)
          const messageContent = replaceTemplateVariables(
            rule.reservation_message_templates?.content || "",
            {
              ...reservation,
              space: {
                ...reservation.spaces,
                host_contact_number: hostContactNumber,
              },
            }
          );

          // 메시지 타입 결정
          const messageType = determineMessageType(messageContent);

          // 전화번호 포맷 정리
          const cleanPhone = reservation.customer_phone.replace(/[^0-9]/g, "");

          // 7. 네이버 SENS API로 메시지 발송
          try {
            const sendResult = await sendNaverSMS(cleanPhone, messageContent);

            if (!sendResult.success) {
              throw new Error(sendResult.error || "발송 실패");
            }

            // 8. 크레딧 차감
            const creditRequired = messageType === "SMS" ? 20 : 50;

            await supabase.from("transactions").insert({
              user_id: rule.user_id,
              amount: creditRequired,
              type: "usage",
              status: "completed",
              description: `자동 발송 메시지 (${messageType}) - ${reservation.customer_name}`,
              metadata: {
                transactionType: "advertising",
                usage_type: "auto_message_send",
                message_type: messageType,
                reservation_id: reservation.id,
                auto_rule_id: rule.id,
              },
              created_at: now.toISOString(),
            });

            // 9. 발송 로그 기록
            await supabase.from("reservation_message_logs").insert({
              user_id: rule.user_id,
              reservation_id: reservation.id,
              auto_rule_id: rule.id,
              to_number: cleanPhone,
              to_name: reservation.customer_name,
              message_content: messageContent,
              message_type: messageType,
              sent_at: now.toISOString(),
              status: "sent",
            });

            results.sent++;
          } catch (sendError: any) {
            console.error("메시지 발송 오류:", sendError);
            results.failed++;
            results.errors.push(
              `예약 ${reservation.id}: ${sendError.message || "발송 실패"}`
            );

            // 실패 로그 기록
            await supabase.from("reservation_message_logs").insert({
              user_id: rule.user_id,
              reservation_id: reservation.id,
              auto_rule_id: rule.id,
              to_number: cleanPhone,
              to_name: reservation.customer_name,
              message_content: messageContent,
              message_type: messageType,
              status: "failed",
              error_message: sendError.message || "발송 실패",
            });
          }
        }
      } catch (ruleError: any) {
        console.error(`규칙 처리 오류 (규칙 ${rule.id}):`, ruleError);
        results.errors.push(`규칙 ${rule.id}: ${ruleError.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: "자동 발송 체크 완료",
      results,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error("자동 발송 체크 API 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다", details: error.message },
      { status: 500 }
    );
  }
}
