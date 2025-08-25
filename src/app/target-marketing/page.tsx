"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TargetMarketingDetail from "@/components/target-marketing/TargetMarketingDetail";
import NaverTalkTalkTab from "@/components/messages/NaverTalkTalkTab";
import CampaignManagementTab from "@/components/campaigns/CampaignManagementTab";
import TemplateManagementTab from "@/components/messages/TemplateManagementTab";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";

interface DetailProps {
  templateId?: number | null;
  useTemplate?: boolean;
  initialMessage?: string;
  initialImage?: string | null;
}

// 실제 캠페인 데이터 인터페이스

const tabs = [
  { id: "naver-talktalk", label: "네이버 톡톡" },
  { id: "campaign-management", label: "캠페인 관리" },
  { id: "template-management", label: "템플릿 관리" },
];

function TargetMarketingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 상태 관리
  const [activeTab, setActiveTab] = useState("naver-talktalk");

  // 뷰 상태 관리
  const [currentView, setCurrentView] = useState<"main" | "detail">("main");
  const [detailProps, setDetailProps] = useState<DetailProps>({});

  // URL 쿼리 파라미터에서 tab 값 읽기
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 탭 변경 시 뷰 초기화
  useEffect(() => {
    if (activeTab !== "naver-talktalk" && currentView === "detail") {
      setCurrentView("main");
    }
  }, [activeTab, currentView]);

  // 캠페인 데이터 로드

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  const handleNavigateToDetail = (templateId?: number, useTemplate?: boolean) => {
    setDetailProps({ templateId, useTemplate });
    setCurrentView("detail");
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col max-w-7xl w-full mx-auto p-5 relative">
      <div className="mb-8 px-1">
        <h1 className="text-black text-2xl font-semibold leading-tight tracking-tight m-0">AI 타깃 마케팅</h1>
      </div>

      <div className="flex gap-2 mb-6 px-1 border-b border-gray-300">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-6 py-3 bg-transparent border-none border-b-2 text-center font-medium text-base leading-tight tracking-tight cursor-pointer whitespace-nowrap transition-all duration-200 relative -mb-px ${
              activeTab === tab.id 
                ? "text-blue-500 border-blue-500 font-semibold" 
                : "text-gray-500 border-transparent hover:text-blue-600 hover:bg-blue-50"
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col">
        {currentView === "detail" && activeTab === "naver-talktalk" ? (
          <TargetMarketingDetail {...detailProps} />
        ) : (
          <>
            {activeTab === "naver-talktalk" && (
              <NaverTalkTalkTab
                onNavigateToDetail={handleNavigateToDetail}
              />
            )}
            {activeTab === "campaign-management" && (
              <CampaignManagementTab 
                onNavigateToNaver={() => handleTabChange("naver-talktalk")}
              />
            )}
            {activeTab === "template-management" && (
              <TemplateManagementTab 
                onNavigateToNaver={() => handleTabChange("naver-talktalk")}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function TargetMarketingPage() {
  return (
    <AdvertiserGuardWithDisabled>
      <Suspense fallback={<div>Loading...</div>}>
        <TargetMarketingPageContent />
      </Suspense>
    </AdvertiserGuardWithDisabled>
  );
}