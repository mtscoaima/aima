/**
 * 예약 메시지 템플릿 변수 치환 유틸리티
 *
 * 지원 변수:
 * - {{고객명}} → customer_name
 * - {{공간명}} → space.name
 * - {{예약날짜}} → start_datetime (YYYY-MM-DD)
 * - {{체크인시간}} → start_datetime (HH:mm)
 * - {{체크아웃시간}} → end_datetime (HH:mm)
 * - {{인원수}} → guest_count
 * - {{총금액}} → total_amount (원 단위, 콤마 포함)
 * - {{입금액}} → deposit_amount (원 단위, 콤마 포함)
 * - {{잔금}} → (total_amount - deposit_amount)
 * - {{전화번호}} → space.host_contact_number (호스트 회신 번호)
 * - {{특이사항}} → special_requirements
 */

// 예약 데이터 타입 (공간 정보 포함)
export interface ReservationWithSpace {
  id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  start_datetime: string; // ISO 8601 형식
  end_datetime: string;
  guest_count?: number;
  total_amount?: number;
  deposit_amount?: number;
  special_requirements?: string;
  space?: {
    id: number;
    name: string;
    host_contact_number?: string;
  };
}

/**
 * 날짜 포맷팅: YYYY-MM-DD
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 시간 포맷팅: HH:mm
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 숫자 포맷팅: 콤마 추가
 */
function formatNumber(num?: number): string {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('ko-KR');
}

/**
 * 전화번호 포맷팅: 010-1234-5678
 */
function formatPhoneNumber(phone: string): string {
  // 이미 하이픈이 있으면 그대로 반환
  if (phone.includes('-')) return phone;

  // 숫자만 추출
  const numbers = phone.replace(/[^0-9]/g, '');

  // 11자리 010 번호
  if (numbers.length === 11 && numbers.startsWith('010')) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
  }

  // 그 외는 원본 반환
  return phone;
}

/**
 * 템플릿 변수 치환
 *
 * @param template - 치환할 템플릿 문자열 (예: "안녕하세요 {{고객명}}님")
 * @param reservation - 예약 데이터 (공간 정보 포함)
 * @returns 변수가 치환된 메시지
 *
 * @example
 * const template = "{{고객명}}님, {{예약날짜}} {{체크인시간}}에 {{공간명}}에서 뵙겠습니다.";
 * const reservation = {
 *   customer_name: "홍길동",
 *   start_datetime: "2025-10-15T14:00:00Z",
 *   space: { name: "스튜디오 A" }
 * };
 * const result = replaceTemplateVariables(template, reservation);
 * // "홍길동님, 2025-10-15 14:00에 스튜디오 A에서 뵙겠습니다."
 */
export function replaceTemplateVariables(
  template: string,
  reservation: ReservationWithSpace
): string {
  let result = template;

  // 변수 매핑 및 치환
  const variables: Record<string, string> = {
    '{{고객명}}': reservation.customer_name || '',
    '{{공간명}}': reservation.space?.name || '',
    '{{예약날짜}}': formatDate(reservation.start_datetime),
    '{{체크인시간}}': formatTime(reservation.start_datetime),
    '{{체크아웃시간}}': formatTime(reservation.end_datetime),
    '{{인원수}}': reservation.guest_count ? String(reservation.guest_count) : '',
    '{{총금액}}': formatNumber(reservation.total_amount),
    '{{입금액}}': formatNumber(reservation.deposit_amount),
    '{{잔금}}': formatNumber(
      (reservation.total_amount || 0) - (reservation.deposit_amount || 0)
    ),
    '{{전화번호}}': formatPhoneNumber(reservation.space?.host_contact_number || reservation.customer_phone),
    '{{특이사항}}': reservation.special_requirements || '',
  };

  // 모든 변수 치환
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(key, 'g'), value);
  });

  return result;
}

/**
 * 템플릿에서 사용된 변수 목록 추출
 *
 * @param template - 템플릿 문자열
 * @returns 사용된 변수 배열
 *
 * @example
 * extractVariables("{{고객명}}님, {{예약날짜}}에 뵙겠습니다.")
 * // ["{{고객명}}", "{{예약날짜}}"]
 */
export function extractVariables(template: string): string[] {
  const regex = /\{\{[^}]+\}\}/g;
  const matches = template.match(regex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * 템플릿 유효성 검증
 * 지원하지 않는 변수가 있는지 확인
 *
 * @param template - 템플릿 문자열
 * @returns { valid: boolean, invalidVariables: string[] }
 */
export function validateTemplate(template: string): {
  valid: boolean;
  invalidVariables: string[];
} {
  const supportedVariables = [
    '{{고객명}}',
    '{{공간명}}',
    '{{예약날짜}}',
    '{{체크인시간}}',
    '{{체크아웃시간}}',
    '{{인원수}}',
    '{{총금액}}',
    '{{입금액}}',
    '{{잔금}}',
    '{{전화번호}}',
    '{{특이사항}}',
  ];

  const usedVariables = extractVariables(template);
  const invalidVariables = usedVariables.filter(
    (v) => !supportedVariables.includes(v)
  );

  return {
    valid: invalidVariables.length === 0,
    invalidVariables,
  };
}

/**
 * 샘플 데이터로 템플릿 미리보기 생성
 * UI에서 템플릿 작성 시 미리보기 표시용
 *
 * @param template - 템플릿 문자열
 * @returns 샘플 데이터로 치환된 메시지
 */
export function previewTemplate(template: string): string {
  const sampleReservation: ReservationWithSpace = {
    id: 1,
    customer_name: '홍길동',
    customer_phone: '010-1234-5678',
    customer_email: 'hong@example.com',
    start_datetime: '2025-10-15T14:00:00+09:00',
    end_datetime: '2025-10-15T18:00:00+09:00',
    guest_count: 4,
    total_amount: 100000,
    deposit_amount: 30000,
    special_requirements: '주차 필요',
    space: {
      id: 1,
      name: '스튜디오 A',
      host_contact_number: '010-9876-5432',
    },
  };

  return replaceTemplateVariables(template, sampleReservation);
}

/**
 * 메시지 바이트 수 계산 (한글 기준)
 * SMS: 90바이트 이하
 * LMS: 90바이트 초과 2000바이트 이하
 *
 * @param message - 메시지 내용
 * @returns 바이트 수
 */
export function calculateMessageBytes(message: string): number {
  let bytes = 0;
  for (let i = 0; i < message.length; i++) {
    const charCode = message.charCodeAt(i);
    if (charCode <= 0x7f) {
      // ASCII 문자
      bytes += 1;
    } else if (charCode <= 0x7ff) {
      // 2바이트 문자
      bytes += 2;
    } else {
      // 한글 등 3바이트 문자
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * 메시지 타입 자동 결정
 *
 * @param message - 메시지 내용
 * @returns 'SMS' | 'LMS'
 */
export function determineMessageType(message: string): 'SMS' | 'LMS' {
  const bytes = calculateMessageBytes(message);
  return bytes <= 90 ? 'SMS' : 'LMS';
}
