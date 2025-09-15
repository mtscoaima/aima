"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

interface Space {
  id: number;
  name: string;
  icon_text: string;
  icon_color: string;
}

interface ReservationFormData {
  space_id: number | null;
  space: string;
  date: string;
  displayDate: string;
  startTime: string;
  endTime: string;
  channel: string;
  customerName: string;
  phoneNumber: string;
  people: string;
  memo: string;
}

interface Reservation {
  id: number;
  space_id: number;
  space_name: string;
  space_icon_text: string;
  space_icon_color: string;
  customer_name: string;
  customer_phone: string;
  start_datetime: string;
  end_datetime: string;
  guest_count: number;
  total_amount?: number;
  amount?: number;
  payment_status: string;
  booking_channel: string;
  special_requirements?: string;
  memo?: string;
  created_at: string;
}

export default function EditReservationPage() {
  const { getAccessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('id');
  
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [loadingReservation, setLoadingReservation] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<ReservationFormData | null>(null);
  
  const [formData, setFormData] = useState<ReservationFormData>({
    space_id: null,
    space: "",
    date: "",
    displayDate: "",
    startTime: "18",
    endTime: "20",
    channel: "",
    customerName: "",
    phoneNumber: "",
    people: "1",
    memo: ""
  });

  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // 예약채널 목록
  const channels = [
    "아워플레이스", 
    "스페이스클라우드",
    "여기어때",
    "직접입력"
  ];

  // 변경사항 확인
  const hasChanges = useCallback(() => {
    if (!originalData) return false;
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  // 종료 시간 옵션 생성 (다음날 11시까지)
  const endTimeOptions = useCallback(() => {
    const options = [];
    const startHour = parseInt(formData.startTime);
    
    // 같은 날 (시작 시간 이후)
    for (let i = startHour + 1; i <= 24; i++) {
      options.push({ value: i.toString(), label: `${i}시` });
    }
    
    // 다음날 (1시부터 11시까지)
    for (let i = 1; i <= 11; i++) {
      options.push({ value: `next_${i}`, label: `다음날 ${i}시` });
    }
    
    return options;
  }, [formData.startTime]);

  // 캘린더 날짜 생성
  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    const days: Date[] = [];
    
    // 이전 달의 날짜들
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push(prevDate);
    }
    
    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    // 다음 달의 날짜들 (6주 * 7일 = 42일까지 채우기)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }
    
    return days;
  }, [currentMonth]);

  const calendarDays = generateCalendarDays();

  // 공간 목록 가져오기
  const fetchSpaces = useCallback(async () => {
    try {
      setLoadingSpaces(true);
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch('/api/reservations/spaces', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSpaces(data.spaces || []);
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
    } finally {
      setLoadingSpaces(false);
    }
  }, [getAccessToken]);

  // 예약 정보 가져오기
  const fetchReservation = useCallback(async () => {
    if (!reservationId) {
      router.back();
      return;
    }

    try {
      setLoadingReservation(true);
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const reservation: Reservation = data.reservation;
        
        // 날짜 및 시간 파싱
        const startDate = new Date(reservation.start_datetime);
        const endDate = new Date(reservation.end_datetime);
        
        // 다음날 종료 시간 확인
        const isNextDay = endDate.getDate() !== startDate.getDate();
        const endTimeValue = isNextDay ? `next_${endDate.getHours()}` : endDate.getHours().toString();
        
        const formattedData: ReservationFormData = {
          space_id: reservation.space_id,
          space: reservation.space_name,
          date: startDate.toISOString().split('T')[0],
          displayDate: startDate.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric', 
            weekday: 'short' 
          }),
          startTime: startDate.getHours().toString(),
          endTime: endTimeValue,
          channel: getChannelDisplay(reservation.booking_channel),
          customerName: reservation.customer_name,
          phoneNumber: reservation.customer_phone || "",
          people: reservation.guest_count.toString(),
          memo: reservation.special_requirements || reservation.memo || ""
        };

        setFormData(formattedData);
        setOriginalData(formattedData);
      }
    } catch (error) {
      console.error('Error fetching reservation:', error);
    } finally {
      setLoadingReservation(false);
    }
  }, [reservationId, getAccessToken, router]);

  const getChannelDisplay = (channel: string) => {
    switch (channel) {
      case 'manual': return '직접입력';
      case 'phone': return '전화';
      case 'online': return '온라인';
      default: return channel || '전화';
    }
  };

  const getChannelValue = (display: string) => {
    if (display === "직접입력") {
      return "manual";
    }
    return display; // 다른 채널들은 그대로 저장
  };

  useEffect(() => {
    fetchSpaces();
    fetchReservation();
  }, [fetchSpaces, fetchReservation]);

  const handleBackClick = () => {
    router.back();
  };

  const handleInputChange = (field: keyof ReservationFormData, value: string | number) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // 시간 선택 시 자동 조정
      if (field === 'startTime') {
        const startHour = parseInt(value as string);
        // 종료 시간이 시작 시간보다 작거나 같으면 자동 조정
        const currentEndTime = prev.endTime;
        let endHour;
        let isEndNextDay = false;
        
        if (currentEndTime.startsWith('next_')) {
          endHour = parseInt(currentEndTime.replace('next_', ''));
          isEndNextDay = true;
        } else {
          endHour = parseInt(currentEndTime);
        }
        
        // 같은 날이고 종료 시간이 시작 시간보다 작거나 같으면 조정
        if (!isEndNextDay && endHour <= startHour) {
          updated.endTime = Math.min(startHour + 1, 24).toString();
        }
      }
      
      return updated;
    });
  };

  const handleDateClick = () => {
    setShowDateCalendar(!showDateCalendar);
  };

  const handleDateSelect = (date: Date) => {
    const displayDate = date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      weekday: 'short' 
    });
    
    handleInputChange('date', date.toISOString().split('T')[0]);
    handleInputChange('displayDate', displayDate);
    setShowDateCalendar(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const handleChannelClick = () => {
    setShowChannelModal(true);
  };

  const handleChannelSelect = (channel: string) => {
    handleInputChange('channel', channel);
    setShowChannelModal(false);
  };

  const handleSubmit = async () => {
    if (!reservationId || !formData.space_id) {
      alert('필수 정보가 누락되었습니다.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = await getAccessToken();
      if (!token) return;

      // 시작 및 종료 datetime 생성
      const startDateTime = new Date(`${formData.date}T${formData.startTime.padStart(2, '0')}:00:00`);
      
      let endDateTime;
      if (formData.endTime.startsWith('next_')) {
        const nextDayHour = parseInt(formData.endTime.replace('next_', ''));
        const nextDate = new Date(formData.date);
        nextDate.setDate(nextDate.getDate() + 1);
        const nextDateStr = nextDate.toISOString().split('T')[0];
        endDateTime = new Date(`${nextDateStr}T${nextDayHour.toString().padStart(2, '0')}:00:00`);
      } else {
        const endHour = parseInt(formData.endTime);
        endDateTime = new Date(`${formData.date}T${endHour.toString().padStart(2, '0')}:00:00`);
      }

      const updateData = {
        space_id: formData.space_id,
        customer_name: formData.customerName,
        customer_phone: formData.phoneNumber,
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        guest_count: parseInt(formData.people),
        booking_channel: getChannelValue(formData.channel),
        special_requirements: formData.memo || null
      };

      console.log('Sending update data:', updateData);

      const response = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('Update response:', responseData);
        alert('예약이 수정되었습니다.');
        router.push(`/reservations/detail?id=${reservationId}`);
      } else {
        const errorData = await response.json();
        console.error('Update error:', errorData);
        alert(errorData.error || '예약 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('예약 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingReservation || loadingSpaces) {
    return (
      <RoleGuard allowedRoles={["USER"]}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">예약 정보를 불러오는 중...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button 
                onClick={handleBackClick}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-xl font-bold text-gray-900">
                예약 수정
              </h1>
            </div>
          </div>

          {/* 메인 컨텐츠 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-8">
              {/* 공간선택 - 수정 불가 */}
              <div>
                <label className="block text-gray-900 font-medium mb-3">
                  공간선택<span className="text-red-500">*</span>
                </label>
                <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                  {formData.space && (
                    <div className="flex items-center">
                      <div 
                        className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold mr-3"
                        style={{ backgroundColor: spaces.find(s => s.name === formData.space)?.icon_color || '#8BC34A' }}
                      >
                        {spaces.find(s => s.name === formData.space)?.icon_text || formData.space?.substring(0, 2)}
                      </div>
                      {formData.space}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  예약 수정 시 공간은 변경할 수 없습니다.
                </p>
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
                  <span className="text-blue-600 font-medium">{formData.displayDate}</span>
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
                          const today = new Date();
                          const isToday = day.toDateString() === today.toDateString();
                          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                          const isPastDate = day < today && !isToday;
                          const dayOfWeek = day.getDay();
                          
                          // 선택된 날짜 확인
                          const selectedDate = formData.date ? new Date(formData.date) : null;
                          const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();

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
                        <option key={i} value={(i + 1).toString()}>{i + 1}시</option>
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
                      {endTimeOptions().map((option, index) => (
                        <option key={index} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* 반복 일정 설정 */}
                <button
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
                  <span className={formData.channel ? "text-gray-900" : "text-gray-500"}>
                    {formData.channel || "예약 채널을 선택하세요"}
                  </span>
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
                    placeholder="10 명"
                    className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-gray-900 font-medium mb-3">메모</label>
                <textarea
                  value={formData.memo}
                  onChange={(e) => handleInputChange("memo", e.target.value)}
                  placeholder="※ 이 예약은 샘플 예약입니다

Tip) 하단의 수정하기를 누르고 휴대폰 번호에 '호스트님의 전화번호'를 입력한 후 메시지 보내기를 테스트해보세요. 샘플 템플릿을 선택해서 보내고 직접 받아보세요 :)"
                  rows={8}
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="mt-6">
            {hasChanges() ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full px-4 py-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? '수정 중...' : '수정 완료'}
              </button>
            ) : (
              <button
                onClick={handleBackClick}
                className="w-full px-4 py-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
            )}
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
                        channel === formData.channel ? 'text-blue-600 bg-blue-50' : 'text-gray-900'
                      }`}
                    >
                      <span>{channel}</span>
                      {channel === formData.channel && (
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