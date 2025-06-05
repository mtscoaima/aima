"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { BarChart3, MessageSquare, Send, FileText, Target } from "lucide-react";
import "./Sidebar.css";

interface MenuItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: "console",
    title: "콘솔",
    icon: BarChart3,
    children: [
      {
        id: "dashboard",
        title: "대시보드",
        icon: BarChart3,
        path: "/my-site/advertiser/dashboard",
      },
    ],
  },
  {
    id: "message",
    title: "메시지",
    icon: MessageSquare,
    children: [
      {
        id: "send-message",
        title: "메시지 보내기",
        icon: Send,
        path: "/messages/send",
      },
      {
        id: "send-history",
        title: "발송 내역",
        icon: FileText,
        path: "/messages/history",
      },
      {
        id: "ai-target-marketing",
        title: "AI타깃마케팅",
        icon: Target,
        path: "/target-marketing",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  const isActive = (path: string) => {
    return pathname === path;
  };

  // 모바일에서 링크 클릭 시 사이드바 닫기
  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      close();
    }
  };

  // 사이드바 외부 클릭 시 닫기 (모바일)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth <= 768 && isOpen) {
        const target = event.target as Element;
        if (!target.closest(".sidebar")) {
          close();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isOpen, close]);

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isItemActive = item.path ? isActive(item.path) : false;
    const Icon = item.icon;

    return (
      <div key={item.id} className="sidebar-menu-item">
        {item.path ? (
          <Link
            href={item.path}
            className={`sidebar-menu-button ${
              isItemActive ? "sidebar-menu-button--active" : ""
            } ${
              level === 0
                ? "sidebar-menu-button--parent"
                : "sidebar-menu-button--child"
            }`}
            onClick={handleLinkClick}
          >
            <Icon className="sidebar-menu-icon" />
            <span className="sidebar-menu-title">{item.title}</span>
          </Link>
        ) : (
          <div className="sidebar-menu-label">
            <Icon className="sidebar-menu-icon" />
            <span className="sidebar-menu-title">{item.title}</span>
          </div>
        )}

        {hasChildren && (
          <div className="sidebar-submenu">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* 모바일 배경 오버레이 */}
      {isOpen && <div className="sidebar-overlay" onClick={close} />}

      <div className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <BarChart3 className="sidebar-brand-icon" />
            <span className="sidebar-brand-text">MTS플러스</span>
          </div>
        </div>

        <div className="sidebar-content">
          <nav className="sidebar-nav">
            <div className="sidebar-nav-main">
              {menuItems.map((item) => renderMenuItem(item))}
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
