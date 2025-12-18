import { NextRequest, NextResponse } from 'next/server';
import { validateAuthWithSuccess } from '@/utils/authUtils';
import sharp from 'sharp';

// 네이버 이미지 업로드는 메인 API URL 사용 (템플릿 API URL 아님)
const MTS_API_URL = process.env.MTS_API_URL || 'https://api.mtsco.co.kr';

// 이미지 타입별 규격
const IMAGE_SPECS = {
  feed: { width: 598, height: 300 },    // BENEFIT 피드 이미지 (필수 규격)
  sample: { maxSize: 300 * 1024 },       // 샘플 이미지 (300KB 제한)
};

/**
 * POST /api/naver/image/upload
 * 네이버 톡톡 이미지 업로드
 *
 * Query Parameters:
 * - navertalkId: 네이버 톡톡 파트너 키 (필수)
 * - imageType: 이미지 타입 ('feed' | 'sample', 기본값: 'sample')
 *   - feed: BENEFIT 피드 이미지 (598x300으로 자동 리사이징)
 *   - sample: 일반 샘플 이미지 (300KB 이하로 최적화)
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
    // Query parameter에서 navertalkId와 imageType 가져오기
    const { searchParams } = new URL(request.url);
    const navertalkId = searchParams.get('navertalkId');
    const imageType = searchParams.get('imageType') || 'sample';

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

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF만 가능)' },
        { status: 400 }
      );
    }

    // 파일을 Buffer로 변환
    const arrayBuffer = await imageFile.arrayBuffer();
    // Uint8Array로 감싸 타입을 명확히 Buffer로 맞춘다.
    // sharp는 Node Buffer를 기대하므로 명시적으로 Buffer로 단언
    let imageBuffer: Buffer = Buffer.from(new Uint8Array(arrayBuffer));

    // 이미지 타입에 따른 처리
    if (imageType === 'feed') {
      // BENEFIT 피드 이미지: 598x300으로 정확히 리사이징
      imageBuffer = await sharp(imageBuffer)
        .resize(IMAGE_SPECS.feed.width, IMAGE_SPECS.feed.height, {
          fit: 'cover',      // 비율 유지하며 크롭
          position: 'center' // 중앙 기준으로 크롭
        })
        .jpeg({ quality: 85 }) // JPEG로 변환, 품질 85%
        .toBuffer();
    } else {
      // 샘플 이미지: 300KB 제한 확인 및 최적화
      if (imageBuffer.length > IMAGE_SPECS.sample.maxSize) {
        // 이미지 크기가 300KB를 초과하면 품질을 낮춰서 압축
        let quality = 80;
        let optimizedBuffer = imageBuffer;

        while (optimizedBuffer.length > IMAGE_SPECS.sample.maxSize && quality > 30) {
          optimizedBuffer = await sharp(imageBuffer)
            .jpeg({ quality })
            .toBuffer();

          if (optimizedBuffer.length <= IMAGE_SPECS.sample.maxSize) {
            break;
          }
          quality -= 10;
        }

        // 품질 압축으로도 안되면 리사이즈
        if (optimizedBuffer.length > IMAGE_SPECS.sample.maxSize) {
          const metadata = await sharp(imageBuffer).metadata();
          const scale = Math.sqrt(IMAGE_SPECS.sample.maxSize / optimizedBuffer.length);
          const newWidth = Math.floor((metadata.width || 800) * scale);
          const newHeight = Math.floor((metadata.height || 600) * scale);

          optimizedBuffer = await sharp(imageBuffer)
            .resize(newWidth, newHeight, { fit: 'inside' })
            .jpeg({ quality: 70 })
            .toBuffer();
        }

        imageBuffer = optimizedBuffer;
      }
    }

    // 최종 크기 검증
    const maxAllowedSize = imageType === 'feed' ? 500 * 1024 : IMAGE_SPECS.sample.maxSize;
    if (imageBuffer.length > maxAllowedSize) {
      return NextResponse.json(
        { error: `이미지 최적화 후에도 크기가 ${Math.round(maxAllowedSize / 1024)}KB를 초과합니다.` },
        { status: 400 }
      );
    }

    // 처리된 이미지로 File 객체 생성
    const uint8Array = new Uint8Array(imageBuffer);
    const processedBlob = new Blob([uint8Array], { type: 'image/jpeg' });
    const processedFile = new File([processedBlob], 'image.jpg', { type: 'image/jpeg' });

    // MTS API로 전달할 FormData 생성
    const mtsFormData = new FormData();
    mtsFormData.append('imageFile', processedFile);

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
      processedSize: imageBuffer.length,
      imageType,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: '이미지 업로드 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
