"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

interface Recipient {
  phone_number: string;
  name?: string;
  variables?: Record<string, string>;
}

interface MessageData {
  subject: string;
  content: string;
  isAd: boolean;
}

interface SendConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: Recipient[];
  messageData: MessageData;
  onImmediateSend: () => Promise<void>;
  onScheduledSend: (scheduledDateTime: Date) => Promise<void>;
  isLoading: boolean;
}

const SendConfirmModal: React.FC<SendConfirmModalProps> = ({
  isOpen,
  onClose,
  recipients,
  messageData,
  onImmediateSend,
  onScheduledSend,
  isLoading,
}) => {
  const [sendType, setSendType] = useState<"immediate" | "scheduled">("immediate");

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[tomorrow.getDay()];
    return `${year}.${month}.${day} (${dayName})`;
  };

  const getTomorrowISODate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTomorrowDate());
  const [selectedISODate, setSelectedISODate] = useState(getTomorrowISODate());
  const [selectedHour, setSelectedHour] = useState("00");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDateClick = () => {
    setShowDateCalendar(!showDateCalendar);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDateObj = new Date(date);
    selectedDateObj.setHours(0, 0, 0, 0);

    if (selectedDateObj < today) {
      return;
    }

    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    const displayDate = `${year}.${month}.${day} (${days[date.getDay()]})`;

    setSelectedDate(displayDate);
    setSelectedISODate(isoDate);
    setShowDateCalendar(false);
  };

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

  const handleConfirm = async () => {
    if (sendType === "immediate") {
      await onImmediateSend();
    } else {
      const [year, month, day] = selectedISODate.split('-').map(Number);
      const scheduledDateTime = new Date(year, month - 1, day, parseInt(selectedHour), parseInt(selectedMinute), 0);
      await onScheduledSend(scheduledDateTime);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">전송 확인</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-6">
          {/* 전송 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">발신번호</span>
              <span className="text-sm font-medium text-gray-900">테스트 발신번호</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">수신자 수</span>
              <span className="text-sm font-medium text-gray-900">{recipients.length}명</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-gray-600">메시지 내용</span>
              <p className="text-sm text-gray-900 bg-white p-2 rounded border border-gray-200 max-h-20 overflow-y-auto">
                {messageData.content}
              </p>
            </div>
          </div>

          {/* 보내기 방식 선택 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">보내기 방식</h4>

            {/* 즉시 발송 */}
            <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <div className="relative">
                <input
                  type="radio"
                  name="sendTypeModal"
                  value="immediate"
                  checked={sendType === "immediate"}
                  onChange={(e) => setSendType(e.target.value as "immediate")}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded-full ${
                  sendType === "immediate"
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}>
                  {sendType === "immediate" && (
                    <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  )}
                </div>
              </div>
              <span className="ml-3 text-gray-900">즉시 발송</span>
            </label>

            {/* 예약 발송 */}
            <label className="flex items-center cursor-pointer p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <div className="relative">
                <input
                  type="radio"
                  name="sendTypeModal"
                  value="scheduled"
                  checked={sendType === "scheduled"}
                  onChange={(e) => setSendType(e.target.value as "scheduled")}
                  className="sr-only"
                />
                <div className={`w-5 h-5 border-2 rounded-full ${
                  sendType === "scheduled"
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}>
                  {sendType === "scheduled" && (
                    <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                  )}
                </div>
              </div>
              <span className="ml-3 text-gray-900">예약 발송</span>
            </label>

            {/* 예약 발송 시간 선택 */}
            {sendType === "scheduled" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  {/* 날짜 선택 */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                    <button
                      onClick={handleDateClick}
                      className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-900 font-medium">{selectedDate}</span>
                      <svg
                        className={`w-4 h-4 text-gray-600 transition-transform ${showDateCalendar ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* 캘린더 드롭다운 */}
                    {showDateCalendar && (
                      <div className="absolute z-10 w-full mt-2 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                        {/* 캘린더 헤더 */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
                          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-200 rounded-lg">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {currentMonth.getFullYear()}.{(currentMonth.getMonth() + 1).toString().padStart(2, '0')}
                          </h3>
                          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-200 rounded-lg">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>

                        {/* 캘린더 본문 */}
                        <div className="p-4">
                          {/* 요일 */}
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

                          {/* 날짜 그리드 */}
                          <div className="grid grid-cols-7 gap-1">
                            {generateCalendarDays().map((day, index) => {
                              const today = new Date();
                              const isToday = day.toDateString() === today.toDateString();
                              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                              const isPastDate = day < today && !isToday;
                              const dayOfWeek = day.getDay();
                              const isSelected = selectedISODate && day.toISOString().split('T')[0] === selectedISODate;

                              return (
                                <button
                                  key={index}
                                  onClick={() => !isPastDate && handleDateSelect(day)}
                                  disabled={isPastDate}
                                  className={`p-2 text-sm rounded-lg transition-colors ${
                                    isPastDate ? 'text-gray-300 cursor-not-allowed' :
                                    !isCurrentMonth ? 'text-gray-400 hover:bg-gray-100' :
                                    isSelected ? 'bg-blue-500 text-white' :
                                    isToday ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                    dayOfWeek === 0 ? 'text-red-500 hover:bg-gray-100' :
                                    dayOfWeek === 6 ? 'text-blue-500 hover:bg-gray-100' :
                                    'text-gray-900 hover:bg-gray-100'
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

                  {/* 시간 선택 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시간</label>
                    <div className="flex space-x-2">
                      <select
                        value={selectedHour}
                        onChange={(e) => setSelectedHour(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}시
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedMinute}
                        onChange={(e) => setSelectedMinute(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Array.from({ length: 60 }, (_, i) => (
                          <option key={i} value={i.toString().padStart(2, '0')}>
                            {i.toString().padStart(2, '0')}분
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {sendType === "immediate" ? "즉시 전송" : "예약 발송"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendConfirmModal;
