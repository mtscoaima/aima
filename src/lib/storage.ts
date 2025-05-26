import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface UploadedFile {
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface DocumentsData {
  businessRegistration?: UploadedFile;
  employmentCertificate?: UploadedFile;
}

// 파일 업로드 함수
export async function uploadFile(
  file: File,
  userId: string,
  documentType: "business_registration" | "employment_certificate"
): Promise<UploadedFile> {
  try {
    // 파일 확장자 추출
    const fileExt = file.name.split(".").pop();
    const fileName = `${documentType}_${Date.now()}.${fileExt}`;
    const filePath = `documents/${userId}/${fileName}`;

    // Supabase Storage에 파일 업로드
    const { error } = await supabase.storage
      .from("user-documents")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`파일 업로드 실패: ${error.message}`);
    }

    // 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from("user-documents")
      .getPublicUrl(filePath);

    return {
      fileName: file.name,
      fileUrl: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    throw error;
  }
}

// 파일 삭제 함수
export async function deleteFile(filePath: string): Promise<void> {
  try {
    const { error } = await supabase.storage
      .from("user-documents")
      .remove([filePath]);

    if (error) {
      throw new Error(`파일 삭제 실패: ${error.message}`);
    }
  } catch (error) {
    console.error("파일 삭제 오류:", error);
    throw error;
  }
}

// 여러 파일 업로드 함수
export async function uploadDocuments(
  files: { [key: string]: File },
  userId: string
): Promise<DocumentsData> {
  const documents: DocumentsData = {};

  try {
    // 사업자등록증 업로드
    if (files.businessRegistration) {
      documents.businessRegistration = await uploadFile(
        files.businessRegistration,
        userId,
        "business_registration"
      );
    }

    // 재직증명서 업로드
    if (files.employmentCertificate) {
      documents.employmentCertificate = await uploadFile(
        files.employmentCertificate,
        userId,
        "employment_certificate"
      );
    }

    return documents;
  } catch (error) {
    console.error("문서 업로드 오류:", error);
    throw error;
  }
}
