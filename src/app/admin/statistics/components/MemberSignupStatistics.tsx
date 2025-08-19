"use client";

import { useState, useEffect } from "react";

type PeriodType = "daily" | "weekly" | "monthly";

type DailyData = {
  date: string;
  signups: number;
  withdrawals: number;
};

type PeriodData = {
  period: string;
  signups: number;
  withdrawals: number;
};

type ChartDataItem = DailyData | PeriodData;

// 더미 데이터
const mockSummaryData = {
  totalMembers: 15847,
  dailyAverage: 127,
  conversionRate: 85.2,
  failureRate: 14.8,
  weeklyGrowth: 12.5,
  monthlyGrowth: 8.3
};

const mockDailyData = [
  { date: "2025-01-01", signups: 98, withdrawals: 8 },
  { date: "2025-01-02", signups: 112, withdrawals: 12 },
  { date: "2025-01-03", signups: 134, withdrawals: 9 },
  { date: "2025-01-04", signups: 156, withdrawals: 15 },
  { date: "2025-01-05", signups: 143, withdrawals: 11 },
  { date: "2025-01-06", signups: 167, withdrawals: 7 },
  { date: "2025-01-07", signups: 189, withdrawals: 13 },
  { date: "2025-01-08", signups: 145, withdrawals: 10 },
  { date: "2025-01-09", signups: 178, withdrawals: 8 },
  { date: "2025-01-10", signups: 134, withdrawals: 16 },
  { date: "2025-01-11", signups: 201, withdrawals: 12 },
  { date: "2025-01-12", signups: 156, withdrawals: 9 },
  { date: "2025-01-13", signups: 167, withdrawals: 14 },
  { date: "2025-01-14", signups: 198, withdrawals: 11 },
  { date: "2025-01-15", signups: 128, withdrawals: 11 },
  { date: "2025-01-16", signups: 145, withdrawals: 8 },
  { date: "2025-01-17", signups: 134, withdrawals: 15 },
  { date: "2025-01-18", signups: 167, withdrawals: 7 },
  { date: "2025-01-19", signups: 189, withdrawals: 12 },
  { date: "2025-01-20", signups: 156, withdrawals: 9 },
  { date: "2025-01-21", signups: 171, withdrawals: 14 },
  { date: "2025-01-22", signups: 183, withdrawals: 13 },
  { date: "2025-01-23", signups: 142, withdrawals: 10 },
  { date: "2025-01-24", signups: 198, withdrawals: 16 },
  { date: "2025-01-25", signups: 176, withdrawals: 8 }
];

const mockWeeklyData = [
  { period: "2024-W49", signups: 952, withdrawals: 68 },
  { period: "2024-W50", signups: 1087, withdrawals: 75 },
  { period: "2024-W51", signups: 1156, withdrawals: 82 },
  { period: "2025-W1", signups: 1234, withdrawals: 91 },
  { period: "2025-W2", signups: 1298, withdrawals: 78 },
  { period: "2025-W3", signups: 1090, withdrawals: 76 }
];

const mockMonthlyData = [
  { period: "2024-09", signups: 4234, withdrawals: 298 },
  { period: "2024-10", signups: 4567, withdrawals: 356 },
  { period: "2024-11", signups: 4823, withdrawals: 423 },
  { period: "2024-12", signups: 5123, withdrawals: 467 },
  { period: "2025-01", signups: 4890, withdrawals: 389 }
];

export default function MemberSignupStatistics() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>("daily");
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 10;

  // 기간 변경 시 인덱스 초기화
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedPeriod]);

  const getCurrentData = () => {
    switch (selectedPeriod) {
      case "daily":
        return mockDailyData;
      case "weekly":
        return mockWeeklyData;
      case "monthly":
        return mockMonthlyData;
      default:
        return mockDailyData;
    }
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case "daily":
        return "일별";
      case "weekly":
        return "주별";
      case "monthly":
        return "월별";
      default:
        return "일별";
    }
  };

  const formatChartLabel = (item: ChartDataItem) => {
    if (selectedPeriod === "daily" && 'date' in item) {
      const date = new Date(item.date);
      return {
        main: `${date.getMonth() + 1}/${date.getDate()}`,
        sub: `${date.getFullYear()}`
      };
    } else if ((selectedPeriod === "weekly" || selectedPeriod === "monthly") && 'period' in item) {
      if (selectedPeriod === "weekly") {
        return {
          main: item.period.split('-')[1],
          sub: item.period.split('-')[0]
        };
      } else {
        const [year, month] = item.period.split('-');
        return {
          main: `${month}월`,
          sub: year
        };
      }
    }
    return { main: "-", sub: "-" };
  };

  const getMaxValue = () => {
    const data = getVisibleData();
    if (data.length === 0) return 100;
    const maxSignups = Math.max(...data.map(item => item.signups));
    const maxWithdrawals = Math.max(...data.map(item => item.withdrawals));
    return Math.max(maxSignups, maxWithdrawals);
  };

  const getVisibleData = () => {
    const allData = getCurrentData();
    return allData.slice(currentIndex, currentIndex + itemsPerPage);
  };

  const handlePrevious = () => {
    setCurrentIndex(Math.max(0, currentIndex - itemsPerPage));
  };

  const handleNext = () => {
    const allData = getCurrentData();
    setCurrentIndex(Math.min(allData.length - itemsPerPage, currentIndex + itemsPerPage));
  };

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex + itemsPerPage < getCurrentData().length;

  return (
    <div className="statistics-content">
      {/* 요약 정보 */}
      <div className="summary-section">
        <h3>요약 정보</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{mockSummaryData.totalMembers.toLocaleString()}</div>
            <div className="stat-label">총 가입자 수</div>
            <div className="stat-change stat-increase">
              +{mockSummaryData.monthlyGrowth}% 월간 증가
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mockSummaryData.dailyAverage}</div>
            <div className="stat-label">일평균 가입자</div>
            <div className="stat-change stat-increase">
              +{mockSummaryData.weeklyGrowth}% 주간 증가
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mockSummaryData.conversionRate}%</div>
            <div className="stat-label">가입 전환율</div>
            <div className="stat-change stat-increase">
              전체 방문자 대비
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mockSummaryData.failureRate}%</div>
            <div className="stat-label">가입 실패율</div>
            <div className="stat-change stat-decrease">
              -2.1% 개선됨
            </div>
          </div>
        </div>
      </div>



      {/* 기간별 가입 추세 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>기간별 가입 추세</h3>
          <div className="chart-controls">
            <div className="period-selector">
              <button
                className={`period-btn ${selectedPeriod === "daily" ? "active" : ""}`}
                onClick={() => setSelectedPeriod("daily")}
              >
                일별
              </button>
              <button
                className={`period-btn ${selectedPeriod === "weekly" ? "active" : ""}`}
                onClick={() => setSelectedPeriod("weekly")}
              >
                주별
              </button>
              <button
                className={`period-btn ${selectedPeriod === "monthly" ? "active" : ""}`}
                onClick={() => setSelectedPeriod("monthly")}
              >
                월별
              </button>
            </div>
          </div>
        </div>
        
                {/* 테이블과 차트 가로 배치 */}
        <div className="chart-table-layout">
          {/* 왼쪽: 데이터 테이블 */}
          <div className="chart-table-left">
            <div className="data-preview">
              <h4>{getPeriodLabel()} 가입/탈퇴 데이터</h4>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>기간</th>
                      <th>가입자 수</th>
                      <th>탈퇴자 수</th>
                      <th>순증가</th>
                      <th>증감률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getVisibleData().map((item, index) => {
                      const netGrowth = item.signups - item.withdrawals;
                      const actualIndex = currentIndex + index;
                      const growthRate = actualIndex > 0 
                        ? ((netGrowth - (getCurrentData()[actualIndex - 1]?.signups - getCurrentData()[actualIndex - 1]?.withdrawals || 0)) / (getCurrentData()[actualIndex - 1]?.signups - getCurrentData()[actualIndex - 1]?.withdrawals || 1) * 100).toFixed(1)
                        : "0.0";
                      
                      return (
                        <tr key={index}>
                          <td>{'date' in item ? item.date : item.period}</td>
                          <td className="number-cell">{item.signups.toLocaleString()}</td>
                          <td className="number-cell">{item.withdrawals.toLocaleString()}</td>
                          <td className={`number-cell ${netGrowth >= 0 ? 'positive' : 'negative'}`}>
                            {netGrowth >= 0 ? '+' : ''}{netGrowth.toLocaleString()}
                          </td>
                          <td className={`number-cell ${parseFloat(growthRate) >= 0 ? 'positive' : 'negative'}`}>
                            {parseFloat(growthRate) >= 0 ? '+' : ''}{growthRate}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* 차트 네비게이션 */}
            <div className="chart-navigation-container">
              <div className="chart-navigation">
                <button
                  className="chart-nav-btn"
                  onClick={handlePrevious}
                  disabled={!canGoPrevious}
                >
                  ←
                </button>
                
                <div className="chart-info">
                  {currentIndex + 1}-{Math.min(currentIndex + itemsPerPage, getCurrentData().length)} / {getCurrentData().length}
                </div>
                
                <button
                  className="chart-nav-btn"
                  onClick={handleNext}
                  disabled={!canGoNext}
                >
                  →
                </button>
              </div>
            </div>
          </div>

          {/* 오른쪽: 꺾은선 차트 */}
          <div className="chart-table-right">
            <div className="line-chart-container">
              <div className="line-chart-wrapper">
                <svg width="100%" height="300" viewBox="0 0 800 300" className="line-chart-svg" style={{pointerEvents: 'none'}}>
                  {/* 격자 선 */}
                  <defs>
                    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Y축 기준선들 */}
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <g key={percent}>
                      <line
                        x1="80"
                        y1={250 - (percent * 2)}
                        x2="720"
                        y2={250 - (percent * 2)}
                        stroke="#e5e8ec"
                        strokeWidth="1"
                      />
                      <text
                        x="70"
                        y={250 - (percent * 2) + 5}
                        fontSize="11"
                        fill="#9ca3af"
                        textAnchor="end"
                      >
                        {Math.round((getMaxValue() * percent) / 100)}
                      </text>
                    </g>
                  ))}
                  
                  {/* 가입자 꺾은선 */}
                  <polyline
                    fill="none"
                    stroke="#0066ff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getVisibleData()
                      .map((item, index) => {
                        const visibleCount = getVisibleData().length;
                        if (visibleCount === 1) {
                          // 데이터가 1개일 때는 중앙에 배치
                          const x = 400; // viewBox 800의 중앙
                          const y = 250 - (item.signups / getMaxValue()) * 200;
                          return `${x},${y}`;
                        }
                        // 첫 번째 포인트는 차트 시작점(80), 마지막 포인트는 차트 끝점(720)
                        const chartArea = 640; // 720 - 80 = 640
                        const stepWidth = chartArea / (visibleCount - 1);
                        const x = 80 + (index * stepWidth);
                        const y = 250 - (item.signups / getMaxValue()) * 200;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                  
                  {/* 탈퇴자 꺾은선 */}
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={getVisibleData()
                      .map((item, index) => {
                        const visibleCount = getVisibleData().length;
                        if (visibleCount === 1) {
                          // 데이터가 1개일 때는 중앙에 배치
                          const x = 400; // viewBox 800의 중앙
                          const y = 250 - (item.withdrawals / getMaxValue()) * 200;
                          return `${x},${y}`;
                        }
                        // 첫 번째 포인트는 차트 시작점(80), 마지막 포인트는 차트 끝점(720)
                        const chartArea = 640; // 720 - 80 = 640
                        const stepWidth = chartArea / (visibleCount - 1);
                        const x = 80 + (index * stepWidth);
                        const y = 250 - (item.withdrawals / getMaxValue()) * 200;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                  
                  {/* 데이터 포인트들 */}
                  {getVisibleData().map((item, index) => {
                    const visibleCount = getVisibleData().length;
                    let x;
                    if (visibleCount === 1) {
                      // 데이터가 1개일 때는 중앙에 배치
                      x = 400; // viewBox 800의 중앙
                    } else {
                      // 첫 번째 포인트는 차트 시작점(80), 마지막 포인트는 차트 끝점(720)
                      const chartArea = 640; // 720 - 80 = 640
                      const stepWidth = chartArea / (visibleCount - 1);
                      x = 80 + (index * stepWidth);
                    }
                    const signupY = 250 - (item.signups / getMaxValue()) * 200;
                    const withdrawalY = 250 - (item.withdrawals / getMaxValue()) * 200;
                    const label = formatChartLabel(item);
                    
                    return (
                      <g key={index}>
                        {/* 가입자 포인트 */}
                        <circle
                          cx={x}
                          cy={signupY}
                          r="5"
                          fill="#0066ff"
                          stroke="white"
                          strokeWidth="2"
                          className="chart-point"
                          style={{pointerEvents: 'none'}}
                        />
                        <text
                          x={x}
                          y={signupY - 10}
                          fontSize="11"
                          fill="#0066ff"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {item.signups}
                        </text>
                        
                        {/* 탈퇴자 포인트 */}
                        <circle
                          cx={x}
                          cy={withdrawalY}
                          r="5"
                          fill="#ef4444"
                          stroke="white"
                          strokeWidth="2"
                          className="chart-point"
                          style={{pointerEvents: 'none'}}
                        />
                        <text
                          x={x}
                          y={withdrawalY - 10}
                          fontSize="11"
                          fill="#ef4444"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {item.withdrawals}
                        </text>
                        
                        {/* X축 라벨 */}
                        <text
                          x={x}
                          y="280"
                          fontSize="11"
                          fill="#9ca3af"
                          textAnchor="middle"
                        >
                          {label.main}
                        </text>
                        <text
                          x={x}
                          y="295"
                          fontSize="10"
                          fill="#d1d5db"
                          textAnchor="middle"
                        >
                          {label.sub}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
              
              {/* 차트 범례 */}
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color signup-line"></div>
                  <span>가입자</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color withdrawal-line"></div>
                  <span>탈퇴자</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
