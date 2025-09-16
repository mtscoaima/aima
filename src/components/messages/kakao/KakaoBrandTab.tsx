"use client";

import React from "react";
import { Search, Plus, ChevronDown, HelpCircle } from "lucide-react";

const KakaoBrandTab = () => {
  return (
    <div className="flex-1 flex">
      {/* 좌측 영역 - 브랜드 템플릿 */}
      <div className="flex-1 pr-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">브랜드 템플릿</h2>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            템플릿 등록
          </button>
        </div>

        {/* 검색 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="템플릿 이름, ID, 채널명 검색"
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-20">
          <div className="text-gray-400 text-lg mb-2">브랜드 템플릿이 존재하지 않습니다.</div>
        </div>
      </div>

      {/* 우측 영역 - 템플릿 미리보기 */}
      <div className="flex-1 pl-6 border-l border-gray-200">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">템플릿 미리보기</h2>
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-20">
          <div className="text-gray-400 text-lg mb-2">템플릿을 선택하면 미리보기가 표시됩니다.</div>
        </div>
      </div>
    </div>
  );
};

export default KakaoBrandTab;