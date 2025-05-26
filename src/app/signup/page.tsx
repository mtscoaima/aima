"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./signup.module.css";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    company: "",
    phone: "",
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 회원가입 로직은 추후 구현
    console.log("회원가입 시도:", formData);
  };

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
            <p className={styles.signupDescription}>
              MTS플러스와 함께 효과적인 마케팅을 시작하세요
            </p>
          </div>

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className={styles.signupForm}>
            {/* 기본 정보 */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>기본 정보</h3>

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
                    className={styles.formInput}
                    placeholder="example@email.com"
                    required
                  />
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
                    className={styles.formInput}
                    placeholder="홍길동"
                    required
                  />
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
                    className={styles.formInput}
                    placeholder="010-1234-5678"
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="company" className={styles.formLabel}>
                    회사명 (선택)
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    placeholder="회사명을 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 비밀번호 */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>비밀번호 설정</h3>

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
                    className={styles.formInput}
                    placeholder="8자 이상의 비밀번호"
                    required
                  />
                  <p className={styles.formHelp}>
                    영문, 숫자, 특수문자를 포함하여 8자 이상 입력하세요
                  </p>
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
                  />
                  {errors.confirmPassword && (
                    <p className={styles.formError}>{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>약관 동의</h3>

              <div className={styles.termsGroup}>
                <label
                  className={`${styles.checkboxLabel} ${styles.requiredTerm}`}
                >
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className={styles.checkboxInput}
                    required
                  />
                  <span className={styles.checkboxText}>
                    <strong>이용약관</strong>에 동의합니다 (필수)
                  </span>
                  <Link href="/terms" className={styles.termsLink}>
                    보기
                  </Link>
                </label>

                <label
                  className={`${styles.checkboxLabel} ${styles.requiredTerm}`}
                >
                  <input
                    type="checkbox"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleInputChange}
                    className={styles.checkboxInput}
                    required
                  />
                  <span className={styles.checkboxText}>
                    <strong>개인정보 처리방침</strong>에 동의합니다 (필수)
                  </span>
                  <Link href="/privacy" className={styles.termsLink}>
                    보기
                  </Link>
                </label>

                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="agreeMarketing"
                    checked={formData.agreeMarketing}
                    onChange={handleInputChange}
                    className={styles.checkboxInput}
                  />
                  <span className={styles.checkboxText}>
                    마케팅 정보 수신에 동의합니다 (선택)
                  </span>
                  <Link href="/marketing" className={styles.termsLink}>
                    보기
                  </Link>
                </label>
              </div>
            </div>

            <button type="submit" className={styles.signupButton}>
              회원가입
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
