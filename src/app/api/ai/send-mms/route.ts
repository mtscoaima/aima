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

    // 환경변수에서 발신번호 확인
    const fromNumber = process.env.TEST_CALLING_NUMBER;
    if (!fromNumber) {
      return NextResponse.json(
        { error: "발신번호가 설정되지 않았습니다." },
        { status: 500 }
      );
    }

    // 동적 베이스 URL 생성 (Vercel 배포 환경 대응)
    const getBaseUrl = () => {
      // 환경변수가 있으면 사용
      if (process.env.NEXT_PUBLIC_BASE_URL) {
        return process.env.NEXT_PUBLIC_BASE_URL;
      }

      // Vercel 환경에서는 VERCEL_URL 사용
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }

      // 요청 헤더에서 호스트 정보 추출
      const host = request.headers.get("host");
      const protocol = request.headers.get("x-forwarded-proto") || "http";

      if (host) {
        return `${protocol}://${host}`;
      }

      // 개발 환경 fallback
      return "http://localhost:3000";
    };

    const baseUrl = getBaseUrl();

    // 이미지 URL 처리 (Base64 또는 일반 URL)
    let fileId = null;

    if (
      imageUrl &&
      (imageUrl.startsWith("data:image/") || imageUrl.startsWith("http"))
    ) {
      try {
        let blob: Blob;
        let fileName: string;

        if (imageUrl.startsWith("data:image/")) {
          // Base64 데이터에서 파일 정보 추출
          const base64Data = imageUrl.split(",")[1];
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const mimeType = imageUrl.split(";")[0].split(":")[1];

          // Base64를 Blob으로 변환
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: "image/jpeg" }); // JPEG로 강제 변환
          fileName = `ai-generated-${Date.now()}.jpg`;
        } else if (imageUrl.startsWith("http")) {
          // URL에서 이미지 다운로드
          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            throw new Error(
              `이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`
            );
          }

          blob = await imageResponse.blob();

          // URL에서 파일명 추출 또는 기본 파일명 사용
          const urlParts = imageUrl.split("/");
          const originalFileName = urlParts[urlParts.length - 1];
          fileName = originalFileName.includes(".")
            ? originalFileName
            : `template-${Date.now()}.jpg`;

          // JPEG가 아닌 경우 파일명과 타입을 JPEG로 변경
          if (!blob.type.includes("jpeg") && !blob.type.includes("jpg")) {
            fileName = fileName.replace(/\.[^/.]+$/, ".jpg");
            // 새로운 Blob을 JPEG 타입으로 생성
            blob = new Blob([blob], { type: "image/jpeg" });
          }
        } else {
          throw new Error("지원하지 않는 이미지 형식입니다.");
        }

        // Blob을 File 객체로 변환
        const file = new File([blob], fileName, {
          type: "image/jpeg",
        });

        // FormData로 파일 업로드
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch(
          `${baseUrl}/api/message/upload-file`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          fileId = uploadResult.fileId;
        } else {
          const uploadError = await uploadResponse.json();
          throw new Error(`파일 업로드 실패: ${uploadError.error}`);
        }
      } catch (error) {
        throw new Error(
          `이미지 처리 실패: ${
            error instanceof Error ? error.message : "알 수 없는 오류"
          }`
        );
      }
    }

    // MMS 전송 API 호출 (발신번호는 서버에서 환경변수로 처리)
    const sendRequestBody = {
      toNumbers: recipients,
      message: message,
      fileIds: fileId ? [fileId] : undefined,
    };

    const sendResponse = await fetch(`${baseUrl}/api/message/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(sendRequestBody),
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
