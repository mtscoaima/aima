'use client';

import React, { useState, useEffect } from 'react';
import './styles.css';

// 캠페인 타입 정의
interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'pending' | 'completed' | 'inactive';
  startDate: string;
  endDate: string;
  metrics: {
    sent: number;
    responded: number;
    conversionRate: number;
  };
  dailyStats: {
    date: string;
    sent: number;
    responded: number;
    conversionRate: number;
  }[];
}

// 일별 통계 타입 정의
interface DailyStats {
  date: string;
  sent: number;
  responded: number;
  conversionRate: number;
}

export default function CampaignStatusPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all');
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
        metrics: {
          sent: 2450,
          responded: 342,
          conversionRate: 14.0,
        },
        dailyStats: generateDailyStats(30, 50, 100, 10, 22)
      },
      {
        id: '2',
        name: '가을 신상품 안내',
        status: 'pending',
        startDate: '2023-09-01',
        endDate: '2023-10-15',
        metrics: {
          sent: 0,
          responded: 0,
          conversionRate: 0,
        },
        dailyStats: []
      },
      {
        id: '3',
        name: '겨울 시즌 상품 프로모션',
        status: 'inactive',
        startDate: '2023-12-01',
        endDate: '2024-01-31',
        metrics: {
          sent: 0,
          responded: 0,
          conversionRate: 0,
        },
        dailyStats: []
      },
      {
        id: '4',
        name: '설날 특별 할인',
        status: 'completed',
        startDate: '2023-01-15',
        endDate: '2023-02-15',
        metrics: {
          sent: 5000,
          responded: 1200,
          conversionRate: 24.0,
        },
        dailyStats: generateDailyStats(30, 150, 200, 20, 30)
      },
      {
        id: '5',
        name: '여름 휴가 기획전',
        status: 'active',
        startDate: '2023-07-01',
        endDate: '2023-08-15',
        metrics: {
          sent: 1800,
          responded: 420,
          conversionRate: 23.3,
        },
        dailyStats: generateDailyStats(30, 40, 80, 15, 25)
      }
    ];

    // 데모 일별 통계 생성
    const demoDailyStats = generateCombinedDailyStats(demoCampaigns, 30);

    // 데이터 로딩 지연 효과 (실제 구현에서는 제거)
    setTimeout(() => {
      setCampaigns(demoCampaigns);
      setDailyStats(demoDailyStats);
      setIsLoading(false);
    }, 1000);
  }, []);

  // 테스트용 임의 일별 통계 생성 함수 (실제 구현에서는 API 데이터 사용)
  function generateDailyStats(
    days: number, 
    minSent: number, 
    maxSent: number, 
    minConversion: number, 
    maxConversion: number
  ) {
    const stats = [];
    const today = new Date();
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      const sent = Math.floor(Math.random() * (maxSent - minSent + 1)) + minSent;
      const conversionRate = Math.random() * (maxConversion - minConversion) + minConversion;
      const responded = Math.floor(sent * (conversionRate / 100));
      
      stats.push({
        date: date.toISOString().split('T')[0],
        sent,
        responded,
        conversionRate: parseFloat(conversionRate.toFixed(1))
      });
    }
    
    return stats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // 모든 캠페인 일별 통계 합산 함수
  function generateCombinedDailyStats(campaigns: Campaign[], days: number) {
    const statsMap = new Map<string, DailyStats>();
    const today = new Date();
    
    // 초기 데이터 구조 생성
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      statsMap.set(dateString, {
        date: dateString,
        sent: 0,
        responded: 0,
        conversionRate: 0
      });
    }
    
    // 각 캠페인 데이터 합산
    campaigns.forEach(campaign => {
      campaign.dailyStats.forEach(stat => {
        if (statsMap.has(stat.date)) {
          const current = statsMap.get(stat.date)!;
          const newSent = current.sent + stat.sent;
          const newResponded = current.responded + stat.responded;
          
          statsMap.set(stat.date, {
            ...current,
            sent: newSent,
            responded: newResponded,
            conversionRate: newSent > 0 ? parseFloat(((newResponded / newSent) * 100).toFixed(1)) : 0
          });
        }
      });
    });
    
    // Map을 배열로 변환하고 날짜 순으로 정렬
    return Array.from(statsMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // 기간 필터링 적용
  const filteredDailyStats = () => {
    const days = selectedPeriod === '7days' ? 7 : selectedPeriod === '30days' ? 30 : 90;
    const stats = dailyStats.slice(-days);
    
    if (selectedCampaign !== 'all') {
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      if (campaign) {
        return campaign.dailyStats.slice(-days);
      }
    }
    
    return stats;
  };

  // 캠페인별 총 통계
  const campaignTotalStats = campaigns.map(campaign => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    ...campaign.metrics
  }));

  // 차트 렌더링 함수 (실제 구현에서는 Chart.js나 Recharts 등의 라이브러리 사용)
  const renderBarChart = (stats: DailyStats[]) => {
    // 여기서는 차트 라이브러리 없이 간단한 차트 UI만 구현
    const maxSent = Math.max(...stats.map(s => s.sent));
    
    return (
      <div className="bar-chart-container">
        {stats.map((stat, index) => (
          <div key={index} className="chart-bar-group">
            <div className="chart-bar-label">{formatDate(stat.date)}</div>
            <div className="chart-bars">
              <div 
                className="chart-bar sent-bar" 
                style={{ height: `${(stat.sent / maxSent) * 100}%` }}
                title={`발송: ${stat.sent}건`}
              ></div>
              <div 
                className="chart-bar responded-bar" 
                style={{ height: `${(stat.responded / maxSent) * 100}%` }}
                title={`반응: ${stat.responded}건`}
              ></div>
            </div>
            <div className="chart-bar-value">
              <span>{stat.conversionRate}%</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 상태에 따른 색상 클래스
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'active': return 'status-active';
      case 'pending': return 'status-pending';
      case 'completed': return 'status-completed';
      case 'inactive': return 'status-inactive';
      default: return '';
    }
  };

  return (
    <div className="campaign-status-container">
      <div className="status-header">
        <h1>캠페인 현황</h1>
        <p>타겟마케팅 캠페인의 성과를 확인하세요</p>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>통계 데이터 로딩 중...</p>
        </div>
      ) : (
        <>
          <div className="summary-stats">
            <div className="stat-card total-campaigns">
              <div className="stat-value">{campaigns.length}</div>
              <div className="stat-label">총 캠페인</div>
            </div>
            <div className="stat-card active-campaigns">
              <div className="stat-value">{campaigns.filter(c => c.status === 'active').length}</div>
              <div className="stat-label">활성 캠페인</div>
            </div>
            <div className="stat-card total-sent">
              <div className="stat-value">
                {campaigns.reduce((sum, campaign) => sum + campaign.metrics.sent, 0).toLocaleString()}
              </div>
              <div className="stat-label">총 발송건수</div>
            </div>
            <div className="stat-card avg-conversion">
              <div className="stat-value">
                {parseFloat((campaigns
                  .filter(c => c.metrics.sent > 0)
                  .reduce((sum, c) => sum + c.metrics.conversionRate, 0) / 
                  campaigns.filter(c => c.metrics.sent > 0).length || 0
                ).toFixed(1))}%
              </div>
              <div className="stat-label">평균 전환율</div>
            </div>
          </div>

          <div className="chart-controls">
            <div className="control-group">
              <label>기간 선택:</label>
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value as '7days' | '30days' | '90days')}
                className="period-select"
              >
                <option value="7days">최근 7일</option>
                <option value="30days">최근 30일</option>
                <option value="90days">최근 90일</option>
              </select>
            </div>
            <div className="control-group">
              <label>캠페인 선택:</label>
              <select 
                value={selectedCampaign} 
                onChange={(e) => setSelectedCampaign(e.target.value)}
                className="campaign-select"
              >
                <option value="all">모든 캠페인</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="chart-section">
            <h2>일별 성과</h2>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color sent-color"></div>
                <span>발송건수</span>
              </div>
              <div className="legend-item">
                <div className="legend-color responded-color"></div>
                <span>반응건수</span>
              </div>
              <div className="legend-item">
                <span>숫자: 전환율(%)</span>
              </div>
            </div>
            <div className="chart-container">
              {renderBarChart(filteredDailyStats())}
            </div>
          </div>

          <div className="campaigns-table-section">
            <h2>캠페인별 성과</h2>
            <div className="campaign-stats-table">
              <div className="table-header">
                <div className="col-campaign">캠페인명</div>
                <div className="col-status">상태</div>
                <div className="col-period">기간</div>
                <div className="col-sent">발송건수</div>
                <div className="col-responded">반응건수</div>
                <div className="col-conversion">전환율</div>
              </div>
              <div className="table-body">
                {campaignTotalStats.map(campaign => (
                  <div key={campaign.id} className="table-row">
                    <div className="col-campaign">{campaign.name}</div>
                    <div className="col-status">
                      <span className={`status-badge ${getStatusClass(campaign.status)}`}>
                        {campaign.status === 'active' ? '활성화' :
                          campaign.status === 'pending' ? '대기중' :
                          campaign.status === 'completed' ? '완료됨' : '비활성화'}
                      </span>
                    </div>
                    <div className="col-period">
                      {campaigns.find(c => c.id === campaign.id)?.startDate} ~ {campaigns.find(c => c.id === campaign.id)?.endDate}
                    </div>
                    <div className="col-sent">{campaign.sent.toLocaleString()}</div>
                    <div className="col-responded">{campaign.responded.toLocaleString()}</div>
                    <div className="col-conversion">{campaign.conversionRate}%</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 