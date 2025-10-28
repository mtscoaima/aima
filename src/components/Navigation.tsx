"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationUtils } from "@/hooks/useNotificationUtils";
import { Notification } from "@/contexts/NotificationContext";
import ConfirmDialog from "./ConfirmDialog";
import Image from "next/image";

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const notificationUtils = useNotificationUtils();
  const {
    notifications,
    unreadCount,
    isLoading,
    handleNotificationClick,
    markAllAsRead,
    getNotificationIcon,
    getRelativeTime,
    truncateMessage,
  } = notificationUtils;
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isHomePage = pathname === "/";
  const isAdminPage = pathname.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/auth/find-username" || pathname === "/auth/find-password";
  const isBusinessVerificationPage =
    pathname === "/my-site/advertiser/business-verification";

  const navClassName = isHomePage
    ? "navigation"
    : "navigation navigation-solid";

  const handleLogout = () => {
    setShowUserDropdown(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    router.push("/");
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  // 네비게이션 메뉴 클릭 핸들러
  const handleNavClick = (href: string) => {
    router.push(href);
    setShowMobileMenu(false); // 모바일 메뉴 닫기
  };

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".user-dropdown-container")) {
        setShowUserDropdown(false);
      }
      if (!target.closest(".notification-dropdown-container")) {
        setShowNotifications(false);
      }
      if (
        !target.closest(".mobile-menu-container") &&
        !target.closest(".hamburger-btn")
      ) {
        setShowMobileMenu(false);
      }
    };

    if (showUserDropdown || showNotifications || showMobileMenu) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showUserDropdown, showNotifications, showMobileMenu]);

  return (
    <>
      <nav className={navClassName}>
        <div className="nav-container">
        <div className="nav-left">
          {/* 햄버거 버튼 - 관리자 페이지, 인증 페이지, 사업자 인증 페이지에서는 숨김 */}
          {!isAdminPage && !isAuthPage && !isBusinessVerificationPage && (
            <button
              className="hamburger-btn"
              onClick={toggleMobileMenu}
              aria-label="메뉴 열기/닫기"
            >
              <span
                className={`hamburger-line ${showMobileMenu ? "active" : ""}`}
              ></span>
              <span
                className={`hamburger-line ${showMobileMenu ? "active" : ""}`}
              ></span>
              <span
                className={`hamburger-line ${showMobileMenu ? "active" : ""}`}
              ></span>
            </button>
          )}

          <Link href="/">
          <Image
                src="/images/landing/aima-logo-navigation.png"
                alt="에이마 로고"
                width={106}
                height={28}
                className="w-full h-full"
              />
          </Link>
        </div>

        {/* 중앙 메뉴 - 관리자 페이지, 인증 페이지, 사업자 인증 페이지에서는 숨김 */}
        {!isAdminPage && !isAuthPage && !isBusinessVerificationPage && (
          <div className="nav-center">
            <nav className="landing-nav-menu">
              {user?.role === "SALESPERSON" ? (
                <>
                  <Link href="/" className="landing-nav-menu-item">
                    대시보드
                  </Link>
                  <Link
                    href="/salesperson/invite"
                    className="landing-nav-menu-item"
                  >
                    추천 관리
                  </Link>
                  <Link
                    href="/salesperson/referrals"
                    className="landing-nav-menu-item"
                  >
                    리워드 관리
                  </Link>
                  <Link
                    href="/salesperson/organization"
                    className="landing-nav-menu-item"
                  >
                    조직도 보기
                  </Link>
                  <button
                    onClick={() => handleNavClick("/support")}
                    className="landing-nav-menu-item landing-nav-menu-btn"
                  >
                    고객센터
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavClick("/target-marketing")}
                    className="landing-nav-menu-item landing-nav-menu-btn"
                  >
                    AI 타깃마케팅
                  </button>
                  <button
                    onClick={() => handleNavClick("/credit-management")}
                    className="landing-nav-menu-item landing-nav-menu-btn"
                  >
                    충전하기
                  </button>
                  <button
                    onClick={() => handleNavClick("/messages/send")}
                    className="landing-nav-menu-item landing-nav-menu-btn"
                  >
                    메시지발송
                  </button>
                  <button
                    onClick={() => handleNavClick("/support")}
                    className="landing-nav-menu-item landing-nav-menu-btn"
                  >
                    고객센터
                  </button>
                </>
              )}
            </nav>
          </div>
        )}

        {/* 모바일 드롭다운 메뉴 - 관리자 페이지, 인증 페이지, 사업자 인증 페이지에서는 숨김 */}
        {!isAdminPage && !isAuthPage && !isBusinessVerificationPage && (
          <div
            className={`mobile-menu-container ${
              showMobileMenu ? "active" : ""
            }`}
          >
            <div className="mobile-menu-dropdown">
              {user?.role === "SALESPERSON" ? (
                <>
                  <Link
                    href="/"
                    className="mobile-menu-item"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    대시보드
                  </Link>
                  <Link
                    href="/salesperson/invite"
                    className="mobile-menu-item"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    추천 관리
                  </Link>
                  <Link
                    href="/salesperson/referrals"
                    className="mobile-menu-item"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    리워드 관리
                  </Link>
                  <Link
                    href="/salesperson/organization"
                    className="mobile-menu-item"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    조직도 보기
                  </Link>
                  <button
                    onClick={() => handleNavClick("/support")}
                    className="mobile-menu-item mobile-menu-btn"
                  >
                    고객센터
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavClick("/target-marketing")}
                    className="mobile-menu-item mobile-menu-btn"
                  >
                    AI 타깃마케팅
                  </button>
                  <button
                    onClick={() => handleNavClick("/credit-management")}
                    className="mobile-menu-item mobile-menu-btn"
                  >
                    충전하기
                  </button>
                  <button
                    onClick={() => handleNavClick("/messages/send")}
                    className="mobile-menu-item mobile-menu-btn"
                  >
                    메시지발송
                  </button>
                  <button
                    onClick={() => handleNavClick("/support")}
                    className="mobile-menu-item mobile-menu-btn"
                  >
                    고객센터
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 오른쪽 인증 버튼 - 인증 페이지에서는 숨김 */}
        {!isAuthPage && (
          <div className="landing-nav-auth">
            {isAuthenticated ? (
              <div className="nav-right-buttons">
                {/* 알림 버튼 */}
                <div className="notification-dropdown-container">
                  <button
                    onClick={toggleNotifications}
                    className="nav-notification-btn"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 6.5C15 5.11929 14.4732 3.79539 13.5355 2.85786C12.5979 1.92034 11.2741 1.39355 9.89355 1.39355C8.51282 1.39355 7.18892 1.92034 6.25139 2.85786C5.31387 3.79539 4.78708 5.11929 4.78708 6.5C4.78708 12.0645 2.5 13.3548 2.5 13.3548H17.2871C17.2871 13.3548 15 12.0645 15 6.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M11.3025 16.9355C11.1069 17.2771 10.8316 17.5669 10.5016 17.7807C10.1716 17.9946 9.79665 18.1261 9.40323 18.1645C9.00982 18.2029 8.61374 18.1472 8.24613 18.0021C7.87852 17.857 7.55086 17.6267 7.28708 17.3306"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="notification-badge">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <h4>알림</h4>
                        {unreadCount > 0 && (
                          <button
                            className="mark-all-read"
                            onClick={markAllAsRead}
                            disabled={isLoading}
                          >
                            모두 읽음
                          </button>
                        )}
                      </div>
                      <div className="notification-list">
                        {isLoading ? (
                          <div className="notification-loading">
                            <p>알림을 불러오는 중...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="notification-empty">
                            <p>새로운 알림이 없습니다.</p>
                          </div>
                        ) : (
                          notifications
                            .slice(0, 5)
                            .map((notification: Notification) => (
                              <div
                                key={notification.id}
                                className={`notification-item ${
                                  !notification.is_read ? "unread" : ""
                                }`}
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                                style={{
                                  cursor: notification.action_url
                                    ? "pointer"
                                    : "default",
                                }}
                              >
                                <div className="notification-content">
                                  <div className="notification-icon-title">
                                    {getNotificationIcon(notification.type)}
                                    <h5>{notification.title}</h5>
                                  </div>
                                  <p>
                                    {truncateMessage(notification.message, 80)}
                                  </p>
                                  <span className="notification-time">
                                    {getRelativeTime(notification.created_at)}
                                  </span>
                                </div>
                                {!notification.is_read && (
                                  <div className="notification-unread-dot"></div>
                                )}
                              </div>
                            ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="notification-footer">
                          <button
                            className="view-all-notifications"
                            onClick={() => {
                              setShowNotifications(false);
                              // TODO: 전체 알림 페이지로 이동 (향후 구현)
                              router.push("/notifications");
                            }}
                          >
                            모든 알림 보기
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 프로필 버튼 */}
                <div className="user-dropdown-container">
                  <button
                    onClick={toggleUserDropdown}
                    className="user-profile-btn-extended"
                  >
                    <div className="user-avatar-circle">
                      {(user?.name || user?.email || "")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="user-info-display">
                      <div className="user-name-display">
                        {user?.name || user?.email || "사용자"}
                      </div>
                    </div>
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="dropdown-arrow-icon"
                    >
                      <path
                        d="M3 4.5L6 7.5L9 4.5"
                        stroke="#666"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  {showUserDropdown && (
                    <div className="user-dropdown">
                      <div className="user-dropdown-menu">
                        {user?.role === "SALESPERSON" ? (
                          <>
                            <Link
                              href="/salesperson/profile"
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
                                <path
                                  d="M10 2H14V6H10V2Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M2 10H6V14H2V10Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M10 10H14V14H10V10Z"
                                  fill="currentColor"
                                />
                              </svg>
                              대시보드
                            </Link>
                            <Link
                              href="/salesperson/profile"
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
                                  d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
                                  fill="currentColor"
                                />
                              </svg>
                              마이페이지
                            </Link>
                          </>
                        ) : (
                          <>
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
                                <path
                                  d="M10 2H14V6H10V2Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M2 10H6V14H2V10Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M10 10H14V14H10V10Z"
                                  fill="currentColor"
                                />
                              </svg>
                              대시보드
                            </Link>
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
                                  d="M8 8C10.21 8 12 6.21 12 4C12 1.79 10.21 0 8 0C5.79 0 4 1.79 4 4C4 6.21 5.79 8 8 8Z"
                                  fill="currentColor"
                                />
                                <path
                                  d="M8 10C5.33 10 0 11.34 0 14V16H16V14C16 11.34 10.67 10 8 10Z"
                                  fill="currentColor"
                                />
                              </svg>
                              마이페이지
                            </Link>
                          </>
                        )}
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
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="landing-nav-btn landing-login-btn"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="landing-nav-btn landing-signup-btn"
                >
                  가입
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        title="로그아웃"
        message="정말 로그아웃 하시겠습니까?"
        confirmText="로그아웃"
        cancelText="취소"
        type="info"
      />

      </nav>

    </>
  );
}
