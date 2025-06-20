"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import "./styles.css";

interface Campaign {
  id: string;
  name: string;
  status: "진행중" | "완료" | "예약";
  startDate: string;
  endDate: string;
  targetCount: number;
  sentCount: number;
  openRate: string;
  clickRate: string;
}

export default function CampaignsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 샘플 캠페인 데이터
  const campaigns: Campaign[] = [
    {
      id: "CAMP001",
      name: "여름맞이 특별 할인",
      status: "진행중",
      startDate: "2024-06-15",
      endDate: "2024-07-15",
      targetCount: 12500,
      sentCount: 8750,
      openRate: "25.5%",
      clickRate: "5.2%",
    },
    {
      id: "CAMP002",
      name: "신규 고객 환영 캠페인",
      status: "완료",
      startDate: "2024-05-01",
      endDate: "2024-05-31",
      targetCount: 8000,
      sentCount: 7980,
      openRate: "30.1%",
      clickRate: "7.8%",
    },
    {
      id: "CAMP003",
      name: "추석 연휴 프로모션",
      status: "예약",
      startDate: "2024-09-01",
      endDate: "2024-09-15",
      targetCount: 20000,
      sentCount: 0,
      openRate: "N/A",
      clickRate: "N/A",
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getStatusBadgeClass = (status: Campaign["status"]) => {
    switch (status) {
      case "진행중":
        return "status-badge active";
      case "완료":
        return "status-badge completed";
      case "예약":
        return "status-badge scheduled";
      default:
        return "status-badge";
    }
  };

  const handlePause = (campaignId: string) => {
    console.log("일시정지:", campaignId);
    // TODO: 일시정지 로직 구현
  };

  const handleViewStats = (campaignId: string) => {
    console.log("통계 보기:", campaignId);
    // TODO: 통계 페이지로 이동
  };

  const handleEdit = (campaignId: string) => {
    console.log("편집:", campaignId);
    // TODO: 편집 페이지로 이동
  };

  const handleDelete = (campaignId: string) => {
    if (confirm("정말로 이 캠페인을 삭제하시겠습니까?")) {
      console.log("삭제:", campaignId);
      // TODO: 삭제 로직 구현
    }
  };

  const handleStart = (campaignId: string) => {
    console.log("캠페인 시작:", campaignId);
    // TODO: 캠페인 시작 로직 구현
  };

  const handleCreateCampaign = () => {
    console.log("새 캠페인 만들기");
    // TODO: 캠페인 생성 페이지로 이동
  };

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
                  <p>
                    진행 중이거나 예정된, 또는 완료된 캠페인들을 관리합니다.
                  </p>
                </div>

                <div className="campaigns-table-container">
                  <table className="campaigns-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>캠페인명</th>
                        <th>상태</th>
                        <th>기간</th>
                        <th>대상/발송</th>
                        <th>열람률</th>
                        <th>클릭률</th>
                        <th>액션</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((campaign) => (
                        <tr key={campaign.id}>
                          <td className="campaign-id">{campaign.id}</td>
                          <td className="campaign-name">{campaign.name}</td>
                          <td>
                            <span
                              className={getStatusBadgeClass(campaign.status)}
                            >
                              {campaign.status}
                            </span>
                          </td>
                          <td className="campaign-period">
                            {campaign.startDate} ~ {campaign.endDate}
                          </td>
                          <td className="campaign-stats">
                            {campaign.targetCount.toLocaleString()} /{" "}
                            {campaign.sentCount.toLocaleString()}
                          </td>
                          <td className="campaign-rate">{campaign.openRate}</td>
                          <td className="campaign-rate">
                            {campaign.clickRate}
                          </td>
                          <td className="campaign-actions">
                            {campaign.status === "진행중" && (
                              <button
                                className="action-btn pause-btn"
                                onClick={() => handlePause(campaign.id)}
                                title="일시정지"
                              >
                                ⏸
                              </button>
                            )}
                            {campaign.status === "예약" && (
                              <button
                                className="action-btn start-btn"
                                onClick={() => handleStart(campaign.id)}
                                title="캠페인 시작"
                              >
                                ▶️
                              </button>
                            )}
                            <button
                              className="action-btn stats-btn"
                              onClick={() => handleViewStats(campaign.id)}
                              title="통계"
                            >
                              📊
                            </button>
                            <button
                              className="action-btn edit-btn"
                              onClick={() => handleEdit(campaign.id)}
                              title="편집"
                            >
                              ✏️
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={() => handleDelete(campaign.id)}
                              title="삭제"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="table-footer">
                  <p>
                    * 새 캠페인 만들기를 클릭하면 /campaigns/new 경로로 이동하여
                    단계별 Wizard가 시작됩니다. (1단계까지 구현 예정)
                  </p>
                </div>
              </div>
            </div>
          </AdminGuard>
        </div>
      </div>
    </div>
  );
}
