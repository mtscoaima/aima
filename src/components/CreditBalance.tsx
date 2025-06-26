import React from "react";

export function CreditBalance() {
  return (
    <section className="cm-balance-section">
      <h3 className="cm-balance-title">현재 크레딧 잔액</h3>
      <div className="cm-balance-content">
        <div className="cm-balance-main">
          <span className="cm-balance-amount">1,250</span>
          <span className="cm-balance-unit">크레딧</span>
        </div>
        <div className="cm-balance-usage">
          <span className="cm-balance-usage-label">이번 달 사용량</span>
          <span className="cm-balance-usage-amount">350 크레딧</span>
        </div>
      </div>
    </section>
  );
}
