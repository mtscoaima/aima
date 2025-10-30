"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { createAlimtalkTemplate } from "@/utils/kakaoTemplateApi";

interface TemplateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderKey: string;
  onSuccess: () => void;
}

const TemplateCreateModal: React.FC<TemplateCreateModalProps> = ({
  isOpen,
  onClose,
  senderKey,
  onSuccess,
}) => {
  const [templateCode, setTemplateCode] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [requestInspection, setRequestInspection] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (!templateCode.trim()) {
      setError("템플릿 코드를 입력하세요.");
      return;
    }

    if (templateCode.length > 30) {
      setError("템플릿 코드는 최대 30자까지 가능합니다.");
      return;
    }

    if (!templateName.trim()) {
      setError("템플릿 이름을 입력하세요.");
      return;
    }

    if (templateName.length > 200) {
      setError("템플릿 이름은 최대 200자까지 가능합니다.");
      return;
    }

    if (!templateContent.trim()) {
      setError("템플릿 내용을 입력하세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      await createAlimtalkTemplate({
        senderKey,
        templateCode: templateCode.trim(),
        templateName: templateName.trim(),
        templateContent: templateContent.trim(),
        templateMessageType: "BA",
        templateEmphasizeType: "NONE",
        requestInspection,
      });

      alert(
        requestInspection
          ? "템플릿이 등록되고 검수 요청되었습니다."
          : "템플릿이 등록되었습니다."
      );

      // 폼 초기화
      setTemplateCode("");
      setTemplateName("");
      setTemplateContent("");
      setRequestInspection(false);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("템플릿 생성 오류:", error);
      setError(error instanceof Error ? error.message : "템플릿 생성 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">템플릿 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 템플릿 코드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 코드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              placeholder="예: WELCOME_001 (최대 30자, 영문/숫자/언더스코어)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={30}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              {templateCode.length}/30자
            </p>
          </div>

          {/* 템플릿 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="예: 가입환영 메시지 (최대 200자)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              {templateName.length}/200자
            </p>
          </div>

          {/* 템플릿 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              placeholder={`안녕하세요, #{고객명}님!\n가입을 환영합니다.\n\n변수는 #{변수명} 형식으로 입력하세요.`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={10}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              변수 형식: #{"{"}변수명{"}"} (예: #{"{"}고객명{"}"}, #{"{"}주문번호{"}"})
            </p>
          </div>

          {/* 검수 요청 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requestInspection"
              checked={requestInspection}
              onChange={(e) => setRequestInspection(e.target.checked)}
              className="rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="requestInspection" className="text-sm text-gray-700">
              등록 후 즉시 검수 요청
            </label>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>안내:</strong>
              <br />
              • 템플릿은 등록 후 카카오 검수를 받아야 사용 가능합니다.
              <br />
              • 검수는 보통 2~3 영업일 소요됩니다.
              <br />• 기본형(BA) 템플릿으로 등록되며, 버튼은 등록 후 수정할 수
              있습니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "등록 중..." : "템플릿 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateCreateModal;
