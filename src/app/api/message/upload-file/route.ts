import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// NAVER SENS 설정
const NAVER_SENS_SERVICE_ID = process.env.NAVER_SENS_SERVICE_ID;
const NAVER_ACCESS_KEY_ID = process.env.NAVER_ACCESS_KEY_ID;
const NAVER_SECRET_KEY = process.env.NAVER_SECRET_KEY;

// 서명 생성 함수
function makeSignature(
  method: string,
  url: string,
  timestamp: string,
  accessKey: string,
  secretKey: string
) {
  const space = " ";
  const newLine = "\n";

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(method);
  hmac.update(space);
  hmac.update(url);
  hmac.update(newLine);
  hmac.update(timestamp);
  hmac.update(newLine);
  hmac.update(accessKey);

  return hmac.digest("base64");
}

// 이미지 해상도 추출 함수 (JPEG용)
async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number }> {
  // JPEG 파일의 SOF (Start of Frame) 마커를 찾아 해상도 추출
  for (let i = 0; i < buffer.length - 4; i++) {
    // SOF0 (0xFFC0) 또는 SOF2 (0xFFC2) 마커 찾기
    if (
      buffer[i] === 0xff &&
      (buffer[i + 1] === 0xc0 || buffer[i + 1] === 0xc2)
    ) {
      // SOF 마커 이후 5바이트 건너뛰고 해상도 정보 읽기
      const height = (buffer[i + 5] << 8) | buffer[i + 6];
      const width = (buffer[i + 7] << 8) | buffer[i + 8];
      return { width, height };
    }
  }

  // JPEG 해상도를 찾을 수 없는 경우 기본값 반환
  throw new Error("JPEG 해상도 정보를 찾을 수 없습니다.");
}

// 파일 업로드 함수
async function uploadFile(
  file: File,
  cleanFileName: string,
  imageBuffer: Buffer
) {
  const timestamp = Date.now().toString();
  const method = "POST";
  const url = `/sms/v2/services/${NAVER_SENS_SERVICE_ID}/files`;

  // 서명 생성
  const signature = makeSignature(
    method,
    url,
    timestamp,
    NAVER_ACCESS_KEY_ID!,
    NAVER_SECRET_KEY!
  );

  // 파일을 Base64로 인코딩
  const base64String = imageBuffer.toString("base64");

  // 요청 데이터 (JSON 형태) - 정리된 파일명 사용
  const requestData = {
    fileName: cleanFileName,
    fileBody: base64String,
  };

  // 요청 헤더
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "x-ncp-apigw-timestamp": timestamp,
    "x-ncp-iam-access-key": NAVER_ACCESS_KEY_ID!,
    "x-ncp-apigw-signature-v2": signature,
  };

  try {
    // API 호출
    const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
      method: "POST",
      headers,
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        // JSON 파싱 실패 시 텍스트로 읽기
        const errorText = await response.text();
        console.error("파일 업로드 실패 (텍스트 응답):", errorText);
        throw new Error(
          `파일 업로드 실패: HTTP ${response.status} - ${errorText}`
        );
      }

      console.error("파일 업로드 실패:", errorData);
      console.error("요청 헤더:", headers);
      console.error("요청 URL:", `https://sens.apigw.ntruss.com${url}`);

      // NAVER SENS API 오류 코드별 처리
      if (errorData.error) {
        const { errorCode, message: errorMessage, details } = errorData.error;

        switch (errorCode) {
          case "200":
            throw new Error(
              `인증 실패: ${
                details || errorMessage
              }. NAVER Cloud Platform 계정 설정을 확인해주세요.`
            );
          case "400":
            throw new Error(`잘못된 요청: ${details || errorMessage}`);
          case "403":
            throw new Error(
              `권한 없음: ${
                details || errorMessage
              }. 파일 업로드 권한을 확인해주세요.`
            );
          case "404":
            throw new Error(
              `서비스를 찾을 수 없음: ${
                details || errorMessage
              }. Service ID를 확인해주세요.`
            );
          case "413":
            throw new Error(
              `파일 크기 초과: ${
                details || errorMessage
              }. 파일 크기를 확인해주세요.`
            );
          case "415":
            throw new Error(
              `지원하지 않는 파일 형식: ${
                details || errorMessage
              }. 이미지 파일만 업로드 가능합니다.`
            );
          case "429":
            throw new Error(
              `요청 한도 초과: ${
                details || errorMessage
              }. 잠시 후 다시 시도해주세요.`
            );
          case "500":
            throw new Error(
              `서버 오류: ${
                details || errorMessage
              }. NAVER Cloud Platform 서비스 상태를 확인해주세요.`
            );
          default:
            throw new Error(
              `파일 업로드 실패 (${errorCode}): ${details || errorMessage}`
            );
        }
      } else {
        throw new Error(
          `파일 업로드 실패: HTTP ${response.status} - ${response.statusText}`
        );
      }
    }

    return await response.json();
  } catch (error) {
    // fetch 자체 오류 (네트워크 오류 등)
    if (error instanceof TypeError) {
      throw new Error(
        `네트워크 오류: NAVER SENS API에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.`
      );
    }
    // 이미 처리된 오류는 그대로 전달
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    if (!NAVER_SENS_SERVICE_ID || !NAVER_ACCESS_KEY_ID || !NAVER_SECRET_KEY) {
      const missingVars = [];
      if (!NAVER_SENS_SERVICE_ID) missingVars.push("NAVER_SENS_SERVICE_ID");
      if (!NAVER_ACCESS_KEY_ID) missingVars.push("NAVER_ACCESS_KEY_ID");
      if (!NAVER_SECRET_KEY) missingVars.push("NAVER_SECRET_KEY");

      return NextResponse.json(
        {
          error: "NAVER SENS API 설정이 누락되었습니다.",
          details: `누락된 환경 변수: ${missingVars.join(
            ", "
          )}. .env.local 파일을 확인하세요.`,
        },
        { status: 500 }
      );
    }

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 선택되지 않았습니다." },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (300KB 제한)
    const maxSize = 300 * 1024; // 300KB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 300KB 이하여야 합니다." },
        { status: 400 }
      );
    }

    // 파일 형식 검증 (네이버 SENS API는 JPG/JPEG만 지원)
    const allowedTypes = ["image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "JPG/JPEG 형식의 이미지 파일만 업로드 가능합니다.",
        },
        { status: 400 }
      );
    }

    // 파일명 확장자 검증 및 정리 (네이버 SENS API는 .jpg, .jpeg 확장자만 허용)
    const originalFileName = file.name.toLowerCase();
    if (
      !originalFileName.endsWith(".jpg") &&
      !originalFileName.endsWith(".jpeg")
    ) {
      return NextResponse.json(
        {
          error: "파일명은 .jpg 또는 .jpeg 확장자를 가져야 합니다.",
        },
        { status: 400 }
      );
    }

    // 파일명에서 공백 제거 및 정리
    const cleanFileName = file.name
      .replace(/\s+/g, "_") // 공백을 언더스코어로 변경
      .replace(/[^a-zA-Z0-9._-]/g, "") // 특수문자 제거
      .toLowerCase();

    // 해상도 검증을 위한 이미지 로드
    const arrayBuffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // 이미지 해상도 검증 (간단한 JPEG 헤더 파싱)
    try {
      const dimensions = await getImageDimensions(imageBuffer);
      if (dimensions.width > 1500 || dimensions.height > 1440) {
        return NextResponse.json(
          {
            error: `이미지 해상도가 너무 큽니다. 최대 1500×1440 픽셀까지 지원됩니다. (현재: ${dimensions.width}×${dimensions.height})`,
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.warn("이미지 해상도 검증 실패:", error);
      // 해상도 검증에 실패해도 업로드는 진행 (네이버 API에서 최종 검증)
    }

    console.log(`파일 업로드 시작: ${cleanFileName} (${file.size} bytes)`);

    // 파일 업로드 실행
    const result = await uploadFile(file, cleanFileName, imageBuffer);

    console.log("파일 업로드 성공:", result);

    return NextResponse.json({
      success: true,
      message: "파일이 성공적으로 업로드되었습니다.",
      fileId: result.fileId,
      fileName: file.name,
      fileSize: file.size,
      data: result,
    });
  } catch (error) {
    console.error("파일 업로드 오류:", error);

    return NextResponse.json(
      {
        error: "파일 업로드에 실패했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 }
    );
  }
}
