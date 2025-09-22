"use client";

import { useState, useEffect, useMemo } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import CampaignDetailModal from "@/components/modals/CampaignDetailModal";
import { DynamicButton } from "@/types/targetMarketing";
import "./styles.css";

interface Campaign {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  status: "PENDING_APPROVAL" | "REVIEWING" | "APPROVED" | "REJECTED";
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  total_recipients: number;
  sent_count: number;
  success_count: number;
  failed_count: number;
  budget?: number;
  actual_cost?: number;
  approved_by?: number;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  message_template: string;
  schedule_start_date?: string;
  schedule_end_date?: string;
  schedule_send_time_start?: string;
  schedule_send_time_end?: string;
  schedule_timezone: string;
  schedule_days_of_week: number[];
  template_id?: number;
  desired_recipients?: string;
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
  users?: {
    username?: string;
    name: string;
    email: string;
    phone_number: string;
    company_info?: {
      companyName?: string;
    };
  };
  message_templates?: {
    name?: string;
    content?: string;
    image_url?: string;
    category?: string;
    buttons?: DynamicButton[];
  };
}

export default function CampaignsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingCampaignId, setProcessingCampaignId] = useState<
    number | null
  >(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const pageSizeOptions = [5, 10, 20, 50, 100];

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // 검색어나 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // 필터링된 캠페인 목록
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      // 검색어 필터링
      const matchesSearch = 
        campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.users?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.users?.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 상태 필터링
      const matchesStatus = statusFilter === "ALL" || campaign.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTerm, statusFilter]);

  // 상태별 카운트
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: campaigns.length,
      PENDING_APPROVAL: 0,
      REVIEWING: 0,
      APPROVED: 0,
      REJECTED: 0,
    };
    campaigns.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return counts;
  }, [campaigns]);

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCampaigns = filteredCampaigns.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
      }

      // 관리자는 모든 캠페인을 볼 수 있어야 하므로 직접 Supabase에서 조회
      const response = await fetch("/api/admin/campaigns", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        // 토큰이 만료되었거나 유효하지 않음
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        throw new Error("인증이 만료되었습니다. 다시 로그인해주세요.");
      }

      if (response.status === 403) {
        throw new Error("관리자 권한이 필요합니다.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || "캠페인 데이터를 불러오는데 실패했습니다."
        );
      }

      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      console.error("캠페인 조회 오류:", err);

      const errorMessage =
        err instanceof Error
          ? err.message
          : "캠페인 조회 중 오류가 발생했습니다.";
      setError(errorMessage);

      // 인증 오류인 경우 5초 후 로그인 페이지로 리다이렉트
      if (errorMessage.includes("로그인") || errorMessage.includes("인증")) {
        setTimeout(() => {
          window.location.href = "/login";
        }, 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getStatusBadgeClass = (status: Campaign["status"]) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "status-badge pending";
      case "REVIEWING":
        return "status-badge reviewing";
      case "REJECTED":
        return "status-badge rejected";
      case "APPROVED":
        return "status-badge approved";
      default:
        return "status-badge approved";
    }
  };

  const getStatusDisplayText = (status: Campaign["status"]) => {
    switch (status) {
      case "PENDING_APPROVAL":
        return "승인 대기";
      case "REVIEWING":
        return "검토 중";
      case "REJECTED":
        return "거부됨";
      case "APPROVED":
        return "승인됨";
      default:
        return "승인됨";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("ko-KR");
  };


  const handleApprove = async (campaignId: number) => {
    if (!confirm("이 캠페인을 승인하시겠습니까?")) return;

    if (processingCampaignId) return; // 이미 처리 중인 경우 방지

    try {
      setProcessingCampaignId(campaignId);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        `/api/admin/campaigns/${campaignId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        // 즉시 테이블 업데이트 (네트워크 요청 없이)
        setCampaigns((prevCampaigns) =>
          prevCampaigns.map((campaign) =>
            campaign.id === campaignId
              ? {
                  ...campaign,
                  status: "APPROVED" as const,
                  approved_at: new Date().toISOString(),
                }
              : campaign
          )
        );
        alert("캠페인이 승인되었습니다.");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "승인 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 오류:", error);
      alert(
        `승인 처리 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setProcessingCampaignId(null);
    }
  };

  const handleReject = async (campaignId: number) => {
    const reason = prompt("거부 사유를 입력해주세요:");
    if (!reason || reason.trim().length === 0) return;

    if (processingCampaignId) return; // 이미 처리 중인 경우 방지

    try {
      setProcessingCampaignId(campaignId);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        `/api/admin/campaigns/${campaignId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: reason.trim() }),
        }
      );

      if (response.ok) {
        // 즉시 테이블 업데이트
        setCampaigns((prevCampaigns) =>
          prevCampaigns.map((campaign) =>
            campaign.id === campaignId
              ? {
                  ...campaign,
                  status: "REJECTED" as const,
                  rejection_reason: reason.trim(),
                }
              : campaign
          )
        );
        alert("캠페인이 거부되었습니다.");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "거부 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("거부 오류:", error);
      alert(
        `거부 처리 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setProcessingCampaignId(null);
    }
  };

  const handleCreateCampaign = () => {
    console.log("새 캠페인 만들기");
    // TODO: 캠페인 생성 페이지로 이동
  };

  const handleViewDetail = (campaign: Campaign) => {
    const index = filteredCampaigns.findIndex(c => c.id === campaign.id);
    setCurrentIndex(index);
    setSelectedCampaign(campaign);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCampaign(null);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    let newIndex = currentIndex;
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < filteredCampaigns.length - 1) {
      newIndex = currentIndex + 1;
    }
    
    setCurrentIndex(newIndex);
    setSelectedCampaign(filteredCampaigns[newIndex]);
  };

  const handleResetSearch = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // 테이블 상단으로 스크롤
    document.querySelector('.campaigns-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1); // 페이지 크기 변경 시 첫 페이지로 이동
  };

  const convertCampaignToModalFormat = (campaign: Campaign) => {
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      approval_status: campaign.status,
      schedule_start_date: campaign.schedule_start_date,
      schedule_end_date: campaign.schedule_end_date,
      budget: campaign.budget,
      actual_cost: campaign.actual_cost,
      total_recipients: campaign.total_recipients,
      sent_count: campaign.sent_count,
      success_count: campaign.success_count,
      failed_count: campaign.failed_count,
      created_at: campaign.created_at,
      updated_at: campaign.updated_at,
      rejection_reason: campaign.rejection_reason,
      buttons: campaign.message_templates?.buttons,
      desired_recipients: campaign.desired_recipients,
      // 새로운 개별 컬럼들
      target_age_groups: campaign.target_age_groups,
      target_locations_detailed: campaign.target_locations_detailed,
      card_amount_max: campaign.card_amount_max,
      card_time_start: campaign.card_time_start,
      card_time_end: campaign.card_time_end,
      target_industry_top_level: campaign.target_industry_top_level,
      target_industry_specific: campaign.target_industry_specific,
      unit_cost: campaign.unit_cost,
      estimated_total_cost: campaign.estimated_total_cost,
      expert_review_requested: campaign.expert_review_requested,
      expert_review_notes: campaign.expert_review_notes,
      gender_ratio: campaign.gender_ratio,
      message_templates: campaign.message_templates
    };
  };

  // 캠페인 이름 업데이트 함수 (관리자용)
  const updateCampaignName = async (campaignId: number | string, newName: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newName })
      });

      if (!response.ok) {
        throw new Error('캠페인 이름 수정 실패');
      }

      // 캠페인 목록 새로고침
      await fetchCampaigns();
      
      // 선택된 캠페인 업데이트
      if (selectedCampaign && selectedCampaign.id === campaignId) {
        setSelectedCampaign({ ...selectedCampaign, name: newName });
      }
    } catch (error) {
      console.error('캠페인 이름 수정 실패:', error);
      alert('캠페인 이름 수정에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <AdminHeader onToggleSidebar={toggleSidebar} />
        <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="campaigns-page">
          <div className="campaigns-main-container">
            <AdminGuard>
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <h2>캠페인 데이터 로딩 중</h2>
                <p>잠시만 기다려주세요...</p>
              </div>
            </AdminGuard>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <AdminHeader onToggleSidebar={toggleSidebar} />
        <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
        <div className="campaigns-page">
          <div className="campaigns-main-container">
            <AdminGuard>
              <div className="error-container">
                <div className="error-icon">⚠️</div>
                <h2>데이터 로딩 실패</h2>
                <p className="error-message">{error}</p>
                <div className="error-actions">
                  <button onClick={fetchCampaigns} className="btn-primary">
                    다시 시도
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-secondary"
                  >
                    페이지 새로고침
                  </button>
                </div>
                <div className="error-help">
                  <small>
                    {error &&
                    (error.includes("로그인") || error.includes("인증"))
                      ? "5초 후 자동으로 로그인 페이지로 이동합니다."
                      : "문제가 계속되면 로그아웃 후 다시 로그인해보세요."}
                  </small>
                </div>
              </div>
            </AdminGuard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="campaigns-page">
        <div className="campaigns-main-container">
          <AdminGuard>
            <div className="campaigns-header">
              <h1>캠페인 관리</h1>
              <button className="btn-primary" onClick={handleCreateCampaign}>
                새 캠페인 만들기
              </button>
            </div>
            
            {/* 검색 및 필터 영역 */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="캠페인명, 생성자명, 아이디(로그인), 이메일 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="status-filter"
              >
                <option value="ALL">모든 상태</option>
                <option value="PENDING_APPROVAL">승인 대기</option>
                <option value="REVIEWING">검토 중</option>
                <option value="APPROVED">승인됨</option>
                <option value="REJECTED">거부됨</option>
              </select>
              
              <button
                onClick={handleResetSearch}
                className="btn-reset"
              >
                초기화
              </button>
              
              <div className="search-results-info">
                전체 {campaigns.length}개 중 {filteredCampaigns.length}개 캠페인
              </div>

              {/* 상태 빠른 필터 칩 */}
              <div className="status-chips">
                <div
                  className={`status-chip all ${statusFilter === 'ALL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('ALL')}
                  title="전체"
                >
                  전체 <span className="count">{statusCounts.ALL || 0}</span>
                </div>
                <div
                  className={`status-chip pending ${statusFilter === 'PENDING_APPROVAL' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('PENDING_APPROVAL')}
                  title="승인 대기"
                >
                  승인 대기 <span className="count">{statusCounts.PENDING_APPROVAL || 0}</span>
                </div>
                <div
                  className={`status-chip reviewing ${statusFilter === 'REVIEWING' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('REVIEWING')}
                  title="검토 중"
                >
                  검토 중 <span className="count">{statusCounts.REVIEWING || 0}</span>
                </div>
                <div
                  className={`status-chip approved ${statusFilter === 'APPROVED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('APPROVED')}
                  title="승인됨"
                >
                  승인됨 <span className="count">{statusCounts.APPROVED || 0}</span>
                </div>
                <div
                  className={`status-chip rejected ${statusFilter === 'REJECTED' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('REJECTED')}
                  title="거부됨"
                >
                  거부됨 <span className="count">{statusCounts.REJECTED || 0}</span>
                </div>
              </div>
            </div>
            <div className="campaigns-content-wrapper">
              <div className="campaigns-section">
                <div className="section-header">
                  <h2>캠페인 목록</h2>
                  <p>전체 {campaigns.length}개의 캠페인을 관리합니다.</p>
                </div>

                <div className="campaigns-table-container">
                  {filteredCampaigns.length === 0 ? (
                    <div className="no-data">
                      {campaigns.length === 0 
                        ? "등록된 캠페인이 없습니다." 
                        : "검색 조건에 맞는 캠페인이 없습니다."}
                    </div>
                  ) : (
                    <table className="campaigns-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>캠페인명</th>
                          <th>사업자명</th>
                          <th>생성자</th>
                          <th>아이디</th>
                          <th>상태</th>
                          <th>생성일</th>
                          <th>액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentCampaigns.map((campaign) => (
                          <tr key={campaign.id} onClick={() => handleViewDetail(campaign)} style={{cursor: 'pointer'}}>
                            <td className="campaign-id">{campaign.id}</td>
                            <td className="campaign-name">
                              <div>
                                <strong>{campaign.name}</strong>
                                {campaign.description && (
                                  <div className="campaign-description">
                                    {campaign.description}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="campaign-company">{campaign.users?.company_info?.companyName || '-'}</td>
                            <td className="campaign-owner">{campaign.users?.name || '-'}</td>
                            <td className="campaign-owner-id">{campaign.users?.username || '-'}</td>
                            <td className="campaign-status">
                              <span
                                className={getStatusBadgeClass(campaign.status)}
                              >
                                {getStatusDisplayText(campaign.status)}
                              </span>
                            </td>
                            <td className="campaign-date">
                              {formatDate(campaign.created_at)}
                            </td>
                            <td className="campaign-actions">
                              <button
                                className="action-btn view-btn"
                                onClick={(e) => { e.stopPropagation(); handleViewDetail(campaign); }}
                              >
                                상세보기
                              </button>
                              <button
                                className="action-btn approve-btn"
                                onClick={(e) => { e.stopPropagation(); handleApprove(campaign.id); }}
                                disabled={
                                  processingCampaignId === campaign.id ||
                                  campaign.status === "APPROVED" ||
                                  campaign.status === "REJECTED"
                                }
                              >
                                {processingCampaignId === campaign.id
                                  ? "처리중..."
                                  : "승인"}
                              </button>
                              <button
                                className="action-btn reject-btn"
                                onClick={(e) => { e.stopPropagation(); handleReject(campaign.id); }}
                                disabled={
                                  processingCampaignId === campaign.id ||
                                  campaign.status === "APPROVED" ||
                                  campaign.status === "REJECTED"
                                }
                              >
                                {processingCampaignId === campaign.id
                                  ? "처리중..."
                                  : "거부"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* 페이지네이션 */}
                {filteredCampaigns.length > 0 && (
                  <div className="pagination-container">
                    <div className="pagination-left">
                      <div className="pagination-info">
                        {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCampaigns.length)} 
                        / 전체 {filteredCampaigns.length}개
                      </div>
                      
                      <div className="page-size-selector">
                        <span className="page-size-label">페이지당</span>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          className="page-size-select"
                        >
                          {pageSizeOptions.map(size => (
                            <option key={size} value={size}>
                              {size}개
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {totalPages > 1 && (
                      <div className="pagination-buttons">
                      <button
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                        className="pagination-button nav-button"
                        title="첫 페이지"
                      >
                        ««
                      </button>
                      
                      <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 1}
                        className="pagination-button nav-button"
                        title="이전 페이지"
                      >
                        ‹
                      </button>
                      
                      {/* 페이지 번호 버튼들 */}
                      {(() => {
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, currentPage + 2);
                        const pages = [];
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => handlePageChange(i)}
                              className={`pagination-button ${currentPage === i ? 'active' : ''}`}
                            >
                              {i}
                            </button>
                          );
                        }
                        
                        return pages;
                      })()}
                      
                      <button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="pagination-button nav-button"
                        title="다음 페이지"
                      >
                        ›
                      </button>
                      
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="pagination-button nav-button"
                        title="마지막 페이지"
                      >
                        »»
                      </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="table-footer">
                  <p>* 관리자는 모든 사용자의 캠페인을 관리할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </AdminGuard>
        </div>
      </div>

      {/* 캠페인 상세보기 모달 */}
      {selectedCampaign && (
        <CampaignDetailModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          campaign={convertCampaignToModalFormat(selectedCampaign)}
          onUpdateCampaignName={updateCampaignName}
          campaigns={filteredCampaigns.map(convertCampaignToModalFormat)}
          currentIndex={currentIndex}
          onNavigate={handleNavigate}
          isAdminView={true}
        />
      )}
    </div>
  );
}
