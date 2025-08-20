import { NextRequest, NextResponse } from "next/server";
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

// 세금계산서 상세 조회 API
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
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
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 403 }
      );
    }

    const invoiceId = parseInt(resolvedParams.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        {
          message: "올바르지 않은 세금계산서 ID입니다",
          error: "Invalid ID",
          status: 400,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 400 }
      );
    }

    // 세금계산서 상세 조회 (사용자 정보 포함)
    const { data: taxInvoice, error } = await supabase
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
        status,
        created_at,
        updated_at,
        users!inner(
          id,
          name,
          email,
          tax_invoice_info
        )
      `
      )
      .eq("id", invoiceId)
      .single();

    if (error) {
      console.error("세금계산서 조회 오류:", error);
      return NextResponse.json(
        {
          message: "세금계산서 조회 중 오류가 발생했습니다",
          error: error.message,
          status: 500,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 500 }
      );
    }

    if (!taxInvoice) {
      return NextResponse.json(
        {
          message: "세금계산서를 찾을 수 없습니다",
          error: "Not Found",
          status: 404,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 404 }
      );
    }

    // 세금계산서 담당자 정보 추출
    const userInfo = Array.isArray(taxInvoice.users)
      ? taxInvoice.users[0]
      : taxInvoice.users;
    const taxInvoiceInfo = userInfo?.tax_invoice_info as
      | { manager?: string; email?: string; contact?: string }
      | undefined;

    // 응답 데이터 포맷팅
    const formattedData = {
      id: taxInvoice.id,
      issueDate: taxInvoice.issue_date,
      businessNumber: taxInvoice.business_number,
      companyName: taxInvoice.company_name,
      supplyAmount: taxInvoice.supply_amount,
      taxAmount: taxInvoice.tax_amount,
      chargeAmount: taxInvoice.charge_amount,
      status: taxInvoice.status,
      createdAt: taxInvoice.created_at,
      updatedAt: taxInvoice.updated_at,
      user: {
        id: userInfo?.id,
        name: taxInvoiceInfo?.manager || userInfo?.name || "-",
        email: taxInvoiceInfo?.email || userInfo?.email || "-",
        phone: taxInvoiceInfo?.contact || "-",
      },
    };

    return NextResponse.json(
      {
        message: "세금계산서 상세 정보를 성공적으로 조회했습니다",
        data: formattedData,
        timestamp: getKSTISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("세금계산서 상세 조회 오류:", error);
    return NextResponse.json(
      {
        message: "세금계산서 상세 조회 중 오류가 발생했습니다",
        error: error instanceof Error ? error.message : "Internal Server Error",
        status: 500,
        timestamp: getKSTISOString(),
        path: `/api/admin/tax-invoices/${resolvedParams.id}`,
      },
      { status: 500 }
    );
  }
}

// 세금계산서 수정 API
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
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
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 403 }
      );
    }

    const invoiceId = parseInt(resolvedParams.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        {
          message: "올바르지 않은 세금계산서 ID입니다",
          error: "Invalid ID",
          status: 400,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      issueDate,
      businessNumber,
      companyName,
      supplyAmount,
      taxAmount,
      chargeAmount,
      status,
    } = body;

    // 필수 필드 검증
    if (
      !issueDate ||
      !businessNumber ||
      !companyName ||
      supplyAmount === undefined ||
      taxAmount === undefined ||
      chargeAmount === undefined
    ) {
      return NextResponse.json(
        {
          message: "필수 필드가 누락되었습니다",
          error: "Missing Required Fields",
          status: 400,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 400 }
      );
    }

    // 세금계산서 존재 여부 확인
    const { data: existingInvoice, error: checkError } = await supabase
      .from("tax_invoices")
      .select("id")
      .eq("id", invoiceId)
      .single();

    if (checkError || !existingInvoice) {
      return NextResponse.json(
        {
          message: "세금계산서를 찾을 수 없습니다",
          error: "Not Found",
          status: 404,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 404 }
      );
    }

    // 세금계산서 수정
    const { data: updatedInvoice, error: updateError } = await supabase
      .from("tax_invoices")
      .update({
        issue_date: issueDate,
        business_number: businessNumber.replace(/[-\s]/g, ""), // 사업자번호 정규화
        company_name: companyName,
        supply_amount: parseFloat(supplyAmount),
        tax_amount: parseFloat(taxAmount),
        charge_amount: parseFloat(chargeAmount),
        status: status || "issued",
        updated_at: new Date().toISOString(),
      })
      .eq("id", invoiceId)
      .select()
      .single();

    if (updateError) {
      console.error("세금계산서 수정 오류:", updateError);
      return NextResponse.json(
        {
          message: "세금계산서 수정 중 오류가 발생했습니다",
          error: updateError.message,
          status: 500,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "세금계산서가 성공적으로 수정되었습니다",
        data: {
          id: updatedInvoice.id,
          issueDate: updatedInvoice.issue_date,
          businessNumber: updatedInvoice.business_number,
          companyName: updatedInvoice.company_name,
          supplyAmount: updatedInvoice.supply_amount,
          taxAmount: updatedInvoice.tax_amount,
          chargeAmount: updatedInvoice.charge_amount,
          status: updatedInvoice.status,
          updatedAt: updatedInvoice.updated_at,
        },
        timestamp: getKSTISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("세금계산서 수정 오류:", error);
    return NextResponse.json(
      {
        message: "세금계산서 수정 중 오류가 발생했습니다",
        error: error instanceof Error ? error.message : "Internal Server Error",
        status: 500,
        timestamp: getKSTISOString(),
        path: `/api/admin/tax-invoices/${resolvedParams.id}`,
      },
      { status: 500 }
    );
  }
}

// 세금계산서 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
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
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 403 }
      );
    }

    const invoiceId = parseInt(resolvedParams.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        {
          message: "올바르지 않은 세금계산서 ID입니다",
          error: "Invalid ID",
          status: 400,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 400 }
      );
    }

    // 세금계산서 존재 여부 확인
    const { data: existingInvoice, error: checkError } = await supabase
      .from("tax_invoices")
      .select("id")
      .eq("id", invoiceId)
      .single();

    if (checkError || !existingInvoice) {
      return NextResponse.json(
        {
          message: "세금계산서를 찾을 수 없습니다",
          error: "Not Found",
          status: 404,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 404 }
      );
    }

    // 세금계산서 삭제
    const { error: deleteError } = await supabase
      .from("tax_invoices")
      .delete()
      .eq("id", invoiceId);

    if (deleteError) {
      console.error("세금계산서 삭제 오류:", deleteError);
      return NextResponse.json(
        {
          message: "세금계산서 삭제 중 오류가 발생했습니다",
          error: deleteError.message,
          status: 500,
          timestamp: getKSTISOString(),
          path: `/api/admin/tax-invoices/${resolvedParams.id}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "세금계산서가 성공적으로 삭제되었습니다",
        data: {
          id: invoiceId,
          deletedAt: getKSTISOString(),
        },
        timestamp: getKSTISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("세금계산서 삭제 오류:", error);
    return NextResponse.json(
      {
        message: "세금계산서 삭제 중 오류가 발생했습니다",
        error: error instanceof Error ? error.message : "Internal Server Error",
        status: 500,
        timestamp: getKSTISOString(),
        path: `/api/admin/tax-invoices/${resolvedParams.id}`,
      },
      { status: 500 }
    );
  }
}
