import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import {
  UpdateInquiryRequest,
  ApiResponse,
  InquiryDetail,
} from "@/types/inquiry";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 문의 상세 조회
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

    // 문의 조회 (사용자 본인의 문의만) - 첨부파일과 답변 정보 포함
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .select(
        `
        *,
        user:users!user_id (
          id,
          name,
          email
        ),
        attachments:inquiry_attachments(*),
        replies:inquiry_replies(*)
      `
      )
      .eq("id", inquiryId)
      .eq("user_id", parseInt(userId))
      .single();

    if (inquiryError || !inquiry) {
      if (inquiryError?.code === "PGRST116") {
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

      console.error("문의 조회 오류:", inquiryError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "문의 조회 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 첨부파일 조회
    const { data: attachments, error: attachmentError } = await supabase
      .from("inquiry_attachments")
      .select("*")
      .eq("inquiry_id", inquiryId)
      .order("created_at", { ascending: true });

    if (attachmentError) {
      console.error("첨부파일 조회 오류:", attachmentError);
    }

    // 답변 조회
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
      console.error("답변 조회 오류:", replyError);
    }

    // 응답 데이터 구성
    const inquiryDetail: InquiryDetail = {
      ...inquiry,
      attachments: attachments || [],
      replies: replies || [],
      user: inquiry.user
        ? {
            id: inquiry.user.id,
            name: inquiry.user.name,
            email: inquiry.user.email,
          }
        : undefined,
    };

    return NextResponse.json({
      success: true,
      data: inquiryDetail,
    } as ApiResponse<InquiryDetail>);
  } catch (error) {
    console.error("문의 상세 조회 API 오류:", error);
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

// PUT - 문의 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const inquiryId = parseInt(resolvedParams.id);
    const body: UpdateInquiryRequest = await request.json();

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
    const validation = validateUpdateInquiryRequest(body);
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

    // 기존 문의 조회 및 수정 권한 확인
    const { data: existingInquiry, error: fetchError } = await supabase
      .from("inquiries")
      .select("*, replies:inquiry_replies(id)")
      .eq("id", inquiryId)
      .eq("user_id", parseInt(userId))
      .single();

    if (fetchError || !existingInquiry) {
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

    // 답변이 있는 경우 수정 불가
    if (existingInquiry.replies && existingInquiry.replies.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MODIFICATION_NOT_ALLOWED",
            message: "답변이 등록된 문의는 수정할 수 없습니다.",
          },
        } as ApiResponse,
        { status: 403 }
      );
    }

    // 수정할 데이터 구성
    const updateData: Partial<{
      category: string;
      title: string;
      content: string;
      contact_phone: string;
      sms_notification: boolean;
    }> = {};
    if (body.category) updateData.category = body.category;
    if (body.title) updateData.title = body.title.trim();
    if (body.content) updateData.content = body.content.trim();
    if (body.contact_phone)
      updateData.contact_phone = body.contact_phone.trim();
    if (body.sms_notification !== undefined)
      updateData.sms_notification = body.sms_notification;

    // 문의 수정
    const { data: updatedInquiry, error: updateError } = await supabase
      .from("inquiries")
      .update(updateData)
      .eq("id", inquiryId)
      .eq("user_id", parseInt(userId))
      .select()
      .single();

    if (updateError) {
      console.error("문의 수정 오류:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "문의 수정 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 첨부파일 삭제 처리
    if (body.removeAttachmentIds && body.removeAttachmentIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("inquiry_attachments")
        .delete()
        .eq("inquiry_id", inquiryId)
        .in("id", body.removeAttachmentIds);

      if (deleteError) {
        console.error("첨부파일 삭제 오류:", deleteError);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedInquiry,
      message: "문의가 성공적으로 수정되었습니다.",
    } as ApiResponse);
  } catch (error) {
    console.error("문의 수정 API 오류:", error);
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

// DELETE - 문의 삭제
export async function DELETE(
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

    const token = authHeader.substring(7);

    // JWT 토큰 검증
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
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

    const userId = decoded.userId;

    // 기존 문의 조회 및 삭제 권한 확인
    const { data: existingInquiry, error: fetchError } = await supabase
      .from("inquiries")
      .select("*, replies:inquiry_replies(id)")
      .eq("id", inquiryId)
      .eq("user_id", parseInt(userId))
      .single();

    if (fetchError || !existingInquiry) {
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

    // 답변이 있는 문의도 삭제 가능 (답변도 함께 삭제됨)
    // 주의: 답변이 있는 문의를 삭제하면 답변도 함께 삭제되며, 복구할 수 없습니다.

    // 첨부파일이 있는 경우 Supabase Storage에서 삭제
    const { data: attachments } = await supabase
      .from("inquiry_attachments")
      .select("file_path")
      .eq("inquiry_id", inquiryId);

    if (attachments && attachments.length > 0) {
      // Storage에서 파일 삭제
      for (const attachment of attachments) {
        const { error: storageDeleteError } = await supabase.storage
          .from("inquiry-attachments")
          .remove([attachment.file_path]);

        if (storageDeleteError) {
          console.error("첨부파일 삭제 오류:", storageDeleteError);
        }
      }

      // 첨부파일 테이블에서 레코드 삭제
      const { error: attachmentDeleteError } = await supabase
        .from("inquiry_attachments")
        .delete()
        .eq("inquiry_id", inquiryId);

      if (attachmentDeleteError) {
        console.error("첨부파일 레코드 삭제 오류:", attachmentDeleteError);
        // 첨부파일 레코드 삭제 실패해도 문의 삭제는 계속 진행
      }
    }

    // 먼저 관련 답변 삭제
    const { error: replyDeleteError } = await supabase
      .from("inquiry_replies")
      .delete()
      .eq("inquiry_id", inquiryId);

    if (replyDeleteError) {
      console.error("답변 삭제 오류:", replyDeleteError);
      // 답변 삭제 실패해도 문의 삭제는 계속 진행
    }

    // 문의 삭제
    const { error: deleteError } = await supabase
      .from("inquiries")
      .delete()
      .eq("id", inquiryId)
      .eq("user_id", parseInt(userId));

    if (deleteError) {
      console.error("문의 삭제 오류:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "문의 삭제 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "문의가 성공적으로 삭제되었습니다.",
    } as ApiResponse);
  } catch (error) {
    console.error("문의 삭제 API 오류:", error);
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

// 문의 수정 요청 유효성 검사
function validateUpdateInquiryRequest(data: UpdateInquiryRequest) {
  const errors: Record<string, string> = {};
  let isValid = true;

  // 카테고리 검사 (제공된 경우)
  if (data.category) {
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
    if (!validCategories.includes(data.category)) {
      errors.category = "유효한 문의 유형을 선택해주세요.";
      isValid = false;
    }
  }

  // 제목 검사 (제공된 경우)
  if (data.title !== undefined) {
    if (data.title.trim().length === 0) {
      errors.title = "제목을 입력해주세요.";
      isValid = false;
    } else if (data.title.trim().length > 25) {
      errors.title = "제목은 25자 이하로 입력해주세요.";
      isValid = false;
    }
  }

  // 내용 검사 (제공된 경우)
  if (data.content !== undefined) {
    if (data.content.trim().length === 0) {
      errors.content = "문의 내용을 입력해주세요.";
      isValid = false;
    } else if (data.content.trim().length > 2000) {
      errors.content = "문의 내용은 2000자 이하로 입력해주세요.";
      isValid = false;
    }
  }

  // 연락처 검사 (제공된 경우)
  if (data.contact_phone !== undefined) {
    if (data.contact_phone.trim().length === 0) {
      errors.contact_phone = "연락처를 입력해주세요.";
      isValid = false;
    } else if (!/^[0-9-]+$/.test(data.contact_phone.trim())) {
      errors.contact_phone = "올바른 전화번호 형식으로 입력해주세요.";
      isValid = false;
    }
  }

  return { isValid, errors };
}
