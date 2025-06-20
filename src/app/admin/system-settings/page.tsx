"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import "./styles.css";

export default function SystemSettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 설정 상태 관리
  const [settings, setSettings] = useState({
    portalName: "관리자 포털",
    dormantMode: false,
    timezone: "Asia/Seoul (UTC+9)",
    externalApiKey: "sk_live_xxxxxxxxxxxxxxxxxxxxxxABCD",
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = () => {
    // TODO: API 호출하여 설정 저장
    console.log("Settings saved:", settings);
    alert("변경사항이 저장되었습니다.");
  };

  const handleGenerateApiKey = () => {
    // TODO: 새 API 키 생성 로직
    const newApiKey =
      "sk_live_" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15) +
      "ABCD";
    handleSettingChange("externalApiKey", newApiKey);
  };

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-dashboard">
        <div className="admin-main">
          <div className="admin-header">
            <h1>시스템 설정 (관리자 전용)</h1>
          </div>

          <div className="settings-container">
            {/* 일반 설정 섹션 */}
            <div className="settings-section">
              <div className="section-header">
                <h2>일반 설정</h2>
                <p>시스템 전반에 적용되는 기본 설정을 관리합니다.</p>
              </div>

              <div className="setting-item">
                <label className="setting-label">포털 이름</label>
                <input
                  type="text"
                  className="setting-input"
                  value={settings.portalName}
                  onChange={(e) =>
                    handleSettingChange("portalName", e.target.value)
                  }
                />
              </div>

              <div className="setting-item">
                <div className="setting-toggle-container">
                  <div className="setting-toggle-info">
                    <label className="setting-label">점검 모드 활성화</label>
                    <p className="setting-description">
                      활성화 시 일반 사용자 접근이 차단됩니다.
                    </p>
                  </div>
                  <div className="toggle-switch">
                    <input
                      type="checkbox"
                      id="dormantMode"
                      className="toggle-input"
                      checked={settings.dormantMode}
                      onChange={(e) =>
                        handleSettingChange("dormantMode", e.target.checked)
                      }
                    />
                    <label
                      htmlFor="dormantMode"
                      className="toggle-label"
                    ></label>
                  </div>
                </div>
              </div>

              <div className="setting-item">
                <label className="setting-label">기본 시간대</label>
                <select
                  className="setting-select"
                  value={settings.timezone}
                  onChange={(e) =>
                    handleSettingChange("timezone", e.target.value)
                  }
                >
                  <option value="Asia/Seoul (UTC+9)">Asia/Seoul (UTC+9)</option>
                  <option value="America/New_York (UTC-5)">
                    America/New_York (UTC-5)
                  </option>
                  <option value="Europe/London (UTC+0)">
                    Europe/London (UTC+0)
                  </option>
                  <option value="Asia/Tokyo (UTC+9)">Asia/Tokyo (UTC+9)</option>
                </select>
              </div>
            </div>

            {/* API 키 관리 섹션 */}
            <div className="settings-section">
              <div className="section-header">
                <h2>API 키 관리</h2>
                <p>외부 연동을 위한 API 키를 관리합니다.</p>
              </div>

              <div className="setting-item">
                <label className="setting-label">외부 서비스 API 키</label>
                <div className="api-key-container">
                  <input
                    type="text"
                    className="setting-input api-key-input"
                    value={settings.externalApiKey}
                    onChange={(e) =>
                      handleSettingChange("externalApiKey", e.target.value)
                    }
                    placeholder="API 키를 입력하세요"
                  />
                  <button
                    type="button"
                    className="btn-generate-key"
                    onClick={handleGenerateApiKey}
                  >
                    재발급
                  </button>
                </div>
              </div>

              <div className="setting-item">
                <button
                  type="button"
                  className="btn-new-api-key"
                  onClick={handleGenerateApiKey}
                >
                  새 API 키 생성
                </button>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="settings-actions">
              <button
                type="button"
                className="btn-save-settings"
                onClick={handleSaveSettings}
              >
                변경사항 저장
              </button>
              <p className="settings-notice">
                * 이 페이지는 RBAC에서 기본 설정은 제외 메뉴에 있는 시스템
                관리자 권한이 있는 사용자에게만 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
