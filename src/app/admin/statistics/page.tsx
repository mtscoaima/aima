"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import MemberStatistics from "./components/MemberStatistics";
import CampaignStatistics from "./components/CampaignStatistics";
import "./styles.css";

type MainTab = "member" | "campaign";

export default function StatisticsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>("member");

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-dashboard">
        <div className="admin-main">
          <div className="admin-header">
            <h1>통계 관리</h1>
          </div>

          {/* 메인 탭 네비게이션 */}
          <div className="tab-navigation">
            <button
              className={`tab-button ${activeTab === "member" ? "active" : ""}`}
              onClick={() => setActiveTab("member")}
            >
              회원 통계
            </button>
            <button
              className={`tab-button ${activeTab === "campaign" ? "active" : ""}`}
              onClick={() => setActiveTab("campaign")}
            >
              캠페인 통계
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="tab-container">
            {activeTab === "member" && <MemberStatistics />}
            {activeTab === "campaign" && <CampaignStatistics />}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
