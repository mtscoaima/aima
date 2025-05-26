"use client";

import React, { useState } from "react";
import Link from "next/link";
import styles from "./login.module.css";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 로그인 로직은 추후 구현
    console.log("로그인 시도:", formData);
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
                />
                <span className={styles.checkboxText}>로그인 상태 유지</span>
              </label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                비밀번호 찾기
              </Link>
            </div>

            <button type="submit" className={styles.loginButton}>
              로그인
            </button>
          </form>

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
