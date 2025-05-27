"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebar } from "@/contexts/SidebarContext";

// 메뉴 아이템 인터페이스
interface MenuItem {
  title: string;
  path: string;
  submenu?: SubMenuItem[];
  userTypes?: UserType[]; // 이 메뉴를 볼 수 있는 사용자 유형
}

// 서브 메뉴 아이템 인터페이스
interface SubMenuItem {
  title: string;
  path: string;
  submenu?: SubSubMenuItem[];
  userTypes?: UserType[]; // 이 서브메뉴를 볼 수 있는 사용자 유형
}

// 서브서브 메뉴 아이템 인터페이스
interface SubSubMenuItem {
  title: string;
  path: string;
}

// 사용자 유형 정의
type UserType = "advertiser" | "sales" | "admin" | "all";

// 메뉴 구조
const menuItems: MenuItem[] = [
  {
    title: "마이사이트",
    path: "/my-site/advertiser/dashboard",
    submenu: [
      {
        title: "광고주",
        path: "/my-site/advertiser",
        userTypes: ["advertiser", "all"],
        submenu: [
          { title: "대쉬보드", path: "/my-site/advertiser/dashboard" },
          {
            title: "기업정보인증상태",
            path: "/my-site/advertiser/company-verification",
          },
          { title: "요금제관리", path: "/my-site/advertiser/plans" },
          { title: "회원정보관리", path: "/my-site/advertiser/profile" },
          { title: "고객센터", path: "/my-site/advertiser/support" },
        ],
      },
      {
        title: "영업사원",
        path: "/my-site/sales",
        userTypes: ["sales", "all"],
        submenu: [
          { title: "대쉬보드", path: "/my-site/sales/dashboard" },
          { title: "추천인관리", path: "/my-site/sales/referrals" },
        ],
      },
      {
        title: "관리자",
        path: "/my-site/admin",
        userTypes: ["admin", "all"],
        submenu: [
          { title: "대쉬보드", path: "/my-site/admin/dashboard" },
          { title: "승인관리", path: "/my-site/admin/approvals" },
        ],
      },
    ],
  },
  {
    title: "실시간타겟마케팅",
    path: "/target-marketing/send/create-template",
    submenu: [
      // {
      //   title: 'AI 간편마케팅',
      //   path: '/target-marketing/ai-simple',
      //   submenu: [
      //     { title: 'AI 캠페인 생성요청', path: '/target-marketing/ai-simple/campaign-request' },
      //     { title: 'AI 캠페인 자동생성', path: '/target-marketing/ai-simple/auto-generation' },
      //     { title: '캠페인 확인 등록', path: '/target-marketing/ai-simple/campaign-confirmation' }
      //   ]
      // },
      {
        title: "타겟마케팅발송",
        path: "/target-marketing/send",
        submenu: [
          {
            title: "템플릿 제작",
            path: "/target-marketing/send/create-template",
          },
          {
            title: "캠페인 등록",
            path: "/target-marketing/send/register-campaign",
          },
        ],
      },
      {
        title: "타겟마케팅관리",
        path: "/target-marketing/manage",
        submenu: [
          {
            title: "캠페인 현황",
            path: "/target-marketing/manage/campaign-status",
          },
          {
            title: "캠페인 관리",
            path: "/target-marketing/manage/campaign-management",
          },
          {
            title: "템플릿 관리",
            path: "/target-marketing/manage/template-management",
          },
        ],
      },
    ],
  },
  {
    title: "문자메시지",
    path: "/messages/send",
    submenu: [
      {
        title: "메시지 발송",
        path: "/messages/send",
        submenu: [{ title: "SMS/LMS/MMS 발송", path: "/messages/send" }],
      },
      {
        title: "메시지 관리",
        path: "/messages/manage",
        submenu: [
          { title: "발신번호관리", path: "/messages/manage/sender-numbers" },
          { title: "전송결과", path: "/messages/manage/results" },
          { title: "통계", path: "/messages/manage/statistics" },
          { title: "템플릿관리", path: "/messages/manage/templates" },
        ],
      },
    ],
  },
  {
    title: "고객센터",
    path: "/customer-service",
    submenu: [
      { title: "공지사항", path: "/customer-service/notices" },
      { title: "1:1", path: "/customer-service/inquiry" },
      { title: "FAQ", path: "/customer-service/faq" },
    ],
  },
];

// 서브서브메뉴 컴포넌트
const SubSubMenu = ({ items }: { items: SubSubMenuItem[] }) => {
  if (!items) return null;

  return (
    <div className="subsubmenu">
      <div className="subsubmenu-content">
        {items.map((item, index) => (
          <Link href={item.path} key={index} className="subsubmenu-item">
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function Navigation() {
  // const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { toggle: toggleSidebar, isOpen: sidebarOpen } = useSidebar();
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [userType, setUserType] = useState<UserType>("advertiser");
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

  // const handleMenuMouseEnter = (index: number) => {
  //   setOpenMenuIndex(index);
  // };

  const handleMenuMouseLeave = () => {
    setOpenMenuIndex(null);
  };

  // 사용자 유형 변경 핸들러
  const changeUserType = (type: UserType) => {
    setUserType(type);
  };

  // 현재 사용자 유형에 맞는 서브메뉴만 필터링
  const filterSubMenuByUserType = (submenu?: SubMenuItem[]) => {
    if (!submenu) return [];
    return submenu.filter(
      (item) => !item.userTypes || item.userTypes.includes(userType)
    );
  };

  // 현재 표시할 메뉴 콘텐츠 확인
  const currentSubmenu =
    openMenuIndex !== null
      ? filterSubMenuByUserType(menuItems[openMenuIndex]?.submenu)
      : null;

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
      onMouseLeave={handleMenuMouseLeave}
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

        <div className="auth-buttons">
          {isAuthenticated ? (
            <div className="user-dropdown-container">
              <button onClick={toggleUserDropdown} className="user-info-button">
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

      {/* 메가메뉴 - 항상 동일한 위치에 표시 */}
      {currentSubmenu && currentSubmenu.length > 0 && (
        <div className="submenu">
          <div className="submenu-inner">
            <div className="submenu-content">
              {openMenuIndex === 0 && (
                <div
                  className="user-type-selector"
                  style={{
                    padding: "12px",
                    borderBottom: "1px solid #444",
                    marginBottom: "15px",
                    display: "flex",
                    flexDirection: "column",
                    width: "100%",
                    background: "#333",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "8px",
                      fontWeight: "bold",
                      color: "#fff",
                      fontSize: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span
                      style={{
                        background: "#666",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "11px",
                      }}
                    >
                      테스트기능
                    </span>
                    사용자 유형 선택
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => changeUserType("advertiser")}
                      style={{
                        padding: "6px 10px",
                        background:
                          userType === "advertiser" ? "#3b82f6" : "#555",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "medium",
                        transition: "all 0.2s",
                        fontSize: "12px",
                      }}
                    >
                      광고주
                    </button>
                    <button
                      onClick={() => changeUserType("sales")}
                      style={{
                        padding: "6px 10px",
                        background: userType === "sales" ? "#3b82f6" : "#555",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "medium",
                        transition: "all 0.2s",
                        fontSize: "12px",
                      }}
                    >
                      영업사원
                    </button>
                    <button
                      onClick={() => changeUserType("admin")}
                      style={{
                        padding: "6px 10px",
                        background: userType === "admin" ? "#3b82f6" : "#555",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "medium",
                        transition: "all 0.2s",
                        fontSize: "12px",
                      }}
                    >
                      관리자
                    </button>
                    <button
                      onClick={() => changeUserType("all")}
                      style={{
                        padding: "6px 10px",
                        background: userType === "all" ? "#3b82f6" : "#555",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "medium",
                        transition: "all 0.2s",
                        fontSize: "12px",
                      }}
                    >
                      전체
                    </button>
                  </div>
                </div>
              )}

              {currentSubmenu.map((submenuItem, submenuIndex) => (
                <div key={submenuIndex} className="submenu-item-wrapper">
                  <Link href={submenuItem.path} className="submenu-item">
                    {submenuItem.title}
                  </Link>
                  <SubSubMenu items={submenuItem.submenu || []} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
