"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import Link from 'next/link';

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
    labels: ['1', '5', '10', '15', '20', '25', '30'],
    datasets: [
      {
        label: '성공',
        data: [12, 19, 8, 15, 20, 25, 18],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        tension: 0.1,
      },
      {
        label: '실패',
        data: [2, 3, 1, 4, 2, 3, 1],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
      }
    ]
  };

  // 타켓마케팅 발송 현황 차트 데이터
  const campaignChartData = {
    labels: ['캠페인A', '캠페인B', '캠페인C', '캠페인D'],
    datasets: [
      {
        label: '대상자수',
        data: [1200, 1900, 800, 1500],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: '반응률(%)',
        data: [15, 7, 20, 12],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      }
    }
  };

  return (
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
          <h2 className="text-lg font-semibold mb-3">타켓마케팅 발송현황 요약</h2>
          
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
                <Link href="/my-site/advertiser/balance/charge" className="text-sm text-blue-600 hover:underline">
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
                <p className="font-bold text-lg">약 833건</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>0</span>
                  <span>잔여: 833건</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 계정 정보 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 border-t-4 border-t-gray-500">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">계정 정보</h2>
            <Link href="/my-site/advertiser/profile" className="text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7"></line>
                <polyline points="7 7 17 7 17 17"></polyline>
              </svg>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm text-gray-600">계정고유번호</p>
              <p className="font-medium">2505 0926 0273 65 📋</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">현재 적용 서비스</p>
              <p className="font-medium">솔라피</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">발신번호 상태</p>
              <p className="text-red-500 italic">미등록 (등록 필요)</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">API Key 상태</p>
              <p className="text-red-500 italic">미등록 (등록 필요)</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 기타 중요한 정보 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 border-t-4 border-t-indigo-500">
        <h2 className="text-lg font-semibold mb-3">기타 중요한 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 캠페인별 진행 상황 */}
          <div>
            <h3 className="text-md font-medium mb-2">캠페인별 진행 상황</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b pb-2">
                <Link href="/target-marketing/campaigns/1" className="hover:text-blue-600">
                  여름 프로모션 캠페인
                </Link>
                <span className="text-sm text-gray-500">진행중 (68%)</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <Link href="/target-marketing/campaigns/2" className="hover:text-blue-600">
                  신규 회원 웰컴 캠페인
                </Link>
                <span className="text-sm text-gray-500">진행중 (42%)</span>
              </div>
            </div>
          </div>
          
          {/* 완료된 캠페인 효과 */}
          <div>
            <h3 className="text-md font-medium mb-2">완료된 캠페인 효과</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b pb-2">
                <span>봄 시즌 프로모션</span>
                <span className="text-sm text-blue-600">ROI 132%</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span>4월 재구매 캠페인</span>
                <span className="text-sm text-blue-600">ROI 118%</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* 공지사항 섹션 */}
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">공지사항</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b pb-2">
              <Link href="/customer-service/notices/1" className="hover:text-blue-600">
                250429 ~ 250430 솔라피 서비스 할증 및 전송제한 문제 안내 [해결됨]
              </Link>
              <span className="text-sm text-gray-500">25.04.30</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <Link href="/customer-service/notices/2" className="hover:text-blue-600">
                서비스 이용 약관 개정 안내 (2025년 5월 1일 시행)
              </Link>
              <span className="text-sm text-gray-500">25.04.07</span>
            </div>
            <div className="flex justify-between items-center">
              <Link href="/customer-service/notices/5" className="hover:text-blue-600">
                서비스 이용약관 변경 안내 (개정 후미/처리 절차 추가)
              </Link>
              <span className="text-sm text-gray-500">25.02.17</span>
            </div>
          </div>
          
          <div className="flex justify-end mt-2">
            <Link href="/customer-service/notices" className="text-blue-600 text-sm">전체 공지사항</Link>
          </div>
        </div>
      </div>
    </div>
  );
} 