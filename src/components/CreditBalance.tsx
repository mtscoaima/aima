import React, { useEffect } from "react";
import { useBalance } from "@/contexts/BalanceContext";

interface CreditBalanceProps {
  refreshKey?: number;
}

export function CreditBalance({ refreshKey }: CreditBalanceProps) {
  const {
    calculateBalance,
    getTransactionHistory,
    isLoading,
    refreshTransactions,
  } = useBalance();

  // refreshKey가 변경될 때마다 데이터 새로고침
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      console.log(
        "🔄 CreditBalance 컴포넌트 새로고침 (refreshKey:",
        refreshKey,
        ")"
      );
      refreshTransactions().catch((error) => {
        console.error("CreditBalance 새로고침 실패:", error);
      });
    }
  }, [refreshKey, refreshTransactions]);

  // 이번 달 사용량 계산
  const calculateMonthlyUsage = () => {
    const transactions = getTransactionHistory();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return transactions
      .filter((transaction) => {
        const transactionDate = new Date(transaction.created_at);
        return (
          transaction.type === "usage" &&
          transactionDate.getMonth() === currentMonth &&
          transactionDate.getFullYear() === currentYear
        );
      })
      .reduce((total, transaction) => total + Math.abs(transaction.amount), 0);
  };

  const currentBalance = calculateBalance();
  const monthlyUsage = calculateMonthlyUsage();

  if (isLoading) {
    return (
      <section className="cm-balance-section">
        <h3 className="cm-balance-title">현재 크레딧 잔액</h3>
        <div className="cm-balance-content">
          <div className="cm-balance-main">
            <span className="cm-balance-amount">로딩 중...</span>
            <span className="cm-balance-unit">크레딧</span>
          </div>
          <div className="cm-balance-usage">
            <span className="cm-balance-usage-label">이번 달 사용량</span>
            <span className="cm-balance-usage-amount">로딩 중...</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="cm-balance-section">
      <h3 className="cm-balance-title">현재 크레딧 잔액</h3>
      <div className="cm-balance-content">
        <div className="cm-balance-main">
          <span className="cm-balance-amount">
            {currentBalance.toLocaleString()}
          </span>
          <span className="cm-balance-unit">크레딧</span>
        </div>
        <div className="cm-balance-usage">
          <span className="cm-balance-usage-label">이번 달 사용량</span>
          <span className="cm-balance-usage-amount">
            {monthlyUsage.toLocaleString()} 크레딧
          </span>
        </div>
      </div>
    </section>
  );
}
