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
  const [isCapturing, setIsCapturing] = useState(false);

  if (!isOpen) return null;

  const handleButtonClick = (button: DynamicButton) => {
    if (button.linkType === "web" && button.url) {
      let validUrl = button.url.trim();
      if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
        validUrl = "https://" + validUrl;
      }
      window.open(validUrl, "_blank");
    }
  };

  const handleSaveAsImage = async () => {
    if (!previewRef.current) return;

    try {
      setIsSaving(true);

      // 1) 버튼 임시 숨김
      const buttonElements = previewRef.current.querySelectorAll(
        '[data-exclude-from-capture="true"]'
      );
      const originalDisplayValues = Array.from(buttonElements).map(
        (el) => (el as HTMLElement).style.display
      );
      buttonElements.forEach((el) => {
        (el as HTMLElement).style.display = "none";
      });

      // 2) 임시 스타일
      const tempStyle = document.createElement("style");
      tempStyle.textContent = `
        .preview-capture * { color: rgb(55,65,81) !important; }
        .preview-capture .bg-white { background-color:#fff !important; }
        .preview-capture .bg-gray-200 { background-color: rgb(229,231,235) !important; }
        .preview-capture .text-gray-700 { color: rgb(55,65,81) !important; }
        .preview-capture .text-gray-500 { color: rgb(107,114,128) !important; }
        .preview-capture .text-gray-900 { color: rgb(17,24,39) !important; }
        .preview-capture .border-gray-600 { border-color: rgb(75,85,99) !important; }
      `;
      document.head.appendChild(tempStyle);

      // 3) 클래스로 캡처대상 표시
      const el = previewRef.current;
      el.classList.add("preview-capture");

      // 4) 레이아웃 적용 완료를 한 프레임 기다렸다가 캡처
      setIsCapturing(true);
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      // 이미지 로딩 보장
      const imgEl = el.querySelector('img[data-capture-img]') as HTMLImageElement | null;
      if (imgEl) {
        if (!imgEl.complete) await new Promise<void>(res => imgEl.addEventListener('load', () => res(), { once: true }));
        // decode로 렌더 안정화
        try { 
          if ('decode' in imgEl && typeof imgEl.decode === 'function') {
            await imgEl.decode();
          }
        } catch {}
      } 

      // 5) 먼저 실제 크기로 캡처
      const actualWidth = el.scrollWidth;
      const actualHeight = el.scrollHeight;

      const tempCanvas = await html2canvas(el, {
        background: '#ffffff',
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: actualWidth,
        height: actualHeight,
        scale: 1,
      });

      // 6) 640×960 캔버스에 비율 유지하며 중앙 정렬
      const targetWidth = 640;
      const targetHeight = 960;
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // 배경을 흰색으로 채우기
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // 이미지 비율 계산
        const imgRatio = actualWidth / actualHeight;
        const targetRatio = targetWidth / targetHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (imgRatio > targetRatio) {
          // 이미지가 더 넓음 -> 가로 기준 맞춤
          drawWidth = targetWidth;
          drawHeight = targetWidth / imgRatio;
          offsetX = 0;
          offsetY = (targetHeight - drawHeight) / 2;
        } else {
          // 이미지가 더 김 -> 세로 기준 맞춤
          drawHeight = targetHeight;
          drawWidth = targetHeight * imgRatio;
          offsetX = (targetWidth - drawWidth) / 2;
          offsetY = 0;
        }

        // 중앙 정렬하여 그리기
        ctx.drawImage(tempCanvas, offsetX, offsetY, drawWidth, drawHeight);
      }
  
      // 복원
      setIsCapturing(false);
      document.head.removeChild(tempStyle);
      el.classList.remove("preview-capture");
      buttonElements.forEach((el, i) => {
        (el as HTMLElement).style.display = originalDisplayValues[i];
      });

      // 파일 크기 최적화 (KB Pay 스펙: 5MB 이하)
      const optimizeImageSize = (
        canvas: HTMLCanvasElement,
        maxSizeBytes: number = 5 * 1024 * 1024
      ) => {
        let quality = 0.9;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (dataUrl.length > maxSizeBytes && quality > 0.2) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        if (dataUrl.length > maxSizeBytes) {
          dataUrl = canvas.toDataURL("image/png");
        }
        return dataUrl;
      };

      const optimizedImage = optimizeImageSize(canvas);

      // 다운로드
      const link = document.createElement("a");
      const ext = optimizedImage.startsWith("data:image/png") ? "png" : "jpg";
      link.download = `템플릿_미리보기_${Date.now()}.${ext}`;
      link.href = optimizedImage;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("이미지 저장 실패:", e);
      alert("이미지 저장에 실패했습니다.");
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
            {/* 캡처 대상: 640×960 비율 (2:3) */}
            <div
              ref={previewRef}
              className="bg-white rounded-2xl p-4"
              style={{ width: '320px', minHeight: '480px' }}
            >
              {currentGeneratedImage ? (
                <>
                 <div className="mb-4">
                    {isCapturing ? (
                      // 캡처 전용 <img>
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={currentGeneratedImage || ""}
                        alt="템플릿 미리보기"
                        width={280}
                        height={200}
                        className="w-full h-auto rounded-lg"
                        crossOrigin="anonymous"
                        data-capture-img
                        decoding="async"
                      />
                    ) : (
                      // 평소에는 Next/Image 사용
                      <Image
                        src={currentGeneratedImage || ""}
                        alt="템플릿 미리보기"
                        width={280}
                        height={200}
                        className="w-full h-auto rounded-lg"
                        crossOrigin="anonymous"
                        priority
                        unoptimized
                      />
                    )}
                  </div>
                  {templateTitle && (
                    <div className="font-bold text-gray-900 mb-2">
                      {templateTitle}
                    </div>
                  )}

                  {smsTextContent && (
                    <div className="text-gray-700 text-sm mb-4 whitespace-pre-wrap">
                      {smsTextContent}
                    </div>
                  )}

                  {dynamicButtons.length > 0 && (
                    <div
                      className={
                        dynamicButtons.length === 2 ? "flex gap-2" : "space-y-2"
                      }
                      data-exclude-from-capture="true"
                    >
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
                </>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>미리볼 이미지가 없습니다.</p>
                  <p>먼저 이미지를 생성해주세요.</p>
                </div>
              )}
            </div>
          </div>
        </div>

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
              <>이미지로 저장</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModal;
