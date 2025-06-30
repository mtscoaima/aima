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

/**
 * 추천 코드 생성 함수
 * 사용자 ID + 랜덤 문자열 조합으로 고유한 추천 코드 생성
 */
export function generateReferralCode(userId: number): string {
  // 사용자 ID를 Base36으로 인코딩 (숫자와 소문자 알파벳)
  const userIdEncoded = userId.toString(36).toUpperCase();
  
  // 랜덤 문자열 생성 (6자리)
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // 현재 시간의 마지막 3자리를 추가하여 더 고유하게 만들기
  const timestamp = Date.now().toString().slice(-3);
  
  return `${userIdEncoded}${randomString}${timestamp}`;
}

/**
 * 추천 코드 유효성 검증 함수
 */
export function isValidReferralCode(code: string): boolean {
  // 추천 코드는 영문 대문자와 숫자만 포함, 길이는 8-15자
  const regex = /^[A-Z0-9]{8,15}$/;
  return regex.test(code);
}
