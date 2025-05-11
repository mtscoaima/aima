"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
type UserType = 'advertiser' | 'sales' | 'admin' | 'all';

// 메뉴 구조
const menuItems: MenuItem[] = [
  {
    title: '마이사이트',
    path: '/my-site/advertiser/dashboard',
    submenu: [
      { 
        title: '광고주', 
        path: '/my-site/advertiser',
        userTypes: ['advertiser', 'all'],
        submenu: [
          { title: '대쉬보드', path: '/my-site/advertiser/dashboard' },
          { title: '기업정보인증상태', path: '/my-site/advertiser/company-verification' },
          { title: '요금제관리', path: '/my-site/advertiser/plans' },
          { title: '회원정보관리', path: '/my-site/advertiser/profile' },
          { title: '고객센터', path: '/my-site/advertiser/support' }
        ]
      },
      { 
        title: '영업사원', 
        path: '/my-site/sales',
        userTypes: ['sales', 'all'],
        submenu: [
          { title: '대쉬보드', path: '/my-site/sales/dashboard' },
          { title: '추천인관리', path: '/my-site/sales/referrals' }
        ]
      },
      { 
        title: '관리자', 
        path: '/my-site/admin',
        userTypes: ['admin', 'all'],
        submenu: [
          { title: '대쉬보드', path: '/my-site/admin/dashboard' },
          { title: '승인관리', path: '/my-site/admin/approvals' }
        ]
      }
    ]
  },
  {
    title: '실시간타겟마케팅',
    path: '/target-marketing/send/create-template',
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
        title: '타겟마케팅발송', 
        path: '/target-marketing/send',
        submenu: [
          { title: '템플릿 제작', path: '/target-marketing/send/create-template' },
          { title: '캠페인 등록', path: '/target-marketing/send/register-campaign' }
        ]
      },
      { 
        title: '타겟마케팅관리', 
        path: '/target-marketing/manage',
        submenu: [
          { title: '캠페인 현황', path: '/target-marketing/manage/campaign-status' },
          { title: '캠페인 관리', path: '/target-marketing/manage/campaign-management' },
          { title: '템플릿 관리', path: '/target-marketing/manage/template-management' }
        ]
      }
    ]
  },
  {
    title: '문자메시지',
    path: '/messages/send',
    submenu: [
      { 
        title: '메시지 발송', 
        path: '/messages/send',
        submenu: [
          { title: 'SMS/LMS/MMS 발송', path: '/messages/send' }
        ]
      },
      { 
        title: '메시지 관리', 
        path: '/messages/manage',
        submenu: [
          { title: '발신번호관리', path: '/messages/manage/sender-numbers' },
          { title: '전송결과', path: '/messages/manage/results' },
          { title: '통계', path: '/messages/manage/statistics' },
          { title: '템플릿관리', path: '/messages/manage/templates' }
        ]
      }
    ]
  },
  {
    title: '고객센터',
    path: '/customer-service',
    submenu: [
      { title: '공지사항', path: '/customer-service/notices' },
      { title: '1:1', path: '/customer-service/inquiry' },
      { title: 'FAQ', path: '/customer-service/faq' }
    ]
  }
];

// 서브서브메뉴 컴포넌트
const SubSubMenu = ({ items }: { items: SubSubMenuItem[] }) => {
  if (!items) return null;
  
  return (
    <div className="subsubmenu">
      <div className="subsubmenu-content">
        {items.map((item, index) => (
          <Link 
            href={item.path} 
            key={index}
            className="subsubmenu-item"
          >
            {item.title}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function Navigation() {
  const pathname = usePathname();
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const [prevScrollPos, setPrevScrollPos] = useState(0);
  const [userType, setUserType] = useState<UserType>('advertiser');
  
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
    window.addEventListener('scroll', handleScroll);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [prevScrollPos]);
  
  const handleMenuMouseEnter = (index: number) => {
    setOpenMenuIndex(index);
  };
  
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
    return submenu.filter(item => 
      !item.userTypes || item.userTypes.includes(userType)
    );
  };

  // 현재 표시할 메뉴 콘텐츠 확인
  const currentSubmenu = openMenuIndex !== null ? 
    filterSubMenuByUserType(menuItems[openMenuIndex]?.submenu) : 
    null;

  return (
    <nav className={`navigation ${visible ? 'nav-visible' : 'nav-hidden'}`} onMouseLeave={handleMenuMouseLeave}>
      <div className="nav-container">
        <Link href="/" className="logo">
          MTS플러스
        </Link>
        
        <div className="menu-container">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              className="menu-item-wrapper"
              onMouseEnter={() => handleMenuMouseEnter(index)}
            >
              <Link 
                href={item.path}
                className={`menu-item ${pathname === item.path ? 'active' : ''}`}
              >
                {item.title}
              </Link>
            </div>
          ))}
        </div>
        
        <div className="auth-buttons">
          <Link href="/login" className="btn btn-secondary">로그인</Link>
          <Link href="/signup" className="btn btn-primary">회원가입</Link>
        </div>
      </div>

      {/* 메가메뉴 - 항상 동일한 위치에 표시 */}
      {currentSubmenu && currentSubmenu.length > 0 && (
        <div className="submenu">
          <div className="submenu-inner">
            <div className="submenu-content">
              {openMenuIndex === 0 && (
                <div className="user-type-selector" style={{ 
                  padding: '12px', 
                  borderBottom: '1px solid #444',
                  marginBottom: '15px',
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  background: '#333',
                  borderRadius: '6px'
                }}>
                  <div style={{ 
                    marginBottom: '8px', 
                    fontWeight: 'bold', 
                    color: '#fff',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{
                      background: '#666',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px'
                    }}>테스트기능</span>
                    사용자 유형 선택
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '6px',
                    flexWrap: 'wrap'
                  }}>
                    <button 
                      onClick={() => changeUserType('advertiser')} 
                      style={{ 
                        padding: '6px 10px', 
                        background: userType === 'advertiser' ? '#3b82f6' : '#555', 
                        color: 'white',
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'medium',
                        transition: 'all 0.2s',
                        fontSize: '12px'
                      }}
                    >
                      광고주
                    </button>
                    <button 
                      onClick={() => changeUserType('sales')} 
                      style={{ 
                        padding: '6px 10px', 
                        background: userType === 'sales' ? '#3b82f6' : '#555', 
                        color: 'white',
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'medium',
                        transition: 'all 0.2s',
                        fontSize: '12px'
                      }}
                    >
                      영업사원
                    </button>
                    <button 
                      onClick={() => changeUserType('admin')} 
                      style={{ 
                        padding: '6px 10px', 
                        background: userType === 'admin' ? '#3b82f6' : '#555', 
                        color: 'white',
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'medium',
                        transition: 'all 0.2s',
                        fontSize: '12px'
                      }}
                    >
                      관리자
                    </button>
                  </div>
                </div>
              )}
              {currentSubmenu.map((subItem, subIndex) => (
                <div 
                  key={subIndex}
                  className="submenu-item-wrapper"
                >
                  <Link 
                    href={subItem.path} 
                    className="submenu-item"
                  >
                    {subItem.title}
                  </Link>
                  
                  {subItem.submenu && (
                    <SubSubMenu items={subItem.submenu} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
} 