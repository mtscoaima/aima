import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Supabase 클라이언트 설정
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

// 관리자 권한 검증 함수
async function verifyAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (!decoded || !decoded.userId || decoded.role !== "ADMIN") {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error("토큰 검증 오류:", error);
    return null;
  }
}

// 사업자번호 정규화 함수
function normalizeBizNumber(bizNumber: string): string {
  return bizNumber.replace(/[-\s]/g, "");
}

// 날짜 포맷팅 함수
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ko-KR");
}

// 세금계산서 엑셀 다운로드 API
export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 검증
    const adminUser = await verifyAdminToken(request);
    if (!adminUser) {
      return NextResponse.json(
        {
          message: "관리자 권한이 필요합니다",
          error: "접근 권한이 없습니다.",
          status: 403,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices/export",
        },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const businessNumber = searchParams.get("businessNumber");
    const companyName = searchParams.get("companyName");
    const status = searchParams.get("status");

    // 필터 적용 함수
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = (query: any) => {
      if (startDate) {
        query = query.gte("issue_date", startDate);
      }

      if (endDate) {
        query = query.lte("issue_date", endDate);
      }

      if (businessNumber && businessNumber.trim()) {
        const normalizedBizNumber = normalizeBizNumber(businessNumber);
        query = query.ilike("business_number", `%${normalizedBizNumber}%`);
      }

      if (companyName && companyName.trim()) {
        query = query.ilike("company_name", `%${companyName.trim()}%`);
      }

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      return query;
    };

    // 세금계산서 데이터 조회 (필터 적용)
    let dataQuery = supabase
      .from("tax_invoices")
      .select(
        `
        id,
        issue_date,
        business_number,
        company_name,
        supply_amount,
        tax_amount,
        charge_amount,
        created_at,
        users!inner(
          id,
          name,
          email,
          tax_invoice_info
        )
      `
      )
      .order("issue_date", { ascending: false });

    dataQuery = applyFilters(dataQuery);

    const { data: taxInvoices, error } = await dataQuery;

    if (error) {
      console.error("세금계산서 조회 오류:", error);
      return NextResponse.json(
        {
          message: "세금계산서 조회 중 오류가 발생했습니다",
          error: error.message,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices/export",
        },
        { status: 500 }
      );
    }

    if (!taxInvoices || taxInvoices.length === 0) {
      return NextResponse.json(
        {
          message: "다운로드할 세금계산서 데이터가 없습니다",
          error: "No Data",
          status: 404,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices/export",
        },
        { status: 404 }
      );
    }

    // 엑셀 데이터 포맷팅
    const excelData = taxInvoices.map(
      (invoice: Record<string, unknown>, index: number) => {
        // 세금계산서 담당자 정보 추출
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const users = invoice.users as any;
        const taxInvoiceInfo = users?.tax_invoice_info || {};

        return {
          순번: index + 1,
          작성일: formatDate(invoice.issue_date as string),
          사업자등록번호: invoice.business_number,
          업체명: invoice.company_name,
          담당자명: taxInvoiceInfo?.manager || users?.name || "-",
          "담당자 이메일": taxInvoiceInfo?.email || users?.email || "-",
          "담당자 연락처": taxInvoiceInfo?.contact || "-",
          공급가액: invoice.supply_amount,
          세액: invoice.tax_amount,
          충전금액: invoice.charge_amount,

          등록일: formatDate(invoice.created_at as string),
        };
      }
    );

    // 워크북 생성
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // 컬럼 너비 설정
    const columnWidths = [
      { wch: 6 }, // 순번
      { wch: 12 }, // 작성일
      { wch: 17 }, // 사업자등록번호
      { wch: 20 }, // 업체명
      { wch: 15 }, // 담당자명
      { wch: 25 }, // 담당자 이메일
      { wch: 15 }, // 담당자 연락처
      { wch: 12 }, // 공급가액
      { wch: 10 }, // 세액
      { wch: 12 }, // 충전금액
      { wch: 12 }, // 등록일
    ];
    worksheet["!cols"] = columnWidths;

    // 헤더 스타일 설정
    const headerRange = XLSX.utils.decode_range(worksheet["!ref"] || "A1:K1");
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }

    // 데이터 셀 테두리 설정
    for (let row = 1; row <= excelData.length; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;

        worksheet[cellAddress].s = {
          border: {
            top: { style: "thin", color: { rgb: "E5E5E5" } },
            bottom: { style: "thin", color: { rgb: "E5E5E5" } },
            left: { style: "thin", color: { rgb: "E5E5E5" } },
            right: { style: "thin", color: { rgb: "E5E5E5" } },
          },
        };

        // 숫자 필드에 대한 정렬 설정
        const colIndex = col - headerRange.s.c;
        if ([7, 8, 9].includes(colIndex)) {
          // 공급가액, 세액, 충전금액
          worksheet[cellAddress].s.alignment = { horizontal: "right" };
        }
      }
    }

    // 워크시트를 워크북에 추가
    const sheetName = `세금계산서_${getKSTISOString().split("T")[0]}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 엑셀 파일 생성
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    // 파일명 생성
    const currentDate = new Date().toISOString().split("T")[0];
    let fileName = `세금계산서_목록_${currentDate}`;

    // 필터 조건이 있는 경우 파일명에 추가
    const filterConditions = [];
    if (startDate && endDate) {
      filterConditions.push(`${startDate}_${endDate}`);
    } else if (startDate) {
      filterConditions.push(`${startDate}이후`);
    } else if (endDate) {
      filterConditions.push(`${endDate}이전`);
    }

    if (status && status !== "all") {
      filterConditions.push(status === "issued" ? "발행" : "취소");
    }

    if (companyName) {
      filterConditions.push(companyName);
    }

    if (filterConditions.length > 0) {
      fileName += `_${filterConditions.join("_")}`;
    }

    fileName += ".xlsx";

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
    console.error("엑셀 다운로드 오류:", error);
    return NextResponse.json(
      {
        message: "엑셀 다운로드 중 오류가 발생했습니다",
        error: error instanceof Error ? error.message : "Internal Server Error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/admin/tax-invoices/export",
      },
      { status: 500 }
    );
  }
}
