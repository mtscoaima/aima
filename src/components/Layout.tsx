"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import Navigation from "./Navigation";
import Footer from "./Footer";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

// 로딩 스피너 컴포넌트
function LoadingSpinner() {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-text">
        <p>로딩 중...</p>
      </div>
    </div>
  );
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  const { isLoading } = useAuth();

  // 홈페이지인지 확인
  const isHomePage = pathname === "/";

  // 관리자 페이지인지 확인
  const isAdminPage = pathname.startsWith("/admin");

  // 헤더 아래 여백이 필요한 페이지들 확인
  const needsHeaderPadding =
    pathname === "/support" ||
    pathname.startsWith("/target-marketing/") ||
    pathname === "/my-site/advertiser/profile" ||
    pathname === "/my-site/advertiser/dashboard";

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // 관리자 페이지인 경우 별도 레이아웃
  if (isAdminPage) {
    return <div className="admin-layout">{children}</div>;
  }

  return (
    <div className={`app-layout ${isHomePage ? "home-page" : ""}`}>
      <div className="main-layout">
        <Navigation />
        <main
          className={`main-content ${isHomePage ? "home-main-content" : ""} ${
            needsHeaderPadding ? "with-header-padding" : ""
          }`}
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
