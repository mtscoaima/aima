"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  Save,
  Info,
  HelpCircle,
  Upload,
  X
} from "lucide-react";
import SimpleContentSaveModal from "../modals/SimpleContentSaveModal";
import LoadContentModal from "../modals/LoadContentModal";
import ScheduledMessagesModal from "../modals/ScheduledMessagesModal";
import VariableSelectModal from "../modals/VariableSelectModal";

interface MessageData {
  subject: string;
  content: string;
  isAd: boolean;
  imageFileIds?: string[];
}

interface SmsMessageContentProps {
  messageData?: MessageData;
  onMessageDataChange?: (data: MessageData) => void;
  onUploadingChange?: (isUploading: boolean) => void;
}

interface UploadedImage {
  fileId: string;
  fileName: string;
  fileSize: number;
  preview: string;
}

const SmsMessageContent = ({ messageData, onMessageDataChange, onUploadingChange }: SmsMessageContentProps) => {
  const [subject, setSubject] = useState("");
  const [subjectLength, setSubjectLength] = useState(0);
  const [messageLength, setMessageLength] = useState(0);
  const [messageContent, setMessageContent] = useState("");
  const [isAd, setIsAd] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isScheduledModalOpen, setIsScheduledModalOpen] = useState(false);
  const [loadModalActiveTab, setLoadModalActiveTab] = useState("saved");
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messageData) {
      setSubject(messageData.subject);
      setSubjectLength(messageData.subject.length);
      setMessageContent(messageData.content);
      setMessageLength(messageData.content.length);
      setIsAd(messageData.isAd);
    }
  }, [messageData]);

  const notifyParent = (newSubject: string, newContent: string, newIsAd: boolean, imageFileIds?: string[]) => {
    if (onMessageDataChange) {
      onMessageDataChange({
        subject: newSubject,
        content: newContent,
        isAd: newIsAd,
        imageFileIds: imageFileIds
      });
    }
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (클라이언트측 300KB)
    const maxSize = 300 * 1024; // 300KB
    if (file.size > maxSize) {
      alert(`이미지 크기는 300KB 이하여야 합니다.\n현재 크기: ${(file.size / 1024).toFixed(1)}KB`);
      event.target.value = "";
      return;
    }

    // 파일 형식 검증
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      alert("JPG, JPEG, PNG 형식만 지원됩니다.");
      event.target.value = "";
      return;
    }

    // 최대 3개 제한
    if (uploadedImages.length >= 3) {
      alert("이미지는 최대 3개까지 첨부할 수 있습니다.");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    if (onUploadingChange) {
      onUploadingChange(true);
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      // FormData 생성
      const formData = new FormData();
      formData.append("file", file);

      // API 호출
      const response = await fetch("/api/messages/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "이미지 업로드 실패");
      }

      const data = await response.json();

      if (!data.success || !data.imageUrl) {
        throw new Error('이미지 URL을 받지 못했습니다');
      }

      // 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file);

      // 업로드된 이미지 목록에 추가
      const newImages = [
        ...uploadedImages,
        {
          fileId: data.imageUrl, // MTS API에서 받은 이미지 URL
          fileName: file.name,
          fileSize: data.fileSize,
          preview: previewUrl,
        },
      ];
      setUploadedImages(newImages);

      // 부모 컴포넌트로 전달
      const imageFileIds = newImages.map(img => img.fileId);
      notifyParent(subject, messageContent, isAd, imageFileIds);

      alert("이미지가 업로드되었습니다.");
      event.target.value = ""; // input 초기화

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
      alert(`업로드 실패: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      if (onUploadingChange) {
        onUploadingChange(false);
      }
    }
  };

  // 이미지 삭제 핸들러
  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);

    // 부모 컴포넌트로 전달
    const imageFileIds = newImages.map(img => img.fileId);
    notifyParent(subject, messageContent, isAd, imageFileIds);
  };

  const placeholderText = `이곳에 문자 내용을 입력합니다.
치환문구 예시) #[이름]님 #[시간]시 방문 예약입니다.`;

  const handleVariableSelect = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = messageContent.slice(0, start) + variable + messageContent.slice(end);

    setMessageContent(newText);
    setMessageLength(newText.length);
    const imageFileIds = uploadedImages.map(img => img.fileId);
    notifyParent(subject, newText, isAd, imageFileIds);

    // 커서를 삽입된 변수 뒤로 이동
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  const handleSavedContentClick = () => {
    setLoadModalActiveTab("saved");
    setIsLoadModalOpen(true);
  };

  const handleRecentSentClick = () => {
    setLoadModalActiveTab("recent");
    setIsLoadModalOpen(true);
  };

  const getVariableCount = () => {
    const matches = messageContent.match(/#\[.*?\]/g);
    return matches ? matches.length : 0;
  };

  const variableCount = getVariableCount();

  return (
    <>
      {/* 제목 입력 (선택사항) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">제목 (선택 사항)</label>
          <span className="text-xs text-gray-500">{subjectLength}/40</span>
        </div>
        <input
          type="text"
          placeholder=""
          value={subject}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          maxLength={40}
          onChange={(e) => {
            setSubject(e.target.value);
            setSubjectLength(e.target.value.length);
            const imageFileIds = uploadedImages.map(img => img.fileId);
            notifyParent(e.target.value, messageContent, isAd, imageFileIds);
          }}
        />
      </div>

      {/* 메시지 내용 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex-1">
        <div className="flex flex-col h-full">
          <textarea
            ref={textareaRef}
            placeholder={placeholderText}
            value={messageContent}
            className="flex-1 w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[200px]"
            maxLength={2000}
            onChange={(e) => {
              setMessageContent(e.target.value);
              setMessageLength(e.target.value.length);
              const imageFileIds = uploadedImages.map(img => img.fileId);
              notifyParent(subject, e.target.value, isAd, imageFileIds);
            }}
          />

          {/* 하단 도구바 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-3">
              {/* 아이콘 버튼들 */}
              <button
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setIsVariableModalOpen(true)}
                title="치환문구 추가"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowImageUpload(!showImageUpload)}
                title="이미지 첨부"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setIsSaveModalOpen(true)}
                title="문구 저장하기"
              >
                <Save className="w-4 h-4" />
              </button>

              {/* 텍스트 버튼들 */}
              <button
                className="text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
                onClick={handleSavedContentClick}
              >
                저장내용
              </button>
              <button
                className="text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
                onClick={handleRecentSentClick}
              >
                최근발송
              </button>
              <button
                className="text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
                onClick={() => setIsScheduledModalOpen(true)}
              >
                예약내역
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{messageLength}/2,000 Bytes</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 첨부 영역 */}
      {showImageUpload && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              이미지 첨부 (MMS)
            </label>
            <span className="text-xs text-gray-500">
              최대 300KB, 3개까지
            </span>
          </div>

          {/* 파일 선택 버튼 */}
          <div className="mb-3">
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              onChange={handleImageUpload}
              disabled={isUploading || uploadedImages.length >= 3}
              className="hidden"
              id="image-upload-input"
            />
            <label
              htmlFor="image-upload-input"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded cursor-pointer ${
                isUploading || uploadedImages.length >= 3
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              }`}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  이미지 선택
                </>
              )}
            </label>
            <span className="ml-3 text-xs text-gray-500">
              {uploadedImages.length}/3
            </span>
          </div>

          {/* 업로드된 이미지 미리보기 */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {uploadedImages.map((img, index) => (
                <div
                  key={index}
                  className="relative border rounded overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.preview}
                    alt={img.fileName}
                    className="w-full h-24 object-cover"
                  />
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="p-1 bg-gray-50 text-xs truncate">
                    {img.fileName}
                  </div>
                  <div className="px-1 pb-1 text-xs text-gray-500">
                    {(img.fileSize / 1024).toFixed(1)}KB
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 가이드 */}
          <div className="mt-3 text-xs text-gray-500 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">▸</span>
              <span>JPG, PNG 형식만 지원</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">▸</span>
              <span>각 파일당 최대 300KB</span>
            </div>
          </div>
        </div>
      )}

      {/* 문구 저장 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">문구 치환</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">
            {variableCount === 0
              ? "내용에 변수가 없습니다."
              : `${variableCount}개의 변수가 존재합니다. 수신번호를 추가해주세요`
            }
          </span>
        </div>
      </div>

      {/* 광고메시지 여부 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="adMessage"
            className="rounded"
            checked={isAd}
            onChange={(e) => {
              setIsAd(e.target.checked);
              const imageFileIds = uploadedImages.map(img => img.fileId);
              notifyParent(subject, messageContent, e.target.checked, imageFileIds);
            }}
          />
          <label htmlFor="adMessage" className="text-sm text-gray-700">광고메시지 여부</label>
          <HelpCircle className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* 모달들 */}
      <SimpleContentSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentContent={{
          subject: subject,
          content: messageContent,
          isAd: isAd,
        }}
        onSaveSuccess={() => {
          // 템플릿 저장 성공 시 필요한 작업
        }}
      />
      <LoadContentModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        initialActiveTab={loadModalActiveTab}
        onSelect={(content) => {
          setSubject(content.subject || "");
          setSubjectLength((content.subject || "").length);
          setMessageContent(content.content);
          setMessageLength(content.content.length);
          setIsAd(content.isAd || false);
          const imageFileIds = uploadedImages.map(img => img.fileId);
          notifyParent(content.subject || "", content.content, content.isAd || false, imageFileIds);
        }}
      />
      <VariableSelectModal
        isOpen={isVariableModalOpen}
        onClose={() => setIsVariableModalOpen(false)}
        onSelect={handleVariableSelect}
      />
      <ScheduledMessagesModal
        isOpen={isScheduledModalOpen}
        onClose={() => setIsScheduledModalOpen(false)}
      />
    </>
  );
};

export default SmsMessageContent;
