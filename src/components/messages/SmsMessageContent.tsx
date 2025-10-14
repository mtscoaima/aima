"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Image as ImageIcon,
  Save,
  Info,
  HelpCircle,
  Upload
} from "lucide-react";
import SimpleContentSaveModal from "../modals/SimpleContentSaveModal";
import LoadContentModal from "../modals/LoadContentModal";

interface MessageData {
  subject: string;
  content: string;
  isAd: boolean;
}

interface SmsMessageContentProps {
  messageData?: MessageData;
  onMessageDataChange?: (data: MessageData) => void;
}

const SmsMessageContent = ({ messageData, onMessageDataChange }: SmsMessageContentProps) => {
  const [subject, setSubject] = useState("");
  const [subjectLength, setSubjectLength] = useState(0);
  const [messageLength, setMessageLength] = useState(0);
  const [messageContent, setMessageContent] = useState("");
  const [isAd, setIsAd] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [loadModalActiveTab, setLoadModalActiveTab] = useState("saved");
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

  const notifyParent = (newSubject: string, newContent: string, newIsAd: boolean) => {
    if (onMessageDataChange) {
      onMessageDataChange({
        subject: newSubject,
        content: newContent,
        isAd: newIsAd
      });
    }
  };

  const placeholderText = `이곳에 문자 내용을 입력합니다.
치환문구 예시) #[이름]님 #[시간]시 방문 예약입니다.`;

  const addReplaceText = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = messageContent.slice(0, start) + "#[변수 A]" + messageContent.slice(end);
      setMessageContent(newText);
      setMessageLength(newText.length);
      notifyParent(subject, newText, isAd);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 7, start + 7);
      }, 0);
    }
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
            notifyParent(e.target.value, messageContent, isAd);
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
              notifyParent(subject, e.target.value, isAd);
            }}
          />

          {/* 하단 도구바 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-3">
              {/* 아이콘 버튼들 */}
              <button
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={addReplaceText}
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
          <div className="mb-3">
            <h4 className="font-medium text-gray-700 mb-2">이미지 첨부 가이드</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">▸</span>
                <span>가로 너비 500px 이상</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">▸</span>
                <span>세로 높이 250px 이상</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">▸</span>
                <span>가로:세로 비율이 1:1.5 ~ 2:1 범위 내</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">▸</span>
                <span>JPG, PNG 확장자</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">▸</span>
                <span>이미지 파일 용량 최대 500KB 이하</span>
              </div>
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-medium text-gray-700 mb-1">메시지에 이미지 첨부</h4>
            <p className="text-sm text-gray-500">
              이곳에 파일 끌어오기 혹은 찾아보기
            </p>
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
              notifyParent(subject, messageContent, e.target.checked);
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
          notifyParent(content.subject || "", content.content, content.isAd || false);
        }}
      />
    </>
  );
};

export default SmsMessageContent;
