export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isImageLoading?: boolean;
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
  linkType: 'web' | 'app';
  url?: string;        // 웹링크용
  iosUrl?: string;     // iOS 앱링크용
  androidUrl?: string; // Android 앱링크용
}

export interface TargetMarketingDetailProps {
  templateId?: number | null;
  useTemplate?: boolean;
  initialMessage?: string;
  initialImage?: string | null;
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
  target_criteria?: {
    gender?: string;
    age?: string[];
    city?: string;
    district?: string;
    industry?: {
      topLevel?: string;
      specific?: string;
    };
    cardAmount?: string;
    cardAmountInput?: string;
    cardTime?: {
      startTime?: string;
      endTime?: string;
    };
  };
  // 호환성을 위한 이전 필드들
  targetCriteria?: {
    gender?: string;
    age?: string[];
    city?: string;
    district?: string;
    industry?: {
      topLevel?: string;
      specific?: string;
    };
    cardAmount?: string;
    cardAmountInput?: string;
    cardTime?: {
      startTime?: string;
      endTime?: string;
    };
  };
}

export interface Template {
  id: string | number;
  name: string;
  image_url?: string;
  content?: string;
  category?: string;
  usage_count?: number;
  created_at: string;
  updated_at?: string;
  is_private?: boolean;
  is_owner?: boolean;
  buttons?: DynamicButton[];
}
