"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Pagination from "@/components/Pagination";
import { tokenManager } from "@/lib/api";
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

interface InquiryAttachment {
  id: string;
  inquiry_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

interface InquiryReply {
  id: number;
  inquiry_id: number;
  admin_id: number;
  content: string;
  created_at: string;
  admin?: {
    id: number;
    name: string;
  };
}

interface Inquiry {
  id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
  contact_phone: string;
  sms_notification: boolean;
  status: "PENDING" | "ANSWERED" | "CLOSED";
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  reply_count?: number;
  attachment_count?: number;
  attachments?: InquiryAttachment[];
  replies?: InquiryReply[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

type TabType = "announcements" | "faqs" | "inquiries";

export default function CustomerSupportPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("announcements");
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showInquiryDetailModal, setShowInquiryDetailModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

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

  const [inquiryPagination, setInquiryPagination] = useState<PaginationInfo>({
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

  // 답변 폼 상태
  const [replyForm, setReplyForm] = useState({
    content: "",
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

  const fetchInquiries = useCallback(
    async (page: number = 1) => {
      setLoading(true);
      try {
        const token = tokenManager.getAccessToken();
        if (!token) {
          console.error("인증 토큰이 없습니다.");
          return;
        }

        const response = await fetch(
          `/api/admin/inquiries?page=${page}&limit=${inquiryPagination.limit}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setInquiries(data.data.inquiries || []);
            setInquiryPagination({
              currentPage: data.data.pagination.currentPage,
              totalPages: data.data.pagination.totalPages,
              totalItems: data.data.pagination.totalItems,
              limit: data.data.pagination.limit,
              hasNext: data.data.pagination.hasNext,
              hasPrev: data.data.pagination.hasPrev,
            });
          }
        } else {
          const errorData = await response.json();
          console.error(
            "문의사항 조회 실패:",
            errorData.error?.message || "알 수 없는 오류"
          );
        }
      } catch (error) {
        console.error("문의사항 조회 실패:", error);
      } finally {
        setLoading(false);
      }
    },
    [inquiryPagination.limit]
  );

  useEffect(() => {
    if (activeTab === "announcements") {
      fetchAnnouncements(announcementPagination.currentPage);
    } else if (activeTab === "faqs") {
      fetchFaqs(faqPagination.currentPage);
    } else if (activeTab === "inquiries") {
      fetchInquiries(inquiryPagination.currentPage);
    }
  }, [
    activeTab,
    faqPagination.currentPage,
    announcementPagination.currentPage,
    inquiryPagination.currentPage,
    fetchFaqs,
    fetchAnnouncements,
    fetchInquiries,
  ]);

  const handleFaqPageChange = (page: number) => {
    fetchFaqs(page);
  };

  const handleAnnouncementPageChange = (page: number) => {
    fetchAnnouncements(page);
  };

  const handleInquiryPageChange = (page: number) => {
    fetchInquiries(page);
  };

  const fetchInquiryDetail = async (inquiryId: string) => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        console.error("인증 토큰이 없습니다.");
        return null;
      }

      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          return data.data;
        }
      } else {
        const errorData = await response.json();
        console.error(
          "문의 상세 조회 실패:",
          errorData.error?.message || "알 수 없는 오류"
        );
      }
    } catch (error) {
      console.error("문의 상세 조회 실패:", error);
    }
    return null;
  };

  const handleInquiryDetail = async (inquiry: Inquiry) => {
    setLoading(true);
    try {
      const detailedInquiry = await fetchInquiryDetail(inquiry.id);
      if (detailedInquiry) {
        setSelectedInquiry(detailedInquiry);
        setShowInquiryDetailModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleInquiryStatusChange = async (
    inquiryId: string,
    status: string
  ) => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        console.error("인증 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/admin/inquiries/${inquiryId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          await fetchInquiries(inquiryPagination.currentPage);
        }
      } else {
        const errorData = await response.json();
        console.error(
          "문의 상태 변경 실패:",
          errorData.error?.message || "알 수 없는 오류"
        );
      }
    } catch (error) {
      console.error("문의 상태 변경 실패:", error);
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedInquiry || !replyForm.content.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        console.error("인증 토큰이 없습니다.");
        return;
      }

      const response = await fetch(
        `/api/inquiries/${selectedInquiry.id}/reply`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: replyForm.content.trim(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert("답변이 성공적으로 등록되었습니다.");
          setShowReplyModal(false);
          setReplyForm({ content: "" });
          // 문의 목록과 상세 정보 새로고침
          await fetchInquiries(inquiryPagination.currentPage);
          if (selectedInquiry) {
            const updatedInquiry = await fetchInquiryDetail(selectedInquiry.id);
            if (updatedInquiry) {
              setSelectedInquiry(updatedInquiry);
            }
          }
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error?.message || "답변 등록에 실패했습니다.");
      }
    } catch (error) {
      console.error("답변 등록 실패:", error);
      alert("답변 등록 중 오류가 발생했습니다.");
    }
  };

  const openReplyModal = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setReplyForm({ content: "" });
    setShowReplyModal(true);
  };

  const resetReplyForm = () => {
    setReplyForm({ content: "" });
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

  const getCategoryLabel = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      AI_TARGET_MARKETING: "AI 타깃마케팅",
      PRICING: "요금제",
      CHARGING: "충전",
      LOGIN: "로그인",
      USER_INFO: "회원정보",
      MESSAGE: "문자",
      SEND_RESULT: "발송결과",
      OTHER: "기타",
    };
    return categoryMap[category] || category;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: "대기중",
      ANSWERED: "답변완료",
      CLOSED: "종료",
    };
    return statusMap[status] || status;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Supabase Storage 파일 URL 생성
  const getSupabaseFileUrl = (filePath: string) => {
    // Supabase URL을 환경변수에서 가져오거나 기본값 사용
    const supabaseUrl =
      typeof window !== "undefined"
        ? window.location.origin.includes("localhost")
          ? process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321"
          : process.env.NEXT_PUBLIC_SUPABASE_URL
        : process.env.NEXT_PUBLIC_SUPABASE_URL;

    return `${supabaseUrl}/storage/v1/object/public/inquiry-attachments/${filePath}`;
  };

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-dashboard">
        <div className="customer-support-page">
          <div className="page-header">
            <h1>고객센터 관리</h1>
            <p>FAQ, 공지사항, 문의사항을 관리합니다</p>
          </div>

          {/* 탭 메뉴 */}
          <div className="tab-menu">
            <button
              className={`tab-button ${
                activeTab === "announcements" ? "active" : ""
              }`}
              onClick={() => setActiveTab("announcements")}
            >
              공지사항 관리
            </button>
            <button
              className={`tab-button ${activeTab === "faqs" ? "active" : ""}`}
              onClick={() => setActiveTab("faqs")}
            >
              FAQ 관리
            </button>
            <button
              className={`tab-button ${
                activeTab === "inquiries" ? "active" : ""
              }`}
              onClick={() => setActiveTab("inquiries")}
            >
              문의사항 관리
            </button>
          </div>

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

          {/* 문의사항 관리 탭 */}
          {activeTab === "inquiries" && (
            <div className="tab-content">
              <div className="content-header">
                <h2>문의사항 관리</h2>
              </div>

              {loading ? (
                <div className="loading">로딩 중...</div>
              ) : (
                <>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>문의유형</th>
                          <th>제목</th>
                          <th>문의자</th>
                          <th>연락처</th>
                          <th>상태</th>
                          <th>등록일</th>
                          <th>작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inquiries.map((inquiry) => (
                          <tr key={inquiry.id}>
                            <td>{getCategoryLabel(inquiry.category)}</td>
                            <td className="title-cell">{inquiry.title}</td>
                            <td>{inquiry.user_name || "알 수 없음"}</td>
                            <td>{inquiry.contact_phone}</td>
                            <td>
                              <span
                                className={`status ${
                                  inquiry.status === "PENDING"
                                    ? "pending"
                                    : inquiry.status === "ANSWERED"
                                    ? "answered"
                                    : "closed"
                                }`}
                              >
                                {getStatusLabel(inquiry.status)}
                              </span>
                            </td>
                            <td>
                              {new Date(
                                inquiry.created_at
                              ).toLocaleDateString()}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="view-button"
                                  onClick={() => handleInquiryDetail(inquiry)}
                                >
                                  상세보기
                                </button>
                                {inquiry.status === "PENDING" && (
                                  <button
                                    className="reply-button"
                                    onClick={() => openReplyModal(inquiry)}
                                  >
                                    답변하기
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Pagination
                    currentPage={inquiryPagination.currentPage}
                    totalPages={inquiryPagination.totalPages}
                    totalItems={inquiryPagination.totalItems}
                    onPageChange={handleInquiryPageChange}
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
          {/* 문의 상세보기 모달 */}
          {showInquiryDetailModal && selectedInquiry && (
            <div className="modal-overlay">
              <div className="modal inquiry-detail-modal">
                <div className="modal-header">
                  <h3>문의 상세보기</h3>
                  <button
                    className="close-button"
                    onClick={() => setShowInquiryDetailModal(false)}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="inquiry-info">
                    <div className="info-row">
                      <label>문의유형:</label>
                      <span>{getCategoryLabel(selectedInquiry.category)}</span>
                    </div>
                    <div className="info-row">
                      <label>제목:</label>
                      <span>{selectedInquiry.title}</span>
                    </div>
                    <div className="info-row">
                      <label>문의자:</label>
                      <span>{selectedInquiry.user_name || "알 수 없음"}</span>
                    </div>
                    <div className="info-row">
                      <label>연락처:</label>
                      <span>{selectedInquiry.contact_phone}</span>
                    </div>
                    <div className="info-row">
                      <label>SMS 알림:</label>
                      <span>
                        {selectedInquiry.sms_notification ? "예" : "아니오"}
                      </span>
                    </div>
                    <div className="info-row">
                      <label>상태:</label>
                      <span
                        className={`status ${
                          selectedInquiry.status === "PENDING"
                            ? "pending"
                            : selectedInquiry.status === "ANSWERED"
                            ? "answered"
                            : "closed"
                        }`}
                      >
                        {getStatusLabel(selectedInquiry.status)}
                      </span>
                    </div>
                    <div className="info-row">
                      <label>등록일:</label>
                      <span>
                        {new Date(selectedInquiry.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="inquiry-content">
                    <label>문의내용:</label>
                    <div className="content-box">{selectedInquiry.content}</div>
                  </div>

                  {/* 첨부파일 섹션 */}
                  {selectedInquiry.attachments &&
                    selectedInquiry.attachments.length > 0 && (
                      <div className="inquiry-attached-files">
                        {selectedInquiry.attachments.map(
                          (attachment, index) => (
                            <div
                              key={attachment.id}
                              className="inquiry-attached-file"
                            >
                              <span className="attached-file-label">
                                {index === 0 ? "첨부파일" : ""}
                              </span>
                              <a
                                href={getSupabaseFileUrl(attachment.file_path)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="attached-file-link"
                              >
                                {attachment.file_name} (
                                {formatFileSize(attachment.file_size)})
                              </a>
                            </div>
                          )
                        )}
                      </div>
                    )}

                  {/* 답변 섹션 */}
                  {selectedInquiry.status === "ANSWERED" &&
                    selectedInquiry.replies &&
                    selectedInquiry.replies.length > 0 && (
                      <div className="reply-section">
                        <label>답변:</label>
                        {selectedInquiry.replies.map((reply) => (
                          <div key={reply.id} className="reply-box">
                            <div className="reply-content">{reply.content}</div>
                            <div className="reply-meta">
                              <span className="reply-author">
                                작성자: {reply.admin?.name || "관리자"}
                              </span>
                              <span className="reply-date">
                                작성일:{" "}
                                {new Date(reply.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                <div className="modal-footer">
                  <button
                    className="cancel-button"
                    onClick={() => setShowInquiryDetailModal(false)}
                  >
                    닫기
                  </button>
                  {selectedInquiry.status === "PENDING" && (
                    <button
                      className="reply-button"
                      onClick={() => {
                        setShowInquiryDetailModal(false);
                        openReplyModal(selectedInquiry);
                      }}
                    >
                      답변하기
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 답변 작성 모달 */}
          {showReplyModal && selectedInquiry && (
            <div className="modal-overlay">
              <div className="modal reply-modal">
                <div className="modal-header">
                  <h3>답변 작성</h3>
                  <button
                    className="close-button"
                    onClick={() => {
                      setShowReplyModal(false);
                      resetReplyForm();
                    }}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="inquiry-summary">
                    <h4>문의 정보</h4>
                    <div className="summary-item">
                      <label>문의유형:</label>
                      <span>{getCategoryLabel(selectedInquiry.category)}</span>
                    </div>
                    <div className="summary-item">
                      <label>제목:</label>
                      <span>{selectedInquiry.title}</span>
                    </div>
                    <div className="summary-item">
                      <label>문의자:</label>
                      <span>{selectedInquiry.user_name || "알 수 없음"}</span>
                    </div>
                    <div className="summary-content">
                      <label>문의내용:</label>
                      <div className="content-preview">
                        {selectedInquiry.content}
                      </div>
                    </div>
                  </div>

                  <div className="reply-form">
                    <div className="form-group">
                      <label>
                        답변 내용 <span className="required">*</span>
                      </label>
                      <textarea
                        value={replyForm.content}
                        onChange={(e) =>
                          setReplyForm({
                            ...replyForm,
                            content: e.target.value,
                          })
                        }
                        placeholder="답변 내용을 입력하세요"
                        rows={8}
                        maxLength={2000}
                        className="reply-textarea"
                      />
                      <div className="char-count">
                        {replyForm.content.length}/2000
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setShowReplyModal(false);
                      resetReplyForm();
                    }}
                  >
                    취소
                  </button>
                  <button
                    className="save-button"
                    onClick={handleReplySubmit}
                    disabled={!replyForm.content.trim()}
                  >
                    답변 등록
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
