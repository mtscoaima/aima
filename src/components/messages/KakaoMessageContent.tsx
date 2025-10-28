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

      {/* 상단 섹션: 카카오 채널 */}
      <div className="mb-4">
        {/* 알림톡일 때만 알림톡 템플릿 섹션 표시 */}
        {activeKakaoTab === "alimtalk" ? (
          <div className="flex gap-6">
            {/* 좌측: 카카오 채널 */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">카카오 채널</h3>
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 text-sm">
                    연동된 채널이 없습니다.
                  </div>
                  <button className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: "#795548" }}>
                    채널 연동하기 ＞
                  </button>
                </div>
              </div>
            </div>

            {/* 우측: 알림톡 템플릿 */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700">알림톡 템플릿</h3>
                <div className="flex items-center justify-between">
                  <div className="text-center py-3.5 text-gray-500 text-sm">
                    먼저 카카오 채널을 선택해주세요.
                  </div>
                  <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200">
                    선택
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : activeKakaoTab === "friendtalk" ? (
          /* 친구톡일 때는 카카오 채널만 표시 */
          <div className="w-1/2">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3">카카오 채널</h3>
              <div className="flex items-center justify-between">
                <div className="text-gray-500 text-sm">
                  연동된 채널이 없습니다.
                </div>
                <button className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: "#795548" }}>
                  채널 연동하기 ＞
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* 브랜드 메시지일 때는 카카오 채널 + 브랜드 템플릿 */
          <div className="flex gap-6">
            {/* 좌측: 카카오 채널 */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">카카오 채널</h3>
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 text-sm">
                    연동된 채널이 없습니다.
                  </div>
                  <button className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90" style={{ backgroundColor: "#795548" }}>
                    채널 연동하기 ＞
                  </button>
                </div>
              </div>
            </div>

            {/* 우측: 브랜드 템플릿 */}
            <div className="flex-1">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700">브랜드 템플릿</h3>
                <div className="flex items-center justify-between">
                  <div className="text-center py-3.5 text-gray-500 text-sm">
                    먼저 카카오 채널을 선택해주세요.
                  </div>
                  <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200">
                    선택
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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