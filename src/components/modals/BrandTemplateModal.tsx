"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Trash2 } from "lucide-react";

interface UploadedImage {
  fileId: string;
  url: string;
  name: string;
}

interface BrandButton {
  name: string;           // 버튼명 (최대 14자)
  type: 'WL';            // 웹링크 (WL만 지원)
  url_mobile: string;    // 모바일 URL (필수)
  url_pc?: string;       // PC URL (선택)
}

interface BrandTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  senderKey: string;
}

const BrandTemplateModal: React.FC<BrandTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  senderKey,
}) => {
  const [name, setName] = useState("");
  const [chatBubbleType, setChatBubbleType] = useState<"TEXT" | "IMAGE" | "WIDE" | "WIDE_ITEM_LIST" | "CAROUSEL_FEED">("TEXT");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [buttons, setButtons] = useState<BrandButton[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 메시지 타입별 최대 버튼 개수
  const maxButtons: Record<typeof chatBubbleType, number> = {
    TEXT: 5,
    IMAGE: 5,
    WIDE: 2,
    WIDE_ITEM_LIST: 2,
    CAROUSEL_FEED: 0, // 캐러셀은 버튼 미지원
  };

  if (!isOpen) return null;

  // 이미지 파일 업로드 핸들러 (카카오 서버에 업로드)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("JPG, JPEG, PNG 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검증 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("이미지 크기는 5MB 이하여야 합니다.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      // FormData 생성
      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", senderKey);

      // 카카오 이미지 서버에 업로드
      const response = await fetch("/api/messages/kakao/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "이미지 업로드 실패");
      }

      // 업로드된 이미지 정보 저장
      setUploadedImage({
        fileId: result.fileId,
        url: result.url,
        name: file.name,
      });

      // imageUrl도 함께 업데이트
      setImageUrl(result.url);

    } catch (err) {
      console.error("이미지 업로드 오류:", err);
      setError(err instanceof Error ? err.message : "이미지 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  // 업로드된 이미지 삭제
  const handleDeleteImage = () => {
    setUploadedImage(null);
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 버튼 추가
  const handleAddButton = () => {
    const max = maxButtons[chatBubbleType];
    if (max === 0) {
      setError("이 메시지 타입은 버튼을 지원하지 않습니다.");
      return;
    }
    if (buttons.length >= max) {
      setError(`${chatBubbleType} 타입은 최대 ${max}개의 버튼까지 추가할 수 있습니다.`);
      return;
    }
    setButtons([...buttons, { name: "", type: "WL", url_mobile: "", url_pc: "" }]);
    setError("");
  };

  // 버튼 삭제
  const handleDeleteButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  // 버튼 정보 수정
  const handleButtonChange = (index: number, field: keyof BrandButton, value: string) => {
    // 버튼명 길이 제한
    if (field === "name" && value.length > 14) {
      setError("버튼명은 최대 14자까지 입력 가능합니다.");
      return;
    }

    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      // 버튼 검증
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];

        // 필수 필드 검증
        if (!button.name.trim()) {
          setError(`버튼 ${i + 1}: 버튼명을 입력해주세요.`);
          setIsSubmitting(false);
          return;
        }

        if (!button.url_mobile.trim()) {
          setError(`버튼 ${i + 1}: 모바일 URL을 입력해주세요.`);
          setIsSubmitting(false);
          return;
        }

        // URL 형식 검증
        try {
          new URL(button.url_mobile);
          if (button.url_pc && button.url_pc.trim()) {
            new URL(button.url_pc);
          }
        } catch {
          setError(`버튼 ${i + 1}: 올바른 URL 형식이 아닙니다.`);
          setIsSubmitting(false);
          return;
        }
      }

      const response = await fetch("/api/messages/kakao/brand/templates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderKey,
          name,
          chatBubbleType,
          content,
          imageUrl: imageUrl || undefined,
          imageLink: imageLink || undefined,
          buttons: buttons.length > 0 ? buttons : undefined,
          adult: false,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "템플릿 생성 실패");
      }

      alert("브랜드 템플릿이 성공적으로 등록되었습니다!");

      // 폼 초기화
      setName("");
      setContent("");
      setImageUrl("");
      setImageLink("");
      setUploadedImage(null);
      setButtons([]);
      setChatBubbleType("TEXT");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      onSuccess();
    } catch (err) {
      console.error("템플릿 생성 오류:", err);
      setError(err instanceof Error ? err.message : "템플릿 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            브랜드 메시지 템플릿 등록
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 템플릿 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 신상품 출시 안내"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 메시지 타입 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메시지 타입 <span className="text-red-500">*</span>
            </label>
            <select
              value={chatBubbleType}
              onChange={(e) => setChatBubbleType(e.target.value as typeof chatBubbleType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="TEXT">텍스트형 (TEXT)</option>
              <option value="IMAGE">이미지형 (IMAGE)</option>
              <option value="WIDE">와이드형 (WIDE)</option>
              <option value="WIDE_ITEM_LIST">와이드리스트형 (WIDE_ITEM_LIST)</option>
              <option value="CAROUSEL_FEED">캐러셀피드형 (CAROUSEL_FEED)</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              커머스형, 캐러셀커머스형은 별도 API 필요
            </p>
          </div>

          {/* 메시지 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메시지 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`예: #{고객명}님, 안녕하세요!\n#{날짜}에 새로운 혜택을 준비했습니다.\n\n지원 변수: #{이름}, #{고객명}, #{성함}, #{날짜}, #{오늘날짜}, #{시간}, #{현재시간}, #{회사명}, #{담당자명} 등`}
              required
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              변수 형식: #{"{변수명}"} (예: #{"{고객명}"}님 안녕하세요)
            </p>
          </div>

          {/* 이미지 업로드 (IMAGE, WIDE 타입일 때만) */}
          {(chatBubbleType === "IMAGE" || chatBubbleType === "WIDE") && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 첨부 {chatBubbleType === "IMAGE" && <span className="text-red-500">*</span>}
                </label>

                {/* 파일 업로드 버튼 */}
                {!uploadedImage && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-8 h-8 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {isUploading ? "업로드 중..." : "이미지 선택 (JPG, JPEG, PNG)"}
                        </span>
                        <span className="text-xs text-gray-500">
                          권장: 800x400px (2:1 비율), 최대 5MB
                        </span>
                      </div>
                    </button>
                  </>
                )}

                {/* 이미지 미리보기 */}
                {uploadedImage && (
                  <div className="border border-gray-300 rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={uploadedImage.url}
                        alt="업로드된 이미지"
                        className="w-32 h-16 object-cover rounded border border-gray-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {uploadedImage.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 break-all">
                          {uploadedImage.url}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDeleteImage}
                        className="flex-shrink-0 p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="이미지 삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 클릭 시 이동 URL (선택)
                </label>
                <input
                  type="url"
                  value={imageLink}
                  onChange={(e) => setImageLink(e.target.value)}
                  placeholder="https://example.com/promotion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  이미지를 클릭했을 때 이동할 웹페이지 URL을 입력하세요
                </p>
              </div>
            </>
          )}

          {/* 버튼 추가 (선택) */}
          {maxButtons[chatBubbleType] > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                버튼 추가 (선택, 최대 {maxButtons[chatBubbleType]}개)
              </label>

              {/* 버튼 목록 */}
              {buttons.map((button, index) => (
                <div key={index} className="border border-gray-300 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">버튼 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteButton(index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      삭제
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* 버튼명 */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        버튼명 <span className="text-red-500">*</span> (최대 14자)
                      </label>
                      <input
                        type="text"
                        value={button.name}
                        onChange={(e) => handleButtonChange(index, "name", e.target.value)}
                        placeholder="예: 자세히 보기"
                        maxLength={14}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* 모바일 URL */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        모바일 URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={button.url_mobile}
                        onChange={(e) => handleButtonChange(index, "url_mobile", e.target.value)}
                        placeholder="https://m.example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* PC URL */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        PC URL (선택)
                      </label>
                      <input
                        type="url"
                        value={button.url_pc || ""}
                        onChange={(e) => handleButtonChange(index, "url_pc", e.target.value)}
                        placeholder="https://www.example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* 버튼 추가 버튼 */}
              {buttons.length < maxButtons[chatBubbleType] && (
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-sm"
                >
                  + 버튼 추가
                </button>
              )}
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              ℹ️ 템플릿 등록 안내
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 템플릿 등록 후 MTS 관리자 승인이 필요합니다.</li>
              <li>• 승인 후 메시지 발송이 가능합니다.</li>
              <li>• 변수는 발송 시 자동으로 치환됩니다.</li>
              <li>• 브랜드 메시지 단가: 20원/건</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: "#795548" }}
            >
              {isSubmitting ? "등록 중..." : "템플릿 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BrandTemplateModal;
