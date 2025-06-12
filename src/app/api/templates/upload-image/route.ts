import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JWT_SECRET = process.env.JWT_SECRET!;

// 서버 사이드에서는 서비스 역할 키 사용
const supabaseKey = supabaseServiceKey!;
const supabase = createClient(supabaseUrl, supabaseKey);

// JWT 토큰에서 사용자 ID 추출
function getUserIdFromToken(request: NextRequest): string | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (필수)
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const templateId = formData.get("templateId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 파일 타입 검증
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // 파일 확장자 추출
    const fileExt = file.name.split(".").pop();
    const fileName = templateId
      ? `template_${templateId}_${Date.now()}.${fileExt}`
      : `template_new_${Date.now()}.${fileExt}`;
    const filePath = `templates/${fileName}`;

    // 파일을 ArrayBuffer로 변환
    const fileBuffer = await file.arrayBuffer();

    // Supabase Storage에 파일 업로드
    const { error: uploadError } = await supabase.storage
      .from("templates")
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: `Image upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from("templates")
      .getPublicUrl(filePath);

    return NextResponse.json({
      fileName: file.name,
      fileUrl: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Template image upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
