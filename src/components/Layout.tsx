"use client";

import React from "react";
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

  // 로그인한 사용자이고 인증 페이지가 아닌 경우 사이드바 표시
  const showSidebar = isAuthenticated && !isAuthPage;

  // 홈페이지가 아닌 경우에만 Navigation 표시
  const showNavigation = !isHomePage;

  return (
    <div
      className={`app-layout ${
        showSidebar && sidebarOpen ? "sidebar-open" : ""
      }`}
    >
      {showSidebar && <Sidebar />}
      <div className="main-layout">
        {showNavigation && <Navigation />}
        <main className="main-content">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
