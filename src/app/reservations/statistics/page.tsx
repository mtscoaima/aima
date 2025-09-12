"use client";

import React, { useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { useRouter } from 'next/navigation';

export default function ReservationStatisticsPage() {
  const router = useRouter();
  const [currentYear, setCurrentYear] = useState(2025);
  const [currentMonthNum, setCurrentMonthNum] = useState(9); // September
  const [selectedSpace, setSelectedSpace] = useState("전체 공간");

  // Mock data - set to false to show empty state
  const [hasData, setHasData] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handlePrevMonth = () => {
    if (currentMonthNum === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonthNum(12);
    } else {
      setCurrentMonthNum(currentMonthNum - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthNum === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonthNum(1);
    } else {
      setCurrentMonthNum(currentMonthNum + 1);
    }
  };

  const getCurrentMonthString = () => {
    return `${currentYear}년 ${currentMonthNum.toString().padStart(2, '0')}월`;
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={handleBack}
            className="mr-4 p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            통계
          </h1>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center mb-8">
          <button onClick={handlePrevMonth} className="p-2 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mx-6">
            {getCurrentMonthString()}
          </h2>
          <button onClick={handleNextMonth} className="p-2 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {hasData ? (
          <>
            {/* Summary Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">전체 공간</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">100,000원</div>
                  <div className="text-sm text-gray-500">예약 1건 인원 10명</div>
                </div>
              </div>
            </div>

            {/* Space Statistics */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">공간별 통계</h3>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
                <div className="bg-green-600 h-4 rounded-full" style={{ width: '100%' }}></div>
              </div>

              {/* Space Item */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-semibold mr-4">
                    내공
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">내공간</div>
                    <div className="text-sm text-gray-500">100%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">100,000원</div>
                  <div className="text-sm text-gray-500">1건 10명</div>
                </div>
              </div>
            </div>

            {/* Reservation Detail Statistics */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 세부별 통계</h3>
              
              {/* Dropdown */}
              <div className="relative mb-4">
                <select 
                  value={selectedSpace}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white appearance-none cursor-pointer"
                >
                  <option value="전체 공간">전체 공간</option>
                  <option value="내공간">내공간</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
                <div className="bg-gray-700 h-6 rounded-full" style={{ width: '100%' }}></div>
              </div>

              {/* Detail Item */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-6 h-6 bg-gray-700 rounded mr-4"></div>
                  <div>
                    <div className="font-medium text-gray-900">전화</div>
                    <div className="text-sm text-gray-500">100%</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">100,000원</div>
                  <div className="text-sm text-gray-500">1건 10명</div>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">
                • 통계는 실시간으로 반영되지만 약간의 시차가 발생할 수 있습니다.
              </p>
            </div>

            {/* Download Button */}
            <div className="text-center">
              <button className="text-gray-600 underline text-sm">
                이 달의 예약 데이터 다운로드하기
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Empty State - Summary Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">전체 공간</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">0원</div>
                  <div className="text-sm text-gray-500">예약 0건 인원 0명</div>
                </div>
              </div>
            </div>

            {/* Empty State Message */}
            <div className="text-center py-20">
              <p className="text-gray-500">
                표시할 내용이 없습니다.
              </p>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}