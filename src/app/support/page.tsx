"use client";

import React, { useState, useEffect } from "react";
import AnnouncementModal from "../../components/AnnouncementModal";
import Pagination from "../../components/Pagination";
import "./styles.css";

interface Announcement {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  isImportant: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const SupportPage = () => {
  const [activeTab, setActiveTab] = useState<
    "faq" | "announcement" | "contact"
  >("faq");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 공지사항 데이터 가져오기
  const fetchAnnouncements = async (page: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/announcements?page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }
      const data = await response.json();
      setAnnouncements(data.announcements || []);
      setPagination(data.pagination);
    } catch (err) {
      setError("공지사항을 불러오는데 실패했습니다.");
      console.error("Error fetching announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchAnnouncements(page);
  };

  const handleAnnouncementClick = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAnnouncement(null);
  };

  useEffect(() => {
    if (activeTab === "announcement") {
      fetchAnnouncements(currentPage);
    }
  }, [activeTab]);

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
              {loading ? (
                <div className="loading-message">공지사항을 불러오는 중...</div>
              ) : error ? (
                <div className="error-message">
                  {error}
                  <button
                    onClick={() => fetchAnnouncements(currentPage)}
                    className="retry-button"
                  >
                    다시 시도
                  </button>
                </div>
              ) : announcements.length === 0 ? (
                <div className="no-announcements">
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                <>
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="announcement-item clickable"
                      onClick={() => handleAnnouncementClick(announcement)}
                    >
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
                    </div>
                  ))}

                  {pagination && (
                    <Pagination
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      totalItems={pagination.totalItems}
                      onPageChange={handlePageChange}
                      className="announcement-pagination"
                    />
                  )}
                </>
              )}
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

      <AnnouncementModal
        announcement={selectedAnnouncement}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default SupportPage;
