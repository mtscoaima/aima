/**
 * 날짜/시간 관련 유틸리티 함수들
 */

export type DatePeriod = "week" | "month" | "year";

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export const getTodayString = (): string => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

/**
 * 지정된 일수 후의 날짜를 YYYY-MM-DD 형식으로 반환
 */
export const getDateAfterDays = (days: number): string => {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  return futureDate.toISOString().split("T")[0];
};

/**
 * 일주일 후 날짜를 YYYY-MM-DD 형식으로 반환
 */
export const getDateAfterWeek = (): string => {
  return getDateAfterDays(7);
};

/**
 * 지정된 기간 후의 날짜를 계산하여 반환
 */
export const getDateAfterPeriod = (period: DatePeriod): string => {
  const today = new Date();
  let endDate: Date;

  switch (period) {
    case "week":
      endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case "month":
      endDate = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        today.getDate()
      );
      break;
    case "year":
      endDate = new Date(
        today.getFullYear() + 1,
        today.getMonth(),
        today.getDate()
      );
      break;
    default:
      endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return endDate.toISOString().split("T")[0];
};

/**
 * Date 객체를 YYYY-MM-DD 형식 문자열로 변환
 */
export const formatDateToString = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

/**
 * YYYY-MM-DD 문자열을 Date 객체로 변환
 */
export const parseStringToDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * 시간 문자열(HH:mm)에서 시간(hour) 부분을 숫자로 추출
 */
export const parseHourFromTimeString = (timeString: string): number => {
  return parseInt(timeString.split(":")[0]);
};

/**
 * 시간 문자열(HH:mm)에서 분(minute) 부분을 숫자로 추출
 */
export const parseMinuteFromTimeString = (timeString: string): number => {
  return parseInt(timeString.split(":")[1]);
};

/**
 * 시간(24시간 형식)을 HH:mm 형식으로 포맷팅
 */
export const formatTimeString = (hour: number, minute: number = 0): string => {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

/**
 * 시작 시간과 종료 시간의 유효성을 검증하고 필요시 종료 시간을 조정
 */
export const validateAndAdjustTimeRange = (
  startTime: string,
  endTime: string
): { startTime: string; endTime: string; isAdjusted: boolean } => {
  const startHour = parseHourFromTimeString(startTime);
  const endHour = parseHourFromTimeString(endTime);

  if (startHour >= endHour) {
    const newEndHour = Math.min(startHour + 1, 23);
    const adjustedEndTime = formatTimeString(newEndHour);
    
    return {
      startTime,
      endTime: adjustedEndTime,
      isAdjusted: true,
    };
  }

  return {
    startTime,
    endTime,
    isAdjusted: false,
  };
};

/**
 * 종료 시간 선택 시 시작 시간과의 유효성을 검증하고 필요시 시작 시간을 조정
 */
export const validateAndAdjustTimeRangeReverse = (
  startTime: string,
  endTime: string
): { startTime: string; endTime: string; isAdjusted: boolean } => {
  const startHour = parseHourFromTimeString(startTime);
  const endHour = parseHourFromTimeString(endTime);

  if (endHour <= startHour) {
    const newStartHour = Math.max(endHour - 1, 0);
    const adjustedStartTime = formatTimeString(newStartHour);
    
    return {
      startTime: adjustedStartTime,
      endTime,
      isAdjusted: true,
    };
  }

  return {
    startTime,
    endTime,
    isAdjusted: false,
  };
};

/**
 * 두 날짜 사이의 일수 계산
 */
export const getDaysBetweenDates = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * 현재 시간으로부터 지정된 분 전/후의 타임스탬프 반환
 */
export const getTimestampFromMinutes = (minutes: number): number => {
  return Date.now() + minutes * 60 * 1000;
};

/**
 * 타임스탬프가 지정된 시간(분) 이내인지 확인
 */
export const isWithinMinutes = (timestamp: number, minutes: number): boolean => {
  const now = Date.now();
  const timeDiff = now - timestamp;
  return timeDiff < minutes * 60 * 1000;
};

/**
 * 날짜 문자열이 유효한지 검증
 */
export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && !!dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};

/**
 * 시간 문자열이 유효한지 검증 (HH:mm 형식)
 */
export const isValidTimeString = (timeString: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};

/**
 * 현재 날짜와 시간을 포함한 고유 ID 생성용 타임스탬프 반환
 */
export const getCurrentTimestamp = (): number => {
  return Date.now();
};
