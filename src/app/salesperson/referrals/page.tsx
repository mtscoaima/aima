"use client";

import React, { useState, useEffect } from "react";
import { SalespersonGuard } from "@/components/RoleGuard";
import {
  getRewardStats,
  getRewardTransactions,
  getSettlements,
  RewardStats,
  RewardTransaction,
  Settlement,
} from "@/lib/api";

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState("direct");
  const [showFullView, setShowFullView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rewardStats, setRewardStats] = useState<RewardStats | null>(null);
  const [directRewards, setDirectRewards] = useState<RewardTransaction[]>([]);
  const [indirectRewards, setIndirectRewards] = useState<RewardTransaction[]>(
    []
  );
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  // 전체보기용 상태
  const [fullViewLoading, setFullViewLoading] = useState(false);
  const [fullViewData, setFullViewData] = useState<RewardTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("전체");

  // 데이터 로딩 함수 (상위 10개만)
  const loadData = async () => {
    try {
      setLoading(true);

      // 병렬로 데이터 로딩 (각각 10개씩)
      const [
        statsResponse,
        directResponse,
        indirectResponse,
        settlementsResponse,
      ] = await Promise.all([
        getRewardStats(),
        getRewardTransactions("direct", 1, 10),
        getRewardTransactions("indirect", 1, 10),
        getSettlements(),
      ]);

      setRewardStats(statsResponse.stats);
      setDirectRewards(directResponse.transactions);
      setIndirectRewards(indirectResponse.transactions);
      setSettlements(settlementsResponse.settlements.slice(0, 10)); // 정산도 10개만
    } catch (error) {
      console.error("데이터 로딩 실패:", error);
      // 에러 발생 시 기본값 설정
      setRewardStats({
        totalReward: 0,
        directReward: 0,
        indirectReward: 0,
        pendingReward: 0,
        monthlyReward: 0,
      });
      setDirectRewards([]);
      setIndirectRewards([]);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  // 전체보기 데이터 로딩 함수
  const loadFullViewData = async (page: number = 1) => {
    try {
      setFullViewLoading(true);

      if (activeTab === "settlement") {
        // 정산 내역의 경우는 별도 처리 (settlements API 사용)
        const settlementsResponse = await getSettlements();
        setSettlements(settlementsResponse.settlements); // 전체 정산 데이터 업데이트
        setFullViewData([]); // 정산 데이터는 별도 상태로 관리
        setTotalPages(1);
        setCurrentPage(1);
      } else {
        // 리워드 내역의 경우
        const response = await getRewardTransactions(
          activeTab as "direct" | "indirect",
          page,
          20
        );

        setFullViewData(response.transactions);
        setTotalPages(response.totalPages);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("전체보기 데이터 로딩 실패:", error);
      setFullViewData([]);
    } finally {
      setFullViewLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 전체보기 열기
  const handleShowFullView = async () => {
    setShowFullView(true);
    await loadFullViewData(1);
  };

  // 전체보기 닫기
  const handleCloseFullView = () => {
    setShowFullView(false);
    setSearchTerm("");
    setCurrentPage(1);
  };

  // 검색 처리
  const handleSearch = () => {
    // 실제 검색 구현은 API에서 처리해야 하지만,
    // 여기서는 클라이언트 사이드 필터링으로 구현
    loadFullViewData(1);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    loadFullViewData(page);
  };

  // 금액 포맷팅 함수
  const formatAmount = (amount: number) => {
    return `₩${amount.toLocaleString()}`;
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 사용자 이름 마스킹 함수 (이름 완전 표시, 이메일만 마스킹)
  const maskUserName = (name: string, email: string) => {
    if (!name)
      return email ? `${email.split("@")[0].substring(0, 3)}***` : "익명";
    const maskedEmail = email
      ? `${email.split("@")[0].substring(0, 3)}***`
      : "";
    return maskedEmail ? `${name} (${maskedEmail})` : name;
  };

  // 전체보기용 사용자 정보 표시 함수 (이름 완전 표시, 이메일만 마스킹)
  const getFullUserInfo = (name: string, email: string) => {
    if (!name) {
      return email ? `${email.split("@")[0].substring(0, 3)}***` : "익명";
    }
    const maskedEmail = email
      ? `${email.split("@")[0].substring(0, 3)}***`
      : "";
    return maskedEmail ? `${name} (${maskedEmail})` : name;
  };

  // 간접 추천 리워드 체인 표시 함수
  const getReferralChain = (reward: RewardTransaction) => {
    if (!reward.level || reward.level === 1) {
      // 직접 추천인 경우: 일반회원만 표시
      if (reward.referralChain && reward.referralChain.length > 0) {
        // 체인의 첫 번째(일반회원)만 표시
        const customer = reward.referralChain[0];
        return maskUserName(customer.name, customer.email);
      }

      // fallback: referredUser 사용
      return reward.referredUser
        ? maskUserName(reward.referredUser.name, reward.referredUser.email)
        : "직접 추천";
    }

    // 간접 추천인 경우: 전체 추천 체인 표시 (예: test9 → test8 → test5)
    if (reward.referralChain && reward.referralChain.length > 1) {
      return reward.referralChain
        .map((user) => maskUserName(user.name, user.email))
        .join(" → ");
    }

    // 체인이 1개만 있는 경우 (일반회원만)
    if (reward.referralChain && reward.referralChain.length === 1) {
      const customer = reward.referralChain[0];
      return maskUserName(customer.name, customer.email);
    }

    // fallback: referredUser만 표시
    if (reward.referredUser) {
      return maskUserName(reward.referredUser.name, reward.referredUser.email);
    }

    return `${reward.level}단계 간접 추천`;
  };

  // 전체보기용 간접 추천 리워드 체인 표시 함수
  const getFullReferralChain = (reward: RewardTransaction) => {
    if (!reward.level || reward.level === 1) {
      // 직접 추천인 경우: 일반회원만 표시
      if (reward.referralChain && reward.referralChain.length > 0) {
        const customer = reward.referralChain[0];
        return getFullUserInfo(customer.name, customer.email);
      }

      return reward.referredUser
        ? getFullUserInfo(reward.referredUser.name, reward.referredUser.email)
        : "직접 추천";
    }

    // 간접 추천인 경우: 전체 추천 체인 표시 (예: test9 → test8 → test5)
    if (reward.referralChain && reward.referralChain.length > 1) {
      return reward.referralChain
        .map((user) => getFullUserInfo(user.name, user.email))
        .join(" → ");
    }

    // 체인이 1개만 있는 경우 (일반회원만)
    if (reward.referralChain && reward.referralChain.length === 1) {
      const customer = reward.referralChain[0];
      return getFullUserInfo(customer.name, customer.email);
    }

    // fallback
    if (reward.referredUser) {
      return getFullUserInfo(
        reward.referredUser.name,
        reward.referredUser.email
      );
    }

    return `${reward.level}단계 간접 추천`;
  };

  // 리워드 타입 한글 변환
  const getRewardTypeText = (description: string, level?: number) => {
    if (description.includes("추천")) {
      return level === 1 ? "직접 추천 리워드" : `${level}차 추천 리워드`;
    }
    return description;
  };

  if (loading) {
    return (
      <SalespersonGuard>
        <div className="salesperson-page">
          <div className="page-container">
            <div className="page-header">
              <h1>리워드 관리</h1>
              <p>데이터를 불러오는 중...</p>
            </div>
          </div>
        </div>
      </SalespersonGuard>
    );
  }

  if (showFullView) {
    // 전체보기 화면
    return (
      <SalespersonGuard>
        <div className="salesperson-page">
          <div className="page-container">
            <div className="page-header">
              <button onClick={handleCloseFullView} className="back-button">
                ← 뒤로가기
              </button>
              <h1>전체 내역</h1>
            </div>

            {/* 검색 필터 */}
            <div className="search-filter-section">
              <div className="search-row-single">
                <div className="filter-group">
                  <label>기간 선택</label>
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="filter-select"
                  >
                    <option value="전체">전체</option>
                    <option value="이번달">이번달</option>
                    <option value="지난달">지난달</option>
                    <option value="최근3개월">최근 3개월</option>
                  </select>
                </div>
                <div className="search-group-inline">
                  <label>내용 검색</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="패키지명/템플릿명으로 검색..."
                    className="search-input"
                  />
                </div>
                <button onClick={handleSearch} className="search-button-inline">
                  초기화
                </button>
              </div>
            </div>

            {/* 전체 내역 리스트 */}
            <div className="full-view-content">
              {fullViewLoading ? (
                <div className="loading-state">데이터를 불러오는 중...</div>
              ) : (
                <>
                  {activeTab === "settlement" ? (
                    // 정산 내역 표시
                    <>
                      {settlements.map((settlement) => (
                        <div key={settlement.id} className="transaction-item">
                          <div className="transaction-type-badge">
                            정산 내역
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-title">
                              {settlement.period} 정산
                            </div>
                            <div className="transaction-date">
                              {settlement.status === "completed"
                                ? `${settlement.settlementDate} 지급`
                                : settlement.status === "pending"
                                ? `${settlement.settlementDate} 예정`
                                : "재처리 필요"}
                            </div>
                          </div>
                          <div className="transaction-amount positive">
                            {formatAmount(settlement.totalReward)}
                          </div>
                        </div>
                      ))}

                      {settlements.length === 0 && (
                        <div className="empty-state">
                          <p>정산 내역이 없습니다.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    // 리워드 내역 표시
                    <>
                      {fullViewData.map((reward) => (
                        <div key={reward.id} className="transaction-item">
                          <div className="transaction-type-badge">
                            {getRewardTypeText(
                              reward.description,
                              reward.level
                            )}
                          </div>
                          <div className="transaction-details">
                            <div className="transaction-title">
                              {reward.level && reward.level > 1
                                ? getFullReferralChain(reward)
                                : reward.referredUser
                                ? getFullUserInfo(
                                    reward.referredUser.name,
                                    reward.referredUser.email
                                  )
                                : getRewardTypeText(
                                    reward.description,
                                    reward.level
                                  )}
                            </div>
                            <div className="transaction-date">
                              {formatDate(reward.created_at)}
                            </div>
                          </div>
                          <div className="transaction-amount positive">
                            +{formatAmount(reward.amount)}
                          </div>
                        </div>
                      ))}

                      {fullViewData.length === 0 && (
                        <div className="empty-state">
                          <p>해당 조건의 리워드 내역이 없습니다.</p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* 페이지네이션 */}
              {totalPages > 1 && activeTab !== "settlement" && (
                <div className="pagination">
                  <span className="pagination-info">
                    총 {fullViewData.length}개의 전체 내역
                  </span>
                  <div className="pagination-controls">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="pagination-button"
                    >
                      이전
                    </button>
                    <span className="pagination-current">{currentPage}</span>
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

              {/* 정산 내역용 정보 */}
              {activeTab === "settlement" && settlements.length > 0 && (
                <div className="pagination">
                  <span className="pagination-info">
                    총 {settlements.length}개의 정산 내역
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </SalespersonGuard>
    );
  }

  // 기본 화면 (상위 10개만 표시)
  return (
    <SalespersonGuard>
      <div className="salesperson-page">
        <div className="page-container">
          <div className="page-header">
            <h1>리워드 관리</h1>
            <p>리워드 내역을 확인하고 관리하세요.</p>
          </div>

          <div className="referrals-content">
            {/* 리워드 요약 */}
            <div className="reward-summary">
              <div className="summary-card">
                <h3>이번 달 총 리워드</h3>
                <p className="reward-amount">
                  {formatAmount(rewardStats?.monthlyReward || 0)}
                </p>
              </div>
              <div className="summary-card">
                <h3>직접 추천 리워드</h3>
                <p className="reward-amount">
                  {formatAmount(rewardStats?.directReward || 0)}
                </p>
              </div>
              <div className="summary-card">
                <h3>간접 추천 리워드</h3>
                <p className="reward-amount">
                  {formatAmount(rewardStats?.indirectReward || 0)}
                </p>
              </div>
              <div className="summary-card">
                <h3>미지급 리워드</h3>
                <p className="reward-amount">
                  {formatAmount(rewardStats?.pendingReward || 0)}
                </p>
              </div>
            </div>

            {/* 탭 메뉴 */}
            <div className="tab-menu">
              <button
                className={`tab-btn ${activeTab === "direct" ? "active" : ""}`}
                onClick={() => setActiveTab("direct")}
              >
                직접 추천 리워드
              </button>
              <button
                className={`tab-btn ${
                  activeTab === "indirect" ? "active" : ""
                }`}
                onClick={() => setActiveTab("indirect")}
              >
                간접 추천 리워드
              </button>
              <button
                className={`tab-btn ${
                  activeTab === "settlement" ? "active" : ""
                }`}
                onClick={() => setActiveTab("settlement")}
              >
                정산 내역
              </button>
            </div>

            {/* 탭 콘텐츠 */}
            <div className="tab-content">
              {activeTab === "direct" && (
                <div className="reward-list">
                  {directRewards.length === 0 ? (
                    <div className="empty-state">
                      <p>직접 추천 리워드 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <>
                      {directRewards.map((reward) => (
                        <div key={reward.id} className="reward-item">
                          <div className="reward-info">
                            <div className="referral-user">
                              {getReferralChain(reward)}
                            </div>
                            <div className="reward-type">
                              {getRewardTypeText(
                                reward.description,
                                reward.level
                              )}
                            </div>
                            <div className="reward-date">
                              {formatDate(reward.created_at)}
                            </div>
                          </div>
                          <div className="reward-amount">
                            +{formatAmount(reward.amount)}
                          </div>
                        </div>
                      ))}
                      {directRewards.length >= 10 && (
                        <button
                          onClick={handleShowFullView}
                          className="full-view-button"
                        >
                          전체보기
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "indirect" && (
                <div className="reward-list">
                  {indirectRewards.length === 0 ? (
                    <div className="empty-state">
                      <p>간접 추천 리워드 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <>
                      {indirectRewards.map((reward) => (
                        <div key={reward.id} className="reward-item">
                          <div className="reward-info">
                            <div className="referral-user">
                              {getReferralChain(reward)}
                            </div>
                            <div className="reward-type">
                              {getRewardTypeText(
                                reward.description,
                                reward.level
                              )}
                            </div>
                            <div className="reward-date">
                              {formatDate(reward.created_at)}
                            </div>
                          </div>
                          <div className="reward-amount">
                            +{formatAmount(reward.amount)}
                          </div>
                        </div>
                      ))}
                      {indirectRewards.length >= 10 && (
                        <button
                          onClick={handleShowFullView}
                          className="full-view-button"
                        >
                          전체보기
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === "settlement" && (
                <div className="settlement-list">
                  {settlements.length === 0 ? (
                    <div className="empty-state">
                      <p>정산 내역이 없습니다.</p>
                    </div>
                  ) : (
                    <>
                      {settlements.map((settlement) => (
                        <div key={settlement.id} className="settlement-item">
                          <div className="settlement-info">
                            <div className="settlement-period">
                              {settlement.period}
                            </div>
                            <div
                              className={`settlement-status ${settlement.status}`}
                            >
                              {settlement.status === "completed"
                                ? "정산 완료"
                                : settlement.status === "pending"
                                ? "정산 대기"
                                : "정산 실패"}
                            </div>
                            <div className="settlement-date">
                              {settlement.status === "completed"
                                ? `${settlement.settlementDate} 지급`
                                : settlement.status === "pending"
                                ? `${settlement.settlementDate} 예정`
                                : "재처리 필요"}
                            </div>
                          </div>
                          <div className="settlement-amount">
                            {formatAmount(settlement.totalReward)}
                          </div>
                        </div>
                      ))}
                      {settlements.length >= 10 && (
                        <button
                          onClick={handleShowFullView}
                          className="full-view-button"
                        >
                          전체보기
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SalespersonGuard>
  );
}
