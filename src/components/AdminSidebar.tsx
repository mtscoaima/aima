"use client";

import React from "react";
import { usePathname } from "next/navigation";
import "./AdminSidebar.css";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    {
      id: "dashboard",
      label: "대시보드",
      icon: "📊",
      href: "/admin/dashboard",
    },
    {
      id: "messages",
      label: "메시지 관리",
      icon: "💬",
      href: "/admin/messages",
    },
    {
      id: "templates",
      label: "템플릿 관리",
      icon: "📝",
      href: "/admin/templates",
    },
    {
      id: "recipients",
      label: "수신자 관리",
      icon: "🎯",
      href: "/admin/recipients",
    },
    {
      id: "campaigns",
      label: "캠페인 관리",
      icon: "📢",
      href: "/admin/campaigns",
    },
    {
      id: "user-management",
      label: "사용자 관리",
      icon: "👥",
      href: "/admin/user-management",
    },
    {
      id: "system-settings",
      label: "시스템 설정",
      icon: "⚙️",
      href: "/admin/system-settings",
    },
  ];

  const handleMenuClick = (href: string) => {
    // 모바일에서 메뉴 클릭 시 사이드바 닫기
    if (window.innerWidth <= 768) {
      onClose();
    }
    // 대시보드, 메시지 관리, 템플릿 관리, 수신자 관리, 캠페인 관리, 사용자 관리, 시스템 설정 페이지는 실제로 이동 가능
    if (
      href === "/admin/dashboard" ||
      href === "/admin/messages" ||
      href === "/admin/templates" ||
      href === "/admin/recipients" ||
      href === "/admin/campaigns" ||
      href === "/admin/user-management" ||
      href === "/admin/system-settings"
    ) {
      window.location.href = href;
    }
    // 다른 페이지들은 추후 구현 예정
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && <div className="admin-sidebar-overlay" onClick={onClose} />}

      {/* 사이드바 */}
      <div className={`admin-sidebar ${isOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <h2>관리자 포털</h2>
        </div>

        <nav className="admin-nav">
          <ul>
            {menuItems.map((item) => (
              <li
                key={item.id}
                className={`nav-item ${pathname === item.href ? "active" : ""}`}
                onClick={() => handleMenuClick(item.href)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}
