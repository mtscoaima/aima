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
          <h2 className="text-lg font-semibold mb-3">회원 요약정보</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">회원명</p>
              <p className="font-medium">trialRklSHWH님</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">가입일</p>
              <p className="font-medium">2025.01.15</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">회원유형</p>
              <p className="font-medium">광고주</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">최근 로그인</p>
              <p className="font-medium">2025.05.10 12:27:54</p>
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
                <p className="text-sm text-gray-600">현재 이용 중인 자액</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-bold text-lg">25,000원</p>
                  <Link
                    href="/my-site/advertiser/balance/charge"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    충전하기
                  </Link>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">발송량</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="font-bold text-lg">이번 달 128건 발송 완료</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">발송 가능 수량</p>
                <div className="mt-1">
                  <p className="text-sm text-gray-700">SMS: 약 1,250건</p>
                  <p className="text-sm text-gray-700">LMS: 약 500건</p>
                  <p className="text-sm text-gray-700">MMS: 약 125건</p>
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
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">메시지 발송 완료</p>
                  <p className="text-sm text-gray-600">
                    SMS 25건 발송 완료 (성공: 24건, 실패: 1건)
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">2시간 전</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">타겟마케팅 캠페인 시작</p>
                  <p className="text-sm text-gray-600">
                    캠페인 &quot;신제품 홍보&quot; 실행 시작
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">5시간 전</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <p className="font-medium">잔액 충전</p>
                  <p className="text-sm text-gray-600">
                    30만원 충전 완료 (신용카드)
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500">1일 전</span>
            </div>
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
