"use client";

import React, { useState, useEffect } from "react";
import { useBalance } from "@/contexts/BalanceContext";
import { CreditBalance } from "@/components/CreditBalance";
import { CreditPackages } from "@/components/CreditPackages";
import { PaymentModal } from "@/components/PaymentModal";
import RoleGuard from "@/components/RoleGuard";
import "./styles.css";

interface Package {
  id: number;
  credits: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

const CreditManagementPage = () => {
  const [activeTab, setActiveTab] = useState("charge");
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [usageAmount, setUsageAmount] = useState("");
  const [refundAmount, setRefundAmount] = useState("");

  // 필터링 상태
  const [dateFilter, setDateFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const itemsPerPage = 10;

  const { addTransaction, getTransactionHistory, refreshTransactions } =
    useBalance();

  // 결제 완료 후 자동 새로고침 처리
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

  const handlePaymentComplete = async (packageInfo: Package) => {
    try {
      const totalCredits = packageInfo.credits;
      const baseCredits = Math.floor(packageInfo.price / 10);
      const bonusCredits = totalCredits - baseCredits;

      const packageName = `크레딧 ${totalCredits.toLocaleString()}개 패키지`;
      const description =
        bonusCredits > 0
          ? `${packageName} 충전: ${totalCredits}크레딧 (기본 ${baseCredits} + 보너스 ${bonusCredits})`
          : `${packageName} 충전: ${totalCredits}크레딧`;

      await addTransaction(
        "charge",
        totalCredits,
        description,
        `package_${packageInfo.id}_${Date.now()}`,
        {
          packageId: packageInfo.id,
          packagePrice: packageInfo.price,
          paymentMethod: "card",
          baseCredits: baseCredits,
          bonusCredits: bonusCredits,
          totalCredits: totalCredits,
          packageName: packageName,
        }
      );

      setRefreshKey((prev) => prev + 1);
      alert(
        `${totalCredits.toLocaleString()}크레딧이 충전되었습니다!${
          bonusCredits > 0
            ? ` (기본: ${baseCredits.toLocaleString()}, 보너스: ${bonusCredits.toLocaleString()})`
            : ""
        }`
      );
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "충전 중 오류가 발생했습니다."
      );
    }
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPackage(null);
  };

  const handleTestUsage = () => setShowUsageModal(true);
  const handleTestRefund = () => setShowRefundModal(true);

  const handleConfirmUsage = async () => {
    const amount = parseInt(usageAmount);
    if (amount >= 1) {
      try {
        await addTransaction(
          "usage",
          amount,
          "테스트 크레딧 사용",
          `test_usage_${Date.now()}`,
          {
            serviceType: "test",
            testTransaction: true,
          }
        );
        setShowUsageModal(false);
        setUsageAmount("");
        setCurrentPage(1);
        alert(`${amount}크레딧이 사용되었습니다.`);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "사용 처리 중 오류가 발생했습니다."
        );
      }
    } else {
      alert("최소 사용 크레딧은 1크레딧입니다.");
    }
  };

  const handleConfirmRefund = async () => {
    const amount = parseInt(refundAmount);
    if (amount >= 1) {
      try {
        await addTransaction(
          "refund",
          amount,
          "테스트 크레딧 환불",
          `test_refund_${Date.now()}`,
          {
            refundType: "test",
            testTransaction: true,
          }
        );
        setShowRefundModal(false);
        setRefundAmount("");
        setCurrentPage(1);
        alert(`${amount}크레딧이 환불되었습니다.`);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "환불 처리 중 오류가 발생했습니다."
        );
      }
    } else {
      alert("최소 환불 크레딧은 1크레딧입니다.");
    }
  };

  const allTransactions = getTransactionHistory();

  const getFilteredTransactions = (tabType: string) => {
    let filteredTransactions = allTransactions;

    // 탭별 필터링
    switch (tabType) {
      case "usage":
        filteredTransactions = allTransactions.filter(
          (t) => t.type === "usage"
        );
        break;
      case "history":
        filteredTransactions = allTransactions.filter(
          (t) => t.type === "charge"
        );
        break;
      case "all":
        filteredTransactions = allTransactions;
        break;
      default:
        filteredTransactions = allTransactions;
    }

    // 날짜 필터링
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
          filterDate.setDate(now.getDate() - 30);
          break;
      }

      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.created_at) >= filterDate
      );
    }

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredTransactions = filteredTransactions.filter((t) => {
        const metadata = t.metadata || {};
        const packageName = String(metadata.packageName || "");
        const templateName = String(metadata.templateName || "");
        const description = String(t.description || "");

        return (
          packageName.toLowerCase().includes(query) ||
          templateName.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query)
        );
      });
    }

    return filteredTransactions;
  };

  const filteredTransactions = getFilteredTransactions(activeTab);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePrevPage = () =>
    currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNextPage = () =>
    currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter(
      (item, index, arr) => arr.indexOf(item) === index
    );
  };

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
                        보너스
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
                      // packagePrice 또는 paymentAmount 중 존재하는 것 사용
                      const packagePrice =
                        metadata.packagePrice || metadata.paymentAmount || 0;
                      const baseCredits =
                        typeof metadata.baseCredits === "number"
                          ? metadata.baseCredits
                          : typeof packagePrice === "number"
                          ? Math.floor(packagePrice / 10)
                          : 0;
                      const bonusCredits =
                        typeof metadata.bonusCredits === "number"
                          ? metadata.bonusCredits
                          : Math.max(0, transaction.amount - baseCredits);
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
                            +{baseCredits.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                            {bonusCredits > 0
                              ? `+${bonusCredits.toLocaleString()}`
                              : "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₩
                            {(typeof packagePrice === "number"
                              ? packagePrice
                              : 0
                            ).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {paymentMethod === "card"
                              ? "신용카드"
                              : paymentMethod === "test"
                              ? "테스트"
                              : paymentMethod === "paypal"
                              ? "PayPal"
                              : paymentMethod === "toss"
                              ? "토스페이먼츠"
                              : paymentMethod}
                            {(paymentMethod === "card" ||
                              paymentMethod === "toss") && (
                              <div className="text-xs text-gray-400">
                                토스페이먼츠
                              </div>
                            )}
                            {paymentMethod === "paypal" && (
                              <div className="text-xs text-gray-400">
                                user@email.com
                              </div>
                            )}
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
                                : "대기"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-primary hover:text-primary">
                              다운로드
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    총 {transactions.length}개의 충전 내역
                  </div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      이전
                    </button>

                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() =>
                          typeof page === "number"
                            ? handlePageChange(page)
                            : undefined
                        }
                        disabled={typeof page !== "number"}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      다음
                    </button>
                  </nav>
                </div>
              </>
            )}

            {activeTab === "usage" && (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        발송일시
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        템플릿명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        발송 건수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        성공/실패
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용 크레딧
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => {
                        const metadata = transaction.metadata || {};
                        const sendCount =
                          typeof metadata.sendCount === "number"
                            ? metadata.sendCount
                            : 0;
                        const successCount =
                          typeof metadata.successCount === "number"
                            ? metadata.successCount
                            : 0;
                        const failCount =
                          typeof metadata.failCount === "number"
                            ? metadata.failCount
                            : Math.max(0, sendCount - successCount);
                        const templateName =
                          typeof metadata.templateName === "string"
                            ? metadata.templateName
                            : transaction.description;

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
                              {templateName || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {sendCount > 0 ? sendCount.toLocaleString() : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {sendCount > 0 ? (
                                <>
                                  <div className="text-green-600 font-medium">
                                    {successCount.toLocaleString()}
                                  </div>
                                  {failCount > 0 && (
                                    <div className="text-red-600 text-xs">
                                      {failCount.toLocaleString()}
                                    </div>
                                  )}
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                              -{transaction.amount.toLocaleString()}
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
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          사용 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    총 {transactions.length}개의 발송 내역
                  </div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      이전
                    </button>

                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() =>
                          typeof page === "number"
                            ? handlePageChange(page)
                            : undefined
                        }
                        disabled={typeof page !== "number"}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      다음
                    </button>
                  </nav>
                </div>
              </>
            )}

            {activeTab === "all" && (
              <>
                <div className="space-y-3">
                  {transactions.length > 0 ? (
                    transactions.map((transaction) => {
                      const metadata = transaction.metadata || {};
                      const isCharge = transaction.type === "charge";
                      const isUsage = transaction.type === "usage";

                      // 충전 관련 정보
                      const packagePrice =
                        metadata.packagePrice || metadata.paymentAmount || 0;
                      const baseCredits =
                        typeof metadata.baseCredits === "number"
                          ? metadata.baseCredits
                          : typeof packagePrice === "number"
                          ? Math.floor(packagePrice / 10)
                          : 0;
                      const bonusCredits =
                        typeof metadata.bonusCredits === "number"
                          ? metadata.bonusCredits
                          : Math.max(0, transaction.amount - baseCredits);
                      const packageName =
                        metadata.packageName ||
                        `크레딧 ${transaction.amount.toLocaleString()}개 패키지`;

                      // 사용 관련 정보
                      const templateName =
                        typeof metadata.templateName === "string"
                          ? metadata.templateName
                          : transaction.description;

                      return (
                        <div
                          key={transaction.id}
                          className="cm-transaction-card"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  isCharge
                                    ? "bg-green-100 text-green-800"
                                    : isUsage
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {isCharge
                                  ? "크레딧 충전"
                                  : isUsage
                                  ? "크레딧 사용"
                                  : "기타"}
                              </span>
                              {isCharge && bonusCredits > 0 && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  +{bonusCredits.toLocaleString()} 보너스
                                </span>
                              )}
                            </div>
                            <div className="text-right">
                              <div
                                className={`text-lg font-bold ${
                                  isCharge ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {isCharge ? "+" : "-"}
                                {transaction.amount.toLocaleString()} 크레딧
                              </div>
                            </div>
                          </div>

                          <div className="mt-2">
                            <div className="text-sm text-gray-900 font-medium">
                              {isCharge
                                ? packageName
                                : templateName || "크레딧 사용"}
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
                    })
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      전체 내역이 없습니다.
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    총 {transactions.length}개의 전체 내역
                  </div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      이전
                    </button>

                    {getPageNumbers().map((page) => (
                      <button
                        key={page}
                        onClick={() =>
                          typeof page === "number"
                            ? handlePageChange(page)
                            : undefined
                        }
                        disabled={typeof page !== "number"}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                        currentPage === totalPages
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      다음
                    </button>
                  </nav>
                </div>
              </>
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
                        {transaction.type === "charge" &&
                          transaction.metadata?.bonusCredits &&
                          Number(transaction.metadata.bonusCredits) > 0 && (
                            <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              +
                              {Number(
                                transaction.metadata.bonusCredits
                              ).toLocaleString()}{" "}
                              보너스
                            </span>
                          )}
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
                          transaction.type === "refund"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "charge" ||
                        transaction.type === "refund"
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

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                총 {filteredTransactions.length}개 중 {startIndex + 1}-
                {Math.min(endIndex, filteredTransactions.length)}개 표시
              </div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  이전
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    onClick={() =>
                      typeof page === "number"
                        ? handlePageChange(page)
                        : undefined
                    }
                    disabled={typeof page !== "number"}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === page
                        ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === totalPages
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  다음
                </button>
              </nav>
            </div>
          )}
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

            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold mb-4">테스트 기능</h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  onClick={handleTestUsage}
                >
                  테스트 사용
                </button>
                <button
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  onClick={handleTestRefund}
                >
                  테스트 환불
                </button>
              </div>
            </div>

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
                <TransactionTable transactions={allTransactions.slice(0, 5)} />
              </div>
            </div>
          </div>
        );
      case "usage":
        const usageTransactions = getFilteredTransactions("usage");
        const totalUsedCredits = usageTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        const totalSentMessages = usageTransactions.reduce((sum, t) => {
          const metadata = t.metadata || {};
          return (
            sum +
            (typeof metadata.sendCount === "number" ? metadata.sendCount : 0)
          );
        }, 0);
        const totalSuccessMessages = usageTransactions.reduce((sum, t) => {
          const metadata = t.metadata || {};
          return (
            sum +
            (typeof metadata.successCount === "number"
              ? metadata.successCount
              : 0)
          );
        }, 0);
        const successRate =
          totalSentMessages > 0
            ? (totalSuccessMessages / totalSentMessages) * 100
            : 0;

        return (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  총 사용 크레딧
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {totalUsedCredits.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">크레딧</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  총 발송 건수
                </div>
                <div className="text-2xl font-bold text-primary">
                  {totalSentMessages.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">건</div>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  발송 성공률
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {successRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">성공률</div>
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
                      템플릿 검색
                    </label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="템플릿명으로 검색..."
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
        const totalBonusCredits = chargeTransactions.reduce((sum, t) => {
          const metadata = t.metadata || {};
          return (
            sum +
            (typeof metadata.bonusCredits === "number"
              ? metadata.bonusCredits
              : 0)
          );
        }, 0);

        return (
          <div className="space-y-6">
            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  총 보너스 크레딧
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {totalBonusCredits.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">크레딧</div>
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

  const allowedRoles = ["USER", "ADMIN"];

  return (
    <RoleGuard allowedRoles={allowedRoles}>
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
          onPaymentComplete={handlePaymentComplete}
        />

        {showUsageModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  테스트 크레딧 사용
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사용 크레딧
                  </label>
                  <input
                    type="number"
                    value={usageAmount}
                    onChange={(e) => setUsageAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                    placeholder="사용할 크레딧을 입력하세요"
                    min="1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmUsage}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                  >
                    사용하기
                  </button>
                  <button
                    onClick={() => setShowUsageModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRefundModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  테스트 크레딧 환불
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    환불 크레딧
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                    placeholder="환불할 크레딧을 입력하세요"
                    min="1"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmRefund}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                  >
                    환불하기
                  </button>
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
};

export default CreditManagementPage;
