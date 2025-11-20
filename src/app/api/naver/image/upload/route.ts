import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';

// 네이버 이미지 업로드는 메인 API URL 사용 (템플릿 API URL 아님)
const MTS_API_URL = process.env.MTS_API_URL || 'https://api.mtsco.co.kr';

/**
 * POST /api/naver/image/upload
 * 네이버 톡톡 이미지 업로드
 *
 * Query Parameters:
 * - navertalkId: 네이버 톡톡 파트너 키 (필수)
 *
 * Request Body:
 * - FormData with 'image' field
 *
 * Response:
 * {
 *   success: true,
 *   imageHashId: string
 * }
 */
export async function POST(request: NextRequest) {
  // JWT 인증 확인
  const authResult = validateAuthWithSuccess(request);
  if (!authResult.isValid || !authResult.userInfo) {
    return authResult.errorResponse || NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    // Query parameter에서 navertalkId 가져오기
    const { searchParams } = new URL(request.url);
    const navertalkId = searchParams.get('navertalkId');

    if (!navertalkId) {
      return NextResponse.json(
        { error: 'navertalkId(파트너키)가 필요합니다.' },
        { status: 400 }
      );
    }

    // FormData 파싱
    const formData = await request.formData();
    const imageFile = formData.get('image');

    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (300KB = 300 * 1024 bytes)
    const MAX_FILE_SIZE = 300 * 1024;
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '이미지 파일 크기는 300KB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF만 가능)' },
        { status: 400 }
      );
    }

    // MTS API로 전달할 FormData 생성
    const mtsFormData = new FormData();
    mtsFormData.append('imageFile', imageFile);

    // MTS API 호출
    const mtsResponse = await fetch(
      `${MTS_API_URL}/naver/v1/${navertalkId}/image/upload`,
      {
        method: 'POST',
        body: mtsFormData,
        // Content-Type은 FormData 사용 시 자동 설정됨
      }
    );

    const result = await mtsResponse.json();

    // MTS API 응답 처리
    if (!mtsResponse.ok || !result.success) {
      return NextResponse.json(
        {
          error: result.resultMessage || '이미지 업로드 실패',
          details: result,
        },
        { status: mtsResponse.status || 500 }
      );
    }

    // 성공 응답
    return NextResponse.json({
      success: true,
      imageHashId: result.imageHashId,
    });
  } catch (error) {
    console.error('네이버 이미지 업로드 API 오류:', error);
    return NextResponse.json(
      {
        error: '이미지 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
