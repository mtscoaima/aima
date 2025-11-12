"use client";

import React, { useState } from "react";
import { X, Key, FileText, Copy, CheckCircle } from "lucide-react";

interface NaverAccountRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'auto' | 'manual';

const NaverAccountRegisterModal: React.FC<NaverAccountRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('auto');
  const [partnerId, setPartnerId] = useState("");
  const [partnerKey, setPartnerKey] = useState("");
  const [talkName, setTalkName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issuedPartnerKey, setIssuedPartnerKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 자동 발급 핸들러
  const handleAutoIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIssuedPartnerKey(null);

    if (!partnerId.trim()) {
      setError("파트너 ID를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/naver/partner/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partnerId: partnerId.trim(),
          talkName: talkName.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "파트너 키 발급 실패");
      }

      // 성공
      setIssuedPartnerKey(result.partnerKey);
      alert("파트너 키가 성공적으로 발급되고 등록되었습니다!");

      // 3초 후 모달 닫기
      setTimeout(() => {
        setPartnerId("");
        setTalkName("");
        setIssuedPartnerKey(null);
        onSuccess();
        onClose();
      }, 3000);

    } catch (err) {
      console.error("파트너 키 발급 오류:", err);
      setError(err instanceof Error ? err.message : "파트너 키 발급 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 수동 입력 핸들러
  const handleManualSubmit = async (e: React.FormEvent) => {
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

  // 파트너 키 복사
  const handleCopy = () => {
    if (issuedPartnerKey) {
      navigator.clipboard.writeText(issuedPartnerKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

        {/* 탭 메뉴 */}
        <div className="flex border-b mb-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('auto');
              setError(null);
              setIssuedPartnerKey(null);
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'auto'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={isLoading}
          >
            <Key className="w-4 h-4 inline mr-1" />
            자동 발급
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setError(null);
              setIssuedPartnerKey(null);
            }}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              activeTab === 'manual'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={isLoading}
          >
            <FileText className="w-4 h-4 inline mr-1" />
            수동 입력
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 발급 성공 메시지 */}
        {issuedPartnerKey && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-800">파트너 키 발급 성공!</span>
            </div>
            <div className="bg-white border border-green-300 rounded px-3 py-2 mt-2">
              <div className="flex items-center justify-between">
                <code className="text-xs text-gray-800 break-all flex-1">
                  {issuedPartnerKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="ml-2 p-1 hover:bg-gray-100 rounded"
                  title="복사"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-xs text-green-700 mt-2">
              파트너 키가 DB에 저장되었습니다. 이 창은 자동으로 닫힙니다.
            </p>
          </div>
        )}

        {/* 자동 발급 탭 */}
        {activeTab === 'auto' && (
          <form onSubmit={handleAutoIssue}>
            <div className="space-y-4">
              {/* 파트너 ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  파트너 ID (partnerId) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={partnerId}
                  onChange={(e) => setPartnerId(e.target.value)}
                  placeholder="예: w4t84u"
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
                  <strong>파트너 ID 받는 방법:</strong><br />
                  1. MTS 고객센터 연락 (1577-2029)<br />
                  2. 네이버 톡톡 계정 정보 제공<br />
                  3. partnerId 발급 요청<br />
                  4. 받은 partnerId를 위 입력란에 입력
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
                disabled={isLoading || !!issuedPartnerKey}
              >
                {isLoading ? "발급 중..." : "파트너 키 발급"}
              </button>
            </div>
          </form>
        )}

        {/* 수동 입력 탭 */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit}>
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
                  3. Partner Key 복사<br />
                  <br />
                  <strong>또는</strong><br />
                  Postman/curl로 직접 MTS API 호출 후<br />
                  발급받은 partnerKey 입력
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
        )}
      </div>
    </div>
  );
};

export default NaverAccountRegisterModal;
