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
    const apiUrl = `https://api.odcloud.kr/api/nts-businessman/v1/status?serviceKey=${serviceKey}`;

    console.log("공공데이터 포털 API 호출:", businessNumber);

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

      // API 응답에 따른 에러 처리
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

    console.log("사업자등록번호 검증 결과:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("사업자등록번호 검증 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
