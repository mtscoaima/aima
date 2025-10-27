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

export default function CreateReservationPage() {
  const { getAccessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [priceData, setPriceData] = useState<{amount: string, notes: string} | null>(null);

  // URL에서 날짜 파라미터 가져오기
  const dateParam = searchParams.get('date');
  const initialDate = dateParam || new Date().toISOString().split('T')[0];

  // 날짜 형식 변환 함수
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} (${days[date.getDay()]})`;
  };

  const [formData, setFormData] = useState<ReservationFormData>({
    space_id: null,
    space: "",
    date: initialDate,
    displayDate: formatDisplayDate(initialDate),
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
  const [currentMonth, setCurrentMonth] = useState(new Date()); // 현재 날짜

  const handleInputChange = (field: keyof ReservationFormData, value: string | number) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      // 공간 선택 시 space_id도 함께 업데이트
      if (field === 'space' && typeof value === 'string') {
        const selectedSpace = spaces.find(s => s.name === value);
        if (selectedSpace) {
          updated.space_id = selectedSpace.id;
        }
      }
      
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
      
      if (field === 'endTime') {
        const endValue = value as string;
        const startHour = parseInt(prev.startTime);
        
        if (endValue.startsWith('next_')) {
          // 다음날 시간은 항상 유효함
        } else {
          const endHour = parseInt(endValue);
          // 같은 날에서 종료 시간이 시작 시간보다 작거나 같으면 시작 시간 조정
          if (endHour <= startHour) {
            updated.startTime = Math.max(endHour - 1, 1).toString();
          }
        }
      }
      
      return updated;
    });
  };

  const handleAdvancedSettings = () => {
    // 반복 일정 설정 (UI만 구현)
  };

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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 첫 번째 공간을 기본값으로 설정 (별도 useEffect)
  useEffect(() => {
    if (spaces.length > 0 && !formData.space_id) {
      const firstSpace = spaces[0];
      setFormData(prev => ({
        ...prev,
        space_id: firstSpace.id,
        space: firstSpace.name
      }));
    }
  }, [spaces, formData.space_id]);

  // 예약 생성
  const handleSubmit = async () => {
    // 기본 유효성 검사
    if (!formData.space_id) {
      alert('공간을 선택해주세요.');
      return;
    }

    if (!formData.customerName.trim()) {
      alert('고객 이름을 입력해주세요.');
      return;
    }

    if (!formData.phoneNumber.trim()) {
      alert('전화번호를 입력해주세요.');
      return;
    }

    // 시간 유효성 검사 (다음날 고려)
    const startHour = parseInt(formData.startTime);
    let endHour;
    let isEndNextDay = false;
    
    if (formData.endTime.startsWith('next_')) {
      endHour = parseInt(formData.endTime.replace('next_', ''));
      isEndNextDay = true;
    } else {
      endHour = parseInt(formData.endTime);
    }
    
    // 같은 날에서만 시간 비교
    if (!isEndNextDay && endHour <= startHour) {
      alert('종료 시간이 시작 시간보다 늦어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('인증이 필요합니다. 로그인을 다시 시도해주세요.');
        return;
      }

      // 날짜와 시간을 ISO 문자열로 변환
      const startDateTime = new Date(`${formData.date}T${formData.startTime.padStart(2, '0')}:00:00`);
      
      // 종료 시간 처리 (다음날 고려)
      let endDateTime;
      if (formData.endTime.startsWith('next_')) {
        const nextDayHour = parseInt(formData.endTime.replace('next_', ''));
        const nextDate = new Date(formData.date);
        nextDate.setDate(nextDate.getDate() + 1); // 다음날로 설정
        const nextDateStr = nextDate.toISOString().split('T')[0]; // YYYY-MM-DD
        endDateTime = new Date(`${nextDateStr}T${nextDayHour.toString().padStart(2, '0')}:00:00`);
      } else {
        const endHour = parseInt(formData.endTime);
        endDateTime = new Date(`${formData.date}T${endHour.toString().padStart(2, '0')}:00:00`);
      }

      const reservationData = {
        space_id: formData.space_id,
        customer_name: formData.customerName.trim(),
        customer_phone: formData.phoneNumber.trim(),
        customer_email: null, // 이메일 필드가 없으므로 null
        start_datetime: startDateTime.toISOString(),
        end_datetime: endDateTime.toISOString(),
        guest_count: parseInt(formData.people) || 1,
        total_amount: priceData?.amount ? parseInt(priceData.amount) : 0,
        deposit_amount: 0, // 기본값
        special_requirements: formData.memo.trim() || null,
        booking_type: 'hourly',
        booking_channel: formData.channel === "직접입력" ? "manual" : formData.channel
      };

      const response = await fetch('/api/reservations/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          alert('선택한 시간에 이미 예약이 있습니다. 다른 시간을 선택해주세요.');
        } else {
          throw new Error(errorData.error || '예약 생성에 실패했습니다.');
        }
        return;
      }

      await response.json();
      
      // 예약 생성 성공 시 sessionStorage 정리
      sessionStorage.removeItem('reservationPrice');
      sessionStorage.removeItem('reservationFormData');
      
      alert('예약이 성공적으로 생성되었습니다!');
      router.push('/messages/reservations/list');
      
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert(error instanceof Error ? error.message : '예약 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // 페이지 로드 시 sessionStorage에서 금액 정보와 폼 데이터 불러오기
  useEffect(() => {
    // 금액 정보 복원
    const savedPriceData = sessionStorage.getItem('reservationPrice');
    if (savedPriceData) {
      try {
        const parsed = JSON.parse(savedPriceData);
        setPriceData(parsed);
      } catch (error) {
        console.error('Error parsing price data:', error);
      }
    }

    // 폼 데이터 복원
    const savedFormData = sessionStorage.getItem('reservationFormData');
    if (savedFormData) {
      try {
        const parsed = JSON.parse(savedFormData);
        // 타임스탬프가 30분 이내인 경우에만 복원 (유효성 체크)
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - parsed.timestamp < thirtyMinutes) {
          // timestamp 제거 후 폼 데이터 설정
          const { ...formDataWithoutTimestamp } = parsed;
          setFormData(formDataWithoutTimestamp);
        } else {
          // 만료된 데이터 삭제
          sessionStorage.removeItem('reservationFormData');
        }
      } catch (error) {
        console.error('Error parsing form data:', error);
        sessionStorage.removeItem('reservationFormData');
      }
    }
  }, []);

  const handleDateClick = () => {
    setShowDateCalendar(!showDateCalendar);
  };

  const handleChannelClick = () => {
    setShowChannelModal(true);
  };

  const handleDateSelect = (date: Date) => {
    // 오늘 이전 날짜는 선택 불가
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return;
    }
    
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const isoDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const displayDate = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()} (${days[date.getDay()]})`;
    
    setFormData(prev => ({
      ...prev,
      date: isoDate,
      displayDate: displayDate
    }));
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

  // 종료 시간 옵션 생성
  const generateEndTimeOptions = () => {
    const options = [];
    
    // 당일 1시~24시
    for (let i = 1; i <= 24; i++) {
      options.push({
        value: i.toString(),
        label: `${i}시`,
        isNextDay: false
      });
    }
    
    // 다음날 1시~11시
    for (let i = 1; i <= 11; i++) {
      options.push({
        value: `next_${i}`,
        label: `다음날 ${i}시`,
        isNextDay: true
      });
    }
    
    return options;
  };

  const endTimeOptions = generateEndTimeOptions();

  // 예약채널 목록
  const channels = [
    "아워플레이스",
    "스페이스클라우드",
    "여기어때",
    "웨이닛",
    "빌리오",
    "카카오 채널",
    "네이버 예약",
    "전화",
    "인스타그램",
    "홈페이지",
    "직접입력"
  ];

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
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
                  {loadingSpaces ? (
                    <option value="">공간 로딩 중...</option>
                  ) : spaces.length === 0 ? (
                    <option value="">등록된 공간이 없습니다</option>
                  ) : (
                    spaces.map((space) => (
                      <option key={space.id} value={space.name}>
                        {space.name}
                      </option>
                    ))
                  )}
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
                    {endTimeOptions.map((option, index) => (
                      <option key={index} value={option.value}>
                        {option.label}
                      </option>
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
                  placeholder="인원을 입력하세요."
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 금액 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">금액</h3>

              <div>
                <label className="block text-gray-900 font-medium mb-3">총 금액</label>
                <input
                  type="number"
                  value={priceData?.amount || ''}
                  onChange={(e) => setPriceData({ amount: e.target.value, notes: priceData?.notes || '' })}
                  placeholder="금액을 입력하세요 (원)"
                  className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {priceData?.notes && (
                <div className="text-sm text-gray-600">
                  {priceData.notes}
                </div>
              )}
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
                disabled={
                  isSubmitting ||
                  !formData.space_id ||
                  !formData.customerName.trim() ||
                  !formData.phoneNumber.trim() ||
                  !formData.people.trim() ||
                  !formData.channel
                }
                className={`w-full py-4 px-4 rounded-lg font-medium transition-colors text-lg ${
                  isSubmitting ||
                  !formData.space_id ||
                  !formData.customerName.trim() ||
                  !formData.phoneNumber.trim() ||
                  !formData.people.trim() ||
                  !formData.channel
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    예약 생성 중...
                  </div>
                ) : (
                  '예약 추가하기'
                )}
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