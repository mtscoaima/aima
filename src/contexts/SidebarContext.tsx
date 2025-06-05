"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // 초기값을 null로 설정하여 클라이언트 사이드에서만 결정되도록 함
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 화면 크기에 따른 초기 사이드바 상태 설정
  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktop = window.innerWidth > 768;
      if (!isInitialized) {
        setIsOpen(isDesktop);
        setIsInitialized(true);
      }
    };

    // 초기 화면 크기 체크
    checkScreenSize();

    // 화면 크기 변경 시 처리
    const handleResize = () => {
      const isDesktop = window.innerWidth > 768;
      // 데스크톱에서는 사이드바를 열고, 모바일에서는 닫기
      if (isDesktop) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isInitialized]);

  const toggle = () => setIsOpen(!isOpen);
  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
