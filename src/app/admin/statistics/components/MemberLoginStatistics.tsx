"use client";

export default function MemberLoginStatistics() {
  return (
    <div className="statistics-content">
      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">총 로그인 수</div>
          <div className="stat-change stat-increase">구현 예정</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">이번 달 로그인</div>
          <div className="stat-change stat-increase">구현 예정</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">어제 로그인</div>
          <div className="stat-change">구현 예정</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">오늘 로그인</div>
          <div className="stat-change">구현 예정</div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>로그인 활동 추이</h3>
          <div className="chart-controls">
            <select className="date-range-select">
              <option value="7days">최근 7일</option>
              <option value="30days">최근 30일</option>
              <option value="3months">최근 3개월</option>
              <option value="1year">최근 1년</option>
            </select>
          </div>
        </div>
        <div className="chart-placeholder">
          로그인 통계 차트 (구현 예정)
        </div>
      </div>

      {/* 시간대별 로그인 통계 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>시간대별 로그인 현황</h3>
        </div>
        <div className="chart-placeholder">
          시간대별 로그인 패턴 차트 (구현 예정)
        </div>
      </div>

      {/* 활성 사용자 통계 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>활성 사용자 통계</h3>
        </div>
        <div className="chart-placeholder">
          일간/주간/월간 활성 사용자 차트 (구현 예정)
        </div>
      </div>
    </div>
  );
}
