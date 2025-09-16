"use client";

import React from "react";
import { X, Upload, Headset } from "lucide-react";

interface LimitRemovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LimitRemovalModal: React.FC<LimitRemovalModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">개수제한해제</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">📄 발신번호 개수 제한 해제 서류</h3>
            <p className="text-sm text-gray-600 mb-4">
              최대로 등록할 수 있는 발신번호 수를 변경합니다. 개수 제한 해제 서류를 업로드하세요.
            </p>

            <button className="w-full border border-gray-300 text-gray-600 px-4 py-2 rounded text-sm hover:bg-gray-50 mb-4">
              서류양식 다운로드 📎
            </button>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <h4 className="font-medium text-gray-700 mb-1">발신번호 개수 제한 해제 서류 업로드</h4>
              <p className="text-sm text-gray-500">
                이곳에 파일 끌어오기 혹은 찾아보기
              </p>
            </div>
          </div>

          <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600">
            개수제한해제
          </button>
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-end p-4 border-t bg-gray-50">
          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <Headset className="w-4 h-4" />
            채팅 문의
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LimitRemovalModal;