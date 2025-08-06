import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import {
  CreateInquiryRequest,
  InquiryListParams,
  ApiResponse,
  InquiryListResponse,
  Inquiry,
  InquiryCategory,
  InquiryStatus,
} from "@/types/inquiry";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - 문의 등록
export async function POST(request: NextRequest) {
  try {
    const body: CreateInquiryRequest = await request.json();

    // 요청 데이터 유효성 검사
    const validation = validateCreateInquiryRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "입력 데이터가 유효하지 않습니다.",
            details: validation.errors,
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

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
        } as ApiResponse,
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
        } as ApiResponse,
        { status: 401 }
      );
    }

    // 토큰에서 사용자 ID 추출
    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "토큰에 사용자 정보가 없습니다.",
          },
        } as ApiResponse,
        { status: 401 }
      );
    }

    // 사용자 정보 조회 (전화번호 가져오기)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("phone_number")
      .eq("id", parseInt(userId))
      .single();

    if (userError || !user || !user.phone_number) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message:
              "사용자 정보를 찾을 수 없거나 전화번호가 등록되지 않았습니다.",
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 문의 데이터 삽입
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .insert({
        user_id: parseInt(userId),
        category: body.category,
        title: body.title.trim(),
        content: body.content.trim(),
        contact_phone: user.phone_number.trim(),
        sms_notification: body.sms_notification || false,
        status: "PENDING",
      })
      .select()
      .single();

    if (inquiryError) {
      console.error("문의 등록 오류:", inquiryError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "문의 등록 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 첨부파일이 있는 경우 처리 (파일 업로드는 별도 엔드포인트에서 처리)
    // 여기서는 inquiry_id를 반환하여 클라이언트에서 파일 업로드 API를 호출하도록 함

    return NextResponse.json({
      success: true,
      data: inquiry,
      message: "문의가 성공적으로 등록되었습니다.",
    } as ApiResponse<Inquiry>);
  } catch (error) {
    console.error("문의 등록 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "서버 내부 오류가 발생했습니다.",
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// GET - 문의 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 쿼리 파라미터 파싱
    const params: InquiryListParams = {
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "10"),
      category: searchParams.get("category") as InquiryCategory | undefined,
      status: searchParams.get("status") as InquiryStatus | undefined,
      search: searchParams.get("search") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      sortBy:
        (searchParams.get("sortBy") as
          | "created_at"
          | "updated_at"
          | "status") || "created_at",
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
        } as ApiResponse,
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
        } as ApiResponse,
        { status: 401 }
      );
    }

    // 토큰에서 사용자 ID 추출
    const userId = decoded.userId;
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "토큰에 사용자 정보가 없습니다.",
          },
        } as ApiResponse,
        { status: 401 }
      );
    }

    // 기본 쿼리 구성 - 첨부파일과 답변 정보 포함
    let query = supabase
      .from("inquiries")
      .select(
        `
        *,
        attachments:inquiry_attachments(*),
        replies:inquiry_replies(*)
      `,
        { count: "exact" }
      )
      .eq("user_id", parseInt(userId));

    // 필터 적용
    if (params.category) {
      query = query.eq("category", params.category);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.search) {
      query = query.or(
        `title.ilike.%${params.search}%,content.ilike.%${params.search}%`
      );
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
      console.error("문의 목록 조회 오류:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "문의 목록을 불러오는 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 응답 데이터 구성
    const totalPages = Math.ceil((count || 0) / params.limit!);
    const response: InquiryListResponse = {
      inquiries: inquiries || [],
      pagination: {
        page: params.page!,
        limit: params.limit!,
        total: count || 0,
        totalPages,
        hasNext: params.page! < totalPages,
        hasPrev: params.page! > 1,
      },
      filters: {
        category: params.category,
        status: params.status,
        search: params.search,
        startDate: params.startDate,
        endDate: params.endDate,
      },
    };

    return NextResponse.json({
      success: true,
      data: response,
    } as ApiResponse<InquiryListResponse>);
  } catch (error) {
    console.error("문의 목록 조회 API 오류:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "서버 내부 오류가 발생했습니다.",
        },
      } as ApiResponse,
      { status: 500 }
    );
  }
}

// 문의 등록 요청 유효성 검사
function validateCreateInquiryRequest(data: CreateInquiryRequest) {
  const errors: Record<string, string> = {};
  let isValid = true;

  // 카테고리 검사
  const validCategories = [
    "AI_TARGET_MARKETING",
    "PRICING",
    "CHARGING",
    "LOGIN",
    "USER_INFO",
    "MESSAGE",
    "SEND_RESULT",
    "OTHER",
  ];
  if (!data.category || !validCategories.includes(data.category)) {
    errors.category = "유효한 문의 유형을 선택해주세요.";
    isValid = false;
  }

  // 제목 검사
  if (!data.title || data.title.trim().length === 0) {
    errors.title = "제목을 입력해주세요.";
    isValid = false;
  } else if (data.title.trim().length > 25) {
    errors.title = "제목은 25자 이하로 입력해주세요.";
    isValid = false;
  }

  // 내용 검사
  if (!data.content || data.content.trim().length === 0) {
    errors.content = "문의 내용을 입력해주세요.";
    isValid = false;
  } else if (data.content.trim().length > 2000) {
    errors.content = "문의 내용은 2000자 이하로 입력해주세요.";
    isValid = false;
  }

  return { isValid, errors };
}
