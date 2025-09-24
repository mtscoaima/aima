/**
 * 세션/로컬스토리지 관련 유틸리티 함수들
 */

export interface StorageOptions {
  expirationMinutes?: number;
  compress?: boolean;
}

export interface StorageItem<T = unknown> {
  data: T;
  timestamp: number;
  expirationMinutes?: number;
}

/**
 * 안전한 JSON 파싱 (에러 시 기본값 반환)
 */
export const safeJsonParse = <T>(jsonString: string | null, defaultValue: T): T => {
  if (!jsonString) {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON 파싱 오류:", error);
    return defaultValue;
  }
};

/**
 * 안전한 JSON 문자열화
 */
export const safeJsonStringify = (data: unknown): string | null => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error("JSON 문자열화 오류:", error);
    return null;
  }
};

/**
 * localStorage에 데이터 저장 (만료시간 지원)
 */
export const setLocalStorageItem = <T>(
  key: string,
  data: T,
  options: StorageOptions = {}
): boolean => {
  try {
    const storageItem: StorageItem<T> = {
      data,
      timestamp: Date.now(),
      expirationMinutes: options.expirationMinutes,
    };

    const jsonString = safeJsonStringify(storageItem);
    if (!jsonString) {
      return false;
    }

    localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.error("localStorage 저장 오류:", error);
    return false;
  }
};

/**
 * localStorage에서 데이터 조회 (만료시간 체크)
 */
export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const jsonString = localStorage.getItem(key);
    if (!jsonString) {
      return defaultValue;
    }

    const storageItem: StorageItem<T> = safeJsonParse(jsonString, { 
      data: defaultValue, 
      timestamp: Date.now() 
    });

    // 만료시간 체크
    if (storageItem.expirationMinutes) {
      const expirationTime = storageItem.timestamp + (storageItem.expirationMinutes * 60 * 1000);
      if (Date.now() > expirationTime) {
        localStorage.removeItem(key);
        return defaultValue;
      }
    }

    return storageItem.data;
  } catch (error) {
    console.error("localStorage 조회 오류:", error);
    return defaultValue;
  }
};

/**
 * localStorage에서 데이터 제거
 */
export const removeLocalStorageItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("localStorage 제거 오류:", error);
    return false;
  }
};

/**
 * sessionStorage에 데이터 저장 (만료시간 지원)
 */
export const setSessionStorageItem = <T>(
  key: string,
  data: T,
  options: StorageOptions = {}
): boolean => {
  try {
    const storageItem: StorageItem<T> = {
      data,
      timestamp: Date.now(),
      expirationMinutes: options.expirationMinutes,
    };

    const jsonString = safeJsonStringify(storageItem);
    if (!jsonString) {
      return false;
    }

    sessionStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.error("sessionStorage 저장 오류:", error);
    return false;
  }
};

/**
 * sessionStorage에서 데이터 조회 (만료시간 체크)
 */
export const getSessionStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const jsonString = sessionStorage.getItem(key);
    if (!jsonString) {
      return defaultValue;
    }

    const storageItem: StorageItem<T> = safeJsonParse(jsonString, { 
      data: defaultValue, 
      timestamp: Date.now() 
    });

    // 만료시간 체크
    if (storageItem.expirationMinutes) {
      const expirationTime = storageItem.timestamp + (storageItem.expirationMinutes * 60 * 1000);
      if (Date.now() > expirationTime) {
        sessionStorage.removeItem(key);
        return defaultValue;
      }
    }

    return storageItem.data;
  } catch (error) {
    console.error("sessionStorage 조회 오류:", error);
    return defaultValue;
  }
};

/**
 * sessionStorage에서 데이터 제거
 */
export const removeSessionStorageItem = (key: string): boolean => {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("sessionStorage 제거 오류:", error);
    return false;
  }
};

/**
 * 액세스 토큰 저장
 */
export const setAccessToken = (token: string): boolean => {
  return setLocalStorageItem("accessToken", token);
};

/**
 * 액세스 토큰 조회
 */
export const getAccessToken = (): string | null => {
  return getLocalStorageItem("accessToken", null);
};

/**
 * 액세스 토큰 제거
 */
export const removeAccessToken = (): boolean => {
  return removeLocalStorageItem("accessToken");
};

/**
 * 리프레시 토큰 저장
 */
export const setRefreshToken = (token: string): boolean => {
  return setLocalStorageItem("refreshToken", token);
};

/**
 * 리프레시 토큰 조회
 */
export const getRefreshToken = (): string | null => {
  return getLocalStorageItem("refreshToken", null);
};

/**
 * 리프레시 토큰 제거
 */
export const removeRefreshToken = (): boolean => {
  return removeLocalStorageItem("refreshToken");
};

/**
 * 모든 인증 토큰 제거
 */
export const clearAuthTokens = (): boolean => {
  const accessResult = removeAccessToken();
  const refreshResult = removeRefreshToken();
  return accessResult && refreshResult;
};

/**
 * 결제 완료 플래그 설정
 */
export const setPaymentCompleted = (timestamp: number = Date.now()): boolean => {
  const paymentResult = setLocalStorageItem("payment_completed", "true");
  const timestampResult = setLocalStorageItem("payment_completed_timestamp", timestamp.toString());
  return paymentResult && timestampResult;
};

/**
 * 결제 완료 플래그 확인
 */
export const isPaymentCompleted = (): { completed: boolean; timestamp?: number; timeDiff?: number } => {
  const completed = getLocalStorageItem("payment_completed", null);
  const timestampString = getLocalStorageItem("payment_completed_timestamp", null);

  if (completed !== "true" || !timestampString) {
    return { completed: false };
  }

  const timestamp = parseInt(timestampString);
  const now = Date.now();
  const timeDiff = now - timestamp;

  return {
    completed: true,
    timestamp,
    timeDiff,
  };
};

/**
 * 결제 완료 플래그 제거
 */
export const clearPaymentCompleted = (): boolean => {
  const paymentResult = removeLocalStorageItem("payment_completed");
  const timestampResult = removeLocalStorageItem("payment_completed_timestamp");
  return paymentResult && timestampResult;
};

/**
 * 템플릿 데이터 임시 저장 (템플릿 선택 시 사용)
 */
export const saveSelectedTemplate = (templateData: unknown): boolean => {
  return setLocalStorageItem("selectedTemplate", templateData);
};

/**
 * 저장된 템플릿 데이터 조회 및 제거
 */
export const getAndClearSelectedTemplate = (): unknown | null => {
  const templateData = getLocalStorageItem("selectedTemplate", null);
  if (templateData) {
    removeLocalStorageItem("selectedTemplate");
  }
  return templateData;
};

/**
 * 초기 메시지 임시 저장
 */
export const saveInitialMessage = (message: string): boolean => {
  return setSessionStorageItem("initialMessage", message, { expirationMinutes: 10 });
};

/**
 * 저장된 초기 메시지 조회 및 제거
 */
export const getAndClearInitialMessage = (): string | null => {
  const message = getSessionStorageItem("initialMessage", null);
  if (message) {
    removeSessionStorageItem("initialMessage");
  }
  return message;
};

/**
 * 초기 파일 정보 임시 저장
 */
export const saveInitialFile = (fileInfo: unknown): boolean => {
  return setSessionStorageItem("initialFile", fileInfo, { expirationMinutes: 10 });
};

/**
 * 저장된 초기 파일 정보 조회 및 제거
 */
export const getAndClearInitialFile = (): unknown | null => {
  const fileInfo = getSessionStorageItem("initialFile", null);
  if (fileInfo) {
    removeSessionStorageItem("initialFile");
  }
  return fileInfo;
};

/**
 * 타겟 마케팅 상태 저장 (결제 전 상태 보존)
 */
export const saveTargetMarketingState = (state: Record<string, unknown>): boolean => {
  const stateWithTimestamp = {
    ...state,
    timestamp: Date.now(),
  };
  return setSessionStorageItem("targetMarketingState", stateWithTimestamp, { expirationMinutes: 5 });
};

/**
 * 타겟 마케팅 상태 복원
 */
export const restoreTargetMarketingState = (): Record<string, unknown> | null => {
  const state = getSessionStorageItem("targetMarketingState", null) as Record<string, unknown> & { timestamp: number } | null;
  
  if (!state) {
    return null;
  }

  // 5분 이내의 상태만 복원
  if (Date.now() - state.timestamp > 5 * 60 * 1000) {
    removeSessionStorageItem("targetMarketingState");
    return null;
  }

  return state;
};

/**
 * 타겟 마케팅 상태 제거
 */
export const clearTargetMarketingState = (): boolean => {
  return removeSessionStorageItem("targetMarketingState");
};

/**
 * localStorage 전체 크기 확인 (KB 단위)
 */
export const getLocalStorageSize = (): number => {
  try {
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += (localStorage[key].length + key.length);
      }
    }
    return Math.round(totalSize / 1024); // KB 단위로 반환
  } catch (error) {
    console.error("localStorage 크기 확인 오류:", error);
    return 0;
  }
};

/**
 * sessionStorage 전체 크기 확인 (KB 단위)
 */
export const getSessionStorageSize = (): number => {
  try {
    let totalSize = 0;
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        totalSize += (sessionStorage[key].length + key.length);
      }
    }
    return Math.round(totalSize / 1024); // KB 단위로 반환
  } catch (error) {
    console.error("sessionStorage 크기 확인 오류:", error);
    return 0;
  }
};

/**
 * 만료된 항목들 정리
 */
export const cleanupExpiredItems = (): { local: number; session: number } => {
  let localCleaned = 0;
  let sessionCleaned = 0;

  // localStorage 정리
  try {
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const jsonString = localStorage.getItem(key);
        if (jsonString) {
          const storageItem = safeJsonParse(jsonString, null) as { expirationMinutes?: number; timestamp: number } | null;
          if (storageItem && storageItem.expirationMinutes) {
            const expirationTime = storageItem.timestamp + (storageItem.expirationMinutes * 60 * 1000);
            if (Date.now() > expirationTime) {
              localStorage.removeItem(key);
              localCleaned++;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("localStorage 정리 오류:", error);
  }

  // sessionStorage 정리
  try {
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        const jsonString = sessionStorage.getItem(key);
        if (jsonString) {
          const storageItem = safeJsonParse(jsonString, null) as { expirationMinutes?: number; timestamp: number } | null;
          if (storageItem && storageItem.expirationMinutes) {
            const expirationTime = storageItem.timestamp + (storageItem.expirationMinutes * 60 * 1000);
            if (Date.now() > expirationTime) {
              sessionStorage.removeItem(key);
              sessionCleaned++;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("sessionStorage 정리 오류:", error);
  }

  return { local: localCleaned, session: sessionCleaned };
};

/**
 * 임시/캐시 데이터 강제 정리
 */
export const cleanupTemporaryData = (): { cleaned: number; freedKB: number } => {
  let cleaned = 0;
  let freedBytes = 0;

  try {
    const keysToRemove: string[] = [];

    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key);
        // 임시 데이터, 캐시 데이터, 오래된 템플릿 데이터 등 정리
        if (key.startsWith('temp_') ||
            key.startsWith('cache_') ||
            key.startsWith('old_') ||
            key.includes('preview_') ||
            key.includes('draft_')) {
          keysToRemove.push(key);
          if (value) {
            freedBytes += (key.length + value.length) * 2; // UTF-16 문자열 크기 계산
          }
        }
      }
    }

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      cleaned++;
    });

    // 만료된 항목도 함께 정리
    const expiredCleanup = cleanupExpiredItems();
    cleaned += expiredCleanup.local;

    return {
      cleaned,
      freedKB: Math.round(freedBytes / 1024)
    };
  } catch (error) {
    console.error("임시 데이터 정리 오류:", error);
    return { cleaned: 0, freedKB: 0 };
  }
};

/**
 * localStorage 용량 확인 및 공간 확보 (용량이 부족할 때 자동 호출)
 */
export const ensureStorageSpace = (requiredKB: number = 100): { success: boolean; message: string } => {
  try {
    const currentSizeKB = getLocalStorageSize();
    const maxSizeKB = 5 * 1024; // 5MB 추정 (브라우저마다 다름)
    const availableKB = maxSizeKB - currentSizeKB;

    // 공간이 충분한 경우
    if (availableKB >= requiredKB) {
      return { success: true, message: "공간 충분" };
    }

    // 자동 정리 시도
    const cleanup = cleanupTemporaryData();

    if (cleanup.freedKB >= requiredKB) {
      return {
        success: true,
        message: `${cleanup.cleaned}개 항목 정리 완료 (${cleanup.freedKB}KB 확보)`
      };
    }

    // 여전히 공간 부족
    return {
      success: false,
      message: `저장 공간이 부족합니다. ${cleanup.cleaned}개 항목을 정리했지만 ${requiredKB}KB가 더 필요합니다. Ctrl+F5로 강력 새로고침해주세요.`
    };

  } catch (error) {
    console.error("저장소 공간 확보 오류:", error);
    return {
      success: false,
      message: "저장소 확인 중 오류가 발생했습니다."
    };
  }
};

/**
 * 안전한 템플릿 저장 (용량 체크 및 자동 정리 포함)
 */
export const safelyStoreTemplate = (templateData: unknown): { success: boolean; message: string } => {
  try {
    // 저장할 데이터 크기 추정
    const jsonString = safeJsonStringify(templateData);
    if (!jsonString) {
      return { success: false, message: "템플릿 데이터 처리에 실패했습니다." };
    }

    const requiredKB = Math.ceil(jsonString.length / 1024);

    // 용량 확보 시도
    const spaceResult = ensureStorageSpace(requiredKB);

    if (!spaceResult.success) {
      return {
        success: false,
        message: "브라우저 저장 공간이 부족합니다. 키보드의 Ctrl+F5를 눌러 강력 새로고침하시거나, Ctrl+Shift+R을 눌러 캐시를 비우고 새로고침해주세요."
      };
    }

    // 실제 저장 시도
    const stored = setLocalStorageItem("selectedTemplate", templateData, { expirationMinutes: 30 });

    if (stored) {
      return { success: true, message: "템플릿이 성공적으로 저장되었습니다." };
    } else {
      return { success: false, message: "템플릿 저장에 실패했습니다." };
    }

  } catch (error) {
    console.error("템플릿 안전 저장 오류:", error);

    if (error instanceof Error && error.name === 'QuotaExceededError') {
      // 최후 정리 시도
      const cleanup = cleanupTemporaryData();
      return {
        success: false,
        message: `저장 공간이 부족합니다. ${cleanup.cleaned}개 항목을 정리했지만 공간이 부족합니다. Ctrl+F5로 강력 새로고침하거나 Ctrl+Shift+R로 캐시를 비우고 새로고침해주세요.`
      };
    }

    return {
      success: false,
      message: "템플릿 저장 중 오류가 발생했습니다."
    };
  }
};

/**
 * 저장소 상태 모니터링
 */
export const getStorageStatus = (): {
  localSizeKB: number;
  sessionSizeKB: number;
  estimatedMaxKB: number;
  usagePercentage: number;
  recommendation: string;
} => {
  const localSizeKB = getLocalStorageSize();
  const sessionSizeKB = getSessionStorageSize();
  const estimatedMaxKB = 5 * 1024; // 5MB 추정
  const usagePercentage = Math.round((localSizeKB / estimatedMaxKB) * 100);

  let recommendation = "정상";
  if (usagePercentage > 90) {
    recommendation = "즉시 정리 필요";
  } else if (usagePercentage > 70) {
    recommendation = "정리 권장";
  } else if (usagePercentage > 50) {
    recommendation = "주의";
  }

  return {
    localSizeKB,
    sessionSizeKB,
    estimatedMaxKB,
    usagePercentage,
    recommendation
  };
};
