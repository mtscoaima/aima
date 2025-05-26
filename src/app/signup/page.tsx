"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./signup.module.css";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    agreeTerms: false,
    agreePrivacy: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const { signup, isLoading, error } = useAuth();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 실시간 유효성 검사
    if (name === "confirmPassword" && value !== formData.password) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: "비밀번호가 일치하지 않습니다.",
      }));
    } else if (name === "confirmPassword" && value === formData.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // 이메일 검증
    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "유효한 이메일 주소를 입력해주세요.";
    }

    // 이름 검증
    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }

    // 전화번호 검증
    if (!formData.phone.trim()) {
      newErrors.phone = "전화번호를 입력해주세요.";
    }

    // 비밀번호 검증
    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다.";
    }

    // 비밀번호 확인 검증
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    // 필수 약관 동의 검증
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "이용약관에 동의해주세요.";
    }

    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = "개인정보 처리방침에 동의해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phoneNumber: formData.phone,
      });

      // 회원가입 성공
      setIsSuccess(true);

      // 3초 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      // 에러는 AuthContext에서 처리됨
      console.error("회원가입 실패:", err);
    }
  };

  // 회원가입 성공 화면
  if (isSuccess) {
    return (
      <div className={styles.signupContainer}>
        <div className={styles.signupWrapper}>
          <div className={styles.signupCard}>
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✅</div>
              <h2>회원가입이 완료되었습니다!</h2>
              <p>잠시 후 로그인 페이지로 이동합니다.</p>
              <Link href="/login" className={styles.loginButton}>
                지금 로그인하기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupWrapper}>
        <div className={styles.signupCard}>
          {/* 로고 및 제목 */}
          <div className={styles.signupHeader}>
            <div className={styles.logoSection}>
              <h1 className={styles.logoText}>MTS플러스</h1>
              <p className={styles.subtitle}>AI 기반 타겟 마케팅 플랫폼</p>
            </div>
            <h2 className={styles.signupTitle}>회원가입</h2>
          </div>

          {/* 에러 메시지 */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className={styles.signupForm}>
            {/* 기본 정보 */}
            <div className={styles.formSection}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label
                    htmlFor="email"
                    className={`${styles.formLabel} ${styles.required}`}
                  >
                    이메일 주소
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${
                      errors.email ? styles.error : ""
                    }`}
                    placeholder="example@email.com"
                    required
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className={styles.formError}>{errors.email}</p>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label
                    htmlFor="name"
                    className={`${styles.formLabel} ${styles.required}`}
                  >
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${
                      errors.name ? styles.error : ""
                    }`}
                    placeholder="홍길동"
                    required
                    disabled={isLoading}
                  />
                  {errors.name && (
                    <p className={styles.formError}>{errors.name}</p>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label
                    htmlFor="phone"
                    className={`${styles.formLabel} ${styles.required}`}
                  >
                    휴대폰 번호
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${
                      errors.phone ? styles.error : ""
                    }`}
                    placeholder="010-1234-5678"
                    required
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <p className={styles.formError}>{errors.phone}</p>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label
                    htmlFor="password"
                    className={`${styles.formLabel} ${styles.required}`}
                  >
                    비밀번호
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${
                      errors.password ? styles.error : ""
                    }`}
                    placeholder="6자 이상의 비밀번호"
                    required
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className={styles.formError}>{errors.password}</p>
                  )}
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label
                    htmlFor="confirmPassword"
                    className={`${styles.formLabel} ${styles.required}`}
                  >
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`${styles.formInput} ${
                      errors.confirmPassword ? styles.error : ""
                    }`}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className={styles.formError}>{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className={styles.formSection}>
              <div className={styles.termsGroup}>
                <label
                  className={`${styles.checkboxLabel} ${styles.requiredTerm} ${
                    errors.agreeTerms ? styles.error : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className={styles.checkboxInput}
                    required
                    disabled={isLoading}
                  />
                  <span className={styles.checkboxText}>
                    <strong>이용약관</strong>에 동의합니다 (필수)
                  </span>
                  <Link href="/terms" className={styles.termsLink}>
                    보기
                  </Link>
                </label>
                {errors.agreeTerms && (
                  <p className={styles.formError}>{errors.agreeTerms}</p>
                )}

                <label
                  className={`${styles.checkboxLabel} ${styles.requiredTerm} ${
                    errors.agreePrivacy ? styles.error : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleInputChange}
                    className={styles.checkboxInput}
                    required
                    disabled={isLoading}
                  />
                  <span className={styles.checkboxText}>
                    <strong>개인정보 처리방침</strong>에 동의합니다 (필수)
                  </span>
                  <Link href="/privacy" className={styles.termsLink}>
                    보기
                  </Link>
                </label>
                {errors.agreePrivacy && (
                  <p className={styles.formError}>{errors.agreePrivacy}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              className={styles.signupButton}
              disabled={isLoading}
            >
              {isLoading ? "회원가입 중..." : "회원가입"}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className={styles.loginLink}>
            <span>이미 계정이 있으신가요?</span>
            <Link href="/login" className={styles.loginButtonLink}>
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
