"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Headset, FileText, Clock } from "lucide-react";

interface LoadContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialActiveTab?: string;
}

const LoadContentModal: React.FC<LoadContentModalProps> = ({
  isOpen,
  onClose,
  initialActiveTab = "saved",
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialActiveTab);
    }
  }, [isOpen, initialActiveTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">저장한 내용 불러오기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="내용, 제목으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded text-sm"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={onlyMine}
                    onChange={(e) => setOnlyMine(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      onlyMine ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform translate-y-1 ${
                        onlyMine ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600">오래된 순</span>
              </label>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 ${
              activeTab === "saved"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("saved")}
          >
            <FileText className="w-4 h-4" />
            저장 목록
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 ${
              activeTab === "recent"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("recent")}
          >
            <Clock className="w-4 h-4" />
            최근 발송 목록
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 p-4 min-h-[300px] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <p className="text-sm">저장된 내용이 없습니다.</p>
          </div>
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
            <span className="text-xs text-gray-400 ml-2">ESC</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadContentModal;