import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { b_no } = body;

    // 입력값 검증
    if (!b_no || !Array.isArray(b_no) || b_no.length === 0) {
      return NextResponse.json(
        { error: "사업자등록번호가 필요합니다." },
        { status: 400 }
      );
    }

    // 사업자등록번호 형식 검증
    const businessNumber = b_no[0];
    if (!/^\d{10}$/.test(businessNumber)) {
      return NextResponse.json(
        { error: "유효하지 않은 사업자등록번호 형식입니다." },
        { status: 400 }
      );
    }

    const serviceKey = process.env.ODCLOUD_SERVICE_KEY;

    if (!serviceKey) {
      console.error("ODCLOUD_SERVICE_KEY가 설정되지 않았습니다.");
      return NextResponse.json(
        { error: "서비스 설정 오류입니다. 관리자에게 문의하세요." },
        { status: 500 }
      );
    }

    // 공공데이터 포털 API 호출
    // 서비스 키는 URL 인코딩하여 전달 (특수문자 포함 가능)
    const apiUrl = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${encodeURIComponent(
      serviceKey
    )}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ b_no }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("공공데이터 포털 API 오류:", response.status, errorText);

      // API 응답에 따른 에러 처리 (매핑 개선)
      if (response.status === 400) {
        return NextResponse.json(
          { error: "잘못된 요청입니다." },
          { status: 400 }
        );
      } else if (response.status === 413) {
        return NextResponse.json(
          { error: "요청 데이터가 너무 큽니다." },
          { status: 413 }
        );
      } else if (response.status === 429) {
        return NextResponse.json(
          { error: "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요." },
          { status: 429 }
        );
      } else if (response.status === 401 || response.status === 403) {
        return NextResponse.json(
          { error: "외부 서비스 인증 오류입니다. 서비스 키를 확인해주세요." },
          { status: 502 }
        );
      } else if (response.status >= 500) {
        return NextResponse.json(
          { error: "외부 서비스 장애입니다. 잠시 후 다시 시도해주세요." },
          { status: 502 }
        );
      } else {
        return NextResponse.json(
          { error: "외부 서비스 오류입니다." },
          { status: 500 }
        );
      }
    }

    const data = await response.json();

    // API 응답 검증
    if (!data || typeof data.match_cnt === "undefined") {
      console.error("예상하지 못한 API 응답:", data);
      return NextResponse.json(
        { error: "서비스 응답 오류입니다." },
        { status: 500 }
      );
    }

    // 응답 데이터 구조 확장 (상세 정보 포함)
    if (data.match_cnt > 0 && data.data && data.data[0]) {
      const businessInfo = data.data[0];

      // 사업자 유형 추정 (과세 유형 기반)
      const estimatedType = businessInfo.tax_type?.includes("일반과세자")
        ? "법인"
        : businessInfo.tax_type?.includes("간이과세자")
        ? "개인"
        : null;

      // 현실적인 응답 (유효성 확인 + 제한된 정보)
      return NextResponse.json({
        ...data,
        businessDetails: {
          // 실제 제공되는 정보만
          taxType: businessInfo.tax_type || null,
          status: businessInfo.b_stt || null,
          statusCode: businessInfo.b_stt_cd || null,
          estimatedType: estimatedType, // 과세유형 기반 추정
          isActive: businessInfo.b_stt_cd === "01",
          // 제공되지 않는 정보는 null로 명시
          name: null,
          address: null,
          sector: null,
          openDate: null,
          apiLimitation:
            "국세청 API는 개인정보보호로 인해 상호명, 주소, 업태 정보를 제공하지 않습니다.",
        },
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("사업자등록번호 검증 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
