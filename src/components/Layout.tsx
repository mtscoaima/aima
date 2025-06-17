"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";
import Navigation from "./Navigation";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const { isOpen: sidebarOpen } = useSidebar();
  const pathname = usePathname();

  // 로그인/회원가입 페이지에서는 사이드바를 표시하지 않음
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // 홈페이지인지 확인
  const isHomePage = pathname === "/";

  // 로그인한 사용자이고 인증 페이지 및 홈페이지가 아닌 경우 사이드바 표시
  const showSidebar = isAuthenticated && !isAuthPage && !isHomePage;

  // 홈페이지일 때 body의 main-content 스타일을 직접 제어
  useEffect(() => {
    const mainContent = document.querySelector(".main-content") as HTMLElement;
    if (mainContent) {
      if (isHomePage) {
        mainContent.style.paddingTop = "0px";
        mainContent.style.marginTop = "0px";
      } else {
        // 다른 페이지에서는 기본 스타일로 복원하지 않음 (각 페이지의 CSS가 처리)
      }
    }
  }, [isHomePage]);

  return (
    <div
      className={`app-layout ${
        showSidebar && sidebarOpen ? "sidebar-open" : ""
      } ${isHomePage ? "home-page" : ""}`}
    >
      {showSidebar && <Sidebar />}
      <div className="main-layout">
        <Navigation />
        <main
          className={`main-content ${isHomePage ? "home-main-content" : ""}`}
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
