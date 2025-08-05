"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "faq" | "announcement" | "contact"
  >("announcement");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [faqError, setFaqError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const [expandedAnnouncement, setExpandedAnnouncement] = useState<
    number | null
  >(null);
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqPagination, setFaqPagination] = useState<PaginationInfo | null>(
    null
  );
  const [faqCurrentPage, setFaqCurrentPage] = useState(1);

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
  const fetchFaqs = async (
    page: number = 1,
    search: string = "",
    category: string = "전체"
  ) => {
    setFaqLoading(true);
    setFaqError(null);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");
      if (search) params.append("search", search);
      if (category && category !== "전체") params.append("category", category);

      const response = await fetch(`/api/faqs?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch FAQs");
      }
      const data = await response.json();

      if (data.faqs && data.pagination) {
        setFaqs(data.faqs);
        setFaqPagination(data.pagination);
      } else {
        // 기존 형식 (페이지네이션 없는 경우)
        setFaqs(data);
        setFaqPagination(null);
      }
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
    if (expandedAnnouncement === announcement.id) {
      setExpandedAnnouncement(null);
    } else {
      setExpandedAnnouncement(announcement.id);
    }
  };

  const handleFaqClick = (faq: FAQ) => {
    if (expandedFaq === faq.id) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(faq.id);
    }
  };

  const handleFaqPageChange = (page: number) => {
    setFaqCurrentPage(page);
    fetchFaqs(page, faqSearchQuery, selectedCategory);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFaqSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFaqCurrentPage(1);
    fetchFaqs(1, faqSearchQuery, selectedCategory);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setFaqCurrentPage(1);
    fetchFaqs(1, faqSearchQuery, category);
  };

  // URL 파라미터 기반 탭 설정
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["faq", "announcement", "contact"].includes(tabParam)) {
      setActiveTab(tabParam as "faq" | "announcement" | "contact");
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "announcement") {
      fetchAnnouncements(currentPage);
    } else if (activeTab === "faq") {
      fetchFaqs(faqCurrentPage, faqSearchQuery, selectedCategory);
    }
  }, [activeTab, currentPage, faqCurrentPage]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "announcement":
        return (
          <div className="support-section">
            <div className="announcement-table-container">
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
                <div className="announcement-table">
                  <div className="announcement-table-header">
                    <div className="announcement-table-cell header-cell">
                      번호
                    </div>
                    <div className="announcement-table-cell header-cell">
                      제목
                    </div>
                    <div className="announcement-table-cell header-cell">
                      작성일
                    </div>
                  </div>
                  <div className="announcement-table-body">
                    {announcements.map((announcement, index) => (
                      <div
                        key={announcement.id}
                        className="announcement-table-row-container"
                      >
                        <div
                          className="announcement-table-row clickable"
                          onClick={() => handleAnnouncementClick(announcement)}
                        >
                          <div className="announcement-table-cell">
                            {(pagination?.totalItems || announcements.length) -
                              ((pagination?.currentPage || 1) - 1) *
                                (pagination?.limit || 10) -
                              index}
                          </div>
                          <div className="announcement-table-cell title-cell">
                            {announcement.isImportant && (
                              <span className="announcement-important-badge">
                                중요
                              </span>
                            )}
                            {announcement.title}
                            {expandedAnnouncement === announcement.id && (
                              <span className="expand-indicator">▲</span>
                            )}
                            {expandedAnnouncement !== announcement.id && (
                              <span className="expand-indicator">▼</span>
                            )}
                          </div>
                          <div className="announcement-table-cell">
                            {announcement.createdAt}
                          </div>
                        </div>
                        {expandedAnnouncement === announcement.id && (
                          <div className="announcement-expanded-content">
                            <div className="empty-cell"></div>
                            <div className="announcement-content-text">
                              {announcement.content
                                .split("\n")
                                .map((line, idx) => (
                                  <p key={idx}>{line}</p>
                                ))}
                            </div>
                            <div className="empty-cell"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 페이지네이션은 항상 표시 */}
              <Pagination
                currentPage={pagination?.currentPage || 1}
                totalPages={pagination?.totalPages || 2}
                totalItems={pagination?.totalItems || 15}
                onPageChange={handlePageChange}
                className="announcement-pagination"
              />
            </div>
          </div>
        );
      case "faq":
        return (
          <div className="support-section">
            {/* 검색창 */}
            <div className="faq-search-container">
              <form onSubmit={handleSearchSubmit} className="faq-search-form">
                <input
                  type="text"
                  placeholder="궁금한 사항을 입력해주세요"
                  value={faqSearchQuery}
                  onChange={handleSearchChange}
                  className="faq-search-input"
                />
                <button type="submit" className="faq-search-button">
                  <span className="search-icon">🔍</span>
                </button>
              </form>
            </div>

            {/* 카테고리 분류 버튼 */}
            <div className="faq-category-container">
              {[
                "전체",
                "AI타깃마케팅",
                "요금제",
                "충전",
                "로그인",
                "회원정보",
                "문자",
                "발송결과",
                "기타",
              ].map((category) => (
                <button
                  key={category}
                  className={`faq-category-button ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => handleCategoryChange(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* FAQ 목록 - 테이블 형식 */}
            <div className="faq-table-container">
              {faqLoading ? (
                <div className="loading-message">FAQ를 불러오는 중...</div>
              ) : faqError ? (
                <div className="error-message">
                  {faqError}
                  <button
                    onClick={() =>
                      fetchFaqs(
                        faqCurrentPage,
                        faqSearchQuery,
                        selectedCategory
                      )
                    }
                    className="retry-button"
                  >
                    다시 시도
                  </button>
                </div>
              ) : faqs.length === 0 ? (
                <div className="no-announcements">등록된 FAQ가 없습니다.</div>
              ) : (
                <div className="faq-table">
                  <div className="faq-table-body">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="faq-table-row-container">
                        <div
                          className="faq-table-row clickable"
                          onClick={() => handleFaqClick(faq)}
                        >
                          <div className="faq-table-cell faq-q-cell">
                            <span className="faq-q-mark">Q.</span>
                          </div>
                          <div className="faq-table-cell faq-question-cell">
                            {faq.question}
                            <span className="faq-expand-indicator">
                              {expandedFaq === faq.id ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>
                        {expandedFaq === faq.id && (
                          <div className="faq-expanded-content">
                            <div className="faq-a-cell">
                              <span className="faq-a-mark">A.</span>
                            </div>
                            <div className="faq-answer-text">
                              {faq.answer.split("\n").map((line, idx) => (
                                <p key={idx}>{line}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQ 페이지네이션은 항상 표시 */}
              <Pagination
                currentPage={faqPagination?.currentPage || 1}
                totalPages={faqPagination?.totalPages || 1}
                totalItems={faqPagination?.totalItems || 10}
                onPageChange={handleFaqPageChange}
                className="faq-pagination"
              />
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
        </header>

        <div className="cm-tabs">
          <button
            className={`cm-tab-btn ${
              activeTab === "announcement" ? "active" : ""
            }`}
            onClick={() => setActiveTab("announcement")}
          >
            공지사항
          </button>
          <button
            className={`cm-tab-btn ${activeTab === "faq" ? "active" : ""}`}
            onClick={() => setActiveTab("faq")}
          >
            자주 묻는 질문
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
