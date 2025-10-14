"use client";

import React, { useState } from "react";
import { X, HelpCircle, BookOpen } from "lucide-react";

interface TextUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
}

const TextUploadModal: React.FC<TextUploadModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [text, setText] = useState("");
  const [saveToAddressBook, setSaveToAddressBook] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(text);
    setText("");
    setSaveToAddressBook(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">수신자 목록에 연락처 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <label className="block font-medium mb-2">연락처 입력</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`입력 예시)\n01022221111 홍길동\n010-1234-1111 박김동\n+821012341234 고길동`}
              className="w-full h-64 p-3 border border-gray-300 rounded text-sm resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              여러 연락처를 추가하는 경우 엔터(Enter)키를 통해 줄바꿈 합니다.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm underline cursor-pointer">고급 옵션 열기</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToAddressBook}
                  onChange={(e) => setSaveToAddressBook(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
              <BookOpen className="w-4 h-4 text-orange-500" />
              <span className="text-sm">주소록 생성 후 저장하기</span>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirm}
                disabled={!text.trim()}
                className="w-full px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                수신자 목록에 추가
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                미리보기
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t bg-gray-50">
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800">
            채팅 문의
          </button>
          <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextUploadModal;