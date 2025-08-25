"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { passwordValidation } from "@/lib/utils";
import TermsModal, { TermsType } from "@/components/TermsModal";
import styles from "./GeneralSignupForm.module.css";

export default function GeneralSignupForm() {
  const [formData, setFormData] = useState({
    // 기본 정보
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    birthDate: "",
    phone: "",

    // 약관 동의
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTermsType, setCurrentTermsType] = useState<TermsType>("service");

  const router = useRouter();



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 에러 초기화
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleIdentityVerification = () => {
    setShowWarningModal(true);
  };

  const closeWarningModal = () => {
    setShowWarningModal(false);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // 이름 확인
    if (!formData.name) {
      newErrors.name = "이름을 입력해주세요.";
    }

    // 생년월일 확인
    if (!formData.birthDate) {
      newErrors.birthDate = "생년월일을 입력해주세요.";
    }

    // 휴대폰 번호 확인
    if (!formData.phone) {
      newErrors.phone = "휴대폰 번호를 입력해주세요.";
    } else if (!/^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(formData.phone.replace(/-/g, ""))) {
      newErrors.phone = "올바른 휴대폰 번호 형식이 아닙니다.";
    }

    // 아이디 확인
    if (!formData.username) {
      newErrors.username = "아이디를 입력해주세요.";
    } else if (!/^[a-zA-Z0-9_]{4,15}$/.test(formData.username)) {
      newErrors.username = "아이디는 4-15자 이내 영문, 숫자, 언더스코어만 입력해주세요.";
    }

    // 이메일 확인
    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "올바른 이메일 형식을 입력해주세요.";
    }

    // 비밀번호 확인
    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else {
      const validation = passwordValidation.validatePassword(formData.password);
      if (!validation.isValid) {
        newErrors.password = validation.errors[0];
      }
    }

    // 비밀번호 확인
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호를 확인해주세요.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }

    // 약관 동의 확인
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "서비스 이용약관에 동의해주세요.";
    }

    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = "개인정보 수집 및 이용에 동의해주세요.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // 사용자 유형
      formDataToSend.append("userType", "general");
      
      // 기본 정보
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("name", formData.name);
      formDataToSend.append("phoneNumber", formData.phone);
      formDataToSend.append("birthDate", formData.birthDate);
      
      // 약관 동의
      formDataToSend.append("agreeTerms", formData.agreeTerms.toString());
      formDataToSend.append("agreePrivacy", formData.agreePrivacy.toString());
      formDataToSend.append("agreeMarketing", formData.agreeMarketing.toString());

      const response = await fetch("/api/users/signup-with-files", {
        method: "POST",
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "회원가입에 실패했습니다.");
      }

      alert("회원가입이 완료되었습니다!");
      router.push("/login");
    } catch (error) {
      console.error("회원가입 실패:", error);
      alert(error instanceof Error ? error.message : "회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 전체 동의 처리
  const handleAgreeAll = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      agreeTerms: checked,
      agreePrivacy: checked,
      agreeMarketing: checked,
    }));

    if (checked) {
      setErrors((prev) => ({
        ...prev,
        agreeTerms: "",
        agreePrivacy: "",
      }));
    }
  };

  // 모달 열기
  const openTermsModal = (type: TermsType) => {
    setCurrentTermsType(type);
    setIsModalOpen(true);
  };

  // 모달 닫기
  const closeTermsModal = () => {
    setIsModalOpen(false);
  };

  // 전체 동의 상태 확인
  const isAllAgreed = formData.agreeTerms && formData.agreePrivacy && formData.agreeMarketing;

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* 헤더 */}
        <div className={styles.header}>
          <h1 className={styles.title}>회원가입</h1>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
            
          <div className={styles.cardsContainer}>
            {/* 약관 동의 카드 */}
            <div className={styles.card}>
              {/* 전체동의 */}
              <div className={styles.agreeSection}>
                <label className={styles.agreeAllLabel}>
                  <input
                    type="checkbox"
                    checked={isAllAgreed}
                    onChange={(e) => handleAgreeAll(e.target.checked)}
                    className={styles.checkbox}
                  />
                  <span className={styles.agreeAllText}>전체동의</span>
                </label>
                <p className={styles.agreeDescription}>
                  이용약관, 개인정보 수집 및 이용, 마케팅·이벤트 정보수신(선택)에 모두 동의할게요.
                </p>
                <div className={styles.divider}></div>
              </div>

            {/* 이용약관 */}
            <div className={styles.termsSection}>
              <h3 className={styles.sectionTitle}>이용약관</h3>
              
              <div className={styles.termsList}>
                <label className={styles.termItem}>
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className={styles.checkbox}
                  />
                  <span className={styles.termText}>
                    <span className={styles.requiredText}>[필수]</span> 서비스 이용약관 동의
                  </span>
                  <button
                    type="button"
                    onClick={() => openTermsModal("service")}
                    className={styles.viewButton}
                  >
                    보기
                  </button>
                </label>
                {errors.agreeTerms && (
                  <p className={styles.error}>{errors.agreeTerms}</p>
                )}

                <label className={styles.termItem}>
                  <input
                    type="checkbox"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleInputChange}
                    className={styles.checkbox}
                  />
                  <span className={styles.termText}>
                    <span className={styles.requiredText}>[필수]</span> 개인정보 수집 및 이용 동의
                  </span>
                  <button
                    type="button"
                    onClick={() => openTermsModal("privacy")}
                    className={styles.viewButton}
                  >
                    보기
                  </button>
                </label>
                {errors.agreePrivacy && (
                  <p className={styles.error}>{errors.agreePrivacy}</p>
                )}

                <label className={styles.termItem}>
                  <input
                    type="checkbox"
                    name="agreeMarketing"
                    checked={formData.agreeMarketing}
                    onChange={handleInputChange}
                    className={styles.checkbox}
                  />
                  <span className={styles.termText}>
                    <span className={styles.optionalText}>[선택]</span> 마케팅 정보 수집 및 활용 동의
                  </span>
                  <button
                    type="button"
                    onClick={() => openTermsModal("marketing")}
                    className={styles.viewButton}
                  >
                    보기
                  </button>
                </label>
              </div>

              {/* 추가 텍스트 */}
              <div className={styles.termsNote}>
                <ul>
                  <li>필수 항목은 서비스 이용에 필요한 정보로, 동의해야 서비스 이용이 가능합니다.</li>
                  <li>마케팅 정보 수집 및 활용 동의는 선택 사항으로, 동의하지 않아도 가입은 가능하나 혜택 안내를 받지 못할 수 있습니다.</li>
                </ul>
              </div>
                          </div>
                          
            </div>

            {/* 회원정보 입력 카드 */}
            <div className={styles.card}>
            {/* 회원정보 입력 */}
            <div className={styles.infoSection}>
              <h3 className={styles.sectionTitle}>회원정보 입력</h3>
              
              <div className={styles.formRow}>
                <label className={styles.label}>
                  이름 <span className={styles.asterisk}>*</span>
                </label>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
                    placeholder="이름을 입력해 주세요"
                  />
                  <button
                    type="button"
                    onClick={handleIdentityVerification}
                    className={styles.verifyButton}
                    disabled={isLoading}
                  >
                    본인인증
                  </button>
                </div>
                {errors.name && (
                  <p className={styles.error}>{errors.name}</p>
                )}
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>생년월일 <span className={styles.asterisk}>*</span></label>
                <input
                  type="text"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.birthDate ? styles.inputError : ""}`}
                  placeholder="생년월일을 입력해 주세요"
                />
                {errors.birthDate && (
                  <p className={styles.error}>{errors.birthDate}</p>
                )}
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>휴대폰 번호 <span className={styles.asterisk}>*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`${styles.input} ${errors.phone ? styles.inputError : ""}`}
                  placeholder="휴대폰 번호를 입력해 주세요"
                />
                {errors.phone && (
                  <p className={styles.error}>{errors.phone}</p>
                )}
              </div>
            </div>

            {/* 아이디·비밀번호 설정 */}
            <div className={styles.passwordSection}>
              <h3 className={styles.sectionTitle}>아이디·비밀번호 설정</h3>
              
              <div className={styles.formRow}>
                <label className={styles.label}>
                  아이디 <span className={styles.asterisk}>*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="아이디를 입력해 주세요"
                  className={`${styles.input} ${errors.username ? styles.inputError : ""}`}
                />
                <p className={styles.hint}>
                  아이디는 4~15자 이내 영문 소문자와 숫자만 입력해 주세요
                </p>
                {errors.username && (
                  <p className={styles.error}>{errors.username}</p>
                )}
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  이메일 <span className={styles.asterisk}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="이메일을 입력해 주세요"
                  className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                />
                {errors.email && (
                  <p className={styles.error}>{errors.email}</p>
                )}
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  비밀번호 <span className={styles.asterisk}>*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력해 주세요"
                  className={`${styles.input} ${errors.password ? styles.inputError : ""}`}
                />
                <p className={styles.hint}>
                  영문+숫자+특수 문자 조합 8자리 이상 입력해주세요
                </p>
                {errors.password && (
                  <p className={styles.error}>{errors.password}</p>
                )}
              </div>

              <div className={styles.formRow}>
                <label className={styles.label}>
                  비밀번호 확인 <span className={styles.asterisk}>*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="한 번 더 입력해 주세요"
                  className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                />
                {errors.confirmPassword && (
                  <p className={styles.error}>{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            </div>
          </div>

          {/* 가입하기 버튼 */}
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? "가입 중..." : "가입하기"}
          </button>

 
        </form>
      </div>

      {/* 약관 모달 */}
      <TermsModal
        isOpen={isModalOpen}
        onClose={closeTermsModal}
        type={currentTermsType}
      />

      {/* 경고 모달 */}
      {showWarningModal && (
        <div className={styles.modalOverlay} onClick={closeWarningModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>알림</h3>
              <button className={styles.modalCloseButton} onClick={closeWarningModal}>
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>본인인증 키 준비 중입니다. 이름, 생년월일, 휴대폰 번호를 직접 입력해 주세요.</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.modalButton} onClick={closeWarningModal}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
