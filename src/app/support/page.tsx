"use client";

import React from "react";
import "./styles.css";

const SupportPage = () => {
  return (
    <div className="support-container">
      <header className="support-header">
        <h1>고객센터</h1>
        <p>무엇을 도와드릴까요?</p>
      </header>

      <main className="support-main">
        <section className="support-section">
          <h2>자주 묻는 질문 (FAQ)</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>MMS 발송은 어떻게 하나요?</h3>
              <p>
                &quot;문자&quot; 메뉴에서 &quot;MMS&quot; 탭을 선택하고,
                수신자를 추가한 후 메시지와 이미지를 첨부하여 발송할 수
                있습니다.
              </p>
            </div>
            <div className="faq-item">
              <h3>광고성 문자 발송 시 주의사항은 무엇인가요?</h3>
              <p>
                정보통신망법에 따라 광고성 문자 발송 시에는 (광고) 문구를
                표시하고, 수신 거부 방법을 안내해야 합니다.
              </p>
            </div>
            <div className="faq-item">
              <h3>발송 비용은 어떻게 결제되나요?</h3>
              <p>
                &quot;요금제&quot; 메뉴에서 원하시는 플랜을 선택하여 결제할 수
                있습니다. 충전형 또는 월정액 요금제를 제공합니다.
              </p>
            </div>
            <div className="faq-item">
              <h3>발송 실패 시 비용은 환불되나요?</h3>
              <p>
                네, 통신사 사정이나 번호 오류 등으로 발송에 실패한 건에 대해서는
                비용이 자동으로 환불 처리됩니다.
              </p>
            </div>
          </div>
        </section>

        <section className="support-section">
          <h2>문의하기</h2>
          <div className="contact-info">
            <p>더 궁금한 점이 있으신가요? 아래 연락처로 문의해주세요.</p>
            <ul>
              <li>
                <strong>이메일:</strong> support@aimarketing.com
              </li>
              <li>
                <strong>전화:</strong> 1588-XXXX
              </li>
              <li>
                <strong>운영 시간:</strong> 평일 오전 9시 - 오후 6시
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SupportPage;
