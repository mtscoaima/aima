"use client";

import React, { useState } from "react";
import KakaoChannelTab from "./kakao/KakaoChannelTab";
import KakaoAlimtalkTab from "./kakao/KakaoAlimtalkTab";
import KakaoBrandTab from "./kakao/KakaoBrandTab";
import RcsBrandTab from "./rcs/RcsBrandTab";
import RcsTemplateTab from "./rcs/RcsTemplateTab";
import NaverTalkIdTab from "./naver/NaverTalkIdTab";
import NaverTemplateTab from "./naver/NaverTemplateTab";

const KakaoNaverRcsTab = () => {
  const [activeMainTab, setActiveMainTab] = useState("kakao");
  const [activeKakaoSubTab, setActiveKakaoSubTab] = useState("alimtalk");
  const [activeRcsSubTab, setActiveRcsSubTab] = useState("template");
  const [activeNaverSubTab, setActiveNaverSubTab] = useState("template");

  const getTabThemeColor = (tab: string) => {
    switch (tab) {
      case "kakao": return "#795548";
      case "rcs": return "#2c398a";
      case "naver": return "#00a732";
      default: return "#795548";
    }
  };

  const renderSubTabs = () => {
    switch (activeMainTab) {
      case "kakao":
        return (
          <div className="flex gap-2 mb-6">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeKakaoSubTab === "channel"
                  ? "bg-[#79554820] text-[#795548] border border-[#795548]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setActiveKakaoSubTab("channel")}
            >
              채널/그룹
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeKakaoSubTab === "alimtalk"
                  ? "bg-[#79554820] text-[#795548] border border-[#795548]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setActiveKakaoSubTab("alimtalk")}
            >
              알림톡 템플릿
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeKakaoSubTab === "brand"
                  ? "bg-[#79554820] text-[#795548] border border-[#795548]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setActiveKakaoSubTab("brand")}
            >
              브랜드 템플릿
            </button>
          </div>
        );
      case "rcs":
        return (
          <div className="flex gap-2 mb-6">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeRcsSubTab === "brand"
                  ? "bg-[#2c398a20] text-[#2c398a] border border-[#2c398a]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setActiveRcsSubTab("brand")}
            >
              RCS 브랜드
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeRcsSubTab === "template"
                  ? "bg-[#2c398a20] text-[#2c398a] border border-[#2c398a]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setActiveRcsSubTab("template")}
            >
              RCS 템플릿
            </button>
          </div>
        );
      case "naver":
        return (
          <div className="flex gap-2 mb-6">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeNaverSubTab === "talkid"
                  ? "bg-[#00a73220] text-[#00a732] border border-[#00a732]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setActiveNaverSubTab("talkid")}
            >
              톡톡 아이디
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeNaverSubTab === "template"
                  ? "bg-[#00a73220] text-[#00a732] border border-[#00a732]"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => setActiveNaverSubTab("template")}
            >
              네이버 템플릿
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderSubTabContent = () => {
    switch (activeMainTab) {
      case "kakao":
        switch (activeKakaoSubTab) {
          case "channel":
            return <KakaoChannelTab />;
          case "alimtalk":
            return <KakaoAlimtalkTab />;
          case "brand":
            return <KakaoBrandTab />;
          default:
            return <KakaoAlimtalkTab />;
        }
      case "rcs":
        switch (activeRcsSubTab) {
          case "brand":
            return <RcsBrandTab />;
          case "template":
            return <RcsTemplateTab />;
          default:
            return <RcsTemplateTab />;
        }
      case "naver":
        switch (activeNaverSubTab) {
          case "talkid":
            return <NaverTalkIdTab />;
          case "template":
            return <NaverTemplateTab />;
          default:
            return <NaverTemplateTab />;
        }
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 메인 탭 버튼들 */}
      <div className="flex gap-6 border-b border-gray-300 mb-10">
        <button
          className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
            activeMainTab === "kakao"
              ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveMainTab("kakao")}
        >
          카카오
        </button>
        <button
          className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
            activeMainTab === "rcs"
              ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveMainTab("rcs")}
        >
          RCS
        </button>
        <button
          className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
            activeMainTab === "naver"
              ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
              : "text-gray-500 hover:text-blue-600"
          }`}
          onClick={() => setActiveMainTab("naver")}
        >
          네이버톡톡
        </button>
      </div>

      {/* 하위 탭 버튼들 */}
      {renderSubTabs()}

      {/* 하위 탭 컨텐츠 */}
      <div className="flex-1">
        {renderSubTabContent()}
      </div>
    </div>
  );
};

export default KakaoNaverRcsTab;