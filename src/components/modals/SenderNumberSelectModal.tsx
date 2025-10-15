"use client";

import React, { useState } from "react";
import { X, Search, Settings } from "lucide-react";

interface SenderNumberSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManageClick: () => void;
  onSelect?: (phoneNumber: string) => void;
}

const SenderNumberSelectModal: React.FC<SenderNumberSelectModalProps> = ({
  isOpen,
  onClose,
  onManageClick,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">발신번호 선택</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 영역 */}
        <div className="p-4 border-b">
          <div className="relative">
            <input
              type="text"
              placeholder="번호, 별칭으로 검색"
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* 발신번호 목록 */}
        <div className="p-4 min-h-[200px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p>사용 가능한 발신번호가 없습니다.</p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onManageClick}
            className="flex items-center cursor-pointer gap-2 py-2 text-gray-600 hover:text-gray-800"
          >
            <Settings className="w-4 h-4" />
            발신번호 관리
          </button>
          <button
            onClick={onClose}
            className="py-2 gap-2 text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            닫기
            <span className="text-xs text-gray-400">ESC</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SenderNumberSelectModal;