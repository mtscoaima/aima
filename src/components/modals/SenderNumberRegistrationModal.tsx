"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Building, User, Headset, Check } from "lucide-react";

interface SenderNumberRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SenderNumberRegistrationModal: React.FC<SenderNumberRegistrationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<"business" | "individual" | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">발신번호 등록</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">사업자(회사)번호 입니까?</h3>
            <p className="text-sm text-gray-600 mb-4">
              개인사업자 및 법인사업자, 공공기관, 비영리단체 포함
            </p>

            <div className="grid grid-cols-2 gap-4">
              <button
                className={`flex items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
                  selectedType === "business"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedType("business")}
              >
                {selectedType === "business" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Building className="w-5 h-5" />
                )}
                <span className="font-medium">예 (선택됨)</span>
              </button>
              <button
                className={`flex items-center justify-center gap-2 p-4 rounded-lg transition-colors ${
                  selectedType === "individual"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
                onClick={() => setSelectedType("individual")}
              >
                {selectedType === "individual" ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <User className="w-5 h-5" />
                )}
                <span className="font-medium">아니오 (개인)</span>
              </button>
            </div>
          </div>

          {/* 선택에 따른 추가 내용 */}
          {selectedType && (
            <div className="mt-6">
              {selectedType === "business" ? (
                <div>
                  <p className="text-sm text-gray-600 mb-4">먼저 사업자 정보 등록이 필요합니다.</p>
                  <button className="w-full border border-blue-500 text-blue-500 py-3 rounded-lg font-medium hover:bg-blue-50">
                    사업자인증 요청하기
                  </button>
                </div>
              ) : (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">발신번호 입력</h4>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <input
                      type="text"
                      placeholder="발신번호 입력"
                      className="w-full text-center text-lg text-gray-400 bg-transparent border-none outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-end p-4 border-t bg-gray-50">
          <button
            onClick={() => router.push("/support?tab=contact")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            문의
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default SenderNumberRegistrationModal;