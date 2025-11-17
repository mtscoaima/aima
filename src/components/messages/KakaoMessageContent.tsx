"use client";

import React, { useState, useEffect } from "react";
import AlimtalkTab, { type AlimtalkData } from "./AlimtalkTab";
import FriendtalkTab, { type FriendtalkData } from "./FriendtalkTab";
import BrandTab, { type BrandData } from "./BrandTab";
import NaverTalkContent, { type NaverData } from "./NaverTalkContent";

interface Recipient {
  phone_number: string;
  name?: string;
}

interface KakaoMessageContentProps {
  recipients?: Recipient[];
  selectedSenderNumber?: string;
  onAlimtalkDataChange?: (data: AlimtalkData) => void;
  onFriendtalkDataChange?: (data: FriendtalkData) => void;
  onBrandDataChange?: (data: BrandData) => void;
  onNaverDataChange?: (data: NaverData) => void;
  onKakaoTabChange?: (tab: string) => void;
}

const KakaoMessageContent: React.FC<KakaoMessageContentProps> = ({
  recipients = [],
  selectedSenderNumber = "",
  onAlimtalkDataChange,
  onFriendtalkDataChange,
  onBrandDataChange,
  onNaverDataChange,
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
            activeKakaoTab === "friendtalk"
              ? "border border-[#795548]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          style={activeKakaoTab === "friendtalk" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
          onClick={() => setActiveKakaoTab("friendtalk")}
        >
          친구톡
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
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            activeKakaoTab === "naver"
              ? "border border-[#00a732]"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
          style={activeKakaoTab === "naver" ? { backgroundColor: "#00a73220", color: "#00a732" } : {}}
          onClick={() => setActiveKakaoTab("naver")}
        >
          네이버 톡톡
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

      {/* 친구톡 탭 내용 */}
      {activeKakaoTab === "friendtalk" && (
        <FriendtalkTab
          recipients={recipients}
          callbackNumber={selectedSenderNumber}
          onDataChange={onFriendtalkDataChange}
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

      {/* 네이버 톡톡 탭 내용 */}
      {activeKakaoTab === "naver" && (
        <NaverTalkContent
          recipients={recipients}
          selectedSenderNumber={selectedSenderNumber}
          onDataChange={onNaverDataChange}
        />
      )}

    </>
  );
};

export default KakaoMessageContent;