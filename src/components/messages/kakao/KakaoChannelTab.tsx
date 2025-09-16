"use client";

import React from "react";
import { Search, Plus, HelpCircle, Mail } from "lucide-react";

const KakaoChannelTab = () => {
  return (
    <div className="flex-1 flex">
      {/* 좌측 영역 - 카카오 채널 */}
      <div className="flex-1 pr-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">카카오 채널</h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            채널 연동
          </button>
        </div>

        {/* 검색 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="채널 검색"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-20">
          <div className="text-gray-400 text-lg mb-2">채널이 존재하지 않습니다.</div>
        </div>
      </div>

      {/* 우측 영역 - 카카오 채널 그룹 */}
      <div className="flex-1 pl-6 border-l border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900">카카오 채널 그룹</h2>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex gap-2">
            <button className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-gray-50">
              <Mail className="w-4 h-4" />
              그룹 초대 내역
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700">
              <Plus className="w-4 h-4" />
              그룹 생성
            </button>
          </div>
        </div>

        {/* 검색 */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="그룹 검색"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* 빈 상태 */}
        <div className="text-center py-20">
          <div className="text-gray-400 text-lg mb-2">채널 그룹이 존재하지 않습니다.</div>
        </div>
      </div>
    </div>
  );
};

export default KakaoChannelTab;