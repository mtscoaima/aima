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

  // 카테고리 매핑 상수
  const CATEGORY_DISPLAY_MAP: { [key: string]: string } = {
    AI_TARGET_MARKETING: "AI 타깃마케팅",
    PRICING: "요금제",
    CHARGING: "충전",
    LOGIN: "로그인",
    USER_INFO: "회원정보",
    MESSAGE: "문자",
    SEND_RESULT: "발송결과",
    OTHER: "기타",
  };

  const CATEGORY_CODE_MAP: { [key: string]: string } = {
    "AI 타깃마케팅": "AI_TARGET_MARKETING",
    요금제: "PRICING",
    충전: "CHARGING",
    로그인: "LOGIN",
    회원정보: "USER_INFO",
    문자: "MESSAGE",
    발송결과: "SEND_RESULT",
    기타: "OTHER",
  };

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
      url?: string;
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

  const [inquiries, setInquiries] = useState<InquiryType[]>([]);
  const [inquiryCurrentPage, setInquiryCurrentPage] = useState(1);
  const inquiriesPerPage = 10;
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [totalInquiries, setTotalInquiries] = useState(0);

  // 문의 목록 가져오기
  const fetchInquiries = async (page: number = 1) => {
    setInquiryLoading(true);
    setInquiryError(null);

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setInquiryError("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        `/api/inquiries?page=${page}&limit=${inquiriesPerPage}&sortBy=created_at&sortOrder=desc`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log(result);
          // 백엔드 응답 구조 확인 및 데이터 추출
          const inquiriesData = result.data?.inquiries || result.data || [];

          // 백엔드 데이터를 프론트엔드 형태로 변환
          const mappedInquiries: InquiryType[] = inquiriesData.map(
            (inquiry: {
              id: number;
              category: string;
              title: string;
              content: string;
              status: string;
              created_at: string;
              attachments?: {
                file_name: string;
                file_size: number;
                file_path: string;
              }[];
              replies?: { content: string; created_at: string }[];
            }) => ({
              id: inquiry.id,
              category: getCategoryDisplayName(inquiry.category),
              title: inquiry.title,
              content: inquiry.content,
              attachedFile:
                inquiry.attachments && inquiry.attachments.length > 0
                  ? {
                      name: inquiry.attachments[0].file_name,
                      size: formatFileSize(inquiry.attachments[0].file_size),
                      url: getSupabaseFileUrl(inquiry.attachments[0].file_path),
                    }
                  : null,
              status: inquiry.status === "ANSWERED" ? "completed" : "pending",
              createdAt: formatDate(inquiry.created_at),
              answer:
                inquiry.replies && inquiry.replies.length > 0
                  ? {
                      author: "관리자",
                      content: inquiry.replies[0].content,
                      createdAt: formatDate(inquiry.replies[0].created_at),
                    }
                  : null,
            })
          );

          setInquiries(mappedInquiries);
          // 페이지네이션 데이터 추출
          const paginationData =
            result.data?.pagination || result.pagination || {};
          setTotalInquiries(
            paginationData.total || paginationData.totalItems || 0
          );
        } else {
          setInquiryError(
            result.error?.message || "문의 목록을 불러오는데 실패했습니다."
          );
        }
      } else {
        setInquiryError("문의 목록을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("문의 목록 조회 오류:", error);
      setInquiryError("네트워크 오류가 발생했습니다.");
    } finally {
      setInquiryLoading(false);
    }
  };

  // 카테고리 표시명 변환
  const getCategoryDisplayName = (category: string) => {
    return CATEGORY_DISPLAY_MAP[category] || category;
  };

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    } else if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)}KB`;
    } else {
      return `${bytes}B`;
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\. /g, ".")
      .replace(".", ".");
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

  // 개별 문의 상세 정보 조회 함수
  const fetchUpdatedInquiryDetail = async (inquiryId: number) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        console.error("인증 토큰이 없습니다.");
        return;
      }

      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const inquiryData = result.data;

        // API 응답을 InquiryType 형식으로 변환
        const updatedInquiry: InquiryType = {
          id: inquiryData.id,
          category: getCategoryDisplayName(inquiryData.category),
          title: inquiryData.title,
          content: inquiryData.content,
          attachedFile:
            inquiryData.attachments && inquiryData.attachments.length > 0
              ? {
                  name: inquiryData.attachments[0].file_name,
                  size: formatFileSize(inquiryData.attachments[0].file_size),
                  url: getSupabaseFileUrl(inquiryData.attachments[0].file_path),
                }
              : null,
          status: inquiryData.status === "ANSWERED" ? "completed" : "pending",
          createdAt: formatDate(inquiryData.created_at),
          answer:
            inquiryData.replies && inquiryData.replies.length > 0
              ? {
                  author: "관리자",
                  content: inquiryData.replies[0].content,
                  createdAt: formatDate(inquiryData.replies[0].created_at),
                }
              : null,
        };

        setSelectedInquiry(updatedInquiry);
      } else {
        console.error("문의 상세 정보 조회 실패:", response.status);
      }
    } catch (error) {
      console.error("문의 상세 정보 조회 오류:", error);
    }
  };

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

  // 문의내역 탭이 활성화될 때 문의 목록 불러오기
  useEffect(() => {
    if (activeContactTab === "history") {
      fetchInquiries(inquiryCurrentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeContactTab, inquiryCurrentPage]);

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
  const totalInquiryPages = Math.ceil(totalInquiries / inquiriesPerPage);
  const currentInquiries = inquiries; // API에서 페이지별 데이터를 받아오므로 그대로 사용

  const handleInquiryPageChange = (page: number) => {
    setInquiryCurrentPage(page);
    fetchInquiries(page);
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
        category: selectedInquiry.category, // 이미 한글 이름이므로 그대로 사용
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

  const handleSubmitEdit = async () => {
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

    if (!selectedInquiry) return;

    try {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        alert("로그인이 필요합니다.");
        return;
      }

      // 카테고리를 영문 코드로 변환
      const categoryCode =
        CATEGORY_CODE_MAP[editForm.category] || editForm.category;

      const response = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          category: categoryCode,
          title: editForm.title,
          content: editForm.content,
        }),
      });

      if (response.ok) {
        // 새로운 파일이 선택된 경우 파일 업로드 처리
        if (editSelectedFile) {
          try {
            // 새 파일 업로드 (API에서 기존 파일 자동 삭제 후 교체)
            const formData = new FormData();
            formData.append("file", editSelectedFile);
            formData.append("inquiry_id", selectedInquiry.id.toString());

            const uploadResponse = await fetch("/api/upload/inquiry", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
              body: formData,
            });

            if (!uploadResponse.ok) {
              console.error("파일 업로드 실패");
              alert("문의는 수정되었지만 파일 업로드에 실패했습니다.");
            }
          } catch (error) {
            console.error("파일 업로드 오류:", error);
            alert("문의는 수정되었지만 파일 업로드에 실패했습니다.");
          }
        }

        alert("문의가 성공적으로 수정되었습니다.");

        // 문의 목록을 다시 불러오기 (첨부파일 정보 포함)
        await fetchInquiries(inquiryCurrentPage);

        // 수정된 문의의 최신 정보를 직접 API에서 가져와서 즉시 반영
        await fetchUpdatedInquiryDetail(selectedInquiry.id);

        setEditSelectedFile(null);
        setInquiryDetailMode("detail");
      } else {
        const errorData = await response.json();
        alert(errorData.error?.message || "문의 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("문의 수정 오류:", error);
      alert("문의 수정 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteInquiry = async () => {
    if (selectedInquiry && confirm("문의를 삭제하시겠습니까?")) {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          alert("로그인이 필요합니다.");
          return;
        }

        const response = await fetch(`/api/inquiries/${selectedInquiry.id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.ok) {
          alert("문의가 삭제되었습니다.");
          handleBackToList();
          // 문의 목록을 다시 불러오기
          fetchInquiries(inquiryCurrentPage);
        } else {
          const errorData = await response.json();
          alert(errorData.error?.message || "문의 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("문의 삭제 오류:", error);
        alert("문의 삭제 중 오류가 발생했습니다.");
      }
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

      // 카테고리를 영문 코드로 변환
      const categoryCode =
        CATEGORY_CODE_MAP[inquiryForm.category] || inquiryForm.category;

      // API 호출로 문의 등록
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          category: categoryCode,
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

        // 새로 등록된 문의 ID 저장
        const newInquiryId = result.data?.id;

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

        // 문의 목록을 다시 불러오기
        await fetchInquiries(1);

        // 새로 등록된 문의를 상세보기로 바로 표시
        if (newInquiryId) {
          await fetchUpdatedInquiryDetail(newInquiryId);
          setInquiryDetailMode("detail");
        }
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
                            <option value="AI 타깃마케팅">AI 타깃마케팅</option>
                            <option value="요금제">요금제</option>
                            <option value="충전">충전</option>
                            <option value="로그인">로그인</option>
                            <option value="회원정보">회원정보</option>
                            <option value="문자">문자</option>
                            <option value="발송결과">발송결과</option>
                            <option value="기타">기타</option>
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
                      {inquiryLoading ? (
                        <div className="loading-message">
                          문의 내역을 불러오는 중...
                        </div>
                      ) : inquiryError ? (
                        <div className="error-message">
                          {inquiryError}
                          <button
                            onClick={() => fetchInquiries(inquiryCurrentPage)}
                            className="retry-button"
                          >
                            다시 시도
                          </button>
                        </div>
                      ) : currentInquiries.length > 0 ? (
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
                        {selectedInquiry.attachedFile.url ? (
                          <a
                            href={selectedInquiry.attachedFile.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="attached-file-link"
                          >
                            {selectedInquiry.attachedFile.name} (
                            {selectedInquiry.attachedFile.size})
                          </a>
                        ) : (
                          <span className="attached-file-info">
                            {selectedInquiry.attachedFile.name} (
                            {selectedInquiry.attachedFile.size})
                          </span>
                        )}
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
                              <option value="AI 타깃마케팅">
                                AI 타깃마케팅
                              </option>
                              <option value="요금제">요금제</option>
                              <option value="충전">충전</option>
                              <option value="로그인">로그인</option>
                              <option value="회원정보">회원정보</option>
                              <option value="문자">문자</option>
                              <option value="발송결과">발송결과</option>
                              <option value="기타">기타</option>
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
