"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import { tokenManager } from "@/lib/api";
import "./styles.css";

export default function SystemSettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 설정 상태 관리
  const [settings, setSettings] = useState({
    portalName: "관리자 포털",
    dormantMode: false,
    timezone: "Asia/Seoul (UTC+9)",
    externalApiKey: "sk_live_xxxxxxxxxxxxxxxxxxxxxxABCD",
    firstLevelCommissionRate: 10, // 1차 추천 수수료 비율 (고정)
    nthLevelDenominator: 20, // n차 수수료 계산용 분모
  });

  // 컴포넌트 마운트 시 시스템 설정 로드
  useEffect(() => {
    loadSystemSettings();
  }, []);

  const loadSystemSettings = async () => {
    try {
      setIsLoading(true);
      const token = tokenManager.getAccessToken();

      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch("/api/admin/system-settings", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "설정을 불러오는데 실패했습니다.");
      }

      if (result.success) {
        setSettings((prev) => ({
          ...prev,
          firstLevelCommissionRate: result.data.firstLevelCommissionRate,
          nthLevelDenominator: result.data.nthLevelDenominator,
        }));
      }
    } catch (error) {
      console.error("시스템 설정 로드 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "설정을 불러오는데 실패했습니다."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSettingChange = (
    key: string,
    value: string | boolean | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const token = tokenManager.getAccessToken();

      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstLevelCommissionRate: settings.firstLevelCommissionRate,
          nthLevelDenominator: settings.nthLevelDenominator,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "설정 저장에 실패했습니다.");
      }

      alert("변경사항이 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("시스템 설정 저장 오류:", error);
      alert(
        error instanceof Error ? error.message : "설정 저장에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
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
            {/* 로딩 상태 표시 */}
            {isLoading && (
              <div className="loading-overlay">
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>설정을 불러오는 중...</p>
                </div>
              </div>
            )}

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

            {/* 수수료 비율 설정 섹션 */}
            <div className="settings-section">
              <div className="section-header">
                <h2>수수료 비율 설정</h2>
                <p>추천 시스템의 수수료 비율을 관리합니다.</p>
              </div>

              <div className="commission-rate-container">
                <div className="commission-rate-item">
                  <label className="setting-label">
                    1차 추천 수수료 비율 (%)
                  </label>
                  <div className="rate-input-container">
                    <input
                      type="number"
                      className="setting-input rate-input"
                      value={settings.firstLevelCommissionRate}
                      onChange={(e) =>
                        handleSettingChange(
                          "firstLevelCommissionRate",
                          parseFloat(e.target.value) || 10
                        )
                      }
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="10"
                    />
                    <span className="rate-unit">%</span>
                  </div>
                  <p className="rate-description">
                    직접 추천한 사용자가 결제 시 지급되는 수수료 비율입니다.
                  </p>
                </div>

                <div className="commission-rate-item">
                  <label className="setting-label">
                    n차 수수료 계산용 분모
                  </label>
                  <div className="rate-input-container">
                    <input
                      type="number"
                      className="setting-input rate-input"
                      value={settings.nthLevelDenominator}
                      onChange={(e) =>
                        handleSettingChange(
                          "nthLevelDenominator",
                          parseFloat(e.target.value) || 20
                        )
                      }
                      min="1"
                      max="100"
                      step="1"
                      placeholder="20"
                    />
                    <span className="rate-percentage">
                      (2차:{" "}
                      {(
                        (100 - settings.firstLevelCommissionRate) /
                        settings.nthLevelDenominator
                      ).toFixed(2)}
                      %, 3차:{" "}
                      {(
                        (100 - settings.firstLevelCommissionRate) /
                        Math.pow(settings.nthLevelDenominator, 2)
                      ).toFixed(3)}
                      %)
                    </span>
                  </div>
                  <p className="rate-description">
                    2차 이상 간접 추천 사용자 수수료 계산에 사용되는
                    분모값입니다.
                    <br />
                    공식: (결제금액 - 1차 수수료) ÷ 분모^(차수-1)
                  </p>
                </div>

                <div className="commission-rate-preview">
                  <h4>수수료 예시 (1,000원 결제 기준)</h4>
                  <div className="preview-content">
                    <div className="preview-item">
                      <span>1차 추천자 수수료:</span>
                      <strong>
                        {(
                          (1000 * settings.firstLevelCommissionRate) /
                          100
                        ).toFixed(2)}
                        원
                      </strong>
                    </div>
                    <div className="preview-item">
                      <span>2차 추천자 수수료:</span>
                      <strong>
                        {(
                          (1000 * (100 - settings.firstLevelCommissionRate)) /
                          100 /
                          settings.nthLevelDenominator
                        ).toFixed(2)}
                        원
                      </strong>
                    </div>
                    <div className="preview-item">
                      <span>3차 추천자 수수료:</span>
                      <strong>
                        {(
                          (1000 * (100 - settings.firstLevelCommissionRate)) /
                          100 /
                          Math.pow(settings.nthLevelDenominator, 2)
                        ).toFixed(2)}
                        원
                      </strong>
                    </div>
                    <div className="preview-calculation">
                      <small>
                        • 1차: 1,000원 × {settings.firstLevelCommissionRate}% ={" "}
                        {(
                          (1000 * settings.firstLevelCommissionRate) /
                          100
                        ).toFixed(2)}
                        원<br />• 나머지 금액: 1,000원 -{" "}
                        {(
                          (1000 * settings.firstLevelCommissionRate) /
                          100
                        ).toFixed(2)}
                        원 ={" "}
                        {(
                          (1000 * (100 - settings.firstLevelCommissionRate)) /
                          100
                        ).toFixed(2)}
                        원<br />• 2차:{" "}
                        {(
                          (1000 * (100 - settings.firstLevelCommissionRate)) /
                          100
                        ).toFixed(2)}
                        원 ÷ {settings.nthLevelDenominator} ={" "}
                        {(
                          (1000 * (100 - settings.firstLevelCommissionRate)) /
                          100 /
                          settings.nthLevelDenominator
                        ).toFixed(2)}
                        원<br />• 3차:{" "}
                        {(
                          (1000 * (100 - settings.firstLevelCommissionRate)) /
                          100
                        ).toFixed(2)}
                        원 ÷ {settings.nthLevelDenominator}² ={" "}
                        {(
                          (1000 * (100 - settings.firstLevelCommissionRate)) /
                          100 /
                          Math.pow(settings.nthLevelDenominator, 2)
                        ).toFixed(2)}
                        원
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 저장 버튼 */}
            <div className="settings-actions">
              <button
                type="button"
                className="btn-save-settings"
                onClick={handleSaveSettings}
                disabled={isSaving}
              >
                {isSaving ? "저장 중..." : "변경사항 저장"}
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
