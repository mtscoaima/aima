"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import MessageSendTab from "@/components/messages/MessageSendTab";
import SendResultTab from "@/components/messages/SendResultTab";

const MessageSendPage = () => {
  const searchParams = useSearchParams();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState("send");

  // Initialize activeTab from URL parameters
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["send", "result"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "send":
        return <MessageSendTab />;
      case "result":
        return <SendResultTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col p-5 relative">
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-black text-2xl font-semibold leading-tight tracking-tight m-0 mb-2">문자발송</h1>
        </header>

        <div className="flex gap-6 border-b border-gray-300 mb-10">
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "send" 
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("send")}
          >
            문자발송
          </button>
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "result" 
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("result")}
          >
            발송결과
          </button>
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
};

export default MessageSendPage;
