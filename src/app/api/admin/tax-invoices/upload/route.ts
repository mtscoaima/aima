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

// 업로드 결과 인터페이스
interface UploadResult {
  success: number;
  failed: number;
  errors: string[];
  details: {
    processed: number;
    duplicates: number;
    userNotFound: number;
    validationErrors: number;
  };
}

// 세금계산서 데이터 인터페이스
interface TaxInvoiceData {
  issueDate: string;
  businessNumber: string;
  companyName: string;
  supplyAmount: number;
  taxAmount: number;
  chargeAmount: number;
}

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

// 날짜 유효성 검사 및 변환
function validateAndFormatDate(dateStr: string): string | null {
  if (!dateStr) return null;

  // 다양한 날짜 형식 지원
  const dateFormats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{4}\.\d{2}\.\d{2}$/, // YYYY.MM.DD
  ];

  const dateString = dateStr.toString().trim();

  // Excel 날짜 숫자인 경우 (1900년 1월 1일부터의 일수)
  if (/^\d+(\.\d+)?$/.test(dateString)) {
    try {
      // Excel 날짜를 JavaScript 날짜로 변환
      const excelDate = parseFloat(dateString);
      const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
      return jsDate.toISOString().split("T")[0];
    } catch {
      return null;
    }
  }

  // 문자열 날짜 형식 검증
  if (!dateFormats.some((format) => format.test(dateString))) {
    return null;
  }

  try {
    const normalizedDate = dateString.replace(/[\/\.]/g, "-");
    const date = new Date(normalizedDate);

    if (isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

// 숫자 유효성 검사 및 변환
function validateAndFormatNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  // 문자열인 경우 콤마 제거
  const numStr = value.toString().replace(/,/g, "");

  const num = parseFloat(numStr);

  if (isNaN(num) || num < 0) {
    return null;
  }

  return Math.round(num); // 정수로 반올림
}

// 사업자등록번호 정규화 (하이픈 제거)
function normalizeBizNumber(bizNumber: string): string {
  return bizNumber.replace(/[-\s]/g, "");
}

// 세금계산서 데이터 검증
function validateTaxInvoiceData(
  row: Record<string, unknown>,
  rowIndex: number
): { isValid: boolean; data?: TaxInvoiceData; errors: string[] } {
  const errors: string[] = [];
  const rowNum = rowIndex + 2; // 헤더 제외하고 1부터 시작

  // 계산서 번호는 더 이상 필요하지 않음 (DB에서 제거됨)

  const issueDate = validateAndFormatDate(row["작성일"] as string);
  if (!issueDate) {
    errors.push(
      `${rowNum}행: 작성일이 올바르지 않습니다 (YYYY-MM-DD 형식 필요)`
    );
  }

  const businessNumber = row["사업자등록번호"]?.toString().trim();
  if (!businessNumber) {
    errors.push(`${rowNum}행: 사업자등록번호가 누락되었습니다`);
  } else {
    const normalizedBizNum = normalizeBizNumber(businessNumber);
    if (!/^\d{10}$/.test(normalizedBizNum)) {
      errors.push(
        `${rowNum}행: 사업자등록번호 형식이 올바르지 않습니다 (10자리 숫자)`
      );
    }
  }

  const companyName = row["업체명"]?.toString().trim();
  if (!companyName) {
    errors.push(`${rowNum}행: 업체명이 누락되었습니다`);
  }

  const supplyAmount = validateAndFormatNumber(row["공급가액"]);
  if (supplyAmount === null) {
    errors.push(`${rowNum}행: 공급가액이 올바르지 않습니다 (숫자 필요)`);
  }

  const taxAmount = validateAndFormatNumber(row["세액"]);
  if (taxAmount === null) {
    errors.push(`${rowNum}행: 세액이 올바르지 않습니다 (숫자 필요)`);
  }

  const chargeAmount = validateAndFormatNumber(row["충전금액"]);
  if (chargeAmount === null) {
    errors.push(`${rowNum}행: 충전금액이 올바르지 않습니다 (숫자 필요)`);
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const data: TaxInvoiceData = {
    issueDate: issueDate!,
    businessNumber: normalizeBizNumber(businessNumber!),
    companyName: companyName!,
    supplyAmount: supplyAmount!,
    taxAmount: taxAmount!,
    chargeAmount: chargeAmount!,
  };

  return { isValid: true, data, errors: [] };
}

export async function POST(request: NextRequest) {
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
          path: "/api/admin/tax-invoices/upload",
        },
        { status: 403 }
      );
    }

    // FormData에서 파일 추출
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        {
          message: "파일이 업로드되지 않았습니다",
          error: "No file uploaded",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices/upload",
        },
        { status: 400 }
      );
    }

    // 파일 형식 검증
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
      "application/vnd.ms-excel", // .xls
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message:
            "지원하지 않는 파일 형식입니다. Excel 파일(.xlsx, .xls)만 업로드 가능합니다",
          error: "Invalid file type",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices/upload",
        },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          message: "파일 크기가 너무 큽니다. 최대 10MB까지 업로드 가능합니다",
          error: "File too large",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices/upload",
        },
        { status: 400 }
      );
    }

    // 파일을 ArrayBuffer로 읽기
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // 첫 번째 시트 가져오기
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        {
          message: "엑셀 파일에 시트가 없습니다",
          error: "No worksheet found",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices/upload",
        },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return NextResponse.json(
        {
          message: "엑셀 파일에 데이터가 없습니다",
          error: "No data found",
          status: 400,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices/upload",
        },
        { status: 400 }
      );
    }

    // 업로드 결과 초기화
    const result: UploadResult = {
      success: 0,
      failed: 0,
      errors: [],
      details: {
        processed: 0,
        duplicates: 0,
        userNotFound: 0,
        validationErrors: 0,
      },
    };

    // 유효한 데이터 저장용 배열
    const validDataList: Array<TaxInvoiceData & { userId: number }> = [];

    // 각 행 처리
    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      result.details.processed++;

      // 데이터 검증
      const validation = validateTaxInvoiceData(row, i);
      if (!validation.isValid) {
        result.failed++;
        result.details.validationErrors++;
        result.errors.push(...validation.errors);
        continue;
      }

      const validData = validation.data!;

      // 중복 체크 로직 제거 (invoice_number 컬럼이 제거되어 더 이상 필요 없음)

      // 사업자등록번호로 사용자 찾기
      const { data: users, error: userError } = await supabase
        .from("users")
        .select("id, company_info")
        .eq("role", "USER");

      if (userError) {
        console.error("사용자 조회 오류:", userError);
        result.failed++;
        result.errors.push(`${i + 2}행: 사용자 조회 중 오류가 발생했습니다`);
        continue;
      }

      // company_info에서 businessNumber 매칭
      const matchingUser = users?.find((user) => {
        const companyInfo = user.company_info as { businessNumber?: string };
        if (!companyInfo || !companyInfo.businessNumber) return false;

        const userBizNum = normalizeBizNumber(companyInfo.businessNumber);
        return userBizNum === validData.businessNumber;
      });

      if (!matchingUser) {
        result.failed++;
        result.details.userNotFound++;
        result.errors.push(
          `${i + 2}행: 사업자등록번호 '${
            validData.businessNumber
          }'에 해당하는 사용자를 찾을 수 없습니다`
        );
        continue;
      }

      // 유효한 데이터 목록에 추가
      validDataList.push({
        ...validData,
        userId: matchingUser.id,
      });
    }

    // 유효한 데이터 일괄 삽입
    if (validDataList.length > 0) {
      const insertData = validDataList.map((item) => ({
        user_id: item.userId,
        issue_date: item.issueDate,
        business_number: item.businessNumber,
        company_name: item.companyName,
        supply_amount: item.supplyAmount,
        tax_amount: item.taxAmount,
        charge_amount: item.chargeAmount,
        status: "issued",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from("tax_invoices")
        .insert(insertData);

      if (insertError) {
        console.error("데이터 삽입 오류:", insertError);
        return NextResponse.json(
          {
            message: "데이터베이스 삽입 중 오류가 발생했습니다",
            error: insertError.message,
            status: 500,
            timestamp: getKSTISOString(),
            path: "/api/admin/tax-invoices/upload",
          },
          { status: 500 }
        );
      }

      result.success = validDataList.length;
    }

    // 결과 반환
    return NextResponse.json(
      {
        message: "업로드가 완료되었습니다",
        data: result,
        timestamp: getKSTISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("엑셀 업로드 처리 오류:", error);
    return NextResponse.json(
      {
        message: "업로드 처리 중 오류가 발생했습니다",
        error: error instanceof Error ? error.message : "Internal Server Error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/admin/tax-invoices/upload",
      },
      { status: 500 }
    );
  }
}
