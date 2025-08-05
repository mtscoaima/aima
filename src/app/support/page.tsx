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
  const [activeContactTab, setActiveContactTab] = useState<
    "register" | "history"
  >("register");

  // 문의 폼 상태
  const [inquiryForm, setInquiryForm] = useState({
    category: "",
    title: "",
    content: "",
    smsNotification: false,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userPhone, setUserPhone] = useState("");

  // 문의내역 상태
  // 문의 상세보기 타입 정의
  interface InquiryType {
    id: number;
    category: string;
    title: string;
    content: string;
    attachedFile?: {
      name: string;
      size: string;
    } | null;
    status: "pending" | "completed";
    createdAt: string;
    answer?: {
      author: string;
      content: string;
      createdAt: string;
    } | null;
  }

  // 문의 상세보기 상태
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryType | null>(
    null
  );
  const [inquiryDetailMode, setInquiryDetailMode] = useState<
    "list" | "detail" | "edit"
  >("list");

  // 문의 수정 폼 상태
  const [editForm, setEditForm] = useState({
    category: "",
    title: "",
    content: "",
  });
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);

  const [inquiries, setInquiries] = useState<InquiryType[]>([
    {
      id: 1,
      category: "AI 타깃마케팅",
      title: "문의의 대한 제목이 들어갑니다.",
      content:
        "안녕하세요. 로그인에 문제가 있어 문의드립니다.\n문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다.\n문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다.",
      attachedFile: {
        name: "이미지.jpg",
        size: "3MB",
      },
      status: "pending",
      createdAt: "2025.09.22",
      answer: null,
    },
    {
      id: 2,
      category: "로그인",
      title: "문의의 대한 제목이 들어갑니다.",
      content:
        "안녕하세요. 로그인에 문제가 있어 문의드립니다.\n문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다.\n문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다. 문의에 대한 설명이 들어갑니다.",
      attachedFile: {
        name: "이미지.jpg",
        size: "3MB",
      },
      status: "completed",
      createdAt: "2025.09.22",
      answer: {
        author: "예이마",
        content:
          "안녕하세요. 예이마입니다. 문의주신 내용에 대한 답변 안내드립니다. 문의주신 내용에 대한 답변 안내드립니다.\n문의주신 내용에 대한 답변 안내드립니다. 문의주신 내용에 대한 답변 안내드립니다.",
        createdAt: "2025.09.22",
      },
    },
    {
      id: 3,
      category: "충전",
      title: "문의의 대한 제목이 들어갑니다.",
      content: "충전 관련 문의입니다.",
      attachedFile: null,
      status: "completed",
      createdAt: "2025.09.22",
      answer: {
        author: "관리자",
        content: "충전 관련 답변입니다.",
        createdAt: "2025.09.22",
      },
    },
    {
      id: 4,
      category: "회원정보",
      title: "문의의 대한 제목이 들어갑니다.",
      content: "회원정보 관련 문의입니다.",
      attachedFile: null,
      status: "completed",
      createdAt: "2025.09.22",
      answer: {
        author: "관리자",
        content: "회원정보 관련 답변입니다.",
        createdAt: "2025.09.22",
      },
    },
    {
      id: 5,
      category: "문자",
      title: "문의의 대한 제목이 들어갑니다.",
      content: "문자 발송 관련 문의입니다.",
      attachedFile: null,
      status: "pending",
      createdAt: "2025.09.21",
      answer: null,
    },
    {
      id: 6,
      category: "로그인",
      title: "문의의 대한 제목이 들어갑니다.",
      content: "로그인 관련 문의입니다.",
      attachedFile: null,
      status: "completed",
      createdAt: "2025.09.21",
      answer: {
        author: "관리자",
        content: "로그인 관련 답변입니다.",
        createdAt: "2025.09.21",
      },
    },
    {
      id: 7,
      category: "발송결과",
      title: "문의의 대한 제목이 들어갑니다.",
      content: "발송결과 관련 문의입니다.",
      attachedFile: null,
      status: "pending",
      createdAt: "2025.09.20",
      answer: null,
    },
    {
      id: 8,
      category: "기타",
      title: "문의의 대한 제목이 들어갑니다.",
      content: "기타 관련 문의입니다.",
      attachedFile: null,
      status: "completed",
      createdAt: "2025.09.20",
      answer: {
        author: "관리자",
        content: "기타 관련 답변입니다.",
        createdAt: "2025.09.20",
      },
    },
    {
      id: 9,
      category: "AI 타깃마케팅",
      title: "추가 문의 사항이 있습니다.",
      content: "AI 타깃마케팅 관련 추가 문의입니다.",
      attachedFile: null,
      status: "pending",
      createdAt: "2025.09.19",
      answer: null,
    },
    {
      id: 10,
      category: "요금제",
      title: "요금제 관련 문의드립니다.",
      content: "요금제에 대해 자세히 알고 싶습니다.",
      attachedFile: null,
      status: "completed",
      createdAt: "2025.09.19",
      answer: {
        author: "관리자",
        content: "요금제 관련 상세 답변입니다.",
        createdAt: "2025.09.19",
      },
    },
    {
      id: 11,
      category: "충전",
      title: "충전 관련해서 문의드립니다.",
      content: "충전 방법에 대해 문의드립니다.",
      attachedFile: null,
      status: "pending",
      createdAt: "2025.09.18",
      answer: null,
    },
    {
      id: 12,
      category: "문자",
      title: "문자 발송 관련 문의입니다.",
      content: "문자 발송이 안 됩니다.",
      attachedFile: null,
      status: "completed",
      createdAt: "2025.09.18",
      answer: {
        author: "관리자",
        content: "문자 발송 문제 해결 방법입니다.",
        createdAt: "2025.09.18",
      },
    },
  ]);
  const [inquiryCurrentPage, setInquiryCurrentPage] = useState(1);
  const inquiriesPerPage = 10;

  // 로그인된 유저 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // accessToken 가져오기
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          console.warn("accessToken이 없습니다.");
          const defaultPhone = "010-0000-0000";
          setUserPhone(defaultPhone);
          return;
        }

        // 실제 유저 정보 API 호출
        const response = await fetch("/api/user/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          if (userData.success && userData.data?.phone) {
            setUserPhone(userData.data.phone);
          } else {
            console.warn("유저 정보가 존재하지 않음:", userData);
            const defaultPhone = "010-0000-0000";
            setUserPhone(defaultPhone);
          }
        } else {
          // API 실패 시 기본값
          console.warn("유저 정보 API 호출 실패, Status:", response.status);
          const defaultPhone = "010-0000-0000";
          setUserPhone(defaultPhone);
        }
      } catch (error) {
        console.error("유저 정보 가져오기 실패:", error);
        // 기본값 설정
        const defaultPhone = "010-0000-0000";
        setUserPhone(defaultPhone);
      }
    };

    fetchUserInfo();
  }, []);

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

  // 문의내역 페이지네이션 처리
  const totalInquiries = inquiries.length;
  const totalInquiryPages = Math.ceil(totalInquiries / inquiriesPerPage);
  const startIndex = (inquiryCurrentPage - 1) * inquiriesPerPage;
  const endIndex = startIndex + inquiriesPerPage;
  const currentInquiries = inquiries.slice(startIndex, endIndex);

  const handleInquiryPageChange = (page: number) => {
    setInquiryCurrentPage(page);
  };

  // 문의 상세보기 핸들러
  const handleInquiryDetail = (inquiry: InquiryType) => {
    setSelectedInquiry(inquiry);
    setInquiryDetailMode("detail");
  };

  const handleBackToList = () => {
    setSelectedInquiry(null);
    setInquiryDetailMode("list");
  };

  const handleEditInquiry = () => {
    if (selectedInquiry) {
      setEditForm({
        category: selectedInquiry.category,
        title: selectedInquiry.title,
        content: selectedInquiry.content,
      });
      setEditSelectedFile(null);
    }
    setInquiryDetailMode("edit");
  };

  // 수정 폼 핸들러
  const handleEditFormChange = (field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하만 가능합니다.");
        return;
      }

      // 파일 확장자 체크
      const allowedExtensions = [
        "jpg",
        "jpeg",
        "gif",
        "png",
        "bmp",
        "docx",
        "xlsx",
        "xls",
        "csv",
        "pdf",
      ];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        alert("지원하지 않는 파일 형식입니다.");
        return;
      }

      setEditSelectedFile(file);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      category: "",
      title: "",
      content: "",
    });
    setEditSelectedFile(null);
    setInquiryDetailMode("detail");
  };

  const handleSubmitEdit = () => {
    // 폼 유효성 검사
    if (!editForm.category) {
      alert("문의유형을 선택해주세요.");
      return;
    }

    if (!editForm.title.trim()) {
      alert("문의제목을 입력해주세요.");
      return;
    }

    if (!editForm.content.trim()) {
      alert("문의내용을 입력해주세요.");
      return;
    }

    // TODO: API 호출로 문의 수정
    console.log("문의 수정:", {
      ...editForm,
      file: editSelectedFile,
    });

    // 수정 완료 처리
    if (selectedInquiry) {
      const updatedInquiry = {
        ...selectedInquiry,
        category: editForm.category,
        title: editForm.title,
        content: editForm.content,
        attachedFile: editSelectedFile
          ? {
              name: editSelectedFile.name,
              size: `${(editSelectedFile.size / (1024 * 1024)).toFixed(1)}MB`,
            }
          : selectedInquiry.attachedFile,
      };

      setInquiries((prev) =>
        prev.map((inquiry) =>
          inquiry.id === selectedInquiry.id ? updatedInquiry : inquiry
        )
      );
      setSelectedInquiry(updatedInquiry);
    }

    alert("문의가 성공적으로 수정되었습니다.");
    setInquiryDetailMode("detail");
  };

  const handleDeleteInquiry = () => {
    if (selectedInquiry && confirm("문의를 삭제하시겠습니까?")) {
      setInquiries((prev) =>
        prev.filter((inquiry) => inquiry.id !== selectedInquiry.id)
      );
      handleBackToList();
      alert("문의가 삭제되었습니다.");
    }
  };

  // 문의 폼 핸들러
  const handleInquiryFormChange = (field: string, value: string | boolean) => {
    setInquiryForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하로 업로드해주세요.");
        return;
      }

      // 파일 확장자 체크
      const allowedExtensions = [
        "jpg",
        "jpeg",
        "gif",
        "png",
        "bmp",
        "docx",
        "xlsx",
        "xls",
        "csv",
        "pdf",
      ];
      const fileExtension = file.name.split(".").pop()?.toLowerCase();

      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        alert("지원하지 않는 파일 형식입니다.");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleSubmitInquiry = async () => {
    // 폼 유효성 검사
    if (!inquiryForm.category) {
      alert("문의유형을 선택해주세요.");
      return;
    }

    if (!inquiryForm.title.trim()) {
      alert("문의제목을 입력해주세요.");
      return;
    }

    if (!inquiryForm.content.trim()) {
      alert("문의내용을 입력해주세요.");
      return;
    }

    if (!userPhone) {
      alert("연락처 정보를 확인할 수 없습니다. 페이지를 새로고침해주세요.");
      return;
    }

    try {
      // accessToken 가져오기
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        alert("로그인이 필요합니다.");
        return;
      }

      // API 호출로 문의 등록
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          category: inquiryForm.category,
          title: inquiryForm.title,
          content: inquiryForm.content,
          sms_notification: inquiryForm.smsNotification,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // 파일이 있는 경우 파일 업로드
        if (selectedFile && result.data?.id) {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("inquiry_id", result.data.id.toString());

          await fetch("/api/upload/inquiry", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
          });
        }

        // 성공 메시지
        alert("문의가 성공적으로 등록되었습니다.");

        // 폼 초기화
        setInquiryForm({
          category: "",
          title: "",
          content: "",
          smsNotification: false,
        });
        setSelectedFile(null);

        // 문의내역 탭으로 이동하고 첫 페이지로 설정
        setActiveContactTab("history");
        setInquiryCurrentPage(1);
      } else {
        const errorData = await response.json();
        console.error("문의 등록 API 오류:", errorData);
        alert(
          errorData.error?.message ||
            "문의 등록에 실패했습니다. 다시 시도해주세요."
        );
      }
    } catch (error) {
      console.error("문의 등록 실패:", error);
      alert("문의 등록에 실패했습니다. 네트워크 연결을 확인해주세요.");
    }
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
  }, [
    activeTab,
    currentPage,
    faqCurrentPage,
    faqSearchQuery,
    selectedCategory,
  ]);

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
            {/* 문의하기 서브탭 */}
            <div className="contact-tabs">
              <button
                className={`contact-tab-btn ${
                  activeContactTab === "register" ? "active" : ""
                }`}
                onClick={() => setActiveContactTab("register")}
              >
                문의등록
              </button>
              <button
                className={`contact-tab-btn ${
                  activeContactTab === "history" ? "active" : ""
                }`}
                onClick={() => setActiveContactTab("history")}
              >
                문의내역
              </button>
            </div>

            {/* 서브탭 콘텐츠 */}
            <div className="contact-content">
              {activeContactTab === "register" ? (
                <div className="inquiry-register">
                  <div className="inquiry-form-table">
                    {/* 문의유형 행 */}
                    <div className="inquiry-table-row">
                      <div className="inquiry-table-label">
                        문의유형 <span className="required">*</span>
                      </div>
                      <div className="inquiry-table-content">
                        <div className="inquiry-category-dropdown">
                          <select
                            className="inquiry-select"
                            value={inquiryForm.category}
                            onChange={(e) =>
                              handleInquiryFormChange(
                                "category",
                                e.target.value
                              )
                            }
                          >
                            <option value="">문의유형을 선택해 주세요</option>
                            <option value="AI_TARGET_MARKETING">
                              AI 타깃마케팅
                            </option>
                            <option value="PRICING">요금제</option>
                            <option value="CHARGING">충전</option>
                            <option value="LOGIN">로그인</option>
                            <option value="USER_INFO">회원정보</option>
                            <option value="MESSAGE">문자</option>
                            <option value="SEND_RESULT">발송결과</option>
                            <option value="OTHER">기타</option>
                          </select>
                          <div className="dropdown-arrow">▼</div>
                        </div>
                      </div>
                    </div>

                    {/* 연락처 행 */}
                    <div className="inquiry-table-row">
                      <div className="inquiry-table-label">연락처</div>
                      <div className="inquiry-table-content">
                        <div className="inquiry-contact-input">
                          <input
                            type="tel"
                            className="inquiry-input readonly-input"
                            value={userPhone}
                            readOnly
                            placeholder="로그인 후 자동 설정"
                          />
                          <div className="sms-notification">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                className="inquiry-checkbox"
                                checked={inquiryForm.smsNotification}
                                onChange={(e) =>
                                  handleInquiryFormChange(
                                    "smsNotification",
                                    e.target.checked
                                  )
                                }
                              />
                              답변 완료 시 SMS 알림
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 문의제목 행 */}
                    <div className="inquiry-table-row">
                      <div className="inquiry-table-label">
                        문의제목 <span className="required">*</span>
                      </div>
                      <div className="inquiry-table-content">
                        <div className="inquiry-title-input">
                          <input
                            type="text"
                            placeholder="제목을 입력해 주세요"
                            className="inquiry-input inquiry-title-input-field"
                            maxLength={25}
                            value={inquiryForm.title}
                            onChange={(e) =>
                              handleInquiryFormChange("title", e.target.value)
                            }
                          />
                          <div className="char-count-inside">
                            {inquiryForm.title.length}/25
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 문의내용 행 */}
                    <div className="inquiry-table-row">
                      <div className="inquiry-table-label">
                        문의내용 <span className="required">*</span>
                      </div>
                      <div className="inquiry-table-content">
                        <div className="inquiry-content-input">
                          <textarea
                            placeholder="문의할 내용을 입력해 주세요"
                            className="inquiry-textarea"
                            maxLength={2000}
                            rows={8}
                            value={inquiryForm.content}
                            onChange={(e) =>
                              handleInquiryFormChange("content", e.target.value)
                            }
                          ></textarea>
                          <div className="char-count">
                            {inquiryForm.content.length}/2000
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 파일첨부 행 */}
                    <div className="inquiry-table-row">
                      <div className="inquiry-table-label">파일 첨부(선택)</div>
                      <div className="inquiry-table-content">
                        <div className="file-upload-area">
                          <input
                            type="file"
                            id="inquiry-file-input"
                            style={{ display: "none" }}
                            accept=".jpg,.jpeg,.gif,.png,.bmp,.docx,.xlsx,.xls,.csv,.pdf"
                            onChange={handleFileSelect}
                          />
                          <button
                            type="button"
                            className="file-upload-btn"
                            onClick={() =>
                              document
                                .getElementById("inquiry-file-input")
                                ?.click()
                            }
                          >
                            파일첨부
                          </button>
                          <span className="file-upload-text">
                            {selectedFile
                              ? selectedFile.name
                              : "선택된 파일이 없습니다"}
                          </span>
                        </div>
                        <div className="file-upload-note">
                          jpg, jpeg, gif, png, bmp, docx, xlsx, xls, csv, pdf
                          첨부 가능 / 최대 5MB
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 제출 버튼 */}
                  <div className="inquiry-submit-section">
                    <button
                      type="button"
                      className="inquiry-submit-btn"
                      onClick={handleSubmitInquiry}
                    >
                      문의하기
                    </button>
                  </div>
                </div>
              ) : inquiryDetailMode === "list" ? (
                <div className="inquiry-history">
                  {/* 문의내역 목록 */}
                  <div className="inquiry-history-table">
                    <div className="inquiry-history-header">
                      <div className="inquiry-history-cell">문의유형</div>
                      <div className="inquiry-history-cell">제목</div>
                      <div className="inquiry-history-cell">답변여부</div>
                      <div className="inquiry-history-cell">작성일</div>
                    </div>

                    <div className="inquiry-history-body">
                      {currentInquiries.length > 0 ? (
                        currentInquiries.map((inquiry) => (
                          <div
                            key={inquiry.id}
                            className="inquiry-history-row"
                            onClick={() => handleInquiryDetail(inquiry)}
                          >
                            <div className="inquiry-history-cell">
                              {inquiry.category}
                            </div>
                            <div className="inquiry-history-cell inquiry-title-cell">
                              {inquiry.title}
                            </div>
                            <div className="inquiry-history-cell">
                              <span
                                className={`status-badge ${inquiry.status}`}
                              >
                                {inquiry.status === "pending"
                                  ? "답변대기"
                                  : "답변완료"}
                              </span>
                            </div>
                            <div className="inquiry-history-cell">
                              {inquiry.createdAt}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-inquiry-history">
                          등록된 문의 내역이 없습니다.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 페이지네이션 */}
                  {totalInquiries > 0 && (
                    <Pagination
                      currentPage={inquiryCurrentPage}
                      totalPages={totalInquiryPages}
                      totalItems={totalInquiries}
                      onPageChange={handleInquiryPageChange}
                      className="inquiry-pagination"
                    />
                  )}
                </div>
              ) : inquiryDetailMode === "detail" ? (
                <div className="inquiry-detail">
                  {/* 문의 상세보기 */}
                  <div className="inquiry-detail-header">
                    <h3>{selectedInquiry?.title}</h3>
                  </div>

                  <div className="inquiry-detail-info">
                    <div className="inquiry-detail-meta">
                      <span className="inquiry-meta-item">
                        <strong>문의유형</strong> {selectedInquiry?.category}
                      </span>
                      <span className="inquiry-meta-separator">|</span>
                      <span className="inquiry-meta-item">
                        <strong>문의날짜</strong> {selectedInquiry?.createdAt}
                      </span>
                    </div>
                  </div>

                  <div className="inquiry-detail-content">
                    <div className="inquiry-content-text">
                      {selectedInquiry?.content
                        ?.split("\n")
                        .map((line: string, index: number) => (
                          <p key={index}>{line}</p>
                        ))}
                    </div>

                    {selectedInquiry?.attachedFile && (
                      <div className="inquiry-attached-file">
                        <span className="attached-file-label">첨부파일</span>
                        <span className="attached-file-info">
                          {selectedInquiry.attachedFile.name} (
                          {selectedInquiry.attachedFile.size})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 답변 섹션 */}
                  {selectedInquiry?.answer && (
                    <div className="inquiry-answer-section">
                      <div className="inquiry-answer-content">
                        <div className="answer-author">
                          <strong>{selectedInquiry.answer.author}</strong>
                        </div>
                        <div className="answer-text">
                          {selectedInquiry.answer.content
                            .split("\n")
                            .map((line: string, index: number) => (
                              <p key={index}>{line}</p>
                            ))}
                        </div>
                        <div className="answer-date">
                          <strong>답변날짜</strong>{" "}
                          {selectedInquiry.answer.createdAt}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 하단 버튼 */}
                  <div
                    className={`inquiry-detail-buttons ${selectedInquiry?.status}`}
                  >
                    {selectedInquiry?.status === "pending" ? (
                      <>
                        {/* 답변 대기: 목록(좌측), 수정/삭제(우측) */}
                        <button
                          className="inquiry-detail-btn list-btn"
                          onClick={handleBackToList}
                        >
                          목록
                        </button>
                        <div className="button-group">
                          <button
                            className="inquiry-detail-btn edit-btn"
                            onClick={handleEditInquiry}
                          >
                            수정
                          </button>
                          <button
                            className="inquiry-detail-btn delete-btn"
                            onClick={handleDeleteInquiry}
                          >
                            삭제
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* 답변 완료: 목록/삭제(우측) */}
                        <div className="button-group">
                          <button
                            className="inquiry-detail-btn list-btn"
                            onClick={handleBackToList}
                          >
                            목록
                          </button>
                          <button
                            className="inquiry-detail-btn delete-btn"
                            onClick={handleDeleteInquiry}
                          >
                            삭제
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="inquiry-edit">
                  {/* 문의 수정 */}
                  <div className="inquiry-edit-header">
                    <h3>문의 수정</h3>
                  </div>

                  <div className="inquiry-edit-form">
                    <div className="inquiry-form-table">
                      {/* 문의유형 행 */}
                      <div className="inquiry-table-row">
                        <div className="inquiry-table-label">
                          문의유형 <span className="required">*</span>
                        </div>
                        <div className="inquiry-table-content">
                          <div className="inquiry-category-dropdown">
                            <select
                              className="inquiry-select"
                              value={editForm.category}
                              onChange={(e) =>
                                handleEditFormChange("category", e.target.value)
                              }
                            >
                              <option value="">문의유형을 선택해 주세요</option>
                              <option value="AI_TARGET_MARKETING">
                                AI 타깃마케팅
                              </option>
                              <option value="PRICING">요금제</option>
                              <option value="CHARGING">충전</option>
                              <option value="LOGIN">로그인</option>
                              <option value="USER_INFO">회원정보</option>
                              <option value="MESSAGE">문자</option>
                              <option value="SEND_RESULT">발송결과</option>
                              <option value="OTHER">기타</option>
                            </select>
                            <div className="dropdown-arrow">▼</div>
                          </div>
                        </div>
                      </div>

                      {/* 문의제목 행 */}
                      <div className="inquiry-table-row">
                        <div className="inquiry-table-label">
                          문의제목 <span className="required">*</span>
                        </div>
                        <div className="inquiry-table-content">
                          <div className="inquiry-title-input">
                            <input
                              type="text"
                              placeholder="제목을 입력해 주세요"
                              className="inquiry-input inquiry-title-input-field"
                              maxLength={25}
                              value={editForm.title}
                              onChange={(e) =>
                                handleEditFormChange("title", e.target.value)
                              }
                            />
                            <div className="char-count-inside">
                              {editForm.title.length}/25
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 문의내용 행 */}
                      <div className="inquiry-table-row">
                        <div className="inquiry-table-label">
                          문의내용 <span className="required">*</span>
                        </div>
                        <div className="inquiry-table-content">
                          <div className="inquiry-content-input">
                            <textarea
                              placeholder="문의할 내용을 입력해 주세요"
                              className="inquiry-textarea"
                              maxLength={2000}
                              rows={8}
                              value={editForm.content}
                              onChange={(e) =>
                                handleEditFormChange("content", e.target.value)
                              }
                            ></textarea>
                            <div className="char-count">
                              {editForm.content.length}/2000
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 파일첨부 행 */}
                      <div className="inquiry-table-row">
                        <div className="inquiry-table-label">
                          파일 첨부(선택)
                        </div>
                        <div className="inquiry-table-content">
                          <div className="file-upload-area">
                            <input
                              type="file"
                              id="edit-file-input"
                              style={{ display: "none" }}
                              accept=".jpg,.jpeg,.gif,.png,.bmp,.docx,.xlsx,.xls,.csv,.pdf"
                              onChange={handleEditFileSelect}
                            />
                            <button
                              type="button"
                              className="file-upload-btn"
                              onClick={() =>
                                document
                                  .getElementById("edit-file-input")
                                  ?.click()
                              }
                            >
                              파일첨부
                            </button>
                            <span className="file-upload-text">
                              {editSelectedFile
                                ? editSelectedFile.name
                                : selectedInquiry?.attachedFile
                                ? selectedInquiry.attachedFile.name
                                : "선택된 파일이 없습니다"}
                            </span>
                          </div>
                          <div className="file-upload-note">
                            jpg, jpeg, gif, png, bmp, docx, xlsx, xls, csv, pdf
                            첨부 가능 / 최대 5MB
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 하단 버튼 */}
                    <div className="inquiry-edit-buttons">
                      <button
                        type="button"
                        className="inquiry-edit-btn cancel-btn"
                        onClick={handleCancelEdit}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="inquiry-edit-btn submit-btn"
                        onClick={handleSubmitEdit}
                      >
                        수정완료
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
