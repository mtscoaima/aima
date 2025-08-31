"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
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
  Title,
  Tooltip,
  Legend
);

interface AdCostData {
  recent7Days: {
    startDate: string;
    endDate: string;
    totalCost: number;
  };
  previous7Days: {
    startDate: string;
    endDate: string;
    totalCost: number;
  };
}

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const { balanceData, formatCurrency, isLoading: isBalanceLoading, calculatePoints } = useBalance();

  // 사용자 정보 상태
  const [userData, setUserData] = useState<UserInfoResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 광고비 데이터 상태
  const [adCostData, setAdCostData] = useState<AdCostData | null>(null);
  const [isAdCostLoading, setIsAdCostLoading] = useState(true);
  
  // 캠페인 현황 날짜 상태
  const [campaignDateRange, setCampaignDateRange] = useState(() => {
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6); // 오늘 포함 7일
    return { startDate, endDate };
  });

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

  // 광고비 데이터 로드
  const loadAdCostData = useCallback(async () => {
    try {
      setIsAdCostLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      const response = await fetch("/api/campaigns/ad-costs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("광고비 데이터 로드 실패");
      }

      const result = await response.json();
      if (result.success) {
        setAdCostData(result.data);
      }
    } catch (error) {
      console.error("광고비 데이터 로드 실패:", error);
    } finally {
      setIsAdCostLoading(false);
    }
  }, []);

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
      loadAdCostData();
    }
  }, [user, loadAdCostData]);

  // 차트 설정
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: '#f0f0f0',
        },
      },
    },
    elements: {
      line: {
        tension: 0.1,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
  };

     // 각 차트별 데이터 - 현재 선택된 날짜 범위에 따라 라벨 생성
   const generateChartLabels = () => {
     const labels = [];
     const startDate = new Date(campaignDateRange.startDate);
     
     for (let i = 0; i < 7; i++) {
       const currentDate = new Date(startDate);
       currentDate.setDate(startDate.getDate() + i);
       const month = String(currentDate.getMonth() + 1).padStart(2, '0');
       const day = String(currentDate.getDate()).padStart(2, '0');
       labels.push(`${month}.${day}`);
     }
     
     return labels;
   };

   const chartData = {
     labels: generateChartLabels(),
     datasets: [
       {
         data: [100, 110, 105, 125, 95, 80, 110], // 7일 데이터
         borderColor: '#3b82f6',
         backgroundColor: '#3b82f6',
         borderWidth: 2,
       },
     ],
   };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 캠페인 날짜 포맷팅 함수
  const formatCampaignDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 날짜 범위 이동 함수
  const moveDateRange = (direction: 'prev' | 'next') => {
    setCampaignDateRange(current => {
      const newStartDate = new Date(current.startDate);
      const newEndDate = new Date(current.endDate);
      
      if (direction === 'prev') {
        // 이전 7일로 이동
        newStartDate.setDate(current.startDate.getDate() - 7);
        newEndDate.setDate(current.endDate.getDate() - 7);
      } else {
        // 이후 7일로 이동 (단, 오늘을 넘지 않도록)
        const today = new Date();
        const potentialEndDate = new Date(current.endDate);
        potentialEndDate.setDate(current.endDate.getDate() + 7);
        
        if (potentialEndDate <= today) {
          newStartDate.setDate(current.startDate.getDate() + 7);
          newEndDate.setDate(current.endDate.getDate() + 7);
        } else {
          // 오늘을 넘지 않는 범위에서 최대한 이동
          newEndDate.setTime(today.getTime());
          newStartDate.setTime(today.getTime());
          newStartDate.setDate(today.getDate() - 6);
        }
      }
      
      return { startDate: newStartDate, endDate: newEndDate };
    });
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
          {/* 상단 3개 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 광고비 합계 카드 */}
            <div className="bg-white rounded-xl border-2 border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">광고비 합계</h3>
              {isAdCostLoading ? (
                <div className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ) : adCostData ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      최근 7일 <span className="text-xs">({formatDate(adCostData.recent7Days.startDate)} ~ {formatDate(adCostData.recent7Days.endDate)})</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{adCostData.recent7Days.totalCost.toLocaleString()} 원</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">
                      이전 7일 <span className="text-xs">({formatDate(adCostData.previous7Days.startDate)} ~ {formatDate(adCostData.previous7Days.endDate)})</span>
                    </div>
                    <div className="text-xl font-medium text-gray-700">{adCostData.previous7Days.totalCost.toLocaleString()} 원</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  데이터를 불러올 수 없습니다
                </div>
              )}
            </div>

                         {/* 충전금/적립금 카드 */}
             <div className="bg-white rounded-xl border-2 border-gray-300 p-6 flex flex-col justify-center">
               <div className="space-y-4">
                 {isBalanceLoading ? (
                   <div className="animate-pulse">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="text-center">
                         <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
                         <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
                       </div>
                       <div className="text-center border-l pl-4">
                         <div className="h-4 bg-gray-200 rounded w-3/4 mb-2 mx-auto"></div>
                         <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
                       </div>
                     </div>
                     <div className="flex justify-center pt-2">
                       <div className="h-9 bg-gray-200 rounded w-20"></div>
                     </div>
                   </div>
                 ) : (
                   <>
                     <div className="grid grid-cols-2 gap-4">
                       <div className="text-center">
                         <div className="text-sm text-gray-900 font-semibold mb-1">충전금</div>
                         <div className="text-xl text-gray-900">{formatCurrency(balanceData.balance)}</div>
                       </div>
                       <div className="text-center border-l pl-4">
                       <div className="text-sm text-gray-900 font-semibold mb-1">적립금</div>
                         <div className="text-xl text-gray-900">{calculatePoints().toLocaleString()} 원</div>
                       </div>
                     </div>
                     <div className="flex justify-center pt-2">
                       <Link href="/credit-management" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 inline-block">
                         충전하기
                       </Link>
                     </div>
                   </>
                 )}
               </div>
             </div>

            {/* 주변업체 모니터링 카드 */}
            <div className="bg-white rounded-xl border-2 border-gray-300 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">주변업체 모니터링</h3>
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg">준비중입니다</div>
              </div>
            </div>
          </div>

          {/* 캠페인 현황 섹션 */}
          <div className="bg-white p-6">
                         <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                 캠페인 현황
               </h3>
               <div className="flex items-center gap-4">
                 <button 
                   onClick={() => moveDateRange('prev')}
                   className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                   </svg>
                 </button>
                 <span className="text-gray-600">
                   지난 7일 : {formatCampaignDate(campaignDateRange.startDate)} ~ {formatCampaignDate(campaignDateRange.endDate)}
                 </span>
                 <button 
                   onClick={() => moveDateRange('next')}
                   className={`transition-colors ${
                     campaignDateRange.endDate.toDateString() === new Date().toDateString()
                       ? 'text-gray-300 cursor-not-allowed'
                       : 'text-gray-400 hover:text-gray-600'
                   }`}
                   disabled={campaignDateRange.endDate.toDateString() === new Date().toDateString()}
                 >
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                     <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                   </svg>
                 </button>
               </div>
             </div>

            {/* 4개 차트 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* 발송 차트 */}
              <div className="text-center">
                <h4 className="text-base font-medium text-gray-700 mb-4">발송</h4>
                <div className="h-48 mb-2">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* 오픈 차트 */}
              <div className="text-center">
                <h4 className="text-base font-medium text-gray-700 mb-4">오픈 (Imp.)</h4>
                <div className="h-48 mb-2">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* 클릭 차트 */}
              <div className="text-center">
                <h4 className="text-base font-medium text-gray-700 mb-4">클릭</h4>
                <div className="h-48 mb-2">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>

              {/* 전환 차트 */}
              <div className="text-center">
                <h4 className="text-base font-medium text-gray-700 mb-4">전환</h4>
                <div className="h-48 mb-2">
                  <Line data={chartData} options={chartOptions} />
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
