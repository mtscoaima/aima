'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import './styles.css';

// 캠페인 타입 정의
interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed' | 'inactive';
  startDate: string;
  endDate: string;
  targetAudience: {
    gender: string;
    ageRange: string;
    location: string;
  };
  metrics: {
    sent: number;
    responded: number;
    conversionRate: number;
  };
  dailyLimit: number;
  totalLimit: number;
  lastModified: string;
}

export default function CampaignManagementPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'pending' | 'completed' | 'inactive'>('all');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name' | 'conversion'>('newest');
  const [isLoading, setIsLoading] = useState(true);

  // 캠페인 데이터 불러오기 (실제로는 API 연동 필요)
  useEffect(() => {
    // 데모 데이터
    const demoCampaigns: Campaign[] = [
      {
        id: '1',
        name: '여름 할인 프로모션',
        status: 'active',
        startDate: '2023-06-15',
        endDate: '2023-08-31',
        targetAudience: {
          gender: '전체',
          ageRange: '25-39',
          location: '서울 강남구',
        },
        metrics: {
          sent: 2450,
          responded: 342,
          conversionRate: 14.0,
        },
        dailyLimit: 200,
        totalLimit: 3000,
        lastModified: '2023-06-16T09:15:00',
      },
      {
        id: '2',
        name: '가을 신상품 안내',
        status: 'pending',
        startDate: '2023-09-01',
        endDate: '2023-10-15',
        targetAudience: {
          gender: '여성',
          ageRange: '20-34',
          location: '전체',
        },
        metrics: {
          sent: 0,
          responded: 0,
          conversionRate: 0,
        },
        dailyLimit: 150,
        totalLimit: 2000,
        lastModified: '2023-08-25T11:20:00',
      },
      {
        id: '3',
        name: '겨울 시즌 상품 프로모션',
        status: 'inactive',
        startDate: '2023-12-01',
        endDate: '2024-01-31',
        targetAudience: {
          gender: '전체',
          ageRange: '30-49',
          location: '부산 해운대구',
        },
        metrics: {
          sent: 0,
          responded: 0,
          conversionRate: 0,
        },
        dailyLimit: 100,
        totalLimit: 1500,
        lastModified: '2023-11-20T14:30:00',
      },
      {
        id: '4',
        name: '설날 특별 할인',
        status: 'completed',
        startDate: '2023-01-15',
        endDate: '2023-02-15',
        targetAudience: {
          gender: '전체',
          ageRange: '전체',
          location: '전체',
        },
        metrics: {
          sent: 5000,
          responded: 1200,
          conversionRate: 24.0,
        },
        dailyLimit: 300,
        totalLimit: 5000,
        lastModified: '2023-02-16T18:45:00',
      },
      {
        id: '5',
        name: '여름 휴가 기획전',
        status: 'active',
        startDate: '2023-07-01',
        endDate: '2023-08-15',
        targetAudience: {
          gender: '전체',
          ageRange: '20-39',
          location: '제주도',
        },
        metrics: {
          sent: 1800,
          responded: 420,
          conversionRate: 23.3,
        },
        dailyLimit: 180,
        totalLimit: 2500,
        lastModified: '2023-07-05T10:20:00',
      }
    ];

    // 데이터 로딩 지연 효과 (실제 구현에서는 제거)
    setTimeout(() => {
      setCampaigns(demoCampaigns);
      setIsLoading(false);
    }, 1000);
  }, []);

  // 필터링된 캠페인 목록
  const filteredCampaigns = campaigns
    .filter(campaign => {
      // 검색어 필터링
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 상태 필터링
      const matchesFilter = 
        filter === 'all' || 
        campaign.status === filter;
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // 정렬
      if (sort === 'newest') {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      } else if (sort === 'oldest') {
        return new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
      } else if (sort === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return b.metrics.conversionRate - a.metrics.conversionRate;
      }
    });

  // 캠페인 삭제 핸들러
  const handleDeleteCampaign = (id: string) => {
    if (window.confirm('정말 이 캠페인을 삭제하시겠습니까?')) {
      // 실제로는 API 호출 필요
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
    }
  };

  // 캠페인 상태 토글
  const handleToggleStatus = (id: string, currentStatus: string) => {
    setCampaigns(prev => prev.map(campaign => {
      if (campaign.id === id) {
        let newStatus: 'active' | 'pending' | 'completed' | 'inactive';
        if (currentStatus === 'active') {
          newStatus = 'inactive';
        } else if (currentStatus === 'inactive' || currentStatus === 'pending') {
          newStatus = 'active';
        } else {
          newStatus = 'active';
        }
        
        return {
          ...campaign,
          status: newStatus
        };
      }
      return campaign;
    }));
  };

  // 상태 배지 스타일 및 텍스트
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="status-badge active">활성화</span>;
      case 'pending':
        return <span className="status-badge pending">대기중</span>;
      case 'completed':
        return <span className="status-badge completed">완료됨</span>;
      case 'inactive':
        return <span className="status-badge inactive">비활성화</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  // 토글 스위치 렌더링
  const renderToggleSwitch = (id: string, status: string) => {
    const isActive = status === 'active';
    const isDisabled = status === 'completed'; // 완료된 캠페인은 토글 비활성화
    
    return (
      <div 
        className={`toggle-switch ${isDisabled ? 'disabled' : ''}`}
        onClick={() => !isDisabled && handleToggleStatus(id, status)}
      >
        <div className={`toggle-slider ${isActive ? 'active' : ''}`}></div>
      </div>
    );
  };

  return (
    <div className="campaign-management-container">
      <div className="management-header">
        <h1>캠페인 관리</h1>
        <p>타겟마케팅 캠페인을 관리하고 실적을 확인하세요</p>
      </div>

      <div className="controls-container">
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="캠페인 이름 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-button">
              <span className="search-icon">🔍</span>
            </button>
          </div>

          <div className="filter-controls">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'pending' | 'completed' | 'inactive')}
              className="filter-select"
            >
              <option value="all">모든 상태</option>
              <option value="active">활성화</option>
              <option value="pending">대기중</option>
              <option value="completed">완료됨</option>
              <option value="inactive">비활성화</option>
            </select>

            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value as 'newest' | 'oldest' | 'name' | 'conversion')}
              className="sort-select"
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="name">이름순</option>
              <option value="conversion">전환율순</option>
            </select>
          </div>
        </div>

        <Link href="/target-marketing/send/register-campaign">
          <button className="create-button">
            <span className="plus-icon">+</span> 새 캠페인 만들기
          </button>
        </Link>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>캠페인 로딩 중...</p>
        </div>
      ) : filteredCampaigns.length > 0 ? (
        <div className="campaigns-list">
          <div className="list-header">
            <div className="campaign-name-col">캠페인명</div>
            <div className="campaign-period-col">기간</div>
            <div className="campaign-target-col">타겟</div>
            <div className="campaign-metrics-col">성과</div>
            <div className="campaign-limits-col">발송제한</div>
            <div className="campaign-status-col">상태</div>
            <div className="campaign-toggle-col">활성화</div>
            <div className="campaign-actions-col">관리</div>
          </div>
          
          {filteredCampaigns.map((campaign) => (
            <div 
              key={campaign.id} 
              className={`campaign-row ${campaign.status === 'inactive' ? 'inactive-campaign' : ''}`}
            >
              <div className="campaign-name-col">
                <div className="campaign-name">{campaign.name}</div>
                <div className="campaign-modified">최종수정: {new Date(campaign.lastModified).toLocaleDateString()}</div>
              </div>
              
              <div className="campaign-period-col">
                <div>{campaign.startDate}</div>
                <div>~</div>
                <div>{campaign.endDate}</div>
              </div>
              
              <div className="campaign-target-col">
                <div>성별: {campaign.targetAudience.gender}</div>
                <div>연령: {campaign.targetAudience.ageRange}</div>
                <div>지역: {campaign.targetAudience.location}</div>
              </div>
              
              <div className="campaign-metrics-col">
                <div>발송: {campaign.metrics.sent.toLocaleString()}건</div>
                <div>반응: {campaign.metrics.responded.toLocaleString()}건</div>
                <div>전환율: {campaign.metrics.conversionRate}%</div>
              </div>
              
              <div className="campaign-limits-col">
                <div>일 한도: {campaign.dailyLimit}건</div>
                <div>총 한도: {campaign.totalLimit}건</div>
              </div>
              
              <div className="campaign-status-col">
                {getStatusBadge(campaign.status)}
              </div>

              <div className="campaign-toggle-col">
                {renderToggleSwitch(campaign.id, campaign.status)}
              </div>
              
              <div className="campaign-actions-col">
                <Link href={`/target-marketing/send/register-campaign?edit=${campaign.id}`}>
                  <button className="edit-button">수정</button>
                </Link>
                <button 
                  className="delete-button"
                  onClick={() => handleDeleteCampaign(campaign.id)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-campaigns">
          <p>검색 결과가 없습니다.</p>
          <p>새 캠페인을 만들거나 검색 조건을 변경해보세요.</p>
        </div>
      )}
    </div>
  );
} 