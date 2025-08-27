"use client";

import React, { useState, useEffect } from "react";

interface DateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate: string;
  endDate: string;
  onDateChange: (startDate: string, endDate: string) => void;
}

const DateRangeModal: React.FC<DateRangeModalProps> = ({
  isOpen,
  onClose,
  startDate,
  endDate,
  onDateChange,
}) => {
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);

  useEffect(() => {
    if (isOpen) {
      setTempStartDate(startDate);
      setTempEndDate(endDate);
    }
  }, [isOpen, startDate, endDate]);

  if (!isOpen) return null;

  // 빠른 선택 버튼들
  const quickSelectButtons = [
    { label: "오늘", getDates: () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      return { start: todayStr, end: todayStr };
    }},
    { label: "어제", getDates: () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return { start: yesterdayStr, end: yesterdayStr };
    }},
    { label: "이번 주", getDates: () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek);
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
      return {
        start: startOfWeek.toISOString().split('T')[0],
        end: endOfWeek.toISOString().split('T')[0]
      };
    }},
    { label: "지난 주", getDates: () => {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() - dayOfWeek - 7);
      const endOfLastWeek = new Date(today);
      endOfLastWeek.setDate(today.getDate() - dayOfWeek - 1);
      return {
        start: startOfLastWeek.toISOString().split('T')[0],
        end: endOfLastWeek.toISOString().split('T')[0]
      };
    }},
    { label: "지난 7일", getDates: () => {
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      return {
        start: sevenDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    }},
    { label: "지난 30일", getDates: () => {
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      return {
        start: thirtyDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    }},
    { label: "지난 90일", getDates: () => {
      const today = new Date();
      const ninetyDaysAgo = new Date(today);
      ninetyDaysAgo.setDate(today.getDate() - 89);
      return {
        start: ninetyDaysAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    }},
    { label: "이번 달", getDates: () => {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start: startOfMonth.toISOString().split('T')[0],
        end: endOfMonth.toISOString().split('T')[0]
      };
    }},
    { label: "지난 달", getDates: () => {
      const today = new Date();
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      return {
        start: startOfLastMonth.toISOString().split('T')[0],
        end: endOfLastMonth.toISOString().split('T')[0]
      };
    }},
  ];

  const handleQuickSelect = (getDates: () => { start: string; end: string }) => {
    const { start, end } = getDates();
    setTempStartDate(start);
    setTempEndDate(end);
  };

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
    onClose();
  };

  const handleCancel = () => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    onClose();
  };

  // 날짜 차이 계산
  const calculateDateDiff = () => {
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace('.', '');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 bg-black bg-opacity-25"
          onClick={handleCancel}
        />
        
        {/* 모달 컨테이너 */}
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl">
          {/* 상단 - 빠른 선택 버튼들 */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-wrap gap-2">
              {quickSelectButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickSelect(button.getDates)}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-600 rounded transition-colors"
                >
                  {button.label}
                </button>
              ))}
            </div>
          </div>

          {/* 중앙 - 달력 영역 */}
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작일</label>
                <input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종료일</label>
                <input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 하단 - 선택된 날짜 표시 및 버튼 */}
          <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {formatDate(tempStartDate)} ~ {formatDate(tempEndDate)} ({calculateDateDiff()}일)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  적용
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangeModal;