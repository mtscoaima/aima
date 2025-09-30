"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { passwordValidation } from "@/lib/utils";
import TermsModal, { TermsType } from "@/components/TermsModal";

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
    <div className="min-h-screen flex items-center justify-center bg-white p-5 max-[768px]:p-4 max-[768px]:-mt-[100px] max-[480px]:p-3 max-[480px]:-mt-[100px]">
      <div className="w-full">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1f2937] m-0 max-[768px]:text-xl max-[480px]:text-lg">회원가입</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-0">
            
          <div className="flex flex-col gap-6 items-stretch max-[1024px]:gap-5">
            {/* 약관 동의 카드 */}
            <div className="bg-white rounded-2xl shadow-md p-10 flex-1 mb-0 max-[768px]:p-6 max-[480px]:p-5">
              {/* 전체동의 */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer font-semibold mb-2">
                  <input
                    type="checkbox"
                    checked={isAllAgreed}
                    onChange={(e) => handleAgreeAll(e.target.checked)}
                    className="w-5 h-5 cursor-pointer flex-shrink-0"
                  />
                  <span className="text-[#1f2937] text-base ml-2">전체동의</span>
                </label>
                <p className="text-[#64748b] text-sm leading-relaxed my-2 mx-0">
                  이용약관, 개인정보 수집 및 이용, 마케팅·이벤트 정보수신(선택)에 모두 동의할게요.
                </p>
                <div className="h-px bg-[#e2e8f0] my-4"></div>
              </div>

            {/* 이용약관 */}
            <div className="mt-2">
              <h3 className="text-lg font-semibold text-[#1f2937] m-0 mb-5">이용약관</h3>

              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between cursor-pointer py-3 border-b border-[#f3f4f6] max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-2">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="w-5 h-5 cursor-pointer flex-shrink-0"
                  />
                  <span className="flex items-center flex-1 ml-3 text-[#374151] text-sm">
                    <span className="text-[#4285f4] font-semibold">[필수]</span> 서비스 이용약관 동의
                  </span>
                  <button
                    type="button"
                    onClick={() => openTermsModal("service")}
                    className="bg-none border-none text-[#4285f4] text-sm cursor-pointer underline hover:text-[#3367d6] max-[480px]:self-end"
                  >
                    보기
                  </button>
                </label>
                {errors.agreeTerms && (
                  <p className="text-xs text-[#dc2626] m-0">{errors.agreeTerms}</p>
                )}

                <label className="flex items-center justify-between cursor-pointer py-3 border-b border-[#f3f4f6] max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-2">
                  <input
                    type="checkbox"
                    name="agreePrivacy"
                    checked={formData.agreePrivacy}
                    onChange={handleInputChange}
                    className="w-5 h-5 cursor-pointer flex-shrink-0"
                  />
                  <span className="flex items-center flex-1 ml-3 text-[#374151] text-sm">
                    <span className="text-[#4285f4] font-semibold">[필수]</span> 개인정보 수집 및 이용 동의
                  </span>
                  <button
                    type="button"
                    onClick={() => openTermsModal("privacy")}
                    className="bg-none border-none text-[#4285f4] text-sm cursor-pointer underline hover:text-[#3367d6] max-[480px]:self-end"
                  >
                    보기
                  </button>
                </label>
                {errors.agreePrivacy && (
                  <p className="text-xs text-[#dc2626] m-0">{errors.agreePrivacy}</p>
                )}

                <label className="flex items-center justify-between cursor-pointer py-3 border-b border-[#f3f4f6] max-[480px]:flex-col max-[480px]:items-start max-[480px]:gap-2">
                  <input
                    type="checkbox"
                    name="agreeMarketing"
                    checked={formData.agreeMarketing}
                    onChange={handleInputChange}
                    className="w-5 h-5 cursor-pointer flex-shrink-0"
                  />
                  <span className="flex items-center flex-1 ml-3 text-[#374151] text-sm">
                    <span className="text-[#64748b] font-semibold">[선택]</span> 마케팅 정보 수집 및 활용 동의
                  </span>
                  <button
                    type="button"
                    onClick={() => openTermsModal("marketing")}
                    className="bg-none border-none text-[#4285f4] text-sm cursor-pointer underline hover:text-[#3367d6] max-[480px]:self-end"
                  >
                    보기
                  </button>
                </label>
              </div>

              {/* 추가 텍스트 */}
              <div className="mt-6 p-4 bg-white rounded-lg border border-[#e2e8f0]">
                <ul className="m-0 pl-4 list-disc">
                  <li className="text-[#64748b] text-xs leading-relaxed mb-2 last:mb-0">필수 항목은 서비스 이용에 필요한 정보로, 동의해야 서비스 이용이 가능합니다.</li>
                  <li className="text-[#64748b] text-xs leading-relaxed mb-2 last:mb-0">마케팅 정보 수집 및 활용 동의는 선택 사항으로, 동의하지 않아도 가입은 가능하나 혜택 안내를 받지 못할 수 있습니다.</li>
                </ul>
              </div>
                          </div>
                          
            </div>

            {/* 회원정보 입력 카드 */}
            <div className="bg-white rounded-2xl shadow-md p-10 flex-1 mb-0 max-[768px]:p-6 max-[480px]:p-5">
            {/* 회원정보 입력 */}
            <div className="mt-0">
              <h3 className="text-lg font-semibold text-[#1f2937] m-0 mb-5">회원정보 입력</h3>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-[#374151]">
                  이름 <span className="text-[#dc2626]">*</span>
                </label>
                <div className="flex gap-2 items-center max-[480px]:flex-col max-[480px]:items-stretch max-[480px]:gap-2">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full py-3 px-4 border-2 ${errors.name ? 'border-[#dc2626]' : 'border-[#e5e7eb]'} rounded-lg text-base text-[#1f2937] transition-colors duration-200 focus:outline-none focus:border-[#4285f4] box-border max-[480px]:text-sm max-[480px]:py-2.5 max-[480px]:px-3 read-only:bg-[#f9fafb] read-only:text-[#6b7280] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed`}
                    placeholder="이름을 입력해 주세요"
                  />
                  <button
                    type="button"
                    onClick={handleIdentityVerification}
                    className="bg-[#4285f4] text-white border-none rounded-lg py-3 px-5 text-sm font-semibold cursor-pointer transition-colors duration-200 whitespace-nowrap flex-shrink-0 hover:bg-[#3367d6] disabled:bg-[#9ca3af] disabled:cursor-not-allowed max-[480px]:w-full"
                    disabled={isLoading}
                  >
                    본인인증
                  </button>
                </div>
                {errors.name && (
                  <p className="text-xs text-[#dc2626] m-0">{errors.name}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-[#374151]">생년월일 <span className="text-[#dc2626]">*</span></label>
                <input
                  type="text"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={`w-full py-3 px-4 border-2 ${errors.birthDate ? 'border-[#dc2626]' : 'border-[#e5e7eb]'} rounded-lg text-base text-[#1f2937] transition-colors duration-200 focus:outline-none focus:border-[#4285f4] box-border max-[480px]:text-sm max-[480px]:py-2.5 max-[480px]:px-3 read-only:bg-[#f9fafb] read-only:text-[#6b7280] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed`}
                  placeholder="생년월일을 입력해 주세요"
                />
                {errors.birthDate && (
                  <p className="text-xs text-[#dc2626] m-0">{errors.birthDate}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-[#374151]">휴대폰 번호 <span className="text-[#dc2626]">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`w-full py-3 px-4 border-2 ${errors.phone ? 'border-[#dc2626]' : 'border-[#e5e7eb]'} rounded-lg text-base text-[#1f2937] transition-colors duration-200 focus:outline-none focus:border-[#4285f4] box-border max-[480px]:text-sm max-[480px]:py-2.5 max-[480px]:px-3 read-only:bg-[#f9fafb] read-only:text-[#6b7280] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed`}
                  placeholder="휴대폰 번호를 입력해 주세요"
                />
                {errors.phone && (
                  <p className="text-xs text-[#dc2626] m-0">{errors.phone}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-[#374151]">
                  이메일 <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="이메일을 입력해 주세요"
                  className={`w-full py-3 px-4 border-2 ${errors.email ? 'border-[#dc2626]' : 'border-[#e5e7eb]'} rounded-lg text-base text-[#1f2937] transition-colors duration-200 focus:outline-none focus:border-[#4285f4] box-border max-[480px]:text-sm max-[480px]:py-2.5 max-[480px]:px-3 read-only:bg-[#f9fafb] read-only:text-[#6b7280] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed`}
                />
                {errors.email && (
                  <p className="text-xs text-[#dc2626] m-0">{errors.email}</p>
                )}
              </div>
            </div>

            {/* 아이디·비밀번호 설정 */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-[#1f2937] m-0 mb-5">아이디·비밀번호 설정</h3>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-[#374151]">
                  아이디 <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="아이디를 입력해 주세요"
                  className={`w-full py-3 px-4 border-2 ${errors.username ? 'border-[#dc2626]' : 'border-[#e5e7eb]'} rounded-lg text-base text-[#1f2937] transition-colors duration-200 focus:outline-none focus:border-[#4285f4] box-border max-[480px]:text-sm max-[480px]:py-2.5 max-[480px]:px-3 read-only:bg-[#f9fafb] read-only:text-[#6b7280] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed`}
                />
                <p className="text-xs text-[#6b7280] m-0">
                  아이디는 4~15자 이내 영문 소문자와 숫자만 입력해 주세요
                </p>
                {errors.username && (
                  <p className="text-xs text-[#dc2626] m-0">{errors.username}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-[#374151]">
                  비밀번호 <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="비밀번호를 입력해 주세요"
                  className={`w-full py-3 px-4 border-2 ${errors.password ? 'border-[#dc2626]' : 'border-[#e5e7eb]'} rounded-lg text-base text-[#1f2937] transition-colors duration-200 focus:outline-none focus:border-[#4285f4] box-border max-[480px]:text-sm max-[480px]:py-2.5 max-[480px]:px-3 read-only:bg-[#f9fafb] read-only:text-[#6b7280] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed`}
                />
                <p className="text-xs text-[#6b7280] m-0">
                  영문+숫자+특수 문자 조합 8자리 이상 입력해주세요
                </p>
                {errors.password && (
                  <p className="text-xs text-[#dc2626] m-0">{errors.password}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 mb-4">
                <label className="text-sm font-semibold text-[#374151]">
                  비밀번호 확인 <span className="text-[#dc2626]">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="한 번 더 입력해 주세요"
                  className={`w-full py-3 px-4 border-2 ${errors.confirmPassword ? 'border-[#dc2626]' : 'border-[#e5e7eb]'} rounded-lg text-base text-[#1f2937] transition-colors duration-200 focus:outline-none focus:border-[#4285f4] box-border max-[480px]:text-sm max-[480px]:py-2.5 max-[480px]:px-3 read-only:bg-[#f9fafb] read-only:text-[#6b7280] disabled:bg-[#f3f4f6] disabled:text-[#9ca3af] disabled:cursor-not-allowed`}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-[#dc2626] m-0">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            </div>
          </div>

          {/* 가입하기 버튼 */}
          <button
            type="submit"
            className="bg-[#4285f4] text-white border-none rounded-xl py-4 px-4 text-lg font-semibold cursor-pointer transition-all duration-200 mt-8 w-full hover:bg-[#3367d6] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(66,133,244,0.3)] disabled:bg-[#9ca3af] disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none max-[768px]:text-base max-[768px]:py-3.5 max-[480px]:text-sm max-[480px]:py-3"
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
        <div className="fixed top-0 left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={closeWarningModal}>
          <div className="bg-white rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.2)] max-w-[400px] w-[90%] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-[#e2e8f0]">
              <h3 className="m-0 text-lg font-semibold text-[#1f2937]">알림</h3>
              <button className="bg-none border-none text-2xl text-[#6b7280] cursor-pointer p-0 w-[30px] h-[30px] flex items-center justify-center rounded-full transition-colors duration-200 hover:bg-[#f3f4f6]" onClick={closeWarningModal}>
                ×
              </button>
            </div>
            <div className="p-5">
              <p className="m-0 text-[#374151] leading-relaxed text-sm">본인인증 키 준비 중입니다. 이름, 생년월일, 휴대폰 번호를 직접 입력해 주세요.</p>
            </div>
            <div className="p-5 border-t border-[#e2e8f0] flex justify-end">
              <button className="bg-[#4285f4] text-white border-none rounded-lg py-2.5 px-5 text-sm font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#3367d6]" onClick={closeWarningModal}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
