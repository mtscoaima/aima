export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface JWTPayload {
  userId: number;
  email: string;
}

/**
 * 카카오 브랜드 메시지 비디오 업로드 API
 *
 * Supabase Storage에 업로드하여 공개 URL 반환
 * - Bucket: kakao-videos
 * - 최대 크기: 200MB
 * - 지원 형식: mp4, quicktime, avi, webm
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

    if (!jwtSecret || jwtSecret.trim() === '') {
      console.error('[kakao/upload-video] JWT_SECRET 환경 변수가 설정되지 않았습니다');
      return NextResponse.json({
        error: "서버 설정 오류: JWT_SECRET이 설정되지 않았습니다"
      }, { status: 500 });
    }

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      console.error('JWT 검증 실패:', jwtError);
      return NextResponse.json({ error: "유효하지 않은 토큰입니다" }, { status: 401 });
    }

    // FormData에서 파일 추출
    const form = await req.formData();
    const file = form.get("file") as unknown as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "file required" }, { status: 400 });
    }

    // 파일 형식 검증
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "MP4, MOV, AVI, WEBM 형식만 지원됩니다",
        receivedType: file.type
      }, { status: 400 });
    }

    // 파일 크기 검증 (200MB)
    const maxSize = 200 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({
        error: "비디오 크기는 200MB 이하여야 합니다",
        currentSize: file.size,
        maxSize
      }, { status: 400 });
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 파일명 생성 (userId/timestamp_filename)
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'mp4';
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${decoded.userId}/${timestamp}_${safeFileName}`;

    // 파일 업로드
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('kakao-videos')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Storage 업로드 실패:', uploadError);
      return NextResponse.json({
        success: false,
        error: `비디오 업로드 실패: ${uploadError.message}`,
      }, { status: 500 });
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('kakao-videos')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      return NextResponse.json({
        success: false,
        error: '공개 URL 생성 실패',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileId: uploadData.path,
      filePath: uploadData.path,
      fileSize: file.size,
      fileName: safeFileName,
      fileType: file.type,
      extension: ext,
    });

  } catch (e) {
    console.error('========================================');
    console.error('[kakao/upload-video] 전체 에러 발생:');
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
