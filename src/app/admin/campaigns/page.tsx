"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
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
  target_criteria: Record<string, unknown>;
  message_template: string;
  schedule_start_date?: string;
  schedule_end_date?: string;
  schedule_send_time_start?: string;
  schedule_send_time_end?: string;
  schedule_timezone: string;
  schedule_days_of_week: number[];
}

export default function CampaignsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingCampaignId, setProcessingCampaignId] = useState<
    number | null
  >(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

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
        return "status-badge scheduled";
      case "REVIEWING":
        return "status-badge scheduled";
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
            <div className="campaigns-content-wrapper">
              <div className="campaigns-section">
                <div className="section-header">
                  <h2>캠페인 목록</h2>
                  <p>전체 {campaigns.length}개의 캠페인을 관리합니다.</p>
                </div>

                <div className="campaigns-table-container">
                  {campaigns.length === 0 ? (
                    <div className="no-data">
                      등록된 캠페인이 없습니다.
                    </div>
                  ) : (
                    <table className="campaigns-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>캠페인명</th>
                          <th>상태</th>
                          <th>생성일</th>
                          <th>액션</th>
                        </tr>
                      </thead>
                      <tbody>
                        {campaigns.map((campaign) => (
                          <tr key={campaign.id}>
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
                              {(campaign.status === "PENDING_APPROVAL" || 
                                campaign.status === "REVIEWING") && (
                                <>
                                  <button
                                    className="action-btn approve-btn"
                                    onClick={() => handleApprove(campaign.id)}
                                    disabled={
                                      processingCampaignId === campaign.id
                                    }
                                  >
                                    {processingCampaignId === campaign.id
                                      ? "처리중..."
                                      : "승인"}
                                  </button>
                                  <button
                                    className="action-btn reject-btn"
                                    onClick={() => handleReject(campaign.id)}
                                    disabled={
                                      processingCampaignId === campaign.id
                                    }
                                  >
                                    {processingCampaignId === campaign.id
                                      ? "처리중..."
                                      : "거부"}
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="table-footer">
                  <p>* 관리자는 모든 사용자의 캠페인을 관리할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </AdminGuard>
        </div>
      </div>
    </div>
  );
}
