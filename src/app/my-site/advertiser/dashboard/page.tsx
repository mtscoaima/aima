"use client";

import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import Link from "next/link";
import { AdvertiserLoginRequiredGuard } from "@/components/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";

// Chart.js 컴포넌트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const {
    formatCurrency,
    getTransactionHistory,
    calculateBalance,
    isLoading,
    refreshTransactions,
  } = useBalance();

  // 트랜잭션 히스토리 가져오기
  const transactionHistory = getTransactionHistory();

  // 최근 5개 트랜잭션 가져오기
  const recentTransactions = transactionHistory.slice(0, 5);

  // 이번 달 트랜잭션 통계 계산
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTransactions = transactionHistory.filter((transaction) => {
    const timestamp = transaction.timestamp || transaction.created_at;
    if (!timestamp) return false;

    const transactionDate = new Date(timestamp);
    return (
      transactionDate.getMonth() === currentMonth &&
      transactionDate.getFullYear() === currentYear
    );
  });

  const thisMonthCharges = thisMonthTransactions.filter(
    (t) => t.type === "charge"
  );
  const thisMonthUsages = thisMonthTransactions.filter(
    (t) => t.type === "usage"
  );
  const thisMonthRefunds = thisMonthTransactions.filter(
    (t) => t.type === "refund"
  );

  const totalChargeAmount = thisMonthCharges.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const totalUsageAmount = thisMonthUsages.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const totalRefundAmount = thisMonthRefunds.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  // 날짜 포맷팅 함수
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date
        .toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replace(/\./g, ".")
        .replace(/ /g, "");
    } catch {
      return "-";
    }
  };

  // 트랜잭션 시간 포맷팅 함수
  const formatTransactionTime = (transaction: {
    timestamp?: string;
    created_at: string;
  }) => {
    const timestamp = transaction.timestamp || transaction.created_at;
    if (!timestamp) return "-";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else {
      return `${diffDays}일 전`;
    }
  };

  // 트랜잭션 타입별 아이콘과 색상
  const getTransactionDisplay = (type: string) => {
    switch (type) {
      case "charge":
        return { icon: "💳", color: "bg-green-500", text: "잔액 충전" };
      case "usage":
        return { icon: "📱", color: "bg-blue-500", text: "서비스 사용" };
      case "refund":
        return { icon: "↩️", color: "bg-purple-500", text: "환불 처리" };
      default:
        return { icon: "📋", color: "bg-gray-500", text: "기타" };
    }
  };

  // 사용자 역할 한글 변환
  const getRoleInKorean = (role?: string) => {
    if (!role) return "일반회원";
    switch (role) {
      case "ADVERTISER":
        return "광고주";
      case "SALESPERSON":
        return "영업사원";
      case "ADMIN":
        return "관리자";
      default:
        return "일반회원";
    }
  };

  // 메시지 발송 현황 차트 데이터 (월간)
  const messageChartData = {
    labels: ["1", "5", "10", "15", "20", "25", "30"],
    datasets: [
      {
        label: "성공",
        data: [12, 19, 8, 15, 20, 25, 18],
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        tension: 0.1,
      },
      {
        label: "실패",
        data: [2, 3, 1, 4, 2, 3, 1],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        tension: 0.1,
      },
    ],
  };

  // 타켓마케팅 발송 현황 차트 데이터
  const campaignChartData = {
    labels: ["캠페인A", "캠페인B", "캠페인C", "캠페인D"],
    datasets: [
      {
        label: "대상자수",
        data: [1200, 1900, 800, 1500],
        backgroundColor: "rgba(54, 162, 235, 0.5)",
      },
      {
        label: "반응률(%)",
        data: [15, 7, 20, 12],
        backgroundColor: "rgba(75, 192, 192, 0.5)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <AdvertiserLoginRequiredGuard>
      <div className="p-4 max-w-7xl mx-auto">
        {/* 회원 요약정보 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 mb-4 border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">회원 요약정보</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshTransactions}
                disabled={isLoading}
                className="text-sm text-gray-600 hover:text-gray-800 font-medium disabled:opacity-50"
                title="트랜잭션 새로고침"
              >
                {isLoading ? "🔄" : "↻"}
              </button>
              <Link
                href="/my-site/advertiser/profile"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                상세정보 →
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">회원명</p>
              <p className="font-medium">{user?.name || "Loading..."}</p>
              <p className="text-xs text-gray-400">ID: {user?.id || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">가입일</p>
              <p className="font-medium">{formatDate(user?.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">회원유형</p>
              <p className="font-medium">{getRoleInKorean(user?.role)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">트랜잭션 수</p>
              <p className="font-medium">{transactionHistory.length}건</p>
              <p className="text-xs text-gray-400">
                {isLoading ? "로딩 중..." : "최신 업데이트"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 메시지 발송현황 요약 섹션 */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-green-500">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">메시지 발송현황 요약</h2>
              <span className="text-sm text-gray-500">(이번 달)</span>
            </div>

            <div className="w-full h-60 mb-3">
              <Line data={messageChartData} options={chartOptions} />
            </div>

            <div className="grid grid-cols-5 gap-2">
              <div className="text-center">
                <p className="text-sm text-gray-600">총 발송건수</p>
                <p className="font-bold text-lg">128건</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">성공건수</p>
                <p className="font-bold text-lg text-blue-600">117건</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">실패건수</p>
                <p className="font-bold text-lg text-red-600">11건</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">성공률</p>
                <p className="font-bold text-lg">91.4%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">최근 발송일시</p>
                <p className="font-medium text-sm">2025.05.10 11:42</p>
              </div>
            </div>
          </div>

          {/* 타켓마케팅 발송현황 요약 섹션 */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-purple-500">
            <h2 className="text-lg font-semibold mb-3">
              타켓마케팅 발송현황 요약
            </h2>

            <div className="w-full h-60 mb-3">
              <Bar data={campaignChartData} options={chartOptions} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">진행 중 캠페인</p>
                <p className="font-bold text-lg text-blue-600">2건</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">완료된 캠페인</p>
                <p className="font-bold text-lg">4건</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">평균 반응률</p>
                <p className="font-bold text-lg">13.5%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* 중점 현황 섹션 */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-orange-500">
            <h2 className="text-lg font-semibold mb-3">중점 현황</h2>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-sm text-gray-600">현재 이용 중인 잔액</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-bold text-lg">
                    {isLoading
                      ? "로딩 중..."
                      : formatCurrency(calculateBalance())}
                  </p>
                  <Link
                    href="/my-site/advertiser/plans"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    충전하기
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">이번 달 충전 금액</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-bold text-lg text-green-600">
                    {formatCurrency(totalChargeAmount)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">이번 달 사용 금액</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-bold text-lg text-red-600">
                    {formatCurrency(totalUsageAmount)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">이번 달 환불 금액</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-bold text-lg text-purple-600">
                    {formatCurrency(totalRefundAmount)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">발송 가능 수량</p>
                <div className="mt-1">
                  <p className="text-sm text-gray-700">
                    SMS: 약 {Math.floor(calculateBalance() / 20)}건
                  </p>
                  <p className="text-sm text-gray-700">
                    LMS: 약 {Math.floor(calculateBalance() / 50)}건
                  </p>
                  <p className="text-sm text-gray-700">
                    MMS: 약 {Math.floor(calculateBalance() / 200)}건
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 퀵 액션 섹션 */}
          <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-indigo-500">
            <h2 className="text-lg font-semibold mb-3">퀵 액션</h2>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/messages/send"
                className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-sm">📱</span>
                </div>
                <span className="text-sm font-medium">메시지 발송</span>
              </Link>

              <Link
                href="/target-marketing"
                className="flex flex-col items-center p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-sm">🎯</span>
                </div>
                <span className="text-sm font-medium">타겟마케팅</span>
              </Link>

              <Link
                href="/messages/history"
                className="flex flex-col items-center p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-sm">📊</span>
                </div>
                <span className="text-sm font-medium">발송 내역</span>
              </Link>

              <Link
                href="/my-site/advertiser/plans"
                className="flex flex-col items-center p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mb-2">
                  <span className="text-white text-sm">💳</span>
                </div>
                <span className="text-sm font-medium">요금제</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 최근 활동 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-gray-500">
          <h2 className="text-lg font-semibold mb-3">최근 활동</h2>

          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div
                      className={`w-2 h-2 ${
                        getTransactionDisplay(transaction.type).color
                      } rounded-full mr-3`}
                    ></div>
                    <div>
                      <p className="font-medium">
                        {getTransactionDisplay(transaction.type).text}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(transaction.amount)} -{" "}
                        {transaction.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatTransactionTime(transaction)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>최근 활동 내역이 없습니다.</p>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/messages/history"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              전체 활동 내역 보기 →
            </Link>
          </div>
        </div>
      </div>
    </AdvertiserLoginRequiredGuard>
  );
}
