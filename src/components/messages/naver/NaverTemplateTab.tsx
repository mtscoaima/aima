"use client";

import React, { useState } from "react";
import { ChevronDown, FileText, ChevronLeft, ChevronRight } from "lucide-react";

const NaverTemplateTab = () => {
  const [selectedStatus, setSelectedStatus] = useState("전체");
  const [templateStatus, setTemplateStatus] = useState("전체");
  const [templateName, setTemplateName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [showOnlyApproved, setShowOnlyApproved] = useState(false);

  return (
    <div className="flex-1">
      {/* 검색 필터 */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">연동 에이전트</label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="전체">전체</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 상태</label>
          <div className="relative">
            <select
              value={templateStatus}
              onChange={(e) => setTemplateStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="전체">전체</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 이름</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 ID</label>
          <input
            type="text"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-2 mr-4">
            <input
              type="checkbox"
              id="approvedOnly"
              checked={showOnlyApproved}
              onChange={(e) => setShowOnlyApproved(e.target.checked)}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="approvedOnly" className="text-sm text-gray-700">
              숨긴 템플릿 보기
            </label>
          </div>
        </div>
        {/* 버튼 그룹 */}
        <div className="flex gap-2 items-center">
          <button className="w-full h-fit bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
            검색
          </button>
          <button className="w-full h-fit border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm">
            검색 초기화
          </button>
        </div>
      </div>



      {/* 액션 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-green-700">
            <FileText className="w-4 h-4" />
            네이버 템플릿 생성
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

      {/* 템플릿 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-6 gap-4 p-4 text-sm font-medium text-gray-700">
            <div>템플릿 이름</div>
            <div>템플릿 아이디</div>
            <div>상태</div>
            <div>버튼 수</div>
            <div>최근 수정일</div>
            <div>템플릿 관리</div>
          </div>
        </div>

        {/* 빈 상태 */}
        <div className="p-16 text-center">
          <p className="text-gray-500 text-lg">목록이 없습니다.</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-green-700">
            <FileText className="w-4 h-4" />
            네이버 템플릿 생성
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

export default NaverTemplateTab;