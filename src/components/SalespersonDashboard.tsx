"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface ReferralData {
  id: number;
  name: string;
  joinDate: string;
  status: "활성" | "비활성" | "대기";
  totalPayment: number;
  email: string;
  children?: ReferralData[];
  level?: number;
}

export default function SalespersonDashboard() {
  const { user } = useAuth();
  const [chartPeriod, setChartPeriod] = useState<"daily" | "monthly">(
    "monthly"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  // 계층구조가 있는 더미 데이터
  const dummyReferrals: ReferralData[] = [
    {
      id: 1,
      name: "김민수",
      joinDate: "2024-01-15",
      status: "활성",
      totalPayment: 2500000,
      email: "kim***@email.com",
      level: 0,
      children: [
        {
          id: 2,
          name: "이수정",
          joinDate: "2024-01-22",
          status: "활성",
          totalPayment: 1800000,
          email: "lee***@email.com",
          level: 1,
          children: [
            {
              id: 3,
              name: "박준호",
              joinDate: "2024-02-03",
              status: "비활성",
              totalPayment: 950000,
              email: "park***@email.com",
              level: 2,
            },
            {
              id: 4,
              name: "최유리",
              joinDate: "2024-02-10",
              status: "활성",
              totalPayment: 3200000,
              email: "choi***@email.com",
              level: 2,
            },
          ],
        },
        {
          id: 5,
          name: "정태민",
          joinDate: "2024-02-18",
          status: "활성",
          totalPayment: 1400000,
          email: "jung***@email.com",
          level: 1,
        },
      ],
    },
    {
      id: 6,
      name: "홍지연",
      joinDate: "2024-02-25",
      status: "대기",
      totalPayment: 0,
      email: "hong***@email.com",
      level: 0,
      children: [
        {
          id: 7,
          name: "김영희",
          joinDate: "2024-03-01",
          status: "활성",
          totalPayment: 850000,
          email: "kim_yh***@email.com",
          level: 1,
        },
        {
          id: 8,
          name: "박철수",
          joinDate: "2024-03-05",
          status: "활성",
          totalPayment: 1250000,
          email: "park_cs***@email.com",
          level: 1,
          children: [
            {
              id: 9,
              name: "이민정",
              joinDate: "2024-03-10",
              status: "활성",
              totalPayment: 750000,
              email: "lee_mj***@email.com",
              level: 2,
            },
          ],
        },
      ],
    },
  ];

  // 전체 일별 데이터
  const allDailyRevenue = [
    { date: "2023-12-02", amount: 34000 },
    { date: "2023-12-03", amount: 41000 },
    { date: "2023-12-04", amount: 28000 },
    { date: "2023-12-05", amount: 52000 },
    { date: "2023-12-06", amount: 38000 },
    { date: "2023-12-07", amount: 45000 },
    { date: "2023-12-08", amount: 61000 },
    { date: "2023-12-09", amount: 33000 },
    { date: "2023-12-10", amount: 49000 },
    { date: "2023-12-11", amount: 56000 },
    { date: "2023-12-12", amount: 42000 },
    { date: "2023-12-13", amount: 38000 },
    { date: "2023-12-14", amount: 47000 },
    { date: "2023-12-15", amount: 53000 },
    { date: "2023-12-16", amount: 29000 },
    { date: "2023-12-17", amount: 44000 },
    { date: "2023-12-18", amount: 58000 },
    { date: "2023-12-19", amount: 31000 },
    { date: "2023-12-20", amount: 46000 },
    { date: "2023-12-21", amount: 54000 },
    { date: "2023-12-22", amount: 39000 },
    { date: "2023-12-23", amount: 48000 },
    { date: "2023-12-24", amount: 62000 },
    { date: "2023-12-25", amount: 35000 },
    { date: "2023-12-26", amount: 51000 },
    { date: "2023-12-27", amount: 43000 },
    { date: "2023-12-28", amount: 37000 },
    { date: "2023-12-29", amount: 49000 },
    { date: "2023-12-30", amount: 55000 },
    { date: "2023-12-31", amount: 67000 },
    { date: "2024-01-01", amount: 45000 },
    { date: "2024-01-02", amount: 52000 },
    { date: "2024-01-03", amount: 38000 },
    { date: "2024-01-04", amount: 67000 },
    { date: "2024-01-05", amount: 43000 },
    { date: "2024-01-06", amount: 59000 },
    { date: "2024-01-07", amount: 71000 },
    { date: "2024-01-08", amount: 36000 },
    { date: "2024-01-09", amount: 48000 },
    { date: "2024-01-10", amount: 54000 },
    { date: "2024-01-11", amount: 41000 },
    { date: "2024-01-12", amount: 56000 },
    { date: "2024-01-13", amount: 63000 },
    { date: "2024-01-14", amount: 39000 },
    { date: "2024-01-15", amount: 47000 },
    { date: "2024-01-16", amount: 52000 },
    { date: "2024-01-17", amount: 44000 },
    { date: "2024-01-18", amount: 58000 },
    { date: "2024-01-19", amount: 35000 },
    { date: "2024-01-20", amount: 49000 },
    { date: "2024-01-21", amount: 61000 },
    { date: "2024-01-22", amount: 42000 },
    { date: "2024-01-23", amount: 54000 },
    { date: "2024-01-24", amount: 37000 },
    { date: "2024-01-25", amount: 51000 },
    { date: "2024-01-26", amount: 46000 },
    { date: "2024-01-27", amount: 59000 },
    { date: "2024-01-28", amount: 33000 },
    { date: "2024-01-29", amount: 48000 },
    { date: "2024-01-30", amount: 55000 },
  ];

  // 전체 월별 데이터
  const allMonthlyRevenue = [
    { period: "2022-02", amount: 650000 },
    { period: "2022-03", amount: 720000 },
    { period: "2022-04", amount: 680000 },
    { period: "2022-05", amount: 790000 },
    { period: "2022-06", amount: 850000 },
    { period: "2022-07", amount: 920000 },
    { period: "2022-08", amount: 780000 },
    { period: "2022-09", amount: 890000 },
    { period: "2022-10", amount: 950000 },
    { period: "2022-11", amount: 1080000 },
    { period: "2022-12", amount: 1150000 },
    { period: "2023-01", amount: 1020000 },
    { period: "2023-02", amount: 1180000 },
    { period: "2023-03", amount: 1260000 },
    { period: "2023-04", amount: 1340000 },
    { period: "2023-05", amount: 1420000 },
    { period: "2023-06", amount: 1580000 },
    { period: "2023-07", amount: 1650000 },
    { period: "2023-08", amount: 1890000 },
    { period: "2023-09", amount: 1240000 },
    { period: "2023-10", amount: 1567000 },
    { period: "2023-11", amount: 1890000 },
    { period: "2023-12", amount: 2150000 },
    { period: "2024-01", amount: 2430000 },
  ];

  // 유저 가입일 기준으로 데이터 필터링
  const getFilteredData = () => {
    if (!user?.createdAt) {
      // 유저 정보가 없으면 빈 배열 반환
      return { dailyRevenue: [], monthlyRevenue: [] };
    }

    const joinDate = new Date(user.createdAt);
    const currentDate = new Date();

    // 일별 데이터 필터링
    const filteredDaily = allDailyRevenue.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= joinDate && itemDate <= currentDate;
    });

    // 월별 데이터 필터링
    const filteredMonthly = allMonthlyRevenue.filter((item) => {
      const [year, month] = item.period.split("-");
      const itemDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const joinMonthStart = new Date(
        joinDate.getFullYear(),
        joinDate.getMonth(),
        1
      );
      const currentMonthStart = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );

      return itemDate >= joinMonthStart && itemDate <= currentMonthStart;
    });

    return { dailyRevenue: filteredDaily, monthlyRevenue: filteredMonthly };
  };

  const { dailyRevenue, monthlyRevenue } = getFilteredData();
  const allData = chartPeriod === "daily" ? dailyRevenue : monthlyRevenue;
  const visibleData = allData.slice(currentIndex, currentIndex + 7);
  const maxAmount =
    visibleData.length > 0
      ? Math.max(...visibleData.map((item) => item.amount))
      : 0;

  // 트리 구조를 플랫 리스트로 변환하는 함수
  const flattenTree = (items: ReferralData[]): ReferralData[] => {
    const result: ReferralData[] = [];

    const traverse = (nodes: ReferralData[], level: number = 0) => {
      nodes.forEach((node) => {
        const nodeWithLevel = { ...node, level };
        result.push(nodeWithLevel);

        if (node.children && expandedItems.has(node.id)) {
          traverse(node.children, level + 1);
        }
      });
    };

    traverse(items);
    return result;
  };

  const flatReferrals = flattenTree(dummyReferrals);

  // 펼치기/접기 토글 함수
  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  // 하위 추천인 수 계산 함수
  const getChildrenCount = (item: ReferralData): number => {
    if (!item.children) return 0;

    let count = item.children.length;
    item.children.forEach((child) => {
      count += getChildrenCount(child);
    });

    return count;
  };

  // 현재 날짜 기준으로 초기 인덱스를 설정하는 함수
  const getCurrentIndex = (period: "daily" | "monthly") => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    if (period === "daily") {
      if (dailyRevenue.length === 0) return 0;

      const currentDateStr = `${currentYear}-${currentMonth
        .toString()
        .padStart(2, "0")}-${currentDay.toString().padStart(2, "0")}`;
      const closestIndex = dailyRevenue.findIndex(
        (item) => item.date >= currentDateStr
      );

      if (closestIndex >= 0) {
        return Math.max(0, Math.min(closestIndex - 3, dailyRevenue.length - 7));
      } else {
        return Math.max(0, dailyRevenue.length - 7);
      }
    } else {
      if (monthlyRevenue.length === 0) return 0;

      const currentPeriodStr = `${currentYear}-${currentMonth
        .toString()
        .padStart(2, "0")}`;
      const closestIndex = monthlyRevenue.findIndex(
        (item) => item.period >= currentPeriodStr
      );

      if (closestIndex >= 0) {
        return Math.max(
          0,
          Math.min(closestIndex - 3, monthlyRevenue.length - 7)
        );
      } else {
        return Math.max(0, monthlyRevenue.length - 7);
      }
    }
  };

  // 초기 로드 시 현재 날짜 기준으로 설정
  useEffect(() => {
    if (user?.createdAt) {
      setCurrentIndex(getCurrentIndex(chartPeriod));
    }
  }, [user?.createdAt, chartPeriod]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 7 < allData.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePeriodChange = (period: "daily" | "monthly") => {
    setChartPeriod(period);
    // 현재 날짜 기준으로 초기화
    setCurrentIndex(getCurrentIndex(period));
  };

  const formatChartLabel = (
    item: { date: string; amount: number } | { period: string; amount: number }
  ) => {
    if (chartPeriod === "daily" && "date" in item) {
      const dateParts = item.date.split("-");
      const year = dateParts[0];
      const day = dateParts[2];
      return { main: `${day}일`, sub: year };
    } else if (chartPeriod === "monthly" && "period" in item) {
      const periodParts = item.period.split("-");
      const year = periodParts[0];
      const month = periodParts[1];
      return { main: `${month}월`, sub: year };
    }
    return { main: "", sub: "" };
  };

  // 유저 정보가 없으면 로딩 표시
  if (!user) {
    return (
      <div className="salesperson-dashboard">
        <div className="dashboard-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <p>사용자 정보를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="salesperson-dashboard">
      <div className="dashboard-container">
        {/* 상단 핵심 지표 카드들 */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>총 추천인 수</h3>
              <p className="stat-number">24명</p>
              <p className="stat-description">전체 추천 가입자</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>이번 달 신규 가입자</h3>
              <p className="stat-number">6명</p>
              <p className="stat-description">2월 신규 추천 가입</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>총 수익</h3>
              <p className="stat-number">₩14,567,000</p>
              <p className="stat-description">누적 수익 금액</p>
            </div>
          </div>
        </div>

        {/* 추천인 목록 테이블 */}
        <div className="dashboard-section referrals-table-section">
          <div className="section-header">
            <h3>추천인 목록</h3>
            <p>전체 추천인 현황을 확인하세요</p>
          </div>

          <div className="table-container">
            <table className="referrals-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>가입일</th>
                  <th>상태</th>
                  <th>누적 결제액</th>
                  <th>하위 추천인</th>
                  <th>이메일</th>
                </tr>
              </thead>
              <tbody>
                {flatReferrals.map((referral) => (
                  <tr
                    key={referral.id}
                    className={`referral-row level-${referral.level}`}
                  >
                    <td className="referral-name">
                      <div
                        className="referral-name-cell"
                        style={{
                          paddingLeft: `${(referral.level || 0) * 20}px`,
                        }}
                      >
                        {referral.children && referral.children.length > 0 && (
                          <button
                            className={`tree-toggle ${
                              expandedItems.has(referral.id) ? "expanded" : ""
                            }`}
                            onClick={() => toggleExpand(referral.id)}
                          >
                            {expandedItems.has(referral.id) ? "−" : "+"}
                          </button>
                        )}
                        <span className="name-text">{referral.name}</span>
                      </div>
                    </td>
                    <td className="referral-date">{referral.joinDate}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          referral.status === "활성"
                            ? "active"
                            : referral.status === "비활성"
                            ? "inactive"
                            : "pending"
                        }`}
                      >
                        {referral.status}
                      </span>
                    </td>
                    <td className="referral-amount">
                      ₩{referral.totalPayment.toLocaleString()}
                    </td>
                    <td className="referral-children">
                      {getChildrenCount(referral) > 0 && (
                        <span className="children-count">
                          {getChildrenCount(referral)}명
                        </span>
                      )}
                    </td>
                    <td className="referral-email">{referral.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 수익 내역 차트 */}
        <div className="dashboard-section revenue-chart-section">
          <div className="section-header">
            <div className="section-title-group">
              <h3>수익 내역</h3>
              <p>
                가입일(
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString("ko-KR")
                  : ""}
                )부터 현재까지의 수익 추이
              </p>
            </div>
            <div className="chart-controls">
              <button
                className={`chart-toggle-btn ${
                  chartPeriod === "daily" ? "active" : ""
                }`}
                onClick={() => handlePeriodChange("daily")}
              >
                일별
              </button>
              <button
                className={`chart-toggle-btn ${
                  chartPeriod === "monthly" ? "active" : ""
                }`}
                onClick={() => handlePeriodChange("monthly")}
              >
                월별
              </button>
            </div>
          </div>

          <div className="chart-container">
            {allData.length === 0 ? (
              <div className="chart-empty-state">
                <p>아직 수익 데이터가 없습니다.</p>
                <p>활동을 시작하면 여기에 수익 추이가 표시됩니다.</p>
              </div>
            ) : (
              <div className="chart-navigation">
                <button
                  className="chart-nav-btn"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  ←
                </button>

                <div className="chart-wrapper">
                  {visibleData.map((item, index) => {
                    const label = formatChartLabel(item);
                    return (
                      <div key={index} className="chart-bar-container">
                        <div
                          className="chart-bar"
                          style={{
                            height: `${
                              maxAmount > 0
                                ? (item.amount / maxAmount) * 100
                                : 0
                            }%`,
                            minHeight: "20px",
                          }}
                        >
                          <div className="chart-value">
                            ₩{(item.amount / 1000).toFixed(0)}K
                          </div>
                        </div>
                        <div className="chart-label">
                          <div className="chart-label-year">{label.sub}</div>
                          <div className="chart-label-main">{label.main}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  className="chart-nav-btn"
                  onClick={handleNext}
                  disabled={currentIndex + 7 >= allData.length}
                >
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
