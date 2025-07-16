"use client";

import React, { useState } from "react";
import "./styles.css";

interface Announcement {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isImportant: boolean;
}

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState<
    "faq" | "announcement" | "contact"
  >("faq");

  // 공지사항 더미 데이터
  const announcements: Announcement[] = [
    {
      id: 1,
      title: "시스템 정기 점검 안내",
      content:
        "2024년 1월 30일 오전 2시부터 6시까지 시스템 정기 점검을 진행합니다. 해당 시간 동안 서비스 이용이 제한될 수 있습니다.",
      createdAt: "2024-01-25",
      isImportant: true,
    },
    {
      id: 2,
      title: "MMS 발송 요금 인하 안내",
      content:
        "2024년 2월 1일부터 MMS 발송 요금이 기존 대비 10% 인하됩니다. 더 저렴한 가격으로 서비스를 이용해보세요.",
      createdAt: "2024-01-20",
      isImportant: false,
    },
    {
      id: 3,
      title: "새로운 템플릿 기능 출시",
      content:
        "AI 기반 메시지 템플릿 생성 기능이 추가되었습니다. '메시지 작성' 페이지에서 새로운 기능을 확인해보세요.",
      createdAt: "2024-01-15",
      isImportant: false,
    },
    {
      id: 4,
      title: "고객센터 운영시간 변경 안내",
      content:
        "2024년 1월부터 고객센터 운영시간이 평일 오전 9시 - 오후 7시로 변경됩니다.",
      createdAt: "2024-01-10",
      isImportant: false,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "faq":
        return (
          <div className="support-section">
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
                  네, 통신사 사정이나 번호 오류 등으로 발송에 실패한 건에
                  대해서는 비용이 자동으로 환불 처리됩니다.
                </p>
              </div>
              <div className="faq-item">
                <h3>크레딧은 언제 충전하면 되나요?</h3>
                <p>
                  잔여 크레딧이 부족할 때 언제든지 충전 가능합니다. 자동 충전
                  기능을 설정하시면 잔액이 일정 수준 이하로 떨어질 때 자동으로
                  충전됩니다.
                </p>
              </div>
              <div className="faq-item">
                <h3>메시지 발송 제한이 있나요?</h3>
                <p>
                  스팸 방지를 위해 시간당 발송량에 제한이 있습니다. 대량 발송이
                  필요한 경우 고객센터로 별도 문의 부탁드립니다.
                </p>
              </div>
            </div>
          </div>
        );
      case "announcement":
        return (
          <div className="support-section">
            <h2>공지사항</h2>
            <div className="announcement-list">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="announcement-item">
                  <div className="announcement-header">
                    <div className="announcement-title-row">
                      <h3 className="announcement-title">
                        {announcement.isImportant && (
                          <span className="announcement-important-badge">
                            중요
                          </span>
                        )}
                        {announcement.title}
                      </h3>
                      <span className="announcement-date">
                        {announcement.createdAt}
                      </span>
                    </div>
                  </div>
                  <div className="announcement-content">
                    <p>{announcement.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case "contact":
        return (
          <div className="support-section">
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
                  <strong>운영 시간:</strong> 평일 오전 9시 - 오후 7시
                </li>
                <li>
                  <strong>점심 시간:</strong> 오후 12시 - 오후 1시 (상담 불가)
                </li>
              </ul>
              <div className="contact-tips">
                <h4>빠른 문의를 위한 팁</h4>
                <ul>
                  <li>이메일 문의 시 계정 정보(이메일)를 함께 기재해 주세요</li>
                  <li>
                    오류 발생 시 스크린샷을 첨부해 주시면 더 빠른 해결이
                    가능합니다
                  </li>
                  <li>
                    전화 문의는 평일 오전 10시 - 오후 5시 사이가 가장 연결이
                    원활합니다
                  </li>
                </ul>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="support-container">
      <div className="cm-container">
        <header className="cm-header">
          <h1>고객센터</h1>
          <p>무엇을 도와드릴까요? 자주 묻는 질문과 공지사항을 확인하세요.</p>
        </header>

        <div className="cm-tabs">
          <button
            className={`cm-tab-btn ${activeTab === "faq" ? "active" : ""}`}
            onClick={() => setActiveTab("faq")}
          >
            자주 묻는 질문
          </button>
          <button
            className={`cm-tab-btn ${
              activeTab === "announcement" ? "active" : ""
            }`}
            onClick={() => setActiveTab("announcement")}
          >
            공지사항
          </button>
          <button
            className={`cm-tab-btn ${activeTab === "contact" ? "active" : ""}`}
            onClick={() => setActiveTab("contact")}
          >
            문의하기
          </button>
        </div>

        <div className="cm-content">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default SupportPage;
