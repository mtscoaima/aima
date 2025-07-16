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

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
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
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faqError, setFaqError] = useState<string | null>(null);
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

  // FAQ 데이터 가져오기
  const fetchFaqs = async () => {
    setFaqLoading(true);
    setFaqError(null);
    try {
      const response = await fetch("/api/faqs");
      if (!response.ok) {
        throw new Error("Failed to fetch FAQs");
      }
      const data = await response.json();
      setFaqs(data);
    } catch (err) {
      setFaqError("FAQ를 불러오는데 실패했습니다.");
      console.error("Error fetching FAQs:", err);
    } finally {
      setFaqLoading(false);
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
    } else if (activeTab === "faq") {
      fetchFaqs();
    }
  }, [activeTab, currentPage]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "faq":
        return (
          <div className="support-section">
            <h2>자주 묻는 질문 (FAQ)</h2>
            <div className="faq-grid">
              {faqLoading ? (
                <div className="loading-message">FAQ를 불러오는 중...</div>
              ) : faqError ? (
                <div className="error-message">
                  {faqError}
                  <button onClick={fetchFaqs} className="retry-button">
                    다시 시도
                  </button>
                </div>
              ) : faqs.length === 0 ? (
                <div className="no-announcements">등록된 FAQ가 없습니다.</div>
              ) : (
                faqs.map((faq) => (
                  <div key={faq.id} className="faq-item">
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </div>
                ))
              )}
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
