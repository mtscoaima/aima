"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// 트랜잭션 타입 정의
export type TransactionType = "charge" | "usage" | "refund";

// 트랜잭션 데이터 타입
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // 양수: 증가, 음수: 감소
  balance: number; // 트랜잭션 후 잔액
  timestamp: string;
  description: string;
  referenceId?: string; // 관련 작업 ID (캠페인 ID, 결제 ID 등)
  metadata?: Record<string, string | number | boolean>; // 추가 정보
}

// 잔액 데이터 타입 (pointBalance 제거)
interface BalanceData {
  balance: number;
  lastChargeDate: string;
  lastChargeAmount: number;
  paymentMethod: string;
  transactions: Transaction[]; // 트랜잭션 히스토리
}

// 컨텍스트 타입
interface BalanceContextType {
  balanceData: BalanceData;
  setBalanceData: React.Dispatch<React.SetStateAction<BalanceData>>;
  updateBalance: (newBalance: number) => void;
  formatCurrency: (amount: number) => string;
  addTransaction: (
    type: TransactionType,
    amount: number,
    description: string,
    referenceId?: string,
    metadata?: Record<string, string | number | boolean>
  ) => void;
  calculateBalance: () => number;
  getTransactionHistory: () => Transaction[];
}

// 컨텍스트 생성
const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

// 기본 잔액 데이터 (포인트 관련 제거)
const defaultBalanceData: BalanceData = {
  balance: 0, // 트랜잭션 기반으로 계산되므로 초기값은 0
  lastChargeDate: "2025-05-10 15:32:45",
  lastChargeAmount: 30000,
  paymentMethod: "card",
  transactions: [
    // 초기 더미 데이터 - 시간순으로 정렬하고 balance를 누적 계산
    {
      id: "tx_003",
      type: "charge",
      amount: 20000,
      balance: 20000, // 첫 번째: 0 + 20000 = 20000
      timestamp: "2025-04-05 11:21:33.789",
      description: "계좌이체 충전",
      referenceId: "payment_002",
      metadata: { paymentMethod: "bank", bankName: "신한은행" },
    },
    {
      id: "tx_001",
      type: "charge",
      amount: 30000,
      balance: 50000, // 두 번째: 20000 + 30000 = 50000
      timestamp: "2025-05-10 15:32:45.123",
      description: "신용카드 충전",
      referenceId: "payment_001",
      metadata: { paymentMethod: "card", cardLast4: "1234" },
    },
    {
      id: "tx_006",
      type: "usage",
      amount: -2000,
      balance: 48000, // 세 번째: 50000 - 2000 = 48000
      timestamp: "2025-05-12 14:25:33.678",
      description: "타겟마케팅 캠페인 실행",
      referenceId: "campaign_002",
      metadata: { campaignId: "1234", targetCount: 1000 },
    },
    {
      id: "tx_005",
      type: "usage",
      amount: -500,
      balance: 47500, // 네 번째: 48000 - 500 = 47500
      timestamp: "2025-05-15 10:12:23.345",
      description: "SMS 발송 (5건)",
      referenceId: "campaign_001",
      metadata: { messageCount: 50, messageType: "SMS" },
    },
  ],
};

// 고유 ID 생성 함수
const generateTransactionId = (): string => {
  return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
        const parsed = JSON.parse(savedBalance);
        // 트랜잭션이 없는 기존 데이터 호환성 처리
        if (!parsed.transactions) {
          parsed.transactions = defaultBalanceData.transactions;
        }
        // 트랜잭션 기반으로 잔액 재계산
        const calculatedBalance = parsed.transactions.reduce(
          (total: number, transaction: Transaction) => {
            return total + transaction.amount;
          },
          0
        );
        parsed.balance = calculatedBalance;
        setBalanceData(parsed);
      } catch (error) {
        console.error("Failed to parse balance data:", error);
      }
    } else {
      // 초기 로드 시에도 트랜잭션 기반으로 잔액 계산
      const calculatedBalance = defaultBalanceData.transactions.reduce(
        (total, transaction) => {
          return total + transaction.amount;
        },
        0
      );
      setBalanceData({
        ...defaultBalanceData,
        balance: calculatedBalance,
      });
    }
  }, []);

  // 잔액 데이터 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem("balanceData", JSON.stringify(balanceData));
  }, [balanceData]);

  // 트랜잭션 기반 잔액 계산
  const calculateBalance = (): number => {
    return balanceData.transactions.reduce((total, transaction) => {
      return total + transaction.amount;
    }, 0);
  };

  // 트랜잭션 추가 함수
  const addTransaction = (
    type: TransactionType,
    amount: number,
    description: string,
    referenceId?: string,
    metadata?: Record<string, string | number | boolean>
  ) => {
    // 입력 검증
    if (typeof amount !== "number" || isNaN(amount)) {
      throw new Error("유효하지 않은 금액입니다.");
    }

    if (amount === 0) {
      throw new Error("금액은 0이 될 수 없습니다.");
    }

    // 사용 타입인 경우 음수로 변환
    const transactionAmount =
      type === "usage" ? -Math.abs(amount) : Math.abs(amount);

    // 현재 잔액 계산
    const currentBalance = calculateBalance();
    const newBalance = currentBalance + transactionAmount;

    // 잔액 부족 검증 (사용 시에만)
    if (type === "usage" && newBalance < 0) {
      throw new Error("잔액이 부족합니다.");
    }

    const newTransaction: Transaction = {
      id: generateTransactionId(),
      type,
      amount: transactionAmount,
      balance: newBalance,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 23),
      description,
      referenceId,
      metadata,
    };

    setBalanceData((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTransaction].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
      balance: newBalance,
      lastChargeDate:
        type === "charge" ? newTransaction.timestamp : prev.lastChargeDate,
      lastChargeAmount:
        type === "charge" ? Math.abs(transactionAmount) : prev.lastChargeAmount,
    }));
  };

  // 트랜잭션 히스토리 조회
  const getTransactionHistory = (): Transaction[] => {
    return [...balanceData.transactions].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  };

  // 잔액 업데이트 함수 (기존 호환성 유지)
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
    addTransaction,
    calculateBalance,
    getTransactionHistory,
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
