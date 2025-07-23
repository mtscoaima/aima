"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  loginUser,
  signupUser,
  refreshToken,
  getUserInfo,
  tokenManager,
} from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
  approval_status?: string;
  lastLoginAt?: string;
  referralCode?: string;
  payment_mode?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (loginData: LoginRequest) => Promise<void>;
  signup: (signupData: SignupRequest) => Promise<void>;
  logout: () => void;
  error: string | null;
  checkAuth: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 사용자 정보 캐시 관리
const userCacheManager = {
  // localStorage 사용 가능 여부 체크
  isLocalStorageAvailable: (): boolean => {
    try {
      return typeof window !== "undefined" && window.localStorage !== undefined;
    } catch {
      return false;
    }
  },

  setUser: (user: User) => {
    if (!userCacheManager.isLocalStorageAvailable()) return;
    localStorage.setItem("cachedUser", JSON.stringify(user));
  },

  getUser: (): User | null => {
    if (!userCacheManager.isLocalStorageAvailable()) return null;
    try {
      const cachedUser = localStorage.getItem("cachedUser");
      return cachedUser ? JSON.parse(cachedUser) : null;
    } catch {
      return null;
    }
  },

  clearUser: () => {
    if (!userCacheManager.isLocalStorageAvailable()) return;
    localStorage.removeItem("cachedUser");
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  // 사용자 정보 업데이트 함수 (캐시도 함께 업데이트)
  const updateUser = useCallback((userData: User | null) => {
    setUser(userData);
    if (userData) {
      userCacheManager.setUser(userData);
    } else {
      userCacheManager.clearUser();
    }
  }, []);

  // 토큰 갱신 함수
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    const refreshTokenValue = tokenManager.getRefreshToken();
    if (!refreshTokenValue) {
      return false;
    }

    try {
      const refreshData: RefreshTokenRequest = {
        refreshToken: refreshTokenValue,
      };

      const response: RefreshTokenResponse = await refreshToken(refreshData);

      // 새로운 액세스 토큰 저장 (리프레시 토큰은 그대로 유지)
      tokenManager.setTokens(response.accessToken, refreshTokenValue);

      // 사용자 정보 업데이트
      updateUser(response.user);
      setError(null);

      return true;
    } catch (err) {
      console.error("토큰 갱신 실패:", err);

      // 리프레시 토큰도 만료된 경우 로그아웃 처리
      tokenManager.clearTokens();
      updateUser(null);
      setError(null);
      return false;
    }
  }, [updateUser]);

  // 사용자 정보 확인 함수 (토큰 갱신 로직 포함)
  const checkAuth = async () => {
    // 토큰이 없으면 즉시 로딩 완료
    if (!tokenManager.isLoggedIn()) {
      setIsLoading(false);
      return;
    }

    // 캐시된 사용자 정보가 있으면 먼저 설정 (빠른 초기 렌더링)
    const cachedUser = userCacheManager.getUser();
    if (cachedUser) {
      setUser(cachedUser);
      setIsLoading(false);
    }

    try {
      // 서버에서 최신 사용자 정보 조회
      const userInfo = await getUserInfo();
      updateUser(userInfo);
      setError(null);
    } catch (err) {
      console.error("사용자 정보 조회 실패:", err);

      // 401 에러인 경우 토큰 갱신 시도
      if (err instanceof Error && err.message.includes("401")) {
        const refreshSuccess = await refreshAccessToken();

        if (refreshSuccess) {
          // 토큰 갱신 성공 시 다시 사용자 정보 조회 시도
          try {
            const userInfo = await getUserInfo();
            updateUser(userInfo);
            setError(null);
          } catch (retryErr) {
            console.error("토큰 갱신 후 사용자 정보 조회 실패:", retryErr);
            tokenManager.clearTokens();
            updateUser(null);
            setError(null);
          }
        }
      } else {
        // 다른 에러의 경우
        if (err instanceof Error) {
          const errorMessage = err.message.toLowerCase();
          if (
            errorMessage.includes("404") ||
            errorMessage.includes("unauthorized") ||
            errorMessage.includes("인증") ||
            errorMessage.includes("not found")
          ) {
            // 토큰이 유효하지 않은 경우 로그아웃 처리
            tokenManager.clearTokens();
            updateUser(null);
            setError(null);
          } else {
            // 다른 에러의 경우 에러 메시지 설정 (캐시된 사용자 정보는 유지)
            if (!cachedUser) {
              setError("사용자 정보를 불러올 수 없습니다.");
            }
          }
        } else {
          tokenManager.clearTokens();
          updateUser(null);
          setError(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 토큰 확인 및 사용자 정보 조회
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 토큰 만료 전 자동 갱신 (55분마다)
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(async () => {
      await refreshAccessToken();
    }, 55 * 60 * 1000); // 55분

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshAccessToken]);

  const login = async (loginData: LoginRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response: LoginResponse = await loginUser(loginData);

      // 토큰 저장
      tokenManager.setTokens(response.accessToken, response.refreshToken);

      // 사용자 정보 설정 (캐시도 함께 업데이트)
      updateUser(response.user);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "로그인에 실패했습니다.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (signupData: SignupRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      await signupUser(signupData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "회원가입에 실패했습니다.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    tokenManager.clearTokens();
    updateUser(null);
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    logout,
    error,
    checkAuth,
    refreshAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
