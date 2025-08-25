"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AnnouncementTab from "../../components/support/AnnouncementTab";
import FaqTab from "../../components/support/FaqTab";
import ContactTab from "../../components/support/ContactTab";

const SupportPage = () => {
  const searchParams = useSearchParams();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState("announcement");

  // Initialize activeTab from URL parameters
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["announcement", "faq", "contact"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "announcement":
        return <AnnouncementTab />;
      case "faq":
        return <FaqTab />;
      case "contact":
        return <ContactTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col p-5 relative">
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-black text-2xl font-semibold leading-tight tracking-tight m-0 mb-2">고객센터</h1>
        </header>

        <div className="flex gap-6 border-b border-gray-300 mb-10">
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "announcement" 
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("announcement")}
          >
            공지사항
          </button>
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "faq" 
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("faq")}
          >
            자주 묻는 질문
          </button>
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "contact" 
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("contact")}
          >
            1:1 문의
          </button>
        </div>

        <div className="flex-1">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default SupportPage;
