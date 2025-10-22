"use client";

import { useState, useEffect } from "react";
import { usePricing, PricingSetting } from "@/contexts/PricingContext";

export default function PricingSettings() {
  const { pricingSettings, isLoading, refreshSettings } = usePricing();
  const [localSettings, setLocalSettings] = useState<PricingSetting[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalSettings(pricingSettings);
  }, [pricingSettings]);

  const handlePriceChange = (id: number, newPrice: number) => {
    setLocalSettings(prev =>
      prev.map(setting =>
        setting.id === id ? { ...setting, price: newPrice } : setting
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const updates = localSettings.map(setting => ({
        id: setting.id,
        price: setting.price
      }));

      const response = await fetch("/api/pricing-settings", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "저장에 실패했습니다.");
      }

      await refreshSettings();
      setHasChanges(false);
      alert("차등 단가 설정이 저장되었습니다.");
    } catch (error) {
      console.error("차등 단가 설정 저장 실패:", error);
      alert(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings(pricingSettings);
    setHasChanges(false);
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
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">차등 단가 설정</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            광고 수신자 조건에 따른 차등 단가를 설정합니다. 변경 후 반드시 저장 버튼을 클릭하세요.
          </p>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                  구분
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                  대항목
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                  중항목
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                  차등단가
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left text-sm font-medium text-gray-700">
                  비고
                </th>
              </tr>
            </thead>
            <tbody>
              {localSettings.map((setting) => (
                <tr key={setting.id} className="hover:bg-gray-50 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                    {setting.category === "base" ? "공통" : setting.category === "media" ? "매체" : "고객"}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                    {setting.sub_category}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-sm text-gray-800">
                    {setting.condition_type}
                  </td>
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={setting.price}
                        onChange={(e) => handlePriceChange(setting.id, parseInt(e.target.value) || 0)}
                        className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="10"
                      />
                      <span className="text-sm text-gray-600">원</span>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-xs text-gray-600">
                    {setting.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 안내 메시지 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">💡 차등 단가 적용 방식</h3>
          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
            <li><strong>기본단가:</strong> 모든 캠페인의 기본 단가</li>
            <li><strong>위치 (N * 단가):</strong> 선택한 위치 개수만큼 곱하여 적용</li>
            <li><strong>성별:</strong> 현재는 추가 비용 없음 (0원)</li>
            <li><strong>나이 (N * 단가):</strong> 선택한 연령대 개수만큼 곱하여 적용</li>
            <li><strong>결제금액:</strong> 현재는 추가 비용 없음 (0원)</li>
            <li><strong>업종:</strong> 업종 선택 시 추가</li>
            <li><strong>결제이력:</strong> 결제 승인 시간대 설정 시 추가</li>
          </ul>
          <p className="text-xs text-gray-600 mt-3">
            예: 기본 100원 + 위치 3개소(3×20원) + 나이대 2개(2×20원) + 업종(20원) = 200원/건
          </p>
        </div>

        {/* 저장 버튼 */}
        <div className="mt-6 flex justify-end gap-3">
          {hasChanges && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              취소
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
