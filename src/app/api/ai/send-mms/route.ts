import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { templateId, recipients, message, imageUrl } = await request.json();

    if (!templateId || !recipients || !message) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 이미지 URL이 base64 데이터 URL인 경우 파일로 변환
    let fileId = null;
    if (imageUrl && imageUrl.startsWith("data:image/")) {
      // Base64 이미지를 파일로 업로드
      const base64Data = imageUrl.split(",")[1];
      const imageBuffer = Buffer.from(base64Data, "base64");
      
      // 파일 업로드 API 호출
      const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/message/upload-file`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: `ai-generated-${Date.now()}.png`,
          fileData: base64Data,
          mimeType: "image/png",
        }),
      });

      if (uploadResponse.ok) {
        const uploadResult = await uploadResponse.json();
        fileId = uploadResult.fileId;
      }
    }

    // MMS 전송 API 호출
    const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/message/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        toNumbers: recipients,
        message: message,
        fileIds: fileId ? [fileId] : undefined,
      }),
    });

    const sendResult = await sendResponse.json();

    if (sendResponse.ok) {
      return NextResponse.json({
        success: true,
        message: "MMS가 성공적으로 전송되었습니다.",
        result: sendResult,
      });
    } else {
      throw new Error(sendResult.error || "MMS 전송에 실패했습니다.");
    }
  } catch (error) {
    console.error("MMS 전송 오류:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `MMS 전송 오류: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "MMS 전송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 