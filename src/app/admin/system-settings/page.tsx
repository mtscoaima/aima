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
              <div className="animate-fade-in">

            {/* 일반 설정 섹션 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">일반 설정</h2>
                <p className="text-gray-600 text-sm leading-relaxed">시스템 전반에 적용되는 기본 설정을 관리합니다.</p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-800">포털 이름</label>
                <input
                  type="text"
                  className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                  value={settings.portalName}
                  onChange={(e) =>
                    handleSettingChange("portalName", e.target.value)
                  }
                />
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium text-gray-800">점검 모드 활성화</label>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      활성화 시 일반 사용자 접근이 차단됩니다.
                    </p>
                  </div>
                  <div className="relative inline-block w-12 h-6 flex-shrink-0">
                    <input
                      type="checkbox"
                      id="dormantMode"
                      className="opacity-0 w-0 h-0"
                      checked={settings.dormantMode}
                      onChange={(e) =>
                        handleSettingChange("dormantMode", e.target.checked)
                      }
                    />
                    <label
                      htmlFor="dormantMode"
                      className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${
                        settings.dormantMode ? 'bg-blue-600' : 'bg-gray-300'
                      } before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:duration-300 before:shadow-sm ${
                        settings.dormantMode ? 'before:translate-x-6' : 'before:translate-x-0'
                      }`}
                    ></label>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-800">기본 시간대</label>
                <select
                  className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 cursor-pointer bg-[url('data:image/svg+xml,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'none\\' viewBox=\\'0 0 20 20\\'%3e%3cpath stroke=\\'%236b7280\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'1.5\\' d=\\'m6 8 4 4 4-4\\'/%3e%3c/svg%3e')] bg-[length:16px] bg-[center_right_12px] bg-no-repeat pr-10"
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">API 키 관리</h2>
                <p className="text-gray-600 text-sm leading-relaxed">외부 연동을 위한 API 키를 관리합니다.</p>
              </div>

              <div className="mb-6">
                <label className="block mb-2 text-sm font-medium text-gray-800">외부 서비스 API 키</label>
                <div className="flex gap-3 items-start">
                  <input
                    type="text"
                    className="flex-1 w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 font-mono text-xs tracking-wide"
                    value={settings.externalApiKey}
                    onChange={(e) =>
                      handleSettingChange("externalApiKey", e.target.value)
                    }
                    placeholder="API 키를 입력하세요"
                  />
                  <button
                    type="button"
                    className="bg-gray-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-gray-700 whitespace-nowrap"
                    onClick={handleGenerateApiKey}
                  >
                    재발급
                  </button>
                </div>
              </div>

              <div className="mb-0">
                <button
                  type="button"
                  className="w-full bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-blue-600 hover:text-white"
                  onClick={handleGenerateApiKey}
                >
                  새 API 키 생성
                </button>
              </div>
            </div>

            {/* 캠페인 예산 설정 섹션 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">캠페인 예산 설정</h2>
                <p className="text-gray-600 text-sm leading-relaxed">캠페인 생성 시 최소 예산 및 일 광고비 제한 기준을 설정합니다.</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-800">캠페인 최소 예산 (원)</label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="text"
                      className="w-full max-w-52 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
                      value={parseInt(siteSettings.minimum_campaign_price || "0").toLocaleString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setSiteSettings({
                          ...siteSettings,
                          minimum_campaign_price: value || "0"
                        });
                      }}
                      placeholder="200,000"
                    />
                    <span className="text-sm font-medium text-gray-600 min-w-5">원</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    사용자가 캠페인을 생성할 때 설정해야 하는 최소 예산 금액입니다.
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-800">일 최대 광고비 제한 (원)</label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="text"
                      className="w-full max-w-52 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
                      value={parseInt(siteSettings.default_daily_limit || "0").toLocaleString()}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setSiteSettings({
                          ...siteSettings,
                          default_daily_limit: value || "0"
                        });
                      }}
                      placeholder="50,000"
                    />
                    <span className="text-sm font-medium text-gray-600 min-w-5">원</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                    캠페인의 일일 광고비 사용 한도 최소값입니다.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-2">
                  <h4 className="text-base font-semibold text-blue-800 mb-4">현재 설정값 미리보기</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm text-gray-800">
                      <span>캠페인 최소 예산:</span>
                      <strong className="text-blue-800 font-semibold">{parseInt(siteSettings.minimum_campaign_price || "0").toLocaleString()}원</strong>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-800">
                      <span>일 최대 광고비 제한:</span>
                      <strong className="text-blue-800 font-semibold">{parseInt(siteSettings.default_daily_limit || "0").toLocaleString()}원</strong>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-25 p-4 rounded-md">
                    <small className="text-xs text-gray-600 leading-relaxed">
                      • 사용자는 위 금액 이상으로만 캠페인을 생성할 수 있습니다.<br />
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* 수수료 비율 설정 섹션 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="mb-6 pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">수수료 비율 설정</h2>
                <p className="text-gray-600 text-sm leading-relaxed">추천 시스템의 수수료 비율을 관리합니다.</p>
              </div>

              <div className="flex flex-col gap-6">
                <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
                  <label className="block mb-2 text-sm font-medium text-gray-800">
                    1차 추천 수수료 비율 (%)
                  </label>
                  <div className="flex items-center gap-2 max-w-lg flex-wrap">
                    <input
                      type="number"
                      className="w-full max-w-40 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
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
                    <span className="text-sm font-medium text-gray-600 min-w-5">%</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    직접 추천한 사용자가 결제 시 지급되는 수수료 비율입니다.
                  </p>
                </div>

                <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
                  <label className="block mb-2 text-sm font-medium text-gray-800">
                    n차 수수료 계산용 분모
                  </label>
                  <div className="flex items-center gap-2 max-w-lg flex-wrap">
                    <input
                      type="number"
                      className="w-full max-w-40 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
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
                    <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded">
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
                  <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                    2차 이상 간접 추천 사용자 수수료 계산에 사용되는
                    분모값입니다.
                    <br />
                    공식: (결제금액 - 1차 수수료) ÷ 분모^(차수-1)
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-2">
                  <h4 className="text-base font-semibold text-blue-800 mb-4">수수료 예시 (1,000원 결제 기준)</h4>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center text-sm text-gray-800 mb-2 pb-2 border-b border-blue-200 font-medium">
                      <span>1차 추천자 수수료:</span>
                      <strong className="text-blue-800 font-semibold">
                        {(
                          (1000 * settings.firstLevelCommissionRate) /
                          100
                        ).toFixed(2)}
                        원
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-800">
                      <span>2차 추천자 수수료:</span>
                      <strong className="text-blue-800 font-semibold">
                        {(
                          (1000 * (100 - settings.firstLevelCommissionRate)) /
                          100 /
                          settings.nthLevelDenominator
                        ).toFixed(2)}
                        원
                      </strong>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-800">
                      <span>3차 추천자 수수료:</span>
                      <strong className="text-blue-800 font-semibold">
                        {(
                          (1000 * (100 - settings.firstLevelCommissionRate)) /
                          100 /
                          Math.pow(settings.nthLevelDenominator, 2)
                        ).toFixed(2)}
                        원
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-25 p-4 rounded-md">
                    <small className="text-xs text-gray-600 leading-relaxed">
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

                {/* 저장 버튼 */}
                <div className="flex flex-col items-end gap-4 p-6">
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
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
              <div className="animate-fade-in">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
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

            <p className="text-xs text-gray-600 leading-relaxed italic text-center w-full mt-4">
              * 이 페이지는 RBAC에서 기본 설정은 제외 메뉴에 있는 시스템 관리자 권한이 있는 사용자에게만 표시됩니다.
            </p>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
