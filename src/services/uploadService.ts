export interface UploadFileResponse {
  success: boolean;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadId?: string;
}

export interface UploadImageResponse {
  success: boolean;
  imageUrl: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  fileSize: number;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    extension: string;
  };
}

/**
 * 파일 유효성 검증
 */
export const validateFile = (
  file: File,
  options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}
): FileValidationResult => {
  const {
    maxSize = 10 * 1024 * 1024, // 기본 10MB
    allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    allowedExtensions = []
  } = options;

  // 파일 크기 검증
  if (file.size > maxSize) {
    const sizeMB = Math.round(maxSize / (1024 * 1024));
    const currentSizeMB = Math.round(file.size / (1024 * 1024));
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. 현재: ${currentSizeMB}MB, 최대: ${sizeMB}MB`,
    };
  }

  // MIME 타입 검증
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "지원하지 않는 파일 형식입니다.",
    };
  }

  // 확장자 검증 (선택적)
  if (allowedExtensions.length > 0) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.includes(fileExtension)) {
      return {
        isValid: false,
        error: `지원하지 않는 파일 확장자입니다. 허용된 확장자: ${allowedExtensions.join(', ')}`,
      };
    }
  }

  return {
    isValid: true,
    fileInfo: {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: file.name.split('.').pop()?.toLowerCase() || '',
    },
  };
};

/**
 * 이미지 파일 유효성 검증
 */
export const validateImageFile = (file: File): FileValidationResult => {
  return validateFile(file, {
    maxSize: 300 * 1024, // 300KB
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
  });
};

/**
 * 일반 파일 업로드 API 호출
 */
export const uploadFile = async (
  file: File,
  options: {
    endpoint?: string;
    token?: string;
    additionalData?: Record<string, string>;
  } = {}
): Promise<UploadFileResponse> => {
  const { endpoint = "/api/message/upload-file", token, additionalData = {} } = options;

  // 파일 유효성 검증
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("file", file);
  
  // 추가 데이터 첨부
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, value);
  });

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "파일 업로드에 실패했습니다.");
  }

  const data = await response.json();
  return {
    success: data.success || true,
    fileUrl: data.fileUrl || data.url,
    fileName: data.fileName || file.name,
    fileSize: data.fileSize || file.size,
    mimeType: data.mimeType || file.type,
    uploadId: data.uploadId,
  };
};

/**
 * 이미지 업로드 API 호출 (템플릿용)
 */
export const uploadTemplateImage = async (
  file: File,
  token: string
): Promise<UploadImageResponse> => {
  // 이미지 파일 유효성 검증
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch("/api/templates/upload-image", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "이미지 업로드에 실패했습니다.");
  }

  const data = await response.json();
  return {
    success: data.success || true,
    imageUrl: data.imageUrl || data.url,
    thumbnailUrl: data.thumbnailUrl,
    width: data.width,
    height: data.height,
    fileSize: data.fileSize || file.size,
  };
};

/**
 * 파일에서 텍스트 추출 API 호출
 */
export const extractTextFromFile = async (
  file: File,
  token: string
): Promise<{ text: string; metadata?: Record<string, any> }> => {
  // 파일 유효성 검증
  const validation = validateFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/upload/extract-text", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "텍스트 추출에 실패했습니다.");
  }

  const data = await response.json();
  return {
    text: data.text || "",
    metadata: data.metadata,
  };
};

/**
 * 문의 파일 업로드 API 호출
 */
export const uploadInquiryFile = async (
  file: File,
  token: string
): Promise<UploadFileResponse> => {
  return uploadFile(file, {
    endpoint: "/api/upload/inquiry",
    token,
  });
};

/**
 * 파일 삭제 API 호출
 */
export const deleteUploadedFile = async (
  fileUrl: string,
  token: string
): Promise<void> => {
  const response = await fetch("/api/upload/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileUrl }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    if (response.status === 404) {
      throw new Error("파일을 찾을 수 없습니다.");
    }
    throw new Error("파일 삭제에 실패했습니다.");
  }
};

/**
 * 파일 미리보기 URL 생성
 */
export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("이미지 파일이 아닙니다."));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("파일 읽기에 실패했습니다."));
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기에 실패했습니다."));
    reader.readAsDataURL(file);
  });
};
