"use client";

import React from "react";
import { SalespersonGuard } from "@/components/RoleGuard";

export default function OrganizationPage() {
  return (
    <SalespersonGuard>
      <div className="salesperson-page">
        <div className="page-container">
          <div className="page-header">
            <h1>조직 관리</h1>
            <p>하위 조직원들의 활동 현황과 성과를 확인하세요.</p>
          </div>

          <div className="organization-content">
            {/* 조직 통계 */}
            <div className="org-stats">
              <div className="stat-item">
                <h3>직접 추천인</h3>
                <p className="stat-number">24명</p>
              </div>
              <div className="stat-item">
                <h3>간접 추천인</h3>
                <p className="stat-number">156명</p>
              </div>
              <div className="stat-item">
                <h3>총 조직원</h3>
                <p className="stat-number">180명</p>
              </div>
              <div className="stat-item">
                <h3>이번 달 신규</h3>
                <p className="stat-number">12명</p>
              </div>
            </div>

            {/* 조직도 */}
            <div className="organization-tree">
              <h3>조직도</h3>
              <div className="tree-container">
                <div className="tree-node root">
                  <div className="node-content">
                    <div className="node-name">나 (영업사원)</div>
                    <div className="node-stats">총 180명</div>
                  </div>

                  <div className="tree-children">
                    <div className="tree-node">
                      <div className="node-content">
                        <div className="node-name">김○○</div>
                        <div className="node-stats">하위 45명</div>
                      </div>
                      <div className="tree-children">
                        <div className="tree-node">
                          <div className="node-content">
                            <div className="node-name">이○○</div>
                            <div className="node-stats">하위 12명</div>
                          </div>
                        </div>
                        <div className="tree-node">
                          <div className="node-content">
                            <div className="node-name">박○○</div>
                            <div className="node-stats">하위 8명</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="tree-node">
                      <div className="node-content">
                        <div className="node-name">최○○</div>
                        <div className="node-stats">하위 32명</div>
                      </div>
                      <div className="tree-children">
                        <div className="tree-node">
                          <div className="node-content">
                            <div className="node-name">정○○</div>
                            <div className="node-stats">하위 15명</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="tree-node">
                      <div className="node-content">
                        <div className="node-name">한○○</div>
                        <div className="node-stats">하위 28명</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 조직원 목록 */}
            <div className="member-list">
              <h3>조직원 상세 현황</h3>

              <div className="member-table">
                <div className="table-header">
                  <div>이름</div>
                  <div>가입일</div>
                  <div>단계</div>
                  <div>하위 조직원</div>
                  <div>이번 달 활동</div>
                  <div>누적 리워드 기여</div>
                </div>

                <div className="table-row">
                  <div className="member-name">김○○ (user***)</div>
                  <div>2024-01-10</div>
                  <div className="level-badge direct">직접</div>
                  <div>45명</div>
                  <div className="activity-status active">활발</div>
                  <div className="reward-contribution">₩450,000</div>
                </div>

                <div className="table-row">
                  <div className="member-name">최○○ (client***)</div>
                  <div>2024-01-08</div>
                  <div className="level-badge direct">직접</div>
                  <div>32명</div>
                  <div className="activity-status active">활발</div>
                  <div className="reward-contribution">₩320,000</div>
                </div>

                <div className="table-row">
                  <div className="member-name">한○○ (partner***)</div>
                  <div>2024-01-05</div>
                  <div className="level-badge direct">직접</div>
                  <div>28명</div>
                  <div className="activity-status moderate">보통</div>
                  <div className="reward-contribution">₩280,000</div>
                </div>

                <div className="table-row">
                  <div className="member-name">이○○ (user***)</div>
                  <div>2024-01-12</div>
                  <div className="level-badge indirect">간접 (2단계)</div>
                  <div>12명</div>
                  <div className="activity-status active">활발</div>
                  <div className="reward-contribution">₩120,000</div>
                </div>

                <div className="table-row">
                  <div className="member-name">박○○ (client***)</div>
                  <div>2024-01-15</div>
                  <div className="level-badge indirect">간접 (2단계)</div>
                  <div>8명</div>
                  <div className="activity-status low">저조</div>
                  <div className="reward-contribution">₩80,000</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SalespersonGuard>
  );
}
