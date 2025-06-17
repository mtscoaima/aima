"use client";

import React, { useEffect } from "react";
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
    <div className={`app-layout ${isHomePage ? "home-page" : ""}`}>
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
