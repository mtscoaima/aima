import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 특정 문의 상세 조회 (관리자용)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inquiryId } = await params;

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
      console.error("JWT 토큰 검증 실패: 유효하지 않은 토큰");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
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
            message: "접근 권한이 없습니다.",
          },
        },
        { status: 403 }
      );
    }

    // 문의 상세 정보 조회
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .select(
        `
        *,
        users!inner(name, email),
        attachments:inquiry_attachments(*),
        replies:inquiry_replies(
          *,
          admin:users!inquiry_replies_admin_id_fkey(name)
        )
      `
      )
      .eq("id", inquiryId)
      .single();

    if (error) {
      console.error("문의 상세 조회 오류:", error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "문의 정보를 불러오는 중 오류가 발생했습니다.",
          },
        },
        { status: 500 }
      );
    }

    if (!inquiry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "문의를 찾을 수 없습니다.",
          },
        },
        { status: 404 }
      );
    }

    // 데이터 변환
    const transformedInquiry = {
      ...inquiry,
      user_name: inquiry.users?.name || "알 수 없음",
      user_email: inquiry.users?.email || "",
    };

    return NextResponse.json({
      success: true,
      data: transformedInquiry,
    });
  } catch (error) {
    console.error("문의 상세 조회 API 오류:", error);
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

// PUT - 문의 상태 변경 (관리자용)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inquiryId } = await params;
    const body = await request.json();

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
      console.error("JWT 토큰 검증 실패: 유효하지 않은 토큰");
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "세션이 만료되었습니다. 다시 로그인해주세요.",
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
            message: "접근 권한이 없습니다.",
          },
        },
        { status: 403 }
      );
    }

    // 유효한 상태값 확인
    const validStatuses = ["PENDING", "ANSWERED", "CLOSED"];
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS",
            message: "유효하지 않은 상태값입니다.",
          },
        },
        { status: 400 }
      );
    }

    // 문의 상태 업데이트
    const { data: updatedInquiry, error: updateError } = await supabase
      .from("inquiries")
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inquiryId)
      .select()
      .single();

    if (updateError) {
      console.error("문의 상태 업데이트 오류:", updateError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "문의 상태를 변경하는 중 오류가 발생했습니다.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedInquiry,
      message: "문의 상태가 성공적으로 변경되었습니다.",
    });
  } catch (error) {
    console.error("문의 상태 변경 API 오류:", error);
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
