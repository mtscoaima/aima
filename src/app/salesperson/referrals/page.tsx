"use client";

import React, { useState } from "react";
import { SalespersonGuard } from "@/components/RoleGuard";

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState("direct");

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
                <p className="reward-amount">₩5,678,900</p>
              </div>
              <div className="summary-card">
                <h3>직접 추천 리워드</h3>
                <p className="reward-amount">₩3,450,000</p>
              </div>
              <div className="summary-card">
                <h3>간접 추천 리워드</h3>
                <p className="reward-amount">₩2,228,900</p>
              </div>
              <div className="summary-card">
                <h3>미지급 리워드</h3>
                <p className="reward-amount">₩890,000</p>
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
                  <div className="reward-item">
                    <div className="reward-info">
                      <div className="referral-user">김○○ (user***)</div>
                      <div className="reward-type">신규 가입 리워드</div>
                      <div className="reward-date">2024-01-15 14:30</div>
                    </div>
                    <div className="reward-amount">+₩15,000</div>
                  </div>

                  <div className="reward-item">
                    <div className="reward-info">
                      <div className="referral-user">이○○ (client***)</div>
                      <div className="reward-type">첫 결제 리워드</div>
                      <div className="reward-date">2024-01-14 16:45</div>
                    </div>
                    <div className="reward-amount">+₩25,000</div>
                  </div>

                  <div className="reward-item">
                    <div className="reward-info">
                      <div className="referral-user">박○○ (partner***)</div>
                      <div className="reward-type">월 활동 리워드</div>
                      <div className="reward-date">2024-01-13 09:20</div>
                    </div>
                    <div className="reward-amount">+₩50,000</div>
                  </div>
                </div>
              )}

              {activeTab === "indirect" && (
                <div className="reward-list">
                  <div className="reward-item">
                    <div className="reward-info">
                      <div className="referral-user">김○○ → 최○○ (2단계)</div>
                      <div className="reward-type">간접 추천 리워드</div>
                      <div className="reward-date">2024-01-15 11:20</div>
                    </div>
                    <div className="reward-amount">+₩7,500</div>
                  </div>

                  <div className="reward-item">
                    <div className="reward-info">
                      <div className="referral-user">
                        이○○ → 정○○ → 한○○ (3단계)
                      </div>
                      <div className="reward-type">간접 추천 리워드</div>
                      <div className="reward-date">2024-01-14 15:30</div>
                    </div>
                    <div className="reward-amount">+₩5,000</div>
                  </div>

                  <div className="reward-item">
                    <div className="reward-info">
                      <div className="referral-user">박○○ → 조○○ (2단계)</div>
                      <div className="reward-type">간접 추천 리워드</div>
                      <div className="reward-date">2024-01-13 12:15</div>
                    </div>
                    <div className="reward-amount">+₩12,500</div>
                  </div>
                </div>
              )}

              {activeTab === "settlement" && (
                <div className="settlement-list">
                  <div className="settlement-item">
                    <div className="settlement-info">
                      <div className="settlement-period">2024년 1월</div>
                      <div className="settlement-status completed">
                        정산 완료
                      </div>
                      <div className="settlement-date">2024-02-05 지급</div>
                    </div>
                    <div className="settlement-amount">₩4,250,000</div>
                  </div>

                  <div className="settlement-item">
                    <div className="settlement-info">
                      <div className="settlement-period">2023년 12월</div>
                      <div className="settlement-status completed">
                        정산 완료
                      </div>
                      <div className="settlement-date">2024-01-05 지급</div>
                    </div>
                    <div className="settlement-amount">₩3,890,000</div>
                  </div>

                  <div className="settlement-item">
                    <div className="settlement-info">
                      <div className="settlement-period">2024년 2월</div>
                      <div className="settlement-status pending">정산 대기</div>
                      <div className="settlement-date">2024-03-05 예정</div>
                    </div>
                    <div className="settlement-amount">₩5,678,900</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SalespersonGuard>
  );
}
