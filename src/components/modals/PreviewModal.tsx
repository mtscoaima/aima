import React from "react";
import Image from "next/image";
import { DynamicButton } from "@/types/targetMarketing";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGeneratedImage: string | null;
  templateTitle: string;
  smsTextContent: string;
  dynamicButtons: DynamicButton[];
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  currentGeneratedImage,
  templateTitle,
  smsTextContent,
  dynamicButtons,
}) => {
  if (!isOpen) return null;

  const handleButtonClick = (button: DynamicButton) => {
    if (button.linkType === 'web' && button.url) {
      let validUrl = button.url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      window.open(validUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">미리보기</h2>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[70vh] flex items-center justify-center">
          <div className="bg-gray-200 rounded-3xl p-3 shadow-2xl">
            <div className="bg-white rounded-2xl p-4 max-w-xs">
              {currentGeneratedImage && (
                <div className="relative mb-4">
                  <Image
                    src={currentGeneratedImage || ""}
                    alt="템플릿 미리보기"
                    width={280}
                    height={200}
                    className="w-full h-auto rounded-lg"
                  />
                  
                  {/* 템플릿 제목 */}
                  {templateTitle && (
                    <div className="font-bold text-gray-900 mb-2">
                      {templateTitle}
                    </div>
                  )}
                  
                  {/* 템플릿 내용 */}
                  {smsTextContent && (
                    <div className="text-gray-700 text-sm mb-4">
                      {smsTextContent}
                    </div>
                  )}
                  
                  {/* 동적 버튼들 - 버튼이 있는 경우에만 표시 */}
                  {dynamicButtons.length > 0 && (
                    <div className={dynamicButtons.length === 2 ? "flex gap-2" : "space-y-2"}>
                      {dynamicButtons.map((button, index) => (
                        <button
                          key={index}
                          className={`py-2 px-4 bg-gray-100 text-blue-600 border border-gray-600 text-sm hover:bg-gray-200 transition-colors ${
                            dynamicButtons.length === 2 ? "flex-1" : "w-full"
                          }`}
                          onClick={() => handleButtonClick(button)}
                        >
                          {button.text || `버튼${index + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {!currentGeneratedImage && (
                <div className="text-center text-gray-500 py-8">
                  <p>미리볼 이미지가 없습니다.</p>
                  <p>먼저 이미지를 생성해주세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
