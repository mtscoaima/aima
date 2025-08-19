"use client";

export default function CampaignStatistics() {
  return (
    <div className="tab-content">
      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">총 캠페인 수</div>
          <div className="stat-change">구현 예정</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">진행 중인 캠페인</div>
          <div className="stat-change stat-increase">구현 예정</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">완료된 캠페인</div>
          <div className="stat-change">구현 예정</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">-</div>
          <div className="stat-label">총 메시지 발송</div>
          <div className="stat-change stat-increase">구현 예정</div>
        </div>
      </div>

      {/* 캠페인 성과 차트 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>캠페인 성과 추이</h3>
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
          캠페인 성과 차트 (구현 예정)
        </div>
      </div>

      {/* 메시지 발송 통계 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>메시지 발송 통계</h3>
        </div>
        <div className="chart-placeholder">
          메시지 발송량 차트 (구현 예정)
        </div>
      </div>

      {/* 캠페인 유형별 통계 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>캠페인 유형별 성과</h3>
        </div>
        <div className="chart-placeholder">
          캠페인 유형별 분석 차트 (구현 예정)
        </div>
      </div>

      {/* 성공률 분석 */}
      <div className="chart-container">
        <div className="chart-header">
          <h3>캠페인 성공률 분석</h3>
        </div>
        <div className="chart-placeholder">
          성공률 분석 차트 (구현 예정)
        </div>
      </div>
    </div>
  );
}
