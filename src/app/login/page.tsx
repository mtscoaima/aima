"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import KakaoSignupModal from "@/components/KakaoSignupModal";
import styles from "./login.module.css";

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

interface KakaoInfo {
  email: string;
  name: string;
  profileImage?: string;
}

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [showSignupModal, setShowSignupModal] = useState(false);
  const [kakaoInfo, setKakaoInfo] = useState<KakaoInfo | null>(null);
  const [kakaoSignupLoading, setKakaoSignupLoading] = useState(false);

  const { login, isLoading, error, isAuthenticated } = useAuth();
  const router = useRouter();

  // 카카오 SDK 초기화
  useEffect(() => {
    const initKakaoSDK = async () => {
      if (typeof window === "undefined") return;

      const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;

      if (!kakaoAppKey || kakaoAppKey === "your-kakao-javascript-key-here") {
        console.error("❌ 카카오 앱 키가 설정되지 않았습니다.");

        return;
      }

      // 카카오 SDK 로딩 대기 (더 안정적인 방법)
      let retryCount = 0;
      const maxRetries = 100; // 10초 대기 (100ms * 100)

      const waitForKakaoSDK = () => {
        return new Promise<void>((resolve, reject) => {
          const checkSDK = () => {
            if (window.Kakao && window.Kakao.isInitialized !== undefined) {
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

        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(kakaoAppKey);
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

  // 이미 로그인된 사용자는 루트 페이지로 리다이렉트
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  // 로그인된 사용자에게는 로딩 화면 표시
  if (isAuthenticated) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginWrapper}>
          <div className={styles.loginCard}>
            <div className={styles.loginHeader}>
              <div className={styles.logoSection}>
                <h1 className={styles.logoText}>MTS플러스</h1>
                <p className={styles.subtitle}>AI 기반 타겟 마케팅 플랫폼</p>
              </div>
            </div>
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p>이미 로그인되어 있습니다. 메인 페이지로 이동합니다...</p>
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });

      // 로그인 성공 시 메인 페이지로 이동
      router.push("/");
    } catch (err) {
      // 에러는 AuthContext에서 처리됨
      console.error("로그인 실패:", err);
    }
  };

  const handleKakaoLogin = async () => {
    try {
      // 카카오 SDK 상태 확인
      if (typeof window === "undefined") {
        console.error("❌ 브라우저 환경이 아님");
        alert("브라우저 환경에서만 사용 가능합니다.");
        return;
      }

      if (!window.Kakao) {
        console.error("❌ 카카오 SDK가 로드되지 않았습니다");
        alert("카카오 SDK가 로드되지 않았습니다. 페이지를 새로고침해주세요.");
        return;
      }

      if (!window.Kakao.isInitialized()) {
        console.error("❌ 카카오 SDK가 초기화되지 않았습니다");
        alert("카카오 SDK가 초기화되지 않았습니다. 페이지를 새로고침해주세요.");
        return;
      }

      // Auth 메서드 존재 확인
      if (!window.Kakao.Auth) {
        console.error("❌ 카카오 Auth 객체가 없습니다");
        alert(
          "카카오 로그인 기능을 사용할 수 없습니다. 페이지를 새로고침해주세요."
        );
        return;
      }

      // 카카오 로그인 - 팝업 방식
      try {
        // 카카오 로그인 팝업 열기
        const authCode = await new Promise<string>((resolve, reject) => {
          const kakaoAppKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
          const redirectUri = `${window.location.origin}`;

          // 팝업 창으로 카카오 로그인 (scope에 이메일 포함)
          const popup = window.open(
            `https://kauth.kakao.com/oauth/authorize?client_id=${kakaoAppKey}&redirect_uri=${encodeURIComponent(
              redirectUri
            )}&response_type=code&scope=account_email,profile_nickname&prompt=login`,
            "kakaoLogin",
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
                  resolve(code);
                }
              }
            } catch {
              // 팝업이 다른 도메인에 있을 때는 접근할 수 없음 (정상)
            }
          }, 1000);
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
          throw new Error("토큰 요청 실패");
        }

        const tokenData = await tokenResponse.json();

        // 기존 로그인 API 호출
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
          if (data.needsSignup) {
            // 신규 사용자 - 회원가입 모달 표시
            setKakaoInfo(data.kakaoInfo);
            setShowSignupModal(true);
          } else {
            // 기존 사용자 - 로그인 처리
            const { tokenManager } = await import("@/lib/api");
            tokenManager.setTokens(data.accessToken, data.refreshToken);

            // 페이지 새로고침으로 인증 상태 업데이트
            window.location.href = "/";
          }
        } else {
          console.error("🔴 카카오 로그인 API 오류:", data);
          alert(data.message || "카카오 로그인에 실패했습니다.");
        }
      } catch (loginError) {
        console.error("🔴 카카오 로그인 과정 오류:", loginError);
        if (loginError instanceof Error) {
          alert(loginError.message);
        } else {
          alert("카카오 로그인 중 오류가 발생했습니다.");
        }
      }
    } catch (error) {
      console.error("🔴 카카오 로그인 전체 오류:", error);
      console.error(
        "🔴 오류 스택:",
        error instanceof Error ? error.stack : "스택 없음"
      );
      alert("카카오 로그인 중 오류가 발생했습니다.");
    }
  };

  const handleKakaoSignup = async (signupData: {
    email: string;
    name: string;
    phoneNumber: string;
    userType: "general" | "salesperson";
    // 기업 정보
    companyName?: string;
    ceoName?: string;
    businessNumber?: string;
    companyAddress?: string;
    companyAddressDetail?: string;
    companyPhone?: string;
    toll080Number?: string;
    customerServiceNumber?: string;
    // 제출 서류
    businessRegistration?: File | null;
    employmentCertificate?: File | null;
    // 세금계산서 정보
    taxInvoiceEmail?: string;
    taxInvoiceManager?: string;
    taxInvoiceContact?: string;
    // 추천인 정보
    referrerName?: string;
    referrerCode?: string;
    // 약관 동의
    agreeTerms: boolean;
    agreePrivacy: boolean;
    agreeMarketing: boolean;
  }) => {
    setKakaoSignupLoading(true);

    try {
      // FormData 생성
      const formData = new FormData();

      // 카카오 기본 정보
      formData.append("email", signupData.email);
      formData.append("name", signupData.name);
      formData.append("phoneNumber", signupData.phoneNumber);
      formData.append("userType", signupData.userType);

      // 기업 정보 (일반회원인 경우)
      if (signupData.userType === "general") {
        if (signupData.companyName)
          formData.append("companyName", signupData.companyName);
        if (signupData.ceoName) formData.append("ceoName", signupData.ceoName);
        if (signupData.businessNumber)
          formData.append("businessNumber", signupData.businessNumber);
        if (signupData.companyAddress)
          formData.append("companyAddress", signupData.companyAddress);
        if (signupData.companyAddressDetail)
          formData.append(
            "companyAddressDetail",
            signupData.companyAddressDetail
          );
        if (signupData.companyPhone)
          formData.append("companyPhone", signupData.companyPhone);
        if (signupData.toll080Number)
          formData.append("toll080Number", signupData.toll080Number);
        if (signupData.customerServiceNumber)
          formData.append(
            "customerServiceNumber",
            signupData.customerServiceNumber
          );

        // 파일 업로드
        if (signupData.businessRegistration) {
          formData.append(
            "businessRegistration",
            signupData.businessRegistration
          );
        }
        if (signupData.employmentCertificate) {
          formData.append(
            "employmentCertificate",
            signupData.employmentCertificate
          );
        }

        // 세금계산서 정보
        if (signupData.taxInvoiceEmail)
          formData.append("taxInvoiceEmail", signupData.taxInvoiceEmail);
        if (signupData.taxInvoiceManager)
          formData.append("taxInvoiceManager", signupData.taxInvoiceManager);
        if (signupData.taxInvoiceContact)
          formData.append("taxInvoiceContact", signupData.taxInvoiceContact);
      }

      // 추천인 정보
      if (signupData.referrerName)
        formData.append("referrerName", signupData.referrerName);
      if (signupData.referrerCode)
        formData.append("referrerCode", signupData.referrerCode);

      // 약관 동의
      formData.append("agreeTerms", signupData.agreeTerms.toString());
      formData.append("agreePrivacy", signupData.agreePrivacy.toString());
      formData.append("agreeMarketing", signupData.agreeMarketing.toString());

      const response = await fetch("/api/auth/kakao-signup", {
        method: "POST",
        body: formData, // JSON 대신 FormData 사용
      });

      const data = await response.json();

      if (response.ok) {
        alert("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.");
        setShowSignupModal(false);
        setKakaoInfo(null);
        // 카카오 로그인 재시도
        handleKakaoLogin();
      } else {
        alert(data.message || "회원가입에 실패했습니다.");
      }
    } catch (error) {
      console.error("카카오 회원가입 실패:", error);
      alert("회원가입 중 오류가 발생했습니다.");
    } finally {
      setKakaoSignupLoading(false);
    }
  };

  const closeSignupModal = () => {
    setShowSignupModal(false);
    setKakaoInfo(null);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginWrapper}>
        <div className={styles.loginCard}>
          {/* 로고 및 제목 */}
          <div className={styles.loginHeader}>
            <div className={styles.logoSection}>
              <h1 className={styles.logoText}>MTS플러스</h1>
              <p className={styles.subtitle}>AI 기반 타겟 마케팅 플랫폼</p>
            </div>
            <h2 className={styles.loginTitle}>로그인</h2>
          </div>

          {/* 에러 메시지 */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* 로그인 폼 */}
          <form onSubmit={handleSubmit} className={styles.loginForm}>
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.formLabel}>
                이메일 주소
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="example@email.com"
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="password" className={styles.formLabel}>
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="비밀번호를 입력하세요"
                required
                disabled={isLoading}
              />
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className={styles.checkboxInput}
                  disabled={isLoading}
                />
                <span className={styles.checkboxText}>로그인 상태 유지</span>
              </label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                비밀번호 찾기
              </Link>
            </div>

            <button
              type="submit"
              className={styles.loginButton}
              disabled={isLoading}
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* SNS 로그인 섹션 */}
          <div className={styles.snsLoginSection}>
            <div className={styles.divider}>
              <span className={styles.dividerText}>또는</span>
            </div>

            <div className={styles.snsButtonGroup}>
              <button
                type="button"
                className={`${styles.snsButton} ${styles.kakaoButton}`}
                onClick={handleKakaoLogin}
              >
                <div className={styles.snsButtonContent}>
                  <div className={styles.snsIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M10 3.33333C14.6024 3.33333 18.3333 6.30952 18.3333 10C18.3333 12.5476 16.6548 14.7857 14.1667 16.0714L13.3333 18.3333L10.8333 16.6667H10C5.39762 16.6667 1.66667 13.6905 1.66667 10C1.66667 6.30952 5.39762 3.33333 10 3.33333Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <span>카카오로 로그인</span>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.snsButton} ${styles.naverButton}`}
                onClick={() => console.log("네이버 로그인 클릭")}
              >
                <div className={styles.snsButtonContent}>
                  <div className={styles.snsIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M13.6667 10.5833L6.33333 5.83333V10.5833H4.16667V14.1667H6.33333V18.3333H13.6667V14.1667H15.8333V10.5833H13.6667ZM11.5 12.75H8.5V7.25L11.5 10.5833V12.75Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <span>네이버로 로그인</span>
                </div>
              </button>

              <button
                type="button"
                className={`${styles.snsButton} ${styles.googleButton}`}
                onClick={() => console.log("구글 로그인 클릭")}
              >
                <div className={styles.snsButtonContent}>
                  <div className={styles.snsIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M18.1613 8.20166H17.5V8.16683H10V11.6668H14.7096C14.023 13.6069 12.1742 15.0002 10 15.0002C7.23833 15.0002 5 12.7618 5 10.0002C5 7.23849 7.23833 5.00016 10 5.00016C11.2746 5.00016 12.4342 5.48099 13.3171 6.26599L15.6742 3.90882C14.1858 2.52216 12.1921 1.66683 10 1.66683C5.39833 1.66683 1.66667 5.39849 1.66667 10.0002C1.66667 14.6018 5.39833 18.3335 10 18.3335C14.6017 18.3335 18.3333 14.6018 18.3333 10.0002C18.3333 9.39849 18.275 8.81266 18.1613 8.20166Z"
                        fill="#4285F4"
                      />
                      <path
                        d="M2.87744 6.12148L5.65827 8.12898C6.40577 6.29481 8.05827 5.00015 9.99994 5.00015C11.2745 5.00015 12.4341 5.48098 13.317 6.26598L15.6741 3.90881C14.1858 2.52215 12.192 1.66681 9.99994 1.66681C6.79827 1.66681 4.02327 3.47398 2.87744 6.12148Z"
                        fill="#EA4335"
                      />
                      <path
                        d="M9.99994 18.3335C12.1528 18.3335 14.1095 17.5098 15.587 16.1723L13.0062 13.9815C12.1429 14.6098 11.0971 15.0007 9.99994 15.0002C7.83244 15.0002 5.98744 13.6185 5.29661 11.6885L2.83411 13.7835C3.96744 16.4727 6.76161 18.3335 9.99994 18.3335Z"
                        fill="#34A853"
                      />
                      <path
                        d="M18.1612 8.20166H17.5V8.16683H10V11.6668H14.7096C14.3809 12.5902 13.7889 13.3972 13.0054 13.9818L13.0062 13.9815L15.5879 16.1723C15.4104 16.3357 18.3333 14.1668 18.3333 10.0002C18.3333 9.39849 18.275 8.81266 18.1612 8.20166Z"
                        fill="#FBBC05"
                      />
                    </svg>
                  </div>
                  <span>구글로 로그인</span>
                </div>
              </button>
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className={styles.signupLink}>
            <span>아직 계정이 없으신가요?</span>
            <Link href="/signup" className={styles.signupButton}>
              회원가입
            </Link>
          </div>
        </div>
      </div>

      {showSignupModal && kakaoInfo && (
        <KakaoSignupModal
          isOpen={showSignupModal}
          onClose={closeSignupModal}
          kakaoInfo={kakaoInfo}
          onSignup={handleKakaoSignup}
          isLoading={kakaoSignupLoading}
        />
      )}
    </div>
  );
}
