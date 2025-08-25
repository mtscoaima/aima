import React, { useState } from "react";
import Image from "next/image";
import styles from "./KakaoSignupModal.module.css";

interface KakaoInfo {
  email: string;
  name: string;
  profileImage?: string;
}

interface KakaoSignupData {
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
}

interface KakaoSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: (signupData: KakaoSignupData) => Promise<void>;
  kakaoInfo: KakaoInfo;
  isLoading?: boolean;
}

export default function KakaoSignupModal({
  isOpen,
  onClose,
  onSignup,
  kakaoInfo,
  isLoading = false,
}: KakaoSignupModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    userType: "" as "general" | "salesperson" | "",
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
    // 추천인 정보
    referrerName: "",
    referrerCode: "",
    // 약관 동의
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // 에러 메시지 클리어
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));

      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }
  };

  const validateStep = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1: // 기본 정보
        if (!formData.phoneNumber.trim()) {
          newErrors.phoneNumber = "전화번호를 입력해주세요.";
        }
        if (!formData.userType) {
          newErrors.userType = "사용자 유형을 선택해주세요.";
        }
        break;

      case 2: // 기업 정보 (일반회원인 경우)
        if (formData.userType === "general") {
          if (!formData.companyName.trim()) {
            newErrors.companyName = "회사명을 입력해주세요.";
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
            newErrors.companyPhone = "회사 전화번호를 입력해주세요.";
          }
        }
        break;

      case 3: // 제출 서류 (일반회원인 경우)
        if (formData.userType === "general") {
          if (!formData.businessRegistration) {
            newErrors.businessRegistration = "사업자등록증을 업로드해주세요.";
          }
        }
        break;

      case 5: // 약관 동의
        if (!formData.agreeTerms) {
          newErrors.agreeTerms = "서비스 이용약관에 동의해주세요.";
        }
        if (!formData.agreePrivacy) {
          newErrors.agreePrivacy = "개인정보 처리방침에 동의해주세요.";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // 영업사원인 경우 기업 정보 단계 스킵
    if (formData.userType === "salesperson" && currentStep === 1) {
      setCurrentStep(4); // 추천인 정보로 바로 이동
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    // 영업사원인 경우 기업 정보 단계 스킵
    if (formData.userType === "salesperson" && currentStep === 4) {
      setCurrentStep(1); // 기본 정보로 바로 이동
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    try {
      await onSignup({
        email: kakaoInfo.email,
        name: kakaoInfo.name,
        phoneNumber: formData.phoneNumber,
        userType: formData.userType as "general" | "salesperson",
        // 기업 정보
        companyName: formData.companyName,
        ceoName: formData.ceoName,
        businessNumber: formData.businessNumber,
        companyAddress: formData.companyAddress,
        companyAddressDetail: formData.companyAddressDetail,
        companyPhone: formData.companyPhone,
        toll080Number: formData.toll080Number,
        customerServiceNumber: formData.customerServiceNumber,
        // 제출 서류
        businessRegistration: formData.businessRegistration,
        employmentCertificate: formData.employmentCertificate,
        // 세금계산서 정보
        taxInvoiceEmail: formData.taxInvoiceEmail,
        taxInvoiceManager: formData.taxInvoiceManager,
        taxInvoiceContact: formData.taxInvoiceContact,
        // 추천인 정보
        referrerName: formData.referrerName,
        referrerCode: formData.referrerCode,
        // 약관 동의
        agreeTerms: formData.agreeTerms,
        agreePrivacy: formData.agreePrivacy,
        agreeMarketing: formData.agreeMarketing,
      });
    } catch (error) {
      console.error("회원가입 실패:", error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getMaxStep = () => {
    return formData.userType === "salesperson" ? 5 : 5; // 영업사원도 동일하게 5단계
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "기본 정보";
      case 2:
        return "기업 정보";
      case 3:
        return "제출 서류";
      case 4:
        return "추천인 정보 (선택)";
      case 5:
        return "약관 동의";
      default:
        return "회원가입";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: // 기본 정보
        return (
          <>
            {/* 카카오 정보 표시 */}
            <div className={styles.kakaoInfo}>
              <div className={styles.kakaoLabel}>카카오 계정 정보</div>
              <div className={styles.kakaoDetails}>
                {kakaoInfo.profileImage && (
                  <Image
                    src={kakaoInfo.profileImage}
                    alt="프로필"
                    width={48}
                    height={48}
                    className={styles.profileImage}
                  />
                )}
                <div className={styles.accountInfo}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>이메일:</span>
                    <span className={styles.infoValue}>{kakaoInfo.email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>이름:</span>
                    <span className={styles.infoValue}>{kakaoInfo.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 추가 정보 입력 */}
            <div className={styles.formGroup}>
              <label htmlFor="phoneNumber" className={styles.formLabel}>
                휴대폰 번호 *
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`${styles.formInput} ${
                  errors.phoneNumber ? styles.inputError : ""
                }`}
                placeholder="010-0000-0000"
                disabled={isLoading}
              />
              {errors.phoneNumber && (
                <span className={styles.errorMessage}>
                  {errors.phoneNumber}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="userType" className={styles.formLabel}>
                사용자 유형 *
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                className={`${styles.formSelect} ${
                  errors.userType ? styles.inputError : ""
                }`}
                disabled={isLoading}
              >
                <option value="">선택해주세요</option>
                <option value="general">일반회원 (광고주)</option>
                <option value="salesperson">영업사원</option>
              </select>
              {errors.userType && (
                <span className={styles.errorMessage}>{errors.userType}</span>
              )}
            </div>
          </>
        );

      case 2: // 기업 정보
        return (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="companyName" className={styles.formLabel}>
                회사명 *
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`${styles.formInput} ${
                  errors.companyName ? styles.inputError : ""
                }`}
                placeholder="회사명을 입력하세요"
                disabled={isLoading}
              />
              {errors.companyName && (
                <span className={styles.errorMessage}>
                  {errors.companyName}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="ceoName" className={styles.formLabel}>
                대표자명 *
              </label>
              <input
                type="text"
                id="ceoName"
                name="ceoName"
                value={formData.ceoName}
                onChange={handleInputChange}
                className={`${styles.formInput} ${
                  errors.ceoName ? styles.inputError : ""
                }`}
                placeholder="대표자명을 입력하세요"
                disabled={isLoading}
              />
              {errors.ceoName && (
                <span className={styles.errorMessage}>{errors.ceoName}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="businessNumber" className={styles.formLabel}>
                사업자등록번호 *
              </label>
              <input
                type="text"
                id="businessNumber"
                name="businessNumber"
                value={formData.businessNumber}
                onChange={handleInputChange}
                className={`${styles.formInput} ${
                  errors.businessNumber ? styles.inputError : ""
                }`}
                placeholder="000-00-00000"
                disabled={isLoading}
              />
              {errors.businessNumber && (
                <span className={styles.errorMessage}>
                  {errors.businessNumber}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="companyAddress" className={styles.formLabel}>
                회사 주소 *
              </label>
              <input
                type="text"
                id="companyAddress"
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleInputChange}
                className={`${styles.formInput} ${
                  errors.companyAddress ? styles.inputError : ""
                }`}
                placeholder="회사 주소를 입력하세요"
                disabled={isLoading}
              />
              {errors.companyAddress && (
                <span className={styles.errorMessage}>
                  {errors.companyAddress}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label
                htmlFor="companyAddressDetail"
                className={styles.formLabel}
              >
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
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="companyPhone" className={styles.formLabel}>
                회사 전화번호 *
              </label>
              <input
                type="tel"
                id="companyPhone"
                name="companyPhone"
                value={formData.companyPhone}
                onChange={handleInputChange}
                className={`${styles.formInput} ${
                  errors.companyPhone ? styles.inputError : ""
                }`}
                placeholder="02-0000-0000"
                disabled={isLoading}
              />
              {errors.companyPhone && (
                <span className={styles.errorMessage}>
                  {errors.companyPhone}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="toll080Number" className={styles.formLabel}>
                080 번호
              </label>
              <input
                type="tel"
                id="toll080Number"
                name="toll080Number"
                value={formData.toll080Number}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="080-0000-0000"
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label
                htmlFor="customerServiceNumber"
                className={styles.formLabel}
              >
                고객센터 번호
              </label>
              <input
                type="tel"
                id="customerServiceNumber"
                name="customerServiceNumber"
                value={formData.customerServiceNumber}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="1588-0000"
                disabled={isLoading}
              />
            </div>
          </>
        );

      case 3: // 제출 서류
        return (
          <>
            <div className={styles.formGroup}>
              <label
                htmlFor="businessRegistration"
                className={styles.formLabel}
              >
                사업자등록증 *
              </label>
              <input
                type="file"
                id="businessRegistration"
                name="businessRegistration"
                onChange={handleFileChange}
                className={`${styles.formInput} ${
                  errors.businessRegistration ? styles.inputError : ""
                }`}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                disabled={isLoading}
              />
              {errors.businessRegistration && (
                <span className={styles.errorMessage}>
                  {errors.businessRegistration}
                </span>
              )}
              <div className={styles.fileInfo}>
                JPG, PNG, GIF, PDF, DOC, DOCX 파일만 업로드 가능 (최대 10MB)
              </div>
            </div>

            <div className={styles.formGroup}>
              <label
                htmlFor="employmentCertificate"
                className={styles.formLabel}
              >
                재직증명서
              </label>
              <input
                type="file"
                id="employmentCertificate"
                name="employmentCertificate"
                onChange={handleFileChange}
                className={styles.formInput}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                disabled={isLoading}
              />
              <div className={styles.fileInfo}>
                JPG, PNG, GIF, PDF, DOC, DOCX 파일만 업로드 가능 (최대 10MB)
              </div>
            </div>

            {/* 세금계산서 정보 */}
            <div className={styles.sectionTitle}>세금계산서 정보</div>

            <div className={styles.formGroup}>
              <label htmlFor="taxInvoiceEmail" className={styles.formLabel}>
                세금계산서 수신 이메일
              </label>
              <input
                type="email"
                id="taxInvoiceEmail"
                name="taxInvoiceEmail"
                value={formData.taxInvoiceEmail}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="tax@company.com"
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="taxInvoiceManager" className={styles.formLabel}>
                담당자명
              </label>
              <input
                type="text"
                id="taxInvoiceManager"
                name="taxInvoiceManager"
                value={formData.taxInvoiceManager}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="담당자명을 입력하세요"
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="taxInvoiceContact" className={styles.formLabel}>
                담당자 연락처
              </label>
              <input
                type="tel"
                id="taxInvoiceContact"
                name="taxInvoiceContact"
                value={formData.taxInvoiceContact}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="010-0000-0000"
                disabled={isLoading}
              />
            </div>
          </>
        );

      case 4: // 추천인 정보
        return (
          <>
            <div className={styles.optionalSection}>
              <p className={styles.optionalText}>
                추천인이 있으시면 입력해주세요. (선택사항)
              </p>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="referrerName" className={styles.formLabel}>
                추천인 이름
              </label>
              <input
                type="text"
                id="referrerName"
                name="referrerName"
                value={formData.referrerName}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="추천인 이름을 입력하세요"
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="referrerCode" className={styles.formLabel}>
                추천인 코드
              </label>
              <input
                type="text"
                id="referrerCode"
                name="referrerCode"
                value={formData.referrerCode}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="추천인 코드를 입력하세요"
                disabled={isLoading}
              />
            </div>
          </>
        );

      case 5: // 약관 동의
        return (
          <div className={styles.agreementSection}>
            <h3 className={styles.agreementTitle}>약관 동의</h3>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  className={styles.checkboxInput}
                  disabled={isLoading}
                />
                <span className={styles.checkboxText}>
                  서비스 이용약관에 동의합니다 (필수)
                </span>
              </label>
              {errors.agreeTerms && (
                <span className={styles.errorMessage}>{errors.agreeTerms}</span>
              )}
            </div>

            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="agreePrivacy"
                  checked={formData.agreePrivacy}
                  onChange={handleInputChange}
                  className={styles.checkboxInput}
                  disabled={isLoading}
                />
                <span className={styles.checkboxText}>
                  개인정보 처리방침에 동의합니다 (필수)
                </span>
              </label>
              {errors.agreePrivacy && (
                <span className={styles.errorMessage}>
                  {errors.agreePrivacy}
                </span>
              )}
            </div>

            <div className={styles.checkboxGroup}>
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
                  마케팅 정보 수신에 동의합니다 (선택)
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            카카오 간편 회원가입 - {getStepTitle()}
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* 진행 단계 표시 */}
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{
                width: `${(currentStep / getMaxStep()) * 100}%`,
              }}
            />
          </div>
          <div className={styles.stepText}>
            {currentStep} / {getMaxStep()}
          </div>
        </div>

        <div className={styles.signupForm}>
          {renderStepContent()}

          {/* 버튼 그룹 */}
          <div className={styles.buttonGroup}>
            {currentStep > 1 && (
              <button
                type="button"
                className={styles.previousButton}
                onClick={handlePrevious}
                disabled={isLoading}
              >
                이전
              </button>
            )}

            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isLoading}
            >
              취소
            </button>

            {currentStep < getMaxStep() ? (
              <button
                type="button"
                className={styles.nextButton}
                onClick={handleNext}
                disabled={isLoading}
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "가입 중..." : "회원가입 완료"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
