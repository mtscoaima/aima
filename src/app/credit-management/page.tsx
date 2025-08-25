"use client";

import React, { useState, useEffect } from "react";
import { useBalance } from "@/contexts/BalanceContext";
import { CreditBalance } from "@/components/credit/CreditBalance";
import { CreditPackages } from "@/components/credit/CreditPackages";
import { PaymentModal } from "@/components/credit/PaymentModal";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";
import "./styles.css";

interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus: number;
  isPopular?: boolean;
}

const CreditManagementPage = () => {
  const { getTransactionHistory, refreshTransactions } = useBalance();
  const [activeTab, setActiveTab] = useState<
    "charge" | "all" | "history" | "usage"
  >("charge");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // 필터링 상태
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const itemsPerPage = 10;

  // 결제 완료 후 자동 새로고침 처리 (localStorage 방식)
  useEffect(() => {
    const checkPaymentCompletion = async () => {
      const paymentCompleted = localStorage.getItem("payment_completed");
      const timestamp = localStorage.getItem("payment_completed_timestamp");

      if (paymentCompleted === "true" && timestamp) {
        const completionTime = parseInt(timestamp);
        const now = Date.now();
        // 5분 이내의 결제 완료만 처리 (중복 처리 방지)
        if (now - completionTime < 5 * 60 * 1000) {
          try {
            await refreshTransactions();
            setRefreshKey((prev) => prev + 1);
          } catch (error) {
            console.error("❌ 데이터 새로고침 실패:", error);
          }
        }

        // 플래그 제거
        localStorage.removeItem("payment_completed");
        localStorage.removeItem("payment_completed_timestamp");
      }
    };

    checkPaymentCompletion();
  }, [refreshTransactions]);

  // URL 파라미터 정리 (결제는 이제 payment/success 페이지에서 처리됨)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");

    if (paymentStatus) {
      // URL에서 파라미터 제거 (실제 결제 처리는 payment/success에서 수행됨)
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // 페이지 포커스 시 자동 새로고침
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        try {
          await refreshTransactions();
          setRefreshKey((prev) => prev + 1);
        } catch (error) {
          console.error("페이지 포커스 시 새로고침 실패:", error);
        }
      }
    };

    const handleFocus = async () => {
      try {
        await refreshTransactions();
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        console.error("윈도우 포커스 시 새로고침 실패:", error);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [refreshTransactions]);

  const handleCharge = (packageInfo: Package) => {
    setSelectedPackage(packageInfo);
    setIsPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPackage(null);
  };

  const allTransactions = getTransactionHistory();

  const getFilteredTransactions = (filterType: string) => {
    const allTransactions = getTransactionHistory();

    let filtered = allTransactions;

    if (filterType === "history") {
      filtered = allTransactions.filter((t) => t.type === "charge");
    } else if (filterType === "usage") {
      // 사용 관련 트랜잭션만 포함 (usage만, 예약/예약해제 제외)
      filtered = allTransactions.filter((t) => t.type === "usage");
    } else if (filterType === "all") {
      // 모든 트랜잭션 포함 (예약/예약해제 제외)
      filtered = allTransactions.filter(
        (t) => t.type !== "reserve" && t.type !== "unreserve"
      );
    }

    // 날짜 필터 적용
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }

      filtered = filtered.filter(
        (transaction) => new Date(transaction.created_at) >= filterDate
      );
    }

    // 검색어 필터 적용
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          transaction.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const filteredTransactions = getFilteredTransactions(activeTab);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const TransactionTable = ({
    transactions,
  }: {
    transactions: typeof currentTransactions;
  }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          트랜잭션 내역이 없습니다.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            {activeTab === "history" && (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        충전일시
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        패키지명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        크레딧
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        결제금액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        결제방법
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        영수증
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((transaction) => {
                      const metadata = transaction.metadata || {};
                      const packagePrice =
                        metadata.packagePrice || metadata.paymentAmount || 0;
                      const paymentMethod =
                        typeof metadata.paymentMethod === "string"
                          ? metadata.paymentMethod
                          : "card";
                      const packageName =
                        metadata.packageName ||
                        `크레딧 ${transaction.amount.toLocaleString()}개 패키지`;

                      return (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.created_at).toLocaleString(
                              "ko-KR",
                              {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {packageName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            +{transaction.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₩
                            {(typeof packagePrice === "number"
                              ? packagePrice
                              : 0
                            ).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {paymentMethod === "card"
                              ? "카드"
                              : paymentMethod === "toss"
                              ? "토스페이"
                              : "기타"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                transaction.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : transaction.status === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {transaction.status === "completed"
                                ? "완료"
                                : transaction.status === "failed"
                                ? "실패"
                                : transaction.status === "pending"
                                ? "대기"
                                : "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            -
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}

            {(activeTab === "all" || activeTab === "usage") && (
              <div className="space-y-4">
                {transactions.map((transaction) => {
                  const metadata = transaction.metadata || {};
                  const packageName =
                    metadata.packageName ||
                    `크레딧 ${transaction.amount.toLocaleString()}개 패키지`;
                  const templateName = metadata.templateName || null;
                  const isCharge = transaction.type === "charge";
                  const isRefund = transaction.type === "refund";
                  const isReserve = transaction.type === "reserve";
                  const isUnreserve = transaction.type === "unreserve";

                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                            isCharge || isRefund || isUnreserve
                              ? "bg-green-500"
                              : isReserve
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          {isCharge || isRefund || isUnreserve ? "+" : "-"}
                        </div>

                        <div className="flex items-center">
                          <div
                            className={`text-lg font-semibold ${
                              isCharge || isRefund || isUnreserve
                                ? "text-green-600"
                                : isReserve
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {isReserve || isUnreserve ? (
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  isReserve
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {isReserve ? "예약" : "예약해제"}
                              </span>
                            ) : null}
                            {isCharge || isRefund || isUnreserve ? "+" : "-"}
                            {transaction.amount.toLocaleString()} 크레딧
                          </div>
                        </div>
                      </div>

                      <div className="mt-2">
                        <div className="text-sm text-gray-900 font-medium">
                          {isCharge
                            ? packageName
                            : templateName || transaction.description}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(transaction.created_at).toLocaleString(
                            "ko-KR",
                            {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "charge" && (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex justify-between items-center py-4 border-b border-gray-100 last:border-b-0"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {transaction.type === "charge"
                          ? "크레딧 충전"
                          : transaction.description}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleString(
                          "ko-KR",
                          {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-medium ${
                          transaction.type === "charge" ||
                          transaction.type === "refund" ||
                          transaction.type === "unreserve"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "charge" ||
                        transaction.type === "refund" ||
                        transaction.type === "unreserve"
                          ? "+"
                          : "-"}
                        {transaction.amount.toLocaleString()} 크레딧
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  // 탭 변경 시 필터링 초기화
  React.useEffect(() => {
    setCurrentPage(1);
    setDateFilter("all");
    setSearchQuery("");
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "charge":
        return (
          <div className="space-y-6" key={`charge-${refreshKey}`}>
            <CreditBalance refreshKey={refreshKey} />
            <CreditPackages onCharge={handleCharge} />

            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    크레딧 사용 내역
                  </h3>
                  <button
                    onClick={() => setActiveTab("all")}
                    className="text-primary hover:text-primary text-sm font-medium cursor-pointer"
                  >
                    전체보기
                  </button>
                </div>
              </div>
              <div className="p-4">
                <TransactionTable
                  transactions={allTransactions
                    .filter(
                      (t) => t.type !== "reserve" && t.type !== "unreserve"
                    )
                    .slice(0, 5)}
                />
              </div>
            </div>
          </div>
        );
      case "history":
        const chargeTransactions = getFilteredTransactions("history");
        const totalChargedCredits = chargeTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        const totalChargeAmount = chargeTransactions.reduce((sum, t) => {
          const metadata = t.metadata || {};
          // packagePrice 또는 paymentAmount 중 존재하는 것 사용
          const paymentAmount =
            metadata.packagePrice || metadata.paymentAmount || 0;
          return sum + (typeof paymentAmount === "number" ? paymentAmount : 0);
        }, 0);

        return (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  총 충전 크레딧
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {totalChargedCredits.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">크레딧</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  총 결제 금액
                </div>
                <div className="text-2xl font-bold text-primary">
                  ₩{totalChargeAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">원</div>
              </div>
            </div>

            {/* 필터링과 테이블을 하나의 카드로 합침 */}
            <div className="bg-white rounded-lg border border-gray-200">
              {/* 필터링 섹션 */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      기간 선택
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                    >
                      <option value="all">전체</option>
                      <option value="today">오늘</option>
                      <option value="week">최근 7일</option>
                      <option value="month">최근 30일</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      패키지 검색
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="패키지명으로 검색..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setDateFilter("all");
                        setSearchQuery("");
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              </div>

              {/* 테이블 섹션 */}
              <div className="p-6">
                <TransactionTable transactions={currentTransactions} />
              </div>
            </div>
          </div>
        );
      case "usage":
        const usageFilteredTransactions = getFilteredTransactions("usage");
        const usageStartIndex = (currentPage - 1) * itemsPerPage;
        const usageEndIndex = usageStartIndex + itemsPerPage;
        const usageCurrentTransactions = usageFilteredTransactions.slice(
          usageStartIndex,
          usageEndIndex
        );

        return (
          <div className="space-y-6">
            {/* 제목과 뒤로가기 버튼 */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">사용 내역</h2>
              <button
                onClick={() => setActiveTab("charge")}
                className="flex items-center gap-2 text-gray-600 hover:text-primary cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                뒤로가기
              </button>
            </div>

            {/* 필터링과 테이블을 하나의 카드로 합침 */}
            <div className="bg-white rounded-lg border border-gray-200">
              {/* 필터링 섹션 */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      기간 선택
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                    >
                      <option value="all">전체</option>
                      <option value="today">오늘</option>
                      <option value="week">최근 7일</option>
                      <option value="month">최근 30일</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      내용 검색
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="내용으로 검색..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setDateFilter("all");
                        setSearchQuery("");
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              </div>

              {/* 테이블 섹션 */}
              <div className="p-6 cm-transaction-list">
                <TransactionTable transactions={usageCurrentTransactions} />
              </div>
            </div>
          </div>
        );
      case "all":
        const allFilteredTransactions = getFilteredTransactions("all");
        const allStartIndex = (currentPage - 1) * itemsPerPage;
        const allEndIndex = allStartIndex + itemsPerPage;
        const allCurrentTransactions = allFilteredTransactions.slice(
          allStartIndex,
          allEndIndex
        );

        return (
          <div className="space-y-6">
            {/* 제목과 뒤로가기 버튼 */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">전체 내역</h2>
              <button
                onClick={() => setActiveTab("charge")}
                className="flex items-center gap-2 text-gray-600 hover:text-primary cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                뒤로가기
              </button>
            </div>

            {/* 필터링과 테이블을 하나의 카드로 합침 */}
            <div className="bg-white rounded-lg border border-gray-200">
              {/* 필터링 섹션 */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      기간 선택
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                    >
                      <option value="all">전체</option>
                      <option value="today">오늘</option>
                      <option value="week">최근 7일</option>
                      <option value="month">최근 30일</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      내용 검색
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="패키지명/템플릿명으로 검색..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setDateFilter("all");
                        setSearchQuery("");
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                    >
                      초기화
                    </button>
                  </div>
                </div>
              </div>

              {/* 테이블 섹션 */}
              <div className="p-6 cm-transaction-list">
                <TransactionTable transactions={allCurrentTransactions} />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AdvertiserGuardWithDisabled>
      <div className="credit-management-container">
        <div className="cm-container">
          <header className="cm-header">
            <h1>크레딧 충전 관리</h1>
            <p>크레딧 충전 및 사용 내역을 관리할 수 있습니다.</p>
          </header>

          <div className="cm-tabs">
            <button
              className={`cm-tab-btn ${
                activeTab === "charge" || activeTab === "all" ? "active" : ""
              }`}
              onClick={() => setActiveTab("charge")}
            >
              크레딧 충전
            </button>
            <button
              className={`cm-tab-btn ${activeTab === "usage" ? "active" : ""}`}
              onClick={() => setActiveTab("usage")}
            >
              사용 내역
            </button>
            <button
              className={`cm-tab-btn ${
                activeTab === "history" ? "active" : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              충전 내역
            </button>
          </div>

          <div className="cm-content">{renderTabContent()}</div>
        </div>

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          packageInfo={selectedPackage}
        />
      </div>
    </AdvertiserGuardWithDisabled>
  );
};

export default CreditManagementPage;
