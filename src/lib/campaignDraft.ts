// Campaign Draft 저장/복원을 위한 유틸리티 함수들

export interface CampaignDraft {
  messages: string[];
  images: (string | null)[]; // File은 저장 불가하므로 URL/base64로 저장
  sendPolicy: {
    firstSendTime: string;
    sendCount: number;
    sendInterval: number;
    smsFailover: boolean;
    duplicateCheck: boolean;
    skipWeekend: boolean;
  };

  // ✅ 새로운 예산 로직
  campaignBudget?: number;  // 캠페인 예산
  dailyAdSpendLimit?: number;  // 일 최대 광고비 제한

  adRecipientCount: number;
  selectedTemplate?: {
    id: number;
    title: string;
    content: string;
    image_url?: string;
  };
  templateTitle: string;
  templateContent: string;
  templateImageUrl?: string;
  timestamp: number;
  userId: number;
}

const DRAFT_KEY_PREFIX = 'target_marketing_draft_';
const DRAFT_EXPIRY_HOURS = 24;

export const saveCampaignDraft = (draft: CampaignDraft): boolean => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${draft.userId}`;
    const draftData = {
      ...draft,
      timestamp: Date.now()
    };
    
    localStorage.setItem(key, JSON.stringify(draftData));
    return true;
  } catch (error) {
    console.error('캠페인 임시저장 실패:', error);
    return false;
  }
};

export const loadCampaignDraft = (userId: number): CampaignDraft | null => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${userId}`;
    const savedData = localStorage.getItem(key);
    
    if (!savedData) {
      return null;
    }
    
    const draft: CampaignDraft = JSON.parse(savedData);
    
    // 만료 확인
    if (isDraftExpired(draft.timestamp)) {
      clearCampaignDraft(userId);
      return null;
    }
    
    return draft;
  } catch (error) {
    console.error('캠페인 임시저장 데이터 로드 실패:', error);
    return null;
  }
};

export const clearCampaignDraft = (userId: number): void => {
  try {
    const key = `${DRAFT_KEY_PREFIX}${userId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('캠페인 임시저장 데이터 삭제 실패:', error);
  }
};

export const isDraftExpired = (timestamp: number): boolean => {
  const now = Date.now();
  const diffInHours = (now - timestamp) / (1000 * 60 * 60);
  return diffInHours > DRAFT_EXPIRY_HOURS;
};

export const formatDraftAge = (timestamp: number): string => {
  const now = Date.now();
  const diffInMinutes = Math.floor((now - timestamp) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}분 전`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}시간 전`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}일 전`;
};

// File을 base64로 변환하는 헬퍼 함수
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// base64를 File로 변환하는 헬퍼 함수
export const base64ToFile = (base64: string, filename: string): File => {
  const arr = base64.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
};