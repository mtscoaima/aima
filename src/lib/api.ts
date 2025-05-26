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

// API 호출 기본 함수
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
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
