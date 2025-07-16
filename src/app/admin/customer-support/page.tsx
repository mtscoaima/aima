"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import Pagination from "@/components/Pagination";
import "./styles.css";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Announcement {
  id: string;
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

type TabType = "faqs" | "announcements";

export default function CustomerSupportPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("faqs");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  // 페이지네이션 상태
  const [faqPagination, setFaqPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 15,
    hasNext: false,
    hasPrev: false,
  });

  const [announcementPagination, setAnnouncementPagination] =
    useState<PaginationInfo>({
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      limit: 15,
      hasNext: false,
      hasPrev: false,
    });

  // FAQ 폼 상태
  const [faqForm, setFaqForm] = useState({
    question: "",
    answer: "",
    category: "",
    displayOrder: 0,
    isActive: true,
  });

  // 공지사항 폼 상태
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    isImportant: false,
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const fetchFaqs = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/faqs?include_inactive=true&page=${page}&limit=${faqPagination.limit}`
        );
        if (response.ok) {
          const data = await response.json();

          setFaqs(data.faqs || []);

          if (data.pagination) {
            setFaqPagination({
              currentPage: data.pagination.currentPage,
              totalPages: data.pagination.totalPages,
              totalItems: data.pagination.totalItems,
              limit: data.pagination.limit,
              hasNext: data.pagination.hasNext,
              hasPrev: data.pagination.hasPrev,
            });
          }
        }
      } catch (error) {
        console.error("FAQ 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    },
    [faqPagination.limit]
  );

  const fetchAnnouncements = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/announcements?page=${page}&limit=${announcementPagination.limit}`
        );
        if (response.ok) {
          const data = await response.json();
          setAnnouncements(data.announcements || []);

          if (data.pagination) {
            setAnnouncementPagination({
              currentPage: data.pagination.currentPage,
              totalPages: data.pagination.totalPages,
              totalItems: data.pagination.totalItems,
              limit: data.pagination.limit,
              hasNext: data.pagination.hasNext,
              hasPrev: data.pagination.hasPrev,
            });
          }
        }
      } catch (error) {
        console.error("공지사항 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    },
    [announcementPagination.limit]
  );

  useEffect(() => {
    if (activeTab === "faqs") {
      fetchFaqs(faqPagination.currentPage);
    } else {
      fetchAnnouncements(announcementPagination.currentPage);
    }
  }, [
    activeTab,
    faqPagination.currentPage,
    announcementPagination.currentPage,
    fetchFaqs,
    fetchAnnouncements,
  ]);

  const handleFaqPageChange = (page: number) => {
    fetchFaqs(page);
  };

  const handleAnnouncementPageChange = (page: number) => {
    fetchAnnouncements(page);
  };

  const handleCreateFaq = async () => {
    try {
      const response = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faqForm),
      });

      if (response.ok) {
        await fetchFaqs(faqPagination.currentPage);
        setShowFaqModal(false);
        resetFaqForm();
      }
    } catch (error) {
      console.error("FAQ 생성 실패:", error);
    }
  };

  const handleUpdateFaq = async () => {
    if (!editingFaq) return;

    try {
      const response = await fetch(`/api/faqs/${editingFaq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(faqForm),
      });

      if (response.ok) {
        await fetchFaqs(faqPagination.currentPage);
        setShowFaqModal(false);
        setEditingFaq(null);
        resetFaqForm();
      }
    } catch (error) {
      console.error("FAQ 수정 실패:", error);
    }
  };

  const handleDeleteFaq = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/faqs/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchFaqs(faqPagination.currentPage);
      }
    } catch (error) {
      console.error("FAQ 삭제 실패:", error);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(announcementForm),
      });

      if (response.ok) {
        await fetchAnnouncements(announcementPagination.currentPage);
        setShowAnnouncementModal(false);
        resetAnnouncementForm();
      }
    } catch (error) {
      console.error("공지사항 생성 실패:", error);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingAnnouncement) return;

    try {
      const response = await fetch(
        `/api/announcements/${editingAnnouncement.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(announcementForm),
        }
      );

      if (response.ok) {
        await fetchAnnouncements(announcementPagination.currentPage);
        setShowAnnouncementModal(false);
        setEditingAnnouncement(null);
        resetAnnouncementForm();
      }
    } catch (error) {
      console.error("공지사항 수정 실패:", error);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchAnnouncements(announcementPagination.currentPage);
      }
    } catch (error) {
      console.error("공지사항 삭제 실패:", error);
    }
  };

  const openFaqModal = async (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqForm({
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        displayOrder: faq.displayOrder,
        isActive: faq.isActive,
      });
    } else {
      setEditingFaq(null);
      // 새 FAQ 추가 시 기본 순서값을 전체 FAQ의 최대값 + 1로 설정
      try {
        const response = await fetch("/api/faqs/max-order");
        if (response.ok) {
          const { maxOrder } = await response.json();
          setFaqForm({
            question: "",
            answer: "",
            category: "",
            displayOrder: maxOrder + 1,
            isActive: true,
          });
        } else {
          // API 실패 시 fallback으로 현재 페이지의 최대값 사용
          const maxOrder =
            faqs.length > 0 ? Math.max(...faqs.map((f) => f.displayOrder)) : 0;
          setFaqForm({
            question: "",
            answer: "",
            category: "",
            displayOrder: maxOrder + 1,
            isActive: true,
          });
        }
      } catch (error) {
        console.error("Error fetching max order:", error);
        // 에러 시 fallback으로 현재 페이지의 최대값 사용
        const maxOrder =
          faqs.length > 0 ? Math.max(...faqs.map((f) => f.displayOrder)) : 0;
        setFaqForm({
          question: "",
          answer: "",
          category: "",
          displayOrder: maxOrder + 1,
          isActive: true,
        });
      }
    }
    setShowFaqModal(true);
  };

  const openAnnouncementModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setAnnouncementForm({
        title: announcement.title,
        content: announcement.content,
        isImportant: announcement.isImportant,
      });
    } else {
      setEditingAnnouncement(null);
      resetAnnouncementForm();
    }
    setShowAnnouncementModal(true);
  };

  const resetFaqForm = () => {
    setFaqForm({
      question: "",
      answer: "",
      category: "",
      displayOrder: 0,
      isActive: true,
    });
  };

  const resetAnnouncementForm = () => {
    setAnnouncementForm({
      title: "",
      content: "",
      isImportant: false,
    });
  };

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-dashboard">
        <div className="customer-support-page">
          <div className="page-header">
            <h1>고객센터 관리</h1>
            <p>FAQ와 공지사항을 관리합니다</p>
          </div>

          {/* 탭 메뉴 */}
          <div className="tab-menu">
            <button
              className={`tab-button ${activeTab === "faqs" ? "active" : ""}`}
              onClick={() => setActiveTab("faqs")}
            >
              FAQ 관리
            </button>
            <button
              className={`tab-button ${
                activeTab === "announcements" ? "active" : ""
              }`}
              onClick={() => setActiveTab("announcements")}
            >
              공지사항 관리
            </button>
          </div>

          {/* FAQ 관리 탭 */}
          {activeTab === "faqs" && (
            <div className="tab-content">
              <div className="content-header">
                <h2>FAQ 관리</h2>
                <button className="add-button" onClick={() => openFaqModal()}>
                  + FAQ 추가
                </button>
              </div>

              {loading ? (
                <div className="loading">로딩 중...</div>
              ) : (
                <>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>질문</th>
                          <th>카테고리</th>
                          <th>순서</th>
                          <th>상태</th>
                          <th>등록일</th>
                          <th>작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faqs.map((faq) => (
                          <tr key={faq.id}>
                            <td className="question-cell">{faq.question}</td>
                            <td>{faq.category || "-"}</td>
                            <td>{faq.displayOrder}</td>
                            <td>
                              <span
                                className={`status ${
                                  faq.isActive ? "active" : "inactive"
                                }`}
                              >
                                {faq.isActive ? "활성" : "비활성"}
                              </span>
                            </td>
                            <td>{faq.createdAt}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="edit-button"
                                  onClick={() => openFaqModal(faq)}
                                >
                                  수정
                                </button>
                                <button
                                  className="delete-button"
                                  onClick={() => handleDeleteFaq(faq.id)}
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={faqPagination.currentPage}
                    totalPages={faqPagination.totalPages}
                    totalItems={faqPagination.totalItems}
                    onPageChange={handleFaqPageChange}
                    className="pagination-margin"
                  />
                </>
              )}
            </div>
          )}

          {/* 공지사항 관리 탭 */}
          {activeTab === "announcements" && (
            <div className="tab-content">
              <div className="content-header">
                <h2>공지사항 관리</h2>
                <button
                  className="add-button"
                  onClick={() => openAnnouncementModal()}
                >
                  + 공지사항 추가
                </button>
              </div>

              {loading ? (
                <div className="loading">로딩 중...</div>
              ) : (
                <>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>제목</th>
                          <th>중요도</th>
                          <th>등록일</th>
                          <th>작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {announcements.map((announcement) => (
                          <tr key={announcement.id}>
                            <td className="title-cell">{announcement.title}</td>
                            <td>
                              <span
                                className={`importance ${
                                  announcement.isImportant
                                    ? "important"
                                    : "normal"
                                }`}
                              >
                                {announcement.isImportant ? "중요" : "일반"}
                              </span>
                            </td>
                            <td>{announcement.createdAt}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="edit-button"
                                  onClick={() =>
                                    openAnnouncementModal(announcement)
                                  }
                                >
                                  수정
                                </button>
                                <button
                                  className="delete-button"
                                  onClick={() =>
                                    handleDeleteAnnouncement(announcement.id)
                                  }
                                >
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={announcementPagination.currentPage}
                    totalPages={announcementPagination.totalPages}
                    totalItems={announcementPagination.totalItems}
                    onPageChange={handleAnnouncementPageChange}
                    className="pagination-margin"
                  />
                </>
              )}
            </div>
          )}

          {/* FAQ 모달 */}
          {showFaqModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>{editingFaq ? "FAQ 수정" : "FAQ 추가"}</h3>
                  <button
                    className="close-button"
                    onClick={() => setShowFaqModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>질문</label>
                    <input
                      type="text"
                      value={faqForm.question}
                      onChange={(e) =>
                        setFaqForm({ ...faqForm, question: e.target.value })
                      }
                      placeholder="질문을 입력하세요"
                    />
                  </div>
                  <div className="form-group">
                    <label>답변</label>
                    <textarea
                      value={faqForm.answer}
                      onChange={(e) =>
                        setFaqForm({ ...faqForm, answer: e.target.value })
                      }
                      placeholder="답변을 입력하세요"
                      rows={5}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>카테고리</label>
                      <input
                        type="text"
                        value={faqForm.category}
                        onChange={(e) =>
                          setFaqForm({ ...faqForm, category: e.target.value })
                        }
                        placeholder="카테고리"
                      />
                    </div>
                    <div className="form-group">
                      <label>순서</label>
                      <input
                        type="number"
                        value={faqForm.displayOrder}
                        onChange={(e) =>
                          setFaqForm({
                            ...faqForm,
                            displayOrder: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={faqForm.isActive}
                        onChange={(e) =>
                          setFaqForm({ ...faqForm, isActive: e.target.checked })
                        }
                      />
                      활성 상태
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="cancel-button"
                    onClick={() => setShowFaqModal(false)}
                  >
                    취소
                  </button>
                  <button
                    className="save-button"
                    onClick={editingFaq ? handleUpdateFaq : handleCreateFaq}
                  >
                    {editingFaq ? "수정" : "추가"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 공지사항 모달 */}
          {showAnnouncementModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h3>
                    {editingAnnouncement ? "공지사항 수정" : "공지사항 추가"}
                  </h3>
                  <button
                    className="close-button"
                    onClick={() => setShowAnnouncementModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>제목</label>
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) =>
                        setAnnouncementForm({
                          ...announcementForm,
                          title: e.target.value,
                        })
                      }
                      placeholder="제목을 입력하세요"
                    />
                  </div>
                  <div className="form-group">
                    <label>내용</label>
                    <textarea
                      value={announcementForm.content}
                      onChange={(e) =>
                        setAnnouncementForm({
                          ...announcementForm,
                          content: e.target.value,
                        })
                      }
                      placeholder="내용을 입력하세요"
                      rows={8}
                    />
                  </div>
                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={announcementForm.isImportant}
                        onChange={(e) =>
                          setAnnouncementForm({
                            ...announcementForm,
                            isImportant: e.target.checked,
                          })
                        }
                      />
                      중요 공지사항
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="cancel-button"
                    onClick={() => setShowAnnouncementModal(false)}
                  >
                    취소
                  </button>
                  <button
                    className="save-button"
                    onClick={
                      editingAnnouncement
                        ? handleUpdateAnnouncement
                        : handleCreateAnnouncement
                    }
                  >
                    {editingAnnouncement ? "수정" : "추가"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}
