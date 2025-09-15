"use client";

import React, { useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  Clock,
  Info,
  HelpCircle
} from "lucide-react";

const SmsMessageContent = () => {
  const [subjectLength, setSubjectLength] = useState(0);
  const [messageLength, setMessageLength] = useState(0);

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
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          maxLength={40}
          onChange={(e) => setSubjectLength(e.target.value.length)}
        />
      </div>

      {/* 메시지 내용 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex-1">
        <div className="flex flex-col h-full">
          <textarea
            placeholder="이곳에 문자 내용을 입력합니다.&#10;저희문구 예시) #[올림]님 #[지각비] 방문 예약입니다."
            className="flex-1 w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[200px]"
            maxLength={2000}
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
              <span className="text-xs text-gray-500">{messageLength}/2,000 Bytes</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 문구 저장 */}
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

      {/* 광고메시지 여부 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="adMessage" className="rounded" />
          <label htmlFor="adMessage" className="text-sm text-gray-700">광고메시지 여부</label>
          <HelpCircle className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </>
  );
};

export default SmsMessageContent;