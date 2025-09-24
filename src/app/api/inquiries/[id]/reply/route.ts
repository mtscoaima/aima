import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { CreateReplyRequest, ApiResponse, InquiryReply } from "@/types/inquiry";
import { sendInquiryReplyNotification } from "@/utils/smsNotification";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - 답변 등록 (관리자용)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const inquiryId = parseInt(resolvedParams.id);
    const body: CreateReplyRequest = await request.json();

    if (isNaN(inquiryId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "유효하지 않은 문의 ID입니다.",
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 요청 데이터 유효성 검사
    const validation = validateCreateReplyRequest(body);
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
      console.error("JWT 토큰 검증 실패: 유효하지 않은 토큰");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
          },
        } as ApiResponse,
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (!decoded.userId || decoded.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "접근 권한이 없습니다.",
          },
        } as ApiResponse,
        { status: 403 }
      );
    }

    const adminId = decoded.userId;

    // 문의 존재 확인
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .select("*, user:users!user_id(id, name, phone_number)")
      .eq("id", inquiryId)
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "문의를 찾을 수 없습니다.",
          },
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 이미 답변이 있는지 확인 (현재는 중복 답변 허용)
    const { error: replyCheckError } = await supabase
      .from("inquiry_replies")
      .select("id")
      .eq("inquiry_id", inquiryId)
      .limit(1);

    if (replyCheckError) {
      console.error("기존 답변 확인 오류:", replyCheckError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "답변 등록 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 답변 등록
    const { data: reply, error: replyError } = await supabase
      .from("inquiry_replies")
      .insert({
        inquiry_id: inquiryId,
        admin_id: parseInt(adminId),
        content: body.content.trim(),
      })
      .select(
        `
        *,
        admin:users!admin_id (
          id,
          name
        )
      `
      )
      .single();

    if (replyError) {
      console.error("답변 등록 오류:", replyError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "답변 등록 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 문의 상태를 '답변완료'로 업데이트
    const { error: statusUpdateError } = await supabase
      .from("inquiries")
      .update({ status: "ANSWERED" })
      .eq("id", inquiryId);

    if (statusUpdateError) {
      console.error("문의 상태 업데이트 오류:", statusUpdateError);
      // 답변은 등록되었지만 상태 업데이트 실패 - 로그만 남기고 계속 진행
    }

    // SMS 알림 발송 (문의자가 SMS 알림을 원하는 경우)
    if (inquiry.sms_notification && inquiry.user?.phone_number) {
      try {
        const smsResult = await sendInquiryReplyNotification(
          inquiry.user.phone_number,
          inquiry.user.name || "고객",
          inquiry.title
        );

        if (!smsResult.success) {
          console.error(`SMS 알림 발송 실패: ${smsResult.error}`);
        }
      } catch (smsError) {
        console.error("SMS 알림 발송 오류:", smsError);
        // SMS 발송 실패해도 답변 등록은 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      data: reply,
      message: "답변이 성공적으로 등록되었습니다.",
    } as ApiResponse<InquiryReply>);
  } catch (error) {
    console.error("답변 등록 API 오류:", error);
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

// GET - 문의별 답변 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const inquiryId = parseInt(resolvedParams.id);

    if (isNaN(inquiryId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ID",
            message: "유효하지 않은 문의 ID입니다.",
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 사용자 인증 확인 (문의 작성자 또는 관리자)
    const userId = request.headers.get("x-user-id");
    const userRole = request.headers.get("x-user-role");

    if (!userId) {
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

    // 권한 확인을 위해 문의 조회
    let inquiryQuery = supabase
      .from("inquiries")
      .select("id, user_id")
      .eq("id", inquiryId);

    // 관리자가 아닌 경우 본인 문의만 조회 가능
    if (userRole !== "ADMIN") {
      inquiryQuery = inquiryQuery.eq("user_id", parseInt(userId));
    }

    const { data: inquiry, error: inquiryError } = await inquiryQuery.single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "문의를 찾을 수 없습니다.",
          },
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 답변 목록 조회
    const { data: replies, error: replyError } = await supabase
      .from("inquiry_replies")
      .select(
        `
        *,
        admin:users!admin_id (
          id,
          name
        )
      `
      )
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });

    if (replyError) {
      console.error("답변 목록 조회 오류:", replyError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "답변 목록을 불러오는 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: replies || [],
    } as ApiResponse<InquiryReply[]>);
  } catch (error) {
    console.error("답변 목록 조회 API 오류:", error);
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

// 답변 등록 요청 유효성 검사
function validateCreateReplyRequest(data: CreateReplyRequest) {
  const errors: Record<string, string> = {};
  let isValid = true;

  // 답변 내용 검사
  if (!data.content || data.content.trim().length === 0) {
    errors.content = "답변 내용을 입력해주세요.";
    isValid = false;
  } else if (data.content.trim().length > 2000) {
    errors.content = "답변 내용은 2000자 이하로 입력해주세요.";
    isValid = false;
  }

  return { isValid, errors };
}
