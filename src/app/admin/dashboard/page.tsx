"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import "./styles.css";

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 시스템 오류 건수 (실제로는 API에서 가져올 데이터)
  const systemErrorCount = 0;

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
        {/* Main Content */}
        <div className="admin-main">
          <div className="admin-header">
            <h1>대시보드</h1>
            <div className="admin-actions">
              <button className="btn-secondary">빠른 메시지 발송</button>
              <button className="btn-primary">새 캠페인 만들기</button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">✈️</div>
              <div className="stat-content">
                <h3>총 발송 메시지</h3>
                <div className="stat-number">1,234,567건</div>
                <div className="stat-subtitle positive">+5.2% (지난주)</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>활성 캠페인 수</h3>
                <div className="stat-number">12개</div>
                <div className="stat-subtitle positive">+2 (이번달)</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>일일 평균 발송량</h3>
                <div className="stat-number">45,678건</div>
                <div className="stat-subtitle negative">-1.5% (어제)</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                {systemErrorCount > 0 ? "❌" : "⏰"}
              </div>
              <div className="stat-content">
                <h3>시스템 오류</h3>
                <div className="stat-number">{systemErrorCount}건</div>
                <div
                  className={`stat-subtitle ${
                    systemErrorCount > 0 ? "negative" : "neutral"
                  }`}
                >
                  {systemErrorCount > 0 ? "오류 발생" : "안정"}
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="system-status">
            <h2>시스템 상태</h2>
            <p>현재 시스템은 정상적으로 운영 중입니다. (최근 24시간 기준)</p>
            <div className="status-indicator">
              <span className="status-label success">모든 시스템 정상</span>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="dashboard-bottom">
            {/* Real-time Sending Status */}
            <div className="dashboard-section">
              <h2>실시간 발송 현황 (예시)</h2>
              <div className="empty-state">
                <p>실시간 차트가 여기에 표시됩니다.</p>
              </div>
            </div>

            {/* Recent Sending Logs */}
            <div className="dashboard-section">
              <h2>최근 발송 로그 (상위 5건)</h2>
              <div className="log-list">
                <div className="log-item">
                  <div className="log-info">
                    <span className="log-id">MSG001 (SMS)</span>
                    <span className="log-status success">성공</span>
                  </div>
                  <div className="log-time">10:35 AM</div>
                </div>
                <div className="log-item">
                  <div className="log-info">
                    <span className="log-id">MSG002 (Email)</span>
                    <span className="log-status failed">실패</span>
                  </div>
                  <div className="log-time">10:32 AM</div>
                </div>
                <div className="log-item">
                  <div className="log-info">
                    <span className="log-id">MSG003 (Kakao)</span>
                    <span className="log-status success">성공</span>
                  </div>
                  <div className="log-time">10:30 AM</div>
                </div>
                <div className="log-item">
                  <div className="log-info">
                    <span className="log-id">MSG004 (SMS)</span>
                    <span className="log-status success">성공</span>
                  </div>
                  <div className="log-time">10:28 AM</div>
                </div>
                <div className="log-item">
                  <div className="log-info">
                    <span className="log-id">MSG005 (Email)</span>
                    <span className="log-status pending">대기</span>
                  </div>
                  <div className="log-time">10:25 AM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
