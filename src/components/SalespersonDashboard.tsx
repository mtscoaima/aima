"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToReferrals, subscribeToTransactions } from "@/lib/supabase";

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

interface DashboardData {
  totalReferrals: number;
  monthlyNewSignups: number;
  totalRevenue: number;
  referralList: ReferralData[];
  dailyRevenue: Array<{ date: string; amount: number }>;
  monthlyRevenue: Array<{ period: string; amount: number }>;
}

export default function SalespersonDashboard() {
  const { user } = useAuth();
  const [chartPeriod, setChartPeriod] = useState<"daily" | "monthly">(
    "monthly"
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const channelsRef = useRef<
    Array<{ unsubscribe?: () => void; state?: string }>
  >([]);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // API에서 대시보드 데이터 가져오기
  const fetchDashboardData = useCallback(
    async (isRealTimeUpdate = false) => {
      if (!user) return;

      try {
        // 초기 로딩이 아닌 실시간 업데이트의 경우 로딩 스피너를 표시하지 않음
        if (!isRealTimeUpdate && isInitialLoad) {
          setLoading(true);
        }
        setError(null);

        const token = localStorage.getItem("accessToken");
        if (!token) {
          setError("인증 토큰이 없습니다.");
          return;
        }

        const response = await fetch("/api/referrals/dashboard", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        setDashboardData(result.data);
        setLastUpdated(new Date());

        // 데이터 업데이트 시 페이지 초기화 (선택사항)
        if (isRealTimeUpdate && currentPage > 1) {
          const newTotalPages = Math.ceil(
            (result.data.referralList?.length || 0) / itemsPerPage
          );
          if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(newTotalPages);
          }
        }

        // 초기 로딩 완료 표시
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
        setError("대시보드 데이터를 불러오는데 실패했습니다.");
      } finally {
        if (!isRealTimeUpdate && isInitialLoad) {
          setLoading(false);
        }
      }
    },
    [user, isInitialLoad, currentPage, itemsPerPage]
  );

  // 실시간 구독 설정
  const setupRealTimeSubscriptions = useCallback(() => {
    if (!user?.id) return;

    // 기존 구독 정리
    channelsRef.current.forEach((channel) => {
      if (channel?.unsubscribe) {
        channel.unsubscribe();
      }
    });
    channelsRef.current = [];

    try {
      // 1. 추천인 테이블 변경사항 구독
      const referralsChannel = subscribeToReferrals(
        parseInt(user.id.toString()),
        () => {
          fetchDashboardData(true); // 실시간 업데이트임을 표시
        }
      );

      // 2. 트랜잭션 테이블 변경사항 구독 (리워드 관련)
      const transactionsChannel = subscribeToTransactions(
        parseInt(user.id.toString()),
        () => {
          fetchDashboardData(true); // 실시간 업데이트임을 표시
        }
      );

      channelsRef.current = [referralsChannel, transactionsChannel];
      setIsRealTimeConnected(true);

      // 연결 상태 모니터링
      setTimeout(() => {
        const isConnected = channelsRef.current.some(
          (channel) =>
            channel?.state === "joined" || channel?.state === "subscribed"
        );
        setIsRealTimeConnected(isConnected);
      }, 2000);
    } catch (error) {
      console.error("Real-time subscription error:", error);
      setIsRealTimeConnected(false);
    }
  }, [user, fetchDashboardData]);

  // 폴링 백업 설정 (실시간이 실패할 경우)
  const setupPollingBackup = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // 30초마다 데이터 새로고침 (실시간 연결이 안 된 경우에만)
    pollingIntervalRef.current = setInterval(() => {
      if (!isRealTimeConnected) {
        fetchDashboardData(true); // 실시간 업데이트임을 표시
      }
    }, 30000);
  }, [isRealTimeConnected, fetchDashboardData]);

  // 컴포넌트 마운트 시 데이터 가져오기
  useEffect(() => {
    fetchDashboardData(false); // 초기 로딩
  }, [fetchDashboardData]);

  // 실시간 구독 및 폴링 설정
  useEffect(() => {
    if (user?.id) {
      setupRealTimeSubscriptions();
      setupPollingBackup();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 실시간 구독 정리
      channelsRef.current.forEach((channel) => {
        if (channel?.unsubscribe) {
          channel.unsubscribe();
        }
      });
      channelsRef.current = [];

      // 폴링 정리
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [user?.id, setupRealTimeSubscriptions, setupPollingBackup]);

  // 실시간 연결 상태가 변경될 때 폴링 재설정
  useEffect(() => {
    setupPollingBackup();
  }, [isRealTimeConnected, setupPollingBackup]);

  // 실제 데이터 또는 더미 데이터 사용
  const actualData = dashboardData || {
    totalReferrals: 0,
    monthlyNewSignups: 0,
    totalRevenue: 0,
    referralList: [],
    dailyRevenue: [],
    monthlyRevenue: [],
  };

  const allData =
    chartPeriod === "daily"
      ? actualData.dailyRevenue
      : actualData.monthlyRevenue;
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

  const flatReferrals = flattenTree(actualData.referralList);

  // 페이지네이션 계산
  const totalPages = Math.ceil(flatReferrals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentReferrals = flatReferrals.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 페이지 변경 시 펼쳐진 항목들 초기화 (선택사항)
    // setExpandedItems(new Set());
  };

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
  const getCurrentIndex = useCallback(
    (period: "daily" | "monthly") => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const currentDay = now.getDate();

      if (period === "daily") {
        if (actualData.dailyRevenue.length === 0) return 0;

        const currentDateStr = `${currentYear}-${currentMonth
          .toString()
          .padStart(2, "0")}-${currentDay.toString().padStart(2, "0")}`;
        const closestIndex = actualData.dailyRevenue.findIndex(
          (item) => item.date >= currentDateStr
        );

        if (closestIndex >= 0) {
          return Math.max(
            0,
            Math.min(closestIndex - 3, actualData.dailyRevenue.length - 7)
          );
        } else {
          return Math.max(0, actualData.dailyRevenue.length - 7);
        }
      } else {
        if (actualData.monthlyRevenue.length === 0) return 0;

        const currentPeriodStr = `${currentYear}-${currentMonth
          .toString()
          .padStart(2, "0")}`;
        const closestIndex = actualData.monthlyRevenue.findIndex(
          (item) => item.period >= currentPeriodStr
        );

        if (closestIndex >= 0) {
          return Math.max(
            0,
            Math.min(closestIndex - 3, actualData.monthlyRevenue.length - 7)
          );
        } else {
          return Math.max(0, actualData.monthlyRevenue.length - 7);
        }
      }
    },
    [actualData.dailyRevenue, actualData.monthlyRevenue]
  );

  // 초기 로드 시 현재 날짜 기준으로 설정
  useEffect(() => {
    if (user?.createdAt) {
      setCurrentIndex(getCurrentIndex(chartPeriod));
    }
  }, [user?.createdAt, chartPeriod, getCurrentIndex]);

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

  // 로딩 및 에러 상태 처리 (초기 로딩 시에만)
  if (!user || (loading && isInitialLoad)) {
    return (
      <div className="salesperson-dashboard">
        <div className="dashboard-container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <p>
                {!user
                  ? "사용자 정보를 불러오는 중..."
                  : "대시보드 데이터를 불러오는 중..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="salesperson-dashboard">
        <div className="dashboard-container">
          <div className="error-container">
            <div className="error-message">
              <p>{error}</p>
              <button
                onClick={() => fetchDashboardData(false)}
                className="retry-button"
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="salesperson-dashboard">
      <div className="dashboard-container">
        {/* 상단 상태 바 */}
        <div
          className="dashboard-status-bar"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 16px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  backgroundColor: isRealTimeConnected ? "#10b981" : "#ef4444",
                }}
              ></div>
              <span>
                {isRealTimeConnected ? "실시간 연결됨" : "실시간 연결 안됨"}
              </span>
            </div>
            {lastUpdated && (
              <span style={{ color: "#6b7280" }}>
                마지막 업데이트: {lastUpdated.toLocaleTimeString("ko-KR")}
              </span>
            )}
          </div>
          <button
            onClick={() => fetchDashboardData(false)}
            disabled={loading && isInitialLoad}
            style={{
              padding: "6px 12px",
              backgroundColor: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading && isInitialLoad ? "not-allowed" : "pointer",
              opacity: loading && isInitialLoad ? 0.6 : 1,
            }}
          >
            새로고침
          </button>
        </div>

        {/* 상단 핵심 지표 카드들 */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>총 추천인 수</h3>
              <p className="stat-number">{actualData.totalReferrals}명</p>
              <p className="stat-description">전체 추천 가입자</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>이번 달 신규 가입자</h3>
              <p className="stat-number">{actualData.monthlyNewSignups}명</p>
              <p className="stat-description">
                {new Date().getMonth() + 1}월 신규 추천 가입
              </p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>총 수익</h3>
              <p className="stat-number">
                ₩{actualData.totalRevenue.toLocaleString()}
              </p>
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
                {currentReferrals.map((referral) => (
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

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="pagination">
              <span className="pagination-info">
                총 {flatReferrals.length}개의 추천인 ({startIndex + 1}-
                {Math.min(endIndex, flatReferrals.length)}개 표시)
              </span>
              <div className="pagination-controls">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-button"
                >
                  이전
                </button>
                <span className="pagination-current">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="pagination-button"
                >
                  다음
                </button>
              </div>
            </div>
          )}
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
