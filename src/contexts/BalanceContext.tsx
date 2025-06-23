"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// 잔액 데이터 타입
interface BalanceData {
  balance: number;
  pointBalance: number;
  lastChargeDate: string;
  lastChargeAmount: number;
  paymentMethod: string;
}

// 컨텍스트 타입
interface BalanceContextType {
  balanceData: BalanceData;
  setBalanceData: (data: BalanceData) => void;
  updateBalance: (newBalance: number) => void;
  formatCurrency: (amount: number) => string;
}

// 컨텍스트 생성
const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

// 기본 잔액 데이터
const defaultBalanceData: BalanceData = {
  balance: 500000,
  pointBalance: 25000,
  lastChargeDate: "2025-05-10 15:32:45",
  lastChargeAmount: 300000,
  paymentMethod: "card",
};

// Provider 컴포넌트
export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const [balanceData, setBalanceData] =
    useState<BalanceData>(defaultBalanceData);

  // 로컬 스토리지에서 잔액 데이터 로드
  useEffect(() => {
    const savedBalance = localStorage.getItem("balanceData");
    if (savedBalance) {
      try {
        setBalanceData(JSON.parse(savedBalance));
      } catch (error) {
        console.error("Failed to parse balance data:", error);
      }
    }
  }, []);

  // 잔액 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("balanceData", JSON.stringify(balanceData));
  }, [balanceData]);

  // 잔액 업데이트 함수
  const updateBalance = (newBalance: number) => {
    setBalanceData((prev) => ({
      ...prev,
      balance: newBalance,
    }));
  };

  // 금액 포맷팅 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const value: BalanceContextType = {
    balanceData,
    setBalanceData,
    updateBalance,
    formatCurrency,
  };

  return (
    <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>
  );
}

// 커스텀 훅
export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
}
