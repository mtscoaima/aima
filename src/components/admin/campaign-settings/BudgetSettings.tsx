"use client";

import { useState, useEffect } from "react";

interface SiteSettings {
  minimum_campaign_price: string;
  default_daily_limit: string;
}

export default function BudgetSettings() {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    minimum_campaign_price: "200000",
    default_daily_limit: "50000",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSiteSettings();
  }, []);

  const fetchSiteSettings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/admin/system-settings", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && result.data.siteSettings) {
          setSiteSettings({
            minimum_campaign_price: result.data.siteSettings.minimum_campaign_price || "200000",
            default_daily_limit: result.data.siteSettings.default_daily_limit || "50000",
          });
        }
      }
    } catch (error) {
      console.error("사이트 설정 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSiteSettingChange = (key: string, value: string) => {
    setSiteSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("accessToken");

      const response = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ siteSettings }),
      });

      if (response.ok) {
        alert("캠페인 예산 설정이 저장되었습니다.");
        await fetchSiteSettings(); // 저장 후 최신 데이터 다시 로드
      } else {
        const result = await response.json();
        throw new Error(result.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("설정 저장 실패:", error);
      alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 캠페인 예산 설정 섹션 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">캠페인 예산 설정</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            캠페인 생성 시 최소 예산 및 일 광고비 제한 기준을 설정합니다.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-800">
              캠페인 최소 예산 (원)
            </label>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="text"
                className="w-full max-w-52 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
                value={parseInt(siteSettings.minimum_campaign_price || "0").toLocaleString()}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  handleSiteSettingChange("minimum_campaign_price", value || "0");
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
            <label className="block mb-2 text-sm font-medium text-gray-800">
              일 최대 광고비 제한 (원)
            </label>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="text"
                className="w-full max-w-52 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
                value={parseInt(siteSettings.default_daily_limit || "0").toLocaleString()}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  handleSiteSettingChange("default_daily_limit", value || "0");
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
            <h4 className="text-base font-semibold text-blue-800 mb-4">
              현재 설정값 미리보기
            </h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm text-gray-800">
                <span>캠페인 최소 예산:</span>
                <strong className="text-blue-800 font-semibold">
                  {parseInt(siteSettings.minimum_campaign_price || "0").toLocaleString()}원
                </strong>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-800">
                <span>일 최대 광고비 제한:</span>
                <strong className="text-blue-800 font-semibold">
                  {parseInt(siteSettings.default_daily_limit || "0").toLocaleString()}원
                </strong>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-25 p-4 rounded-md">
              <small className="text-xs text-gray-600 leading-relaxed">
                • 사용자는 위 금액 이상으로만 캠페인을 생성할 수 있습니다.
              </small>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
