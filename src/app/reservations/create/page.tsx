"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import RoleGuard from "@/components/RoleGuard";

export default function CreateReservationPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    space: "내공간",
    date: "2025.9.11 (목)",
    startTime: "18",
    endTime: "20",
    channel: "선택안함",
    customerName: "",
    phoneNumber: "",
    people: "",
    memo: ""
  });

  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 8)); // 2025년 9월

  const handleBackClick = () => {
    router.back();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdvancedSettings = () => {
    // 반복 일정 설정 (UI만 구현)
  };

  const handlePaymentLinks = () => {
    // 결제 링크 만들기 (UI만 구현)
  };

  const handleGuestRegistration = () => {
    // 글래 입력하기 (UI만 구현)
  };

  const handleSubmit = () => {
    // 예약 추가하기 (UI만 구현)
  };

  const handleDateClick = () => {
    setShowDateCalendar(!showDateCalendar);
  };

  const handleChannelClick = () => {
    setShowChannelModal(true);
  };

  const handleDateSelect = (date: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const formattedDate = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} (${days[date.getDay()]})`;
    handleInputChange("date", formattedDate);
    setShowDateCalendar(false);
  };

  const handleChannelSelect = (channel: string) => {
    handleInputChange("channel", channel);
    setShowChannelModal(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // 캘린더 날짜 생성
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
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

  // 예약채널 목록
  const channels = [
    "선택안함",
    "아워플레이스", 
    "스페이스클라우드",
    "여기어때",
    "웨이닛",
    "빌리오",
    "카카오 채널",
    "네이버 예약",
    "전화",
    "인스타그램",
    "홈페이지"
  ];

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
              예약 추가
            </h1>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  * 표시가 되어있는 항목은 필수입니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* 공간선택 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                공간선택<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.space}
                  onChange={(e) => handleInputChange("space", e.target.value)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center"
                >
                  <option value="내공간">🏢 내공간</option>
                  <option value="공간1">🏢 공간 1</option>
                  <option value="공간2">🏢 공간 2</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 예약 날짜 */}
            <div className="relative">
              <label className="block text-gray-900 font-medium mb-3">
                예약 날짜<span className="text-red-500">*</span>
              </label>
              
              {/* 날짜 선택 버튼 */}
              <button
                onClick={handleDateClick}
                className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="text-blue-600 font-medium">{formData.date}</span>
                <svg 
                  className={`w-4 h-4 text-blue-600 transition-transform ${showDateCalendar ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* 드롭다운 캘린더 */}
              {showDateCalendar && (
                <div className="absolute z-10 w-full mt-2 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                  {/* 캘린더 네비게이션 */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 hover:bg-gray-200 rounded-lg"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentMonth.getFullYear()}.{(currentMonth.getMonth() + 1).toString().padStart(2, '0')}
                    </h3>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 hover:bg-gray-200 rounded-lg"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* 캘린더 */}
                  <div className="p-4">
                    {/* 요일 헤더 */}
                    <div className="grid grid-cols-7 mb-2">
                      {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                        <div key={day} className={`p-2 text-center text-sm font-medium ${
                          index === 0 ? 'text-red-500' : 
                          index === 6 ? 'text-blue-500' : 
                          'text-gray-700'
                        }`}>
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* 캘린더 그리드 */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((day, index) => {
                        const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                        const isSelected = day.getDate() === 11 && isCurrentMonth; // 11일이 선택됨
                        const dayOfWeek = day.getDay();

                        return (
                          <button
                            key={index}
                            onClick={() => handleDateSelect(day)}
                            className={`p-2 text-sm rounded-lg hover:bg-gray-100 ${
                              !isCurrentMonth ? 'text-gray-400' :
                              isSelected ? 'bg-blue-500 text-white' :
                              dayOfWeek === 0 ? 'text-red-500' :
                              dayOfWeek === 6 ? 'text-blue-500' :
                              'text-gray-900'
                            }`}
                          >
                            {day.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 예약 시간 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                예약 시간<span className="text-red-500">*</span>
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <select
                    value={formData.startTime}
                    onChange={(e) => handleInputChange("startTime", e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString()}>{i}시</option>
                    ))}
                  </select>
                </div>
                <span className="text-gray-500">~</span>
                <div className="flex-1">
                  <select
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                    className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-blue-600 font-medium"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString()}>{i}시</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* 반복 일정 설정 */}
              <button
                onClick={handleAdvancedSettings}
                className="flex items-center space-x-2 mt-3 text-gray-600 hover:text-gray-800"
              >
                <span className="text-sm">반복 일정 설정</span>
                <span className="text-blue-500 text-sm">없음</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 예약 채널 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                예약 채널
              </label>
              <button
                onClick={handleChannelClick}
                className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-900">{formData.channel}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 고객 정보 */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">고객 정보</h3>
              
              {/* 이름 */}
              <div>
                <label className="block text-gray-900 font-medium mb-3">이름</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange("customerName", e.target.value)}
                  placeholder="예약자 이름"
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 휴대폰 번호 */}
              <div>
                <label className="block text-gray-900 font-medium mb-3">휴대폰 번호</label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                  placeholder="숫자만 입력하세요."
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex items-center mt-2 text-sm text-gray-600">
                  <span>입력된 번호로 SMS 메시지가 발송됩니다.</span>
                  <button className="ml-2 text-gray-400 hover:text-gray-600">
                    <span className="underline">주의사항 보기</span>
                  </button>
                  <button className="ml-1 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 인원 */}
              <div>
                <label className="block text-gray-900 font-medium mb-3">인원</label>
                <input
                  type="text"
                  value={formData.people}
                  onChange={(e) => handleInputChange("people", e.target.value)}
                  placeholder="인원을 입력하세요."
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 급액 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">급액</h3>
              
              <button
                onClick={handlePaymentLinks}
                className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">결제 링크 만들기</span>
              </button>

              <button
                onClick={handleGuestRegistration}
                className="flex items-center space-x-2 text-blue-500 hover:text-blue-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">글래 입력하기</span>
              </button>
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">메모</label>
              <textarea
                value={formData.memo}
                onChange={(e) => handleInputChange("memo", e.target.value)}
                placeholder="간단한 메모 입력"
                rows={4}
                className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">
                호스트에게만 표시됩니다. 고객에게 표시되지 않습니다
              </p>
            </div>

            {/* 예약 추가하기 버튼 */}
            <div className="pt-6">
              <button
                onClick={handleSubmit}
                className="w-full py-4 px-4 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-lg"
              >
                예약 추가하기
              </button>
            </div>
          </div>


          {/* 예약채널 선택 모달 */}
          {showChannelModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-sm mx-4 max-h-96 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">예약채널 선택</h3>
                  <button
                    onClick={() => setShowChannelModal(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-y-auto max-h-80">
                  {channels.map((channel, index) => (
                    <button
                      key={index}
                      onClick={() => handleChannelSelect(channel)}
                      className={`w-full p-4 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-b-0 ${
                        channel === "선택안함" ? 'text-blue-600' : 'text-gray-900'
                      }`}
                    >
                      <span>{channel}</span>
                      {channel === "선택안함" && (
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-medium">내가 추가한 채널</span>
                      <button className="text-blue-500 text-sm font-medium">+ 채널 추가</button>
                    </div>
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