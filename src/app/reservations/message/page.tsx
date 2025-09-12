"use client";

import React from "react";
import { useRouter } from "next/navigation";

import RoleGuard from "@/components/RoleGuard";

export default function ReservationMessagePage() {
  const router = useRouter();

  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  const handleBackClick = () => {
    router.push('/reservations');
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900">
              메시지
            </h1>
          </div>

          <div className="space-y-6">
            {/* 메시지 섹션 헤더 */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">메시지</h2>
            </div>

            {/* 메뉴 리스트 */}
            <div className="space-y-2">
              {/* 메시지 보내기 */}
              <div 
                onClick={() => handleMenuClick('/reservations/message/send')}
                className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="text-gray-900 font-medium">메시지 보내기</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* 보낸 메시지 */}
              <div 
                onClick={() => handleMenuClick('/reservations/message/list')}
                className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="text-gray-900 font-medium">보낸 메시지</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* 내 템플릿 관리 */}
              <div 
                onClick={() => handleMenuClick('/reservations/message/templates')}
                className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="text-gray-900 font-medium">내 템플릿 관리</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* 발신자 정보 설정 */}
              <div 
                onClick={() => handleMenuClick('/reservations/message/sender-contact')}
                className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="text-gray-900 font-medium">발신자 정보 설정</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* 자동 메시지 섹션 헤더 */}
            <div className="flex items-center space-x-3 mb-6 mt-8">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">자동 메시지</h2>
            </div>

            {/* 자동 메시지 메뉴 리스트 */}
            <div className="space-y-2">
              {/* 자동 메시지 설정 */}
              <div 
                onClick={() => handleMenuClick('/reservations/message/auto')}
                className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="text-gray-900 font-medium">자동 메시지 설정</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* 발송 예정 메시지 */}
              <div 
                onClick={() => handleMenuClick('/reservations/message/list/reserved')}
                className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
              >
                <span className="text-gray-900 font-medium">발송 예정 메시지</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}