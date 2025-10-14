"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, HelpCircle } from "lucide-react";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (groupName: string, customFields: CustomField[]) => void;
}

interface CustomField {
  id: string;
  label: string;
  example: string;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([
    { id: "1", label: "", example: "" },
  ]);
  const [showHelp, setShowHelp] = useState(false);

  if (!isOpen) return null;

  const handleAddField = () => {
    setCustomFields([
      ...customFields,
      { id: Date.now().toString(), label: "", example: "" }
    ]);
  };

  const handleRemoveField = (id: string) => {
    setCustomFields(customFields.filter(field => field.id !== id));
  };

  const handleFieldChange = (id: string, key: "label" | "example", value: string) => {
    setCustomFields(customFields.map(field =>
      field.id === id ? { ...field, [key]: value } : field
    ));
  };

  const handleSubmit = () => {
    if (!groupName.trim()) {
      alert("폴더명을 입력해주세요");
      return;
    }

    const validFields = customFields.filter(f => f.label.trim());
    onConfirm(groupName.trim(), validFields);

    // 초기화
    setGroupName("");
    setCustomFields([
      { id: "1", label: "", example: "" },
    ]);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl mx-4 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">새 폴더 생성</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            {/* 폴더명 입력 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                폴더명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="폴더명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* 확장 필드 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium">
                  확장 필드 이름 (선택 입력)
                </label>
                <button
                  onClick={() => setShowHelp(true)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                확장 필드를 등록하면 메세지 내용에 변수를 치환하여 맞춤 메시지를 발송할 수 있습니다.
                공란으로 남겨두면 제외됩니다. (추후 수정 불가)
              </p>

              {/* 확장 필드 입력 */}
              {customFields.map((field, index) => (
                <div key={field.id} className="mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-gray-600">확장 필드{index + 1}</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => handleFieldChange(field.id, "label", e.target.value)}
                      placeholder="예) 이메일, 부서 등등"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => handleRemoveField(field.id)}
                      disabled={customFields.length <= 1}
                      className={`px-3 py-2 rounded text-sm ${
                        customFields.length <= 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
                      }`}
                    >
                      제거
                    </button>
                  </div>
                </div>
              ))}

              {/* 확장 필드 추가 버튼 */}
              <button
                onClick={handleAddField}
                className="w-full py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
              >
                확장 필드 추가
              </button>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex gap-3 p-4 border-t bg-gray-50">
            <button
              onClick={handleSubmit}
              className="flex-1 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              폴더 생성
            </button>
          </div>

          {/* 하단 링크 */}
          <div className="flex items-center justify-end gap-4 p-4 text-sm">
            <button
              onClick={() => setShowHelp(true)}
              className="text-gray-600 hover:text-gray-800"
            >
              확장 필드 도움말
            </button>
            <button
              onClick={() => router.push("/support?tab=contact")}
              className="text-gray-600 hover:text-gray-800"
            >
              문의
            </button>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              닫기 <span className="text-xs text-gray-400">ESC</span>
            </button>
          </div>
        </div>
      </div>

      {/* 확장 필드 도움말 모달 */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
            <h3 className="font-semibold mb-3">확장 필드 이름 (선택 입력)</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                확장 필드를 등록하면 연락처에 추가 메모를 기입하고 메시지 내용에 치환 문자 형태로 입력할 수 있습니다.
              </p>
              <p className="font-medium">예) 부서, 이메일, 생일 등등</p>
              <p>
                치환 문자 예) #&#123;이름&#125;님 입력하신 이메일 #&#123;이메일&#125;이 확인됐습니다.
              </p>
              <p>
                생성 후 폴더에 확장 필드를 더 이상 추가, 삭제가 불가능합니다.
              </p>
            </div>
            <button
              onClick={() => setShowHelp(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateGroupModal;
