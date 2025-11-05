export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import sharp from "sharp";

const MTS_TEMPLATE_API_URL = process.env.MTS_TEMPLATE_API_URL || "https://talks.mtsco.co.kr";

interface JWTPayload {
  userId: number;
  email: string;
}

/**
 * 카카오 친구톡/알림톡용 이미지 업로드 API
 *
 * MTS Kakao 이미지 서버에 업로드하여 Kakao 서버 URL 반환
 * - MMS용 업로드 (/api/messages/upload-image)와 구분됨
 * - Kakao 서비스는 반드시 Kakao 서버 이미지 필요 (https://mud-kage.kakao.com/...)
 *
 * 참고: docs/연동규격서md/비즈API/카카오 이미지 업로드 API 20210629.md
 */
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
      console.error('[kakao/upload-image] JWT_SECRET 환경 변수가 설정되지 않았습니다');
      return NextResponse.json({
        error: "서버 설정 오류: JWT_SECRET이 설정되지 않았습니다"
      }, { status: 500 });
    }

    try {
      jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      console.error('JWT 검증 실패:', jwtError);
      return NextResponse.json({ error: "유효하지 않은 토큰입니다" }, { status: 401 });
    }

    // FormData에서 파일과 senderKey 추출
    const form = await req.formData();
    const f = form.get("file") as unknown as File | null;
    const senderKey = form.get("senderKey") as string | null;

    if (!f) {
      return NextResponse.json({ success: false, error: "file required" }, { status: 400 });
    }

    if (!senderKey) {
      return NextResponse.json({ success: false, error: "senderKey required" }, { status: 400 });
    }

    // 파일 형식 검증
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(f.type)) {
      return NextResponse.json({
        error: "JPG, JPEG, PNG 형식만 지원됩니다",
        receivedType: f.type
      }, { status: 400 });
    }

    // 파일 버퍼 생성 및 변환
    let buf = Buffer.from(await f.arrayBuffer());

    // Kakao 친구톡/알림톡 이미지 규격
    // - 가로 500px 이상
    // - 가로:세로 비율 2:1 권장
    // - 파일 형식: JPG, PNG
    // - 최대 크기: 500KB
    try {
      const metadata = await sharp(buf).metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;

      // 최소 가로 500px 확인
      let resizeWidth = width;

      if (width < 500) {
        // 가로가 500px 미만이면 500px로 확대
        resizeWidth = 500;
      }

      // 2:1 비율로 조정 (가로:세로)
      const targetHeight = Math.round(resizeWidth / 2);

      const converted = await sharp(buf)
        .resize(resizeWidth, targetHeight, {
          fit: "cover",
          position: "centre"
        })
        .jpeg({ quality: 85 })
        .toBuffer();

      buf = Buffer.from(converted);

      console.log('[Kakao 이미지 최적화 완료]');
      console.log(`원본: ${width}x${height}px`);
      console.log(`변환: ${resizeWidth}x${targetHeight}px (2:1 비율)`);
      console.log(`크기: ${buf.length} bytes (${Math.round(buf.length / 1024)}KB)`);
    } catch (err) {
      console.error('이미지 변환 실패:', err);
      return NextResponse.json({ error: "이미지 변환 실패" }, { status: 500 });
    }

    // 파일 크기 검증 (500KB 제한)
    const maxSize = 500 * 1024;
    if (buf.length > maxSize) {
      return NextResponse.json({
        error: "이미지 크기는 500KB 이하여야 합니다",
        currentSize: buf.length,
        maxSize
      }, { status: 400 });
    }

    // MTS Kakao 이미지 업로드 API 호출
    // 엔드포인트: https://talks.mtsco.co.kr/mts/api/image/alimtalk/template
    const formData = new FormData();
    formData.append('senderKey', senderKey);

    const blob = new Blob([buf], { type: 'image/jpeg' });
    formData.append('image', blob, 'image.jpg');

    console.log('========================================');
    console.log('[Kakao 이미지 업로드 API 호출]');
    console.log('시간:', new Date().toISOString());
    console.log('엔드포인트:', `${MTS_TEMPLATE_API_URL}/mts/api/image/alimtalk/template`);
    console.log('senderKey:', senderKey);
    console.log('파일 크기:', buf.length, 'bytes');

    const res = await fetch(`${MTS_TEMPLATE_API_URL}/mts/api/image/alimtalk/template`, {
      method: 'POST',
      body: formData,
    });

    const responseText = await res.text();

    console.log('MTS API 응답 상태:', res.status);
    console.log('MTS API 응답 본문:', responseText);
    console.log('========================================');

    if (!res.ok) {
      console.error('MTS Kakao 이미지 업로드 실패:', res.status, responseText);
      return NextResponse.json(
        {
          success: false,
          error: `MTS Kakao 이미지 업로드 실패: HTTP ${res.status} - ${responseText}`,
        },
        { status: 502 }
      );
    }

    const data = JSON.parse(responseText);

    console.log('========================================');
    console.log('[MTS Kakao 이미지 업로드 API 전체 응답]');
    console.log(JSON.stringify(data, null, 2));
    console.log('========================================');

    // MTS API 응답 검증
    if (data.code !== '0000') {
      console.error('MTS API 오류 코드:', data.code, data.message);
      return NextResponse.json(
        {
          success: false,
          error: `MTS Kakao 이미지 업로드 오류: ${data.message || data.code}`,
          code: data.code,
        },
        { status: 400 }
      );
    }

    // image 필드 확인 (Kakao 서버 URL)
    const imageUrl = data.image;
    if (!imageUrl) {
      console.error('MTS API 응답에 image 필드가 없습니다!');
      console.error('전체 응답:', JSON.stringify(data, null, 2));
      return NextResponse.json({
        success: false,
        error: 'MTS API 응답에 image 필드가 없습니다',
        responseData: data
      }, { status: 500 });
    }

    console.log('MTS Kakao 이미지 업로드 성공!');
    console.log('Kakao 이미지 URL:', imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl, // Kakao 서버 URL (https://mud-kage.kakao.com/...)
      fileSize: buf.length,
      code: data.code,
      message: data.message
    });

  } catch (e) {
    console.error('========================================');
    console.error('[kakao/upload-image] 전체 에러 발생:');
    console.error('에러 타입:', typeof e);
    console.error('에러 객체:', e);
    console.error('에러 스택:', e instanceof Error ? e.stack : 'N/A');
    console.error('========================================');
    const error = e as Error;
    return NextResponse.json({
      success: false,
      error: error?.message || String(e)
    }, { status: 500 });
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
