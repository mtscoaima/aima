"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import * as Tooltip from '@radix-ui/react-tooltip';
import ReservationTooltip from '@/components/ReservationTooltip';


export interface Space {
  id: number;
  name: string;
  icon_text: string;
  icon_color: string;
}

export interface Reservation {
  id: number;
  user_id: number;
  space_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  start_datetime: string;
  end_datetime: string;
  guest_count: number;
  total_amount: number;
  deposit_amount: number;
  special_requirements?: string;
  booking_type: string;
  status: string;
  payment_status: string;
  booking_channel: string;
  created_at: string;
  updated_at: string;
  spaces?: Space;
}

export type ViewSettings = {
  spaces: { [key: string]: boolean };
  sortBy: string;
  displayInfo: { [key: string]: boolean };
  options: { [key: string]: boolean };
};

export default function ReservationCalendarPage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [statsMonth, setStatsMonth] = useState(new Date());
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [viewSettings, setViewSettings] = useState<ViewSettings>({
    spaces: {},
    sortBy: "시간순",
    displayInfo: { 시간: true, 예약자명: true, 총금액: false, 예약채널: false, 메모: false },
    options: { 입실날짜만예약표시하기: true }
  });

  // viewSettings 저장/불러오기 함수
  const saveViewSettings = useCallback((settings: ViewSettings) => {
    try {
      localStorage.setItem('reservationCalendarViewSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving view settings:', error);
    }
  }, []);

  const loadViewSettings = useCallback((): ViewSettings | null => {
    try {
      const saved = localStorage.getItem('reservationCalendarViewSettings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading view settings:', error);
    }
    return null;
  }, []);

  // 공휴일 데이터 가져오기
  const fetchHolidays = useCallback(async (year: number) => {
    try {
      const response = await fetch(`/api/holidays?year=${year}`);
      const data = await response.json();

      if (data.success && data.holidays) {
        setHolidays(data.holidays);
      }
    } catch (error) {
      console.error('Error fetching holidays:', error);
      // 에러 시 빈 배열 유지
      setHolidays([]);
    }
  }, []);

  // 공간 목록 가져오기
  const fetchSpaces = useCallback(async () => {
    try {
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
        const spacesList = data.spaces || [];
        setSpaces(spacesList);

        // 공간 목록으로 viewSettings 초기화
        const spacesSettings: { [key: string]: boolean } = {};
        spacesList.forEach((space: Space) => {
          spacesSettings[space.name] = true;
        });
        setViewSettings(prev => ({ ...prev, spaces: spacesSettings }));
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
    }
  }, [getAccessToken]); // getAccessToken 의존성 제거

  // 예약 목록 가져오기
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAccessToken();
      if (!token) {
        setError('인증이 필요합니다.');
        return;
      }

      // 현재 월의 시작과 끝 날짜 계산 (로컬 시간대 기준)
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const firstDay = 1;
      const lastDay = new Date(year, month, 0).getDate(); // 해당 월의 마지막 날

      const params = new URLSearchParams({
        start_date: `${year}-${month.toString().padStart(2, '0')}-${firstDay.toString().padStart(2, '0')}`,
        end_date: `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`
      });

      const response = await fetch(`/api/reservations/bookings?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('예약 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err instanceof Error ? err.message : '예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, getAccessToken]);

  // 예약의 날짜 위치 정보 계산 (시작/중간/끝)
  const getReservationDatePosition = (reservation: Reservation, currentDate: Date) => {
    // ISO 문자열에서 날짜 부분만 추출 (UTC 파싱 문제 방지)
    const startDateStr = reservation.start_datetime.split('T')[0]; // YYYY-MM-DD
    const endDateStr = reservation.end_datetime.split('T')[0];

    // 현재 날짜를 YYYY-MM-DD 형식으로 변환
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const currentDateStr = `${year}-${month}-${day}`;

    const isStart = currentDateStr === startDateStr;
    const isEnd = currentDateStr === endDateStr;
    const isMiddle = currentDateStr > startDateStr && currentDateStr < endDateStr;

    return {
      isStart,
      isEnd,
      isMiddle,
      isSingleDay: isStart && isEnd
    };
  };

  // 특정 날짜의 예약 찾기
  const getReservationsForDate = (date: Date) => {
    // 캘린더 날짜를 YYYY-MM-DD 형식으로 변환 (로컬 시간 기준)
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const filteredReservations = reservations.filter(reservation => {
      // ISO 문자열을 로컬 시간대로 파싱 (UTC 문제 방지)
      // "2025-10-27T18:00:00" 형식을 로컬 시간대 기준으로 해석
      const startDateTimeStr = reservation.start_datetime.replace('Z', ''); // Z 제거 (있다면)
      const endDateTimeStr = reservation.end_datetime.replace('Z', '');

      // 날짜 부분만 추출 (시간 부분 무시)
      const startDateStr = startDateTimeStr.split('T')[0]; // YYYY-MM-DD
      const endDateStr = endDateTimeStr.split('T')[0]; // YYYY-MM-DD

      // 입실 날짜만 표시하기 옵션이 켜져 있으면 시작 날짜만 확인
      if (viewSettings.options.입실날짜만예약표시하기) {
        return startDateStr === dateStr;
      }

      // 그렇지 않으면 예약 기간에 포함되는지 확인 (퇴실 시간이 다음날이면 다음날까지 표시)
      return startDateStr <= dateStr && endDateStr >= dateStr;
    }).filter(reservation => {
      // 선택된 공간만 표시
      return viewSettings.spaces[reservation.spaces?.name || ''] !== false;
    }).sort((a, b) => {
      // 정렬 옵션에 따라 정렬
      if (viewSettings.sortBy === "시간순") {
        // 시작 시간 기준으로 오름차순 정렬 (문자열 비교로 충분)
        return a.start_datetime.localeCompare(b.start_datetime);
      } else if (viewSettings.sortBy === "공간순") {
        // 공간명 기준으로 정렬
        const spaceA = a.spaces?.name || '';
        const spaceB = b.spaces?.name || '';
        return spaceA.localeCompare(spaceB);
      }
      return 0;
    });

    return filteredReservations;
  };

  // 예약 시간 포맷팅
  const formatReservationTime = (reservation: Reservation) => {
    // ISO 문자열에서 시간 추출 (UTC 파싱 문제 방지)
    // "2025-10-27T18:00:00" -> ["18", "00"]
    const startTimePart = reservation.start_datetime.split('T')[1] || '00:00:00';
    const endTimePart = reservation.end_datetime.split('T')[1] || '00:00:00';

    const [startHour, startMin] = startTimePart.split(':').map(Number);
    const [endHour, endMin] = endTimePart.split(':').map(Number);

    const formatTime = (hour: number, min: number) => {
      if (min === 0) return `${hour}`;
      return `${hour}:${min.toString().padStart(2, '0')}`;
    };

    return `${formatTime(startHour, startMin)}~${formatTime(endHour, endMin)}`;
  };

  // 법정공휴일 여부 확인
  const isHoliday = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return holidays.includes(dateStr);
  };

  // 날짜 클릭 시 예약 생성 페이지로 이동
  const handleDateClick = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    router.push(`/messages/reservations/create?date=${dateStr}`);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  // 데이터 로딩
  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]); // 빈 의존성 배열로 한 번만 실행

  useEffect(() => {
    fetchReservations();
  }, [currentMonth, fetchReservations]); // currentMonth 변경 시에만 실행

  // 공휴일 데이터 로딩 (년도가 변경될 때마다)
  useEffect(() => {
    const year = currentMonth.getFullYear();
    fetchHolidays(year);
  }, [currentMonth, fetchHolidays]);

  // viewSettings 복원 (공간 목록 로드 후)
  useEffect(() => {
    if (spaces.length > 0) {
      const savedSettings = loadViewSettings();
      if (savedSettings) {
        // 공간 설정 병합 (새 공간은 true로, 삭제된 공간은 제거)
        const mergedSpaces: { [key: string]: boolean } = {};
        spaces.forEach(space => {
          if (savedSettings.spaces[space.name] !== undefined) {
            mergedSpaces[space.name] = savedSettings.spaces[space.name];
          } else {
            mergedSpaces[space.name] = true; // 새 공간은 기본 체크
          }
        });
        
        setViewSettings({
          ...savedSettings,
          spaces: mergedSpaces
        });
      }
    }
  }, [spaces, loadViewSettings]);

  const handleShareCalendar = () => {
    router.push('/messages/reservations/calendar/shared');
  };

  const handleShowStats = () => {
    router.push('/messages/reservations/statistics');
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
    router.push('/messages/reservations/create');
  };

  const handleViewSettings = () => {
    setShowViewModal(true);
  };

  const handleCloseViewModal = () => {
    saveViewSettings(viewSettings); // 설정 저장
    setShowViewModal(false);
  };

  const handleViewSettingChange = (category: string, key: string, value: boolean | string) => {
    setViewSettings(prev => {
      if (category === 'sortBy') {
        return { ...prev, sortBy: value as string };
      }
      
      const categoryData = prev[category as keyof typeof prev];
      if (typeof categoryData === 'object' && categoryData !== null) {
        return {
          ...prev,
          [category]: {
            ...categoryData,
            [key]: value
          }
        };
      }
      
      return prev;
    });
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
  const monthNames = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <Tooltip.Provider delayDuration={300}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
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
              <button 
                onClick={() => router.push('/messages/reservations/list')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="리스트 보기"
              >
                <svg className="w-9 h-9 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                const dayReservations = isCurrentMonth ? getReservationsForDate(day) : [];
                const hasReservation = dayReservations.length > 0;

                return (
                  <div
                    key={index}
                    className={`min-h-[140px] p-2 border-r border-b border-gray-100 ${
                      !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
                    } ${isCurrentMonth ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                    onClick={() => isCurrentMonth && handleDateClick(day)}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      !isCurrentMonth ? 'text-gray-400' :
                      dayOfWeek === 0 || isHoliday(day) ? 'text-red-500' :
                      dayOfWeek === 6 ? 'text-blue-500' :
                      isToday ? 'text-blue-600 bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center' :
                      'text-gray-900'
                    }`}>
                      {day.getDate()}
                    </div>
                    
                    {hasReservation && (
                      <div className="space-y-1">
                        {dayReservations.slice(0, 2).map((reservation) => {
                          const timeStr = formatReservationTime(reservation);
                          const displayParts = [];
                          const position = getReservationDatePosition(reservation, day);
                          
                          // 시간 표시 로직 - 시작일과 끝일에만 시간 표시
                          if (viewSettings.displayInfo.시간) {
                            if (position.isSingleDay) {
                              displayParts.push(timeStr); // 하루 예약은 전체 시간
                            } else if (position.isStart) {
                              // ISO 문자열에서 시간 추출 (UTC 파싱 문제 방지)
                              const startTimePart = reservation.start_datetime.split('T')[1] || '00:00:00';
                              const startHour = parseInt(startTimePart.split(':')[0]);
                              displayParts.push(`${startHour}시~`); // 시작일은 시작 시간만
                            } else if (position.isEnd) {
                              // ISO 문자열에서 시간 추출 (UTC 파싱 문제 방지)
                              const endTimePart = reservation.end_datetime.split('T')[1] || '00:00:00';
                              const endHour = parseInt(endTimePart.split(':')[0]);
                              displayParts.push(`~${endHour}시`); // 끝일은 끝 시간만
                            }
                            // 중간일은 시간 표시 안함
                          }
                          
                          if (viewSettings.displayInfo.예약자명) displayParts.push(reservation.customer_name);
                          if (viewSettings.displayInfo.총금액 && reservation.total_amount > 0) {
                            displayParts.push(`${reservation.total_amount.toLocaleString()}원`);
                          }
                          if (viewSettings.displayInfo.예약채널) {
                            let channelDisplay = '';
                            switch (reservation.booking_channel) {
                              case 'manual':
                                channelDisplay = '[직접입력]';
                                break;
                              case '선택안함':
                                channelDisplay = '[직접입력]';
                                break;
                              default:
                                channelDisplay = `[${reservation.booking_channel}]`;
                                break;
                            }
                            displayParts.push(channelDisplay);
                          }
                          if (viewSettings.displayInfo.메모 && reservation.special_requirements) {
                            displayParts.push(reservation.special_requirements);
                          }
                          
                          // 연결된 예약 스타일 적용
                          let borderRadius = 'rounded-md';
                          if (!position.isSingleDay) {
                            if (position.isStart) {
                              borderRadius = 'rounded-l-md rounded-r-none'; // 시작: 왼쪽만 둥글게
                            } else if (position.isMiddle) {
                              borderRadius = 'rounded-none'; // 중간: 직각
                            } else if (position.isEnd) {
                              borderRadius = 'rounded-l-none rounded-r-md'; // 끝: 오른쪽만 둥글게
                            }
                          }
                          
                          return (
                            <ReservationTooltip
                              key={reservation.id}
                              reservation={reservation}
                              viewSettings={viewSettings}
                              timeStr={timeStr}
                            >
                              <div
                                className={`text-sm px-2.5 py-2 ${borderRadius} cursor-pointer hover:scale-[1.01] hover:shadow-sm transition-all ${
                                  reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                  reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation(); // 날짜 클릭 이벤트 전파 방지
                                  router.push(`/messages/reservations/detail?id=${reservation.id}`);
                                }}
                              >
                                {/* 공간 아이콘 + 예약 정보 (자동 줄바꿈) */}
                                <div className="flex items-start space-x-1.5">
                                  {/* 공간 아이콘 */}
                                  <div
                                    className="min-w-[28px] h-5 rounded-sm flex items-center justify-center text-white font-bold text-xs flex-shrink-0 px-1"
                                    style={{ backgroundColor: reservation.spaces?.icon_color || '#8BC34A' }}
                                  >
                                    {reservation.spaces?.icon_text || reservation.spaces?.name?.substring(0, 1) || '공'}
                                  </div>
                                  
                                  {/* 예약 정보 텍스트 (최대 2줄) */}
                                  <span className="text-sm line-clamp-2 break-words leading-snug">
                                    {displayParts.join(', ')}
                                  </span>
                                </div>
                              </div>
                            </ReservationTooltip>
                          );
                        })}
                        {dayReservations.length > 2 && (
                          <div className="text-xs text-gray-500 px-2">
                            +{dayReservations.length - 2}개 더
                          </div>
                        )}
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
                      <h4 className="text-gray-900 font-medium mb-4">공간 선택</h4>
                      <div className="space-y-3">
                        {spaces.map((space) => (
                          <div key={space.id} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`space-${space.id}`}
                              checked={viewSettings.spaces[space.name] !== false}
                              onChange={(e) => handleViewSettingChange('spaces', space.name, e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex items-center space-x-2">
                              <span 
                                className="px-2 py-1 text-white text-xs rounded font-medium"
                                style={{ backgroundColor: space.icon_color }}
                              >
                                {space.icon_text}
                              </span>
                              <span className="text-gray-700">{space.name}</span>
                            </div>
                          </div>
                        ))}
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
                          { key: '예약채널', label: '예약채널' },
                          { key: '메모', label: '메모' }
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
                      {spaces.map((space) => (
                        <option key={space.id} value={space.id}>{space.name}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* 통계 데이터 */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {(() => {
                      const monthReservations = reservations.filter(res => {
                        const resDate = new Date(res.start_datetime);
                        return resDate.getMonth() === statsMonth.getMonth() && 
                               resDate.getFullYear() === statsMonth.getFullYear();
                      });
                      const totalRevenue = monthReservations.reduce((sum, res) => sum + res.total_amount, 0);
                      const totalGuests = monthReservations.reduce((sum, res) => sum + res.guest_count, 0);
                      
                      return (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">• 총 매출</span>
                            <span className="font-semibold text-gray-900">{totalRevenue.toLocaleString()}원</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">• 총 예약 건수</span>
                            <span className="font-semibold text-gray-900">{monthReservations.length}건</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">• 총 이용 인원</span>
                            <span className="font-semibold text-gray-900">{totalGuests}명</span>
                          </div>
                        </>
                      );
                    })()}
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
      </Tooltip.Provider>
    </RoleGuard>
  );
}
