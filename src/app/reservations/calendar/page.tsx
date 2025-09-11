"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function ReservationCalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 8)); // 2025년 9월
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsMonth, setStatsMonth] = useState(new Date(2025, 8)); // 통계 모달용 월
  const [viewSettings, setViewSettings] = useState({
    spaces: { 내공간: true },
    sortBy: "시간순",
    displayInfo: { 시간: true, 예약자명: true, 총금액: false, 예약채널: false },
    options: { 입실날짜만예약표시하기: false }
  });

  const handleBackClick = () => {
    router.back();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleShareCalendar = () => {
    router.push('/reservations/calendar/shared');
  };

  const handleShowStats = () => {
    setShowStatsModal(true);
  };

  const handleCloseStats = () => {
    setShowStatsModal(false);
  };

  const handleStatsPrevMonth = () => {
    setStatsMonth(new Date(statsMonth.getFullYear(), statsMonth.getMonth() - 1));
  };

  const handleStatsNextMonth = () => {
    setStatsMonth(new Date(statsMonth.getFullYear(), statsMonth.getMonth() + 1));
  };

  const handleNewReservation = () => {
    router.push('/reservations/create');
  };

  const handleViewSettings = () => {
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    setShowViewModal(false);
  };

  const handleViewSettingChange = (category: string, key: string, value: any) => {
    setViewSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // 캘린더 날짜 생성
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <button 
                onClick={handleBackClick}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* 보기 설정 */}
              <div className="relative">
                <button
                  onClick={handleViewSettings}
                  className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>보기</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleShareCalendar}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>공유 캘린더</span>
              </button>
              <button
                onClick={handleShowStats}
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>통계</span>
              </button>
              <button
                onClick={handleNewReservation}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>예약 입력</span>
              </button>
            </div>
          </div>

          {/* 캘린더 네비게이션 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                {currentMonth.getFullYear()}. {monthNames[currentMonth.getMonth()]}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* 캘린더 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-gray-200">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div key={day} className={`p-4 text-center font-medium ${
                  index === 0 ? 'text-red-500' : 
                  index === 6 ? 'text-blue-500' : 
                  'text-gray-700'
                }`}>
                  {day}
                </div>
              ))}
            </div>

            {/* 캘린더 그리드 */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                const dayOfWeek = day.getDay();
                const hasReservation = day.getDate() === 11 && isCurrentMonth; // 11일에 예약이 있다고 가정

                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border-r border-b border-gray-100 ${
                      !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      !isCurrentMonth ? 'text-gray-400' :
                      dayOfWeek === 0 ? 'text-red-500' :
                      dayOfWeek === 6 ? 'text-blue-500' :
                      isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center' :
                      'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {hasReservation && (
                      <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        17~19, [샵플] 간이식
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 보기 설정 모달 */}
          {showViewModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
                {/* 모달 헤더 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">보기 설정</h3>
                  <button
                    onClick={handleCloseViewModal}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
                  <div className="p-6 space-y-8">
                    {/* 공간 선택 */}
                    <div>
                      <div className="flex items-center space-x-3 mb-4">
                        <input
                          type="checkbox"
                          id="space-naegong"
                          checked={viewSettings.spaces.내공간}
                          onChange={(e) => handleViewSettingChange('spaces', '내공간', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-medium">내공간</span>
                          <span className="text-gray-700">내공간</span>
                        </div>
                      </div>
                    </div>

                    {/* 일정 정렬 */}
                    <div>
                      <div className="flex items-center space-x-2 mb-4">
                        <h4 className="text-gray-900 font-medium">일정 정렬</h4>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="sortBy"
                            value="시간순"
                            checked={viewSettings.sortBy === "시간순"}
                            onChange={(e) => handleViewSettingChange('sortBy', '', e.target.value)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">시간순</span>
                        </label>
                        <label className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="sortBy"
                            value="공간순"
                            checked={viewSettings.sortBy === "공간순"}
                            onChange={(e) => setViewSettings(prev => ({...prev, sortBy: e.target.value}))}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">공간순</span>
                        </label>
                      </div>
                    </div>

                    {/* 표시할 정보 */}
                    <div>
                      <h4 className="text-gray-900 font-medium mb-4">표시할 정보</h4>
                      <div className="space-y-4">
                        {[
                          { key: '시간', label: '시간' },
                          { key: '예약자명', label: '예약자명' },
                          { key: '총금액', label: '총 금액' },
                          { key: '예약채널', label: '예약채널' }
                        ].map(item => (
                          <div key={item.key} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={`display-${item.key}`}
                                checked={viewSettings.displayInfo[item.key]}
                                onChange={(e) => handleViewSettingChange('displayInfo', item.key, e.target.checked)}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">{item.label}</span>
                            </div>
                            <button className="text-gray-300 hover:text-gray-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 표시 옵션 */}
                    <div>
                      <h4 className="text-gray-900 font-medium mb-4">표시 옵션</h4>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            id="show-checkin-only"
                            checked={viewSettings.options.입실날짜만예약표시하기}
                            onChange={(e) => handleViewSettingChange('options', '입실날짜만예약표시하기', e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                          />
                          <div>
                            <span className="text-gray-700">입실 날짜에만 예약 표시하기</span>
                            <p className="text-sm text-gray-500 mt-1">
                              퇴실 시간이 자정을 넘어가더라도 입실 날짜에만 표시하고 퇴실 날짜에는 표시하지 않습니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 적용하기 버튼 */}
                <div className="p-6 border-t border-gray-100">
                  <button
                    onClick={handleCloseViewModal}
                    className="w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  >
                    적용하기
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 통계 모달 */}
          {showStatsModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-md mx-4">
                {/* 모달 헤더 */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleStatsPrevMonth}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {statsMonth.getFullYear()}년 {statsMonth.getMonth() + 1}월 통계
                    </h3>
                    <button
                      onClick={handleStatsNextMonth}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 공간 선택 드롭다운 */}
                <div className="p-6">
                  <div className="relative mb-6">
                    <select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="all">전체 공간</option>
                      <option value="space1">공간 1</option>
                      <option value="space2">공간 2</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* 통계 데이터 */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">• 총 매출</span>
                      <span className="font-semibold text-gray-900">100,000원</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">• 총 예약 건수</span>
                      <span className="font-semibold text-gray-900">1건</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">• 총 이용 인원</span>
                      <span className="font-semibold text-gray-900">10명</span>
                    </div>
                  </div>

                  {/* 모달 버튼 */}
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={handleCloseStats}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      닫기
                    </button>
                    <button className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      자세히 보기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}