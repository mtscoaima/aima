import { FILE_UPLOAD_CONFIG } from "@/types/inquiry";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

/**
 * 파일 유효성 검사
 */
export function validateFile(file: File) {
  // 파일 크기 검사
  if (file.size > FILE_UPLOAD_CONFIG.maxSize) {
    return {
      isValid: false,
      error: `파일 크기는 ${
        FILE_UPLOAD_CONFIG.maxSize / (1024 * 1024)
      }MB 이하여야 합니다.`,
    };
  }

  // 파일이 비어있는지 검사
  if (file.size === 0) {
    return {
      isValid: false,
      error: "빈 파일은 업로드할 수 없습니다.",
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

  // 파일명 유효성 검사 (특수문자 제한)
  const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (invalidChars.test(file.name)) {
    return {
      isValid: false,
      error: "파일명에 사용할 수 없는 특수문자가 포함되어 있습니다.",
    };
  }

  return { isValid: true };
}

/**
 * 파일 저장
 */
export async function saveFile(
  file: File,
  inquiryId: string,
  subDir: string = "inquiries"
) {
  try {
    // 업로드 디렉토리 생성
    const uploadDir = join(process.cwd(), "uploads", subDir, inquiryId);

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 고유한 파일명 생성 (타임스탬프 + 랜덤 문자열)
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = getFileExtension(file.name);
    const uniqueFileName = `${timestamp}_${randomStr}.${fileExtension}`;

    const filePath = join(uploadDir, uniqueFileName);
    const relativePath = join("uploads", subDir, inquiryId, uniqueFileName);

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    return {
      success: true,
      filePath: relativePath,
      absolutePath: filePath,
      fileName: uniqueFileName,
    };
  } catch (error) {
    console.error("파일 저장 오류:", error);
    return {
      success: false,
      error: "파일 저장 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 파일 삭제
 */
export async function deleteFile(filePath: string) {
  try {
    const fullPath = join(process.cwd(), filePath);

    if (existsSync(fullPath)) {
      await unlink(fullPath);
      return { success: true };
    } else {
      return { success: false, error: "파일이 존재하지 않습니다." };
    }
  } catch (error) {
    console.error("파일 삭제 오류:", error);
    return { success: false, error: "파일 삭제 중 오류가 발생했습니다." };
  }
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

/**
 * 파일 크기를 읽기 쉬운 형태로 변환
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * MIME 타입에서 파일 카테고리 구분
 */
export function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("word") || mimeType.includes("document"))
    return "document";
  if (
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    mimeType === "text/csv"
  )
    return "spreadsheet";
  return "other";
}

/**
 * 안전한 파일명 생성 (특수문자 제거)
 */
export function sanitizeFileName(fileName: string): string {
  // 특수문자를 언더스코어로 변경
  const sanitized = fileName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");

  // 연속된 언더스코어를 하나로 통합
  return sanitized.replace(/_+/g, "_");
}

/**
 * 파일 업로드 진행률 계산을 위한 청크 단위 업로드
 */
export async function saveFileWithProgress(
  file: File,
  inquiryId: string,
  onProgress?: (progress: number) => void
) {
  try {
    // const chunkSize = 1024 * 1024; // 1MB 청크 (현재 사용되지 않음)
    // const totalChunks = Math.ceil(file.size / chunkSize); // 현재 사용되지 않음

    // 업로드 디렉토리 생성
    const uploadDir = join(process.cwd(), "uploads", "inquiries", inquiryId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const fileExtension = getFileExtension(file.name);
    const uniqueFileName = `${timestamp}_${randomStr}.${fileExtension}`;
    const filePath = join(uploadDir, uniqueFileName);
    const relativePath = join(
      "uploads",
      "inquiries",
      inquiryId,
      uniqueFileName
    );

    // 파일을 청크 단위로 처리
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    let uploadedBytes = 0;

    // 전체 파일을 한 번에 저장 (실제 환경에서는 스트림 사용 권장)
    await writeFile(filePath, buffer);
    uploadedBytes = buffer.length;

    // 진행률 콜백 호출
    if (onProgress) {
      onProgress(Math.round((uploadedBytes / file.size) * 100));
    }

    return {
      success: true,
      filePath: relativePath,
      absolutePath: filePath,
      fileName: uniqueFileName,
    };
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    return {
      success: false,
      error: "파일 업로드 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 여러 파일 동시 업로드
 */
export async function saveMultipleFiles(
  files: File[],
  inquiryId: string,
  onProgress?: (fileIndex: number, progress: number) => void
) {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // 개별 파일 유효성 검사
    const validation = validateFile(file);
    if (!validation.isValid) {
      results.push({
        file: file.name,
        success: false,
        error: validation.error,
      });
      continue;
    }

    // 파일 저장
    const saveResult = await saveFileWithProgress(file, inquiryId, (progress) =>
      onProgress?.(i, progress)
    );

    results.push({
      file: file.name,
      ...saveResult,
    });
  }

  return results;
}

/**
 * 임시 파일 정리 (오래된 파일 삭제)
 */
export async function cleanupOldFiles(maxAge: number = 24 * 60 * 60 * 1000) {
  // 기본 24시간
  try {
    const uploadDir = join(process.cwd(), "uploads");
    if (!existsSync(uploadDir)) return { success: true, cleaned: 0 };

    // TODO: 실제 구현에서는 파일 시스템을 순회하며 오래된 파일 삭제
    // 현재는 로그만 출력
    console.log(`임시 파일 정리 작업 시작 (${maxAge}ms 이상 된 파일)`);

    return { success: true, cleaned: 0 };
  } catch (error) {
    console.error("파일 정리 오류:", error);
    return { success: false, error: "파일 정리 중 오류가 발생했습니다." };
  }
}
