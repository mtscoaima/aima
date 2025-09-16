"use client";

import React, { useState, useRef } from "react";
import {
  Info,
  HelpCircle,
  Image as ImageIcon,
  FileText,
  Save,
  Upload,
  Plus
} from "lucide-react";
import SimpleContentSaveModal from "../modals/SimpleContentSaveModal";
import LoadContentModal from "../modals/LoadContentModal";

const RcsMessageContent = () => {
  const [subjectLength, setSubjectLength] = useState(0);
  const [messageLength, setMessageLength] = useState(0);
  const [messageContent, setMessageContent] = useState("");
  const [selectedSlideType, setSelectedSlideType] = useState("none");
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [loadModalActiveTab, setLoadModalActiveTab] = useState("saved");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const placeholderText = `이곳에 RCS 문자 내용을 입력합니다.
치환문구 예시) {{이름}}님 {{시간}}시 방문 예약입니다.`;

  // 치환문구 추가 함수
  const addReplaceText = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = messageContent.slice(0, start) + "{{변수 A}}" + messageContent.slice(end);
      setMessageContent(newText);
      setMessageLength(newText.length);

      // 커서 위치를 치환문구 뒤로 이동
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + 8, start + 8);
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

  // 치환문구 개수 계산 (RCS는 {{}} 형태)
  const getVariableCount = () => {
    const matches = messageContent.match(/\{\{.*?\}\}/g);
    return matches ? matches.length : 0;
  };

  const variableCount = getVariableCount();

  return (
    <>
      {/* 상단 섹션: RCS 브랜드와 RCS 템플릿 */}
      <div className="flex gap-6 mb-4">
        {/* 좌측: RCS 브랜드 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3">RCS 브랜드</h3>
            <div className="flex items-center justify-between">
              <div className="text-gray-500 text-sm">
                RCS 브랜드를 선택하세요
              </div>
              <button className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: "#2c398a" }}>
                연동하기 ＞
              </button>
            </div>
          </div>
        </div>

        {/* 우측: RCS 템플릿 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-3">RCS 템플릿</h3>
            <div className="flex items-center justify-between">
              <div className="text-gray-500 text-sm">
                RCS 템플릿 없음 (내용 직접 입력)
              </div>
              <button className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: "#2c398a" }}>
                등록 ＞
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 제목 입력 (선택사항) */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">제목</label>
          <span className="text-xs text-gray-500">{subjectLength}/30자</span>
        </div>
        <input
          type="text"
          placeholder=""
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          maxLength={30}
          onChange={(e) => setSubjectLength(e.target.value.length)}
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
            maxLength={1300}
            onChange={(e) => {
              setMessageContent(e.target.value);
              setMessageLength(e.target.value.length);
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
              <span className="text-xs text-gray-500">{messageLength} / 1,300 자</span>
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

          {/* RCS 권장 이미지 규격 */}
          <div className="mt-4 p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-start gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>이미지 권장 너비 568px</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                <span>이미지 권장 높이 336px</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RCS 메시지 버튼과 RCS 슬라이드 */}
      <div className="flex gap-6 mb-4">
        {/* 좌측: RCS 메시지 버튼 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-gray-700">💬 RCS 메시지 버튼</span>
            </div>
            <div className="text-center py-2 border border-dashed border-gray-300 rounded">
              <button className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 mx-auto">
                <Plus className="w-4 h-4" />
                버튼 추가 (0/2)
              </button>
            </div>
          </div>
        </div>

        {/* 우측: RCS 슬라이드 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-gray-700">📱 RCS 슬라이드</span>
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex gap-2 mb-3">
              <button
                className={`px-3 py-1 text-xs border rounded ${
                  selectedSlideType === "none"
                    ? "border-[#2c398a]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedSlideType === "none" ? { backgroundColor: "#2c398a20", color: "#2c398a" } : {}}
                onClick={() => setSelectedSlideType("none")}
              >
                사용안함
              </button>
              <button
                className={`px-3 py-1 text-xs border rounded ${
                  selectedSlideType === "narrow"
                    ? "border-[#2c398a]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedSlideType === "narrow" ? { backgroundColor: "#2c398a20", color: "#2c398a" } : {}}
                onClick={() => setSelectedSlideType("narrow")}
              >
                🏷️ 좁게
              </button>
              <button
                className={`px-3 py-1 text-xs border rounded ${
                  selectedSlideType === "wide"
                    ? "border-[#2c398a]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
                style={selectedSlideType === "wide" ? { backgroundColor: "#2c398a20", color: "#2c398a" } : {}}
                onClick={() => setSelectedSlideType("wide")}
              >
                📄 넓게
              </button>
            </div>

            {/* 슬라이드 추가 버튼 - 좁게/넓게 선택 시에만 표시 */}
            {(selectedSlideType === "narrow" || selectedSlideType === "wide") && (
              <div className="text-center py-2 border border-dashed border-gray-300 rounded">
                <button className="flex items-center gap-2 text-gray-500 text-sm hover:text-gray-700 mx-auto">
                  <FileText className="w-4 h-4" />
                  슬라이드 추가 (0/5)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 문구 치환 */}
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

      {/* 발송 옵션 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="adMessage" className="rounded" />
            <label htmlFor="adMessage" className="text-sm text-gray-700">광고메시지 여부</label>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="smsBackupRcs" className="rounded" defaultChecked />
            <label htmlFor="smsBackupRcs" className="text-sm text-gray-700">
              발송실패 시 문자대체발송 여부
            </label>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="messageShare" className="rounded" defaultChecked />
            <label htmlFor="messageShare" className="text-sm text-gray-700">메시지 공유가능여부</label>
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <SimpleContentSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentContent={messageContent}
      />
      <LoadContentModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        initialActiveTab={loadModalActiveTab}
      />
    </>
  );
};

export default RcsMessageContent;