import React from "react";

// TODO: API 연동 필요
const usageHistory = [
  {
    id: 1,
    type: "크레딧 충전",
    description: "+200 보너스",
    date: "2025-06-24",
    amount: 3000,
  },
  {
    id: 2,
    type: "SMS 발송",
    description: "(템플릿: 50% 쿠폰 행사)",
    date: "2025-06-23",
    amount: -150,
  },
  {
    id: 3,
    type: "SMS 발송",
    description: "(템플릿: 신상품 안내)",
    date: "2025-06-22",
    amount: -200,
  },
  {
    id: 4,
    type: "크레딧 충전",
    description: "",
    date: "2025-06-20",
    amount: 1000,
  },
];

export function CreditHistory() {
  return (
    <section className="cm-history-section">
      <div className="cm-history-header">
        <h2>크레딧 사용 내역</h2>
        <button className="cm-history-view-all">전체 보기</button>
      </div>
      <ul className="cm-history-list">
        {usageHistory.slice(0, 4).map((item) => (
          <li key={item.id} className="cm-history-item">
            <div className="cm-history-info">
              <div className="cm-history-main">
                <span className="cm-history-type">{item.type}</span>
                {item.description && (
                  <span
                    className={`cm-history-desc ${
                      item.description.startsWith("+") ? "bonus" : "template"
                    }`}
                  >
                    {item.description}
                  </span>
                )}
              </div>
              <span className="cm-history-date">{item.date}</span>
            </div>
            <div
              className={`cm-history-amount ${
                item.amount > 0 ? "positive" : "negative"
              }`}
            >
              {item.amount > 0 ? "+" : ""}
              {item.amount.toLocaleString()} 크레딧
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
