import React, { useEffect } from "react";
import { useBalance } from "@/contexts/BalanceContext";

interface CreditBalanceProps {
  refreshKey?: number;
}

export function CreditBalance({ refreshKey }: CreditBalanceProps) {
  const {
    calculateBalance,
    calculatePoints,
    isLoading,
    refreshTransactions,
  } = useBalance();

  // refreshKey가 변경될 때마다 데이터 새로고침
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      refreshTransactions().catch((error) => {
        console.error("CreditBalance 새로고침 실패:", error);
      });
    }
  }, [refreshKey, refreshTransactions]);

  const currentBalance = calculateBalance();
  const points = calculatePoints();

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">
          잔액 정보
        </h3>
        <div className="text-center py-4">
          <div className="text-gray-500">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 h-full">
      <h3 className="text-lg font-medium text-gray-900 mb-6">
        잔액 정보
      </h3>
      
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-6">
          {/* 광고머니 */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">광고머니</div>
            <div className="text-2xl font-bold text-blue-600">
              {currentBalance.toLocaleString()}원
            </div>
          </div>
          
          {/* 포인트트 */}
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-2">포인트</div>
            <div className="text-2xl font-bold text-gray-900">
              {points.toLocaleString()} P
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
