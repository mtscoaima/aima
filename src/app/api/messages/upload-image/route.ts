export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import sharp from "sharp";

const MTS_API_URL = process.env.MTS_API_URL || "https://api.mtsco.co.kr";

interface JWTPayload {
  userId: number;
  email: string;
}

export async function POST(req: NextRequest) {
  try {
    // JWT 인증
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    const jwtSecret = process.env.JWT_SECRET;

    // JWT_SECRET 환경 변수 확인
    if (!jwtSecret || jwtSecret.trim() === '') {
      console.error('[upload-image] JWT_SECRET 환경 변수가 설정되지 않았습니다');
      console.error('process.env.JWT_SECRET 값:', process.env.JWT_SECRET);
      return NextResponse.json({
        error: "서버 설정 오류: JWT_SECRET이 설정되지 않았습니다"
      }, { status: 500 });
    }

    try {
      jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      console.error('JWT 검증 실패:', jwtError);
      console.error('에러 메시지:', jwtError instanceof Error ? jwtError.message : String(jwtError));
      return NextResponse.json({ error: "유효하지 않은 토큰입니다" }, { status: 401 });
    }

    // FormData에서 파일 추출
    const form = await req.formData();
    const f = form.get("file") as unknown as File | null;

    if (!f) {
      return NextResponse.json({ success: false, error: "file required" }, { status: 400 });
    }

    // 파일 형식 검증
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(f.type)) {
      return NextResponse.json({ error: "JPG, JPEG, PNG 형식만 지원됩니다", receivedType: f.type }, { status: 400 });
    }

    // 파일 버퍼 생성 및 변환
    let buf = Buffer.from(await f.arrayBuffer());

    // PNG → JPEG 변환 또는 리사이즈
    // MTS API 권장: 640x480 이하, 300KB 이하, JPG 포맷
    try {
      const converted = await sharp(buf)
        .resize(640, 480, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      buf = Buffer.from(converted);
    } catch {
      return NextResponse.json({ error: "이미지 변환 실패" }, { status: 500 });
    }

    // 파일 크기 검증 (300KB 제한)
    const maxSize = 300 * 1024;
    if (buf.length > maxSize) {
      return NextResponse.json({
        error: "이미지 크기는 300KB 이하여야 합니다",
        currentSize: buf.length,
        maxSize
      }, { status: 400 });
    }


    // MTS API에 multipart/form-data로 업로드
    const formData = new FormData();
    const blob = new Blob([buf], { type: 'image/jpeg' });
    formData.append('images', blob, 'image.jpg');

    const res = await fetch(`${MTS_API_URL}/img/upload_image`, {
      method: 'POST',
      body: formData,
    });

    const responseText = await res.text();

    if (!res.ok) {
      console.error('MTS API 업로드 실패:', res.status, responseText);
      return NextResponse.json(
        {
          success: false,
          error: `MTS 이미지 업로드 실패: HTTP ${res.status} - ${responseText}`,
        },
        { status: 502 }
      );
    }

    const data = JSON.parse(responseText);

    console.log('========================================');
    console.log('[MTS 이미지 업로드 API 전체 응답]');
    console.log(JSON.stringify(data, null, 2));
    console.log('========================================');
    console.log('MTS API 파싱된 응답:');
    console.log('- code:', data.code);
    console.log('- message:', data.message);
    console.log('- image:', data.image);
    console.log('- images:', data.images);

    // MTS API 응답 검증
    if (data.code !== '0000') {
      console.error('MTS API 오류 코드:', data.code, data.message);
      return NextResponse.json(
        {
          success: false,
          error: `MTS 이미지 업로드 오류: ${data.message || data.code}`,
          code: data.code,
        },
        { status: 400 }
      );
    }

    // image 또는 images 필드가 없으면 에러
    const imageField = data.image || data.images;
    if (!imageField) {
      console.error('MTS API 응답에 image/images 필드가 없습니다!');
      console.error('전체 응답:', JSON.stringify(data, null, 2));
      return NextResponse.json({
        success: false,
        error: 'MTS API 응답에 image/images 필드가 없습니다',
        responseData: data
      }, { status: 500 });
    }

    console.log('MTS API 업로드 성공!');
    console.log('이미지 필드 (상대 경로):', imageField);

    // MTS API는 상대 경로를 반환
    // MMS와 친구톡 모두 상대 경로를 그대로 사용 (MTS가 내부적으로 처리)
    console.log('반환할 이미지 경로:', imageField);

    return NextResponse.json({
      success: true,
      imageUrl: imageField, // 상대 경로 그대로 반환
      fileSize: buf.length,
      code: data.code,
      message: data.message
    });

  } catch (e) {
    console.error('========================================');
    console.error('[upload-image] 전체 에러 발생:');
    console.error('에러 타입:', typeof e);
    console.error('에러 객체:', e);
    console.error('에러 스택:', e instanceof Error ? e.stack : 'N/A');
    console.error('========================================');
    const error = e as Error;
    return NextResponse.json({ success: false, error: error?.message || String(e) }, { status: 500 });
  }
}

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
