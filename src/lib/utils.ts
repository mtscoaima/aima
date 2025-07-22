import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 비밀번호 검증 함수들
export const passwordValidation = {
  // 허용되는 특수문자
  allowedSpecialChars: "~!@#$%^&*()_-=+[{]}'\"\\;:/?.>,<",

  // 비밀번호 조건 검증
  validatePassword: (password: string) => {
    const errors: string[] = [];

    // 길이 검증 (8~20자)
    if (password.length < 8) {
      errors.push("비밀번호는 최소 8자 이상이어야 합니다.");
    }
    if (password.length > 20) {
      errors.push("비밀번호는 최대 20자까지 입력 가능합니다.");
    }

    // 영문, 숫자, 특수기호 조합 검증
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = new RegExp(
      `[${passwordValidation.allowedSpecialChars.replace(/[[\]\\-]/g, "\\$&")}]`
    ).test(password);

    const typeCount = [
      hasUpperCase || hasLowerCase,
      hasNumbers,
      hasSpecialChar,
    ].filter(Boolean).length;
    if (typeCount < 3) {
      errors.push("영문, 숫자, 특수기호를 모두 포함해야 합니다.");
    }

    // 허용되지 않는 특수문자 검증
    const invalidSpecialChars = password.match(
      /[^a-zA-Z0-9~!@#$%^&*()_\-=+[{\]}'"\\;:/?.>,<]/g
    );
    if (invalidSpecialChars) {
      errors.push(
        `사용할 수 없는 문자가 포함되어 있습니다: ${[
          ...new Set(invalidSpecialChars),
        ].join(", ")}`
      );
    }

    // 동일한 문자 4개 이상 검증
    if (/(.)\1{3,}/.test(password)) {
      errors.push("동일한 문자가 4개 이상 연속으로 사용될 수 없습니다.");
    }

    // 연속된 문자 4개 이상 검증 (ASCII 코드 기준)
    for (let i = 0; i <= password.length - 4; i++) {
      const slice = password.slice(i, i + 4);
      let isConsecutive = true;

      for (let j = 1; j < slice.length; j++) {
        if (slice.charCodeAt(j) !== slice.charCodeAt(j - 1) + 1) {
          isConsecutive = false;
          break;
        }
      }

      if (isConsecutive) {
        errors.push("연속된 문자가 4개 이상 사용될 수 없습니다.");
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  },

  // 비밀번호 강도 계산 (기존 호환성 유지)
  getPasswordStrength: (password: string) => {
    if (!password) return { strength: 0, text: "", color: "" };

    const validation = passwordValidation.validatePassword(password);

    if (!validation.isValid) {
      return { strength: 1, text: "약함", color: "#ef4444" };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = new RegExp(
      `[${passwordValidation.allowedSpecialChars.replace(/[[\]\\-]/g, "\\$&")}]`
    ).test(password);

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;
    if (hasUpperCase) strength += 1;
    if (hasLowerCase) strength += 1;
    if (hasNumbers) strength += 1;
    if (hasSpecialChar) strength += 1;

    if (strength <= 3) return { strength: 1, text: "약함", color: "#ef4444" };
    if (strength <= 5) return { strength: 2, text: "보통", color: "#f59e0b" };
    return { strength: 3, text: "강함", color: "#10b981" };
  },

  // 허용되는 특수문자 목록을 사용자에게 표시할 때 사용
  getPasswordRules: () => [
    "8~20자의 영문, 숫자, 특수기호 조합",
    `사용 가능한 특수문자: ${passwordValidation.allowedSpecialChars}`,
    "동일한 문자, 연속된 문자가 4개 이상 입력된 경우 사용불가",
  ],
};

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
