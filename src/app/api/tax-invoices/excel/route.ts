import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 서버 사이드에서는 서비스 역할 키 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: {
    schema: "public",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// 사용자용 세금계산서 엑셀 다운로드 API
export async function GET(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    let decodedToken: { userId: string; role: string };
    try {
      decodedToken = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        role: string;
      };
    } catch {
      return NextResponse.json(
        { error: "유효하지 않은 토큰입니다." },
        { status: 401 }
      );
    }

    const userId = decodedToken.userId;
    if (!userId) {
      return NextResponse.json(
        { error: "사용자 ID를 찾을 수 없습니다." },
        { status: 401 }
      );
    }

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 세금계산서 데이터 조회
    let query = supabase
      .from("tax_invoices")
      .select(
        `
        invoice_number,
        issue_date,
        business_number,
        company_name,
        supply_amount,
        tax_amount,
        total_amount,
        period_start,
        period_end,
        status,
        created_at
      `
      )
      .eq("user_id", userId)
      .order("issue_date", { ascending: false });

    // 날짜 필터링
    if (startDate && endDate) {
      query = query.gte("issue_date", startDate).lte("issue_date", endDate);
    } else if (startDate) {
      query = query.gte("issue_date", startDate);
    } else if (endDate) {
      query = query.lte("issue_date", endDate);
    }

    const { data: taxInvoices, error } = await query;

    if (error) {
      console.error("세금계산서 조회 오류:", error);
      return NextResponse.json(
        { error: "세금계산서를 조회하는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    if (!taxInvoices || taxInvoices.length === 0) {
      return NextResponse.json(
        { error: "다운로드할 세금계산서 데이터가 없습니다." },
        { status: 404 }
      );
    }

    // 엑셀 데이터 준비
    const excelData = taxInvoices.map((invoice, index) => ({
      순번: index + 1,
      "계산서 번호": invoice.invoice_number,
      발행일: invoice.issue_date,
      사업자등록번호: invoice.business_number?.replace(
        /(\d{3})(\d{2})(\d{5})/,
        "$1-$2-$3"
      ),
      업체명: invoice.company_name,
      공급가액: Number(invoice.supply_amount),
      세액: Number(invoice.tax_amount),
      "총 금액": Number(invoice.total_amount),
      "과세기간 시작": invoice.period_start,
      "과세기간 종료": invoice.period_end,
      상태: invoice.status === "issued" ? "발행" : "취소",
      등록일: new Date(invoice.created_at).toLocaleDateString("ko-KR"),
    }));

    // 엑셀 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    const colWidths = [
      { wch: 6 }, // 순번
      { wch: 15 }, // 계산서 번호
      { wch: 12 }, // 발행일
      { wch: 15 }, // 사업자등록번호
      { wch: 20 }, // 업체명
      { wch: 15 }, // 공급가액
      { wch: 15 }, // 세액
      { wch: 15 }, // 총 금액
      { wch: 12 }, // 과세기간 시작
      { wch: 12 }, // 과세기간 종료
      { wch: 8 }, // 상태
      { wch: 12 }, // 등록일
    ];
    worksheet["!cols"] = colWidths;

    // 헤더 스타일 설정
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1:L1");
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
        alignment: { horizontal: "center", vertical: "center" },
      };
    }

    // 숫자 컬럼 우측 정렬
    const numericColumns = [5, 6, 7]; // 공급가액, 세액, 총 금액
    const dataRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1:L1");

    for (let row = 1; row <= dataRange.e.r; row++) {
      for (const col of numericColumns) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,
            alignment: { horizontal: "right", vertical: "center" },
            numFmt: "#,##0",
          };
        }
      }
    }

    // 테두리 설정
    for (let row = 0; row <= dataRange.e.r; row++) {
      for (let col = 0; col <= dataRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = {
            ...worksheet[cellAddress].s,
            border: {
              top: { style: "thin", color: { rgb: "000000" } },
              bottom: { style: "thin", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } },
            },
          };
        }
      }
    }

    // 워크시트를 워크북에 추가
    XLSX.utils.book_append_sheet(workbook, worksheet, "세금계산서");

    // 엑셀 파일 생성
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // 파일명 생성
    const today = new Date().toISOString().split("T")[0];
    let filename = `세금계산서_발행내역_${today}.xlsx`;

    if (startDate && endDate) {
      filename = `세금계산서_발행내역_${startDate}_${endDate}.xlsx`;
    } else if (startDate) {
      filename = `세금계산서_발행내역_${startDate}_이후.xlsx`;
    } else if (endDate) {
      filename = `세금계산서_발행내역_${endDate}_이전.xlsx`;
    }

    // 응답 헤더 설정
    const headers = new Headers();
    headers.set(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );
    headers.set("Content-Length", buffer.length.toString());

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { error: "엑셀 파일을 생성하는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
