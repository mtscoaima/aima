export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isImageLoading?: boolean;
  isQuestion?: boolean;
  attachedFile?: {
    name: string;
    size: number;
    type: string;
    previewUrl?: string | null;
  };
}

export interface GeneratedTemplate {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
  status: "생성완료" | "전송준비" | "전송완료";
}

export interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus: number;
  isPopular?: boolean;
}

export interface DynamicButton {
  id: string;
  text: string;
  linkType: 'web';
  url?: string;        // 웹링크용
}

export interface TargetMarketingDetailProps {
  templateId?: number | null;
  useTemplate?: boolean;
  initialMessage?: string;
  initialImage?: string | null;
  shouldRestore?: boolean;
}

// 위치 관련 새로운 인터페이스
export interface LocationDistrict {
  district: string;
  dongs: string[];
}

export interface LocationDetail {
  city: string;
  districts: LocationDistrict[];
}

// 단순한 위치 구조 (city, district, dong)
export interface SimpleLocation {
  city: string;
  district: string;
  dong: string;
}

// 기존 구조와 새 구조를 모두 지원하는 union 타입
export type LocationDetailCompatible = LocationDetail | { city: string; districts: string[] } | SimpleLocation | string;

export interface Campaign {
  id: string | number;
  name: string;
  status?: string;
  approval_status?: string;
  message_templates?: {
    name?: string;
    content?: string;
    image_url?: string;
    category?: string;
  };
  // 새로운 개별 컬럼들
  target_age_groups?: string[];
  target_locations_detailed?: LocationDetailCompatible[];
  card_amount_max?: number;
  card_time_start?: string;
  card_time_end?: string;
  target_industry_top_level?: string;
  target_industry_specific?: string;
  unit_cost?: number;
  estimated_total_cost?: number;
  expert_review_requested?: boolean;
  expert_review_notes?: string;
  buttons?: DynamicButton[];
  gender_ratio?: {
    female: number;
    male: number;
  };
  desired_recipients?: string;

  // 예산 관련 필드들 (새로운 로직)
  budget?: number;  // 캠페인 전체 예산 (DB의 기존 budget 필드 사용)
  campaign_budget?: number;  // 캠페인 예산 (DB에 추가된 campaign_budget 필드)
  daily_ad_spend_limit?: number;  // 일 최대 광고비 제한
}

export interface Template {
  id: string | number;
  name: string;
  image_url?: string;
  content?: string;
  category?: string;
  template_code?: string;
  usage_count?: number;
  created_at: string;
  updated_at?: string;
  is_private?: boolean;
  is_owner?: boolean;
  user_id?: string | number;
  buttons?: DynamicButton[];
}

// AI 구조화 추천 섹션 타입
export interface StructuredRecommendationSection {
  section: string;
  items: string[];
}

// 타입 가드 함수들
export function isNewLocationStructure(location: unknown): location is LocationDetail {
  if (location === null || typeof location !== 'object' || !location) {
    return false;
  }

  const loc = location as Record<string, unknown>;

  return 'city' in loc &&
         typeof loc.city === 'string' &&
         'districts' in loc &&
         Array.isArray(loc.districts) &&
         loc.districts.length > 0 &&
         typeof loc.districts[0] === 'object' &&
         loc.districts[0] !== null &&
         'district' in (loc.districts[0] as Record<string, unknown>) &&
         'dongs' in (loc.districts[0] as Record<string, unknown>);
}

export function isOldLocationStructure(location: unknown): location is { city: string; districts: string[] } {
  if (location === null || typeof location !== 'object' || !location) {
    return false;
  }

  const loc = location as Record<string, unknown>;

  return 'city' in loc &&
         typeof loc.city === 'string' &&
         'districts' in loc &&
         Array.isArray(loc.districts) &&
         loc.districts.length > 0 &&
         typeof loc.districts[0] === 'string';
}

export function isSimpleLocationStructure(location: unknown): location is SimpleLocation {
  if (location === null || typeof location !== 'object' || !location) {
    return false;
  }

  const loc = location as Record<string, unknown>;

  return 'city' in loc &&
         'district' in loc &&
         'dong' in loc &&
         typeof loc.city === 'string' &&
         typeof loc.district === 'string' &&
         typeof loc.dong === 'string';
}

// 데이터 변환 함수들
export function convertToNewLocationStructure(oldLocation: { city: string; districts: string[] }): LocationDetail {
  return {
    city: oldLocation.city,
    districts: oldLocation.districts.map(district => ({
      district,
      dongs: ['all'] // 기존 데이터는 동 정보가 없으므로 'all'
    }))
  };
}

export function convertToOldLocationStructure(newLocation: LocationDetail): { city: string; districts: string[] } {
  return {
    city: newLocation.city,
    districts: newLocation.districts.map(d => d.district)
  };
}
