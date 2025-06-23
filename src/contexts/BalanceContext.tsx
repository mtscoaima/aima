"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { tokenManager } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

// 트랜잭션 타입 정의
export type TransactionType = "charge" | "usage" | "refund";

// 트랜잭션 데이터 타입
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number; // 양수: 증가, 음수: 감소
  balance: number; // 트랜잭션 후 잔액
  description: string;
  reference_id?: string; // 관련 작업 ID (캠페인 ID, 결제 ID 등)
  metadata?: Record<string, string | number | boolean>; // 추가 정보
  status: "pending" | "completed" | "failed";
  error_message?: string;
  created_at: string;
  updated_at: string;
  request_data?: Record<string, string | number | boolean>;
  response_data?: Record<string, string | number | boolean>;
  timestamp?: string; // 기존 호환성을 위해 유지
}

// 잔액 데이터 타입
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
  ) => Promise<void>;
  calculateBalance: () => number;
  getTransactionHistory: () => Transaction[];
  refreshTransactions: () => Promise<void>;
  isLoading: boolean;
}

// 컨텍스트 생성
const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

// 기본 잔액 데이터
const defaultBalanceData: BalanceData = {
  balance: 0,
  lastChargeDate: "",
  lastChargeAmount: 0,
  paymentMethod: "card",
  transactions: [],
};

// API 호출 함수들
const transactionAPI = {
  // 트랜잭션 목록 조회 (현재 로그인된 사용자만)
  async getTransactions(
    limit = 50,
    offset = 0
  ): Promise<{
    transactions: Transaction[];
    currentBalance: number;
    total: number;
  }> {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error("인증 토큰이 필요합니다.");
    }

    const response = await fetch(
      `/api/transactions?limit=${limit}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "트랜잭션 조회에 실패했습니다.");
    }

    return response.json();
  },

  // 새 트랜잭션 생성 (현재 로그인된 사용자만)
  async createTransaction(
    type: TransactionType,
    amount: number,
    description: string,
    reference_id?: string,
    metadata?: Record<string, string | number | boolean>
  ): Promise<{
    transaction: Transaction;
    newBalance: number;
  }> {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error("인증 토큰이 필요합니다.");
    }

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        amount,
        description,
        reference_id,
        metadata,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "트랜잭션 생성에 실패했습니다.");
    }

    return response.json();
  },
};

// Provider 컴포넌트
export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [balanceData, setBalanceData] =
    useState<BalanceData>(defaultBalanceData);
  const [isLoading, setIsLoading] = useState(false);

  // 트랜잭션 데이터를 서버에서 로드 (현재 로그인된 사용자만)
  const refreshTransactions = useCallback(async () => {
    // 로그인 상태 및 사용자 정보 확인
    if (!user || !tokenManager.isLoggedIn()) {
      // 로그인하지 않은 경우 데이터 초기화
      setBalanceData(defaultBalanceData);
      return;
    }

    setIsLoading(true);
    try {
      const data = await transactionAPI.getTransactions(100, 0); // 최근 100개 조회

      // 트랜잭션에 timestamp 필드 추가 (기존 호환성)
      const transactionsWithTimestamp = data.transactions.map(
        (transaction) => ({
          ...transaction,
          timestamp: transaction.created_at,
        })
      );

      // 최근 충전 정보 계산
      const lastChargeTransaction = transactionsWithTimestamp.find(
        (t) => t.type === "charge"
      );

      setBalanceData({
        balance: data.currentBalance,
        lastChargeDate: lastChargeTransaction
          ? new Date(lastChargeTransaction.created_at).toLocaleString("ko-KR")
          : "",
        lastChargeAmount: lastChargeTransaction
          ? Math.abs(lastChargeTransaction.amount)
          : 0,
        paymentMethod:
          (lastChargeTransaction?.metadata?.paymentMethod as string) || "card",
        transactions: transactionsWithTimestamp,
      });
    } catch (error) {
      console.error("트랜잭션 로드 오류:", error);
      // 에러 발생 시 기본값으로 초기화 (로그인 만료 등의 경우)
      if (error instanceof Error && error.message.includes("인증")) {
        setBalanceData(defaultBalanceData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // 사용자 변경 시 트랜잭션 데이터 새로고침
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        // 사용자가 로그인한 경우 트랜잭션 로드
        refreshTransactions();
      } else {
        // 사용자가 로그아웃한 경우 데이터 초기화
        setBalanceData(defaultBalanceData);
      }
    }
  }, [user, authLoading, refreshTransactions]);

  // 트랜잭션 기반 잔액 계산 (로컬 계산용)
  const calculateBalance = (): number => {
    return balanceData.balance;
  };

  // 트랜잭션 추가 함수 (서버와 동기화, 현재 로그인된 사용자만)
  const addTransaction = async (
    type: TransactionType,
    amount: number,
    description: string,
    referenceId?: string,
    metadata?: Record<string, string | number | boolean>
  ) => {
    // 로그인 상태 확인
    if (!user || !tokenManager.isLoggedIn()) {
      throw new Error("로그인이 필요합니다.");
    }

    // 입력 검증
    if (typeof amount !== "number" || isNaN(amount)) {
      throw new Error("유효하지 않은 금액입니다.");
    }

    if (amount === 0) {
      throw new Error("금액은 0이 될 수 없습니다.");
    }

    try {
      setIsLoading(true);

      // 서버에 트랜잭션 생성 요청 (JWT 토큰으로 사용자 식별)
      await transactionAPI.createTransaction(
        type,
        amount,
        description,
        referenceId,
        metadata
      );

      // 로컬 상태 업데이트를 위해 트랜잭션 목록 새로고침
      await refreshTransactions();
    } catch (error) {
      console.error("트랜잭션 추가 오류:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 트랜잭션 히스토리 조회 (현재 사용자의 것만)
  const getTransactionHistory = (): Transaction[] => {
    return [...balanceData.transactions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  // 잔액 업데이트 함수 (기존 호환성 유지 - 실제로는 서버에서 관리)
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
    refreshTransactions,
    isLoading,
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
