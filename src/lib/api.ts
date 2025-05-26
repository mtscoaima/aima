// API 기본 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// API 응답 타입 정의
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  phoneNumber: string;
  companyName?: string;
  ceoName?: string;
  businessNumber?: string;
  companyAddress?: string;
  companyAddressDetail?: string;
  companyPhone?: string;
  toll080Number?: string;
  customerServiceNumber?: string;
  taxInvoiceEmail?: string;
  taxInvoiceManager?: string;
  taxInvoiceContact?: string;
  agreeMarketing?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    phoneNumber: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    phoneNumber: string;
    role: string;
    createdAt: string;
    updatedAt: string;
  };
}

export interface SignupResponse {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInfoResponse {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  message: string;
  error: string;
  status: number;
  timestamp: string;
  path: string;
  fieldErrors?: Array<{
    field: string;
    message: string;
  }>;
}

// 토큰 갱신 함수 (내부용)
async function refreshTokenInternal(): Promise<boolean> {
  const refreshTokenValue = tokenManager.getRefreshToken();
  if (!refreshTokenValue) {
    return false;
  }

  try {
    console.log("API 레벨에서 토큰 갱신 시도...");
    const refreshData: RefreshTokenRequest = {
      refreshToken: refreshTokenValue,
    };

    const response = await fetch(`${API_BASE_URL}/api/users/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(refreshData),
    });

    if (!response.ok) {
      throw new Error("토큰 갱신 실패");
    }

    const result: RefreshTokenResponse = await response.json();

    // 새로운 액세스 토큰 저장 (리프레시 토큰은 그대로 유지)
    tokenManager.setTokens(result.accessToken, refreshTokenValue);

    console.log("API 레벨에서 토큰 갱신 성공");
    return true;
  } catch (err) {
    console.error("API 레벨에서 토큰 갱신 실패:", err);

    // 리프레시 토큰도 만료된 경우 토큰 제거
    tokenManager.clearTokens();
    return false;
  }
}

// API 호출 기본 함수 (토큰 갱신 로직 포함)
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry: boolean = false
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (!response.ok) {
      // 401 에러이고 재시도가 아닌 경우 토큰 갱신 시도
      if (
        response.status === 401 &&
        !isRetry &&
        endpoint !== "/api/users/refresh"
      ) {
        console.log("401 에러 감지, 토큰 갱신 후 재시도...");
        const refreshSuccess = await refreshTokenInternal();

        if (refreshSuccess) {
          // 토큰 갱신 성공 시 Authorization 헤더 업데이트하고 재시도
          const newToken = tokenManager.getAccessToken();
          if (newToken) {
            const retryOptions = {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${newToken}`,
              },
            };
            return apiCall<T>(endpoint, retryOptions, true);
          }
        }
      }

      const errorData: ApiError = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("네트워크 오류가 발생했습니다.");
  }
}

// 로그인 API 함수
export async function loginUser(
  loginData: LoginRequest
): Promise<LoginResponse> {
  return apiCall<LoginResponse>("/api/users/login", {
    method: "POST",
    body: JSON.stringify(loginData),
  });
}

// 회원가입 API 함수
export async function signupUser(
  signupData: SignupRequest
): Promise<SignupResponse> {
  return apiCall<SignupResponse>("/api/users/signup", {
    method: "POST",
    body: JSON.stringify(signupData),
  });
}

// 토큰 갱신 API 함수
export async function refreshToken(
  refreshData: RefreshTokenRequest
): Promise<RefreshTokenResponse> {
  return apiCall<RefreshTokenResponse>("/api/users/refresh", {
    method: "POST",
    body: JSON.stringify(refreshData),
  });
}

// 사용자 정보 조회 API 함수
export async function getUserInfo(): Promise<UserInfoResponse> {
  const token = tokenManager.getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  return apiCall<UserInfoResponse>("/api/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// 토큰 저장/관리 함수들
export const tokenManager = {
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem("accessToken");
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem("refreshToken");
  },

  clearTokens: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  isLoggedIn: (): boolean => {
    return !!localStorage.getItem("accessToken");
  },
};
