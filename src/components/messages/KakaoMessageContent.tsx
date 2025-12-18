"use client";

import React, { useState, useEffect } from "react";
import AlimtalkTab, { type AlimtalkData } from "./AlimtalkTab";
import BrandTab, { type BrandData } from "./BrandTab";

interface Recipient {
  phone_number: string;
  name?: string;
}

interface KakaoMessageContentProps {
  recipients?: Recipient[];
  selectedSenderNumber?: string;
  onAlimtalkDataChange?: (data: AlimtalkData) => void;
  onBrandDataChange?: (data: BrandData) => void;
  onKakaoTabChange?: (tab: string) => void;
}

const KakaoMessageContent: React.FC<KakaoMessageContentProps> = ({
  recipients = [],
  selectedSenderNumber = "",
  onAlimtalkDataChange,
  onBrandDataChange,
  onKakaoTabChange,
}) => {
  const [activeKakaoTab, setActiveKakaoTab] = useState("alimtalk");

  // 카카오 탭 변경 시 상위로 전달
  useEffect(() => {
    if (onKakaoTabChange) {
      onKakaoTabChange(activeKakaoTab);
    }
  }, [activeKakaoTab, onKakaoTabChange]);

  return (
    <>
      {/* 카카오톡 하위 탭 */}
      <div className="flex gap-2 mb-6">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeKakaoTab === "alimtalk"
              ? "border border-[#795548]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          style={activeKakaoTab === "alimtalk" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
          onClick={() => setActiveKakaoTab("alimtalk")}
        >
          알림톡
        </button>
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeKakaoTab === "brand"
              ? "border border-[#795548]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          style={activeKakaoTab === "brand" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
          onClick={() => setActiveKakaoTab("brand")}
        >
          브랜드 메시지
        </button>
      </div>

      {/* 알림톡 탭 내용 */}
      {activeKakaoTab === "alimtalk" && (
        <AlimtalkTab
          recipients={recipients}
          callbackNumber={selectedSenderNumber}
          onDataChange={onAlimtalkDataChange}
        />
      )}

      {/* 브랜드 메시지 탭 내용 */}
      {activeKakaoTab === "brand" && (
        <BrandTab
          recipients={recipients}
          callbackNumber={selectedSenderNumber}
          onDataChange={onBrandDataChange}
        />
      )}
    </>
  );
};

export default KakaoMessageContent;