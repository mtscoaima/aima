"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, HelpCircle } from "lucide-react";

interface SaveContentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CheckedItems {
  messageContent: boolean;
  currentSenderNumber: boolean;
  currentRecipientList: boolean;
  uploadedFileList: boolean;
  attachedImage: boolean;
  currentSelectedTemplate: boolean;
  rcsSlides: boolean;
  additionalButtons: boolean;
  sendHistory: boolean;
  currentSelectedMessageType: boolean;
}

const SaveContentModal: React.FC<SaveContentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [saveName, setSaveName] = useState("");
  const [checkedItems, setCheckedItems] = useState<CheckedItems>({
    messageContent: true,
    currentSenderNumber: true,
    currentRecipientList: false,
    uploadedFileList: false,
    attachedImage: true,
    currentSelectedTemplate: true,
    rcsSlides: true,
    additionalButtons: true,
    sendHistory: true,
    currentSelectedMessageType: true,
  });

  if (!isOpen) return null;

  const handleCheckboxChange = (key: keyof CheckedItems) => {
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">새로운 내용 저장</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 저장 이름 입력 */}
          <div className="mb-6">
            <h3 className="text-base font-medium mb-3">1. 저장 이름 입력</h3>
            <input
              type="text"
              placeholder="저장 이름"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* 저장할 항목 선택 */}
          <div className="mb-6">
            <h3 className="text-base font-medium mb-3">2. 저장할 항목 선택</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.messageContent}
                  onChange={() => handleCheckboxChange('messageContent')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">메시지 제목 및 본문</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.currentSenderNumber}
                  onChange={() => handleCheckboxChange('currentSenderNumber')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">현재 발신번호</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.currentRecipientList}
                  onChange={() => handleCheckboxChange('currentRecipientList')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">현재 수신자목록</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.uploadedFileList}
                  onChange={() => handleCheckboxChange('uploadedFileList')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-400">입력한 치환문구 (변수내용)</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.attachedImage}
                  onChange={() => handleCheckboxChange('attachedImage')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">첨부한 이미지</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.currentSelectedTemplate}
                  onChange={() => handleCheckboxChange('currentSelectedTemplate')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">현재 선택된 템플릿</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.rcsSlides}
                  onChange={() => handleCheckboxChange('rcsSlides')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">RCS 슬라이드</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.additionalButtons}
                  onChange={() => handleCheckboxChange('additionalButtons')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">추가한 버튼 목록</span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.sendHistory}
                  onChange={() => handleCheckboxChange('sendHistory')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">기타 발송 옵션</span>
                <HelpCircle className="w-4 h-4 text-gray-400" />
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checkedItems.currentSelectedMessageType}
                  onChange={() => handleCheckboxChange('currentSelectedMessageType')}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm">현재 선택된 메시지 타입</span>
              </label>
            </div>
          </div>

          <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600">
            내용저장하기
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

export default SaveContentModal;