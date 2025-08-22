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
