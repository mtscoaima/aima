"use client";

import React from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";

export default function SharedCalendarPage() {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  const handleCreateCalendar = () => {
    router.push('/reservations/calendar/shared/create');
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
              공유 캘린더
            </h1>
          </div>

          {/* 내 공유 캘린더 섹션 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              내 공유 캘린더 <span className="text-blue-500">0</span>
            </h2>
          </div>

          {/* 빈 상태 */}
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-gray-500 text-lg mb-8">
              공유 캘린더가 없습니다.
            </p>
            
            {/* 공유 캘린더 만들기 버튼 */}
            <button
              onClick={handleCreateCalendar}
              className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">공유 캘린더 만들기</span>
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}