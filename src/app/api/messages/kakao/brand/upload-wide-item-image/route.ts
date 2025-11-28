import { NextRequest, NextResponse } from "next/server";
import { validateAuthWithSuccess } from "@/utils/authUtils";

const MTS_TEMPLATE_API_URL = process.env.MTS_TEMPLATE_API_URL;
// MTS_AUTH_CODE는 향후 이미지 업로드 인증에 사용될 수 있음
// const MTS_AUTH_CODE = process.env.MTS_AUTH_CODE;

/**
 * POST /api/messages/kakao/brand/upload-wide-item-image
 * WIDE_ITEM_LIST 전용 이미지 업로드
 * - isFirst=true: 첫 번째 아이템 (2:1 비율)
 * - isFirst=false: 2~4번째 아이템 (1:1 비율)
 */
export async function POST(request: NextRequest) {
  try {
    // JWT 인증 확인
    const authResult = validateAuthWithSuccess(request);
    if (!authResult.isValid || !authResult.userInfo) {
      return authResult.errorResponse;
    }

    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const isFirst = formData.get("isFirst") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "이미지 파일이 필요합니다." },
        { status: 400 },
      );
    }

    // MTS API 호출
    const mtsFormData = new FormData();

    if (isFirst) {
      // 첫 번째 아이템: /wideItemList/first
      // 문서 명세: image 필드만 전송 (authCode 불필요)
      mtsFormData.append("image", file);

      const response = await fetch(
        `${MTS_TEMPLATE_API_URL}/mts/api/direct/image/wideItemList/first`,
        {
          method: "POST",
          body: mtsFormData,
        },
      );

      // HTML 응답 체크
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const htmlText = await response.text();
        console.error(
          "WIDE_ITEM_LIST 이미지 업로드 시 HTML 응답 수신:",
          htmlText.substring(0, 500),
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "WIDE_ITEM_LIST 이미지 업로드 API가 올바르지 않습니다. MTS에서 브랜드 메시지 권한을 확인해주세요.",
          },
          { status: 400 },
        );
      }

      const result = await response.json();

      // 성공 코드: '0000' 또는 '200'
      if ((result.code === "0000" || result.code === "200") && result.image) {
        return NextResponse.json({
          success: true,
          url: result.image,
          fileId: result.image,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: result.message || "첫 번째 아이템 이미지 업로드 실패",
          errorCode: result.code,
        },
        { status: 400 },
      );
    } else {
      // 2~4번째 아이템: /wideItemList (image_1)
      mtsFormData.append("image_1", file);

      const response = await fetch(
        `${MTS_TEMPLATE_API_URL}/mts/api/direct/image/wideItemList`,
        {
          method: "POST",
          body: mtsFormData,
        },
      );

      // HTML 응답 체크
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
        const htmlText = await response.text();
        console.error(
          "WIDE_ITEM_LIST 이미지 업로드 시 HTML 응답 수신 (두 번째):",
          htmlText.substring(0, 500),
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "WIDE_ITEM_LIST 이미지 업로드 API가 올바르지 않습니다. MTS에서 브랜드 메시지 권한을 확인해주세요.",
          },
          { status: 400 },
        );
      }

      const result = await response.json();

      // 성공 코드: '0000' (전체 성공), '6000' (부분 성공)
      if (
        ["0000", "6000"].includes(result.code) &&
        result.result?.success?.length > 0
      ) {
        // MTS API 문서 명세대로 result.success 배열에서 url 필드 추출
        const firstSuccess = result.result.success[0];
        const imageUrl = firstSuccess.url;

        if (imageUrl) {

          // 부분 성공인 경우 실패 항목 로깅
          if (result.code === "6000" && result.result.failure?.length > 0) {
            
          }

          return NextResponse.json({
            success: true,
            url: imageUrl,
            fileId: imageUrl,
          });
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: result.message || "서브 아이템 이미지 업로드 실패",
          errorCode: result.code,
          debug: result,
        },
        { status: 400 },
      );
    }
  } catch (error) {

    return NextResponse.json(
      {
        error: "이미지 업로드 중 오류가 발생했습니다.",
        details: error instanceof Error ? error.message : "알 수 없는 오류",
      },
      { status: 500 },
    );
  }
}
