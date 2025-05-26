"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./signup.module.css";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    // 기본 정보
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    phoneVerified: false,
    
    // 기업 정보
    companyName: "",
    ceoName: "",
    businessNumber: "",
    companyAddress: "",
    companyAddressDetail: "",
    companyPhone: "",
    toll080Number: "",
    customerServiceNumber: "",
    
    // 제출 서류
    businessRegistration: null as File | null,
    employmentCertificate: null as File | null,
    
    // 세금계산서 정보
    taxInvoiceEmail: "",
    taxInvoiceManager: "",
    taxInvoiceContact: "",
    
    // 약관 동의
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerificationSent, setIsVerificationSent] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    }
  };

  const handlePhoneVerification = async () => {
    // 휴대폰 인증 로직
    setIsVerificationSent(true);
    // TODO: 실제 인증 코드 발송 API 호출
  };

  const handleVerifyCode = async () => {
    // 인증 코드 확인 로직
    // TODO: 실제 인증 코드 확인 API 호출
    setFormData((prev) => ({ ...prev, phoneVerified: true }));
  };

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        // 기본 정보 검증
    if (!formData.email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "유효한 이메일 주소를 입력해주세요.";
    }
    if (!formData.name.trim()) {
      newErrors.name = "이름을 입력해주세요.";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "전화번호를 입력해주세요.";
    }
        if (!formData.phoneVerified) {
          newErrors.phone = "휴대폰 인증을 완료해주세요.";
        }
    if (!formData.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    } else if (formData.password.length < 6) {
      newErrors.password = "비밀번호는 최소 6자 이상이어야 합니다.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }
        break;

      case 2:
        // 기업 정보 검증
        if (!formData.companyName.trim()) {
          newErrors.companyName = "기업명을 입력해주세요.";
        }
        if (!formData.ceoName.trim()) {
          newErrors.ceoName = "대표자명을 입력해주세요.";
        }
        if (!formData.businessNumber.trim()) {
          newErrors.businessNumber = "사업자등록번호를 입력해주세요.";
        }
        if (!formData.companyAddress.trim()) {
          newErrors.companyAddress = "회사 주소를 입력해주세요.";
        }
        if (!formData.companyPhone.trim()) {
          newErrors.companyPhone = "대표번호를 입력해주세요.";
        }
        break;

      case 3:
        // 제출 서류 검증
        if (!formData.businessRegistration) {
          newErrors.businessRegistration = "사업자등록증을 업로드해주세요.";
        }
        break;

      case 4:
        // 세금계산서 정보 검증
        if (!formData.taxInvoiceEmail.trim()) {
          newErrors.taxInvoiceEmail = "세금계산서 수신 이메일을 입력해주세요.";
        }
        if (!formData.taxInvoiceManager.trim()) {
          newErrors.taxInvoiceManager = "담당자명을 입력해주세요.";
        }
        if (!formData.taxInvoiceContact.trim()) {
          newErrors.taxInvoiceContact = "담당자 연락처를 입력해주세요.";
        }
        break;

      case 5:
        // 약관 동의 검증
    if (!formData.agreeTerms) {
      newErrors.agreeTerms = "이용약관에 동의해주세요.";
    }
    if (!formData.agreePrivacy) {
      newErrors.agreePrivacy = "개인정보 처리방침에 동의해주세요.";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(currentStep)) {
      return;
    }

    try {
      // FormData 생성 (파일 업로드 포함)
      const submitData = new FormData();
      
      // 텍스트 데이터 추가
      Object.keys(formData).forEach((key) => {
        const value = formData[key as keyof typeof formData];
        if (value !== null && typeof value !== 'object') {
          submitData.append(key, value.toString());
        }
      });
      
      // 파일 추가
      if (formData.businessRegistration) {
        submitData.append('businessRegistration', formData.businessRegistration);
      }
      if (formData.employmentCertificate) {
        submitData.append('employmentCertificate', formData.employmentCertificate);
      }

      await signup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phoneNumber: formData.phone,
        companyInfo: {
          companyName: formData.companyName,
          ceoName: formData.ceoName,
          businessNumber: formData.businessNumber,
          companyAddress: formData.companyAddress,
          companyAddressDetail: formData.companyAddressDetail,
          companyPhone: formData.companyPhone,
          toll080Number: formData.toll080Number,
          customerServiceNumber: formData.customerServiceNumber,
        },
        taxInvoiceInfo: {
          email: formData.taxInvoiceEmail,
          manager: formData.taxInvoiceManager,
          contact: formData.taxInvoiceContact,
        },
        agreeMarketing: formData.agreeMarketing,
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

          {/* 진행 상태 표시 */}
          <div className={styles.progressBar}>
            <div className={`${styles.progressStep} ${currentStep >= 1 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>기본정보</span>
            </div>
            <div className={`${styles.progressStep} ${currentStep >= 2 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>2</span>
              <span className={styles.stepLabel}>기업정보</span>
            </div>
            <div className={`${styles.progressStep} ${currentStep >= 3 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>3</span>
              <span className={styles.stepLabel}>제출서류</span>
            </div>
            <div className={`${styles.progressStep} ${currentStep >= 4 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>4</span>
              <span className={styles.stepLabel}>세금계산서</span>
            </div>
            <div className={`${styles.progressStep} ${currentStep >= 5 ? styles.active : ''}`}>
              <span className={styles.stepNumber}>5</span>
              <span className={styles.stepLabel}>약관동의</span>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* 회원가입 폼 */}
          <form onSubmit={handleSubmit} className={styles.signupForm}>
            {/* Step 1: 기본 정보 */}
            {currentStep === 1 && (
            <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>기본 정보</h3>
                
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="email" className={`${styles.formLabel} ${styles.required}`}>
                    이메일 주소
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.email ? styles.error : ""}`}
                    placeholder="example@email.com"
                    required
                    disabled={isLoading}
                  />
                    {errors.email && <p className={styles.formError}>{errors.email}</p>}
                  </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="name" className={`${styles.formLabel} ${styles.required}`}>
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.name ? styles.error : ""}`}
                    placeholder="홍길동"
                    required
                    disabled={isLoading}
                  />
                    {errors.name && <p className={styles.formError}>{errors.name}</p>}
                  </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="phone" className={`${styles.formLabel} ${styles.required}`}>
                    휴대폰 번호
                  </label>
                    <div className={styles.phoneInputGroup}>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                        className={`${styles.formInput} ${errors.phone ? styles.error : ""}`}
                    placeholder="010-1234-5678"
                    required
                        disabled={isLoading || formData.phoneVerified}
                      />
                      {!formData.phoneVerified && (
                        <button
                          type="button"
                          onClick={handlePhoneVerification}
                          className={styles.verifyButton}
                          disabled={!formData.phone || isLoading}
                        >
                          인증번호 발송
                        </button>
                      )}
                    </div>
                    {errors.phone && <p className={styles.formError}>{errors.phone}</p>}
                  </div>
                </div>

                {isVerificationSent && !formData.phoneVerified && (
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="verificationCode" className={styles.formLabel}>
                        인증번호
                      </label>
                      <div className={styles.phoneInputGroup}>
                        <input
                          type="text"
                          id="verificationCode"
                          value={verificationCode}
                          onChange={(e) => setVerificationCode(e.target.value)}
                          className={styles.formInput}
                          placeholder="인증번호 6자리"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyCode}
                          className={styles.verifyButton}
                          disabled={verificationCode.length !== 6}
                        >
                          확인
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {formData.phoneVerified && (
                  <div className={styles.verifiedMessage}>
                    ✅ 휴대폰 인증이 완료되었습니다.
              </div>
                )}

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="password" className={`${styles.formLabel} ${styles.required}`}>
                    비밀번호
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.password ? styles.error : ""}`}
                    placeholder="6자 이상의 비밀번호"
                    required
                    disabled={isLoading}
                  />
                    {errors.password && <p className={styles.formError}>{errors.password}</p>}
                  </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword" className={`${styles.formLabel} ${styles.required}`}>
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.confirmPassword ? styles.error : ""}`}
                    placeholder="비밀번호를 다시 입력하세요"
                    required
                    disabled={isLoading}
                  />
                    {errors.confirmPassword && <p className={styles.formError}>{errors.confirmPassword}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: 기업 정보 */}
            {currentStep === 2 && (
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>기업 정보</h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyName" className={`${styles.formLabel} ${styles.required}`}>
                      기업명
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.companyName ? styles.error : ""}`}
                      placeholder="(주)회사명"
                      required
                    />
                    {errors.companyName && <p className={styles.formError}>{errors.companyName}</p>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="ceoName" className={`${styles.formLabel} ${styles.required}`}>
                      대표자명
                    </label>
                    <input
                      type="text"
                      id="ceoName"
                      name="ceoName"
                      value={formData.ceoName}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.ceoName ? styles.error : ""}`}
                      placeholder="대표자명"
                      required
                    />
                    {errors.ceoName && <p className={styles.formError}>{errors.ceoName}</p>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="businessNumber" className={`${styles.formLabel} ${styles.required}`}>
                      사업자등록번호
                    </label>
                    <input
                      type="text"
                      id="businessNumber"
                      name="businessNumber"
                      value={formData.businessNumber}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.businessNumber ? styles.error : ""}`}
                      placeholder="123-45-67890"
                      required
                    />
                    {errors.businessNumber && <p className={styles.formError}>{errors.businessNumber}</p>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyAddress" className={`${styles.formLabel} ${styles.required}`}>
                      회사 주소
                    </label>
                    <input
                      type="text"
                      id="companyAddress"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.companyAddress ? styles.error : ""}`}
                      placeholder="주소를 입력하세요"
                      required
                    />
                    {errors.companyAddress && <p className={styles.formError}>{errors.companyAddress}</p>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyAddressDetail" className={styles.formLabel}>
                      상세 주소
                    </label>
                    <input
                      type="text"
                      id="companyAddressDetail"
                      name="companyAddressDetail"
                      value={formData.companyAddressDetail}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="상세 주소를 입력하세요"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="companyPhone" className={`${styles.formLabel} ${styles.required}`}>
                      대표번호
                    </label>
                    <input
                      type="tel"
                      id="companyPhone"
                      name="companyPhone"
                      value={formData.companyPhone}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.companyPhone ? styles.error : ""}`}
                      placeholder="02-1234-5678"
                      required
                    />
                    {errors.companyPhone && <p className={styles.formError}>{errors.companyPhone}</p>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="toll080Number" className={styles.formLabel}>
                      080 수신거부 번호
                    </label>
                    <input
                      type="tel"
                      id="toll080Number"
                      name="toll080Number"
                      value={formData.toll080Number}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="080-123-4567"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="customerServiceNumber" className={styles.formLabel}>
                      고객센터 번호
                    </label>
                    <input
                      type="tel"
                      id="customerServiceNumber"
                      name="customerServiceNumber"
                      value={formData.customerServiceNumber}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="1588-1234"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: 제출 서류 */}
            {currentStep === 3 && (
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>제출 서류</h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="businessRegistration" className={`${styles.formLabel} ${styles.required}`}>
                      사업자등록증
                    </label>
                    <input
                      type="file"
                      id="businessRegistration"
                      name="businessRegistration"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                    <p className={styles.fileHelp}>PDF, JPG, PNG 파일만 업로드 가능합니다.</p>
                    {errors.businessRegistration && <p className={styles.formError}>{errors.businessRegistration}</p>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="employmentCertificate" className={styles.formLabel}>
                      재직증명서 (선택)
                    </label>
                    <input
                      type="file"
                      id="employmentCertificate"
                      name="employmentCertificate"
                      onChange={handleFileChange}
                      className={styles.fileInput}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                    <p className={styles.fileHelp}>영업사원인 경우 재직증명서를 업로드해주세요.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: 세금계산서 정보 */}
            {currentStep === 4 && (
              <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>세금계산서 수령 정보</h3>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="taxInvoiceEmail" className={`${styles.formLabel} ${styles.required}`}>
                      수신 이메일
                    </label>
                    <input
                      type="email"
                      id="taxInvoiceEmail"
                      name="taxInvoiceEmail"
                      value={formData.taxInvoiceEmail}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.taxInvoiceEmail ? styles.error : ""}`}
                      placeholder="tax@company.com"
                      required
                    />
                    {errors.taxInvoiceEmail && <p className={styles.formError}>{errors.taxInvoiceEmail}</p>}
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="taxInvoiceManager" className={`${styles.formLabel} ${styles.required}`}>
                      담당자명
                    </label>
                    <input
                      type="text"
                      id="taxInvoiceManager"
                      name="taxInvoiceManager"
                      value={formData.taxInvoiceManager}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.taxInvoiceManager ? styles.error : ""}`}
                      placeholder="담당자명"
                      required
                    />
                    {errors.taxInvoiceManager && <p className={styles.formError}>{errors.taxInvoiceManager}</p>}
              </div>
            </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="taxInvoiceContact" className={`${styles.formLabel} ${styles.required}`}>
                      담당자 연락처
                    </label>
                    <input
                      type="tel"
                      id="taxInvoiceContact"
                      name="taxInvoiceContact"
                      value={formData.taxInvoiceContact}
                      onChange={handleInputChange}
                      className={`${styles.formInput} ${errors.taxInvoiceContact ? styles.error : ""}`}
                      placeholder="010-1234-5678"
                      required
                    />
                    {errors.taxInvoiceContact && <p className={styles.formError}>{errors.taxInvoiceContact}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: 약관 동의 */}
            {currentStep === 5 && (
            <div className={styles.formSection}>
                <h3 className={styles.sectionTitle}>약관 동의</h3>
                
              <div className={styles.termsGroup}>
                  <label className={`${styles.checkboxLabel} ${styles.requiredTerm} ${errors.agreeTerms ? styles.error : ""}`}>
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
                      <strong>서비스 이용약관</strong>에 동의합니다 (필수)
                  </span>
                  <Link href="/terms" className={styles.termsLink}>
                    보기
                  </Link>
                </label>
                  {errors.agreeTerms && <p className={styles.formError}>{errors.agreeTerms}</p>}

                  <label className={`${styles.checkboxLabel} ${styles.requiredTerm} ${errors.agreePrivacy ? styles.error : ""}`}>
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
                      <strong>개인정보 수집 및 이용</strong>에 동의합니다 (필수)
                  </span>
                  <Link href="/privacy" className={styles.termsLink}>
                    보기
                  </Link>
                </label>
                  {errors.agreePrivacy && <p className={styles.formError}>{errors.agreePrivacy}</p>}

                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      name="agreeMarketing"
                      checked={formData.agreeMarketing}
                      onChange={handleInputChange}
                      className={styles.checkboxInput}
                      disabled={isLoading}
                    />
                    <span className={styles.checkboxText}>
                      <strong>마케팅 정보 수집 및 활용</strong>에 동의합니다 (선택)
                    </span>
                    <Link href="/marketing" className={styles.termsLink}>
                      보기
                    </Link>
                  </label>
                </div>
              </div>
            )}

            {/* 버튼 영역 */}
            <div className={styles.buttonGroup}>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className={styles.prevButton}
                  disabled={isLoading}
                >
                  이전
                </button>
              )}
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={styles.nextButton}
                  disabled={isLoading}
                >
                  다음
                </button>
              ) : (
            <button
              type="submit"
              className={styles.signupButton}
              disabled={isLoading}
            >
                  {isLoading ? "회원가입 중..." : "회원가입 완료"}
            </button>
              )}
            </div>
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
