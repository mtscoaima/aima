import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="home-container">
      {/* 메인 메시지 섹션 */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>실시간 타겟팅으로<br/>마케팅 효과 극대화</h1>
          <p className="hero-subtitle">인공지능 기반 마케팅 솔루션으로 고객에게 딱 맞는 메시지를 전달하세요</p>
          <div className="cta-buttons">
            <Link href="/target-marketing/send/create-template" className="btn btn-primary">실시간 타겟 마케팅 시작하기</Link>
            <Link href="/target-marketing/send/create-template" className="btn btn-secondary">자세히 알아보기</Link>
          </div>
        </div>
        <div className="hero-image">
          {/* 이미지 추가 예정 */}
          <div className="placeholder-image"></div>
        </div>
      </section>

      {/* 서비스 소개 섹션 */}
      <section className="services-section">
        <h2>MTS플러스이 제공하는 서비스</h2>
        <div className="services-grid">
          <div className="service-card card">
            <div className="service-icon ai-icon"></div>
            <h3>AI 간편 마케팅</h3>
            <p>타겟 설정부터 메시지 작성까지 인공지능이 도와드립니다</p>
          </div>
          <div className="service-card card">
            <div className="service-icon targeting-icon"></div>
            <h3>정밀 타겟팅</h3>
            <p>고객 데이터를 분석하여 효과적인 타겟 그룹을 생성합니다</p>
          </div>
          <div className="service-card card">
            <div className="service-icon message-icon"></div>
            <h3>문자 메시지</h3>
            <p>SMS, MMS, 알림톡 등 다양한 메시지 발송 서비스를 제공합니다</p>
          </div>
          <div className="service-card card">
            <div className="service-icon analytics-icon"></div>
            <h3>마케팅 분석</h3>
            <p>캠페인 성과를 실시간으로 분석하고 보고서를 생성합니다</p>
          </div>
        </div>
      </section>

      {/* 혜택 소개 섹션 */}
      <section className="benefits-section">
        <h2>광고주 전용 혜택</h2>
        <div className="benefits-container">
          <div className="benefit-item">
            <h3><span className="accent-text">포인트 적립</span> 혜택</h3>
            <p>결제 금액의 최대 5%를 포인트로 적립해 드립니다</p>
          </div>
          <div className="benefit-item">
            <h3><span className="accent-text">초기 광고비</span> 지원</h3>
            <p>신규 가입 시 10만원 상당의 광고 크레딧을 제공합니다</p>
          </div>
        </div>
      </section>

      {/* 핵심기능 소개 섹션 */}
      <section className="features-section">
        <h2>핵심 기능</h2>
        <div className="features-grid">
          <div className="feature-card card">
            <h3>AI 기반 타겟팅 기술</h3>
            <p>고객의 행동 패턴과 선호도를 분석하여 최적의 타겟 그룹을 생성합니다</p>
          </div>
          <div className="feature-card card">
            <h3>캠페인 자동화</h3>
            <p>시간별, 이벤트별 자동화된 캠페인으로 효율적인 마케팅을 진행하세요</p>
          </div>
          <div className="feature-card card">
            <h3>템플릿 추천</h3>
            <p>AI가 목적에 맞는 최적의 메시지 템플릿을 추천해 드립니다</p>
          </div>
          <div className="feature-card card">
            <h3>실시간 분석</h3>
            <p>캠페인 성과를 실시간으로 확인하고 즉각적인 개선점을 파악하세요</p>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="cta-section">
        <h2>지금 바로 시작하세요</h2>
        <p>가입 후 5분 만에 첫 캠페인을 시작할 수 있습니다</p>
        <Link href="/target-marketing/send/create-template" className="btn btn-primary cta-button">실시간 타겟 마케팅 시작하기</Link>
      </section>
    </div>
  );
}
