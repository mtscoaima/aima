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
 * 지원하는 변수명 alias 매핑
 * 여러 이름으로 같은 변수를 참조할 수 있도록 함
 */
export const VARIABLE_ALIASES: Record<string, string[]> = {
  '이름': ['이름', '고객명', '성함', '받는사람', '수신자명'],
  '전화번호': ['전화번호', '휴대폰', '연락처', '핸드폰'],
  '그룹명': ['그룹명', '그룹', '단체명'],
  '오늘날짜': ['오늘날짜', '날짜', '오늘', 'today', '발송일'],
  '현재시간': ['현재시간', '시간', '지금', '발송시간'],
  '요일': ['요일', '오늘요일'],
  '발신번호': ['발신번호', '발신전화번호', '보내는번호'],
  '회사명': ['회사명', '업체명', '상호', '기업명'],
  '담당자명': ['담당자명', '담당자', '상담원', '직원명'],
};

/**
 * 지원 가능한 모든 표준 변수명 (기본 키)
 */
export const STANDARD_VARIABLES = Object.keys(VARIABLE_ALIASES);

/**
 * 변수명이 표준 변수인지 확인 (alias 포함)
 * @param variableName 변수명 (#{} 없이)
 * @returns 표준 변수 여부
 */
export function isStandardVariable(variableName: string): boolean {
  return STANDARD_VARIABLES.some(standardVar =>
    VARIABLE_ALIASES[standardVar].includes(variableName)
  );
}

/**
 * 메시지 내 변수 개수 계산 (모든 #{} 패턴)
 * @param text 메시지 내용
 * @returns 변수 개수
 */
export function countVariables(text: string): number {
  const matches = text.match(VARIABLE_PATTERN);
  return matches ? matches.length : 0;
}

/**
 * 실제 치환 가능한 표준 변수 개수 계산
 * @param text 메시지 내용
 * @param customVariables 커스텀 변수 목록 (선택)
 * @returns 치환 가능한 변수 개수
 */
export function countReplaceableVariables(text: string, customVariables?: string[]): number {
  const variables = extractVariables(text);
  const customVarSet = new Set(customVariables || []);

  return variables.filter(varName =>
    isStandardVariable(varName) || customVarSet.has(varName)
  ).length;
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
 * alias를 포함한 모든 표준 변수를 지원
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

  // 날짜/시간 값 미리 계산
  const now = new Date();
  const dateValue = formatDate(now);
  const timeValue = formatTime(now);
  const dayValue = getDayOfWeek(now);

  // 수신자 이름 치환 (다양한 alias 지원)
  VARIABLE_ALIASES['이름'].forEach(alias => {
    const pattern = new RegExp(`#{${alias}}`, 'g');
    replaced = replaced.replace(pattern, recipient.name || '고객님');
  });

  // 전화번호 치환
  VARIABLE_ALIASES['전화번호'].forEach(alias => {
    const pattern = new RegExp(`#{${alias}}`, 'g');
    replaced = replaced.replace(pattern, recipient.phone);
  });

  // 그룹명 치환
  VARIABLE_ALIASES['그룹명'].forEach(alias => {
    const pattern = new RegExp(`#{${alias}}`, 'g');
    replaced = replaced.replace(pattern, recipient.groupName || '');
  });

  // 오늘날짜 치환
  VARIABLE_ALIASES['오늘날짜'].forEach(alias => {
    const pattern = new RegExp(`#{${alias}}`, 'g');
    replaced = replaced.replace(pattern, dateValue);
  });

  // 현재시간 치환
  VARIABLE_ALIASES['현재시간'].forEach(alias => {
    const pattern = new RegExp(`#{${alias}}`, 'g');
    replaced = replaced.replace(pattern, timeValue);
  });

  // 요일 치환
  VARIABLE_ALIASES['요일'].forEach(alias => {
    const pattern = new RegExp(`#{${alias}}`, 'g');
    replaced = replaced.replace(pattern, dayValue);
  });

  // 발신번호 치환
  VARIABLE_ALIASES['발신번호'].forEach(alias => {
    const pattern = new RegExp(`#{${alias}}`, 'g');
    replaced = replaced.replace(pattern, userData.phone);
  });

  // 회사명 치환
  VARIABLE_ALIASES['회사명'].forEach(alias => {
    const pattern = new RegExp(`#{${alias}}`, 'g');
    replaced = replaced.replace(pattern, userData.companyName);
  });

  // 담당자명 치환
  VARIABLE_ALIASES['담당자명'].forEach(alias => {
    const pattern = new RegExp(`#{${alias}}`, 'g');
    replaced = replaced.replace(pattern, userData.name);
  });

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
