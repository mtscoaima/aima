"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { tokenManager } from "@/lib/api";
import "./styles.css";

interface MenuItem {
  id: string;
  name: string;
  url: string;
  order: number;
  visible: boolean;
}

interface MenuSettings {
  main_menu: MenuItem[];
  admin_menu: MenuItem[];
}

interface SiteSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  footer_text: string;
  maintenance_mode: boolean;
  maintenance_message: string;
}

interface TermsData {
  id?: number;
  title: string;
  content: string;
  version: string;
}

export default function SystemSettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"general" | "menu" | "terms" | "privacy" | "marketing">("general");

  // 설정 상태 관리
  const [settings, setSettings] = useState({
    portalName: "관리자 포털",
    dormantMode: false,
    timezone: "Asia/Seoul (UTC+9)",
    externalApiKey: "sk_live_xxxxxxxxxxxxxxxxxxxxxxABCD",
    firstLevelCommissionRate: 10, // 1차 추천 수수료 비율 (고정)
    nthLevelDenominator: 20, // n차 수수료 계산용 분모
  });

  const [menuSettings, setMenuSettings] = useState<MenuSettings>({
    main_menu: [],
    admin_menu: []
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: "MTS Message",
    site_description: "AI 기반 타깃 마케팅 메시지 서비스",
    contact_email: "support@mtsmessage.com",
    contact_phone: "1588-0000",
    footer_text: "Copyright © 2024 MTS Message. All rights reserved.",
    maintenance_mode: false,
    maintenance_message: "시스템 점검 중입니다. 잠시 후 다시 이용해주세요."
  });

  const [termsData, setTermsData] = useState<TermsData>({
    title: "서비스 이용약관",
    content: "",
    version: "1.0"
  });

  const [privacyData, setPrivacyData] = useState<TermsData>({
    title: "개인정보처리방침",
    content: "",
    version: "1.0"
  });

  const [marketingData, setMarketingData] = useState<TermsData>({
    title: "마케팅 정보 수신 동의",
    content: "",
    version: "1.0"
  });

  // 버전 히스토리 상태
  interface VersionInfo {
    id: number;
    version: string;
    title: string;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  }

  const [termsVersions, setTermsVersions] = useState<VersionInfo[]>([]);
  const [privacyVersions, setPrivacyVersions] = useState<VersionInfo[]>([]);
  const [marketingVersions, setMarketingVersions] = useState<VersionInfo[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState<{
    terms: boolean;
    privacy: boolean;
    marketing: boolean;
  }>({
    terms: false,
    privacy: false,
    marketing: false
  });

  // 페이지네이션 상태
  const [pagination, setPagination] = useState<{
    terms: { currentPage: number; totalPages: number; };
    privacy: { currentPage: number; totalPages: number; };
    marketing: { currentPage: number; totalPages: number; };
  }>({
    terms: { currentPage: 1, totalPages: 1 },
    privacy: { currentPage: 1, totalPages: 1 },
    marketing: { currentPage: 1, totalPages: 1 }
  });

  const ITEMS_PER_PAGE = 5;

  // 컴포넌트 마운트 시 시스템 설정 로드
  useEffect(() => {
    loadSystemSettings();
    loadTermsData();
    loadPrivacyData();
    loadMarketingData();
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
        
        if (result.data.menuSettings) {
          setMenuSettings(result.data.menuSettings);
        }
        
        if (result.data.siteSettings) {
          setSiteSettings(result.data.siteSettings);
        }
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

  // 약관 데이터 로드
  const loadTermsData = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) return;

      const response = await fetch("/api/admin/terms?type=SERVICE_TERMS", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setTermsData({
            id: result.data.id,
            title: result.data.title,
            content: result.data.content,
            version: result.data.version
          });
        }
      }
    } catch (error) {
      console.error("약관 데이터 로드 오류:", error);
    }
  };

  // 개인정보처리방침 데이터 로드
  const loadPrivacyData = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) return;

      const response = await fetch("/api/admin/terms?type=PRIVACY_POLICY", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setPrivacyData({
            id: result.data.id,
            title: result.data.title,
            content: result.data.content,
            version: result.data.version
          });
        }
      }
    } catch (error) {
      console.error("개인정보처리방침 데이터 로드 오류:", error);
    }
  };

  // 마케팅 동의 데이터 로드
  const loadMarketingData = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) return;

      const response = await fetch("/api/admin/terms?type=MARKETING_CONSENT", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setMarketingData({
            id: result.data.id,
            title: result.data.title,
            content: result.data.content,
            version: result.data.version
          });
        }
      }
    } catch (error) {
      console.error("마케팅 동의 데이터 로드 오류:", error);
    }
  };

  // 버전 히스토리 로드 함수들
  const loadVersionHistory = async (type: 'SERVICE_TERMS' | 'PRIVACY_POLICY' | 'MARKETING_CONSENT') => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/admin/terms/versions?type=${type}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const versions = result.data;

          // 페이지네이션 계산
          const totalPages = Math.ceil(versions.length / ITEMS_PER_PAGE);
          const typeKey = type === 'SERVICE_TERMS' ? 'terms' :
                         type === 'PRIVACY_POLICY' ? 'privacy' : 'marketing';

          setPagination(prev => ({
            ...prev,
            [typeKey]: {
              currentPage: 1, // 새로 로드할 때는 첫 페이지로
              totalPages
            }
          }));

          switch (type) {
            case 'SERVICE_TERMS':
              setTermsVersions(versions);
              break;
            case 'PRIVACY_POLICY':
              setPrivacyVersions(versions);
              break;
            case 'MARKETING_CONSENT':
              setMarketingVersions(versions);
              break;
          }
        }
      }
    } catch (error) {
      console.error(`${type} 버전 히스토리 로드 오류:`, error);
    }
  };

  // 버전 삭제
  const deleteVersion = async (type: 'SERVICE_TERMS' | 'PRIVACY_POLICY' | 'MARKETING_CONSENT', versionId: number, version: string) => {
    if (!confirm(`버전 ${version}을(를) 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch("/api/admin/terms/versions", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: type,
          versionId: versionId
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "버전 삭제에 실패했습니다.");
      }

      alert(result.message || "버전이 성공적으로 삭제되었습니다.");

      // 데이터 새로고침
      loadVersionHistory(type);
    } catch (error) {
      console.error("버전 삭제 오류:", error);
      alert(error instanceof Error ? error.message : "버전 삭제에 실패했습니다.");
    }
  };

  // 페이지 변경
  const changePage = (type: 'terms' | 'privacy' | 'marketing', page: number) => {
    setPagination(prev => ({
      ...prev,
      [type]: { ...prev[type], currentPage: page }
    }));
  };

  // 현재 페이지의 버전들 가져오기
  const getCurrentPageVersions = (versions: VersionInfo[], type: 'terms' | 'privacy' | 'marketing') => {
    const { currentPage } = pagination[type];
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return versions.slice(startIndex, endIndex);
  };

  // 특정 버전 활성화
  const activateVersion = async (type: 'SERVICE_TERMS' | 'PRIVACY_POLICY' | 'MARKETING_CONSENT', versionId: number) => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch("/api/admin/terms/versions", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: type,
          versionId: versionId
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "버전 활성화에 실패했습니다.");
      }

      alert("버전이 성공적으로 활성화되었습니다.");

      // 데이터 새로고침
      switch (type) {
        case 'SERVICE_TERMS':
          loadTermsData();
          loadVersionHistory(type);
          break;
        case 'PRIVACY_POLICY':
          loadPrivacyData();
          loadVersionHistory(type);
          break;
        case 'MARKETING_CONSENT':
          loadMarketingData();
          loadVersionHistory(type);
          break;
      }
    } catch (error) {
      console.error("버전 활성화 오류:", error);
      alert(error instanceof Error ? error.message : "버전 활성화에 실패했습니다.");
    }
  };

  // 버전 히스토리 토글
  const toggleVersionHistory = (type: 'terms' | 'privacy' | 'marketing') => {
    setShowVersionHistory(prev => {
      const newState = { ...prev, [type]: !prev[type] };

      // 버전 히스토리를 열 때 데이터 로드
      if (newState[type]) {
        switch (type) {
          case 'terms':
            loadVersionHistory('SERVICE_TERMS');
            break;
          case 'privacy':
            loadVersionHistory('PRIVACY_POLICY');
            break;
          case 'marketing':
            loadVersionHistory('MARKETING_CONSENT');
            break;
        }
      }

      return newState;
    });
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
          menuSettings: menuSettings,
          siteSettings: siteSettings,
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

  // 약관 저장
  const handleSaveTerms = async () => {
    try {
      setIsSaving(true);
      const token = tokenManager.getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch("/api/admin/terms", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "SERVICE_TERMS",
          ...termsData
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "약관 저장에 실패했습니다.");
      }

      alert("이용약관이 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("약관 저장 오류:", error);
      alert(error instanceof Error ? error.message : "약관 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 개인정보처리방침 저장
  const handleSavePrivacy = async () => {
    try {
      setIsSaving(true);
      const token = tokenManager.getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch("/api/admin/terms", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "PRIVACY_POLICY",
          ...privacyData
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "개인정보처리방침 저장에 실패했습니다.");
      }

      alert("개인정보처리방침이 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("개인정보처리방침 저장 오류:", error);
      alert(error instanceof Error ? error.message : "개인정보처리방침 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 마케팅 동의 저장
  const handleSaveMarketing = async () => {
    try {
      setIsSaving(true);
      const token = tokenManager.getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch("/api/admin/terms", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "MARKETING_CONSENT",
          ...marketingData
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "마케팅 동의서 저장에 실패했습니다.");
      }

      alert("마케팅 동의서가 성공적으로 저장되었습니다.");
    } catch (error) {
      console.error("마케팅 동의서 저장 오류:", error);
      alert(error instanceof Error ? error.message : "마케팅 동의서 저장에 실패했습니다.");
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

          {/* 탭 네비게이션 */}
          <div className="tm-tabs">
            <button
              className={`tm-tab-btn ${activeTab === "general" ? "active" : ""}`}
              onClick={() => setActiveTab("general")}
            >
              일반 설정
            </button>
            <button
              className={`tm-tab-btn ${activeTab === "menu" ? "active" : ""}`}
              onClick={() => setActiveTab("menu")}
            >
              메뉴 설정
            </button>
            <button
              className={`tm-tab-btn ${activeTab === "terms" ? "active" : ""}`}
              onClick={() => setActiveTab("terms")}
            >
              이용약관 설정
            </button>
            <button
              className={`tm-tab-btn ${activeTab === "privacy" ? "active" : ""}`}
              onClick={() => setActiveTab("privacy")}
            >
              개인정보처리방침
            </button>
            <button
              className={`tm-tab-btn ${activeTab === "marketing" ? "active" : ""}`}
              onClick={() => setActiveTab("marketing")}
            >
              마케팅 동의
            </button>
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

            {/* 탭별 컨텐츠 */}
            {activeTab === "general" && (
              <div className="tab-content">

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
                </div>
              </div>
            )}

            {/* 메뉴 설정 탭 */}
            {activeTab === "menu" && (
              <div className="tab-content">
                <div className="settings-section">
                  <div className="section-header">
                    <h2>메뉴 설정</h2>
                    <p>사이트의 메뉴 구성을 관리합니다.</p>
                  </div>

                  <div className="menu-section">
                    <h3>메인 메뉴</h3>
                    <div className="menu-items">
                      {menuSettings.main_menu.map((item, index) => (
                        <div key={item.id} className="menu-item">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const newMainMenu = [...menuSettings.main_menu];
                              newMainMenu[index].name = e.target.value;
                              setMenuSettings({...menuSettings, main_menu: newMainMenu});
                            }}
                            className="menu-name-input"
                          />
                          <input
                            type="text"
                            value={item.url}
                            onChange={(e) => {
                              const newMainMenu = [...menuSettings.main_menu];
                              newMainMenu[index].url = e.target.value;
                              setMenuSettings({...menuSettings, main_menu: newMainMenu});
                            }}
                            className="menu-url-input"
                          />
                          <label className="menu-visible-checkbox">
                            <input
                              type="checkbox"
                              checked={item.visible}
                              onChange={(e) => {
                                const newMainMenu = [...menuSettings.main_menu];
                                newMainMenu[index].visible = e.target.checked;
                                setMenuSettings({...menuSettings, main_menu: newMainMenu});
                              }}
                            />
                            보이기
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="site-settings-section">
                    <h3>사이트 정보</h3>
                    <div className="setting-item">
                      <label className="setting-label">사이트 이름</label>
                      <input
                        type="text"
                        className="setting-input"
                        value={siteSettings.site_name}
                        onChange={(e) => setSiteSettings({...siteSettings, site_name: e.target.value})}
                      />
                    </div>
                    <div className="setting-item">
                      <label className="setting-label">사이트 설명</label>
                      <input
                        type="text"
                        className="setting-input"
                        value={siteSettings.site_description}
                        onChange={(e) => setSiteSettings({...siteSettings, site_description: e.target.value})}
                      />
                    </div>
                    <div className="setting-item">
                      <label className="setting-label">연락처 이메일</label>
                      <input
                        type="email"
                        className="setting-input"
                        value={siteSettings.contact_email}
                        onChange={(e) => setSiteSettings({...siteSettings, contact_email: e.target.value})}
                      />
                    </div>
                    <div className="setting-item">
                      <label className="setting-label">연락처 전화번호</label>
                      <input
                        type="tel"
                        className="setting-input"
                        value={siteSettings.contact_phone}
                        onChange={(e) => setSiteSettings({...siteSettings, contact_phone: e.target.value})}
                      />
                    </div>
                    <div className="setting-item">
                      <label className="setting-label">푸터 텍스트</label>
                      <input
                        type="text"
                        className="setting-input"
                        value={siteSettings.footer_text}
                        onChange={(e) => setSiteSettings({...siteSettings, footer_text: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="settings-actions">
                    <button
                      type="button"
                      className="btn-save-settings"
                      onClick={handleSaveSettings}
                      disabled={isSaving}
                    >
                      {isSaving ? "저장 중..." : "메뉴 설정 저장"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 이용약관 설정 탭 */}
            {activeTab === "terms" && (
              <div className="tab-content">
                <div className="settings-section">
                  <div className="section-header">
                    <h2>이용약관 설정</h2>
                    <p>서비스 이용약관을 관리합니다.</p>
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">약관 제목</label>
                    <input
                      type="text"
                      className="setting-input"
                      value={termsData.title}
                      onChange={(e) => setTermsData({...termsData, title: e.target.value})}
                    />
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">버전</label>
                    <input
                      type="text"
                      className="setting-input"
                      value={termsData.version}
                      onChange={(e) => setTermsData({...termsData, version: e.target.value})}
                    />
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">약관 내용</label>
                    <textarea
                      className="setting-textarea"
                      rows={15}
                      value={termsData.content}
                      onChange={(e) => setTermsData({...termsData, content: e.target.value})}
                      placeholder="이용약관 내용을 입력하세요..."
                    />
                  </div>

                  <div className="settings-actions">
                    <button
                      type="button"
                      className="btn-save-settings"
                      onClick={handleSaveTerms}
                      disabled={isSaving}
                    >
                      {isSaving ? "저장 중..." : "이용약관 저장"}
                    </button>
                    <button
                      type="button"
                      className="btn-version-history"
                      onClick={() => toggleVersionHistory('terms')}
                      style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {showVersionHistory.terms ? "버전 히스토리 숨기기" : "버전 히스토리 보기"}
                    </button>
                  </div>

                  {/* 버전 히스토리 */}
                  {showVersionHistory.terms && (
                    <div className="version-history-section" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                      <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>이용약관 버전 히스토리</h3>
                      {termsVersions.length === 0 ? (
                        <p style={{ color: '#6c757d', fontStyle: 'italic' }}>버전 히스토리가 없습니다.</p>
                      ) : (
                        <>
                          <div className="version-list">
                            {getCurrentPageVersions(termsVersions, 'terms').map((version) => (
                              <div key={version.id} className="version-item" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px',
                                marginBottom: '10px',
                                backgroundColor: version.is_active ? '#d4edda' : 'white',
                                border: '1px solid ' + (version.is_active ? '#c3e6cb' : '#dee2e6'),
                                borderRadius: '4px'
                              }}>
                                <div>
                                  <strong>버전 {version.version}</strong>
                                  {version.is_active && <span style={{ color: '#155724', marginLeft: '8px', fontSize: '12px' }}>(현재 활성)</span>}
                                  <br />
                                  <small style={{ color: '#6c757d' }}>
                                    생성일: {new Date(version.created_at).toLocaleString('ko-KR')}
                                  </small>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {!version.is_active && (
                                    <button
                                      onClick={() => activateVersion('SERVICE_TERMS', version.id)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      활성화
                                    </button>
                                  )}
                                  {!version.is_active && (
                                    <button
                                      onClick={() => deleteVersion('SERVICE_TERMS', version.id, version.version)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      삭제
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 페이지네이션 */}
                          {pagination.terms.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px', gap: '10px' }}>
                              <button
                                onClick={() => changePage('terms', pagination.terms.currentPage - 1)}
                                disabled={pagination.terms.currentPage <= 1}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: pagination.terms.currentPage <= 1 ? '#6c757d' : '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: pagination.terms.currentPage <= 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                이전
                              </button>

                              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                                {pagination.terms.currentPage} / {pagination.terms.totalPages}
                              </span>

                              <button
                                onClick={() => changePage('terms', pagination.terms.currentPage + 1)}
                                disabled={pagination.terms.currentPage >= pagination.terms.totalPages}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: pagination.terms.currentPage >= pagination.terms.totalPages ? '#6c757d' : '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: pagination.terms.currentPage >= pagination.terms.totalPages ? 'not-allowed' : 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                다음
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 개인정보처리방침 설정 탭 */}
            {activeTab === "privacy" && (
              <div className="tab-content">
                <div className="settings-section">
                  <div className="section-header">
                    <h2>개인정보처리방침 설정</h2>
                    <p>개인정보처리방침을 관리합니다.</p>
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">방침 제목</label>
                    <input
                      type="text"
                      className="setting-input"
                      value={privacyData.title}
                      onChange={(e) => setPrivacyData({...privacyData, title: e.target.value})}
                    />
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">버전</label>
                    <input
                      type="text"
                      className="setting-input"
                      value={privacyData.version}
                      onChange={(e) => setPrivacyData({...privacyData, version: e.target.value})}
                    />
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">방침 내용</label>
                    <textarea
                      className="setting-textarea"
                      rows={15}
                      value={privacyData.content}
                      onChange={(e) => setPrivacyData({...privacyData, content: e.target.value})}
                      placeholder="개인정보처리방침 내용을 입력하세요..."
                    />
                  </div>

                  <div className="settings-actions">
                    <button
                      type="button"
                      className="btn-save-settings"
                      onClick={handleSavePrivacy}
                      disabled={isSaving}
                    >
                      {isSaving ? "저장 중..." : "개인정보처리방침 저장"}
                    </button>
                    <button
                      type="button"
                      className="btn-version-history"
                      onClick={() => toggleVersionHistory('privacy')}
                      style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {showVersionHistory.privacy ? "버전 히스토리 숨기기" : "버전 히스토리 보기"}
                    </button>
                  </div>

                  {/* 버전 히스토리 */}
                  {showVersionHistory.privacy && (
                    <div className="version-history-section" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                      <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>개인정보처리방침 버전 히스토리</h3>
                      {privacyVersions.length === 0 ? (
                        <p style={{ color: '#6c757d', fontStyle: 'italic' }}>버전 히스토리가 없습니다.</p>
                      ) : (
                        <>
                          <div className="version-list">
                            {getCurrentPageVersions(privacyVersions, 'privacy').map((version) => (
                              <div key={version.id} className="version-item" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px',
                                marginBottom: '10px',
                                backgroundColor: version.is_active ? '#d4edda' : 'white',
                                border: '1px solid ' + (version.is_active ? '#c3e6cb' : '#dee2e6'),
                                borderRadius: '4px'
                              }}>
                                <div>
                                  <strong>버전 {version.version}</strong>
                                  {version.is_active && <span style={{ color: '#155724', marginLeft: '8px', fontSize: '12px' }}>(현재 활성)</span>}
                                  <br />
                                  <small style={{ color: '#6c757d' }}>
                                    생성일: {new Date(version.created_at).toLocaleString('ko-KR')}
                                  </small>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {!version.is_active && (
                                    <button
                                      onClick={() => activateVersion('PRIVACY_POLICY', version.id)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      활성화
                                    </button>
                                  )}
                                  {!version.is_active && (
                                    <button
                                      onClick={() => deleteVersion('PRIVACY_POLICY', version.id, version.version)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      삭제
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 페이지네이션 */}
                          {pagination.privacy.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px', gap: '10px' }}>
                              <button
                                onClick={() => changePage('privacy', pagination.privacy.currentPage - 1)}
                                disabled={pagination.privacy.currentPage <= 1}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: pagination.privacy.currentPage <= 1 ? '#6c757d' : '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: pagination.privacy.currentPage <= 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                이전
                              </button>

                              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                                {pagination.privacy.currentPage} / {pagination.privacy.totalPages}
                              </span>

                              <button
                                onClick={() => changePage('privacy', pagination.privacy.currentPage + 1)}
                                disabled={pagination.privacy.currentPage >= pagination.privacy.totalPages}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: pagination.privacy.currentPage >= pagination.privacy.totalPages ? '#6c757d' : '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: pagination.privacy.currentPage >= pagination.privacy.totalPages ? 'not-allowed' : 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                다음
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 마케팅 동의 설정 탭 */}
            {activeTab === "marketing" && (
              <div className="tab-content">
                <div className="settings-section">
                  <div className="section-header">
                    <h2>마케팅 동의 설정</h2>
                    <p>마케팅 정보 수신 동의서를 관리합니다.</p>
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">동의서 제목</label>
                    <input
                      type="text"
                      className="setting-input"
                      value={marketingData.title}
                      onChange={(e) => setMarketingData({...marketingData, title: e.target.value})}
                    />
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">버전</label>
                    <input
                      type="text"
                      className="setting-input"
                      value={marketingData.version}
                      onChange={(e) => setMarketingData({...marketingData, version: e.target.value})}
                    />
                  </div>

                  <div className="setting-item">
                    <label className="setting-label">동의서 내용</label>
                    <textarea
                      className="setting-textarea"
                      rows={15}
                      value={marketingData.content}
                      onChange={(e) => setMarketingData({...marketingData, content: e.target.value})}
                      placeholder="마케팅 정보 수신 동의서 내용을 입력하세요..."
                    />
                  </div>

                  <div className="settings-actions">
                    <button
                      className="btn-save-settings"
                      onClick={handleSaveMarketing}
                      disabled={isSaving}
                    >
                      {isSaving ? "저장 중..." : "마케팅 동의서 저장"}
                    </button>
                    <button
                      type="button"
                      className="btn-version-history"
                      onClick={() => toggleVersionHistory('marketing')}
                      style={{ marginLeft: '10px', padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      {showVersionHistory.marketing ? "버전 히스토리 숨기기" : "버전 히스토리 보기"}
                    </button>
                  </div>

                  {/* 버전 히스토리 */}
                  {showVersionHistory.marketing && (
                    <div className="version-history-section" style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px' }}>
                      <h3 style={{ marginBottom: '15px', fontSize: '16px', fontWeight: 'bold' }}>마케팅 동의 버전 히스토리</h3>
                      {marketingVersions.length === 0 ? (
                        <p style={{ color: '#6c757d', fontStyle: 'italic' }}>버전 히스토리가 없습니다.</p>
                      ) : (
                        <>
                          <div className="version-list">
                            {getCurrentPageVersions(marketingVersions, 'marketing').map((version) => (
                              <div key={version.id} className="version-item" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '10px',
                                marginBottom: '10px',
                                backgroundColor: version.is_active ? '#d4edda' : 'white',
                                border: '1px solid ' + (version.is_active ? '#c3e6cb' : '#dee2e6'),
                                borderRadius: '4px'
                              }}>
                                <div>
                                  <strong>버전 {version.version}</strong>
                                  {version.is_active && <span style={{ color: '#155724', marginLeft: '8px', fontSize: '12px' }}>(현재 활성)</span>}
                                  <br />
                                  <small style={{ color: '#6c757d' }}>
                                    생성일: {new Date(version.created_at).toLocaleString('ko-KR')}
                                  </small>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  {!version.is_active && (
                                    <button
                                      onClick={() => activateVersion('MARKETING_CONSENT', version.id)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      활성화
                                    </button>
                                  )}
                                  {!version.is_active && (
                                    <button
                                      onClick={() => deleteVersion('MARKETING_CONSENT', version.id, version.version)}
                                      style={{
                                        padding: '6px 12px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                      }}
                                    >
                                      삭제
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 페이지네이션 */}
                          {pagination.marketing.totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '15px', gap: '10px' }}>
                              <button
                                onClick={() => changePage('marketing', pagination.marketing.currentPage - 1)}
                                disabled={pagination.marketing.currentPage <= 1}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: pagination.marketing.currentPage <= 1 ? '#6c757d' : '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: pagination.marketing.currentPage <= 1 ? 'not-allowed' : 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                이전
                              </button>

                              <span style={{ fontSize: '14px', color: '#6c757d' }}>
                                {pagination.marketing.currentPage} / {pagination.marketing.totalPages}
                              </span>

                              <button
                                onClick={() => changePage('marketing', pagination.marketing.currentPage + 1)}
                                disabled={pagination.marketing.currentPage >= pagination.marketing.totalPages}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: pagination.marketing.currentPage >= pagination.marketing.totalPages ? '#6c757d' : '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: pagination.marketing.currentPage >= pagination.marketing.totalPages ? 'not-allowed' : 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                다음
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="settings-notice">
              * 이 페이지는 RBAC에서 기본 설정은 제외 메뉴에 있는 시스템 관리자 권한이 있는 사용자에게만 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
