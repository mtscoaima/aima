"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DynamicButton } from "@/types/targetMarketing";
import RejectionReasonModal from "@/components/modals/RejectionReasonModal";
import CampaignDetailModal from "@/components/modals/CampaignDetailModal";
import DateRangeModal from "@/components/modals/DateRangeModal";

// 캠페인 데이터 인터페이스
interface RealCampaign {
  id: number;
  name: string;
  description?: string;
  status: string;
  approval_status?: string;
  schedule_start_date?: string;
  schedule_end_date?: string;
  budget?: number;
  actual_cost?: number;
  total_recipients?: number;
  sent_count: number;
  success_count: number;
  failed_count: number;
  click_count: number;
  conversion_count: number;
  impression_count: number;
  created_at: string;
  updated_at?: string;
  rejection_reason?: string;
  buttons?: DynamicButton[];
  desired_recipients?: string | null;
  // 새로운 개별 컬럼들
  target_age_groups?: string[];
  target_locations_detailed?: Array<{ city: string; districts: string[] } | string>;
  card_amount_max?: number;
  card_time_start?: string;
  card_time_end?: string;
  target_industry_top_level?: string;
  target_industry_specific?: string;
  unit_cost?: number;
  estimated_total_cost?: number;
  expert_review_requested?: boolean;
  expert_review_notes?: string;
  gender_ratio?: {
    female: number;
    male: number;
  };
  message_templates?: {
    name?: string;
    content?: string;
    image_url?: string;
    category?: string;
  };
}

interface CampaignManagementTabProps {
  onNavigateToNaver: () => void;
}

const CampaignManagementTab: React.FC<CampaignManagementTabProps> = ({ 
  onNavigateToNaver
}) => {
  const { user } = useAuth();

  // 간소화된 필터 상태
  const [campaignFilter, setCampaignFilter] = useState({
    isActive: "all" // "all", "on", "off"
  });

  // 날짜 필터링 상태
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 6); // 오늘 포함 7일 (6일 전부터)
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  });
  
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);

  // 차트 드롭다운 상태 - 두 개의 독립적인 지표 선택
  const [firstMetric, setFirstMetric] = useState("impressions"); // 첫 번째 선
  const [secondMetric, setSecondMetric] = useState("clicks"); // 두 번째 선
  const [isFirstDropdownOpen, setIsFirstDropdownOpen] = useState(false);
  const [isSecondDropdownOpen, setIsSecondDropdownOpen] = useState(false);
  const firstDropdownRef = useRef<HTMLDivElement>(null);
  const secondDropdownRef = useRef<HTMLDivElement>(null);

  // 차트 지표 옵션들 (새로운 DB 컬럼 사용)
  const chartMetricOptions = [
    { value: "impressions", label: "노출 수", color: "#3b82f6" },
    { value: "clicks", label: "클릭 수", color: "#10b981" },
    { value: "conversions", label: "전환 수", color: "#f59e0b" },
    { value: "opens", label: "오픈 수", color: "#ef4444" },
    { value: "sent", label: "발송 수", color: "#8b5cf6" },
    { value: "ctr", label: "클릭률", color: "#ec4899" },
    { value: "openRate", label: "오픈률", color: "#06b6d4" }
  ];
  
  // 실제 캠페인 데이터 기반 차트 데이터
  const getChartData = () => {
    const dates: string[] = [];
    const start = new Date(dateFilter.startDate);
    const end = new Date(dateFilter.endDate);
    const filteredData = getFilteredCampaigns(); // 여기서 filteredCampaigns 가져오기
    
    // 날짜 배열 생성
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }));
    }
    
    // 메트릭별 데이터 생성 함수
    const getMetricData = (metricValue: string) => {
      return dates.map(date => {
        // 해당 날짜에 생성된 캠페인들
        const dayCampaigns = filteredData.filter(campaign => {
          const campaignDate = new Date(campaign.created_at).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
          return campaignDate === date;
        });
        
        // 해당 날짜의 총합 계산
        if (metricValue === 'ctr') {
          const totalSent = dayCampaigns.reduce((sum, campaign) => sum + (campaign.sent_count || 0), 0);
          const totalClicks = dayCampaigns.reduce((sum, campaign) => sum + (campaign.click_count || 0), 0);
          return totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;
        } else if (metricValue === 'openRate') {
          const totalSent = dayCampaigns.reduce((sum, campaign) => sum + (campaign.sent_count || 0), 0);
          const totalOpens = dayCampaigns.reduce((sum, campaign) => sum + (campaign.success_count || 0), 0);
          return totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
        } else {
          return dayCampaigns.reduce((sum, campaign) => {
            switch (metricValue) {
              case 'impressions': return sum + (campaign.impression_count || 0);
              case 'clicks': return sum + (campaign.click_count || 0);
              case 'conversions': return sum + (campaign.conversion_count || 0);
              case 'opens': return sum + (campaign.success_count || 0);
              case 'sent': return sum + (campaign.sent_count || 0);
              default: return sum;
            }
          }, 0);
        }
      });
    };
    
    return { 
      dates, 
      getMetricData,
      // 기존 호환성을 위해 유지
      impressions: getMetricData('impressions'),
      clicks: getMetricData('clicks')
    };
  };
  
  const [campaigns, setCampaigns] = useState<RealCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // 캠페인 선택 관련
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);



  // 모달 상태들
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState<boolean>(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string | null>(null);
  const [selectedCampaignName, setSelectedCampaignName] = useState<string>("");
  
  // 상세보기 모달
  const [isCampaignDetailModalOpen, setIsCampaignDetailModalOpen] = useState<boolean>(false);
  const [selectedCampaignDetail, setSelectedCampaignDetail] = useState<RealCampaign | null>(null);


  // 상세보기 모달 열기
  const handleViewCampaignDetail = async (campaignId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('캠페인 정보를 불러올 수 없습니다.');
      }

      const data = await response.json();
      setSelectedCampaignDetail(data.campaign);
      setIsCampaignDetailModalOpen(true);
    } catch (error) {
      console.error('캠페인 상세 정보 조회 실패:', error);
      alert('캠페인 상세 정보를 불러올 수 없습니다.');
    }
  };

  // 캠페인 네비게이션
  const handleCampaignNavigate = (direction: 'prev' | 'next') => {
    const filteredCampaigns = getFilteredCampaigns();
    if (!selectedCampaignDetail) return;
    
    const currentIndex = filteredCampaigns.findIndex(c => c.id === selectedCampaignDetail.id);
    let newIndex: number;
    
    if (direction === 'prev') {
      newIndex = currentIndex - 1;
    } else {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex >= 0 && newIndex < filteredCampaigns.length) {
      const nextCampaign = filteredCampaigns[newIndex];
      handleViewCampaignDetail(nextCampaign.id);
    }
  };

  // 현재 캠페인 인덱스 계산
  const getCurrentCampaignIndex = () => {
    if (!selectedCampaignDetail) return 0;
    const filteredCampaigns = getFilteredCampaigns();
    return filteredCampaigns.findIndex(c => c.id === selectedCampaignDetail.id);
  };

  // 반려사유 조회
  const handleViewRejectionReason = async (campaignId: number, campaignName: string) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('캠페인 정보를 불러올 수 없습니다.');
      }

      const data = await response.json();
      setSelectedRejectionReason(data.campaign.rejection_reason);
      setSelectedCampaignName(campaignName);
      setIsRejectionModalOpen(true);
    } catch (error) {
      console.error('반려사유 조회 실패:', error);
      alert('반려사유를 불러올 수 없습니다.');
    }
  };

  // 캠페인 데이터 로드
  const loadRealCampaigns = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingCampaigns(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("토큰이 없습니다.");
        return;
      }

      const response = await fetch("/api/campaigns", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      } else {
        console.error("캠페인 데이터 로드 실패:", response.statusText);
        setCampaigns([]);
      }
    } catch (error) {
      console.error("캠페인 데이터 로드 오류:", error);
      setCampaigns([]);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [user]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (user) {
      loadRealCampaigns();
    }
  }, [user, loadRealCampaigns]);

  // 날짜 피커와 차트 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (firstDropdownRef.current && !firstDropdownRef.current.contains(event.target as Node)) {
        setIsFirstDropdownOpen(false);
      }
      if (secondDropdownRef.current && !secondDropdownRef.current.contains(event.target as Node)) {
        setIsSecondDropdownOpen(false);
      }
    };

    if (isFirstDropdownOpen || isSecondDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFirstDropdownOpen, isSecondDropdownOpen]);

  // 날짜 관련 함수들
  const formatDateRange = () => {
    const start = new Date(dateFilter.startDate);
    const end = new Date(dateFilter.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return `지난 ${diffDays}일 : ${start.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '.')} ~ ${end.toLocaleDateString('ko-KR', {
      year: 'numeric', 
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '.')}`;
  };


  const handleDateChange = (startDate: string, endDate: string) => {
    setDateFilter({ startDate, endDate });
  };

  // 화살표 네비게이션 로직
  const navigatePeriod = (direction: 'prev' | 'next') => {
    const start = new Date(dateFilter.startDate);
    const end = new Date(dateFilter.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let newStart: Date;
    let newEnd: Date;

    if (direction === 'prev') {
      newStart = new Date(start);
      newStart.setDate(start.getDate() - diffDays - 1);
      newEnd = new Date(end);
      newEnd.setDate(end.getDate() - diffDays - 1);
    } else {
      newStart = new Date(start);
      newStart.setDate(start.getDate() + diffDays + 1);
      newEnd = new Date(end);
      newEnd.setDate(end.getDate() + diffDays + 1);
    }

    setDateFilter({
      startDate: newStart.toISOString().split('T')[0],
      endDate: newEnd.toISOString().split('T')[0]
    });
  };

  // 차트 렌더링 함수 (두 개의 선을 동시에 표시)
  const renderChart = () => {
    const { dates, getMetricData } = getChartData();
    
    const firstData = getMetricData(firstMetric);
    const secondData = getMetricData(secondMetric);
    
    // NaN 값을 0으로 대체하고 유효한 숫자만 사용
    const cleanFirstData = firstData.map(val => isNaN(val) ? 0 : val);
    const cleanSecondData = secondData.map(val => isNaN(val) ? 0 : val);
    
    const maxValue = Math.max(...cleanFirstData, ...cleanSecondData, 1); // 최소값 1로 설정
    
    const chartWidth = 1200;
    const chartHeight = 200;
    const padding = 40;
    
    const xStep = (chartWidth - padding * 2) / (dates.length - 1);
    const yScale = (chartHeight - padding * 2) / maxValue;
    
    const firstPoints = cleanFirstData.map((value, index) => 
      `${padding + index * xStep},${chartHeight - padding - value * yScale}`
    ).join(' ');
    
    const secondPoints = cleanSecondData.map((value, index) =>
      `${padding + index * xStep},${chartHeight - padding - value * yScale}`
    ).join(' ');
    
    const firstOption = chartMetricOptions.find(option => option.value === firstMetric);
    const secondOption = chartMetricOptions.find(option => option.value === secondMetric);
    
    // 동일한 지표가 선택된 경우 체크
    const isSameMetric = firstMetric === secondMetric;
    
    return (
      <div className="bg-white rounded-lg border p-4 mb-4 relative">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* 격자선 */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y축 라벨 */}
          {[0, Math.floor(maxValue * 0.25), Math.floor(maxValue * 0.5), Math.floor(maxValue * 0.75), maxValue].map((value, index) => (
            <g key={`yaxis-${index}-${value}`}>
              <text 
                x={padding - 10} 
                y={chartHeight - padding - (value * yScale)} 
                textAnchor="end" 
                className="text-xs fill-gray-500"
              >
                {value}
              </text>
              <line 
                x1={padding} 
                y1={chartHeight - padding - (value * yScale)} 
                x2={chartWidth - padding} 
                y2={chartHeight - padding - (value * yScale)} 
                stroke="#e2e8f0" 
                strokeWidth="1"
              />
            </g>
          ))}
          
          {/* X축 라벨 */}
          {dates.map((date, index) => (
            <text 
              key={index}
              x={padding + index * xStep} 
              y={chartHeight - 10} 
              textAnchor="middle" 
              className="text-xs fill-gray-500"
            >
              {date}
            </text>
          ))}
          
          {/* 첫 번째 지표 선 */}
          <polyline
            points={firstPoints}
            fill="none"
            stroke={firstOption?.color || "#3b82f6"}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* 두 번째 지표 선 (동일한 지표가 아닐 때만 표시) */}
          {!isSameMetric && (
            <polyline
              points={secondPoints}
              fill="none"
              stroke={secondOption?.color || "#10b981"}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
        </svg>
        
        {/* 차트 내부 드롭다운 (범례 위치) */}
        <div className="absolute top-4 right-8 flex space-x-2">
          {/* 첫 번째 지표 드롭다운 */}
          <div className="relative" ref={firstDropdownRef}>
            <button
              onClick={() => setIsFirstDropdownOpen(!isFirstDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1 bg-white/90 border border-gray-300 rounded-md hover:bg-white transition-colors duration-200 text-xs shadow-sm backdrop-blur-sm"
            >
              <div 
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: firstOption?.color }}
              />
              <span className="text-gray-700">
                {firstOption?.label}
              </span>
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* 첫 번째 드롭다운 메뉴 */}
            {isFirstDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-40 min-w-[120px]">
                <div className="py-1">
                  {chartMetricOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFirstMetric(option.value);
                        setIsFirstDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors duration-200 ${
                        firstMetric === option.value ? "bg-blue-50 text-blue-700" : "text-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-0.5 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        <span>{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 두 번째 지표 드롭다운 (항상 표시) */}
          <div className="relative" ref={secondDropdownRef}>
            <button
              onClick={() => setIsSecondDropdownOpen(!isSecondDropdownOpen)}
              className={`flex items-center space-x-2 px-3 py-1 border rounded-md transition-colors duration-200 text-xs shadow-sm backdrop-blur-sm ${
                isSameMetric 
                  ? 'bg-gray-100/90 border-gray-200 text-gray-400' 
                  : 'bg-white/90 border-gray-300 hover:bg-white text-gray-700'
              }`}
            >
              <div 
                className="w-3 h-0.5 rounded-full"
                style={{ backgroundColor: secondOption?.color, opacity: isSameMetric ? 0.4 : 1 }}
              />
              <span>
                {secondOption?.label}
              </span>
              <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* 두 번째 드롭다운 메뉴 */}
            {isSecondDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-40 min-w-[120px]">
                <div className="py-1">
                  {chartMetricOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSecondMetric(option.value);
                        setIsSecondDropdownOpen(false);
                      }}
                      className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors duration-200 ${
                        secondMetric === option.value ? "bg-blue-50 text-blue-700" : "text-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-0.5 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        <span>{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 헬퍼 함수들 (새로운 4개 상태 기준)
  const isCampaignActive = (status: string) => {
    // 승인완료 상태만 활성으로 처리
    return status === "APPROVED";
  };







  const getApprovalStatusText = (status: string) => {
    // 새로운 4개 상태에 맞게 수정
    switch (status?.toUpperCase()) {
      case "PENDING_APPROVAL":
        return "승인대기";
      case "REVIEWING":
        return "승인 중";
      case "APPROVED":
        return "승인완료";
      case "REJECTED":
        return "반려";
      default:
        return "승인대기";
    }
  };



  // 간소화된 필터링 함수
  const getFilteredCampaigns = () => {
    return campaigns.filter(campaign => {
      // 사용여부 필터
      if (campaignFilter.isActive !== "all") {
        const isActive = isCampaignActive(campaign.status);
        if (campaignFilter.isActive === "on" && !isActive) return false;
        if (campaignFilter.isActive === "off" && isActive) return false;
      }

      // 날짜 범위 필터 (생성일 기준)
      const campaignDate = new Date(campaign.created_at);
      const startDate = new Date(dateFilter.startDate);
      const endDate = new Date(dateFilter.endDate);
      
      // 시간을 00:00:00으로 설정하여 날짜만 비교
      campaignDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999); // 종료일은 하루의 끝까지 포함
      
      if (campaignDate < startDate || campaignDate > endDate) {
        return false;
      }

      return true;
    });
  };



  // 캠페인 선택 관련 함수들
  const handleSelectAll = (checked: boolean) => {
    const filteredCampaigns = getFilteredCampaigns();
    if (checked) {
      setSelectedCampaigns(filteredCampaigns.map(campaign => campaign.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  const handleSelectCampaign = (campaignId: number, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId]);
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
    }
  };

  // 캠페인 삭제
  const handleDeleteCampaigns = async () => {
    if (selectedCampaigns.length === 0) return;
    
    const confirmDelete = window.confirm(
      `선택한 ${selectedCampaigns.length}개의 캠페인을 삭제하시겠습니까?`
    );
    
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 선택된 각 캠페인에 대해 삭제 요청
      const deletePromises = selectedCampaigns.map(campaignId =>
        fetch(`/api/campaigns/${campaignId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);

      if (failedDeletes.length > 0) {
        alert(`${failedDeletes.length}개의 캠페인 삭제에 실패했습니다.`);
      } else {
        alert("선택한 캠페인이 모두 삭제되었습니다.");
      }

      // 성공한 삭제들을 로컬 상태에서 제거
      const succeededDeletes = responses
        .map((response, index) => ({ response, id: selectedCampaigns[index] }))
        .filter(({ response }) => response.ok)
        .map(({ id }) => id);

      setCampaigns(prev => 
        prev.filter(campaign => !succeededDeletes.includes(campaign.id))
      );
      setSelectedCampaigns([]);
    } catch (error) {
      console.error("캠페인 삭제 오류:", error);
      alert("캠페인 삭제 중 오류가 발생했습니다.");
    }
  };

  // 캠페인 상태 토글 함수
  const toggleCampaignStatus = async (campaignId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 새로운 4개 상태 체계에서는 APPROVED 상태에서만 토글 가능 (실제로는 상태 변경 없이 UI만 토글)
      // 실제 비즈니스 로직에서는 APPROVED 상태를 유지하면서 별도 필드로 활성/비활성 관리할 수 있음
      const newStatus = "APPROVED"; // 상태는 그대로 유지

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, status: newStatus }
              : campaign
          )
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "캠페인 상태 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("캠페인 상태 변경 오류:", error);
      alert("캠페인 상태 변경 중 오류가 발생했습니다.");
    }
  };

  // 캠페인 이름 수정 (모달에서 사용)
  const updateCampaignName = async (campaignId: number, newName: string) => {
    if (!newName.trim()) {
      alert("캠페인 이름을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newName.trim()
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, name: newName.trim() }
              : campaign
          )
        );
        
        // 선택된 캠페인 상세 정보도 업데이트
        setSelectedCampaignDetail(prev =>
          prev ? { ...prev, name: newName.trim() } : prev
        );
        
        alert("캠페인 이름이 수정되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "캠페인 이름 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("캠페인 이름 수정 오류:", error);
      alert("캠페인 이름 수정 중 오류가 발생했습니다.");
    }
  };







  const filteredCampaigns = getFilteredCampaigns();

  return (
    <div className="w-full p-6 bg-white">

      {/* 날짜 필터와 차트 섹션 */}
      <div className="mb-6">
        {/* 날짜 범위 선택기 - 화살표 버튼 형태 */}
        <div className="flex items-center justify-start mb-4">
          <div className="flex items-center bg-gray-100 rounded-lg">
            {/* 이전 버튼 */}
            <button
              onClick={() => navigatePeriod('prev')}
              className="p-2 border border-gray-200 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* 날짜 범위 표시 - 클릭 시 모달 열기 */}
            <button
              onClick={() => setIsDateModalOpen(true)}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-200 transition-colors min-w-[240px]"
            >
              {formatDateRange()}
            </button>
            
            {/* 다음 버튼 */}
            <button
              onClick={() => navigatePeriod('next')}
              className="p-2 border border-gray-200 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* 차트 */}
        {renderChart()}
      </div>

      {/* 간소화된 필터 섹션 */}
      <div className="flex justify-end items-center gap-4 p-4">
        {/* 캠페인사용여부 */}
        <div className="flex flex-col">
          <select 
            value={campaignFilter.isActive}
            onChange={(e) => setCampaignFilter(prev => ({ ...prev, isActive: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">캠페인사용여부</option>
            <option value="on">ON</option>
            <option value="off">OFF</option>
          </select>
        </div>

        {/* 캠페인 만들기 버튼 */}
        <div className="flex flex-col">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-medium"
            onClick={onNavigateToNaver}
          >
            캠페인 만들기
          </button>
        </div>

        {/* 캠페인 삭제 버튼 */}
        <div className="flex flex-col">
          <button 
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200 ${
              selectedCampaigns.length === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-red-600 text-white hover:bg-red-700"
            }`}
            disabled={selectedCampaigns.length === 0}
            onClick={handleDeleteCampaigns}
          >
            삭제
          </button>
        </div>
      </div>

      {/* 통합된 테이블 */}
      <div className="overflow-auto bg-white rounded-lg shadow max-h-[650px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-20">
            <tr className="h-20">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={selectedCampaigns.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">사용<br/>여부</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인 이름</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">발송 수</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">오픈 수</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">오픈율</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">클릭 수</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">클릭율</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">전환 수</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">평균 발<br/>송 비용</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">총<br/>비용</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">승인상태</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* 전체 캠페인 합계 행 */}
            {!isLoadingCampaigns && filteredCampaigns.length > 0 && (
              <tr className="bg-gray-100 font-semibold sticky top-20 z-10 border-b border-gray-300">
                <td className="px-4 py-3"></td>
                <td colSpan={3} className="px-4 py-3 text-right text-sm">전체 캠페인 합계:</td>
                <td className="px-4 py-3 text-center text-sm text-blue-600">
                  {filteredCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-600">
                  {filteredCampaigns.reduce((sum, c) => sum + (c.success_count || 0), 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-600">
                  {(() => {
                    const totalSent = filteredCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
                    const totalOpen = filteredCampaigns.reduce((sum, c) => sum + (c.success_count || 0), 0);
                    return totalSent > 0 ? `${((totalOpen / totalSent) * 100).toFixed(1)}%` : '0%';
                  })()}
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-600">
                  {filteredCampaigns.reduce((sum, c) => sum + (c.click_count || 0), 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-600">
                  {(() => {
                    const totalSent = filteredCampaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0);
                    const totalClick = filteredCampaigns.reduce((sum, c) => sum + (c.click_count || 0), 0);
                    return totalSent > 0 ? `${((totalClick / totalSent) * 100).toFixed(1)}%` : '0%';
                  })()}
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-600">
                  {filteredCampaigns.reduce((sum, c) => sum + (c.conversion_count || 0), 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-400">-</td>
                <td className="px-4 py-3 text-center text-sm text-blue-600">
                  {filteredCampaigns.reduce((sum, c) => sum + (Number(c.budget) || 0), 0).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center text-sm">-</td>
              </tr>
            )}
            {isLoadingCampaigns ? (
              <tr>
                <td colSpan={13} className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                    <span className="text-gray-500">캠페인 데이터를 불러오는 중...</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredCampaigns.map(campaign => {
                const isActive = isCampaignActive(campaign.status);
                const approvalStatus = getApprovalStatusText(campaign.status);
                const sentCount = campaign.sent_count || 0;
                const openCount = campaign.success_count || 0;
                const clickCount = campaign.click_count || 0;
                const conversionCount = campaign.conversion_count || 0;
                const openRate = sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(1) : '0.0';
                const clickRate = sentCount > 0 ? ((clickCount / sentCount) * 100).toFixed(1) : '0.0';

                return (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    {/* 체크박스 */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={selectedCampaigns.includes(campaign.id)}
                        onChange={(e) => handleSelectCampaign(campaign.id, e.target.checked)}
                      />
                    </td>
                    
                    {/* 사용여부 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => toggleCampaignStatus(campaign.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                        title={isActive ? '클릭하여 비활성화' : '클릭하여 활성화'}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                            isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    
                    {/* 생성일 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-500">
                      {new Date(campaign.created_at).toLocaleDateString("ko-KR", {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      }).replace(/\./g, '.').slice(0, -1)}
                    </td>
                    
                    {/* 캠페인 이름 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewCampaignDetail(campaign.id)}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        title="클릭하여 상세보기"
                      >
                        {campaign.name}
                      </button>
                    </td>
                    
                    {/* 발송 수 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {sentCount.toLocaleString()}
                    </td>
                    
                    {/* 오픈 수 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {openCount.toLocaleString()}
                    </td>
                    
                    {/* 오픈율 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {openRate}%
                    </td>
                    
                    {/* 클릭 수 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {clickCount.toLocaleString()}
                    </td>
                    
                    {/* 클릭율 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {clickRate}%
                    </td>
                    
                    {/* 전환 수 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {conversionCount.toLocaleString()}
                    </td>
                    
                    {/* 평균 발송 비용 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-400">
                      -
                    </td>
                    
                    {/* 총 비용 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                      {(Number(campaign.budget) || 0).toLocaleString()}
                    </td>
                    
                    {/* 승인상태 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          approvalStatus === "승인대기" ? "bg-blue-100 text-blue-800" :
                          approvalStatus === "승인 중" ? "bg-yellow-100 text-yellow-800" :
                          approvalStatus === "승인완료" ? "bg-green-100 text-green-800" :
                          approvalStatus === "반려" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {approvalStatus}
                        </span>
                        {approvalStatus === "반려" && (
                          <button
                            onClick={() => handleViewRejectionReason(campaign.id, campaign.name)}
                            className="px-2 py-1 text-xs font-medium text-red-600 hover:text-red-800 border border-red-300 hover:border-red-500 rounded-md transition-colors duration-200"
                            title="반려사유 확인"
                          >
                            사유
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            {!isLoadingCampaigns && filteredCampaigns.length === 0 && (
              <tr>
                <td colSpan={13} className="px-6 py-8 text-center text-gray-500">
                  조건에 맞는 캠페인이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 반려사유 모달 */}
      <RejectionReasonModal
        isOpen={isRejectionModalOpen}
        onClose={() => setIsRejectionModalOpen(false)}
        rejectionReason={selectedRejectionReason}
        campaignName={selectedCampaignName}
      />

      {/* 캠페인 상세보기 모달 */}
      <CampaignDetailModal
        isOpen={isCampaignDetailModalOpen}
        onClose={() => {
          setIsCampaignDetailModalOpen(false);
          setSelectedCampaignDetail(null);
        }}
        campaign={selectedCampaignDetail}
        onUpdateCampaignName={updateCampaignName}
        campaigns={getFilteredCampaigns()}
        currentIndex={getCurrentCampaignIndex()}
        onNavigate={handleCampaignNavigate}
      />

      {/* 날짜 선택 모달 */}
      <DateRangeModal
        isOpen={isDateModalOpen}
        onClose={() => setIsDateModalOpen(false)}
        startDate={dateFilter.startDate}
        endDate={dateFilter.endDate}
        onDateChange={handleDateChange}
      />

    </div>
  );
};

export default CampaignManagementTab;
