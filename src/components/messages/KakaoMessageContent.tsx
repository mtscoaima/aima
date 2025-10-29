"use client";

import React, { useState } from "react";
import AlimtalkTab from "./AlimtalkTab";
import FriendtalkTab from "./FriendtalkTab";
import BrandTab from "./BrandTab";

interface Recipient {
  phone_number: string;
  name?: string;
}

interface KakaoMessageContentProps {
  recipients?: Recipient[];
  selectedSenderNumber?: string;
}
const KakaoMessageContent: React.FC<KakaoMessageContentProps> = ({
  recipients = [],
  selectedSenderNumber = "",
}) => {
  const [activeKakaoTab, setActiveKakaoTab] = useState("alimtalk");

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
      </div>

      {/* 알림톡 탭 내용 */}
      {activeKakaoTab === "alimtalk" && (
        <AlimtalkTab
          recipients={recipients.map(r => r.phone_number)}
          callbackNumber={selectedSenderNumber}
        />
      )}

      {/* 친구톡 탭 내용 */}
      {activeKakaoTab === "friendtalk" && (
        <FriendtalkTab
          recipients={recipients.map(r => r.phone_number)}
          callbackNumber={selectedSenderNumber}
        />
      )}

      {/* 브랜드 메시지 탭 내용 */}
      {activeKakaoTab === "brand" && (
        <BrandTab
          recipients={recipients.map(r => r.phone_number)}
          callbackNumber={selectedSenderNumber}
        />
      )}

    </>
  );
};

export default KakaoMessageContent;