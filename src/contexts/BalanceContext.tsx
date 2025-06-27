"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { tokenManager } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export type TransactionType = "charge" | "usage" | "refund" | "penalty";

export interface Transaction {
  id: string;
  user_id: number;
  type: TransactionType;
  amount: number;
  description: string;
  reference_id?: string;
  metadata?: Record<string, string | number | boolean>;
  status: "pending" | "completed" | "failed";
  error_message?: string;
  created_at: string;
  updated_at: string;
  timestamp?: string;
}

interface BalanceData {
  balance: number;
  lastChargeDate: string;
  lastChargeAmount: number;
  paymentMethod: string;
  transactions: Transaction[];
}

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

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

const defaultBalanceData: BalanceData = {
  balance: 0,
  lastChargeDate: "",
  lastChargeAmount: 0,
  paymentMethod: "card",
  transactions: [],
};

const transactionAPI = {
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

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [balanceData, setBalanceData] =
    useState<BalanceData>(defaultBalanceData);
  const [isLoading, setIsLoading] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshRef = useRef<number>(0);

  const refreshTransactions = useCallback(async () => {
    if (!user || !tokenManager.isLoggedIn()) {
      setBalanceData(defaultBalanceData);
      return;
    }

    // 디바운싱: 1초 이내의 중복 호출 방지
    const now = Date.now();
    if (now - lastRefreshRef.current < 1000) {
      console.log("🔄 refreshTransactions 디바운싱 - 스킵");
      return;
    }

    // 기존 타이머 취소
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // 새로운 타이머 설정
    refreshTimeoutRef.current = setTimeout(async () => {
      if (!user || !tokenManager.isLoggedIn()) {
        setBalanceData(defaultBalanceData);
        return;
      }

      setIsLoading(true);
      lastRefreshRef.current = Date.now();

      try {
        console.log("🔄 트랜잭션 데이터 새로고침 시작");
        const data = await transactionAPI.getTransactions(100, 0);

        const transactionsWithTimestamp = data.transactions.map(
          (transaction) => ({
            ...transaction,
            timestamp: transaction.created_at,
          })
        );

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
            (lastChargeTransaction?.metadata?.paymentMethod as string) ||
            "card",
          transactions: transactionsWithTimestamp,
        });

        console.log(
          "✅ 트랜잭션 데이터 새로고침 완료 - 잔액:",
          data.currentBalance
        );
      } catch (error) {
        console.error("❌ 트랜잭션 로드 오류:", error);
        if (error instanceof Error && error.message.includes("인증")) {
          setBalanceData(defaultBalanceData);
        }
      } finally {
        setIsLoading(false);
      }
    }, 100); // 100ms 지연
  }, [user]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        refreshTransactions();
      } else {
        setBalanceData(defaultBalanceData);
      }
    }
  }, [user, authLoading, refreshTransactions]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const calculateBalance = (): number => {
    return balanceData.balance;
  };

  const addTransaction = async (
    type: TransactionType,
    amount: number,
    description: string,
    referenceId?: string,
    metadata?: Record<string, string | number | boolean>
  ) => {
    if (!user || !tokenManager.isLoggedIn()) {
      throw new Error("로그인이 필요합니다.");
    }

    if (typeof amount !== "number" || isNaN(amount)) {
      throw new Error("유효하지 않은 금액입니다.");
    }

    if (amount === 0) {
      throw new Error("금액은 0이 될 수 없습니다.");
    }

    try {
      setIsLoading(true);

      await transactionAPI.createTransaction(
        type,
        amount,
        description,
        referenceId,
        metadata
      );

      await refreshTransactions();
    } catch (error) {
      console.error("트랜잭션 추가 오류:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionHistory = (): Transaction[] => {
    return [...balanceData.transactions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const updateBalance = (newBalance: number) => {
    setBalanceData((prev) => ({
      ...prev,
      balance: newBalance,
    }));
  };

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

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
}
