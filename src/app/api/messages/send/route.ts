/**
 * 메시지 발송 API
 * POST /api/messages/send
 *
 * 기능:
 * - SMS/LMS/MMS 즉시 발송
 * - SMS/LMS/MMS 예약 발송
 * - 다중 수신자 지원
 * - 치환문구 처리 (#[변수명] 형식)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  sendMessage,
  scheduleMessage,
  SendMessageParams,
} from "@/lib/messageSender";
import { replaceVariables } from "@/utils/messageVariables";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// JWT 인증
// ============================================================================

/**
 * JWT 토큰에서 사용자 ID 추출
 */
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

// ============================================================================
// 요청 타입 정의
// ============================================================================

interface Recipient {
  phone_number: string;
  name?: string;
  variables?: Record<string, string>; // 치환 변수 (예: {"이름": "홍길동"})
}

interface SendMessageRequest {
  recipients: Recipient[];
  message: string;
  subject?: string;
  sendType: "immediate" | "scheduled";
  scheduledAt?: string; // ISO 8601 형식
  isAd?: boolean; // 광고 메시지 여부
  imageUrls?: string[]; // MMS 이미지 URL 배열 (하위 호환성)
  imageFileIds?: string[]; // MMS 이미지 파일 ID 배열 (프론트엔드에서 사용)
}

// ============================================================================
// POST 핸들러
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. JWT 인증
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const userId = getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다" },
        { status: 401 }
      );
    }

    // 2. 요청 본문 파싱
    const body: SendMessageRequest = await request.json();
    const {
      recipients,
      message,
      subject,
      sendType = "immediate",
      scheduledAt,
      isAd = false,
      imageUrls = [],
      imageFileIds = [],
    } = body;

    // imageFileIds와 imageUrls 통합 (imageFileIds 우선)
    const finalImageUrls = imageFileIds.length > 0 ? imageFileIds : imageUrls;

    // 3. 유효성 검증
    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { error: "수신자가 필요합니다" },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "메시지 내용이 필요합니다" },
        { status: 400 }
      );
    }

    if (sendType === "scheduled") {
      if (!scheduledAt) {
        return NextResponse.json(
          { error: "예약 발송 시간이 필요합니다" },
          { status: 400 }
        );
      }

      // 예약 시간이 미래인지 확인
      const scheduledTime = new Date(scheduledAt);
      if (scheduledTime <= new Date()) {
        return NextResponse.json(
          { error: "예약 시간은 현재 시간 이후여야 합니다" },
          { status: 400 }
        );
      }
    }

    // 4. 사용자 정보 조회 (변수 치환용)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("phone_number, name, company_info")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("사용자 정보 조회 실패:", userError);
    }

    // 사용자 정보 추출
    const userInfo = {
      phone: userData?.phone_number || "",
      name: userData?.name || "",
      companyName: userData?.company_info?.companyName || "",
    };

    // 5. 광고 메시지 처리
    let finalMessage = message;
    if (isAd && !message.includes("(광고)")) {
      // 광고 표기 자동 추가
      finalMessage = `(광고)\n${message}`;
    }

    // 6. 즉시 발송 처리
    if (sendType === "immediate") {
      const results = [];
      let successCount = 0;
      let failCount = 0;

      for (const recipient of recipients) {
        // 자동 변수 치환 (수신자 정보, 날짜/시간, 발신자 정보)
        let personalizedMessage = replaceVariables(
          finalMessage,
          {
            name: recipient.name,
            phone: recipient.phone_number,
            groupName: recipient.variables?.["그룹명"],
          },
          userInfo
        );

        // 커스텀 변수 추가 치환 (recipient.variables에 정의된 다른 변수들)
        if (recipient.variables) {
          for (const [key, value] of Object.entries(recipient.variables)) {
            // 기본 변수가 아닌 커스텀 변수만 치환
            if (!["이름", "전화번호", "그룹명"].includes(key)) {
              const pattern = new RegExp(`#\\[${key}\\]`, "g");
              personalizedMessage = personalizedMessage.replace(pattern, value);
            }
          }
        }

        // 메시지 발송
        const params: SendMessageParams = {
          userId,
          toNumber: recipient.phone_number,
          toName: recipient.name,
          message: personalizedMessage,
          subject,
          imageUrls: finalImageUrls && finalImageUrls.length > 0 ? finalImageUrls : undefined,
          metadata: {
            source: "messages_send",
            send_type: "immediate",
            is_ad: isAd,
          },
        };

        const result = await sendMessage(params);

        results.push({
          recipient: recipient.phone_number,
          name: recipient.name,
          success: result.success,
          messageId: result.messageId,
          messageType: result.messageType,
          creditUsed: result.creditUsed,
          error: result.error,
        });

        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      return NextResponse.json({
        success: true,
        totalCount: recipients.length,
        successCount,
        failCount,
        results,
      });
    }

    // 7. 예약 발송 처리
    else if (sendType === "scheduled") {
      const results = [];
      let scheduledCount = 0;
      let failCount = 0;

      for (const recipient of recipients) {
        // 자동 변수 치환 (수신자 정보, 날짜/시간, 발신자 정보)
        let personalizedMessage = replaceVariables(
          finalMessage,
          {
            name: recipient.name,
            phone: recipient.phone_number,
            groupName: recipient.variables?.["그룹명"],
          },
          userInfo
        );

        // 커스텀 변수 추가 치환
        if (recipient.variables) {
          for (const [key, value] of Object.entries(recipient.variables)) {
            if (!["이름", "전화번호", "그룹명"].includes(key)) {
              const pattern = new RegExp(`#\\[${key}\\]`, "g");
              personalizedMessage = personalizedMessage.replace(pattern, value);
            }
          }
        }

        // 예약 메시지 저장
        const result = await scheduleMessage({
          userId,
          toNumber: recipient.phone_number,
          toName: recipient.name,
          message: personalizedMessage,
          subject,
          scheduledAt: scheduledAt!,
          imageUrls: finalImageUrls && finalImageUrls.length > 0 ? finalImageUrls : undefined,
          metadata: {
            source: "messages_send",
            send_type: "scheduled",
            is_ad: isAd,
          },
        });

        results.push({
          recipient: recipient.phone_number,
          name: recipient.name,
          success: result.success,
          scheduledId: result.scheduledId,
          error: result.error,
        });

        if (result.success) {
          scheduledCount++;
        } else {
          failCount++;
        }
      }

      return NextResponse.json({
        success: true,
        scheduledCount,
        failCount,
        scheduledAt,
        results,
      });
    }

    return NextResponse.json(
      { error: "유효하지 않은 발송 타입입니다" },
      { status: 400 }
    );
  } catch (error) {
    console.error("메시지 발송 오류:", error);

    return NextResponse.json(
      {
        error: "메시지 발송 중 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS 핸들러 (CORS)
// ============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
