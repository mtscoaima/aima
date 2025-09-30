"use client";

import React, { useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { useRouter } from "next/navigation";

export default function AddPlacePage() {
  const router = useRouter();
  const [placeName, setPlaceName] = useState("");
  const [iconName, setIconName] = useState("");
  const [iconColor, setIconColor] = useState("#8BC34A");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorOptions = [
    "#F59E0B", "#EF4444", "#EC4899", "#DC2626", "#06B6D4",
    "#1D4ED8", "#8BC34A", "#059669", "#A78BFA", "#78350F",
    "#6B7280", "#374151"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("장소 추가 기능은 준비 중입니다.");
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen bg-gray-50">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            공간 추가하기
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Place Name Input */}
          <div>
            <label className="block text-gray-900 font-medium mb-3">
              공간 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="공간 이름을 입력하세요(2글자 이상)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              minLength={2}
            />
            <div className="flex items-start mt-2">
              <div className="text-gray-400 text-sm mr-2">ℹ️</div>
              <p className="text-gray-500 text-sm">
                공간 이름은 이용객에게 발송되는 메시지 앞부분과 결제 링크에서 자동으로 표시됩니다.
              </p>
            </div>
          </div>

          {/* Icon Settings */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">아이콘 설정</h3>
            
            {/* Icon Preview */}
            <div className="flex justify-center mb-6">
              <div 
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-xl font-semibold"
                style={{ backgroundColor: iconColor }}
              >
                {iconName.slice(0, 2) || ""}
              </div>
            </div>

            {/* Icon Name Input */}
            <input
              type="text"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder="아이콘 문구를 입력해 주세요. (2글자 이내)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-6"
              maxLength={2}
            />

            {/* Icon Color Selector */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full flex items-center justify-between py-3"
              >
                <span className="text-gray-900 font-medium">아이콘 색상</span>
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-full mr-3"
                    style={{ backgroundColor: iconColor }}
                  ></div>
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className={`text-gray-400 transition-transform ${
                      showColorPicker ? 'rotate-90' : ''
                    }`}
                  >
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </button>
              
              {/* Color Picker Grid */}
              {showColorPicker && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-5 gap-4">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setIconColor(color);
                          setShowColorPicker(false);
                        }}
                        className={`w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                          iconColor === color 
                            ? 'ring-4 ring-gray-300 ring-opacity-50' 
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={!placeName || placeName.length < 2}
              className={`w-full py-4 rounded-lg font-medium text-white transition-colors ${
                placeName && placeName.length >= 2
                  ? 'bg-gray-800 hover:bg-gray-900'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              완료
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}