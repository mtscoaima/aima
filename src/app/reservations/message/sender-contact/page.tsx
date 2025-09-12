"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import RoleGuard from "@/components/RoleGuard";

export default function MessageSenderContactPage() {
  const router = useRouter();
  const [selectedSender, setSelectedSender] = useState("내공간");

  const handleBackClick = () => {
    router.back();
  };

  const handleSenderChange = (value: string) => {
    setSelectedSender(value);
  };

  const handleSenderNumberInfo = () => {
    // 발신 전용 번호 정보 보기 (UI만 구현)
  };

  const handleHostContactInfo = () => {
    // 호스트 연락처 정보 보기 (UI만 구현)
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center mb-8">
            <button 
              onClick={handleBackClick}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              발신자 정보 설정
            </h1>
          </div>

          <div className="space-y-6">
            {/* 발신자 선택 드롭다운 */}
            <div className="relative">
              <select
                value={selectedSender}
                onChange={(e) => handleSenderChange(e.target.value)}
                className="w-full p-4 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="내공간">📍 내공간</option>
                <option value="기타1">📍 기타 옵션 1</option>
                <option value="기타2">📍 기타 옵션 2</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* 보내는 번호 섹션 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">보내는 번호</h3>
                  <p className="text-gray-500 text-sm">발신 전용 번호</p>
                </div>
                <button
                  onClick={handleSenderNumberInfo}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 호스트 연락처 섹션 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">호스트 연락처</h3>
                  <p className="text-gray-500 text-sm">연락처 입력하기</p>
                </div>
                <button
                  onClick={handleHostContactInfo}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 빈 공간 (추가 설정이 있을 경우를 대비) */}
            <div className="py-8">
              {/* 추가 설정 항목들이 여기에 올 수 있음 */}
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}