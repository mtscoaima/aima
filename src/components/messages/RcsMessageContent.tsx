"use client";

import React, { useState } from "react";
import {
  Info,
  HelpCircle,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Clock,
  Plus
} from "lucide-react";

const RcsMessageContent = () => {
  const [subjectLength, setSubjectLength] = useState(0);
  const [messageLength, setMessageLength] = useState(0);
  const [selectedSlideType, setSelectedSlideType] = useState("none");

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
            placeholder="이곳에 RCS 문자 내용을 입력합니다.&#10;치환문구 예시) #{이름}님 #{지점명} 방문 예약입니다."
            className="flex-1 w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[200px]"
            maxLength={1300}
            onChange={(e) => setMessageLength(e.target.value.length)}
          />

          {/* 하단 도구바 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-3">
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Paperclip className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <ImageIcon className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <FileText className="w-4 h-4" />
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700">
                <Clock className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500">저장내용</span>
              <span className="text-xs text-gray-500">최근발송</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{messageLength} / 1,300 자</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* RCS 메시지 버튼과 RCS 슬라이드 */}
      <div className="flex gap-6 mb-4">
        {/* 좌측: RCS 메시지 버튼 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-medium text-gray-700">💬 RCS 메시지 버튼</span>
            </div>
            <div className="text-center py-8 border border-dashed border-gray-300 rounded">
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
              <div className="text-center py-4 border border-dashed border-gray-300 rounded">
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
          <span className="text-sm text-gray-600">내용에 변수가 없습니다.</span>
        </div>
      </div>

      {/* 체크박스 옵션들 */}
      <div className="space-y-4">
        {/* 광고메시지 여부 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="adMessage" className="rounded" />
            <label htmlFor="adMessage" className="text-sm text-gray-700">광고메시지 여부</label>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* 발송실패 시 문자대체발송 여부 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="smsBackupRcs" className="rounded" defaultChecked />
            <label htmlFor="smsBackupRcs" className="text-sm text-gray-700">
              발송실패 시 문자대체발송 여부
            </label>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* 메시지 공유가능여부 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="messageShare" className="rounded" defaultChecked />
            <label htmlFor="messageShare" className="text-sm text-gray-700">메시지 공유가능여부</label>
          </div>
        </div>
      </div>
    </>
  );
};

export default RcsMessageContent;