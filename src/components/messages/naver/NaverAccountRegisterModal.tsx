"use client";

import React, { useState } from "react";
import { X, CheckCircle, Copy, ExternalLink } from "lucide-react";

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
  const [talkAccountId, setTalkAccountId] = useState("");
  const [talkName, setTalkName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    message?: string;
    troubleshooting?: string[];
    details?: unknown;
  } | null>(null);
  const [issuedPartnerKey, setIssuedPartnerKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // 자동 발급 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorDetails(null);
    setIssuedPartnerKey(null);

    if (!talkAccountId.trim()) {
      setError("톡톡 계정 ID를 입력해주세요.");
      return;
    }

    // W로 시작하는 7자리 형식 검증
    if (!/^W[A-Z0-9]{6}$/i.test(talkAccountId.trim())) {
      setError("톡톡 계정 ID 형식이 올바르지 않습니다. (예: WF6BPKH)");
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
          partnerId: talkAccountId.trim(),
          talkName: talkName.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // 상세 에러 정보 저장
        setErrorDetails({
          message: result.message,
          troubleshooting: result.troubleshooting,
          details: result.details,
        });
        throw new Error(result.error || "파트너 키 발급 실패");
      }

      // 성공
      setIssuedPartnerKey(result.partnerKey);
      alert("파트너 키가 성공적으로 발급되고 등록되었습니다!");

      // 3초 후 모달 닫기
      setTimeout(() => {
        setTalkAccountId("");
        setTalkName("");
        setIssuedPartnerKey(null);
        onSuccess();
        onClose();
      }, 3000);

    } catch (err) {
      console.error("파트너 키 발급 오류:", err);
      console.error("상세 에러 정보:", errorDetails);
      setError(err instanceof Error ? err.message : "파트너 키 발급 중 오류가 발생했습니다.");
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
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
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <X className="w-5 h-5" />
              등록 실패
            </h4>
            <p className="text-sm text-red-700 mb-3">{error}</p>

            {/* API에서 반환한 상세 메시지 */}
            {errorDetails?.message && errorDetails.message !== error && (
              <div className="text-sm text-red-600 mb-3 bg-red-100 p-2 rounded border border-red-300">
                <strong>상세:</strong> {errorDetails.message}
              </div>
            )}

            {/* 해결 방법 안내 */}
            {errorDetails?.troubleshooting && errorDetails.troubleshooting.length > 0 && (
              <div className="text-sm text-red-600 space-y-1">
                <p className="font-medium">✅ 해결 방법:</p>
                <ol className="list-decimal ml-5 space-y-1">
                  {errorDetails.troubleshooting.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* 사업자 등록 에러일 경우 특별 안내 */}
            {(error.includes('사업자 등록') || errorDetails?.message?.includes('사업자 등록')) && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm">
                <p className="font-medium text-yellow-800 mb-2">⚠️ 사업자 등록 필요</p>
                <p className="text-yellow-700 text-xs">
                  네이버 톡톡 파트너센터에서 <strong>&quot;계정대표 변경&quot;</strong> 메뉴를 찾아
                  사업자 정보를 등록해주세요. 또는 계정이 아직 검수 대기 중일 수 있습니다 (1-2일 소요).
                </p>
              </div>
            )}
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 톡톡 계정 ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                톡톡 계정 ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={talkAccountId}
                onChange={(e) => setTalkAccountId(e.target.value.toUpperCase())}
                placeholder="예: WF6BPKH"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
                required
                maxLength={7}
              />
              <p className="text-xs text-gray-500 mt-1">
                W로 시작하는 7자리 형식
              </p>
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
                placeholder="예: 우리회사톡"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>

            {/* 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                ✅ 네이버 톡톡 파트너키 발급 절차
              </p>
              <div className="text-xs text-blue-800 space-y-2">
                <div>
                  <strong>1️⃣ 네이버 톡톡 계정 생성</strong>
                  <p className="ml-4 mt-1">
                    • <a
                      href="https://partner.talk.naver.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      네이버 톡톡 파트너 센터
                      <ExternalLink className="w-3 h-3" />
                    </a> 접속<br />
                    • 네이버 메일로 로그인 후 관리자로 가입
                  </p>
                </div>

                <div>
                  <strong>2️⃣ 프로필 정보 입력</strong>
                  <p className="ml-4 mt-1">
                    • 프로필 이미지 및 프로필명 입력<br />
                    • 신청 후 검수 대기 (1~2일 소요)
                  </p>
                </div>

                <div>
                  <strong>3️⃣ 톡톡 계정 ID 확인</strong>
                  <p className="ml-4 mt-1">
                    • 검수 통과 후 네이버 톡톡 파트너 센터에서 확인<br />
                    • 형식: W로 시작하는 7자리 (예: WF6BPKH)<br />
                    • 또는 talk.naver.com/&#123;계정ID&#125; URL에서 확인
                  </p>
                </div>

                <div>
                  <strong>4️⃣ 아래 입력란에 톡톡 계정 ID 입력</strong>
                  <p className="ml-4 mt-1">
                    • 자동으로 파트너키가 발급되고 등록됩니다
                  </p>
                </div>
              </div>
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
      </div>
    </div>
  );
};

export default NaverAccountRegisterModal;
