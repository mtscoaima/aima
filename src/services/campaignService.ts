import { Campaign, DynamicButton } from "@/types/targetMarketing";

export interface CampaignTargetFilters {
  gender: string;
  ageGroup: string[];
  location: {
    city: string;
    district: string;
  };
  industry: {
    topLevel: string;
    specific: string;
  };
  cardAmount: string;
  cardTime: {
    startTime: string;
    endTime: string;
  };
}

export interface CreateCampaignRequest {
  title: string;
  content: string;
  imageUrl?: string | null;
  sendPolicy: "realtime" | "batch";
  validityStartDate?: string | null;
  validityEndDate?: string | null;
  scheduledSendDate?: string | null;
  scheduledSendTime?: string | null;
  maxRecipients: string;
  existingTemplateId?: string | null;
  // 새로운 데이터베이스 컬럼들
  targetAgeGroups: string[];
  targetLocationsDetailed?: Array<{ city: string; districts: string[] } | string>;
  cardAmountMax?: number | null;
  cardTimeStart?: string | null;
  cardTimeEnd?: string | null;
  targetIndustryTopLevel?: string | null;
  targetIndustrySpecific?: string | null;
  unitCost?: number;
  estimatedTotalCost?: number;
  expertReviewRequested?: boolean;
  expertReviewNotes?: string | null;
  buttons?: DynamicButton[];
  genderRatio?: {
    female: number;
    male: number;
  };
  desiredRecipients?: string | null;
  estimatedCost: number;
  templateDescription: string;
}

export interface CreateCampaignResponse {
  success: boolean;
  message: string;
  campaignId?: string;
}

export interface GetCampaignsResponse {
  campaigns: Campaign[];
}

/**
 * 캠페인 생성 API 호출 (승인 신청)
 */
export const createCampaign = async (
  request: CreateCampaignRequest,
  token: string
): Promise<CreateCampaignResponse> => {
  const response = await fetch("/api/campaigns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "캠페인 저장에 실패했습니다.");
  }

  const result = await response.json();
  return {
    success: result.success || false,
    message: result.message || "캠페인이 성공적으로 생성되었습니다.",
    campaignId: result.campaignId,
  };
};

/**
 * 캠페인 목록 조회 API 호출 (승인 완료된 캠페인만)
 */
export const getCampaigns = async (token: string): Promise<GetCampaignsResponse> => {
  const response = await fetch("/api/campaigns", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    throw new Error(`캠페인을 불러오는데 실패했습니다. (${response.status})`);
  }

  const data = await response.json();
  
  // 승인 완료된 캠페인만 필터링
  const approvedCampaigns = (data.campaigns || []).filter(
    (campaign: Campaign) => 
      campaign.status === "APPROVED" ||
      campaign.approval_status === "APPROVED"
  );

  return {
    campaigns: approvedCampaigns,
  };
};

/**
 * 특정 캠페인 조회 API 호출
 */
export const getCampaign = async (
  campaignId: string,
  token: string
): Promise<Campaign> => {
  const response = await fetch(`/api/campaigns/${campaignId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    if (response.status === 404) {
      throw new Error("캠페인을 찾을 수 없습니다.");
    }
    throw new Error(`캠페인을 불러오는데 실패했습니다. (${response.status})`);
  }

  const data = await response.json();
  return data.campaign;
};

/**
 * 캠페인 상태 업데이트 API 호출
 */
export const updateCampaignStatus = async (
  campaignId: string,
  status: "PENDING_APPROVAL" | "REVIEWING" | "APPROVED" | "REJECTED" | "ACTIVE" | "COMPLETED" | "PAUSED",
  token: string
): Promise<void> => {
  const response = await fetch(`/api/campaigns/${campaignId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    if (response.status === 403) {
      throw new Error("캠페인 상태 변경 권한이 없습니다.");
    }
    if (response.status === 404) {
      throw new Error("캠페인을 찾을 수 없습니다.");
    }
    throw new Error(`캠페인 상태 변경에 실패했습니다. (${response.status})`);
  }
};

/**
 * 캠페인 삭제 API 호출
 */
export const deleteCampaign = async (
  campaignId: string,
  token: string
): Promise<void> => {
  const response = await fetch(`/api/campaigns/${campaignId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    if (response.status === 403) {
      throw new Error("캠페인 삭제 권한이 없습니다.");
    }
    if (response.status === 404) {
      throw new Error("캠페인을 찾을 수 없습니다.");
    }
    throw new Error(`캠페인 삭제에 실패했습니다. (${response.status})`);
  }
};
