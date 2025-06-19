"use client";

import React from "react";
import Link from "next/link";

export default function SalespersonDashboard() {
  return (
    <div className="salesperson-dashboard">
      <div className="dashboard-container">
        {/* 상단 통계 카드들 */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>총 추천인 수</h3>
              <p className="stat-number">1,234명</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-content">
              <h3>이번 달 리워드</h3>
              <p className="stat-number">₩5,678,900</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>누적 리워드</h3>
              <p className="stat-number">₩123,456,789</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h3>조직 규모</h3>
              <p className="stat-number">56명</p>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="dashboard-main">
          {/* 왼쪽 - 최근 활동 내역 */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>최근 활동 내역</h3>
              <p>최근 7일간의 주요 활동입니다.</p>
            </div>

            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-indicator green"></div>
                <div className="activity-content">
                  <p>
                    <strong>새로운 사용자 (user***) 추천 가입</strong>
                  </p>
                  <span className="activity-time">10분 전</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-indicator blue"></div>
                <div className="activity-content">
                  <p>
                    <strong>추천인 (user***) 결제로 ₩15,000 리워드 발생</strong>
                  </p>
                  <span className="activity-time">1시간 전</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-indicator blue"></div>
                <div className="activity-content">
                  <p>
                    <strong>새로운 사용자 (client***) 추천 가입</strong>
                  </p>
                  <span className="activity-time">3시간 전</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-indicator green"></div>
                <div className="activity-content">
                  <p>
                    <strong>
                      추천인 (client***) 결제로 ₩25,000 리워드 발생
                    </strong>
                  </p>
                  <span className="activity-time">5시간 전</span>
                </div>
              </div>

              <div className="activity-item">
                <div className="activity-indicator purple"></div>
                <div className="activity-content">
                  <p>
                    <strong>새로운 협력 (partner***) 합류</strong>
                  </p>
                  <span className="activity-time">1일 전</span>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 - 빠른 실행 */}
          <div className="dashboard-section">
            <div className="section-header">
              <h3>빠른 실행</h3>
            </div>

            <div className="quick-actions">
              <Link href="/salesperson/invite" className="quick-action-btn">
                <div className="action-icon">🔗</div>
                <span>새 초대 링크 생성</span>
              </Link>

              <Link href="/salesperson/referrals" className="quick-action-btn">
                <div className="action-icon">📊</div>
                <span>리워드 내역 보기</span>
              </Link>

              <Link
                href="/salesperson/organization"
                className="quick-action-btn"
              >
                <div className="action-icon">🏢</div>
                <span>조직도 보기</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 하단 차트 영역 */}
        <div className="dashboard-charts">
          <div className="dashboard-chart">
            <div className="section-header">
              <h3>월별 리워드 추이</h3>
              <p>최근 6개월간의 리워드 발생 추이입니다.</p>
            </div>
            <div className="chart-placeholder">
              <p>리워드 추이 차트 영역</p>
            </div>
          </div>

          <div className="dashboard-chart">
            <div className="section-header">
              <h3>추천인 증가 추이</h3>
              <p>최근 추천인 수 변화를 확인하세요.</p>
            </div>
            <div className="chart-placeholder">
              <p>추천인 증가 차트 영역</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
