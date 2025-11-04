/**
 * 메시지 변수 치환 유틸리티
 * 메시지 내용의 변수를 실제 값으로 치환합니다.
 *
 * 표준 변수 형식: #{변수명}
 * 예시: #{이름}, #{전화번호}, #{오늘날짜}
 */

interface RecipientData {
  name?: string;
  phone: string;
  groupName?: string;
}

interface UserData {
  phone: string;
  name: string;
  companyName: string;
}

/**
 * 표준 변수 패턴 (#{변수명} 형식)
 */
export const VARIABLE_PATTERN = /#{[^}]+}/g;

/**
 * 메시지 내 변수 개수 계산
 * @param text 메시지 내용
 * @returns 변수 개수
 */
export function countVariables(text: string): number {
  const matches = text.match(VARIABLE_PATTERN);
  return matches ? matches.length : 0;
}

/**
 * 메시지에서 변수 목록 추출
 * @param text 메시지 내용
 * @returns 변수명 배열 (중복 제거)
 */
export function extractVariables(text: string): string[] {
  const matches = text.match(VARIABLE_PATTERN);
  if (!matches) return [];

  // #{변수명}에서 변수명만 추출하고 중복 제거
  const variables = matches.map(match => match.slice(2, -1));
  return [...new Set(variables)];
}

/**
 * 변수 사용 여부 확인
 * @param text 메시지 내용
 * @returns 변수 포함 여부
 */
export function hasVariables(text: string): boolean {
  return VARIABLE_PATTERN.test(text);
}

/**
 * 구 형식(#[변수명])을 신 형식(#{변수명})으로 변환
 * @param text 메시지 내용
 * @returns 변환된 메시지 내용
 */
export function migrateVariableFormat(text: string): string {
  return text.replace(/#\[([^\]]+)\]/g, '#{$1}');
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 시간을 HH:MM 형식으로 포맷
 */
export function formatTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * 요일을 한글로 반환
 */
export function getDayOfWeek(date: Date): string {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

/**
 * 메시지 내용의 모든 변수를 치환 (신 형식 #{변수명})
 * @param content 원본 메시지 내용
 * @param recipient 수신자 정보
 * @param userData 발신자(사용자) 정보
 * @returns 변수가 치환된 메시지 내용
 */
export function replaceVariables(
  content: string,
  recipient: RecipientData,
  userData: UserData
): string {
  let replaced = content;

  // 수신자 정보 치환
  replaced = replaced.replace(/#{이름}/g, recipient.name || '고객님');
  replaced = replaced.replace(/#{전화번호}/g, recipient.phone);
  replaced = replaced.replace(/#{그룹명}/g, recipient.groupName || '');

  // 날짜/시간 치환 (발송 시점 기준)
  const now = new Date();
  replaced = replaced.replace(/#{오늘날짜}/g, formatDate(now));
  replaced = replaced.replace(/#{현재시간}/g, formatTime(now));
  replaced = replaced.replace(/#{요일}/g, getDayOfWeek(now));

  // 발신자 정보 치환 (사용자의 실제 정보)
  replaced = replaced.replace(/#{발신번호}/g, userData.phone);
  replaced = replaced.replace(/#{회사명}/g, userData.companyName);
  replaced = replaced.replace(/#{담당자명}/g, userData.name);

  return replaced;
}

/**
 * 메시지에 치환되지 않은 변수가 있는지 확인 (신 형식)
 * @param content 메시지 내용
 * @returns 치환되지 않은 변수 목록
 */
export function getUnreplacedVariables(content: string): string[] {
  const matches = content.matchAll(VARIABLE_PATTERN);
  const unreplaced: string[] = [];

  for (const match of matches) {
    unreplaced.push(match[0]);
  }

  return [...new Set(unreplaced)]; // 중복 제거
}

/**
 * 메시지 미리보기 생성 (첫 번째 수신자 기준 샘플)
 * @param content 원본 메시지 내용
 * @param sampleRecipient 샘플 수신자 정보
 * @param userData 발신자 정보
 * @returns 미리보기 메시지
 */
export function generatePreview(
  content: string,
  sampleRecipient: RecipientData,
  userData: UserData
): string {
  return replaceVariables(content, sampleRecipient, userData);
}
