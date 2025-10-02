"use client";

import React, { useState, useEffect } from "react";
import RoleGuard from "@/components/RoleGuard";
import { useRouter } from 'next/navigation';
import { useAuth } from "@/contexts/AuthContext";

interface Space {
  id: number;
  name: string;
  icon_text: string;
  icon_color: string;
}

interface SpaceStatistic {
  space_id: number;
  space_name: string;
  icon_text: string;
  icon_color: string;
  total_amount: number;
  reservation_count: number;
  guest_count: number;
  percentage: number;
}

interface ChannelStatistic {
  channel: string;
  channel_name: string;
  total_amount: number;
  reservation_count: number;
  guest_count: number;
  percentage: number;
}

interface StatisticsData {
  summary: {
    total_amount: number;
    total_reservations: number;
    total_guests: number;
  };
  space_statistics: SpaceStatistic[];
  channel_statistics: ChannelStatistic[];
  spaces: Space[];
}

export default function ReservationStatisticsPage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();

  const now = new Date();
  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonthNum, setCurrentMonthNum] = useState(now.getMonth() + 1);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("all");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [statistics, setStatistics] = useState<StatisticsData | null>(null);

  const handleBack = () => {
    router.back();
  };

  const handlePrevMonth = () => {
    if (currentMonthNum === 1) {
      setCurrentYear(currentYear - 1);
      setCurrentMonthNum(12);
    } else {
      setCurrentMonthNum(currentMonthNum - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthNum === 12) {
      setCurrentYear(currentYear + 1);
      setCurrentMonthNum(1);
    } else {
      setCurrentMonthNum(currentMonthNum + 1);
    }
  };

  const getCurrentMonthString = () => {
    return `${currentYear}년 ${currentMonthNum.toString().padStart(2, '0')}월`;
  };

  // 통계 데이터 로드
  const fetchStatistics = async () => {
    setIsLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('인증이 필요합니다. 로그인을 다시 시도해주세요.');
        return;
      }

      const params = new URLSearchParams({
        year: currentYear.toString(),
        month: currentMonthNum.toString(),
        space_id: selectedSpaceId
      });

      const response = await fetch(`/api/reservations/statistics?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Statistics API error:', errorData);
        throw new Error(errorData.error || '통계 데이터를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      alert(error instanceof Error ? error.message : '통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 년/월 변경 시 통계 데이터 재로드
  useEffect(() => {
    fetchStatistics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentYear, currentMonthNum]);

  // 공간 선택 변경 시 통계 데이터 재로드
  useEffect(() => {
    if (statistics) {
      fetchStatistics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSpaceId]);

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('ko-KR');
  };

  // Excel 다운로드 함수
  const handleDownloadExcel = async () => {
    setIsDownloading(true);

    try {
      const token = await getAccessToken();
      if (!token) {
        alert('인증이 필요합니다. 로그인을 다시 시도해주세요.');
        return;
      }

      // URL 매개변수 설정
      const params = new URLSearchParams({
        year: currentYear.toString(),
        month: currentMonthNum.toString(),
        space_id: selectedSpaceId
      });

      const response = await fetch(`/api/reservations/export/excel?${params}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '엑셀 다운로드에 실패했습니다.');
      }

      // Excel 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `예약내역_${currentYear}년_${currentMonthNum}월.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Excel download error:', error);
      alert(error instanceof Error ? error.message : '엑셀 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  const hasData = statistics && statistics.summary.total_reservations > 0;

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={handleBack}
            className="mr-4 p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            통계
          </h1>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-center mb-8">
          <button onClick={handlePrevMonth} className="p-2 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <h2 className="text-lg font-semibold text-gray-900 mx-6">
            {getCurrentMonthString()}
          </h2>
          <button onClick={handleNextMonth} className="p-2 text-gray-400">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-500">통계를 불러오는 중...</p>
          </div>
        ) : hasData ? (
          <>
            {/* Summary Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">전체 공간</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{formatAmount(statistics?.summary.total_amount || 0)}원</div>
                  <div className="text-sm text-gray-500">
                    예약 {statistics?.summary.total_reservations || 0}건 인원 {statistics?.summary.total_guests || 0}명
                  </div>
                </div>
              </div>
            </div>

            {/* Space Statistics */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">공간별 통계</h3>

              {statistics?.space_statistics && statistics.space_statistics.length > 0 ? (
                <>
                  {/* Progress Bars */}
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-4 flex overflow-hidden">
                    {statistics.space_statistics.map((space) => (
                      <div
                        key={space.space_id}
                        className="h-4"
                        style={{
                          width: `${space.percentage}%`,
                          backgroundColor: space.icon_color
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* Space Items */}
                  <div className="space-y-3">
                    {statistics.space_statistics.map((space) => (
                      <div key={space.space_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold mr-4"
                            style={{ backgroundColor: space.icon_color }}
                          >
                            {space.icon_text}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{space.space_name}</div>
                            <div className="text-sm text-gray-500">{space.percentage.toFixed(0)}%</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{formatAmount(space.total_amount)}원</div>
                          <div className="text-sm text-gray-500">{space.reservation_count}건 {space.guest_count}명</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  공간별 통계가 없습니다.
                </div>
              )}
            </div>

            {/* Reservation Channel Statistics */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">예약 채널별 통계</h3>

              {/* Dropdown */}
              <div className="relative mb-4">
                <select
                  value={selectedSpaceId}
                  onChange={(e) => setSelectedSpaceId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white appearance-none cursor-pointer"
                >
                  <option value="all">전체 공간</option>
                  {statistics?.spaces.map((space) => (
                    <option key={space.id} value={space.id.toString()}>
                      {space.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>

              {statistics?.channel_statistics && statistics.channel_statistics.length > 0 ? (
                <>
                  {/* Progress Bars */}
                  <div className="w-full bg-gray-200 rounded-full h-6 mb-4 flex overflow-hidden">
                    {statistics.channel_statistics.map((channel, index) => {
                      const colors = ['#EAB308', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                      return (
                        <div
                          key={channel.channel}
                          className="h-6"
                          style={{
                            width: `${channel.percentage}%`,
                            backgroundColor: colors[index % colors.length]
                          }}
                        ></div>
                      );
                    })}
                  </div>

                  {/* Channel Items */}
                  <div className="space-y-3">
                    {statistics.channel_statistics.map((channel, index) => {
                      const colors = ['#EAB308', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                      return (
                        <div key={channel.channel} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div
                              className="w-6 h-6 rounded mr-4"
                              style={{ backgroundColor: colors[index % colors.length] }}
                            ></div>
                            <div>
                              <div className="font-medium text-gray-900">{channel.channel_name}</div>
                              <div className="text-sm text-gray-500">{channel.percentage.toFixed(0)}%</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{formatAmount(channel.total_amount)}원</div>
                            <div className="text-sm text-gray-500">{channel.reservation_count}건 {channel.guest_count}명</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  예약 채널별 통계가 없습니다.
                </div>
              )}
            </div>

            {/* Footer Note */}
            <div className="text-center mb-6">
              <p className="text-sm text-gray-500">
                • 통계는 실시간으로 반영되지만 약간의 시차가 발생할 수 있습니다.
              </p>
            </div>

            {/* Download Button */}
            <div className="text-center">
              <button
                onClick={handleDownloadExcel}
                disabled={isDownloading}
                className="text-gray-600 underline text-sm hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDownloading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    다운로드 중...
                  </span>
                ) : (
                  '이 달의 예약 데이터 다운로드하기'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Empty State - Summary Card */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">전체 공간</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">0원</div>
                  <div className="text-sm text-gray-500">예약 0건 인원 0명</div>
                </div>
              </div>
            </div>

            {/* Empty State Message */}
            <div className="text-center py-20">
              <p className="text-gray-500">
                표시할 내용이 없습니다.
              </p>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
