"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationUtils } from "@/hooks/useNotificationUtils";
import { Notification } from "@/contexts/NotificationContext";
import ConfirmDialog from "./ConfirmDialog";

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
  const [showServicePreparing, setShowServicePreparing] = useState(false);

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
    // 문자발송 메뉴 클릭 시 서비스 준비중 팝업 표시
    if (href === "/messages/send") {
      setShowServicePreparing(true);
      setShowMobileMenu(false);
      return;
    }
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
            <svg
              width="106"
              height="28"
              viewBox="0 0 106 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M43.1164 7.2832C45.7069 7.2832 47.6836 7.87773 49.0461 9.06738C50.4085 10.2379 51.09 12.0416 51.09 14.4785V23.1436H45.9953V21.1279C45.2086 22.6439 43.6733 23.4023 41.3898 23.4023C40.1809 23.4023 39.1349 23.1907 38.2522 22.7686C37.3695 22.3464 36.698 21.7803 36.2375 21.0703C35.7962 20.3411 35.5754 19.5158 35.5754 18.5947C35.5755 17.1173 36.1415 15.9758 37.2736 15.1699C38.4058 14.3448 40.1518 13.9317 42.5119 13.9316H45.6213C45.5252 12.2816 44.4215 11.457 42.3107 11.457C41.5624 11.457 40.8039 11.5816 40.0363 11.8311C39.269 12.0613 38.6165 12.3875 38.0793 12.8096L36.2375 9.09668C37.101 8.52099 38.147 8.0795 39.3752 7.77246C40.6223 7.44632 41.8693 7.28323 43.1164 7.2832ZM97.7023 7.2832C100.293 7.28325 102.27 7.87766 103.632 9.06738C104.994 10.2379 105.675 12.0417 105.675 14.4785V23.1436H100.58V21.1279C99.7935 22.6439 98.2584 23.4023 95.9748 23.4023C94.7659 23.4023 93.7198 23.1907 92.8371 22.7686C91.9546 22.3464 91.2829 21.7802 90.8225 21.0703C90.3812 20.3412 90.1604 19.5157 90.1604 18.5947C90.1605 17.1174 90.7266 15.9758 91.8586 15.1699C92.9908 14.3448 94.7375 13.9316 97.0979 13.9316H100.206C100.11 12.2816 99.0064 11.457 96.8957 11.457C96.1474 11.4571 95.3897 11.5816 94.6223 11.8311C93.8547 12.0613 93.2016 12.3874 92.6643 12.8096L90.8225 9.09668C91.686 8.52099 92.732 8.0795 93.9602 7.77246C95.2075 7.44624 96.455 7.2832 97.7023 7.2832ZM59.1477 23.1436H53.6789V7.54199H59.1477V23.1436ZM82.1604 7.2832C84.0793 7.2832 85.6053 7.85838 86.7375 9.00977C87.8888 10.1611 88.464 11.8979 88.4641 14.2197V23.1436H82.9953V15.1123C82.9953 14.0187 82.7845 13.2125 82.3625 12.6943C81.9595 12.1762 81.3834 11.917 80.635 11.917C79.8099 11.917 79.1476 12.2047 78.6486 12.7803C78.1497 13.356 77.9006 14.2298 77.9006 15.4004V23.1436H72.4309V15.1123C72.4309 12.9822 71.6441 11.917 70.0705 11.917C69.2264 11.9171 68.5547 12.2048 68.0559 12.7803C67.5569 13.356 67.3078 14.2298 67.3078 15.4004V23.1436H61.8381V7.54199H67.049V9.18262C67.6246 8.54955 68.3055 8.07947 69.092 7.77246C69.898 7.44623 70.7718 7.2832 71.7121 7.2832C72.8058 7.28326 73.7842 7.48476 74.6477 7.8877C75.5112 8.29068 76.2119 8.90437 76.7492 9.72949C77.3632 8.94282 78.1401 8.33817 79.0803 7.91602C80.0205 7.49386 81.0474 7.28323 82.1604 7.2832ZM43.2609 16.7812C41.6682 16.7812 40.8713 17.3098 40.8713 18.3652C40.8714 18.8448 41.0537 19.2288 41.4182 19.5166C41.7828 19.8044 42.282 19.9482 42.9152 19.9482C43.5485 19.9482 44.1054 19.7943 44.5852 19.4873C45.0647 19.1803 45.4103 18.7295 45.6213 18.1348V16.7812H43.2609ZM97.8459 16.7812C96.2532 16.7813 95.4572 17.3098 95.4572 18.3652C95.4573 18.8448 95.6396 19.2288 96.0041 19.5166C96.3686 19.8042 96.8673 19.9482 97.5002 19.9482C98.1335 19.9482 98.6904 19.7943 99.1701 19.4873C99.6498 19.1803 99.9952 18.7295 100.206 18.1348V16.7812H97.8459ZM56.4133 0C57.4112 1.54439e-06 58.2172 0.269327 58.8313 0.806641C59.4452 1.32474 59.7522 1.99624 59.7522 2.82129C59.7521 3.68476 59.4453 4.40481 58.8313 4.98047C58.2172 5.53685 57.411 5.81445 56.4133 5.81445C55.4155 5.81445 54.6094 5.53684 53.9953 4.98047C53.3812 4.42396 53.0744 3.73239 53.0744 2.90723C53.0745 2.08218 53.3813 1.3914 53.9953 0.834961C54.6094 0.278456 55.4154 0 56.4133 0Z"
                fill="black"
              />
              <path
                d="M22.9434 2.6571C26.9177 2.6571 30.1396 5.87905 30.1396 9.85339V20.4374C30.1396 21.1284 29.6525 21.7046 29.0029 21.8436L23.0283 27.1552V21.8768H7.19629C3.22197 21.8768 4.19116e-05 18.6548 0 14.6805V9.85339C0 5.87905 3.22195 2.6571 7.19629 2.6571H22.9434Z"
                fill="#1681FF"
              />
              <circle cx="9.82835" cy="12.0484" r="2.40244" fill="white" />
              <circle cx="19.8748" cy="12.0484" r="2.40244" fill="white" />
            </svg>
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
                    onClick={() => handleNavClick("/reservations")}
                    className="landing-nav-menu-item landing-nav-menu-btn"
                  >
                    예약 관리
                  </button>
                  <button
                    onClick={() => handleNavClick("/messages/send")}
                    className="landing-nav-menu-item landing-nav-menu-btn"
                  >
                    문자발송
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
                    onClick={() => handleNavClick("/reservations")}
                    className="mobile-menu-item mobile-menu-btn"
                  >
                    예약 관리
                  </button>
                  <button
                    onClick={() => handleNavClick("/messages/send")}
                    className="mobile-menu-item mobile-menu-btn"
                  >
                    문자발송
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

      {/* 서비스 준비중 팝업 - nav 외부에 위치 */}
      {showServicePreparing && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9999]" 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.1)' }}
          onClick={() => setShowServicePreparing(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                문자발송
              </h3>
              <p className="text-gray-600 mb-6">
                서비스 준비중입니다
              </p>
              <button
                onClick={() => setShowServicePreparing(false)}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
