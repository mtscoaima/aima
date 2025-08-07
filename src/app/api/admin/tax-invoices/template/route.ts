import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import jwt from "jsonwebtoken";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 관리자 권한 검증 함수
async function verifyAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || !decoded.userId || decoded.role !== "ADMIN") {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("토큰 검증 오류:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json(
        {
          message: "관리자 권한이 필요합니다",
          error: "Unauthorized",
          status: 403,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices/template",
        },
        { status: 403 }
      );
    }

    // 엑셀 템플릿 데이터 생성
    const templateData = [
      {
        "계산서 번호": "2024-001",
        발행일: "2024-01-15",
        사업자번호: "123-45-67890",
        업체명: "주식회사 샘플",
        공급가액: 100000,
        세액: 10000,
        "총 금액": 110000,
      },
      {
        "계산서 번호": "2024-002",
        발행일: "2024-01-16",
        사업자번호: "987-65-43210",
        업체명: "테스트 기업",
        공급가액: 200000,
        세액: 20000,
        "총 금액": 220000,
      },
    ];

    // 워크북 생성
    const workbook = XLSX.utils.book_new();

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 15 }, // 계산서 번호
      { wch: 12 }, // 발행일
      { wch: 15 }, // 사업자번호
      { wch: 20 }, // 업체명
      { wch: 12 }, // 공급가액
      { wch: 10 }, // 세액
      { wch: 12 }, // 총 금액
    ];
    worksheet["!cols"] = columnWidths;

    // 헤더 스타일 설정
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1:G1");
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "CCCCCC" } },
        alignment: { horizontal: "center" },
        border: {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        },
      };
    }

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, "세금계산서_템플릿");

    // 엑셀 파일을 버퍼로 변환
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // 파일명 생성 (현재 날짜 포함)
    const currentDate = new Date().toISOString().split("T")[0];
    const fileName = `세금계산서_업로드_템플릿_${currentDate}.xlsx`;

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    headers.set("Content-Length", excelBuffer.length.toString());

    return new NextResponse(excelBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("엑셀 템플릿 생성 오류:", error);
    return NextResponse.json(
      {
        message: "템플릿 생성 중 오류가 발생했습니다",
        error: error instanceof Error ? error.message : "Internal Server Error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/admin/tax-invoices/template",
      },
      { status: 500 }
    );
  }
}
