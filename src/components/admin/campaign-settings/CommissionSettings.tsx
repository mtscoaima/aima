"use client";

import { useState, useEffect } from "react";

interface CommissionSettings {
  firstLevelCommissionRate: number;
  nthLevelDenominator: number;
}

export default function CommissionSettings() {
  const [settings, setSettings] = useState<CommissionSettings>({
    firstLevelCommissionRate: 10,
    nthLevelDenominator: 20,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
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
        if (result.success && result.data) {
          setSettings({
            firstLevelCommissionRate: result.data.firstLevelCommissionRate || 10,
            nthLevelDenominator: result.data.nthLevelDenominator || 20,
          });
        }
      }
    } catch (error) {
      console.error("설정 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        alert("수수료 비율 설정이 저장되었습니다.");
        await fetchSettings(); // 저장 후 최신 데이터 다시 로드
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
      {/* 수수료 비율 설정 섹션 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">수수료 비율 설정</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            추천 시스템의 수수료 비율을 관리합니다.
          </p>
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
                onChange={(e) => handleSettingChange("firstLevelCommissionRate", parseFloat(e.target.value) || 10)}
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
                onChange={(e) => handleSettingChange("nthLevelDenominator", parseFloat(e.target.value) || 20)}
                min="1"
                max="100"
                step="1"
                placeholder="20"
              />
              <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded">
                (2차:{" "}
                {((100 - settings.firstLevelCommissionRate) / settings.nthLevelDenominator).toFixed(2)}
                %, 3차:{" "}
                {((100 - settings.firstLevelCommissionRate) / Math.pow(settings.nthLevelDenominator, 2)).toFixed(3)}
                %)
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              2차 이상 간접 추천 사용자 수수료 계산에 사용되는 분모값입니다.
              <br />
              공식: (결제금액 - 1차 수수료) ÷ 분모^(차수-1)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-2">
            <h4 className="text-base font-semibold text-blue-800 mb-4">
              수수료 예시 (1,000원 결제 기준)
            </h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm text-gray-800 mb-2 pb-2 border-b border-blue-200 font-medium">
                <span>1차 추천자 수수료:</span>
                <strong className="text-blue-800 font-semibold">
                  {((1000 * settings.firstLevelCommissionRate) / 100).toFixed(2)}원
                </strong>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-800">
                <span>2차 추천자 수수료:</span>
                <strong className="text-blue-800 font-semibold">
                  {((1000 * (100 - settings.firstLevelCommissionRate)) / 100 / settings.nthLevelDenominator).toFixed(2)}원
                </strong>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-800">
                <span>3차 추천자 수수료:</span>
                <strong className="text-blue-800 font-semibold">
                  {((1000 * (100 - settings.firstLevelCommissionRate)) / 100 / Math.pow(settings.nthLevelDenominator, 2)).toFixed(2)}원
                </strong>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-25 p-4 rounded-md">
              <small className="text-xs text-gray-600 leading-relaxed">
                • 1차: 1,000원 × {settings.firstLevelCommissionRate}% ={" "}
                {((1000 * settings.firstLevelCommissionRate) / 100).toFixed(2)}원<br />
                • 나머지 금액: 1,000원 -{" "}
                {((1000 * settings.firstLevelCommissionRate) / 100).toFixed(2)}원 ={" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100).toFixed(2)}원<br />
                • 2차:{" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100).toFixed(2)}원 ÷ {settings.nthLevelDenominator} ={" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100 / settings.nthLevelDenominator).toFixed(2)}원<br />
                • 3차:{" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100).toFixed(2)}원 ÷ {settings.nthLevelDenominator}² ={" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100 / Math.pow(settings.nthLevelDenominator, 2)).toFixed(2)}원
              </small>
            </div>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div className="flex flex-col items-end gap-4 mt-6">
          <button
            type="button"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
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
