// API 기본 설정 - 안전한 URL 설정
const getApiBaseUrl = (): string => {
  // 클라이언트 사이드에서는 상대 경로 사용
  if (typeof window !== "undefined") {
    return "";
  }

  // 서버 사이드에서는 절대 URL 필요
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};

const API_BASE_URL = getApiBaseUrl();

// API 응답 타입 정의
export interface LoginRequest {
  username: string;
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
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  agreeSmsMarketing?: boolean;
  agreeEmailMarketing?: boolean;
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
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  agreeSmsMarketing?: boolean;
  agreeEmailMarketing?: boolean;
  agreedAt?: string;
}

export interface UserInfoResponse {
  id: string;
  email: string;
  username?: string;
  name: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  smsMarketingConsent?: boolean;
  emailMarketingConsent?: boolean;
  agreedAt?: string;
  approval_status?: string;
  // SNS 연동 정보
  kakao_user_id?: string;
  naver_user_id?: string;
  google_user_id?: string;
  companyInfo?: {
    companyName?: string;
    ceoName?: string;
    businessNumber?: string;
    companyAddress?: string;
    companyAddressDetail?: string;
    companyPhone?: string;
    toll080Number?: string;
    customerServiceNumber?: string;
    businessType?: string;
    faxNumber?: string;
    homepage?: string;
  };
  taxInvoiceInfo?: {
    email?: string;
    manager?: string;
    contact?: string;
  };
  documents?: {
    businessRegistration?: {
      fileName: string;
      fileUrl: string;
      uploadedAt: string;
    };
    employmentCertificate?: {
      fileName: string;
      fileUrl: string;
      uploadedAt: string;
    };
  };
}

export interface UpdateUserRequest {
  username?: string;
  name?: string;
  email?: string;
  phoneNumber?: string; // 휴대폰 번호 필드 추가
  // 기업정보 필드들
  companyName?: string;
  representativeName?: string;
  businessNumber?: string;
  address?: string;
  phoneNumberCompany?: string;
  customerServiceNumber?: string;
  businessType?: string;
  faxNumber?: string;
  homepage?: string;
  approval_status?: string;
  // 약관 및 마케팅 동의 필드들
  agreeTerms?: boolean;
  agreePrivacy?: boolean;
  smsMarketingConsent?: boolean;
  emailMarketingConsent?: boolean;
}

export interface UpdateUserResponse {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  message: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
  timestamp: string;
}

export interface WithdrawUserRequest {
  password: string;
  reason: string;
  customReason?: string;
}

export interface WithdrawUserResponse {
  message: string;
  timestamp: string;
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

// 사용자 정보 업데이트 API 함수
export async function updateUserInfo(
  updateData: UpdateUserRequest
): Promise<UpdateUserResponse> {
  const token = tokenManager.getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  return apiCall<UpdateUserResponse>("/api/users/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });
}

// 비밀번호 변경 API 함수
export async function changePassword(
  passwordData: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  const token = tokenManager.getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  return apiCall<ChangePasswordResponse>("/api/users/change-password", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(passwordData),
  });
}

// 회원 탈퇴 API 함수
export async function withdrawUser(
  withdrawData: WithdrawUserRequest
): Promise<WithdrawUserResponse> {
  const token = tokenManager.getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  return apiCall<WithdrawUserResponse>("/api/users/withdraw", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(withdrawData),
  });
}

// 리워드 관련 타입 정의
export interface RewardStats {
  totalReward: number;
  directReward: number;
  indirectReward: number;
  pendingReward: number;
  monthlyReward: number;
}

export interface RewardTransaction {
  id: string;
  user_id: number;
  type: string;
  amount: number;
  description: string;
  reference_id: string;
  metadata: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  referredUser?: {
    name: string;
    email: string;
  };
  level?: number;
  referralChain?: Array<{
    name: string;
    email: string;
    level: number;
  }>;
}

export interface Settlement {
  id: string;
  period: string;
  totalReward: number;
  directReward: number;
  indirectReward: number;
  status: string;
  settlementDate: string;
  transactionCount: number;
}

export interface RewardStatsResponse {
  stats: RewardStats;
  message: string;
  timestamp: string;
}

export interface RewardTransactionsResponse {
  transactions: RewardTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message: string;
  timestamp: string;
}

export interface SettlementsResponse {
  settlements: Settlement[];
  message: string;
  timestamp: string;
}

// 리워드 통계 조회 API 함수
export async function getRewardStats(
  startDate?: string,
  endDate?: string
): Promise<RewardStatsResponse> {
  const token = tokenManager.getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const params = new URLSearchParams({ action: "stats" });
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  return apiCall<RewardStatsResponse>(`/api/rewards?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// 리워드 내역 조회 API 함수
export async function getRewardTransactions(
  type: "all" | "direct" | "indirect" = "all",
  page: number = 1,
  limit: number = 20
): Promise<RewardTransactionsResponse> {
  const token = tokenManager.getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  const params = new URLSearchParams({
    type,
    page: page.toString(),
    limit: limit.toString(),
  });

  return apiCall<RewardTransactionsResponse>(
    `/api/rewards?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
}

// 정산 내역 조회 API 함수
export async function getSettlements(): Promise<SettlementsResponse> {
  const token = tokenManager.getAccessToken();
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }

  return apiCall<SettlementsResponse>("/api/settlements", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// 토큰 저장/관리 함수들
export const tokenManager = {
  // localStorage 사용 가능 여부 체크
  isLocalStorageAvailable: (): boolean => {
    try {
      return typeof window !== "undefined" && window.localStorage !== undefined;
    } catch {
      return false;
    }
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    if (!tokenManager.isLocalStorageAvailable()) return;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  getAccessToken: (): string | null => {
    if (!tokenManager.isLocalStorageAvailable()) return null;
    return localStorage.getItem("accessToken");
  },

  getRefreshToken: (): string | null => {
    if (!tokenManager.isLocalStorageAvailable()) return null;
    return localStorage.getItem("refreshToken");
  },

  clearTokens: () => {
    if (!tokenManager.isLocalStorageAvailable()) return;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  isLoggedIn: (): boolean => {
    if (!tokenManager.isLocalStorageAvailable()) return false;
    return !!localStorage.getItem("accessToken");
  },
};
