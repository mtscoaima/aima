/**
 * 검증 관련 유틸리티 함수들
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileValidationOptions {
  maxSizeKB?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

/**
 * 빈 문자열 또는 공백만 있는 문자열인지 검증
 */
export const isEmptyOrWhitespace = (value: string | null | undefined): boolean => {
  return !value || value.trim().length === 0;
};

/**
 * 이메일 형식 검증
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 전화번호 형식 검증 (한국 휴대폰 번호)
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // 숫자만 추출
  const numbers = phoneNumber.replace(/\D/g, "");
  
  // 010, 011, 016, 017, 018, 019로 시작하는 11자리 번호
  const phoneRegex = /^(010|011|016|017|018|019)\d{8}$/;
  return phoneRegex.test(numbers);
};

/**
 * 사업자등록번호 형식 검증 (10자리)
 */
export const isValidBusinessNumber = (businessNumber: string): boolean => {
  const numbers = businessNumber.replace(/\D/g, "");
  return numbers.length === 10 && /^\d{10}$/.test(numbers);
};

/**
 * 패스워드 강도 검증
 */
export const isValidPassword = (password: string): ValidationResult => {
  if (password.length < 8) {
    return {
      isValid: false,
      error: "비밀번호는 8자 이상이어야 합니다.",
    };
  }

  if (password.length > 20) {
    return {
      isValid: false,
      error: "비밀번호는 20자 이하여야 합니다.",
    };
  }

  // 영문, 숫자, 특수문자 중 2가지 이상 조합
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const criteria = [hasLower || hasUpper, hasNumber, hasSpecial];
  const metCriteria = criteria.filter(Boolean).length;

  if (metCriteria < 2) {
    return {
      isValid: false,
      error: "영문, 숫자, 특수문자 중 2가지 이상 조합이 필요합니다.",
    };
  }

  return { isValid: true };
};

/**
 * 파일 크기 검증 (KB 단위)
 */
export const isValidFileSize = (file: File, maxSizeKB: number): ValidationResult => {
  const fileSizeKB = Math.round(file.size / 1024);

  if (fileSizeKB > maxSizeKB) {
    return {
      isValid: false,
      error: `파일 크기가 너무 큽니다. 현재: ${fileSizeKB}KB, 최대: ${maxSizeKB}KB`,
    };
  }

  return { isValid: true };
};

/**
 * 파일 타입 검증
 */
export const isValidFileType = (file: File, allowedTypes: string[]): ValidationResult => {
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "지원하지 않는 파일 형식입니다.",
    };
  }

  return { isValid: true };
};

/**
 * 파일 확장자 검증
 */
export const isValidFileExtension = (file: File, allowedExtensions: string[]): ValidationResult => {
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `지원하지 않는 파일 확장자입니다. 허용된 확장자: ${allowedExtensions.join(', ')}`,
    };
  }

  return { isValid: true };
};

/**
 * 종합적인 파일 검증
 */
export const validateFile = (file: File, options: FileValidationOptions = {}): ValidationResult => {
  const {
    maxSizeKB = 10 * 1024, // 기본 10MB
    allowedTypes = [],
    allowedExtensions = []
  } = options;

  // 파일 크기 검증
  const sizeValidation = isValidFileSize(file, maxSizeKB);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // 파일 타입 검증
  if (allowedTypes.length > 0) {
    const typeValidation = isValidFileType(file, allowedTypes);
    if (!typeValidation.isValid) {
      return typeValidation;
    }
  }

  // 파일 확장자 검증
  if (allowedExtensions.length > 0) {
    const extensionValidation = isValidFileExtension(file, allowedExtensions);
    if (!extensionValidation.isValid) {
      return extensionValidation;
    }
  }

  return { isValid: true };
};

/**
 * 이미지 파일 검증 (300KB 이하, 이미지 타입만)
 */
export const validateImageFile = (file: File): ValidationResult => {
  return validateFile(file, {
    maxSizeKB: 300,
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
  });
};

/**
 * 문서 파일 검증 (10MB 이하)
 */
export const validateDocumentFile = (file: File): ValidationResult => {
  return validateFile(file, {
    maxSizeKB: 10 * 1024,
    allowedTypes: [
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  });
};

/**
 * 문자열 길이 검증
 */
export const isValidStringLength = (
  value: string,
  minLength: number,
  maxLength: number
): ValidationResult => {
  const length = value.trim().length;

  if (length < minLength) {
    return {
      isValid: false,
      error: `최소 ${minLength}자 이상 입력해주세요. (현재: ${length}자)`,
    };
  }

  if (length > maxLength) {
    return {
      isValid: false,
      error: `최대 ${maxLength}자까지 입력 가능합니다. (현재: ${length}자)`,
    };
  }

  return { isValid: true };
};

/**
 * 숫자 범위 검증
 */
export const isValidNumberRange = (
  value: number,
  min: number,
  max: number
): ValidationResult => {
  if (value < min) {
    return {
      isValid: false,
      error: `최솟값은 ${min}입니다. (현재: ${value})`,
    };
  }

  if (value > max) {
    return {
      isValid: false,
      error: `최댓값은 ${max}입니다. (현재: ${value})`,
    };
  }

  return { isValid: true };
};

/**
 * URL 형식 검증
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 한국어만 포함하는지 검증
 */
export const isKoreanOnly = (text: string): boolean => {
  const koreanRegex = /^[가-힣\s]+$/;
  return koreanRegex.test(text);
};

/**
 * 영어만 포함하는지 검증
 */
export const isEnglishOnly = (text: string): boolean => {
  const englishRegex = /^[a-zA-Z\s]+$/;
  return englishRegex.test(text);
};

/**
 * 숫자만 포함하는지 검증
 */
export const isNumericOnly = (text: string): boolean => {
  const numericRegex = /^\d+$/;
  return numericRegex.test(text);
};

/**
 * 금액 입력값 검증 (1원 이상, 1억원 이하)
 */
export const isValidAmount = (amount: number): ValidationResult => {
  if (amount < 1) {
    return {
      isValid: false,
      error: "금액은 1원 이상이어야 합니다.",
    };
  }

  if (amount > 100000000) {
    return {
      isValid: false,
      error: "금액은 1억원 이하여야 합니다.",
    };
  }

  return { isValid: true };
};

/**
 * 카드 승인 금액 검증 (1만원~1000만원)
 */
export const isValidCardAmount = (amount: number): ValidationResult => {
  return isValidNumberRange(amount, 1, 1000);
};
