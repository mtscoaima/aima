"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
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
  shouldRestore?: boolean;
}

// 실제 캠페인 데이터 인터페이스

const tabs = [
  { id: "naver-talktalk", label: "캠페인 만들기" },
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
  
  // 복원 관련 상태
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [hasHandledRestore, setHasHandledRestore] = useState(false);

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

  // 복원 상태 체크 함수 - 캠페인 만들기 탭에서만 동작
  const checkForRestorableState = useCallback(() => {
    if (typeof window === 'undefined' || hasHandledRestore || activeTab !== 'naver-talktalk') return;
    
    try {
      const savedStateJson = sessionStorage.getItem('targetMarketingState');
      if (savedStateJson) {
        const savedStateData = JSON.parse(savedStateJson);
        // 30분 이내의 상태만 복원 가능 (더 넉넉하게)
        if (Date.now() - savedStateData.timestamp < 30 * 60 * 1000) {
          setShowRestoreModal(true);
        } else {
          // 만료된 상태 제거
          sessionStorage.removeItem('targetMarketingState');
        }
      }
    } catch (error) {
      console.error('복원 상태 확인 실패:', error);
      sessionStorage.removeItem('targetMarketingState');
    }
  }, [hasHandledRestore, activeTab]);

  // 페이지 진입 시 복원 여부 확인 (마운트, focus, visibilitychange 이벤트) - 캠페인 만들기 탭에서만
  useEffect(() => {
    if (currentView === 'main' && activeTab === 'naver-talktalk') {
      checkForRestorableState();
    }

    // 페이지가 포커스될 때마다 체크 (뒤로가기, 탭 전환 등)
    const handleFocus = () => {
      if (!showRestoreModal && currentView === 'main' && activeTab === 'naver-talktalk') {
        checkForRestorableState();
      }
    };

    // 페이지 가시성이 변경될 때마다 체크
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !showRestoreModal && currentView === 'main' && activeTab === 'naver-talktalk') {
        checkForRestorableState();
      }
    };

    // 브라우저 히스토리 변경 시 체크
    const handlePopState = () => {
      if (!showRestoreModal && currentView === 'main' && activeTab === 'naver-talktalk') {
        setTimeout(() => checkForRestorableState(), 100);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [checkForRestorableState, showRestoreModal, currentView, hasHandledRestore, activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  const handleNavigateToDetail = (templateId?: number, useTemplate?: boolean) => {
    setDetailProps({ templateId, useTemplate });
    setCurrentView("detail");
  };

  const handleRestoreConfirm = () => {
    // 복원 확인 시 detail 뷰로 이동하고 복원 플래그 설정
    setCurrentView("detail");
    setDetailProps({ useTemplate: false, shouldRestore: true });
    setShowRestoreModal(false);
    setHasHandledRestore(true);
  };

  const handleRestoreCancel = () => {
    // 취소 시 저장된 상태 제거
    sessionStorage.removeItem('targetMarketingState');
    setShowRestoreModal(false);
    setHasHandledRestore(true);
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

      {/* 복원 확인 모달 */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">이전 작업 복원</h2>
              <p className="text-gray-600 mb-6">
                이전에 작업하던 캠페인이 있습니다. 이어서 작업하시겠습니까?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  className="px-4 py-2 text-gray-700 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
                  onClick={handleRestoreCancel}
                >
                  취소
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white border-none rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleRestoreConfirm}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
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