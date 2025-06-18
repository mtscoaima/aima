"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import Footer from "./Footer";
import "./Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();

  // 홈페이지인지 확인
  const isHomePage = pathname === "/";

  // 헤더 아래 여백이 필요한 페이지들 확인
  const needsHeaderPadding =
    pathname === "/support" ||
    pathname.startsWith("/target-marketing/") ||
    pathname === "/my-site/advertiser/profile" ||
    pathname === "/my-site/advertiser/dashboard";

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
