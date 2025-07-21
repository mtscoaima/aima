"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./login.module.css";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const { login, isLoading, error, isAuthenticated } = useAuth();
  const router = useRouter();

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
                onClick={() => console.log('카카오 로그인 클릭')}
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
                onClick={() => console.log('네이버 로그인 클릭')}
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
                onClick={() => console.log('구글 로그인 클릭')}
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
    </div>
  );
}
