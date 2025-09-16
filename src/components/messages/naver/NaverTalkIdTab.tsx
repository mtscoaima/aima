"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const NaverTalkIdTab = () => {
  return (
    <div className="flex-1">
      {/* 액션 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
            네이버톡톡 연동방법 ↗
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            네이버 톡톡 파트너센터 ↗
          </button>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center gap-4">
          <select className="border border-gray-300 rounded px-3 py-1 text-sm">
            <option>20</option>
          </select>
          <span className="text-sm text-gray-600">1 / 1</span>
          <div className="flex gap-1">
            <button className="p-1 border border-gray-300 rounded hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 border border-gray-300 rounded hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 톡톡 아이디 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-5 gap-4 p-4 text-sm font-medium text-gray-700">
            <div>톡 이름</div>
            <div>Talk ID</div>
            <div>고유 ID</div>
            <div>연동일</div>
            <div>템플릿 관리</div>
          </div>
        </div>

        {/* 빈 상태 */}
        <div className="p-16 text-center">
          <p className="text-gray-500 text-lg">목록이 없습니다.</p>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
            네이버톡톡 연동방법 ↗
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            네이버 톡톡 파트너센터 ↗
          </button>
        </div>

        {/* 하단 페이지네이션 */}
        <div className="flex justify-end items-center mt-6">
          <div className="flex items-center gap-4">
            <select className="border border-gray-300 rounded px-3 py-1 text-sm">
              <option>20</option>
            </select>
            <span className="text-sm text-gray-600">1 / 1</span>
            <div className="flex gap-1">
              <button className="p-1 border border-gray-300 rounded hover:bg-gray-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1 border border-gray-300 rounded hover:bg-gray-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NaverTalkIdTab;