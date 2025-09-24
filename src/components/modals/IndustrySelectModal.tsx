"use client";

import React, { useState } from "react";
import NTSFinder from "@/components/common/NTSFinder";

type Item = { code: string; name: string; label?: string; ksic?: string; upte?: string };
type SelectedIndustry = Item & { group: string };

interface IndustrySelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (industry: { topLevel: string; specific: string; code: string; name: string }) => void;
  title?: string;
}

export default function IndustrySelectModal({
  isOpen,
  onClose,
  onSelect,
  title = "업종 선택"
}: IndustrySelectModalProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<SelectedIndustry | null>(null);

  if (!isOpen) return null;

  const handleSelect = (industry: SelectedIndustry) => {
    setSelectedIndustry(industry);
  };

  const handleConfirm = () => {
    if (selectedIndustry) {
      onSelect({
        topLevel: selectedIndustry.group,
        specific: selectedIndustry.name,
        code: selectedIndustry.code,
        name: selectedIndustry.name
      });
      setSelectedIndustry(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedIndustry(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 bg-gray-500/75 transition-opacity z-[9998]"
          onClick={handleClose}
        />

        {/* 모달 컨텐츠 */}
        <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-6xl w-full max-w-4xl max-h-[90vh] flex flex-col z-[9999]">
          {/* 헤더 */}
          <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {title}
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 선택된 업종 미리보기 */}
          {selectedIndustry && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">선택된 업종</p>
                  <p className="text-lg text-blue-800">
                    <span className="font-semibold">{selectedIndustry.group}</span>
                    <span className="mx-2">{">"}</span>
                    <span>{selectedIndustry.name}</span>
                    <span className="ml-2 text-sm text-blue-600">({selectedIndustry.code})</span>
                  </p>
                  {selectedIndustry.label && (
                    <p className="text-sm text-blue-600 mt-1">
                      {selectedIndustry.label}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedIndustry(null)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  선택 해제
                </button>
              </div>
            </div>
          )}

          {/* NTSFinder 컴포넌트 */}
          <div className="px-6 py-6 flex-1 overflow-y-auto" style={{ minHeight: '500px', maxHeight: '60vh' }}>
            <NTSFinder onSelect={handleSelect} />
          </div>

          {/* 푸터 버튼 */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedIndustry}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              선택 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}