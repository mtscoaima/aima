"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface CustomField {
  label: string;
  example: string;
}

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (contact: {
    name: string;
    phone_number: string;
    custom_data: Record<string, string>;
  }) => void;
  customFields?: CustomField[];
}

const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  customFields = [],
}) => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customData, setCustomData] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleCustomFieldChange = (label: string, value: string) => {
    setCustomData({
      ...customData,
      [label]: value
    });
  };

  const handleSubmit = () => {
    // 전화번호 검증
    const cleanPhone = phoneNumber.replace(/-/g, "");
    if (!/^01[0-9]{8,9}$/.test(cleanPhone)) {
      alert("올바른 전화번호를 입력해주세요 (예: 01012345678)");
      return;
    }

    if (!name.trim()) {
      alert("이름을 입력해주세요");
      return;
    }

    onConfirm({
      name: name.trim(),
      phone_number: cleanPhone,
      custom_data: customData
    });

    // 초기화
    setName("");
    setPhoneNumber("");
    setCustomData({});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">새 연락처 추가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 이름 입력 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* 전화번호 입력 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="01012345678"
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* 확장 필드 입력 */}
          {customFields.length > 0 && (
            <div className="pt-2 border-t">
              <h3 className="text-sm font-medium mb-3 text-gray-700">확장 필드</h3>
              {customFields.map((field, index) => (
                <div key={index} className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">
                    {field.label}
                    {field.example && (
                      <span className="text-xs text-gray-400 ml-1">
                        (예: {field.example})
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={customData[field.label] || ""}
                    onChange={(e) => handleCustomFieldChange(field.label, e.target.value)}
                    placeholder={field.example || `${field.label} 입력`}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-2 p-4 border-t bg-gray-50">
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            추가
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddContactModal;
