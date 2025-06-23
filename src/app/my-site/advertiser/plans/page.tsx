"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdvertiserLoginRequiredGuard } from "@/components/RoleGuard";
import { useBalance, TransactionType } from "@/contexts/BalanceContext";

// 요금제 타입
type PlanType = "prepaid" | "postpaid";

// 충전 수단 타입
type PaymentMethod = "card" | "bank" | "virtual" | "phone";

// 결제 상태 타입
type PaymentStatus = "completed" | "pending" | "failed";

// 선불 요금제 데이터 타입 (pointBalance 제거)
interface PrepaidPlanData {
  balance: number;
  lastChargeDate: string;
  lastChargeAmount: number;
  paymentMethod: PaymentMethod;
  chargeHistory: {
    date: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    receiptUrl: string;
  }[];
  bonusHistory: {
    date: string;
    amount: number;
    reason: string;
    expiryDate: string;
  }[];
  usageHistory: {
    date: string;
    amount: number;
    service: string;
    description: string;
  }[];
}

// 후불 요금제 데이터 타입
interface PostpaidPlanData {
  companyInfo: {
    companyName: string;
    businessNumber: string;
    representativeName: string;
    address: string;
  };
  paymentInfo: {
    paymentMethod: PaymentMethod;
    cardInfo?: {
      cardCompany: string;
      lastFourDigits: string;
      expiryDate: string;
    };
    bankInfo?: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
  };
  invoiceInfo: {
    email: string;
    managerName: string;
    contactNumber: string;
    address: string;
  };
  billingHistory: {
    date: string;
    amount: number;
    status: PaymentStatus;
    dueDate: string;
    invoiceUrl: string;
  }[];
}

// 요금제 페이지 컴포넌트
export default function PlansPage() {
  const {
    balanceData,
    formatCurrency,
    addTransaction,
    getTransactionHistory,
    calculateBalance,
    isLoading,
    refreshTransactions,
  } = useBalance();

  // 현재 요금제 타입 상태 (실제 앱에서는 API로부터 가져옴)
  const [currentPlan, setCurrentPlan] = useState<PlanType>("prepaid");

  // 요금제 변경 모달 표시 상태
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);

  // 충전 모달 표시 상태
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<string>("");

  // 사용 모달 표시 상태
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [usageAmount, setUsageAmount] = useState<string>("");

  // 환불 모달 표시 상태
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState<string>("");

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 선불 요금제 데이터 (샘플) - 이제 balanceData에서 가져옴
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prepaidData, setPrepaidData] = useState<PrepaidPlanData>({
    balance: calculateBalance(),
    lastChargeDate: balanceData.lastChargeDate,
    lastChargeAmount: balanceData.lastChargeAmount,
    paymentMethod: balanceData.paymentMethod as PaymentMethod,
    chargeHistory: [
      {
        date: "2025-05-10 15:32:45",
        amount: 300000,
        paymentMethod: "card",
        status: "completed",
        receiptUrl: "#",
      },
      {
        date: "2025-04-05 11:21:33",
        amount: 200000,
        paymentMethod: "bank",
        status: "completed",
        receiptUrl: "#",
      },
    ],
    bonusHistory: [
      {
        date: "2025-05-10 15:32:45",
        amount: 15000,
        reason: "충전 금액의 5% 적립",
        expiryDate: "2025-08-10",
      },
      {
        date: "2025-04-05 11:21:33",
        amount: 10000,
        reason: "충전 금액의 5% 적립",
        expiryDate: "2025-07-05",
      },
    ],
    usageHistory: [
      {
        date: "2025-05-15 10:12:23",
        amount: 5000,
        service: "문자메시지 발송",
        description: "SMS 50건 발송",
      },
      {
        date: "2025-05-12 14:25:33",
        amount: 20000,
        service: "타겟마케팅",
        description: "캠페인 ID: 1234 실행",
      },
    ],
  });

  // 후불 요금제 데이터 (샘플)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [postpaidData, setPostpaidData] = useState<PostpaidPlanData>({
    companyInfo: {
      companyName: "솔라피 테크놀로지",
      businessNumber: "123-45-67890",
      representativeName: "김솔라",
      address: "서울특별시 강남구 테헤란로 123, 7층 701호",
    },
    paymentInfo: {
      paymentMethod: "card",
      cardInfo: {
        cardCompany: "신한카드",
        lastFourDigits: "4567",
        expiryDate: "03/28",
      },
    },
    invoiceInfo: {
      email: "tax@solarpi.com",
      managerName: "정재무",
      contactNumber: "010-9876-5432",
      address: "서울특별시 강남구 테헤란로 123, 7층 701호",
    },
    billingHistory: [
      {
        date: "2025-05-01",
        amount: 450000,
        status: "completed",
        dueDate: "2025-05-15",
        invoiceUrl: "#",
      },
      {
        date: "2025-04-01",
        amount: 320000,
        status: "completed",
        dueDate: "2025-04-15",
        invoiceUrl: "#",
      },
    ],
  });

  // 결제 방식을 한글로 표시
  const getPaymentMethodText = (method: PaymentMethod) => {
    switch (method) {
      case "card":
        return "신용카드";
      case "bank":
        return "계좌이체";
      case "virtual":
        return "가상계좌";
      case "phone":
        return "휴대폰결제";
      default:
        return "알 수 없음";
    }
  };

  // 결제 상태를 한글로 표시
  const getPaymentStatusText = (status: PaymentStatus) => {
    switch (status) {
      case "completed":
        return "완료";
      case "pending":
        return "처리중";
      case "failed":
        return "실패";
      default:
        return "알 수 없음";
    }
  };

  // 결제 상태에 따른 배지 스타일
  const getStatusBadgeStyle = (status: PaymentStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 요금제 타입을 한글로 표시
  const getPlanTypeText = (planType: PlanType) => {
    switch (planType) {
      case "prepaid":
        return "선불 요금제";
      case "postpaid":
        return "후불 요금제";
      default:
        return "알 수 없음";
    }
  };

  // 요금제 변경 버튼 클릭 핸들러
  const handleChangePlanClick = () => {
    setShowChangePlanModal(true);
  };

  // 모달에서 요금제 변경 핸들러
  const handleChangePlan = (planType: PlanType) => {
    // 실제 구현에서는 서버에 요금제 변경 요청을 보냄
    setCurrentPlan(planType);
    setShowChangePlanModal(false);
  };

  // 충전하기 핸들러
  const handleCharge = () => {
    setShowChargeModal(true);
  };

  // 충전 확인 핸들러 - 트랜잭션 시스템 사용 (보너스 제거)
  const handleConfirmCharge = () => {
    const amount = parseInt(chargeAmount);
    if (amount >= 10) {
      try {
        // 충전 트랜잭션 추가
        addTransaction("charge", amount, "잔액 충전", `charge_${Date.now()}`, {
          paymentMethod: "card",
          chargeAmount: amount,
        });

        setShowChargeModal(false);
        setChargeAmount("");
        setCurrentPage(1); // 첫 페이지로 이동
        alert(`${formatCurrency(amount)} 충전이 완료되었습니다!`);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "충전 중 오류가 발생했습니다."
        );
      }
    } else {
      alert("최소 충전 금액은 10원입니다.");
    }
  };

  // 환불신청 핸들러 - 모달 표시
  const handleRefund = () => {
    setShowRefundModal(true);
  };

  // 테스트용 사용 트랜잭션 모달 표시 핸들러
  const handleTestUsage = () => {
    setShowUsageModal(true);
  };

  // 사용 확인 핸들러
  const handleConfirmUsage = () => {
    const amount = parseInt(usageAmount);
    if (amount >= 10) {
      try {
        addTransaction("usage", amount, "서비스 사용", `usage_${Date.now()}`, {
          serviceType: "manual",
          description: "수동 사용",
        });
        setShowUsageModal(false);
        setUsageAmount("");
        setCurrentPage(1); // 첫 페이지로 이동
        alert(`${formatCurrency(amount)} 사용이 완료되었습니다.`);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "사용 처리 중 오류가 발생했습니다."
        );
      }
    } else {
      alert("최소 사용 금액은 10원입니다.");
    }
  };

  // 환불 확인 핸들러
  const handleConfirmRefund = () => {
    const amount = parseInt(refundAmount);
    if (amount >= 10) {
      try {
        addTransaction("refund", amount, "환불 처리", `refund_${Date.now()}`, {
          refundType: "manual",
          description: "수동 환불",
        });
        setShowRefundModal(false);
        setRefundAmount("");
        setCurrentPage(1); // 첫 페이지로 이동
        alert(`${formatCurrency(amount)} 환불이 완료되었습니다.`);
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : "환불 처리 중 오류가 발생했습니다."
        );
      }
    } else {
      alert("최소 환불 금액은 10원입니다.");
    }
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowChangePlanModal(false);
  };

  // 트랜잭션 타입별 스타일 반환 (bonus 제거)
  const getTransactionTypeStyle = (type: TransactionType) => {
    switch (type) {
      case "charge":
        return "bg-blue-100 text-blue-800";
      case "usage":
        return "bg-red-100 text-red-800";
      case "refund":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 트랜잭션 타입별 한글 텍스트 반환 (bonus 제거)
  const getTransactionTypeText = (type: TransactionType) => {
    switch (type) {
      case "charge":
        return "충전";
      case "usage":
        return "사용";
      case "refund":
        return "환불";
      default:
        return "기타";
    }
  };

  // 트랜잭션 히스토리 가져오기
  const transactionHistory = getTransactionHistory();
  const totalPages = Math.ceil(transactionHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactionHistory.slice(startIndex, endIndex);

  // 최근 충전 정보 계산
  const lastChargeTransaction = transactionHistory.find(
    (t) => t.type === "charge"
  );
  const lastChargeDate = lastChargeTransaction
    ? new Date(
        lastChargeTransaction.timestamp || lastChargeTransaction.created_at
      ).toLocaleDateString("ko-KR")
    : "충전 내역 없음";
  const lastChargeAmount = lastChargeTransaction
    ? lastChargeTransaction.amount
    : 0;

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 이전 페이지 핸들러
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // 다음 페이지 핸들러
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 페이지 번호 배열 생성 (최대 5개 페이지 번호 표시)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <AdvertiserLoginRequiredGuard>
      <div className="pt-20 p-4 max-w-5xl mx-auto">
        <div className="mb-20"></div>

        {/* 현재 요금제 정보 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-blue-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium">현재 요금제</h2>
              <div className="mt-1 flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {getPlanTypeText(currentPlan)}
                </span>
                {currentPlan === "prepaid" && (
                  <span className="ml-4 text-gray-700">
                    잔액:{" "}
                    <span className="font-medium text-blue-600">
                      {formatCurrency(calculateBalance())}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <button
              className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleChangePlanClick}
            >
              요금제 변경
            </button>
          </div>
        </div>

        {/* 선불 요금제 컨텐츠 */}
        {currentPlan === "prepaid" && (
          <>
            {/* 잔액 정보 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-green-500">
              <h2 className="text-lg font-semibold mb-4">잔액 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">현재 잔액</p>
                  <p className="font-medium text-xl text-blue-600">
                    {isLoading
                      ? "로딩 중..."
                      : formatCurrency(calculateBalance())}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">최근 충전일</p>
                  <p className="font-medium">{lastChargeDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">최근 충전 금액</p>
                  <p className="font-medium">
                    {formatCurrency(lastChargeAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-2 flex-wrap">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleCharge}
                >
                  충전하기
                </button>
                <button
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleRefund}
                >
                  환불신청
                </button>
                {/* 테스트 버튼들 */}
                <button
                  className="inline-flex items-center px-4 py-2 border border-orange-300 text-sm font-medium rounded-md shadow-sm text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  onClick={handleTestUsage}
                >
                  테스트 사용
                </button>
              </div>
            </div>

            {/* 트랜잭션 히스토리 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">트랜잭션 히스토리</h2>
                <button
                  onClick={refreshTransactions}
                  disabled={isLoading}
                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isLoading ? "새로고침 중..." : "새로고침"}
                </button>
              </div>

              {transactionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-lg mb-2">📊</div>
                  <p className="text-gray-500">아직 트랜잭션이 없습니다.</p>
                  <p className="text-sm text-gray-400 mt-1">
                    충전하기 버튼을 눌러 첫 트랜잭션을 만들어보세요!
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            일시
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            유형
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            금액
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            잔액
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            설명
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            참조ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentTransactions.map((transaction) => (
                          <tr key={transaction.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.timestamp || transaction.created_at}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTransactionTypeStyle(
                                  transaction.type
                                )}`}
                              >
                                {getTransactionTypeText(transaction.type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span
                                className={
                                  transaction.amount >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }
                              >
                                {transaction.amount >= 0 ? "+" : ""}
                                {formatCurrency(transaction.amount)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(transaction.balance)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {transaction.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {transaction.reference_id || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 페이지네이션 */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        총 {transactionHistory.length}개 중 {startIndex + 1}-
                        {Math.min(endIndex, transactionHistory.length)}개 표시
                      </div>
                      <nav
                        className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                        aria-label="Pagination"
                      >
                        {/* 이전 버튼 */}
                        <button
                          onClick={handlePrevPage}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === 1
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          } focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                        >
                          <span className="sr-only">Previous</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>

                        {/* 페이지 번호들 */}
                        {getPageNumbers().map((page) => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? "z-10 bg-indigo-50 border-indigo-500 text-indigo-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            } focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                          >
                            {page}
                          </button>
                        ))}

                        {/* 다음 버튼 */}
                        <button
                          onClick={handleNextPage}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                            currentPage === totalPages
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-500 hover:bg-gray-50"
                          } focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                        >
                          <span className="sr-only">Next</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* 후불 요금제 컨텐츠 */}
        {currentPlan === "postpaid" && (
          <>
            {/* 기업 정보 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-green-500">
              <h2 className="text-lg font-semibold mb-4">기업 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">기업명</p>
                  <p className="font-medium">
                    {postpaidData.companyInfo.companyName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">사업자등록번호</p>
                  <p className="font-medium">
                    {postpaidData.companyInfo.businessNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">대표자명</p>
                  <p className="font-medium">
                    {postpaidData.companyInfo.representativeName}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">주소</p>
                  <p className="font-medium">
                    {postpaidData.companyInfo.address}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  기업 정보 수정
                </button>
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">결제 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">결제 수단</p>
                  <p className="font-medium">
                    {getPaymentMethodText(
                      postpaidData.paymentInfo.paymentMethod
                    )}
                  </p>
                </div>

                {postpaidData.paymentInfo.paymentMethod === "card" &&
                  postpaidData.paymentInfo.cardInfo && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">카드사</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.cardInfo.cardCompany}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">카드번호</p>
                        <p className="font-medium">
                          **** **** ****{" "}
                          {postpaidData.paymentInfo.cardInfo.lastFourDigits}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">유효기간</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.cardInfo.expiryDate}
                        </p>
                      </div>
                    </>
                  )}

                {postpaidData.paymentInfo.paymentMethod === "bank" &&
                  postpaidData.paymentInfo.bankInfo && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">은행명</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.bankInfo.bankName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">계좌번호</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.bankInfo.accountNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">예금주</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.bankInfo.accountHolder}
                        </p>
                      </div>
                    </>
                  )}
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  결제 정보 수정
                </button>
              </div>
            </div>

            {/* 세금계산서 수령자 정보 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">
                세금계산서 수령자 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">수신 이메일</p>
                  <p className="font-medium">
                    {postpaidData.invoiceInfo.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">담당자명</p>
                  <p className="font-medium">
                    {postpaidData.invoiceInfo.managerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">연락처</p>
                  <p className="font-medium">
                    {postpaidData.invoiceInfo.contactNumber}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">주소</p>
                  <p className="font-medium">
                    {postpaidData.invoiceInfo.address}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  세금계산서 수령자 정보 수정
                </button>
              </div>
            </div>

            {/* 청구 내역 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">청구 내역</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        청구일
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        금액
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        상태
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        납부일
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        세금계산서
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {postpaidData.billingHistory.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(
                              item.status
                            )}`}
                          >
                            {getPaymentStatusText(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.dueDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <a
                            href={item.invoiceUrl}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            보기
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* 요금제 변경 안내 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">요금제 이용 안내</h2>
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">
              선불 요금제와 후불 요금제 간 변경을 원하시면 고객센터로
              문의해주세요.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              - 후불 요금제로 변경 시 회사 신용 평가 절차가 필요할 수 있습니다.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              - 선불 요금제로 변경 시 미납 금액을 정산한 후 변경됩니다.
            </p>
            <div className="mt-4">
              <Link
                href="/customer-service/inquiry"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                고객센터 문의하기
              </Link>
            </div>
          </div>
        </div>

        {/* 충전 모달 */}
        {showChargeModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  잔액 충전
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    충전 금액 (원)
                  </label>
                  <input
                    type="number"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="충전할 금액을 입력하세요"
                    min="10"
                    step="10"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    최소 충전 금액: 10원
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmCharge}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    충전하기
                  </button>
                  <button
                    onClick={() => setShowChargeModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 요금제 변경 모달 */}
        {showChangePlanModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  요금제 변경
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleChangePlan("prepaid")}
                    className={`w-full p-3 text-left border rounded-lg ${
                      currentPlan === "prepaid"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">선불 요금제</div>
                    <div className="text-sm text-gray-600">
                      미리 충전하여 사용하는 방식
                    </div>
                  </button>
                  <button
                    onClick={() => handleChangePlan("postpaid")}
                    className={`w-full p-3 text-left border rounded-lg ${
                      currentPlan === "postpaid"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">후불 요금제</div>
                    <div className="text-sm text-gray-600">
                      사용 후 정기 결제하는 방식
                    </div>
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 사용 모달 */}
        {showUsageModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  서비스 사용
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    사용 금액 (원)
                  </label>
                  <input
                    type="number"
                    value={usageAmount}
                    onChange={(e) => setUsageAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="사용할 금액을 입력하세요"
                    min="10"
                    step="10"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    최소 사용 금액: 10원
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmUsage}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    사용하기
                  </button>
                  <button
                    onClick={() => setShowUsageModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 환불 모달 */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
            <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  환불 처리
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    환불 금액 (원)
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="환불할 금액을 입력하세요"
                    min="10"
                    step="10"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    최소 환불 금액: 10원
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmRefund}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    환불하기
                  </button>
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvertiserLoginRequiredGuard>
  );
}
