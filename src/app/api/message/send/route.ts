import { NextRequest, NextResponse } from "next/server";
import { sendNaverSMS, sendNaverMMS } from "@/lib/naverSensApi";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toNumber, toNumbers, subject, message, fileIds } = body;

    // 필수 필드 검증
    if (!message) {
      return NextResponse.json(
        { error: "메시지 내용은 필수입니다." },
        { status: 400 }
      );
    }

    // 수신번호 배열 처리 (단일 번호 또는 배열 지원)
    let recipients: string[] = [];
    if (toNumbers && Array.isArray(toNumbers)) {
      recipients = toNumbers;
    } else if (toNumber) {
      recipients = [toNumber];
    } else {
      return NextResponse.json(
        { error: "수신번호가 필요합니다." },
        { status: 400 }
      );
    }

    const results = [];

    // 각 수신자에게 메시지 전송
    for (const recipient of recipients) {
      if (!recipient.trim()) continue;

      try {
        let result;
        if (fileIds && fileIds.length > 0) {
          // MMS 발송 (파일 첨부)
          result = await sendNaverMMS(
            recipient,
            message,
            subject || "",
            fileIds
          );
        } else {
          // SMS/LMS 발송 (자동 타입 결정)
          result = await sendNaverSMS(recipient, message, subject);
        }

        results.push({
          toNumber: recipient,
          success: result.success,
          data: result.success ? { requestId: result.requestId } : undefined,
          error: result.success ? undefined : result.error,
        });
      } catch (error) {
        console.error(`메시지 전송 실패 (${recipient}):`, error);
        results.push({
          toNumber: recipient,
          success: false,
          error: error instanceof Error ? error.message : "알 수 없는 오류",
        });
      }
    }

    // 결과 집계
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: failCount === 0,
      message:
        failCount === 0
          ? `모든 메시지가 성공적으로 전송되었습니다. (${successCount}건)`
          : successCount === 0
          ? `모든 메시지 전송에 실패했습니다. (${failCount}건)`
          : `일부 메시지가 전송되었습니다. 성공: ${successCount}건, 실패: ${failCount}건`,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
      },
    });
  } catch (error) {
    console.error("메시지 전송 오류:", error);

    return NextResponse.json(
      {
        error: "메시지 전송에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
