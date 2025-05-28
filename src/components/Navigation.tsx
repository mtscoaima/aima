"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";

export default function Navigation() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { toggle: toggleSidebar, isOpen: sidebarOpen } = useSidebar();
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollPos = window.scrollY;

      // 스크롤 방향 감지: 이전 위치보다 아래면 내려가는 중
      const isScrollingDown = currentScrollPos > prevScrollPos;

      // 스크롤이 맨 위에 있으면 항상 표시
      if (currentScrollPos < 10) {
        setVisible(true);
      } else {
        // 스크롤 방향에 따라 네비게이션 바 표시/숨김
        setVisible(!isScrollingDown);
      }

      setPrevScrollPos(currentScrollPos);
    };

    // 스크롤 이벤트 리스너 등록
    window.addEventListener("scroll", handleScroll);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [prevScrollPos]);

  const handleLogout = () => {
    logout();
    setShowUserDropdown(false);
    router.push("/");
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".user-dropdown-container")) {
        setShowUserDropdown(false);
      }
    };

    if (showUserDropdown) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showUserDropdown]);

  return (
    <nav
      className={`navigation ${visible ? "nav-visible" : "nav-hidden"} ${
        isAuthenticated && sidebarOpen ? "sidebar-open" : ""
      }`}
    >
      <div className="nav-container">
        <div className="nav-left">
          {isAuthenticated && (
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle-btn"
              aria-label="사이드바 토글"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}

          <Link href="/" className="logo">
            MTS플러스
          </Link>
        </div>

        <div className="nav-right">
          <div className="auth-buttons">
            {isAuthenticated ? (
              <div className="user-dropdown-container">
                <button
                  onClick={toggleUserDropdown}
                  className="user-info-button"
                >
                  <span className="user-name">{user?.name || user?.email}</span>
                  <span className="user-greeting">님</span>
                  <svg
                    className={`dropdown-arrow ${
                      showUserDropdown ? "rotated" : ""
                    }`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M3 4.5L6 7.5L9 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {showUserDropdown && (
                  <div className="user-dropdown">
                    <div className="user-dropdown-header">
                      <div className="user-avatar">
                        {(user?.name || user?.email || "")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="user-details">
                        <div className="user-name-full">
                          {user?.name || user?.email}
                        </div>
                        <div className="user-email">{user?.email}</div>
                      </div>
                    </div>
                    <div className="user-dropdown-divider"></div>
                    <div className="user-dropdown-menu">
                      <Link
                        href="/my-site/advertiser/profile"
                        className="dropdown-menu-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M8 8C10.2091 8 12 6.20914 12 4C12 1.79086 10.2091 0 8 0C5.79086 0 4 1.79086 4 4C4 6.20914 5.79086 8 8 8Z"
                            fill="currentColor"
                          />
                          <path
                            d="M8 10C3.58172 10 0 13.5817 0 18H16C16 13.5817 12.4183 10 8 10Z"
                            fill="currentColor"
                          />
                        </svg>
                        프로필 관리
                      </Link>
                      <Link
                        href="/my-site/advertiser/dashboard"
                        className="dropdown-menu-item"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path d="M2 2H6V6H2V2Z" fill="currentColor" />
                          <path d="M10 2H14V6H10V2Z" fill="currentColor" />
                          <path d="M2 10H6V14H2V10Z" fill="currentColor" />
                          <path d="M10 10H14V14H10V10Z" fill="currentColor" />
                        </svg>
                        대시보드
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="dropdown-menu-item logout-item"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M6 2H2V14H6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M10 12L14 8L10 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M14 8H6"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary">
                  로그인
                </Link>
                <Link href="/signup" className="btn btn-primary">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
