import React from "react";
import { DynamicButton } from "@/types/targetMarketing";
import { TEMPLATE_CATEGORIES, TEXT_LIMITS } from "@/constants/targetMarketing";

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
  
  // 폼 데이터
  templateSaveName: string;
  setTemplateSaveName: (name: string) => void;
  templateSaveCategory: string;
  setTemplateSaveCategory: (category: string) => void;
  templateIsPrivate: boolean;
  setTemplateIsPrivate: (isPrivate: boolean) => void;
  
  // 저장될 내용들
  smsTextContent: string;
  currentGeneratedImage: string | null;
  dynamicButtons: DynamicButton[];
}

const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
  templateSaveName,
  setTemplateSaveName,
  templateSaveCategory,
  setTemplateSaveCategory,
  templateIsPrivate,
  setTemplateIsPrivate,
  smsTextContent,
  currentGeneratedImage,
  dynamicButtons,
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setTemplateSaveName("");
    setTemplateSaveCategory("");
    setTemplateIsPrivate(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">템플릿 저장</h2>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {/* 템플릿 이름 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 이름 *</label>
              <input
                type="text"
                value={templateSaveName}
                onChange={(e) => setTemplateSaveName(e.target.value)}
                placeholder="템플릿 이름을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                maxLength={TEXT_LIMITS.TEMPLATE_NAME_MAX}
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {templateSaveName.length} / {TEXT_LIMITS.TEMPLATE_NAME_MAX}
              </div>
            </div>

            {/* 카테고리 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">카테고리 *</label>
              <select
                value={templateSaveCategory}
                onChange={(e) => setTemplateSaveCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">카테고리를 선택하세요</option>
                {TEMPLATE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* 공개/비공개 설정 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">공개 설정</label>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={!templateIsPrivate}
                    onChange={() => setTemplateIsPrivate(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">공개</span> (다른 사용자도 볼 수 있음)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="privacy"
                    checked={templateIsPrivate}
                    onChange={() => setTemplateIsPrivate(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">비공개</span> (나만 볼 수 있음)
                </label>
              </div>
            </div>

            {/* 미리보기 정보 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">저장될 내용</label>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">내용:</span>
                  <span className="text-sm text-gray-600 flex-1">
                    {smsTextContent.length > 50 
                      ? smsTextContent.substring(0, 50) + "..." 
                      : smsTextContent}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">이미지:</span>
                  <span className="text-sm text-gray-600 flex-1">
                    {currentGeneratedImage ? "포함됨" : "없음"}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-sm font-medium text-gray-700 min-w-[60px]">버튼:</span>
                  <span className="text-sm text-gray-600 flex-1">
                    {dynamicButtons.length > 0 
                      ? `${dynamicButtons.length}개 버튼 포함` 
                      : "없음"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            className="px-6 py-2 text-gray-700 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            onClick={handleClose}
          >
            취소
          </button>
          <button
            className="px-6 py-2 bg-blue-600 text-white border-none rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={onSave}
            disabled={!templateSaveName.trim() || !templateSaveCategory || isSaving}
          >
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveTemplateModal;
