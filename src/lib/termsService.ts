// 약관 관련 타입 정의
export type TermType = 'SERVICE_TERMS' | 'PRIVACY_POLICY' | 'MARKETING_CONSENT';

export interface TermsData {
  id: number;
  term_type: TermType;
  title: string;
  content: string;
  version: string;
  description: string | null;
  is_active: boolean;
  required: boolean;
  created_at: string;
  updated_at: string;
}

export interface TermsResponse {
  success: boolean;
  data?: TermsData;
  error?: string;
}

export interface MultipleTermsResponse {
  success: boolean;
  data?: TermsData[];
  error?: string;
}

// 약관 타입별 한글 매핑
export const TERM_TYPE_LABELS: Record<TermType, string> = {
  SERVICE_TERMS: '서비스 이용약관',
  PRIVACY_POLICY: '개인정보처리방침',
  MARKETING_CONSENT: '마케팅 정보 수집 및 활용 동의서'
};

// 약관 타입별 URL 매핑
export const TERM_TYPE_URLS: Record<TermType, string> = {
  SERVICE_TERMS: '/terms',
  PRIVACY_POLICY: '/privacy',
  MARKETING_CONSENT: '/marketing'
};

/**
 * 특정 약관 조회
 */
export async function getTermsContent(type: TermType): Promise<TermsData> {
  try {
    // 강력한 캐시 무효화를 위한 무작위 쿼리 파라미터
    const cacheBuster = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const response = await fetch(`/api/terms?type=${type}&_cb=${cacheBuster}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      // 캐싱 완전 비활성화
      cache: 'no-store'
    });

    const result: TermsResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `약관 조회에 실패했습니다 (${response.status})`);
    }

    if (!result.data) {
      throw new Error('약관 데이터가 없습니다.');
    }

    return result.data;
  } catch (error) {
    console.error(`약관 조회 실패 (${type}):`, error);
    throw error instanceof Error ? error : new Error('약관 조회 중 오류가 발생했습니다.');
  }
}

/**
 * 여러 약관 한번에 조회
 */
export async function getMultipleTermsContent(types: TermType[]): Promise<TermsData[]> {
  try {
    const response = await fetch(`/api/terms?_t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({ types }),
      // 캐싱 비활성화
      cache: 'no-store'
    });

    const result: MultipleTermsResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `약관 조회에 실패했습니다 (${response.status})`);
    }

    return result.data || [];
  } catch (error) {
    console.error('다중 약관 조회 실패:', error);
    throw error instanceof Error ? error : new Error('약관 조회 중 오류가 발생했습니다.');
  }
}

/**
 * 모든 활성 약관 조회
 */
export async function getAllActiveTerms(): Promise<TermsData[]> {
  try {
    const response = await fetch(`/api/terms?_t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({}),
      // 캐싱 비활성화
      cache: 'no-store'
    });

    const result: MultipleTermsResponse = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `약관 조회에 실패했습니다 (${response.status})`);
    }

    return result.data || [];
  } catch (error) {
    console.error('전체 약관 조회 실패:', error);
    throw error instanceof Error ? error : new Error('약관 조회 중 오류가 발생했습니다.');
  }
}

/**
 * 약관 타입을 URL 경로로 변환
 */
export function getTermsUrl(type: TermType): string {
  return TERM_TYPE_URLS[type];
}

/**
 * 약관 타입을 한글 라벨로 변환
 */
export function getTermsLabel(type: TermType): string {
  return TERM_TYPE_LABELS[type];
}

/**
 * URL 경로를 약관 타입으로 변환
 */
export function getTermTypeFromUrl(pathname: string): TermType | null {
  switch (pathname) {
    case '/terms':
      return 'SERVICE_TERMS';
    case '/privacy':
      return 'PRIVACY_POLICY';
    case '/marketing':
      return 'MARKETING_CONSENT';
    default:
      return null;
  }
}