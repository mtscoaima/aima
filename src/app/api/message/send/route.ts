import { NextRequest, NextResponse } from "next/server";
import { sendMtsSMS, sendMtsMMS } from "@/lib/mtsApi";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { toNumber, toNumbers, subject, message, imageUrls, callbackNumber } = body;

    // 필수 필드 검증
    if (!message) {
      return NextResponse.json(
        { error: "메시지 내용은 필수입니다." },
        { status: 400 }
      );
    }

    if (!callbackNumber) {
      return NextResponse.json(
        { error: "발신번호는 필수입니다." },
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

    // 수신자 배열 생성 (빈 번호 제외)
    const recipientsArray = recipients
      .filter((r: string) => r.trim())
      .map((phone_number: string) => ({
        phone_number,
        message,
      }));

    if (recipientsArray.length === 0) {
      return NextResponse.json(
        { error: "유효한 수신번호가 없습니다." },
        { status: 400 }
      );
    }

    // 복수 발송 API 호출 (이미지 유무에 따라 MMS/SMS)
    let result;
    try {
      if (imageUrls && imageUrls.length > 0) {
        // MMS 복수 발송
        result = await sendMtsMMS(
          recipientsArray,
          subject || "",
          imageUrls,
          callbackNumber
        );
      } else {
        // SMS/LMS 복수 발송
        result = await sendMtsSMS(
          recipientsArray,
          callbackNumber,
          subject
        );
      }
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "알 수 없는 오류" },
        { status: 500 }
      );
    }

    // 결과 처리 (복수 API는 전체 성공/실패 반환)
    const successCount = result.success ? recipientsArray.length : 0;
    const failCount = result.success ? 0 : recipientsArray.length;

    // 개별 결과 생성 (복수 API는 개별 결과를 반환하지 않으므로 동일하게 처리)
    const results = recipientsArray.map((r: { phone_number: string; message: string }) => ({
      toNumber: r.phone_number,
      success: result.success,
      data: result.success ? { messageId: result.messageId } : undefined,
      error: result.success ? undefined : result.error,
    }));

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
