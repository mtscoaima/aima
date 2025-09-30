"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface KakaoAuthObject {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

interface KakaoAuthError {
  error: string;
  error_description?: string;
}

declare global {
  interface Window {
    Kakao: {
      isInitialized(): boolean;
      init(appKey: string): void;
      Auth: {
        login(options: {
          success: (authObj: KakaoAuthObject) => void;
          fail: (err: KakaoAuthError) => void;
        }): void;
        authorize(options: {
          redirectUri: string;
          success: (authObj: KakaoAuthObject) => void;
          fail: (err: KakaoAuthError) => void;
        }): void;
      };
    };
  }
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, isAuthenticated, user } = useAuth();
  const router = useRouter();

  // 카카오 SDK 초기화
  useEffect(() => {
    const initKakaoSDK = async () => {
      if (typeof window === "undefined") return;

      // 카카오 SDK 로딩 대기
      let retryCount = 0;
      const maxRetries = 100; // 10초 대기 (100ms * 100)

      const waitForKakaoSDK = () => {
        return new Promise<void>((resolve, reject) => {
          const checkSDK = () => {
            if (window.Kakao && window.Kakao.init !== undefined) {
              resolve();
              return;
            }

            retryCount++;
            if (retryCount >= maxRetries) {
              console.error("❌ 카카오 SDK 로딩 타임아웃");
              reject(new Error("카카오 SDK 로딩 실패"));
              return;
            }

            setTimeout(checkSDK, 100);
          };

          checkSDK();
        });
      };

      try {
        await waitForKakaoSDK();

        // 카카오 SDK 초기화
        // 이미 초기화되어 있으면 건너뛰기
        if (!window.Kakao.isInitialized()) {
          // 환경변수에서 카카오 앱키 가져오기
          const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

          if (kakaoAppKey) {
            window.Kakao.init(kakaoAppKey);
          } else {
            // 환경변수가 없으면 서버에서 앱키 가져오기
            try {
              const response = await fetch("/api/auth/kakao-auth-url");
              if (!response.ok) {
                console.warn("⚠️ 카카오 앱키가 설정되지 않았습니다.");
              }
            } catch (error) {
              console.warn("⚠️ 카카오 설정 확인 실패:", error);
            }
          }
        }
      } catch (error) {
        console.error("❌ 카카오 SDK 초기화 실패:", error);
      }
    };

    // 컴포넌트 마운트 후 지연을 두고 초기화
    const timer = setTimeout(initKakaoSDK, 200);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // 이미 로그인된 사용자는 대시보드로 리다이렉트
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "ADMIN") {
        router.replace("/admin/user-management");
      } else if (user.role === "SALESPERSON") {
        router.replace("/salesperson/referrals");
      } else {
        router.replace("/my-site/advertiser/dashboard");
      }
    }
  }, [isAuthenticated, user, router]);

  // 로그인된 사용자에게는 로딩 화면 표시
  if (isAuthenticated) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-5 z-[1] relative max-[768px]:min-h-[calc(100vh-100px)] max-[768px]:p-4 max-[480px]:min-h-[calc(100vh-80px)] max-[480px]:p-3">
        <div className="w-full max-w-[440px]">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-md p-8 relative z-[2] my-5 max-[768px]:p-6 max-[480px]:p-5">

            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>이미 로그인되어 있습니다. 대시보드로 이동합니다...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userData = await login({
        username: formData.username,
        password: formData.password,
      });

      // 로그인 성공 시 사용자 역할에 따라 대시보드로 이동
      if (userData.role === "ADMIN") {
        router.push("/admin/user-management");
      } else if (userData.role === "SALESPERSON") {
        router.push("/salesperson/referrals");
      } else {
        router.push("/my-site/advertiser/dashboard");
      }
    } catch (err) {
      // 에러는 AuthContext에서 처리됨
      console.error("로그인 실패:", err);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      // 브라우저 환경 확인
      if (typeof window === "undefined") {
        console.error("❌ 브라우저 환경이 아님");
        alert("브라우저 환경에서만 사용 가능합니다.");
        return;
      }

      // 카카오 인증 URL 가져오기
      const authUrlResponse = await fetch("/api/auth/kakao-auth-url");
      if (!authUrlResponse.ok) {
        const errorData = await authUrlResponse.json();
        console.error("❌ 카카오 인증 URL 요청 실패:", errorData);
        alert(errorData.message || "카카오 인증 URL을 가져올 수 없습니다.");
        return;
      }

      const { authUrl } = await authUrlResponse.json();

      // 카카오 로그인 팝업 열기
      const authCode = await new Promise<string>((resolve, reject) => {
        const popup = window.open(
          authUrl + "&prompt=login",
          "kakaoLogin",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        if (!popup) {
          reject(new Error("팝업이 차단되었습니다. 팝업 차단을 해제해주세요."));
          return;
        }

        // 팝업에서 코드 받기
        const checkClosed = setInterval(() => {
          try {
            if (popup.closed) {
              clearInterval(checkClosed);
              reject(new Error("로그인이 취소되었습니다."));
              return;
            }

            // URL에서 code 파라미터 확인
            const url = popup.location.href;
            if (url.includes("code=")) {
              const urlParams = new URLSearchParams(popup.location.search);
              const code = urlParams.get("code");
              if (code) {
                popup.close();
                clearInterval(checkClosed);
                resolve(code);
              }
            } else if (url.includes("error=")) {
              const urlParams = new URLSearchParams(popup.location.search);
              const error = urlParams.get("error");
              const errorDescription = urlParams.get("error_description");
              popup.close();
              clearInterval(checkClosed);
              reject(
                new Error(`카카오 로그인 오류: ${error} - ${errorDescription}`)
              );
            }
          } catch {
            // 팝업이 다른 도메인에 있을 때는 접근할 수 없음 (정상)
            // CORS 오류는 무시
          }
        }, 1000);

        // 타임아웃 설정 (5분)
        setTimeout(() => {
          if (!popup.closed) {
            popup.close();
            clearInterval(checkClosed);
            reject(new Error("로그인 시간이 초과되었습니다."));
          }
        }, 300000);
      });

      // 인증 코드로 액세스 토큰 요청
      const tokenResponse = await fetch("/api/auth/kakao-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: authCode }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        console.error("❌ 카카오 토큰 요청 실패:", errorData);
        throw new Error(errorData.message || "토큰 요청에 실패했습니다.");
      }

      const tokenData = await tokenResponse.json();

      // 카카오 로그인 API 호출
      const response = await fetch("/api/auth/kakao-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: tokenData.access_token,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.needsSignup && data.redirectToSignup) {
          // 신규 사용자 - 회원가입 페이지로 리다이렉트
          const socialUserId = data.socialUserId || "";
          router.push(
            `/signup?social=kakao&socialUserId=${encodeURIComponent(
              socialUserId
            )}`
          );
        } else {
          // 기존 사용자 - 로그인 처리
          const { tokenManager } = await import("@/lib/api");
          tokenManager.setTokens(data.accessToken, data.refreshToken);

          // 사용자 역할에 따라 적절한 페이지로 리다이렉트
          const userRole = data.user?.role;
          if (userRole === "ADMIN") {
            window.location.href = "/admin/user-management";
          } else if (userRole === "SALESPERSON") {
            window.location.href = "/salesperson/referrals";
          } else {
            window.location.href = "/my-site/advertiser/dashboard";
          }
        }
      } else {
        console.error("❌ 카카오 로그인 API 오류:", data);
        alert(data.message || "카카오 로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ 카카오 로그인 오류:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("카카오 로그인 중 오류가 발생했습니다.");
      }
    }
  };

  const handleNaverLogin = async () => {
    try {
      // 네이버 인증 URL 가져오기
      const authUrlResponse = await fetch("/api/auth/naver-auth-url");
      if (!authUrlResponse.ok) {
        throw new Error("네이버 인증 URL을 가져올 수 없습니다");
      }
      const { authUrl, state } = await authUrlResponse.json();

      // 네이버 로그인 팝업 열기
      const authResult = await new Promise<{ code: string; state: string }>(
        (resolve, reject) => {
          // 팝업 창으로 네이버 로그인
          const popup = window.open(
            authUrl,
            "naverLogin",
            "width=500,height=600,scrollbars=yes,resizable=yes"
          );

          if (!popup) {
            console.error("❌ [네이버 OAuth] 팝업이 차단되었습니다");
            reject(new Error("팝업이 차단되었습니다"));
            return;
          }

          // 팝업에서 코드 받기
          const checkClosed = setInterval(() => {
            try {
              if (popup.closed) {
                clearInterval(checkClosed);
                reject(new Error("로그인이 취소되었습니다"));
                return;
              }

              // URL에서 code와 state 파라미터 확인
              const url = popup.location.href;

              if (url.includes("code=")) {
                const urlParams = new URLSearchParams(popup.location.search);
                const code = urlParams.get("code");
                const returnedState = urlParams.get("state");

                if (code && returnedState && returnedState === state) {
                  popup.close();
                  clearInterval(checkClosed);
                  resolve({ code, state: returnedState });
                }
              } else if (url.includes("error=")) {
                console.error("❌ [네이버 OAuth] 인증 에러 발생:", url);
                const urlParams = new URLSearchParams(popup.location.search);
                const error = urlParams.get("error");
                const errorDescription = urlParams.get("error_description");

                popup.close();
                clearInterval(checkClosed);
                reject(
                  new Error(
                    `네이버 로그인 에러: ${error} - ${errorDescription}`
                  )
                );
              }
            } catch {
              // 팝업이 다른 도메인에 있을 때는 접근할 수 없음 (정상)
            }
          }, 1000);
        }
      );

      // 인증 코드로 액세스 토큰 요청
      const tokenResponse = await fetch("/api/auth/naver-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: authResult.code,
          state: authResult.state,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("❌ [네이버 토큰] 요청 실패:", errorText);
        throw new Error(`토큰 요청 실패: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      // 네이버 로그인 API 호출
      const response = await fetch("/api/auth/naver-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: tokenData.access_token,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.needsSignup && data.redirectToSignup) {
          // 신규 사용자 - 회원가입 페이지로 리다이렉트
          const socialUserId = data.socialUserId || "";
          router.push(
            `/signup?social=naver&socialUserId=${encodeURIComponent(
              socialUserId
            )}`
          );
        } else {
          // 기존 사용자 - 로그인 처리
          const { tokenManager } = await import("@/lib/api");
          tokenManager.setTokens(data.accessToken, data.refreshToken);

          // 사용자 역할에 따라 적절한 페이지로 리다이렉트
          const userRole = data.user?.role;
          if (userRole === "ADMIN") {
            window.location.href = "/admin/user-management";
          } else if (userRole === "SALESPERSON") {
            window.location.href = "/salesperson/referrals";
          } else {
            window.location.href = "/my-site/advertiser/dashboard";
          }
        }
      } else {
        console.error("❌ [네이버 로그인] API 오류:", data);
        alert(data.message || "네이버 로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("❌ [네이버 로그인] 전체 에러:", error);
      console.error("❌ [네이버 로그인] 에러 타입:", typeof error);
      console.error(
        "❌ [네이버 로그인] 에러 스택:",
        error instanceof Error ? error.stack : "스택 없음"
      );

      if (error instanceof Error) {
        alert(`네이버 로그인 에러: ${error.message}`);
      } else {
        alert("네이버 로그인 중 알 수 없는 오류가 발생했습니다.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // 구글 인증 URL 가져오기
      const authUrlResponse = await fetch("/api/auth/google-auth-url");
      if (!authUrlResponse.ok) {
        throw new Error("구글 인증 URL을 가져올 수 없습니다");
      }
      const { authUrl } = await authUrlResponse.json();

      // 구글 로그인 팝업 열기
      const authResult = await new Promise<{ code: string }>(
        (resolve, reject) => {
          // 팝업 창으로 구글 로그인
          const popup = window.open(
            authUrl,
            "googleLogin",
            "width=500,height=600,scrollbars=yes,resizable=yes"
          );

          if (!popup) {
            reject(new Error("팝업이 차단되었습니다"));
            return;
          }

          // 팝업에서 코드 받기
          const checkClosed = setInterval(() => {
            try {
              if (popup.closed) {
                clearInterval(checkClosed);
                reject(new Error("로그인이 취소되었습니다"));
                return;
              }

              // URL에서 code 파라미터 확인
              const url = popup.location.href;
              if (url.includes("code=")) {
                const urlParams = new URLSearchParams(popup.location.search);
                const code = urlParams.get("code");
                if (code) {
                  popup.close();
                  clearInterval(checkClosed);
                  resolve({ code });
                }
              }
            } catch {
              // 팝업이 다른 도메인에 있을 때는 접근할 수 없음 (정상)
            }
          }, 1000);
        }
      );

      // 인증 코드로 액세스 토큰 요청
      const tokenResponse = await fetch("/api/auth/google-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: authResult.code }),
      });

      if (!tokenResponse.ok) {
        throw new Error("토큰 요청 실패");
      }

      const tokenData = await tokenResponse.json();

      // 구글 로그인 API 호출
      const response = await fetch("/api/auth/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: tokenData.access_token,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.needsSignup && data.redirectToSignup) {
          // 신규 사용자 - 회원가입 페이지로 리다이렉트
          const socialUserId = data.socialUserId || "";
          router.push(
            `/signup?social=google&socialUserId=${encodeURIComponent(
              socialUserId
            )}`
          );
        } else {
          // 기존 사용자 - 로그인 처리
          const { tokenManager } = await import("@/lib/api");
          tokenManager.setTokens(data.accessToken, data.refreshToken);

          // 사용자 역할에 따라 적절한 페이지로 리다이렉트
          const userRole = data.user?.role;
          if (userRole === "ADMIN") {
            window.location.href = "/admin/user-management";
          } else if (userRole === "SALESPERSON") {
            window.location.href = "/salesperson/referrals";
          } else {
            window.location.href = "/my-site/advertiser/dashboard";
          }
        }
      } else {
        console.error("🔴 구글 로그인 API 오류:", data);
        alert(data.message || "구글 로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("🔴 구글 로그인 오류:", error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("구글 로그인 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-5 z-[1] relative max-[768px]:min-h-[calc(100vh-100px)] max-[768px]:p-4 max-[480px]:min-h-[calc(100vh-80px)] max-[480px]:p-3">
      <div className="w-full max-w-[440px]">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1f2937] m-0 max-[768px]:text-xl max-[480px]:text-lg">로그인</h1>
        </div>

        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-md p-8 relative z-[2] my-5 max-[768px]:p-6 max-[480px]:p-5">


          {/* 에러 메시지 */}
          {error && <div className="bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] py-3 px-4 rounded-lg text-sm mb-5 text-center">{error}</div>}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="mb-5">
              <label htmlFor="username" className="block text-sm font-semibold text-[#374151] mb-2">
                아이디
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full py-3.5 px-4 border-2 border-[#e5e7eb] rounded-xl text-base text-[#1f2937] transition-all duration-200 bg-[#fafafa] box-border focus:outline-none focus:border-[#0070f3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] placeholder:text-[#9ca3af] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed max-[480px]:py-3 max-[480px]:px-3.5 max-[480px]:text-[15px]"
                placeholder="아이디를 입력하세요"
                required
                disabled={isLoading}
              />
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="block text-sm font-semibold text-[#374151] mb-2">
                비밀번호
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full py-3.5 px-4 pr-12 border-2 border-[#e5e7eb] rounded-xl text-base text-[#1f2937] transition-all duration-200 bg-[#fafafa] box-border focus:outline-none focus:border-[#0070f3] focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,112,243,0.1)] placeholder:text-[#9ca3af] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed max-[480px]:py-3 max-[480px]:px-3.5 max-[480px]:text-[15px] max-[480px]:pr-10"
                  placeholder="8~20자의 영문, 숫자, 특수기호 조합"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 bg-none border-none cursor-pointer text-[#6b7280] p-1 flex items-center justify-center rounded transition-colors duration-200 hover:text-[#0070f3] hover:bg-[rgba(0,112,243,0.05)] disabled:cursor-not-allowed disabled:text-[#9ca3af] max-[480px]:right-2 max-[480px]:min-w-7 max-[480px]:min-h-7 max-[480px]:p-1"
                  disabled={isLoading}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {showPassword ? (
                      <>
                        <path
                          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                          fill="currentColor"
                        />
                      </>
                    ) : (
                      <>
                        <path
                          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                          fill="currentColor"
                        />
                        <path
                          d="M3 3L21 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="mr-2 scale-110"
                  disabled={isLoading}
                />
                <span className="text-sm text-[#475569]">로그인 유지</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0070f3] text-white border-none py-4 px-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 hover:bg-[#0051cc] hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,112,243,0.3)] disabled:bg-[#9ca3af] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none max-[480px]:py-3.5 max-[480px]:text-[15px]"
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <div className="text-center">
            <span className="text-[#475569] text-sm mr-2">아직 회원이 아니신가요?</span>
            <Link href="/signup" className="text-[#0070f3] no-underline font-semibold text-sm hover:underline hover:text-[#0051cc]">
              회원가입
            </Link>
          </div>

          {/* SNS 로그인 섹션 */}
          <div className="mb-6">
            <div className="text-center my-4">
              <span className="text-[#4b5563] text-sm font-medium">간편 로그인</span>
            </div>

            <div className="flex justify-center items-center gap-4 max-[768px]:gap-3.5 max-[480px]:gap-3">
              <button
                type="button"
                className="w-[52px] h-[52px] border-none rounded-full p-0 cursor-pointer transition-all duration-200 flex items-center justify-center relative border-2 border-transparent bg-[#fee500] text-black hover:bg-[#fdd835] hover:border-[#fdd835] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(254,229,0,0.4)] max-[768px]:w-12 max-[768px]:h-12 max-[480px]:w-11 max-[480px]:h-11"
                onClick={handleKakaoLogin}
                title="카카오로 로그인"
              >
                <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 3.33333C14.6024 3.33333 18.3333 6.30952 18.3333 10C18.3333 12.5476 16.6548 14.7857 14.1667 16.0714L13.3333 18.3333L10.8333 16.6667H10C5.39762 16.6667 1.66667 13.6905 1.66667 10C1.66667 6.30952 5.39762 3.33333 10 3.33333Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <button
                type="button"
                className="w-[52px] h-[52px] border-none rounded-full p-0 cursor-pointer transition-all duration-200 flex items-center justify-center relative border-2 border-transparent bg-[#03c75a] text-white hover:bg-[#02b351] hover:border-[#02b351] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(3,199,90,0.4)] max-[768px]:w-12 max-[768px]:h-12 max-[480px]:w-11 max-[480px]:h-11"
                onClick={handleNaverLogin}
                title="네이버로 로그인"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="max-[768px]:w-5 max-[768px]:h-5 max-[480px]:w-[18px] max-[480px]:h-[18px]">
                  <path
                    d="M16.273 12.845L7.376 0H0V24H7.727V11.155L16.624 24H24V0H16.273V12.845Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <button
                type="button"
                className="w-[52px] h-[52px] border-none rounded-full p-0 cursor-pointer transition-all duration-200 flex items-center justify-center relative border-2 bg-white text-[#1f2937] border-[#e5e7eb] hover:bg-[#f9fafb] hover:border-[#d1d5db] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] max-[768px]:w-12 max-[768px]:h-12 max-[480px]:w-11 max-[480px]:h-11"
                onClick={handleGoogleLogin}
                title="구글로 로그인"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              </button>
            </div>
          </div>


        </div>

        {/* 아이디/비밀번호 찾기 링크 - modal 외부 */}
        <div className="flex items-center justify-center gap-2 mt-5 text-center max-[480px]:mt-4 max-[360px]:mt-3.5 max-[280px]:mt-3">
          <Link href="/auth/find-username" className="text-sm text-[#0070f3] no-underline font-medium hover:underline hover:text-[#0051cc]">
            아이디 찾기
          </Link>
          <span className="text-[#9ca3af] text-sm">|</span>
          <Link href="/auth/find-password" className="text-sm text-[#0070f3] no-underline font-medium hover:underline hover:text-[#0051cc]">
            비밀번호 찾기
          </Link>
        </div>
      </div>
    </div>
  );
}
