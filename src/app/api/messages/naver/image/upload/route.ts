/**
 * 네이버 톡톡 이미지 업로드 API
 *
 * POST /api/messages/naver/image/upload
 * - 네이버 톡톡 이미지 업로드 및 해시 ID 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadNaverImage } from '@/lib/mtsApi';
import { validateAuthWithSuccess } from '@/utils/authUtils';

/**
 * POST /api/messages/naver/image/upload
 * 네이버 톡톡 이미지 업로드
 */
export async function POST(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuthWithSuccess(request);
  if (!authResult.isValid || !authResult.userInfo) {
    return authResult.errorResponse;
  }

  try {
    // FormData 파싱
    const formData = await request.formData();
    const partnerKey = formData.get('partnerKey') as string;
    const imageFile = formData.get('image') as File;

    // 필수 파라미터 확인
    if (!partnerKey) {
      return NextResponse.json(
        { error: 'partnerKey가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: '이미지 파일은 JPG 또는 PNG 형식이어야 합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (300KB)
    if (imageFile.size > 307200) {
      return NextResponse.json(
        { error: '이미지 파일 크기는 300KB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // MTS API 호출
    const result = await uploadNaverImage(partnerKey, imageFile);

    if (result.success && result.imageHashId) {
      return NextResponse.json({
        success: true,
        message: '이미지가 성공적으로 업로드되었습니다.',
        imageHashId: result.imageHashId,
      });
    }

    return NextResponse.json(
      {
        error: result.error || '이미지 업로드 실패',
        errorCode: result.errorCode,
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('네이버 톡톡 이미지 업로드 오류:', error);
    return NextResponse.json(
      {
        error: '이미지 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}
