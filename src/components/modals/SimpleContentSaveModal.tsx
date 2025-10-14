"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Headset } from "lucide-react";

interface SimpleContentSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
}

const SimpleContentSaveModal: React.FC<SimpleContentSaveModalProps> = ({
  isOpen,
  onClose,
  currentContent,
}) => {
  const router = useRouter();
  const [saveName, setSaveName] = useState("");

  if (!isOpen) return null;

  const handleSave = () => {
    alert("저장 기능은 준비 중입니다.");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">내용 저장</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 저장명 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="저장명"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* 내용 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
            <textarea
              value={currentContent}
              readOnly
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 resize-none"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!saveName.trim()}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            내용 저장하기
          </button>
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

export default SimpleContentSaveModal;