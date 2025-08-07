import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";

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

// 사용자용 세금계산서 목록 조회 API
export async function GET(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { error: "인증 토큰이 필요합니다." },
        { status: 401 }
      );
    }

    let decodedToken: any;
    try {
      decodedToken = jwt.verify(token, JWT_SECRET);
    } catch (error) {
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 유효성 검증
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "잘못된 페이지 또는 제한 값입니다." },
        { status: 400 }
      );
    }

    // 기본 쿼리 구성
    let query = supabase
      .from("tax_invoices")
      .select(
        `
        id,
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

    // 전체 개수 조회
    const countQuery = supabase
      .from("tax_invoices")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    // 날짜 필터링 (카운트용)
    if (startDate && endDate) {
      countQuery.gte("issue_date", startDate).lte("issue_date", endDate);
    } else if (startDate) {
      countQuery.gte("issue_date", startDate);
    } else if (endDate) {
      countQuery.lte("issue_date", endDate);
    }

    const { count } = await countQuery;

    // 페이지네이션 적용
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: taxInvoices, error } = await query;

    if (error) {
      console.error("세금계산서 조회 오류:", error);
      return NextResponse.json(
        { error: "세금계산서를 조회하는 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 사업자등록번호 하이픈 포맷팅
    const formattedData =
      taxInvoices?.map((invoice) => ({
        ...invoice,
        business_number: invoice.business_number?.replace(
          /(\d{3})(\d{2})(\d{5})/,
          "$1-$2-$3"
        ),
        supply_amount: Number(invoice.supply_amount),
        tax_amount: Number(invoice.tax_amount),
        total_amount: Number(invoice.total_amount),
      })) || [];

    // 페이지네이션 정보
    const totalPages = Math.ceil((count || 0) / limit);
    const pagination = {
      currentPage: page,
      totalPages,
      totalItems: count || 0,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };

    return NextResponse.json({
      data: formattedData,
      pagination,
      filters: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
