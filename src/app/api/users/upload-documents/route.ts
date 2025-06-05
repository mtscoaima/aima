import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { getKSTISOString } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 서버 사이드에서는 서비스 역할 키 우선 사용
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 서비스 키가 있으면 서비스 키 사용, 없으면 anon 키 사용
const supabaseKey = supabaseServiceKey || supabaseAnonKey;

const supabase = createClient(supabaseUrl, supabaseKey);

interface UploadedFile {
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          message: "인증되지 않은 사용자",
          error: "Unauthorized",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/upload-documents",
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      return NextResponse.json(
        {
          message: "유효하지 않은 토큰",
          error: "Invalid token",
          status: 401,
          timestamp: getKSTISOString(),
          path: "/api/users/upload-documents",
        },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // FormData 파싱
    const formData = await request.formData();
    const businessRegistration = formData.get(
      "businessRegistration"
    ) as File | null;
    const employmentCertificate = formData.get(
      "employmentCertificate"
    ) as File | null;

    const documents: { [key: string]: UploadedFile } = {};

    // 사업자등록증 업로드
    if (businessRegistration) {
      const fileExt = businessRegistration.name.split(".").pop();
      const fileName = `business_registration_${Date.now()}.${fileExt}`;
      const filePath = `documents/${userId}/${fileName}`;

      // 파일을 ArrayBuffer로 변환
      const fileBuffer = await businessRegistration.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(filePath, fileBuffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: businessRegistration.type,
        });

      if (uploadError) {
        throw new Error(`사업자등록증 업로드 실패: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("user-documents")
        .getPublicUrl(filePath);

      documents.businessRegistration = {
        fileName: businessRegistration.name,
        fileUrl: urlData.publicUrl,
        uploadedAt: getKSTISOString(),
      };
    }

    // 재직증명서 업로드
    if (employmentCertificate) {
      const fileExt = employmentCertificate.name.split(".").pop();
      const fileName = `employment_certificate_${Date.now()}.${fileExt}`;
      const filePath = `documents/${userId}/${fileName}`;

      // 파일을 ArrayBuffer로 변환
      const fileBuffer = await employmentCertificate.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(filePath, fileBuffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: employmentCertificate.type,
        });

      if (uploadError) {
        throw new Error(`재직증명서 업로드 실패: ${uploadError.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("user-documents")
        .getPublicUrl(filePath);

      documents.employmentCertificate = {
        fileName: employmentCertificate.name,
        fileUrl: urlData.publicUrl,
        uploadedAt: getKSTISOString(),
      };
    }

    // 사용자 문서 정보 업데이트
    const { error: updateError } = await supabase
      .from("users")
      .update({
        documents: documents,
        updated_at: getKSTISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      throw new Error(`문서 정보 업데이트 실패: ${updateError.message}`);
    }

    return NextResponse.json(
      {
        message: "문서 업로드가 완료되었습니다.",
        documents: documents,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("문서 업로드 오류:", error);
    return NextResponse.json(
      {
        message: "문서 업로드 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error",
        status: 500,
        timestamp: getKSTISOString(),
        path: "/api/users/upload-documents",
      },
      { status: 500 }
    );
  }
}
