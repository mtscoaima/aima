"use client";

import { useState } from "react";
import MemberSignupStatistics from "./MemberSignupStatistics";
import MemberLoginStatistics from "./MemberLoginStatistics";

type MemberSubTab = "signup" | "login";

export default function MemberStatistics() {
  const [activeSubTab, setActiveSubTab] = useState<MemberSubTab>("signup");

  return (
    <div className="tab-content">
      {/* 하위 탭 네비게이션 */}
      <div className="sub-tab-navigation">
        <button
          className={`sub-tab-button ${activeSubTab === "signup" ? "active" : ""}`}
          onClick={() => setActiveSubTab("signup")}
        >
          회원가입 통계
        </button>
        <button
          className={`sub-tab-button ${activeSubTab === "login" ? "active" : ""}`}
          onClick={() => setActiveSubTab("login")}
        >
          로그인 통계
        </button>
      </div>

      {/* 하위 탭 컨텐츠 */}
      <div className="sub-tab-content">
        {activeSubTab === "signup" && <MemberSignupStatistics />}
        {activeSubTab === "login" && <MemberLoginStatistics />}
      </div>
    </div>
  );
}
