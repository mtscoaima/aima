"use client";

import React, { useState } from "react";
import {
  Info,
  HelpCircle,
  ChevronDown
} from "lucide-react";

const NaverTalkContent = () => {
  const [templateContent, setTemplateContent] = useState("");

  return (
    <>
      {/* 상단 정보 바 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <span className="text-sm text-gray-600">
          [네이버 스마트알림 발송방법 및 수신확인 문의 : 1577-1603]
        </span>
      </div>

      {/* 네이버톡 선택과 템플릿 선택 */}
      <div className="flex gap-6 mb-4">
        {/* 좌측: 네이버톡 선택 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-3" style={{ color: "#00a732" }}>네이버톡 선택</h3>
            <div className="relative">
              <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm appearance-none bg-white">
                <option value="">네이버톡 선택</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 우측: 템플릿 선택 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-3" style={{ color: "#00a732" }}>템플릿 선택</h3>
            <div className="relative">
              <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm appearance-none bg-white">
                <option value="">템플릿 선택</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 템플릿 내용 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium mb-3" style={{ color: "#00a732" }}>템플릿 내용</h3>
        <div className="bg-gray-50 border border-gray-200 rounded p-4 min-h-[300px]">
          <textarea
            placeholder="사용할 템플릿을 선택하면, 이곳에 템플릿 내용이 표시됩니다. (내용수정불가)"
            className="w-full h-full bg-transparent border-none outline-none text-sm resize-none"
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
          />
        </div>
      </div>

      {/* 문구 치환 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-gray-700">📄 문구 치환</span>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-blue-700">내용에 변수가 없습니다.</span>
          </div>
        </div>
      </div>

      {/* 발송실패 시 문자대체발송 여부 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <input type="checkbox" id="smsBackupNaver" className="rounded" defaultChecked />
          <label htmlFor="smsBackupNaver" className="text-sm text-gray-700">
            발송실패 시 문자대체발송 여부
          </label>
          <HelpCircle className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </>
  );
};

export default NaverTalkContent;