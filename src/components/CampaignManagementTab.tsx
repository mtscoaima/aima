"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
  created_at: string;
  updated_at?: string;
  target_criteria: {
    gender?: string | string[];
    ageGroup?: string | string[];
    location?: {
      city?: string;
      district?: string;
    };
    cardAmount?: string;
    cardTime?: {
      startTime?: string;
      endTime?: string;
      period?: string;
    };
    sendPolicy?: string;
    cardUsageIndustry?: string;
    costPerItem?: number;
    dailyMaxCount?: number;
    [key: string]: unknown;
  };
  message_templates?: {
    name: string;
    content: string;
    image_url: string;
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
  const [dateFilter, setDateFilter] = useState({
    startDate: "2025-08-07",
    endDate: "2025-08-13"
  });
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  // 더미 차트 데이터
  const getChartData = () => {
    const dates = [];
    const impressions = [];
    const clicks = [];
    
    const start = new Date(dateFilter.startDate);
    const end = new Date(dateFilter.endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }));
      // 더미 데이터 생성
      impressions.push(Math.floor(Math.random() * 400) + 200);
      clicks.push(Math.floor(Math.random() * 150) + 50);
    }
    
    return { dates, impressions, clicks };
  };
  
  const [campaigns, setCampaigns] = useState<RealCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // 캠페인 선택 관련
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);

  // 캠페인 이름 수정 관련
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState("");

  // 모달 상태들


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

  // 날짜 피커 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    };

    if (isDatePickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDatePickerOpen]);

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

  const toggleDatePicker = () => {
    setIsDatePickerOpen(!isDatePickerOpen);
  };

  const handleDateChange = (type: 'start' | 'end', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [type === 'start' ? 'startDate' : 'endDate']: value
    }));
  };

  // 차트 렌더링 함수
  const renderChart = () => {
    const { dates, impressions, clicks } = getChartData();
    const maxValue = Math.max(...impressions, ...clicks);
    const chartWidth = 800;
    const chartHeight = 200;
    const padding = 40;
    
    const xStep = (chartWidth - padding * 2) / (dates.length - 1);
    const yScale = (chartHeight - padding * 2) / maxValue;
    
    const impressionPoints = impressions.map((value, index) => 
      `${padding + index * xStep},${chartHeight - padding - value * yScale}`
    ).join(' ');
    
    const clickPoints = clicks.map((value, index) =>
      `${padding + index * xStep},${chartHeight - padding - value * yScale}`
    ).join(' ');
    
    return (
      <div className="bg-white rounded-lg border p-4 mb-4">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* 격자선 */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y축 라벨 */}
          {[0, 200, 400, 600].map(value => (
            <g key={value}>
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
          
          {/* 노출수 선 (파란색) */}
          <polyline
            points={impressionPoints}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* 클릭수 선 (초록색) */}
          <polyline
            points={clickPoints}
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          
          {/* 범례 */}
          <g transform={`translate(${chartWidth - 120}, 30)`}>
            <rect x="0" y="0" width="12" height="2" fill="#3b82f6" />
            <text x="18" y="8" className="text-xs fill-gray-700">노출수</text>
            <rect x="0" y="20" width="12" height="2" fill="#10b981" />
            <text x="18" y="28" className="text-xs fill-gray-700">클릭수</text>
          </g>
        </svg>
      </div>
    );
  };

  // 헬퍼 함수들
  const isCampaignActive = (status: string) => {
    return status === "active" || status === "approved" || status === "running";
  };







  const getApprovalStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "registered":
        return "등록";
      case "reviewing":
        return "승인중";
      case "pending":
        return "승인대기";
      case "approved":
        return "승인완료";
      case "rejected":
        return "반려";
      default:
        return "등록";
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

  // 캠페인 이름 수정 관련 함수들
  const startEditingCampaignName = (campaignId: number, currentName: string) => {
    setEditingCampaignId(campaignId);
    setEditingCampaignName(currentName);
  };

  const cancelEditingCampaignName = () => {
    setEditingCampaignId(null);
    setEditingCampaignName("");
  };

  const saveEditingCampaignName = async (campaignId: number) => {
    if (!editingCampaignName.trim()) {
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
          name: editingCampaignName.trim()
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, name: editingCampaignName.trim() }
              : campaign
          )
        );
        setEditingCampaignId(null);
        setEditingCampaignName("");
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
        {/* 날짜 범위 선택기 */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={toggleDatePicker}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <span className="text-sm text-gray-700">{formatDateRange()}</span>
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* 날짜 선택 드롭다운 */}
            {isDatePickerOpen && (
              <div className="absolute top-full left-0 mt-1 p-4 bg-white border border-gray-300 rounded-lg shadow-lg z-30 min-w-[300px]">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">시작일</label>
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => handleDateChange('start', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">종료일</label>
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => handleDateChange('end', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      onClick={() => setIsDatePickerOpen(false)}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                    >
                      취소
                    </button>
                    <button
                      onClick={() => setIsDatePickerOpen(false)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                    >
                      적용
                    </button>
                  </div>
                </div>
              </div>
            )}
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
                <td className="px-4 py-3 text-center text-sm">전체 캠페인 합계:</td>
                <td className="px-4 py-3 text-center text-sm">-</td>
                <td className="px-4 py-3 text-center text-sm">-</td>
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
                <td className="px-4 py-3 text-center text-sm text-gray-400">-</td>
                <td className="px-4 py-3 text-center text-sm text-gray-400">-</td>
                <td className="px-4 py-3 text-center text-sm text-gray-400">-</td>
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
                const openRate = sentCount > 0 ? ((openCount / sentCount) * 100).toFixed(1) : '0.0';

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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                        isActive 
                          ? "bg-green-100 text-green-800" 
                          : "bg-gray-100 text-gray-800"
                      }`}>
                        {isActive ? 'ON' : 'OFF'}
                      </span>
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
                      {editingCampaignId === campaign.id ? (
                        <div className="flex items-center justify-center space-x-1">
                          <input
                            type="text"
                            value={editingCampaignName}
                            onChange={(e) => setEditingCampaignName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveEditingCampaignName(campaign.id);
                              } else if (e.key === "Escape") {
                                cancelEditingCampaignName();
                              }
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEditingCampaignName(campaign.id)}
                            className="px-1 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                            title="저장"
                          >
                            ✓
                          </button>
                          <button
                            onClick={cancelEditingCampaignName}
                            className="px-1 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                            title="취소"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditingCampaignName(campaign.id, campaign.name)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          title="클릭하여 수정"
                        >
                          {campaign.name}
                        </button>
                      )}
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
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-400">
                      -
                    </td>
                    
                    {/* 클릭율 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-400">
                      -
                    </td>
                    
                    {/* 전환 수 */}
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-400">
                      -
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
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        approvalStatus === "등록" ? "bg-gray-100 text-gray-800" :
                        approvalStatus === "승인중" ? "bg-yellow-100 text-yellow-800" :
                        approvalStatus === "승인대기" ? "bg-blue-100 text-blue-800" :
                        approvalStatus === "승인완료" ? "bg-green-100 text-green-800" :
                        approvalStatus === "반려" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {approvalStatus}
                      </span>
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


    </div>
  );
};

export default CampaignManagementTab;
