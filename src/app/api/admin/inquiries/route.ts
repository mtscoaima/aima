import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface AdminInquiryListParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface AdminInquiryResponse {
  inquiries: Array<{
    id: number;
    user_id: number;
    category: string;
    title: string;
    content: string;
    contact_phone: string;
    sms_notification: boolean;
    status: string;
    created_at: string;
    updated_at: string;
    user_name: string;
    user_email: string;
    attachment_count: number;
    reply_count: number;
  }>;
  pagination: PaginationInfo;
}

// GET - 관리자용 모든 문의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const params: AdminInquiryListParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "15"),
      category: searchParams.get("category") || undefined,
      status: searchParams.get("status") || undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "인증이 필요합니다.",
          },
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7); // "Bearer " 제거

    // JWT 토큰 검증
    let decoded: {
      userId: string;
      email: string;
      name: string;
      phoneNumber: string;
      role: string;
    };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        name: string;
        phoneNumber: string;
        role: string;
      };
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "유효하지 않은 토큰입니다.",
          },
        },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (decoded.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "관리자 권한이 필요합니다.",
          },
        },
        { status: 403 }
      );
    }

    // 기본 쿼리 구성 - 사용자 정보와 조인하여 이름 포함
    let query = supabase.from("inquiries").select(
      `
        *,
        users!inner(name, email),
        attachments:inquiry_attachments(count),
        replies:inquiry_replies(count)
      `,
      { count: "exact" }
    );

    // 필터 적용
    if (params.category) {
      query = query.eq("category", params.category);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.search) {
      // 개별 검색 조건들을 OR로 연결
      query = query.or(`title.ilike.%${params.search}%,content.ilike.%${params.search}%`);
    }

    if (params.startDate) {
      query = query.gte("created_at", params.startDate);
    }

    if (params.endDate) {
      query = query.lte("created_at", params.endDate);
    }

    // 정렬 적용
    query = query.order(params.sortBy || "created_at", {
      ascending: params.sortOrder === "asc",
    });

    // 페이지네이션 적용
    const offset = (params.page! - 1) * params.limit!;
    query = query.range(offset, offset + params.limit! - 1);

    // 쿼리 실행
    const { data: inquiries, error, count } = await query;

    if (error) {
      console.error("관리자 문의 목록 조회 오류:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "문의 목록을 불러오는 중 오류가 발생했습니다.",
          },
        },
        { status: 500 }
      );
    }

    // 데이터 변환 - 클라이언트에서 사용하기 쉬운 형태로
    const transformedInquiries = (inquiries || []).map(
      (inquiry: {
        id: number;
        user_id: number;
        category: string;
        title: string;
        content: string;
        contact_phone: string;
        sms_notification: boolean;
        status: string;
        created_at: string;
        updated_at: string;
        users?: { name?: string; email?: string };
        attachments?: Array<{ count: number }>;
        replies?: Array<{ count: number }>;
      }) => ({
        id: inquiry.id,
        user_id: inquiry.user_id,
        category: inquiry.category,
        title: inquiry.title,
        content: inquiry.content,
        contact_phone: inquiry.contact_phone,
        sms_notification: inquiry.sms_notification,
        status: inquiry.status,
        created_at: inquiry.created_at,
        updated_at: inquiry.updated_at,
        user_name: inquiry.users?.name || "알 수 없음",
        user_email: inquiry.users?.email || "",
        attachment_count: inquiry.attachments?.[0]?.count || 0,
        reply_count: inquiry.replies?.[0]?.count || 0,
      })
    );

    // 페이지네이션 정보 계산
    const totalPages = Math.ceil((count || 0) / params.limit!);
    const pagination: PaginationInfo = {
      currentPage: params.page!,
      totalPages,
      totalItems: count || 0,
      limit: params.limit!,
      hasNext: params.page! < totalPages,
      hasPrev: params.page! > 1,
    };

    const response: AdminInquiryResponse = {
      inquiries: transformedInquiries,
      pagination,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });
  } catch (error) {
    console.error("관리자 문의 목록 조회 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "서버 내부 오류가 발생했습니다.",
        },
      },
      { status: 500 }
    );
  }
}
