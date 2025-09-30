"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { tokenManager } from "@/lib/api";
import GeneralSettings from "@/components/admin/system-settings/GeneralSettings";
import MenuSettings from "@/components/admin/system-settings/MenuSettings";
import DocumentSettings from "@/components/admin/system-settings/DocumentSettings";

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
  minimum_campaign_price: string;
  default_daily_limit: string;
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
    maintenance_message: "시스템 점검 중입니다. 잠시 후 다시 이용해주세요.",
    minimum_campaign_price: "200000",
    default_daily_limit: "50000"
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
      <div className="flex min-h-[calc(100vh-64px)] mt-16 bg-gray-50 text-gray-800">
        <div className="flex-1 ml-64 p-6 bg-gray-50 transition-all duration-300">
          <div className="flex justify-center items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">시스템 설정 (관리자 전용)</h1>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex mb-6 border-b border-gray-200 gap-1">
            <button
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-3 ${
                activeTab === "general"
                  ? "text-blue-600 border-blue-600 font-semibold"
                  : "text-gray-600 border-transparent hover:text-blue-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("general")}
            >
              일반 설정
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-3 ${
                activeTab === "menu"
                  ? "text-blue-600 border-blue-600 font-semibold"
                  : "text-gray-600 border-transparent hover:text-blue-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("menu")}
            >
              메뉴 설정
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-3 ${
                activeTab === "terms"
                  ? "text-blue-600 border-blue-600 font-semibold"
                  : "text-gray-600 border-transparent hover:text-blue-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("terms")}
            >
              이용약관 설정
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-3 ${
                activeTab === "privacy"
                  ? "text-blue-600 border-blue-600 font-semibold"
                  : "text-gray-600 border-transparent hover:text-blue-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("privacy")}
            >
              개인정보처리방침
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap border-b-3 ${
                activeTab === "marketing"
                  ? "text-blue-600 border-blue-600 font-semibold"
                  : "text-gray-600 border-transparent hover:text-blue-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab("marketing")}
            >
              마케팅 동의
            </button>
          </div>

          <div className="flex flex-col gap-6 max-w-4xl mx-auto relative">
            {/* 로딩 상태 표시 */}
            {isLoading && (
              <div className="absolute inset-0 bg-white/80 flex justify-center items-center z-50 rounded-xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-gray-600 text-sm">설정을 불러오는 중...</p>
                </div>
              </div>
            )}

            {/* 탭별 컨텐츠 */}
            {activeTab === "general" && (
              <GeneralSettings
                settings={settings}
                siteSettings={siteSettings}
                onSettingChange={handleSettingChange}
                onSiteSettingChange={(key, value) => setSiteSettings({...siteSettings, [key]: value})}
                onSave={handleSaveSettings}
                isSaving={isSaving}
                onGenerateApiKey={handleGenerateApiKey}
              />
            )}

            {/* 메뉴 설정 탭 */}
            {activeTab === "menu" && (
              <MenuSettings
                menuSettings={menuSettings}
                siteSettings={siteSettings}
                onMenuSettingsChange={setMenuSettings}
                onSiteSettingsChange={setSiteSettings}
                onSave={handleSaveSettings}
                isSaving={isSaving}
              />
            )}

            {/* 이용약관 설정 탭 */}
            {activeTab === "terms" && (
              <DocumentSettings
                type="terms"
                title="이용약관 설정"
                description="서비스 이용약관을 관리합니다."
                data={termsData}
                versions={termsVersions}
                showVersionHistory={showVersionHistory.terms}
                pagination={pagination.terms}
                onDataChange={setTermsData}
                onSave={handleSaveTerms}
                onToggleVersionHistory={() => toggleVersionHistory('terms')}
                onChangePage={(page) => changePage('terms', page)}
                onActivateVersion={(versionId) => activateVersion('SERVICE_TERMS', versionId)}
                onDeleteVersion={(versionId, version) => deleteVersion('SERVICE_TERMS', versionId, version)}
                isSaving={isSaving}
                getCurrentPageVersions={(versions) => getCurrentPageVersions(versions, 'terms')}
              />
            )}

            {/* 개인정보처리방침 설정 탭 */}
            {activeTab === "privacy" && (
              <DocumentSettings
                type="privacy"
                title="개인정보처리방침 설정"
                description="개인정보처리방침을 관리합니다."
                data={privacyData}
                versions={privacyVersions}
                showVersionHistory={showVersionHistory.privacy}
                pagination={pagination.privacy}
                onDataChange={setPrivacyData}
                onSave={handleSavePrivacy}
                onToggleVersionHistory={() => toggleVersionHistory('privacy')}
                onChangePage={(page) => changePage('privacy', page)}
                onActivateVersion={(versionId) => activateVersion('PRIVACY_POLICY', versionId)}
                onDeleteVersion={(versionId, version) => deleteVersion('PRIVACY_POLICY', versionId, version)}
                isSaving={isSaving}
                getCurrentPageVersions={(versions) => getCurrentPageVersions(versions, 'privacy')}
              />
            )}

            {/* 마케팅 동의 설정 탭 */}
            {activeTab === "marketing" && (
              <DocumentSettings
                type="marketing"
                title="마케팅 동의 설정"
                description="마케팅 정보 수신 동의서를 관리합니다."
                data={marketingData}
                versions={marketingVersions}
                showVersionHistory={showVersionHistory.marketing}
                pagination={pagination.marketing}
                onDataChange={setMarketingData}
                onSave={handleSaveMarketing}
                onToggleVersionHistory={() => toggleVersionHistory('marketing')}
                onChangePage={(page) => changePage('marketing', page)}
                onActivateVersion={(versionId) => activateVersion('MARKETING_CONSENT', versionId)}
                onDeleteVersion={(versionId, version) => deleteVersion('MARKETING_CONSENT', versionId, version)}
                isSaving={isSaving}
                getCurrentPageVersions={(versions) => getCurrentPageVersions(versions, 'marketing')}
              />
            )}

            <p className="text-xs text-gray-600 leading-relaxed italic text-center w-full mt-4">
              * 이 페이지는 RBAC에서 기본 설정은 제외 메뉴에 있는 시스템 관리자 권한이 있는 사용자에게만 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
