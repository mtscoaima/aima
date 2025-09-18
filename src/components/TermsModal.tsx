"use client";

import React from "react";
import { useTermsContent } from "@/hooks/useTermsContent";
import { TermType } from "@/lib/termsService";

export type TermsType = "service" | "privacy" | "marketing";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TermsType;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, type }) => {
  // TermsType을 TermType으로 변환
  const getTermType = (type: TermsType): TermType => {
    switch (type) {
      case "service":
        return "SERVICE_TERMS";
      case "privacy":
        return "PRIVACY_POLICY";
      case "marketing":
        return "MARKETING_CONSENT";
      default:
        return "SERVICE_TERMS";
    }
  };

  const termType = getTermType(type);
  const { data, loading, error } = useTermsContent(termType);

  if (!isOpen) return null;

  // Markdown을 HTML로 변환하는 간단한 함수
  const formatContent = (content: string) => {
    return content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  };

  const getTermsContent = () => {
    if (loading) {
      return {
        title: "로딩 중...",
        content: (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">약관을 불러오는 중...</span>
          </div>
        ),
      };
    }

    if (error || !data) {
      return {
        title: "오류",
        content: (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error || "약관을 불러올 수 없습니다."}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              다시 시도
            </button>
          </div>
        ),
      };
    }

    return {
      title: data.title,
      content: (
        <div className="prose prose-sm max-w-none
          prose-headings:text-gray-900 prose-headings:font-bold
          prose-h1:text-lg prose-h1:mb-4 prose-h1:mt-4 first:prose-h1:mt-0
          prose-h2:text-base prose-h2:mb-3 prose-h2:mt-4
          prose-h3:text-sm prose-h3:mb-2 prose-h3:mt-3
          prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-3
          prose-li:text-gray-700 prose-li:mb-1
          prose-ol:mb-4 prose-ul:mb-4
          prose-strong:text-gray-900 prose-strong:font-semibold
          prose-table:border-collapse
          prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:p-2 prose-th:text-left prose-th:text-xs
          prose-td:border prose-td:border-gray-300 prose-td:p-2 prose-td:text-xs">
          <div dangerouslySetInnerHTML={{
            __html: `<div>${formatContent(data.content)}</div>`
          }} />
        </div>
      ),
    };
  };

  const { title, content } = getTermsContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {content}
        </div>

        <div className="border-t border-gray-200 p-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsModal;