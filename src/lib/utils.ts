import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 한국 시간(KST) 관련 유틸리티 함수들
export function getKSTTime(): Date {
  const now = new Date();
  // UTC 시간에 9시간(한국 시간대) 추가
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kstTime;
}

export function getKSTISOString(): string {
  const kstTime = getKSTTime();
  return kstTime.toISOString();
}

export function formatKSTDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  // 한국 시간으로 변환하여 표시
  return dateObj.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatKSTDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  // 한국 시간으로 변환하여 날짜만 표시
  return dateObj.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
