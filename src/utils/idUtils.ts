/**
 * ID 생성 및 랜덤 관련 유틸리티 함수들
 */

/**
 * 랜덤 문자열 생성 (영문 소문자 + 숫자)
 */
export const generateRandomString = (length: number = 9): string => {
  return Math.random().toString(36).substr(2, length);
};

/**
 * 고유 ID 생성 (타임스탬프 + 랜덤 문자열)
 */
export const generateUniqueId = (prefix?: string): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = generateRandomString(5);
  const id = `${timestamp}${randomPart}`;
  
  return prefix ? `${prefix}-${id}` : id;
};

/**
 * 사용자 메시지용 고유 ID 생성
 */
export const generateUserMessageId = (): string => {
  return generateUniqueId("user");
};

/**
 * 어시스턴트 메시지용 고유 ID 생성
 */
export const generateAssistantMessageId = (): string => {
  return generateUniqueId("assistant");
};

/**
 * 템플릿용 고유 ID 생성
 */
export const generateTemplateId = (): string => {
  return generateUniqueId("template");
};

/**
 * 캠페인용 고유 ID 생성
 */
export const generateCampaignId = (): string => {
  return generateUniqueId("campaign");
};

/**
 * 이미지 편집용 고유 ID 생성
 */
export const generateEditedImageId = (): string => {
  return generateUniqueId("edited");
};

/**
 * 에러 메시지용 고유 ID 생성
 */
export const generateErrorMessageId = (): string => {
  return generateUniqueId("error");
};

/**
 * 파일 업로드용 고유 ID 생성
 */
export const generateFileId = (): string => {
  return generateUniqueId("file");
};

/**
 * 트랜잭션용 고유 ID 생성
 */
export const generateTransactionId = (): string => {
  return generateUniqueId("txn");
};

/**
 * UUID v4 형식 생성 (crypto API 사용)
 */
export const generateUuidV4 = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * 숫자형 ID 생성 (타임스탬프 기반)
 */
export const generateNumericId = (): number => {
  return Date.now() + Math.floor(Math.random() * 1000);
};

/**
 * 짧은 코드 생성 (영문 대문자 + 숫자, 기본 6자리)
 */
export const generateShortCode = (length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * 초대 코드 생성 (8자리 영문 대문자 + 숫자)
 */
export const generateInviteCode = (): string => {
  return generateShortCode(8);
};

/**
 * 쿠폰 코드 생성 (12자리 영문 대문자 + 숫자, 하이픈 포함)
 */
export const generateCouponCode = (): string => {
  const part1 = generateShortCode(4);
  const part2 = generateShortCode(4);
  const part3 = generateShortCode(4);
  
  return `${part1}-${part2}-${part3}`;
};

/**
 * API 키 생성 (32자리 영문 소문자 + 숫자)
 */
export const generateApiKey = (): string => {
  return generateRandomString(32);
};

/**
 * 세션 ID 생성
 */
export const generateSessionId = (): string => {
  return generateUniqueId("session");
};

/**
 * 요청 ID 생성 (API 요청 추적용)
 */
export const generateRequestId = (): string => {
  return generateUniqueId("req");
};

/**
 * 배치 ID 생성 (배치 작업용)
 */
export const generateBatchId = (): string => {
  return generateUniqueId("batch");
};

/**
 * 랜덤 정수 생성 (min <= result <= max)
 */
export const generateRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * 랜덤 부동소수점 생성 (min <= result < max)
 */
export const generateRandomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * 배열에서 랜덤 요소 선택
 */
export const getRandomArrayElement = <T>(arr: T[]): T | undefined => {
  if (arr.length === 0) {
    return undefined;
  }
  
  const randomIndex = generateRandomInt(0, arr.length - 1);
  return arr[randomIndex];
};

/**
 * 배열을 랜덤하게 셔플
 */
export const shuffleArray = <T>(arr: T[]): T[] => {
  const shuffled = [...arr];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = generateRandomInt(0, i);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
};

/**
 * 랜덤 색상 생성 (HEX 형식)
 */
export const generateRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  
  return getRandomArrayElement(colors) || '#000000';
};

/**
 * 랜덤 불린값 생성 (50% 확률)
 */
export const generateRandomBoolean = (): boolean => {
  return Math.random() < 0.5;
};

/**
 * 가중치가 있는 랜덤 선택
 */
export const getWeightedRandomChoice = <T>(
  items: T[], 
  weights: number[]
): T | undefined => {
  if (items.length !== weights.length || items.length === 0) {
    return undefined;
  }
  
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  return items[items.length - 1];
};

/**
 * 고유 ID인지 검증 (타임스탬프 + 랜덤 문자열 형식)
 */
export const isValidUniqueId = (id: string, prefix?: string): boolean => {
  if (prefix) {
    if (!id.startsWith(`${prefix}-`)) {
      return false;
    }
    id = id.substring(prefix.length + 1);
  }
  
  // 타임스탬프(최소 8자리) + 랜덤 문자열(5자리) = 최소 13자리
  return id.length >= 13 && /^[a-z0-9]+$/.test(id);
};

/**
 * UUID v4 형식인지 검증
 */
export const isValidUuidV4 = (uuid: string): boolean => {
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(uuid);
};

/**
 * 랜덤 지연 시간 생성 (밀리초)
 */
export const generateRandomDelay = (minMs: number, maxMs: number): number => {
  return generateRandomInt(minMs, maxMs);
};

/**
 * 랜덤 지연 실행
 */
export const randomDelay = async (minMs: number, maxMs: number): Promise<void> => {
  const delayMs = generateRandomDelay(minMs, maxMs);
  return new Promise(resolve => setTimeout(resolve, delayMs));
};
