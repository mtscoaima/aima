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

// 세금계산서 목록 조회 API
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
          path: "/api/admin/tax-invoices",
        },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 추출
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const businessNumber = searchParams.get("businessNumber");
    const companyName = searchParams.get("companyName");
    const status = searchParams.get("status");

    // 페이지네이션 계산
    const offset = (page - 1) * limit;

    // 필터 적용 함수 (count와 data 쿼리에서 재사용)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const applyFilters = (query: any) => {
      if (startDate) {
        query = query.gte("issue_date", startDate);
      }

      if (endDate) {
        query = query.lte("issue_date", endDate);
      }

      if (businessNumber && businessNumber.trim()) {
        // 사업자번호 정규화 (하이픈 제거)
        const normalizedBizNumber = businessNumber.replace(/[-\s]/g, "");
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

    // 총 개수 조회용 별도 쿼리 (필터 적용)
    let countQuery = supabase
      .from("tax_invoices")
      .select("*", { count: "exact", head: true });

    countQuery = applyFilters(countQuery);

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error("총 개수 조회 오류:", countError);
      return NextResponse.json(
        {
          message: "총 개수 조회 중 오류가 발생했습니다",
          error: countError.message,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices",
        },
        { status: 500 }
      );
    }

    // 실제 데이터 조회용 별도 쿼리 (페이지네이션 적용)
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
        status,
        created_at,
        users!inner(
          id,
          name,
          email
        )
      `
      )
      .order("created_at", { ascending: false });

    dataQuery = applyFilters(dataQuery);

    const { data: taxInvoices, error: dataError } = await dataQuery.range(
      offset,
      offset + limit - 1
    );

    if (dataError) {
      console.error("데이터 조회 오류:", dataError);
      return NextResponse.json(
        {
          message: "세금계산서 목록 조회 중 오류가 발생했습니다",
          error: dataError.message,
          status: 500,
          timestamp: getKSTISOString(),
          path: "/api/admin/tax-invoices",
        },
        { status: 500 }
      );
    }

    // 응답 데이터 포맷팅
    const formattedData =
      taxInvoices?.map((invoice: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const users = invoice.users as any;
        return {
          id: invoice.id,
          issueDate: invoice.issue_date,
          businessNumber: invoice.business_number,
          companyName: invoice.company_name,
          supplyAmount: invoice.supply_amount,
          taxAmount: invoice.tax_amount,
          chargeAmount: invoice.charge_amount,
          status: invoice.status,
          createdAt: invoice.created_at,
          user: {
            id: users?.id,
            name: users?.name,
            email: users?.email,
          },
        };
      }) || [];

    // 페이지네이션 메타데이터 계산
    const totalPages = Math.ceil((totalCount || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // 성공 응답
    return NextResponse.json(
      {
        message: "세금계산서 목록을 성공적으로 조회했습니다",
        data: formattedData,
        pagination: {
          currentPage: page,
          limit,
          totalCount: totalCount || 0,
          totalPages,
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          startDate: startDate || null,
          endDate: endDate || null,
          businessNumber: businessNumber || null,
          companyName: companyName || null,
          status: status || null,
        },
        timestamp: getKSTISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("세금계산서 목록 조회 오류:", error);
    return NextResponse.json(
      {
        message: "세금계산서 목록 조회 중 오류가 발생했습니다",
        error: error instanceof Error ? error.message : "Internal Server Error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/admin/tax-invoices",
      },
      { status: 500 }
    );
  }
}
