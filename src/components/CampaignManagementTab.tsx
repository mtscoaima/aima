"use client";

import React, { useState, useEffect, useCallback } from "react";
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

  // 캠페인 관리 탭 상태
  const [campaignManagementTab, setCampaignManagementTab] = useState<"overview" | "management">("overview");
  const [campaignFilter, setCampaignFilter] = useState({
    isActive: "all", // "all", "on", "off"
    period: "전체기간",
    searchType: "전체",
    searchKeyword: ""
  });
  
  const [campaigns, setCampaigns] = useState<RealCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // 캠페인 관리 탭 전용 상태
  const [managementFilter, setManagementFilter] = useState({
    approvalStatus: "all", // "all", "pending", "approved", "rejected", "reviewing", "registered"
    searchType: "전체",
    searchKeyword: ""
  });

  // 캠페인 선택 관련
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);

  // 캠페인 이름 수정 관련
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState("");

  // 모달 상태들
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<RealCampaign | null>(null);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [selectedRejectionCampaign, setSelectedRejectionCampaign] = useState<RealCampaign | null>(null);

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

  // 헬퍼 함수들
  const isCampaignActive = (status: string) => {
    return status === "active" || status === "approved" || status === "running";
  };

  const formatAmountToKorean = (amount: number | string) => {
    let num = typeof amount === "string" ? parseFloat(amount.replace(/[^\d.-]/g, "")) : amount;
    
    if (isNaN(num)) num = 0;
    
    if (num >= 100000) {
      const millions = Math.floor(num / 10000);
      const remainder = num % 10000;
      if (remainder === 0) {
        return `${millions.toLocaleString()}만원`;
      } else {
        return `${millions.toLocaleString()}만 ${remainder.toLocaleString()}원`;
      }
    } else {
      return `${num.toLocaleString()}원`;
    }
  };

  const getSendPolicy = (campaign: RealCampaign) => {
    const criteria = campaign.target_criteria as { sendPolicy?: string };
    return criteria?.sendPolicy === "realtime" ? "실시간 발송" : "일괄 발송";
  };

  const getValidPeriod = (campaign: RealCampaign) => {
    if (campaign.schedule_start_date && campaign.schedule_end_date) {
      const start = new Date(campaign.schedule_start_date);
      const end = new Date(campaign.schedule_end_date);
      return `${start.toLocaleDateString("ko-KR")} ~ ${end.toLocaleDateString("ko-KR")}`;
    }
    return "-";
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

  const generateTargetInfo = (campaign: RealCampaign) => {
    const criteria = campaign.target_criteria as {
      gender?: string | string[];
      ageGroup?: string | string[];
      location?: { city?: string; district?: string };
    };

    const parts: string[] = [];

    // 성별 정보
    if (criteria.gender) {
      const gender = Array.isArray(criteria.gender) ? criteria.gender.join(",") : criteria.gender;
      if (gender === "male") parts.push("남성");
      else if (gender === "female") parts.push("여성");
      else if (gender === "all" || gender === "male,female") parts.push("전체");
      else parts.push(gender);
    }

    // 연령 정보
    if (criteria.ageGroup) {
      const age = Array.isArray(criteria.ageGroup) ? criteria.ageGroup.join(",") : criteria.ageGroup;
      parts.push(age.replace("_", "-") + "세");
    }

    // 지역 정보
    if (criteria.location) {
      if (criteria.location.city) {
        let locationStr = criteria.location.city;
        if (criteria.location.district) {
          locationStr += ` ${criteria.location.district}`;
        }
        parts.push(locationStr);
      }
    }

    return parts.join(" · ") || "전체";
  };

  // 필터링 함수들
  const getFilteredCampaigns = () => {
    return campaigns.filter(campaign => {
      // 사용여부 필터
      if (campaignFilter.isActive !== "all") {
        const isActive = isCampaignActive(campaign.status);
        if (campaignFilter.isActive === "on" && !isActive) return false;
        if (campaignFilter.isActive === "off" && isActive) return false;
      }

      // 기간 필터 (생성일 기준)
      if (campaignFilter.period !== "전체기간") {
        const now = new Date();
        const createdDate = new Date(campaign.created_at);
        
        switch (campaignFilter.period) {
          case "최근 1주일":
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (createdDate < oneWeekAgo) return false;
            break;
          case "최근 1개월":
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (createdDate < oneMonthAgo) return false;
            break;
          case "최근 3개월":
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            if (createdDate < threeMonthsAgo) return false;
            break;
        }
      }

      // 검색 필터
      if (campaignFilter.searchKeyword && campaignFilter.searchKeyword.trim()) {
        const keyword = campaignFilter.searchKeyword.toLowerCase().trim();
        
        if (campaignFilter.searchType === "캠페인 이름") {
          return campaign.name.toLowerCase().includes(keyword);
        } else if (campaignFilter.searchType === "발송정책") {
          const sendPolicy = getSendPolicy(campaign);
          return sendPolicy.toLowerCase().includes(keyword);
        } else {
          // 전체 검색
          return campaign.name.toLowerCase().includes(keyword) ||
                 getSendPolicy(campaign).toLowerCase().includes(keyword);
        }
      }

      return true;
    });
  };

  const getFilteredManagementCampaigns = () => {
    return campaigns.filter(campaign => {
      // 승인상태 필터
      if (managementFilter.approvalStatus !== "all") {
        const status = getApprovalStatusText(campaign.status);
        if (status !== managementFilter.approvalStatus) return false;
      }

      // 검색 필터
      if (managementFilter.searchKeyword && managementFilter.searchKeyword.trim()) {
        const keyword = managementFilter.searchKeyword.toLowerCase().trim();
        
        if (managementFilter.searchType === "캠페인 이름") {
          return campaign.name.toLowerCase().includes(keyword);
        } else if (managementFilter.searchType === "타깃정보") {
          const targetInfo = generateTargetInfo(campaign);
          return targetInfo.toLowerCase().includes(keyword);
        } else {
          // 전체 검색
          return campaign.name.toLowerCase().includes(keyword) ||
                 generateTargetInfo(campaign).toLowerCase().includes(keyword);
        }
      }

      return true;
    });
  };

  // 캠페인 상태 토글
  const toggleCampaignStatus = async (campaignId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      const isCurrentlyActive = isCampaignActive(campaign.status);
      const newStatus = isCurrentlyActive ? "inactive" : "active";

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setCampaigns(prev =>
          prev.map(c =>
            c.id === campaignId ? { ...c, status: newStatus } : c
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

  // 캠페인 선택 관련 함수들
  const handleSelectAll = (checked: boolean) => {
    const filteredCampaigns = getFilteredManagementCampaigns();
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

  // 관리 버튼 렌더링
  const renderManagementButtons = (campaign: RealCampaign) => {
    const status = getApprovalStatusText(campaign.status);

    switch (status) {
      case "등록":
        return (
          <>
            <button 
              className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors duration-200"
              onClick={() => openEditModal(campaign)}
            >
              수정
            </button>
            <button 
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-200"
              onClick={() => handleApprovalRequest(campaign.id)}
            >
              승인요청
            </button>
          </>
        );
      
      case "승인중":
        return (
          <button 
            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors duration-200"
            onClick={() => handleCancelRequest(campaign.id)}
          >
            승인취소
          </button>
        );
      
      case "승인대기":
        return (
          <button 
            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors duration-200"
            onClick={() => handleCancelRequest(campaign.id)}
          >
            승인취소
          </button>
        );
      
      case "승인완료":
        return (
          <button 
            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors duration-200"
            onClick={() => handleViewResults(campaign.id)}
          >
            결과보기
          </button>
        );
      
      case "반려":
        return (
          <>
            <button 
              className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors duration-200"
              onClick={() => openRejectionModal(campaign)}
            >
              반려사유
            </button>
            <button 
              className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors duration-200"
              onClick={() => openEditModal(campaign)}
            >
              수정요청
            </button>
          </>
        );
      
      default:
        return null;
    }
  };

  // 모달 및 액션 함수들
  const openEditModal = (campaign: RealCampaign) => {
    setEditingCampaign(campaign);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCampaign(null);
  };

  const openRejectionModal = (campaign: RealCampaign) => {
    setSelectedRejectionCampaign(campaign);
    setIsRejectionModalOpen(true);
  };

  const closeRejectionModal = () => {
    setIsRejectionModalOpen(false);
    setSelectedRejectionCampaign(null);
  };

  const handleApprovalRequest = async (campaignId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch(`/api/campaigns/${campaignId}/approval-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("승인 요청이 전송되었습니다.");
        // 상태 업데이트
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, status: "reviewing" }
              : campaign
          )
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "승인 요청에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 요청 오류:", error);
      alert("승인 요청 중 오류가 발생했습니다.");
    }
  };

  const handleCancelRequest = async (campaignId: number) => {
    const confirmCancel = window.confirm("승인 요청을 취소하시겠습니까?");
    if (!confirmCancel) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch(`/api/campaigns/${campaignId}/cancel-request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        alert("승인 요청이 취소되었습니다.");
        // 상태 업데이트
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, status: "registered" }
              : campaign
          )
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "승인 취소에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 취소 오류:", error);
      alert("승인 취소 중 오류가 발생했습니다.");
    }
  };

  const handleViewResults = (campaignId: number) => {
    // 결과 보기 구현
    alert(`캠페인 ${campaignId}의 결과를 확인합니다.`);
  };

  const filteredCampaigns = getFilteredCampaigns();
  const filteredManagementCampaigns = getFilteredManagementCampaigns();

  return (
    <div className="w-full p-6 bg-white">
      {/* 캠페인현황/캠페인관리 탭 버튼 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`px-6 py-3 font-medium text-sm transition-colors duration-200 border-b-2 ${
            campaignManagementTab === "overview" 
              ? "text-blue-600 border-blue-600" 
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
          onClick={() => setCampaignManagementTab("overview")}
        >
          캠페인현황
        </button>
        <button 
          className={`px-6 py-3 font-medium text-sm transition-colors duration-200 border-b-2 ${
            campaignManagementTab === "management" 
              ? "text-blue-600 border-blue-600" 
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
          onClick={() => setCampaignManagementTab("management")}
        >
          캠페인관리
        </button>
      </div>

      {/* 캠페인현황 탭 */}
      {campaignManagementTab === "overview" && (
        <>
          {/* 필터 섹션 */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
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

            {/* 기간 */}
            <div className="flex flex-col">
              <select 
                value={campaignFilter.period}
                onChange={(e) => setCampaignFilter(prev => ({ ...prev, period: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="전체기간">최근 기간</option>
                <option value="최근 1주일">최근 1주일</option>
                <option value="최근 1개월">최근 1개월</option>
                <option value="최근 3개월">최근 3개월</option>
              </select>
            </div>

            {/* 검색항목 */}
            <div className="flex flex-col">
              <select 
                value={campaignFilter.searchType}
                onChange={(e) => setCampaignFilter(prev => ({ ...prev, searchType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="전체">검색항목</option>
                <option value="캠페인 이름">캠페인 이름</option>
                <option value="발송정책">발송정책</option>
              </select>
            </div>

            {/* 검색창 */}
            <div className="flex">
              <input
                type="text"
                placeholder="정보 검색"
                value={campaignFilter.searchKeyword}
                onChange={(e) => setCampaignFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors duration-200">
                🔍
              </button>
            </div>
          </div>

          {/* 테이블 */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용여부</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인 이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인 비용(건)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발송정책</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유효기간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일 최대 건수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">광고 수신자 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인 총 비용</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발송 성공 수</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">반응율</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingCampaigns ? (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                        <span className="text-gray-500">캠페인 데이터를 불러오는 중...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map(campaign => {
                    const isActive = isCampaignActive(campaign.status);
                    const sendPolicy = getSendPolicy(campaign);
                    const validPeriod = getValidPeriod(campaign);
                    const criteria = campaign.target_criteria as {
                      costPerItem?: number;
                      dailyMaxCount?: number;
                    };

                    return (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            className={`w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              isActive 
                                ? "bg-green-500 focus:ring-green-500" 
                                : "bg-gray-300 focus:ring-gray-300"
                            }`}
                            onClick={() => toggleCampaignStatus(campaign.id)}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 ${
                              isActive ? "translate-x-6" : "translate-x-0.5"
                            }`}></div>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{campaign.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatAmountToKorean(criteria?.costPerItem || 100)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sendPolicy}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{validPeriod || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{criteria?.dailyMaxCount ? `${criteria.dailyMaxCount}건` : "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{campaign.total_recipients ? `${campaign.total_recipients.toLocaleString()}명` : "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatAmountToKorean(campaign.actual_cost || campaign.budget || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sendPolicy === "실시간 발송"
                            ? `${campaign.sent_count}건`
                            : `${campaign.sent_count}명`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-green-600 font-medium">{campaign.success_count}성공</span>{" "}
                          <span className="text-red-600 font-medium">{campaign.failed_count}실패</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(campaign.created_at).toLocaleDateString("ko-KR")}</td>
                      </tr>
                    );
                  })
                )}
                {!isLoadingCampaigns && filteredCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center text-gray-500">
                      조건에 맞는 캠페인이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 캠페인관리 탭 */}
      {campaignManagementTab === "management" && (
        <>
          {/* 관리 필터 섹션 */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            {/* 승인상태로 검색 */}
            <div className="flex flex-col">
              <select 
                value={managementFilter.approvalStatus}
                onChange={(e) => setManagementFilter(prev => ({ ...prev, approvalStatus: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">승인상태</option>
                <option value="registered">등록</option>
                <option value="reviewing">승인중</option>
                <option value="pending">승인대기</option>
                <option value="approved">승인완료</option>
                <option value="rejected">반려</option>
              </select>
            </div>

            {/* 검색항목 */}
            <div className="flex flex-col">
              <select 
                value={managementFilter.searchType}
                onChange={(e) => setManagementFilter(prev => ({ ...prev, searchType: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="전체">검색항목</option>
                <option value="캠페인 이름">캠페인 이름</option>
                <option value="타깃정보">타깃정보</option>
              </select>
            </div>

            {/* 검색창 */}
            <div className="flex">
              <input
                type="text"
                placeholder="정보 검색"
                value={managementFilter.searchKeyword}
                onChange={(e) => setManagementFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-l-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 transition-colors duration-200">
                🔍
              </button>
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
                캠페인 삭제
              </button>
            </div>
          </div>

          {/* 관리 테이블 */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={selectedCampaigns.length === filteredManagementCampaigns.length && filteredManagementCampaigns.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인 이름</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">타깃정보</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카드사용업종</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카드 승인 금액</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카드 승인 시간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">승인상태</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoadingCampaigns ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                        <span className="text-gray-500">캠페인 데이터를 불러오는 중...</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredManagementCampaigns.map(campaign => {
                    const approvalStatus = getApprovalStatusText(campaign.status);
                    const criteria = campaign.target_criteria as {
                      costPerItem?: number;
                      cardUsageIndustry?: string;
                      cardAmount?: string;
                      cardTime?: {
                        startTime?: string;
                        endTime?: string;
                        period?: string;
                      };
                    };

                    return (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            checked={selectedCampaigns.includes(campaign.id)}
                            onChange={(e) => handleSelectCampaign(campaign.id, e.target.checked)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingCampaignId === campaign.id ? (
                            <div className="flex items-center space-x-2">
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
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => saveEditingCampaignName(campaign.id)}
                                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors duration-200"
                                  title="저장"
                                >
                                  저장
                                </button>
                                <button
                                  onClick={cancelEditingCampaignName}
                                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors duration-200"
                                  title="취소"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{campaign.name}</span>
                              <button
                                onClick={() => startEditingCampaignName(campaign.id, campaign.name)}
                                className="text-xs text-blue-600 hover:text-blue-800 transition-colors duration-200"
                                title="이름 수정"
                              >
                                수정
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{generateTargetInfo(campaign)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{criteria?.cardUsageIndustry || "여행"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatAmountToKorean(criteria?.cardAmount || "10000")}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{criteria?.cardTime ? `${criteria.cardTime.startTime || "8:00"}~${criteria.cardTime.endTime || "12:00"}` : "8:00~12:00"}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {renderManagementButtons(campaign)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
                {!isLoadingCampaigns && filteredManagementCampaigns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      조건에 맞는 캠페인이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* 여기에 모달들 추가 예정 */}
      {/* 수정 모달 */}
      {isEditModalOpen && editingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeEditModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">캠페인 수정</h2>
              <button 
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200" 
                onClick={closeEditModal}
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-700">캠페인 &quot;{editingCampaign.name}&quot; 수정 기능은 준비 중입니다.</p>
            </div>
          </div>
        </div>
      )}

      {/* 반려사유 모달 */}
      {isRejectionModalOpen && selectedRejectionCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeRejectionModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">반려 사유</h2>
              <button 
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200" 
                onClick={closeRejectionModal}
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-sm font-medium text-gray-700">검토자: 관리자</div>
                  <div className="text-sm text-gray-500">2024년 3월 15일</div>
                </div>
                <div className="text-gray-700 mb-4">
                  캠페인의 타겟 설정과 메시지 내용을 다음과 같이 수정해주세요.
                </div>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      <span className="text-sm text-red-700">타겟 연령대를 더 구체적으로 설정해주세요.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      <span className="text-sm text-red-700">메시지 내용이 광고성이 너무 강합니다. 고객 관점에서 수정해주세요.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-400 mr-2">•</span>
                      <span className="text-sm text-red-700">이미지 해상도를 높여주세요.</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-6 flex justify-end">
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                    onClick={closeRejectionModal}
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManagementTab;
