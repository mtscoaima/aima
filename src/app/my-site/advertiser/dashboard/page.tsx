"use client";

import React, { useState, useEffect } from "react";
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
import { getUserInfo, UserInfoResponse } from "@/lib/api";

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
  const { formatCurrency, calculateBalance } = useBalance();

  // 사용자 정보 상태
  const [userData, setUserData] = useState<UserInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 회사 정보 존재 여부 확인 함수
  const hasCompanyInfo = (userData: UserInfoResponse | null): boolean => {
    if (!userData?.companyInfo) {
      return false;
    }

    // 필수 정보 중 하나라도 있으면 회사 정보가 있다고 판단
    const { companyName, ceoName, businessNumber } = userData.companyInfo;
    return !!(companyName || ceoName || businessNumber);
  };

  // 인증 상태 텍스트 반환 함수
  const getApprovalStatusText = (status?: string, hasCompanyInfo?: boolean) => {
    // 회사 정보가 없으면 미인증
    if (!hasCompanyInfo) {
      return "미인증";
    }

    switch (status) {
      case "APPROVED":
        return "승인완료";
      case "REJECTED":
        return "승인거절";
      case "PENDING":
        return "승인대기";
      default:
        return "미인증";
    }
  };

  // 인증 상태 색상 반환 함수
  const getApprovalStatusColor = (
    status?: string,
    hasCompanyInfo?: boolean
  ) => {
    // 회사 정보가 없으면 회색 배지
    if (!hasCompanyInfo) {
      return "bg-gray-100 text-gray-800";
    }

    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const userInfo = await getUserInfo();
        setUserData(userInfo);
      } catch (error) {
        console.error("사용자 정보 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

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
      <div className="dashboard-container pt-8">
        {/* 상단 파란색 배너 - 승인 완료 상태가 아닐 때만 표시 */}
        {!isLoading && userData && userData.approval_status !== "APPROVED" && (
          <div className="max-w-7xl mx-auto px-4 mb-6">
            <div className="bg-blue-500 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-white">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-lg font-medium">사업자 정보 인증</h1>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getApprovalStatusColor(
                          userData.approval_status,
                          hasCompanyInfo(userData)
                        )}`}
                      >
                        {getApprovalStatusText(
                          userData.approval_status,
                          hasCompanyInfo(userData)
                        )}
                      </span>
                    </div>
                    <p className="text-sm opacity-90">
                      원활한 에이마 서비스 이용을 위해 기업 정보를 인증해
                      주세요.
                    </p>
                  </div>
                </div>
                <div className="flex-1"></div>
                <Link
                  href="/my-site/advertiser/business-verification"
                  className="bg-blue-50 border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-100 inline-block"
                >
                  사업자 정보 인증
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4">
          {/* 3개 카드 레이아웃 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* 회원정보 카드 */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-50 flex flex-col justify-between">
              <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold mb-4">{user?.name}님</h2>
                <p className="text-gray-600 mb-6">
                  {userData?.username ||
                    userData?.email ||
                    user?.email ||
                    "example1234"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/my-site/advertiser/profile"
                  className="flex-1 bg-blue-50 border border-blue-600 text-blue-600 py-2 px-4 rounded text-sm hover:bg-blue-100 text-center"
                >
                  회원정보변경
                </Link>
                <Link
                  href="/my-site/advertiser/profile?tab=businessInfo"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded text-sm hover:bg-blue-600 text-center"
                >
                  사업자정보변경
                </Link>
              </div>
            </div>

            {/* 요금제 카드 */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">요금제</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">회원요금제</span>
                  <Link href="/credit-management" className="font-medium">
                    <span className="text-black hover:text-blue-600">
                      {user?.payment_mode === "prepaid"
                        ? "선불 요금제"
                        : "후불 요금제"}
                    </span>{" "}
                    <span className="text-blue-600">&gt;</span>
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">캠페인요금제</span>
                  <Link href="/credit-management" className="font-medium">
                    <span className="text-black hover:text-blue-600">
                      미사용
                    </span>{" "}
                    <span className="text-blue-600">&gt;</span>
                  </Link>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">잔액</span>
                    <Link
                      href="/credit-management"
                      className="text-blue-600 hover:underline"
                    >
                      충전하기 &gt;
                    </Link>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">충전금</span>
                    <span className="font-medium">
                      {formatCurrency(calculateBalance())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">포인트</span>
                    <span className="font-medium">
                      {Math.floor(calculateBalance() / 20)} P
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 문자 발신번호 카드 */}
            <div className="bg-white rounded-lg shadow p-4 border border-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">문자 발신번호</h2>
                <Link
                  href="/my-site/advertiser/profile?tab=sendingNumber"
                  className="text-blue-600 text-sm hover:underline"
                >
                  발신번호관리 &gt;
                </Link>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">기본발신번호</span>
                  <span className="font-medium">010-222-5357</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">인증완료</span>
                  <span className="font-medium">1건</span>
                </div>
              </div>
            </div>
          </div>

          {/* 차트 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 메시지 발송현황 요약 */}
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-green-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">메시지 발송현황 요약</h2>
                <div className="flex items-center gap-2">
                  <Link
                    href="/messages/history"
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    자세히보기
                  </Link>
                  <span className="text-gray-500 text-sm">(이번 달)</span>
                </div>
              </div>

              <div className="h-64 mb-4">
                <Line data={messageChartData} options={chartOptions} />
              </div>

              <div className="grid grid-cols-5 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">총 발송건수</p>
                  <p className="font-bold text-lg">128건</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">성공건수</p>
                  <p className="font-bold text-lg text-blue-600">117건</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">실패건수</p>
                  <p className="font-bold text-lg text-red-600">11건</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">성공률</p>
                  <p className="font-bold text-lg">91.4%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">최근 발송일시</p>
                  <p className="font-medium text-sm">
                    2025.05.10
                    <br />
                    11:42
                  </p>
                </div>
              </div>
            </div>

            {/* 타겟마케팅 캠페인 현황 */}
            <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-purple-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  타겟마케팅 캠페인 현황
                </h2>
                <Link
                  href="/messages/history"
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  자세히보기
                </Link>
              </div>

              <div className="h-64 mb-4">
                <Bar data={campaignChartData} options={chartOptions} />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">진행 중 캠페인</p>
                  <p className="font-bold text-lg text-blue-600">2건</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">완료된 캠페인</p>
                  <p className="font-bold text-lg">4건</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">평균 반응률</p>
                  <p className="font-bold text-lg">13.5%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .dashboard-container {
          padding-bottom: 2rem;
        }

        body .main-layout {
          min-height: auto !important;
        }

        body .main-content {
          min-height: auto !important;
        }
      `}</style>
    </AdvertiserLoginRequiredGuard>
  );
}
