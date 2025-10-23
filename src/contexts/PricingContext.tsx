"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface PricingSetting {
  id: number;
  category: string;
  sub_category: string;
  condition_type: string;
  condition_value?: string;
  price: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PricingContextType {
  pricingSettings: PricingSetting[];
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
  getPriceByType: (conditionType: string) => number;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

export function PricingProvider({ children }: { children: React.ReactNode }) {
  const [pricingSettings, setPricingSettings] = useState<PricingSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/pricing-settings");

      if (!response.ok) {
        throw new Error("차등 단가 설정 로드 실패");
      }

      const data = await response.json();
      setPricingSettings(data.pricingSettings || []);
    } catch (error) {
      console.error("차등 단가 설정 로드 실패:", error);
      // 에러 시 기본값 설정
      setPricingSettings([
        { id: 1, category: "base", sub_category: "전체", condition_type: "기본단가", price: 100, is_active: true, created_at: "", updated_at: "" },
        { id: 2, category: "media", sub_category: "가맹점", condition_type: "위치", price: 20, is_active: true, created_at: "", updated_at: "" },
        { id: 3, category: "customer", sub_category: "고객", condition_type: "성별", price: 0, is_active: true, created_at: "", updated_at: "" },
        { id: 4, category: "customer", sub_category: "고객", condition_type: "나이", price: 20, is_active: true, created_at: "", updated_at: "" },
        { id: 5, category: "media", sub_category: "결제정보", condition_type: "결제금액", price: 0, is_active: true, created_at: "", updated_at: "" },
        { id: 6, category: "media", sub_category: "업태", condition_type: "업종", price: 20, is_active: true, created_at: "", updated_at: "" },
        { id: 7, category: "media", sub_category: "기타", condition_type: "결제이력", price: 20, is_active: true, created_at: "", updated_at: "" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getPriceByType = (conditionType: string): number => {
    const setting = pricingSettings.find(
      (s) => s.condition_type === conditionType && s.is_active
    );
    return setting?.price || 0;
  };

  return (
    <PricingContext.Provider
      value={{
        pricingSettings,
        isLoading,
        refreshSettings: fetchSettings,
        getPriceByType,
      }}
    >
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing() {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error("usePricing must be used within PricingProvider");
  }
  return context;
}
