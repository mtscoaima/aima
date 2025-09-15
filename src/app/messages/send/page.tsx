"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import MessageSendTab from "@/components/messages/MessageSendTab";
import KakaoNaverRcsTab from "@/components/messages/KakaoNaverRcsTab";

const MessageSendPage = () => {
  const searchParams = useSearchParams();

  // State for tabs
  const [activeTab, setActiveTab] = useState("message-send");

  // Initialize activeTab from URL parameters
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["message-send", "kakao-naver-rcs"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "message-send":
        return <MessageSendTab />;
      case "kakao-naver-rcs":
        return <KakaoNaverRcsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col p-5 relative">
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-black text-2xl font-semibold leading-tight tracking-tight m-0 mb-2">메시지 발송</h1>
        </header>

        <div className="flex gap-6 border-b border-gray-300 mb-10">
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "message-send"
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("message-send")}
          >
            메시지 보내기
          </button>
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "kakao-naver-rcs"
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("kakao-naver-rcs")}
          >
            카카오/네이버/RCS
          </button>
        </div>

        <div className="flex-1">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default MessageSendPage;