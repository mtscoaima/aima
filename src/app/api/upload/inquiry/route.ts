import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import {
  ApiResponse,
  FileUploadResponse,
  FILE_UPLOAD_CONFIG,
} from "@/types/inquiry";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Supabase 클라이언트 초기화
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - 문의 첨부파일 업로드
export async function POST(request: NextRequest) {
  try {
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

    // FormData에서 파일과 inquiry_id 추출
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const inquiryId = formData.get("inquiry_id") as string;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_FILE",
            message: "업로드할 파일이 없습니다.",
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    if (!inquiryId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_INQUIRY_ID",
            message: "문의 ID가 필요합니다.",
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 파일 유효성 검사
    const fileValidation = validateFile(file);
    if (!fileValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_VALIDATION_ERROR",
            message: fileValidation.error,
          },
        } as ApiResponse,
        { status: 400 }
      );
    }

    // 문의 존재 및 권한 확인
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .select("id, user_id")
      .eq("id", parseInt(inquiryId))
      .eq("user_id", parseInt(userId))
      .single();

    if (inquiryError || !inquiry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INQUIRY_NOT_FOUND",
            message: "문의를 찾을 수 없거나 권한이 없습니다.",
          },
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 파일 저장
    const fileResult = await saveFile(file, inquiryId);
    if (!fileResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FILE_SAVE_ERROR",
            message: fileResult.error || "파일 저장 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 데이터베이스에 첨부파일 정보 저장
    const { data: attachment, error: attachmentError } = await supabase
      .from("inquiry_attachments")
      .insert({
        inquiry_id: parseInt(inquiryId),
        file_name: file.name,
        file_path: fileResult.filePath!,
        file_size: file.size,
        content_type: file.type,
      })
      .select()
      .single();

    if (attachmentError) {
      console.error("첨부파일 정보 저장 오류:", attachmentError);
      // TODO: 저장된 물리 파일 삭제
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "첨부파일 정보 저장 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // 파일 다운로드 URL 생성
    const downloadUrl = `/api/download/inquiry/${attachment.id}`;

    const response: FileUploadResponse = {
      id: attachment.id,
      file_name: attachment.file_name,
      file_path: attachment.file_path,
      file_size: attachment.file_size,
      content_type: attachment.content_type,
      url: downloadUrl,
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: "파일이 성공적으로 업로드되었습니다.",
    } as ApiResponse<FileUploadResponse>);
  } catch (error) {
    console.error("파일 업로드 API 오류:", error);
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

// 파일 유효성 검사
function validateFile(file: File) {
  // 파일 크기 검사
  if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
    return {
      isValid: false,
      error: `파일 크기는 ${
        FILE_UPLOAD_CONFIG.maxSize / (1024 * 1024)
      }MB 이하여야 합니다.`,
    };
  }

  // 파일 타입 검사
  if (!FILE_UPLOAD_CONFIG.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error:
        "지원하지 않는 파일 형식입니다. (jpg, jpeg, gif, png, bmp, docx, xlsx, xls, csv, pdf만 가능)",
    };
  }

  // 파일 확장자 검사
  const fileName = file.name.toLowerCase();
  const hasValidExtension = FILE_UPLOAD_CONFIG.allowedExtensions.some((ext) =>
    fileName.endsWith(ext.toLowerCase())
  );

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: "지원하지 않는 파일 확장자입니다.",
    };
  }

  return { isValid: true };
}

// 파일 저장
async function saveFile(file: File, inquiryId: string) {
  try {
    // 업로드 디렉토리 생성
    const uploadDir = join(process.cwd(), "uploads", "inquiries", inquiryId);

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 고유한 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = `${timestamp}_${randomStr}.${fileExtension}`;

    const filePath = join(uploadDir, uniqueFileName);
    const relativePath = join(
      "uploads",
      "inquiries",
      inquiryId,
      uniqueFileName
    );

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    return {
      success: true,
      filePath: relativePath,
    };
  } catch (error) {
    console.error("파일 저장 오류:", error);
    return {
      success: false,
      error: "파일 저장 중 오류가 발생했습니다.",
    };
  }
}

// DELETE - 첨부파일 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get("id");

    if (!attachmentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_ATTACHMENT_ID",
            message: "첨부파일 ID가 필요합니다.",
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
    let decodedDelete: {
      userId: string;
      email: string;
      name: string;
      phoneNumber: string;
      role: string;
    };
    try {
      decodedDelete = jwt.verify(token, JWT_SECRET) as {
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
    const userId = decodedDelete.userId;
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

    // 첨부파일과 문의 정보 조회
    const { data: attachment, error: attachmentError } = await supabase
      .from("inquiry_attachments")
      .select(
        `
        *,
        inquiry:inquiries!inquiry_id (
          id,
          user_id,
          status
        )
      `
      )
      .eq("id", parseInt(attachmentId))
      .single();

    if (attachmentError || !attachment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ATTACHMENT_NOT_FOUND",
            message: "첨부파일을 찾을 수 없습니다.",
          },
        } as ApiResponse,
        { status: 404 }
      );
    }

    // 권한 확인 (문의 작성자만 삭제 가능)
    if (attachment.inquiry.user_id !== parseInt(userId)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "첨부파일 삭제 권한이 없습니다.",
          },
        } as ApiResponse,
        { status: 403 }
      );
    }

    // 답변이 있는 문의의 첨부파일은 삭제 불가
    const { data: replies, error: replyError } = await supabase
      .from("inquiry_replies")
      .select("id")
      .eq("inquiry_id", attachment.inquiry_id)
      .limit(1);

    if (replyError) {
      console.error("답변 확인 오류:", replyError);
    } else if (replies && replies.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DELETION_NOT_ALLOWED",
            message: "답변이 등록된 문의의 첨부파일은 삭제할 수 없습니다.",
          },
        } as ApiResponse,
        { status: 403 }
      );
    }

    // 데이터베이스에서 첨부파일 정보 삭제
    const { error: deleteError } = await supabase
      .from("inquiry_attachments")
      .delete()
      .eq("id", parseInt(attachmentId));

    if (deleteError) {
      console.error("첨부파일 삭제 오류:", deleteError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DATABASE_ERROR",
            message: "첨부파일 삭제 중 오류가 발생했습니다.",
          },
        } as ApiResponse,
        { status: 500 }
      );
    }

    // TODO: 물리 파일도 삭제
    // const fullPath = join(process.cwd(), attachment.file_path);
    // if (existsSync(fullPath)) {
    //   await unlink(fullPath);
    // }

    return NextResponse.json({
      success: true,
      message: "첨부파일이 성공적으로 삭제되었습니다.",
    } as ApiResponse);
  } catch (error) {
    console.error("첨부파일 삭제 API 오류:", error);
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
