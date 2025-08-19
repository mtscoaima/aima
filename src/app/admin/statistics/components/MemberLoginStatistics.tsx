"use client";

import { useState, useEffect } from "react";

type PeriodType = "daily" | "weekly" | "monthly";

type DailyLoginData = {
  date: string;
  logins: number;
  failures: number;
};

type PeriodLoginData = {
  period: string;
  logins: number;
  failures: number;
};

type LoginDataItem = DailyLoginData | PeriodLoginData;

type UserRanking = {
  rank: number;
  username: string;
  email: string;
  loginCount: number;
  lastLogin: string;
  memberType: string;
};

// 더미 데이터
const mockSummaryData = {
  totalLogins: 245678,
  dailyAverage: 1234,
  failedAttempts: 3456,
  avgSessionTime: 42.5, // 분
  weeklyGrowth: 15.2,
  monthlyGrowth: 8.7
};

const mockDailyLoginData: DailyLoginData[] = [
  { date: "2025-01-01", logins: 987, failures: 34 },
  { date: "2025-01-02", logins: 1123, failures: 45 },
  { date: "2025-01-03", logins: 1234, failures: 38 },
  { date: "2025-01-04", logins: 1345, failures: 52 },
  { date: "2025-01-05", logins: 1156, failures: 41 },
  { date: "2025-01-06", logins: 1278, failures: 29 },
  { date: "2025-01-07", logins: 1456, failures: 48 },
  { date: "2025-01-08", logins: 1189, failures: 36 },
  { date: "2025-01-09", logins: 1367, failures: 43 },
  { date: "2025-01-10", logins: 1089, failures: 55 },
  { date: "2025-01-11", logins: 1512, failures: 47 },
  { date: "2025-01-12", logins: 1234, failures: 39 },
  { date: "2025-01-13", logins: 1398, failures: 51 },
  { date: "2025-01-14", logins: 1445, failures: 42 },
  { date: "2025-01-15", logins: 1156, failures: 45 },
  { date: "2025-01-16", logins: 1234, failures: 52 },
  { date: "2025-01-17", logins: 1089, failures: 38 },
  { date: "2025-01-18", logins: 1345, failures: 67 },
  { date: "2025-01-19", logins: 1456, failures: 43 },
  { date: "2025-01-20", logins: 1278, failures: 49 },
  { date: "2025-01-21", logins: 1389, failures: 55 },
  { date: "2025-01-22", logins: 1467, failures: 41 },
  { date: "2025-01-23", logins: 1198, failures: 37 },
  { date: "2025-01-24", logins: 1523, failures: 59 },
  { date: "2025-01-25", logins: 1356, failures: 44 }
];

const mockWeeklyLoginData: PeriodLoginData[] = [
  { period: "2024-W49", logins: 7823, failures: 324 },
  { period: "2024-W50", logins: 8156, failures: 289 },
  { period: "2024-W51", logins: 8934, failures: 356 },
  { period: "2025-W1", logins: 9234, failures: 267 },
  { period: "2025-W2", logins: 8756, failures: 298 },
  { period: "2025-W3", logins: 8947, failures: 352 }
];

const mockMonthlyLoginData: PeriodLoginData[] = [
  { period: "2024-09", logins: 32456, failures: 1234 },
  { period: "2024-10", logins: 34567, failures: 1156 },
  { period: "2024-11", logins: 35823, failures: 1345 },
  { period: "2024-12", logins: 38123, failures: 1567 },
  { period: "2025-01", logins: 36890, failures: 1289 }
];

const mockUserRanking: UserRanking[] = [
  { rank: 1, username: "김마케터", email: "kim***@company.com", loginCount: 342, lastLogin: "2025-01-21 14:23", memberType: "기업" },
  { rank: 2, username: "박광고주", email: "park***@business.co.kr", loginCount: 298, lastLogin: "2025-01-21 13:45", memberType: "기업" },
  { rank: 3, username: "이영업", email: "lee***@sales.com", loginCount: 267, lastLogin: "2025-01-21 15:12", memberType: "개인" },
  { rank: 4, username: "최운영", email: "choi***@manage.kr", loginCount: 234, lastLogin: "2025-01-21 12:34", memberType: "기업" },
  { rank: 5, username: "정관리", email: "jung***@admin.com", loginCount: 223, lastLogin: "2025-01-21 16:07", memberType: "개인" },
  { rank: 6, username: "황기획", email: "hwang***@plan.co.kr", loginCount: 198, lastLogin: "2025-01-21 11:56", memberType: "기업" },
  { rank: 7, username: "손전략", email: "son***@strategy.com", loginCount: 189, lastLogin: "2025-01-21 14:43", memberType: "개인" },
  { rank: 8, username: "배개발", email: "bae***@dev.kr", loginCount: 176, lastLogin: "2025-01-21 13:21", memberType: "기업" },
  { rank: 9, username: "신디자인", email: "shin***@design.com", loginCount: 165, lastLogin: "2025-01-21 15:38", memberType: "개인" },
  { rank: 10, username: "조분석", email: "jo***@analysis.co.kr", loginCount: 154, lastLogin: "2025-01-21 12:17", memberType: "기업" }
];

export default function MemberLoginStatistics() {
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
        return mockDailyLoginData;
      case "weekly":
        return mockWeeklyLoginData;
      case "monthly":
        return mockMonthlyLoginData;
      default:
        return mockDailyLoginData;
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

  const formatChartLabel = (item: LoginDataItem) => {
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
    const maxLogins = Math.max(...data.map(item => item.logins));
    const maxFailures = Math.max(...data.map(item => item.failures));
    return Math.max(maxLogins, maxFailures);
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
            <div className="stat-number">{mockSummaryData.totalLogins.toLocaleString()}</div>
            <div className="stat-label">총 로그인 횟수</div>
            <div className="stat-change stat-increase">
              +{mockSummaryData.monthlyGrowth}% 월간 증가
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mockSummaryData.dailyAverage.toLocaleString()}</div>
            <div className="stat-label">일평균 로그인</div>
            <div className="stat-change stat-increase">
              +{mockSummaryData.weeklyGrowth}% 주간 증가
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mockSummaryData.failedAttempts.toLocaleString()}</div>
            <div className="stat-label">실패한 로그인시도</div>
            <div className="stat-change stat-decrease">
              -5.3% 감소
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{mockSummaryData.avgSessionTime}분</div>
            <div className="stat-label">로그인 유지 시간 평균</div>
            <div className="stat-change stat-increase">
              +2.1분 증가
            </div>
          </div>
        </div>
      </div>

      {/* 기간별 로그인 추세 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>기간별 로그인 추세</h3>
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
              <h4>{getPeriodLabel()} 로그인/실패 데이터</h4>
              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>기간</th>
                      <th>로그인 수</th>
                      <th>실패 횟수</th>
                      <th>성공률</th>
                      <th>증감률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getVisibleData().map((item, index) => {
                      const successRate = ((item.logins / (item.logins + item.failures)) * 100).toFixed(1);
                      const actualIndex = currentIndex + index;
                      const growthRate = actualIndex > 0 
                        ? ((item.logins - (getCurrentData()[actualIndex - 1]?.logins || 0)) / (getCurrentData()[actualIndex - 1]?.logins || 1) * 100).toFixed(1)
                        : "0.0";
                      
                      return (
                        <tr key={index}>
                          <td>{'date' in item ? item.date : item.period}</td>
                          <td className="number-cell">{item.logins.toLocaleString()}</td>
                          <td className="number-cell">{item.failures.toLocaleString()}</td>
                          <td className="number-cell positive">{successRate}%</td>
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
                    <pattern id="loginGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#loginGrid)" />
                  
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
                  
                  {/* 로그인 성공 꺾은선 */}
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
                          const y = 250 - (item.logins / getMaxValue()) * 200;
                          return `${x},${y}`;
                        }
                        // 첫 번째 포인트는 차트 시작점(80), 마지막 포인트는 차트 끝점(720)
                        const chartArea = 640; // 720 - 80 = 640
                        const stepWidth = chartArea / (visibleCount - 1);
                        const x = 80 + (index * stepWidth);
                        const y = 250 - (item.logins / getMaxValue()) * 200;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />
                  
                  {/* 로그인 실패 꺾은선 */}
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
                          const y = 250 - (item.failures / getMaxValue()) * 200;
                          return `${x},${y}`;
                        }
                        // 첫 번째 포인트는 차트 시작점(80), 마지막 포인트는 차트 끝점(720)
                        const chartArea = 640; // 720 - 80 = 640
                        const stepWidth = chartArea / (visibleCount - 1);
                        const x = 80 + (index * stepWidth);
                        const y = 250 - (item.failures / getMaxValue()) * 200;
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
                    const loginY = 250 - (item.logins / getMaxValue()) * 200;
                    const failureY = 250 - (item.failures / getMaxValue()) * 200;
                    const label = formatChartLabel(item);
                    
                    return (
                      <g key={index}>
                        {/* 로그인 성공 포인트 */}
                        <circle
                          cx={x}
                          cy={loginY}
                          r="5"
                          fill="#0066ff"
                          stroke="white"
                          strokeWidth="2"
                          className="chart-point"
                          style={{pointerEvents: 'none'}}
                        />
                        <text
                          x={x}
                          y={loginY - 10}
                          fontSize="11"
                          fill="#0066ff"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {item.logins}
                        </text>
                        
                        {/* 로그인 실패 포인트 */}
                        <circle
                          cx={x}
                          cy={failureY}
                          r="5"
                          fill="#ef4444"
                          stroke="white"
                          strokeWidth="2"
                          className="chart-point"
                          style={{pointerEvents: 'none'}}
                        />
                        <text
                          x={x}
                          y={failureY - 10}
                          fontSize="11"
                          fill="#ef4444"
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {item.failures}
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
                  <span>로그인 성공</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color withdrawal-line"></div>
                  <span>로그인 실패</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 사용자 랭킹 TOP10 */}
      <div className="ranking-container">
        <div className="chart-header">
          <h3>사용자 랭킹 TOP10 (로그인 빈도 기준)</h3>
        </div>
        <div className="ranking-table-container">
          <table className="ranking-table">
            <thead>
              <tr>
                <th>순위</th>
                <th>사용자명</th>
                <th>이메일</th>
                <th>로그인 횟수</th>
                <th>최근 로그인</th>
                <th>회원 유형</th>
              </tr>
            </thead>
            <tbody>
              {mockUserRanking.map((user) => (
                <tr key={user.rank}>
                  <td>
                    <div className={`rank-badge rank-${user.rank <= 3 ? 'top' : 'normal'}`}>
                      {user.rank}
                    </div>
                  </td>
                  <td className="username-cell">{user.username}</td>
                  <td className="email-cell">{user.email}</td>
                  <td className="number-cell">{user.loginCount.toLocaleString()}</td>
                  <td className="datetime-cell">{user.lastLogin}</td>
                  <td>
                    <span className={`member-type-badge ${user.memberType === '기업' ? 'business' : 'individual'}`}>
                      {user.memberType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
