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
      id: "user-management",
      label: "회원관리",
      icon: "👥",
      href: "/admin/user-management",
    },
    {
      id: "point-charge-management",
      label: "포인트 충전 관리",
      icon: "💰",
      href: "/admin/point-charge-management",
    },
    {
      id: "campaigns",
      label: "캠페인 관리",
      icon: "📢",
      href: "/admin/campaigns",
    },
    {
      id: "member-approval",
      label: "기업정보관리",
      icon: "✅",
      href: "/admin/member-approval",
    },
    {
      id: "customer-support",
      label: "고객지원 관리",
      icon: "🎧",
      href: "/admin/customer-support",
    },
    {
      id: "system-settings",
      label: "설정관리",
      icon: "⚙️",
      href: "/admin/system-settings",
    },
    {
      id: "statistics",
      label: "통계 관리",
      icon: "📊",
      href: "/admin/statistics",
    },
    {
      id: "tax-invoices",
      label: "세금계산서 관리",
      icon: "🧾",
      href: "/admin/tax-invoices",
    },
  ];

  const handleMenuClick = (href: string) => {
    // 모바일에서 메뉴 클릭 시 사이드바 닫기
    if (window.innerWidth <= 768) {
      onClose();
    }
    // 회원관리, 포인트 충전 관리, 캠페인 관리, 기업정보관리, 고객지원 관리, 설정관리, 통계 관리, 세금계산서 관리 페이지는 실제로 이동 가능
    if (
      href === "/admin/user-management" ||
      href === "/admin/point-charge-management" ||
      href === "/admin/campaigns" ||
      href === "/admin/member-approval" ||
      href === "/admin/customer-support" ||
      href === "/admin/system-settings" ||
      href === "/admin/statistics" ||
      href === "/admin/tax-invoices"
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
