"use client";

import React from "react";
// import { useRouter } from "next/navigation";

export default function ReservationsPage() {
  // const router = useRouter();

  // const handleMenuClick = (path: string) => {
  //   // 모든 클릭 이벤트를 무시
  //   return;
  // };

  return (
    <div className="page-disabled-overlay">
      <div className="login-prompt-banner">
        <div className="login-prompt-content">
          <h3>서비스 준비중입니다</h3>
          <p>예약 관리 기능을 준비하고 있습니다. 빠른 시일 내에 제공할 예정입니다.</p>
        </div>
      </div>
      <div className="page-content-disabled">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">
              예약 관리
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 스마트 캘린더 - 큰 카드 */}
              <div
                className="bg-blue-500 text-white rounded-2xl p-8 cursor-not-allowed opacity-60 md:col-span-2 lg:col-span-1"
              >
                <h2 className="text-xl font-semibold mb-6">스마트 캘린더</h2>
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
                className="bg-gray-100 rounded-2xl p-8 cursor-not-allowed opacity-60 md:col-span-2 lg:col-span-1"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">메시지</h2>
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
                  className="bg-white rounded-xl p-4 border border-gray-200 cursor-not-allowed opacity-60 flex items-center justify-between"
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
                  className="bg-white rounded-xl p-4 border border-gray-200 cursor-not-allowed opacity-60 flex items-center justify-between"
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

                {/* 결제 리스트 */}
                <div
                  className="bg-white rounded-xl p-4 border border-gray-200 cursor-not-allowed opacity-60 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <div className="w-4 h-3 border-2 border-blue-500 rounded-sm flex items-center justify-center">
                        <div className="w-1 h-1 bg-blue-500"></div>
                      </div>
                    </div>
                    <span className="font-medium text-gray-900">결제 리스트</span>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* 통계 */}
                <div
                  className="bg-white rounded-xl p-4 border border-gray-200 cursor-not-allowed opacity-60 flex items-center justify-between"
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
      </div>
    </div>
  );
}