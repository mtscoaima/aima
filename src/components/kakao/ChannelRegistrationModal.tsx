"use client";

import React, { useState, useEffect } from "react";
import { X, Info, CheckCircle, AlertCircle } from "lucide-react";

interface Category {
  code: string;
  name: string;
}

interface ChannelRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ChannelRegistrationModal: React.FC<ChannelRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Step 관리 (1: 정보 입력, 2: 토큰 입력, 3: 완료)
  const [step, setStep] = useState(1);

  // Form 데이터
  const [yellowId, setYellowId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [token, setToken] = useState("");

  // 카테고리 목록
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  // 로딩 및 에러 상태
  const [isRequesting, setIsRequesting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // 카테고리 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    setErrorMessage("");
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch("/api/kakao/categories", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "카테고리 조회 실패");
      }

      setCategories(data.categories || []);
    } catch (error) {
      console.error("카테고리 조회 실패:", error);
      setErrorMessage(error instanceof Error ? error.message : "카테고리 조회 실패");
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Step 1: 토큰 요청
  const handleRequestToken = async () => {
    // 유효성 검사
    if (!yellowId.trim()) {
      setErrorMessage("카카오톡 채널 ID를 입력해주세요.");
      return;
    }

    if (!yellowId.startsWith("@")) {
      setErrorMessage("채널 ID는 @로 시작해야 합니다. (예: @example)");
      return;
    }

    if (!phoneNumber.trim()) {
      setErrorMessage("전화번호를 입력해주세요.");
      return;
    }

    if (!categoryCode) {
      setErrorMessage("카테고리를 선택해주세요.");
      return;
    }

    setIsRequesting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch("/api/kakao/sender/token", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          yellowId: yellowId.trim(),
          phoneNumber: phoneNumber.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "토큰 요청 실패");
      }

      setSuccessMessage("인증 토큰이 카카오톡으로 전송되었습니다. (유효기간: 7일)");
      setStep(2);
    } catch (error) {
      console.error("토큰 요청 실패:", error);
      setErrorMessage(error instanceof Error ? error.message : "토큰 요청 실패");
    } finally {
      setIsRequesting(false);
    }
  };

  // Step 2: 발신프로필 등록
  const handleRegister = async () => {
    if (!token.trim()) {
      setErrorMessage("인증 토큰을 입력해주세요.");
      return;
    }

    setIsRegistering(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const authToken = localStorage.getItem('accessToken');
      if (!authToken) {
        throw new Error('로그인이 필요합니다.');
      }

      const response = await fetch("/api/kakao/sender/register", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token.trim(),
          phoneNumber: phoneNumber.trim(),
          yellowId: yellowId.trim(),
          categoryCode: categoryCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "발신프로필 등록 실패");
      }

      setSuccessMessage("발신프로필이 성공적으로 등록되었습니다!");
      setStep(3);

      // 2초 후 모달 닫기 및 콜백 실행
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error("발신프로필 등록 실패:", error);
      setErrorMessage(error instanceof Error ? error.message : "발신프로필 등록 실패");
    } finally {
      setIsRegistering(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setStep(1);
    setYellowId("");
    setPhoneNumber("");
    setCategoryCode("");
    setToken("");
    setErrorMessage("");
    setSuccessMessage("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            카카오 채널 연동
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isRequesting || isRegistering}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">정보 입력</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} style={{ width: step >= 2 ? "100%" : "0%" }} />
            </div>
            <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">토큰 입력</span>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-full ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`} style={{ width: step >= 3 ? "100%" : "0%" }} />
            </div>
            <div className={`flex items-center ${step >= 3 ? "text-blue-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200"}`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">완료</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-700">{errorMessage}</span>
            </div>
          )}

          {/* 성공 메시지 */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-green-700">{successMessage}</span>
            </div>
          )}

          {/* Step 1: 정보 입력 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카카오톡 채널 ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={yellowId}
                  onChange={(e) => setYellowId(e.target.value)}
                  placeholder="@example"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  @ 기호를 포함한 채널 ID를 입력하세요
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  관리자 전화번호 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="010-XXXX-XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  카카오톡 채널 관리자 전화번호
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리 <span className="text-red-500">*</span>
                </label>
                {isLoadingCategories ? (
                  <div className="text-sm text-gray-500">로딩 중...</div>
                ) : (
                  <select
                    value={categoryCode}
                    onChange={(e) => setCategoryCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">카테고리를 선택하세요</option>
                    {categories.map((category) => (
                      <option key={category.code} value={category.code}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">안내사항</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>입력한 전화번호로 카카오톡 인증 토큰이 전송됩니다</li>
                      <li>토큰 유효기간은 7일입니다</li>
                      <li>카카오톡 채널은 비즈니스 인증이 완료되어 있어야 합니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 토큰 입력 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">카카오톡을 확인하세요</p>
                    <p>
                      <strong>{phoneNumber}</strong> 번호로 인증 토큰이 전송되었습니다.
                      카카오톡 앱에서 토큰을 확인하고 아래에 입력해주세요.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  인증 토큰 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="카카오톡에서 받은 토큰을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>채널 ID: <strong>{yellowId}</strong></p>
                <p>전화번호: <strong>{phoneNumber}</strong></p>
                <p>카테고리: <strong>{categories.find(c => c.code === categoryCode)?.name}</strong></p>
              </div>
            </div>
          )}

          {/* Step 3: 완료 */}
          {step === 3 && (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                연동 완료!
              </h3>
              <p className="text-sm text-gray-600">
                카카오 채널이 성공적으로 연동되었습니다.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          {step === 1 && (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={isRequesting}
              >
                취소
              </button>
              <button
                onClick={handleRequestToken}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRequesting || !yellowId || !phoneNumber || !categoryCode}
              >
                {isRequesting ? "요청 중..." : "인증 토큰 요청"}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                disabled={isRegistering}
              >
                이전
              </button>
              <button
                onClick={handleRegister}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isRegistering || !token}
              >
                {isRegistering ? "등록 중..." : "연동 완료"}
              </button>
            </>
          )}

          {step === 3 && (
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChannelRegistrationModal;
