"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface NaverAccountRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NaverAccountRegisterModal: React.FC<NaverAccountRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [partnerKey, setPartnerKey] = useState("");
  const [talkName, setTalkName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!partnerKey.trim()) {
      setError("파트너키를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/naver/accounts/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partnerKey: partnerKey.trim(),
          talkName: talkName.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "계정 등록 실패");
      }

      // 성공
      alert("네이버 톡톡 계정이 성공적으로 등록되었습니다.");
      setPartnerKey("");
      setTalkName("");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("계정 등록 오류:", err);
      setError(err instanceof Error ? err.message : "계정 등록 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">네이버 톡톡 계정 등록</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 파트너키 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                파트너키 (partnerKey) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={partnerKey}
                onChange={(e) => setPartnerKey(e.target.value)}
                placeholder="네이버 톡톡 파트너키 입력"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
            </div>

            {/* 톡 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                톡 이름 (선택사항)
              </label>
              <input
                type="text"
                value={talkName}
                onChange={(e) => setTalkName(e.target.value)}
                placeholder="예: 우리 회사 톡"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {/* 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>파트너 키 확인 방법:</strong><br />
                1. 네이버 톡톡 파트너 센터 로그인<br />
                2. 설정 → API 관리<br />
                3. Partner Key 복사
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "등록 중..." : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NaverAccountRegisterModal;
