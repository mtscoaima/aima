"use client";

export default function MemberSignupStatistics() {
  return (
    <div className="statistics-content">
      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">총 회원가입 수</div>
          <div className="stat-change stat-increase">구현 예정</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">이번 달 가입</div>
          <div className="stat-change stat-increase">구현 예정</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">어제 가입</div>
          <div className="stat-change">구현 예정</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">오늘 가입</div>
          <div className="stat-change">구현 예정</div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>회원가입 추이</h3>
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
          회원가입 통계 차트 (구현 예정)
        </div>
      </div>

      {/* 회원 유형별 가입 통계 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>회원 유형별 가입 현황</h3>
        </div>
        <div className="chart-placeholder">
          회원 유형별 통계 차트 (구현 예정)
        </div>
      </div>
    </div>
  );
}
