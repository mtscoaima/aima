import React, { useRef, useState } from "react";
import Image from "next/image";
import { DynamicButton } from "@/types/targetMarketing";
import html2canvas from "html2canvas";

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
  const previewRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const handleSaveAsImage = async () => {
    if (!previewRef.current) return;

    try {
      setIsSaving(true);
      
      // 동적 버튼들을 임시로 숨김
      const buttonElements = previewRef.current.querySelectorAll('[data-exclude-from-capture="true"]');
      const originalDisplayValues = Array.from(buttonElements).map(el => (el as HTMLElement).style.display);
      buttonElements.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // 미리보기 영역에 임시 스타일 추가
      const tempStyle = document.createElement('style');
      tempStyle.textContent = `
        .preview-capture * {
          color: rgb(55, 65, 81) !important;
        }
        .preview-capture .bg-white {
          background-color: rgb(255, 255, 255) !important;
        }
        .preview-capture .bg-gray-200 {
          background-color: rgb(229, 231, 235) !important;
        }
        .preview-capture .text-gray-700 {
          color: rgb(55, 65, 81) !important;
        }
        .preview-capture .text-gray-500 {
          color: rgb(107, 114, 128) !important;
        }
        .preview-capture .text-gray-900 {
          color: rgb(17, 24, 39) !important;
        }
        .preview-capture .border-gray-600 {
          border-color: rgb(75, 85, 99) !important;
        }
      `;
      document.head.appendChild(tempStyle);
      
      // 캡처할 영역에 클래스 추가
      previewRef.current.classList.add('preview-capture');

      // html2canvas로 해당 영역을 캡처 (자동 크기 감지)
      const canvas = await html2canvas(previewRef.current, {
        background: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // 임시 스타일과 클래스 제거
      document.head.removeChild(tempStyle);
      previewRef.current.classList.remove('preview-capture');

      // 버튼들을 다시 보이게 함
      buttonElements.forEach((el, index) => {
        (el as HTMLElement).style.display = originalDisplayValues[index];
      });

      // 파일 크기 최적화 함수
      const optimizeImageSize = (canvas: HTMLCanvasElement, maxSizeBytes: number = 3 * 1024 * 1024) => {
        let quality = 0.9;
        let imageData = canvas.toDataURL('image/jpeg', quality);
        
        // 3MB 이하가 될 때까지 품질 조정
        while (imageData.length > maxSizeBytes && quality > 0.1) {
          quality -= 0.1;
          imageData = canvas.toDataURL('image/jpeg', quality);
        }
        
        // 여전히 크다면 PNG로 시도
        if (imageData.length > maxSizeBytes) {
          imageData = canvas.toDataURL('image/png');
        }
        
        return imageData;
      };

      // 이미지 최적화
      const optimizedImage = optimizeImageSize(canvas);
      
      // 다운로드 링크 생성
      const link = document.createElement('a');
      const fileExtension = optimizedImage.startsWith('data:image/png') ? 'png' : 'jpg';
      link.download = `템플릿_미리보기_${new Date().getTime()}.${fileExtension}`;
      link.href = optimizedImage;
      
      // 다운로드 실행
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`이미지 크기: ${(optimizedImage.length / 1024 / 1024).toFixed(2)}MB`);
      
    } catch (error) {
      console.error('이미지 저장 실패:', error);
      alert('이미지 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
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
            <div ref={previewRef} className="bg-white rounded-2xl p-4 max-w-xs">
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
                    <div className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">
                      {smsTextContent}
                    </div>
                  )}
                  
                  {/* 동적 버튼들 - 버튼이 있는 경우에만 표시 */}
                  {dynamicButtons.length > 0 && (
                    <div className={dynamicButtons.length === 2 ? "flex gap-2" : "space-y-2"} data-exclude-from-capture="true">
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
        
        {/* 이미지로 저장 버튼 */}
        <div className="flex justify-center p-4 border-t border-gray-200">
          <button
            onClick={handleSaveAsImage}
            disabled={isSaving}
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-gray-100 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                저장 중...
              </>
            ) : (
              <>
                이미지로 저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
