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

export type TransactionType =
  | "charge"
  | "usage"
  | "refund"
  | "penalty"
  | "reserve"
  | "unreserve";

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
  reservedAmount: number;
  availableBalance: number;
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
  calculatePoints: () => number;
  getReservedAmount: () => number;
  getAvailableBalance: () => number;
  getTransactionHistory: () => Transaction[];
  refreshTransactions: () => Promise<void>;
  isLoading: boolean;
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

const defaultBalanceData: BalanceData = {
  balance: 0,
  reservedAmount: 0,
  availableBalance: 0,
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
    reservedAmount: number;
    availableBalance: number;
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
    reservedAmount: number;
    availableBalance: number;
  }> {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error("인증 토큰이 필요합니다.");
    }

    const requestBody = {
      type,
      amount,
      description,
      reference_id,
      metadata,
    };

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "트랜잭션 생성에 실패했습니다.");
    }

    const result = await response.json();

    return result;
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
          reservedAmount: data.reservedAmount,
          availableBalance: data.availableBalance,
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

  // 광고머니 잔액 계산: transaction 기반 실시간 계산 
  const calculateBalance = (): number => {
    try {
      let creditBalance = 0;
      
      for (const transaction of balanceData.transactions) {
        const metadata = transaction.metadata as Record<string, string | number | boolean> | null;
        
        if (transaction.type === "charge") {
          // 광고머니 충전 (포인트 제외)
          if (!metadata?.isReward) {
            creditBalance += transaction.amount;
          }
        } else if (transaction.type === "usage") {
          // 광고머니 사용 (포인트 사용 제외)
          if (metadata?.transactionType !== "point") {
            creditBalance -= transaction.amount;
          }
        } else if (transaction.type === "refund") {
          creditBalance += transaction.amount;
        } else if (transaction.type === "penalty") {
          creditBalance -= transaction.amount;
        }
        // reserve/unreserve는 잔액에 영향 없음 (예약만)
      }
      
      return Math.max(0, creditBalance);
    } catch {
      return balanceData.balance; // fallback
    }
  };

  // 포인트 잔액 계산: transaction 기반 실시간 계산
  const calculatePoints = (): number => {
    try {
      let pointBalance = 0;
      
      for (const transaction of balanceData.transactions) {
        const metadata = transaction.metadata as Record<string, string | number | boolean> | null;
        
        if (transaction.type === "charge") {
          // 포인트 충전 (metadata.isReward = true)
          if (metadata?.isReward === true) {
            pointBalance += transaction.amount;
          }
        } else if (transaction.type === "usage") {
          // 포인트 사용 (metadata.transactionType = "point")
          if (metadata?.transactionType === "point") {
            pointBalance -= transaction.amount;
          }
        }
        // reserve/unreserve는 잔액에 영향 없음 (예약만)
      }
      
      return Math.max(0, pointBalance);
    } catch {
      return 0;
    }
  };

  // 예약 금액 계산: transaction 기반 실시간 계산
  const getReservedAmount = (): number => {
    try {
      let reserveAmount = 0;
      let unreserveAmount = 0;
      
      for (const transaction of balanceData.transactions) {
        if (transaction.type === "reserve" && transaction.status === "completed") {
          reserveAmount += transaction.amount;
        } else if (transaction.type === "unreserve" && transaction.status === "completed") {
          unreserveAmount += transaction.amount;
        }
      }
      
      return Math.max(0, reserveAmount - unreserveAmount);
    } catch {
      return balanceData.reservedAmount; // fallback
    }
  };

  // 사용 가능한 잔액 계산: 광고머니 - 예약금
  const getAvailableBalance = (): number => {
    const creditBalance = calculateBalance();
    const reservedAmount = getReservedAmount();
    return Math.max(0, creditBalance - reservedAmount);
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
    calculatePoints,
    getReservedAmount,
    getAvailableBalance,
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
