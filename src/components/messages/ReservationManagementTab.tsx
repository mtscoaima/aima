"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function ReservationManagementTab() {
  const router = useRouter();

  const handleMenuClick = (path: string) => {
    router.push(path);
  };

  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 스마트 캘린더 - 큰 카드 */}
          <div
            onClick={() => handleMenuClick('/messages/reservations/calendar')}
            className="bg-blue-500 text-white rounded-2xl p-8 cursor-pointer hover:bg-blue-600 transition-colors md:col-span-2 lg:col-span-1"
          >
            <h2 className="text-xl font-semibold mb-6">공간예약 캘린더</h2>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <div className="w-12 h-12 bg-white rounded flex flex-col items-center justify-center">
                  <div className="flex space-x-1 mb-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 메시지 - 큰 카드 */}
          <div
            onClick={() => handleMenuClick('/messages/reservations/message')}
            className="bg-gray-100 rounded-2xl p-8 cursor-pointer hover:bg-gray-200 transition-colors md:col-span-2 lg:col-span-1"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-6">예약메시지 템플릿</h2>
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center">
                <div className="w-8 h-6 bg-white rounded flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 작은 메뉴 항목들 */}
          <div className="md:col-span-2 space-y-4">
            {/* 내 공간 */}
            <div
              onClick={() => handleMenuClick('/messages/reservations/places')}
              className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
                </div>
                <span className="font-medium text-gray-900">내 공간</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* 예약 리스트 */}
            <div
              onClick={() => handleMenuClick('/messages/reservations/list')}
              className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="space-y-1">
                    <div className="w-3 h-0.5 bg-blue-500"></div>
                    <div className="w-3 h-0.5 bg-blue-500"></div>
                    <div className="w-3 h-0.5 bg-blue-500"></div>
                  </div>
                </div>
                <span className="font-medium text-gray-900">예약 리스트</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>

            {/* 통계 */}
            <div
              onClick={() => handleMenuClick('/messages/reservations/statistics')}
              className="bg-white rounded-xl p-4 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-blue-500 rounded-full border-t-transparent transform rotate-45"></div>
                </div>
                <span className="font-medium text-gray-900">통계</span>
              </div>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
