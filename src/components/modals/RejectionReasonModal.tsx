"use client";

import React from "react";

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  rejectionReason: string | null;
  campaignName: string;
}

const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  isOpen,
  onClose,
  rejectionReason,
  campaignName
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />
        
        {/* 모달 컨테이너 */}
        <div className="relative bg-white rounded-lg shadow-xl transform transition-all w-full max-w-md">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                반려 사유
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="px-6 py-4">
            <div className="mb-4">
              <p className="text-sm text-gray-600">캠페인:</p>
              <p className="font-medium text-gray-900">{campaignName}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">반려 사유:</p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 min-h-[120px]">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {rejectionReason || "반려사유가 없습니다."}
                </p>
              </div>
            </div>
          </div>

          {/* 푸터 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RejectionReasonModal;
