"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Space {
  id: number;
  name: string;
  icon_text: string;
  icon_color: string;
}

interface Reservation {
  id: number;
  space_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  guest_count: number | null;
  amount: number | null;
  start_time: string;
  end_time: string;
  status: string;
  notes: string | null;
  spaces: Space;
}

interface CalendarInfo {
  title: string;
  reservation_description: string | null;
}

interface CalendarData {
  calendar: CalendarInfo;
  reservations: Reservation[];
}

export default function SharedCalendarPage() {
  const params = useParams();
  const token = params.token as string;

  const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchCalendarData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/shared/calendar/${token}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch calendar");
        }

        setCalendarData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchCalendarData();
  }, [token]);

  // 월별 캘린더 생성
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (number | null)[] = [];

    // 이전 달의 빈 칸
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // 현재 달의 날짜
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  // 특정 날짜의 예약 조회
  const getReservationsForDate = (day: number) => {
    if (!calendarData) return [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const targetDate = new Date(year, month, day);

    return calendarData.reservations.filter((reservation) => {
      const startTime = new Date(reservation.start_time);
      const endTime = new Date(reservation.end_time);

      const targetStart = new Date(targetDate);
      targetStart.setHours(0, 0, 0, 0);
      const targetEnd = new Date(targetDate);
      targetEnd.setHours(23, 59, 59, 999);

      return (
        (startTime >= targetStart && startTime <= targetEnd) ||
        (endTime >= targetStart && endTime <= targetEnd) ||
        (startTime <= targetStart && endTime >= targetEnd)
      );
    });
  };

  // 고객명 마스킹 처리 ("김**" 형식)
  const maskCustomerName = (name: string) => {
    if (!name || name === "비공개") return "비공개";
    if (name.length === 1) return name;
    return name.charAt(0) + "*".repeat(name.length - 1);
  };

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <div className="text-center py-12 text-lg text-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
        <div className="text-center py-12 text-red-600">
          <h2 className="text-2xl font-bold mb-4">오류 발생</h2>
          <p className="text-lg">{error}</p>
        </div>
      </div>
    );
  }

  if (!calendarData) {
    return null;
  }

  const calendarDays = getCalendarDays();
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {calendarData.calendar.title}
        </h1>
        {calendarData.calendar.reservation_description && (
          <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 max-w-2xl mx-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {calendarData.calendar.reservation_description}
            </p>
          </div>
        )}
      </div>

      {/* 캘린더 컨트롤 */}
      <div className="flex justify-between items-center mb-6 px-4">
        <button
          onClick={() => changeMonth(-1)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          ◀ 이전 달
        </button>
        <h2 className="text-2xl font-semibold text-gray-900">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h2>
        <button
          onClick={() => changeMonth(1)}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
        >
          다음 달 ▶
        </button>
      </div>

      {/* 캘린더 */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`text-center font-semibold py-2 text-sm ${
                index === 0
                  ? "text-red-600"
                  : index === 6
                  ? "text-blue-600"
                  : "text-gray-700"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => {
            const dayReservations = day ? getReservationsForDate(day) : [];
            const isWeekend = index % 7 === 0 || index % 7 === 6;

            // 과거 날짜 판단
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const cellDate = day ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
            const isPast = cellDate ? cellDate < today : false;

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 rounded-lg border transition-all ${
                  !day
                    ? "bg-gray-100 border-gray-200"
                    : isPast
                    ? "bg-gray-200 border-gray-300"
                    : isWeekend
                    ? "bg-gray-50 border-gray-300 hover:bg-gray-100"
                    : "bg-white border-gray-300 hover:bg-gray-50"
                }`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-semibold mb-2 ${isPast ? "text-gray-400" : "text-gray-900"}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayReservations.map((reservation) => (
                        <div
                          key={reservation.id}
                          className="px-2 py-1 rounded text-white text-xs overflow-hidden"
                          style={{
                            backgroundColor: reservation.spaces.icon_color || "#8BC34A",
                          }}
                        >
                          <div className="font-semibold truncate">
                            {reservation.spaces.name}
                          </div>
                          <div className="text-xs opacity-90 truncate">
                            {maskCustomerName(reservation.customer_name)}
                          </div>
                          {reservation.guest_count && (
                            <div className="text-xs opacity-90">
                              {reservation.guest_count}명
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 안내 문구 */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>• 예약자명은 &apos;김**&apos; 형식으로 별 앞글자만 표기됩니다.</p>
        <p>• 과거 날짜의 예약 정보는 표시되지 않습니다.</p>
      </div>
    </div>
  );
}
