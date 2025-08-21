import { Package } from "@/types/targetMarketing";

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus_credits?: number;
  is_popular?: boolean;
  discount_rate?: number;
  description?: string;
  features?: string[];
}

export interface GetCreditPackagesResponse {
  packages: CreditPackage[];
}

export interface PurchaseCreditPackageRequest {
  packageId: string;
  paymentMethod?: string;
}

export interface PurchaseCreditPackageResponse {
  success: boolean;
  message: string;
  transactionId?: string;
  redirectUrl?: string;
}

export interface CreditBalance {
  balance: number;
  totalEarned: number;
  totalSpent: number;
  lastUpdated: string;
}

/**
 * 크레딧 패키지 목록 조회 API 호출
 */
export const getCreditPackages = async (): Promise<GetCreditPackagesResponse> => {
  const response = await fetch("/api/credit-packages");
  
  if (!response.ok) {
    throw new Error("패키지 정보를 가져올 수 없습니다.");
  }

  const data = await response.json();
  return {
    packages: data.packages || [],
  };
};

/**
 * 권장 패키지 자동 선택
 * 필요한 크레딧보다 큰 패키지들 중에서 가장 작은 것을 반환
 */
export const getRecommendedPackage = async (
  requiredCredits: number
): Promise<CreditPackage | null> => {
  const { packages } = await getCreditPackages();
  
  if (packages.length === 0) {
    return null;
  }

  // 필요한 크레딧보다 큰 패키지들 중에서 가장 작은 것 찾기
  const suitablePackages = packages
    .filter((pkg) => pkg.credits >= requiredCredits)
    .sort((a, b) => a.credits - b.credits);

  return suitablePackages.length > 0 ? suitablePackages[0] : null;
};

/**
 * 크레딧 패키지를 Package 타입으로 변환
 */
export const convertToPackageType = (creditPackage: CreditPackage): Package => {
  return {
    id: creditPackage.id,
    name: creditPackage.name,
    credits: creditPackage.credits,
    price: creditPackage.price,
    bonus: creditPackage.bonus_credits || 0,
    isPopular: creditPackage.is_popular || false,
  };
};

/**
 * 크레딧 패키지 구매 API 호출
 */
export const purchaseCreditPackage = async (
  request: PurchaseCreditPackageRequest,
  token: string
): Promise<PurchaseCreditPackageResponse> => {
  const response = await fetch("/api/credit-packages/purchase", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "패키지 구매에 실패했습니다.");
  }

  const data = await response.json();
  return {
    success: data.success || false,
    message: data.message || "패키지 구매가 완료되었습니다.",
    transactionId: data.transactionId,
    redirectUrl: data.redirectUrl,
  };
};

/**
 * 사용자 크레딧 잔액 조회 API 호출
 */
export const getCreditBalance = async (token: string): Promise<CreditBalance> => {
  const response = await fetch("/api/user/credits", {
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
    throw new Error("크레딧 잔액을 가져오는데 실패했습니다.");
  }

  const data = await response.json();
  return {
    balance: data.balance || 0,
    totalEarned: data.totalEarned || 0,
    totalSpent: data.totalSpent || 0,
    lastUpdated: data.lastUpdated || new Date().toISOString(),
  };
};

/**
 * 크레딧 사용 내역 조회 API 호출
 */
export const getCreditHistory = async (
  token: string,
  page: number = 1,
  limit: number = 20
): Promise<{
  transactions: Array<{
    id: string;
    type: 'earn' | 'spend' | 'refund';
    amount: number;
    description: string;
    createdAt: string;
    relatedId?: string;
  }>;
  total: number;
  totalPages: number;
}> => {
  const response = await fetch(`/api/user/credits/history?page=${page}&limit=${limit}`, {
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
    throw new Error("크레딧 사용 내역을 가져오는데 실패했습니다.");
  }

  const data = await response.json();
  return {
    transactions: data.transactions || [],
    total: data.total || 0,
    totalPages: data.totalPages || 0,
  };
};
