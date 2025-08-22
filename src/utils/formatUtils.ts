/**
 * 포맷팅 관련 유틸리티 함수들
 */

/**
 * 숫자를 3자리마다 콤마(,)가 있는 형식으로 포맷팅
 */
export const formatNumberWithCommas = (num: number): string => {
  return num.toLocaleString();
};

/**
 * 크레딧 숫자를 "1,000크레딧" 형식으로 포맷팅
 */
export const formatCredits = (credits: number): string => {
  return `${formatNumberWithCommas(credits)}크레딧`;
};

/**
 * 가격을 "10,000원" 형식으로 포맷팅
 */
export const formatPrice = (price: number): string => {
  return `${formatNumberWithCommas(price)}원`;
};

/**
 * 파일 크기를 바이트에서 KB로 변환하여 포맷팅
 */
export const formatFileSizeKB = (sizeInBytes: number): string => {
  const sizeInKB = Math.round(sizeInBytes / 1024);
  return `${sizeInKB}KB`;
};

/**
 * 파일 크기를 바이트에서 MB로 변환하여 포맷팅
 */
export const formatFileSizeMB = (sizeInBytes: number): string => {
  const sizeInMB = Math.round(sizeInBytes / (1024 * 1024));
  return `${sizeInMB}MB`;
};

/**
 * 파일 크기를 적절한 단위(B, KB, MB, GB)로 자동 포맷팅
 */
export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes}B`;
  }
  
  if (sizeInBytes < 1024 * 1024) {
    return formatFileSizeKB(sizeInBytes);
  }
  
  if (sizeInBytes < 1024 * 1024 * 1024) {
    return formatFileSizeMB(sizeInBytes);
  }
  
  const sizeInGB = Math.round(sizeInBytes / (1024 * 1024 * 1024));
  return `${sizeInGB}GB`;
};

/**
 * 백분율을 포맷팅 (소수점 1자리)
 */
export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return "0.0%";
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}%`;
};

/**
 * 텍스트를 지정된 길이로 자르고 말줄임표(...) 추가
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + "...";
};

/**
 * 전화번호를 XXX-XXXX-XXXX 형식으로 포맷팅
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // 숫자만 추출
  const numbers = phoneNumber.replace(/\D/g, "");
  
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  }
  
  if (numbers.length === 10) {
    return numbers.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  }
  
  return phoneNumber;
};

/**
 * 사업자등록번호를 XXX-XX-XXXXX 형식으로 포맷팅
 */
export const formatBusinessNumber = (businessNumber: string): string => {
  const numbers = businessNumber.replace(/\D/g, "");
  
  if (numbers.length === 10) {
    return numbers.replace(/(\d{3})(\d{2})(\d{5})/, "$1-$2-$3");
  }
  
  return businessNumber;
};

/**
 * 이메일 주소를 마스킹 (앞 2자리와 @ 뒤는 보이고 가운데는 ***으로)
 */
export const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split("@");
  
  if (!localPart || !domain) {
    return email;
  }
  
  if (localPart.length <= 2) {
    return `${localPart}***@${domain}`;
  }
  
  const maskedLocal = localPart.substring(0, 2) + "***" + localPart.substring(localPart.length - 1);
  return `${maskedLocal}@${domain}`;
};

/**
 * 전화번호 마스킹 (뒷 4자리만 ***으로)
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.length < 4) {
    return phoneNumber;
  }
  
  const masked = phoneNumber.substring(0, phoneNumber.length - 4) + "****";
  return masked;
};

/**
 * 문자열에서 HTML 태그 제거
 */
export const stripHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, "");
};

/**
 * 줄바꿈 문자를 <br> 태그로 변환
 */
export const convertNewLinesToBr = (text: string): string => {
  return text.replace(/\n/g, "<br>");
};

/**
 * <br> 태그를 줄바꿈 문자로 변환
 */
export const convertBrToNewLines = (html: string): string => {
  return html.replace(/<br\s*\/?>/gi, "\n");
};

/**
 * 카드 번호를 마스킹 (앞 4자리와 뒤 4자리만 보이고 가운데는 ****으로)
 */
export const maskCardNumber = (cardNumber: string): string => {
  const numbers = cardNumber.replace(/\D/g, "");
  
  if (numbers.length !== 16) {
    return cardNumber;
  }
  
  return `${numbers.substring(0, 4)}-****-****-${numbers.substring(12)}`;
};

/**
 * 숫자를 K, M, B 단위로 축약하여 표시 (예: 1200 -> 1.2K)
 */
export const formatNumberShort = (num: number): string => {
  if (num < 1000) {
    return num.toString();
  }
  
  if (num < 1000000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  if (num < 1000000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  
  return `${(num / 1000000000).toFixed(1)}B`;
};

/**
 * 배열을 쉼표로 구분된 문자열로 변환
 */
export const formatArrayToString = (arr: string[], separator: string = ", "): string => {
  return arr.join(separator);
};

/**
 * 객체를 쿼리 스트링으로 변환
 */
export const formatObjectToQueryString = (obj: Record<string, unknown>): string => {
  const params = new URLSearchParams();
  
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      params.append(key, String(value));
    }
  });
  
  return params.toString();
};
