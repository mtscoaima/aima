"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

export default function FindPasswordPage() {
  const [selectedMethod, setSelectedMethod] = useState<
    "phone" | "email"
  >("phone");
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
  });
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  // 최신 formData 값을 참조하기 위한 ref
  const formDataRef = useRef(formData);

  // formData가 변경될 때마다 ref 업데이트
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // 본인인증 팝업 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "inicis-auth-success") {
        // 본인인증 성공
        const { verificationId: vId } = event.data;

        // 본인인증 정보로 비밀번호 찾기 API 호출
        findPasswordByVerification(vId);
      } else if (event.data.type === "inicis-auth-failed") {
        // 본인인증 실패
        alert(`본인인증에 실패했습니다: ${event.data.resultMsg}`);
        setIsVerificationLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []); // 의존성 배열을 다시 빈 배열로 설정

  const handleMethodSelect = (method: "phone" | "email") => {
    setSelectedMethod(method);
    setShowResult(false);
    setResultMessage("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhoneVerification = async () => {
    if (!formData.username.trim()) {
      alert("아이디를 입력해주세요.");
      return;
    }

    setIsVerificationLoading(true);

    try {
      // 본인인증 요청 API 호출
      const response = await fetch("/api/auth/inicis-auth/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("본인인증 요청에 실패했습니다.");
      }

      const data = await response.json();

      // 팝업창 열기
      const width = 400;
      const height = 640;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      const popup = window.open(
        "",
        "inicis_identity_auth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      // 팝업 차단 확인
      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
        setIsVerificationLoading(false);
        return;
      }

      // 팝업 닫힘 감지
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsVerificationLoading(false);
        }
      }, 1000);

      // 타임아웃 설정 (5분)
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
        }
        clearInterval(checkClosed);
        setIsVerificationLoading(false);
      }, 300000);

      // 폼 생성 및 제출
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.authUrl;
      form.target = "inicis_identity_auth";

      // 파라미터 추가
      Object.entries(data.params).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      // 폼을 body에 추가하고 제출
      document.body.appendChild(form);
      form.submit();

      // 폼 제거
      document.body.removeChild(form);
    } catch (error) {
      console.error("본인인증 요청 오류:", error);
      alert("본인인증 요청 중 오류가 발생했습니다.");
      setIsVerificationLoading(false);
    }
  };

  const findPasswordByVerification = async (vId: string) => {
    try {
      const response = await fetch("/api/auth/find-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verificationId: vId,
          username: formDataRef.current.username, // ref를 사용하여 최신 값 참조
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultMessage(
          data.message || "임시 비밀번호가 등록된 이메일로 전송되었습니다."
        );
      } else {
        setResultMessage(
          data.message || "비밀번호 찾기 중 오류가 발생했습니다."
        );
      }
    } catch (error) {
      console.error("비밀번호 찾기 오류:", error);
      setResultMessage("비밀번호 찾기 중 오류가 발생했습니다.");
    } finally {
      setShowResult(true);
      setIsVerificationLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/find-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResultMessage(
          data.message || "임시 비밀번호가 이메일로 전송되었습니다."
        );
      } else {
        setResultMessage(
          data.message || "비밀번호 찾기 중 오류가 발생했습니다."
        );
      }
    } catch (error) {
      console.error("비밀번호 찾기 오류:", error);
      setResultMessage("비밀번호 찾기 중 오류가 발생했습니다.");
    } finally {
      setShowResult(true);
    }
  };

  const resetForm = () => {
    setSelectedMethod("phone");
    setShowResult(false);
    setResultMessage("");
    setFormData({ username: "", name: "", email: "" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h1 className={styles.title}>비밀번호 찾기</h1>
        </div>
        
        <div className={styles.card}>
          {/* 콘텐츠 영역 */}
          <div className={styles.content}>
            {showResult ? (
              // 결과 표시
              <div className={styles.resultSection}>
                <div className={styles.resultMessage}>
                  <p>{resultMessage}</p>
                </div>
                <div className={styles.resultActions}>
                  <button
                    type="button"
                    onClick={resetForm}
                    className={styles.resetButton}
                  >
                    다시 찾기
                  </button>
                  <Link href="/login" className={styles.loginButton}>
                    로그인하기
                  </Link>
                </div>
              </div>
            ) : selectedMethod === "phone" ? (
              // 휴대폰 인증 단계
              <div className={styles.phoneVerification}>
                <div className={styles.methodButtons}>
                  <button
                    type="button"
                    className={`${styles.methodButton} ${styles.selected}`}
                    onClick={() => handleMethodSelect("phone")}
                  >
                    휴대폰 본인인증
                  </button>
                  <button
                    type="button"
                    className={styles.methodButton}
                    onClick={() => handleMethodSelect("email")}
                  >
                    이메일 인증
                  </button>
                </div>
                <p className={styles.methodDescription}>
                  아이디와 휴대폰 본인인증으로 비밀번호 찾기를 진행해주세요.
                </p>
                <div className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.formLabel}>
                      아이디 <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="아이디를 입력해 주세요"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePhoneVerification}
                    className={styles.submitButton}
                    disabled={
                      isVerificationLoading || !formData.username.trim()
                    }
                  >
                    {isVerificationLoading
                      ? "인증 진행 중..."
                      : "휴대폰 본인인증"}
                  </button>
                </div>
              </div>
            ) : (
              // 이메일 인증 단계
              <div className={styles.emailVerification}>
                <div className={styles.methodButtons}>
                  <button
                    type="button"
                    className={styles.methodButton}
                    onClick={() => handleMethodSelect("phone")}
                  >
                    휴대폰 본인인증
                  </button>
                  <button
                    type="button"
                    className={`${styles.methodButton} ${styles.selected}`}
                    onClick={() => handleMethodSelect("email")}
                  >
                    이메일 인증
                  </button>
                </div>
                <p className={styles.methodDescription}>
                  회원정보에 등록된 이메일로 비밀번호 찾기를 진행해주세요.
                </p>
                <form onSubmit={handleEmailSubmit} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="username" className={styles.formLabel}>
                      아이디 <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="아이디를 입력해 주세요"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.formLabel}>
                      이름 <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="이름을 입력해 주세요"
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.formLabel}>
                      이메일 <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="이메일 주소를 입력해 주세요"
                      required
                    />
                  </div>
                  <button type="submit" className={styles.submitButton}>
                    인증요청
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* 하단 링크 */}
          {!showResult && (
            <div className={styles.links}>
              <Link href="/login" className={styles.backLink}>
                로그인으로 돌아가기
              </Link>
              <Link
                href="/auth/find-username"
                className={styles.findUsernameLink}
              >
                아이디 찾기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
