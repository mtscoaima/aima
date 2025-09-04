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
  target_locations_detailed?: Array<{ city: string; districts: string[] } | string>;
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
  buttons?: DynamicButton[];
}

// AI 구조화 추천 섹션 타입
export interface StructuredRecommendationSection {
  section: string;
  items: string[];
}
