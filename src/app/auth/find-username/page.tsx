"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./styles.module.css";

export default function FindUsernamePage() {
  const [selectedMethod, setSelectedMethod] = useState<
    "phone" | "email"
  >("phone");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [foundUsernames, setFoundUsernames] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  // 본인인증 팝업 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "inicis-auth-success") {
        // 본인인증 성공
        const { verificationId: vId } = event.data;

        // 본인인증 정보로 아이디 찾기 API 호출
        findUsernameByVerification(vId);
      } else if (event.data.type === "inicis-auth-failed") {
        // 본인인증 실패
        alert(`본인인증에 실패했습니다: ${event.data.resultMsg}`);
        setIsVerificationLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleMethodSelect = (method: "phone" | "email") => {
    setSelectedMethod(method);
    setShowResult(false);
    setFoundUsernames([]);
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

  const findUsernameByVerification = async (vId: string) => {
    try {
      const response = await fetch("/api/auth/find-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          verificationId: vId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.usernames && data.usernames.length > 0) {
          setFoundUsernames(data.usernames);
          setResultMessage(`등록된 아이디를 찾았습니다.`);
        } else {
          setFoundUsernames([]);
          setResultMessage(
            "등록된 아이디가 없습니다. 회원가입을 진행해주세요."
          );
        }
      } else {
        setFoundUsernames([]);
        setResultMessage(data.message || "아이디 찾기 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("아이디 찾기 오류:", error);
      setFoundUsernames([]);
      setResultMessage("아이디 찾기 중 오류가 발생했습니다.");
    } finally {
      setShowResult(true);
      setIsVerificationLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/auth/find-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.emailSent) {
          setFoundUsernames([]);
          setResultMessage(
            `${formData.email}로 아이디 정보를 전송했습니다. 이메일을 확인해주세요.`
          );
        } else {
          setFoundUsernames([]);
          setResultMessage(
            data.message || "입력하신 정보와 일치하는 아이디가 없습니다."
          );
        }
      } else {
        setFoundUsernames([]);
        setResultMessage(data.message || "아이디 찾기 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("아이디 찾기 오류:", error);
      setFoundUsernames([]);
      setResultMessage("아이디 찾기 중 오류가 발생했습니다.");
    } finally {
      setShowResult(true);
    }
  };

  const resetForm = () => {
    setSelectedMethod("phone");
    setShowResult(false);
    setFoundUsernames([]);
    setResultMessage("");
    setFormData({ name: "", email: "" });
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h1 className={styles.title}>아이디 찾기</h1>
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
                {foundUsernames.length > 0 && (
                  <div className={styles.usernameList}>
                    {foundUsernames.map((username, index) => (
                      <div key={index} className={styles.usernameItem}>
                        <span className={styles.usernameLabel}>아이디:</span>
                        <span className={styles.username}>{username}</span>
                      </div>
                    ))}
                  </div>
                )}
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
                  본인 인증으로 가입된 아이디인 경우에만 가능합니다.
                </p>
                <div className={styles.form}>
                  <button
                    type="button"
                    onClick={handlePhoneVerification}
                    className={styles.submitButton}
                    disabled={isVerificationLoading}
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
                  회원정보에 등록된 이메일로 아이디를 발송해드립니다.
                </p>
                <form onSubmit={handleEmailSubmit} className={styles.form}>
                  <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.formLabel}>
                      이름
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
                      이메일
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
                href="/auth/find-password"
                className={styles.findPasswordLink}
              >
                비밀번호 찾기
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
