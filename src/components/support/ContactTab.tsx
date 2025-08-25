"use client";

import React, { useState, useRef, useEffect } from "react";
import Pagination from "@/components/Pagination";

interface InquiryAttachment {
  id: number;
  inquiry_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
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
  id: number;
  category: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  contact_phone: string;
  sms_notification: boolean;
  attachments?: InquiryAttachment[];
  replies?: InquiryReply[];
}

interface InquiryForm {
  category: string;
  title: string;
  content: string;
  smsNotification: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function ContactTab() {
  // State for contact tabs
  const [activeContactTab, setActiveContactTab] = useState("register");

  // 카테고리 및 상태 매핑
  const categoryDisplayMap: { [key: string]: string } = {
    "AI_TARGET_MARKETING": "AI 타깃마케팅",
    "PRICING": "요금제", 
    "CHARGING": "충전",
    "LOGIN": "로그인",
    "USER_INFO": "회원정보",
    "MESSAGE": "문자",
    "SEND_RESULT": "발송결과",
    "OTHER": "기타"
  };

  const statusDisplayMap: { [key: string]: string } = {
    "PENDING": "답변대기",
    "ANSWERED": "답변완료",
    "CLOSED": "종료"
  };

  // State for inquiry form
  const [inquiryForm, setInquiryForm] = useState<InquiryForm>({
    category: "",
    title: "",
    content: "",
    smsNotification: false,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State for inquiry history
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiryDetailMode, setInquiryDetailMode] = useState<"list" | "detail" | "edit">("list");

  // 문의 수정 폼 상태
  const [editForm, setEditForm] = useState({
    category: "",
    title: "",
    content: "",
  });
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  
  // User data state
  const [userPhone, setUserPhone] = useState<string>("");
  const [userLoading, setUserLoading] = useState(true);

  // Fetch user data
  const fetchUserData = async () => {
    try {
      setUserLoading(true);
      
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUserPhone("");
        return;
      }

      const response = await fetch("/api/users/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("사용자 정보를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      setUserPhone(data.phoneNumber || "");
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      setUserPhone("");
    } finally {
      setUserLoading(false);
    }
  };

  // Initialize user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  // Load inquiry history when history tab is activated
  useEffect(() => {
    if (activeContactTab === "history") {
      fetchInquiries(1);
    }
  }, [activeContactTab]);

  // Form handlers
  const handleInquiryFormChange = (field: keyof InquiryForm, value: string | boolean) => {
    setInquiryForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleInquirySubmit = async () => {
    if (!inquiryForm.category || !inquiryForm.title || !inquiryForm.content) {
      alert("필수 항목을 모두 입력해 주세요.");
      return;
    }

    if (!userPhone) {
      alert("연락처 정보가 없습니다. 프로필에서 연락처를 등록해 주세요.");
      return;
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append("category", inquiryForm.category);
      formData.append("title", inquiryForm.title);
      formData.append("content", inquiryForm.content);
      formData.append("smsNotification", inquiryForm.smsNotification.toString());
      
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("문의 등록에 실패했습니다.");
      }

      // Reset form
      setInquiryForm({
        category: "",
        title: "",
        content: "",
        smsNotification: false,
      });
      setSelectedFile(null);
      
      alert("문의가 성공적으로 등록되었습니다.");
      
    } catch (error) {
      console.error("문의 등록 실패:", error);
      alert("문의 등록에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchInquiries = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      
      // 토큰 가져오기
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }
      
      const response = await fetch(`/api/inquiries?page=${page}&limit=10`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("문의내역을 불러오는데 실패했습니다.");
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setInquiries(data.data.inquiries || []);
        setPagination(data.data.pagination || null);
      } else {
        setInquiries([]);
        setPagination(null);
        setError(data.error?.message || "문의내역을 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("문의내역 조회 실패:", error);
      setError(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchInquiries(page);
  };

  const handleInquiryClick = (inquiry: Inquiry) => {
    fetchInquiryDetail(inquiry.id);
  };

  const handleBackToList = () => {
    setSelectedInquiry(null);
    setInquiryDetailMode("list");
  };

  // 문의 상세 조회
  const fetchInquiryDetail = async (inquiryId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("문의 상세 조회에 실패했습니다.");
      }

      const data = await response.json();
      if (data.success) {
        setSelectedInquiry(data.data);
        setInquiryDetailMode("detail");
      } else {
        setError(data.error?.message || "문의 상세 조회에 실패했습니다.");
      }
    } catch (error) {
      console.error("문의 상세 조회 오류:", error);
      setError("문의 상세 조회 중 오류가 발생했습니다.");
    }
  };

  // 문의 삭제
  const handleDeleteInquiry = async (inquiryId: number) => {
    if (!confirm("정말로 이 문의를 삭제하시겠습니까?\n삭제된 문의는 복구할 수 없습니다.")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(`/api/inquiries/${inquiryId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("문의 삭제에 실패했습니다.");
      }

      const data = await response.json();
      if (data.success) {
        alert("문의가 성공적으로 삭제되었습니다.");
        setSelectedInquiry(null);
        fetchInquiries(1); // 목록 새로고침
      } else {
        setError(data.error?.message || "문의 삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("문의 삭제 오류:", error);
      setError("문의 삭제 중 오류가 발생했습니다.");
    }
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

    return `${supabaseUrl}/storage/v1/object/public/inquiry-files/${filePath}`;
  };

  // 파일 다운로드 함수
  const handleFileDownload = (attachment: InquiryAttachment) => {
    try {
      const fileUrl = getSupabaseFileUrl(attachment.file_path);
      
      // 새 창에서 파일 열기 (다운로드)
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = attachment.file_name;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // 임시로 DOM에 추가하고 클릭 후 제거
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
      alert("파일 다운로드 중 오류가 발생했습니다.");
    }
  };

  // 문의 수정 모드로 전환
  const handleEditInquiry = () => {
    if (selectedInquiry) {
      setEditForm({
        category: categoryDisplayMap[selectedInquiry.category] || selectedInquiry.category,
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
      const categoryCode = Object.keys(categoryDisplayMap).find(
        key => categoryDisplayMap[key] === editForm.category
      ) || editForm.category;

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

        // 문의 목록을 다시 불러오기
        await fetchInquiries(1);

        // 수정된 문의의 최신 정보를 다시 조회
        await fetchInquiryDetail(selectedInquiry.id);

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

  return (
    <div className="bg-transparent p-0 rounded-none shadow-none border-none">
      {/* 문의하기 서브탭 */}
      <div className="flex gap-0 mb-8">
        <button
          className={`bg-gray-200 border border-gray-300 px-8 py-4 text-base font-semibold cursor-pointer transition-all relative z-10 ${
            activeContactTab === "register" 
              ? "text-gray-900 bg-white border-gray-300 z-20" 
              : "text-gray-500 hover:text-gray-600 hover:bg-gray-100 first:border-r-0"
          }`}
          onClick={() => setActiveContactTab("register")}
        >
          문의등록
        </button>
        <button
          className={`bg-gray-200 border border-gray-300 px-8 py-4 text-base font-semibold cursor-pointer transition-all relative z-10 ${
            activeContactTab === "history" 
              ? "text-gray-900 bg-white border-gray-300 z-20" 
              : "text-gray-500 hover:text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveContactTab("history")}
        >
          문의내역
        </button>
      </div>

      {/* 서브탭 콘텐츠 */}
      <div className="bg-white rounded-none rounded-r-lg rounded-b-lg p-0 mt-0">
        {activeContactTab === "register" ? (
          <div>
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              {/* 문의유형 행 */}
              <div className="flex border-b border-gray-200 min-h-[60px] items-stretch last:border-b-0">
                <div className="flex-shrink-0 w-48 bg-gray-50 p-4 flex items-center font-semibold text-gray-900 border-r border-gray-200 text-base">
                  문의유형 <span className="text-red-600 ml-1">*</span>
                </div>
                <div className="flex-1 p-4 flex items-center">
                  <div className="relative w-full max-w-96">
                    <select
                      className="w-full py-3 px-4 border-2 border-gray-200 rounded-lg text-base bg-white cursor-pointer transition-all appearance-none focus:outline-none focus:border-blue-600 hover:border-gray-300"
                      value={inquiryForm.category}
                      onChange={(e) => handleInquiryFormChange("category", e.target.value)}
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
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 pointer-events-none text-sm">
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              {/* 연락처 행 */}
              <div className="flex border-b border-gray-200 min-h-[60px] items-stretch last:border-b-0">
                <div className="flex-shrink-0 w-48 bg-gray-50 p-4 flex items-center font-semibold text-gray-900 border-r border-gray-200 text-base">
                  연락처
                </div>
                <div className="flex-1 p-4 flex items-center">
                  <div className="flex items-center gap-6 w-full">
                    <input
                      type="tel"
                      className="py-3 px-4 border border-gray-200 rounded-md text-base transition-colors w-full max-w-96 bg-gray-50 text-gray-600 cursor-not-allowed"
                      value={userLoading ? "로딩 중..." : userPhone || "연락처 정보 없음"}
                      readOnly
                      placeholder="로그인 후 자동 설정"
                    />
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 border-2 border-gray-300 rounded cursor-pointer accent-blue-600"
                          checked={inquiryForm.smsNotification}
                          onChange={(e) => handleInquiryFormChange("smsNotification", e.target.checked)}
                        />
                        SMS 알림 수신 동의
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 문의제목 행 */}
              <div className="flex border-b border-gray-200 min-h-[60px] items-stretch last:border-b-0">
                <div className="flex-shrink-0 w-48 bg-gray-50 p-4 flex items-center font-semibold text-gray-900 border-r border-gray-200 text-base">
                  문의제목 <span className="text-red-600 ml-1">*</span>
                </div>
                <div className="flex-1 p-4 flex items-center">
                  <div className="relative w-full">
                    <input
                      type="text"
                      className="w-full py-3 pl-4 pr-16 border border-gray-200 rounded-md text-base transition-colors focus:outline-none focus:border-blue-600"
                      value={inquiryForm.title}
                      onChange={(e) => handleInquiryFormChange("title", e.target.value)}
                      placeholder="문의제목을 입력해 주세요"
                      maxLength={100}
                    />
                    <span className="absolute top-1/2 right-4 transform -translate-y-1/2 text-sm text-gray-600 bg-white px-1 pointer-events-none z-10">
                      {inquiryForm.title.length}/100
                    </span>
                  </div>
                </div>
              </div>

              {/* 문의내용 행 */}
              <div className="flex border-b border-gray-200 items-stretch last:border-b-0">
                <div className="flex-shrink-0 w-48 bg-gray-50 p-4 flex items-start font-semibold text-gray-900 border-r border-gray-200 text-base pt-4">
                  문의내용 <span className="text-red-600 ml-1">*</span>
                </div>
                <div className="flex-1 p-4 flex items-start">
                  <div className="relative w-full">
                    <textarea
                      className="w-full p-4 border border-gray-200 rounded-md text-base resize-vertical min-h-[200px] transition-colors focus:outline-none focus:border-blue-600"
                      value={inquiryForm.content}
                      onChange={(e) => handleInquiryFormChange("content", e.target.value)}
                      placeholder="문의내용을 자세히 입력해 주세요"
                      maxLength={2000}
                    />
                    <span className="absolute bottom-4 right-4 text-sm text-gray-600 bg-white px-1 pointer-events-none">
                      {inquiryForm.content.length}/2000
                    </span>
                  </div>
                </div>
              </div>

              {/* 파일첨부 행 */}
              <div className="flex border-b border-gray-200 items-stretch last:border-b-0">
                <div className="flex-shrink-0 w-48 bg-gray-50 p-4 flex items-start font-semibold text-gray-900 border-r border-gray-200 text-base pt-4">
                  파일첨부
                  <span className="text-gray-500 text-sm ml-1 mt-0.5">(선택)</span>
                </div>
                <div className="flex-1 p-4 flex flex-col items-start">
                  <div className="flex items-center gap-4 mb-2 w-full">
                    <button
                      type="button"
                      className="py-3 px-6 bg-gray-600 text-white border-none rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-gray-700 flex-shrink-0"
                      onClick={handleFileButtonClick}
                    >
                      파일 선택
                    </button>
                    <span className="text-gray-600 text-sm">
                      {selectedFile ? selectedFile.name : "선택된 파일이 없습니다"}
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      style={{ display: "none" }}
                      accept=".jpg,.jpeg,.png,.gif,.pdf,.txt,.doc,.docx"
                    />
                  </div>
                  <div className="text-xs text-gray-600 leading-relaxed mt-2">
                    ※ 파일 크기는 10MB 이하, jpg/jpeg/png/gif/pdf/txt/doc/docx 파일만 업로드 가능합니다.
                  </div>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="text-center mt-8">
              <button
                type="button"
                className="py-4 px-12 bg-blue-600 text-white border-none rounded-lg text-lg font-semibold cursor-pointer transition-colors hover:bg-blue-700 shadow-sm hover:shadow-md"
                onClick={handleInquirySubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "제출 중..." : "문의하기"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            {inquiryDetailMode === "edit" ? (
              // 문의 수정 폼 (테이블 형식)
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="flex font-semibold border-b border-gray-200">
                  <div className="w-full p-4 text-gray-700 text-lg font-semibold">
                    문의 수정
                  </div>
                </div>
                
                <div className="flex border-b border-gray-200">
                  <div className="flex-shrink-0 w-40 p-4 border-r border-gray-200 flex items-center bg-gray-50 text-gray-700 text-sm font-semibold">
                    문의유형 <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="flex-1 p-4">
                    <select
                      className="w-full py-3 px-4 border border-gray-200 rounded-md text-base transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={editForm.category}
                      onChange={(e) => handleEditFormChange("category", e.target.value)}
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
                  </div>
                </div>

                <div className="flex border-b border-gray-200">
                  <div className="flex-shrink-0 w-40 p-4 border-r border-gray-200 flex items-center bg-gray-50 text-gray-700 text-sm font-semibold">
                    문의제목 <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full py-3 px-4 border border-gray-200 rounded-md text-base transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="문의 제목을 수정할 수 있습니다."
                        maxLength={25}
                        value={editForm.title}
                        onChange={(e) => handleEditFormChange("title", e.target.value)}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                        {editForm.title.length}/25
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-gray-200">
                  <div className="flex-shrink-0 w-40 p-4 border-r border-gray-200 flex items-start pt-6 bg-gray-50 text-gray-700 text-sm font-semibold">
                    문의내용 <span className="text-red-500 ml-1">*</span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="relative">
                      <textarea
                        className="w-full py-3 px-4 border border-gray-200 rounded-md text-base transition-colors focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                        placeholder="문의내용을 수정하세요. 문의내용을 수정하세요.
문의내용을 수정하세요.
문의내용을 수정하세요.
문의내용을 수정하세요.
문의내용을 수정하세요."
                        maxLength={2000}
                        rows={8}
                        value={editForm.content}
                        onChange={(e) => handleEditFormChange("content", e.target.value)}
                      />
                      <div className="absolute right-3 bottom-3 text-sm text-gray-500">
                        {editForm.content.length}/2000
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex border-b border-gray-200">
                  <div className="flex-shrink-0 w-40 p-4 border-r border-gray-200 flex items-center bg-gray-50 text-gray-700 text-sm font-semibold">
                    파일 첨부(선택)
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        id="edit-file-input"
                        className="hidden"
                        accept=".jpg,.jpeg,.gif,.png,.bmp,.docx,.xlsx,.xls,.csv,.pdf"
                        onChange={handleEditFileSelect}
                      />
                      <button
                        type="button"
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        onClick={() => document.getElementById("edit-file-input")?.click()}
                      >
                        파일첨부
                      </button>
                      <span className="text-sm text-gray-600">
                        {editSelectedFile
                          ? `${editSelectedFile.name} (${(editSelectedFile.size / 1024 / 1024).toFixed(2)}MB)`
                          : selectedInquiry?.attachments?.[0]?.file_name 
                            ? `${selectedInquiry.attachments[0].file_name} (${(selectedInquiry.attachments[0].file_size / 1024 / 1024).toFixed(2)}MB)`
                            : "선택된 파일이 없습니다"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      jpg, jpeg, gif, png, bmp, docx, xlsx, xls, csv, pdf 첨부 가능 / 최대 5MB
                    </div>
                  </div>
                </div>

                {/* 하단 버튼 영역 */}
                <div className="text-center mt-8 mb-8">
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={handleCancelEdit}
                      className="px-12 py-2 border border-gray-300 text-gray-700 text-lg font-semibold cursor-pointer transition-colors hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleSubmitEdit}
                      className="px-12 py-2 bg-blue-600 text-white text-lg font-semibold cursor-pointer transition-colors hover:bg-blue-700"
                    >
                      수정 완료
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedInquiry ? (
              // 문의 상세 보기
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                <div className="p-6 border-b border-gray-200">                  
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{selectedInquiry.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-900">
                    <span className="font-semibold">문의유형:</span>
                    <span>{categoryDisplayMap[selectedInquiry.category] || selectedInquiry.category}</span>
                    <span className="font-semibold">문의날짜:</span>
                    <span>{new Date(selectedInquiry.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="p-4 mb-6">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedInquiry.content}</p>
                  </div>
                  
                                      {/* 첨부파일 */}
                    {selectedInquiry.attachments && selectedInquiry.attachments.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-900">첨부파일</span>
                          {selectedInquiry.attachments.map((attachment) => (
                            <button
                              key={attachment.id}
                              onClick={() => handleFileDownload(attachment)}
                              className="text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors"
                            >
                              {attachment.file_name} ({(attachment.file_size / 1024 / 1024).toFixed(2)} MB)
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  
                  {/* 답변 */}
                  {selectedInquiry.replies && selectedInquiry.replies.length > 0 && (
                    <div className="space-y-4">
                      {selectedInquiry.replies.map((reply) => (
                        <div key={reply.id} className="bg-red-50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-md font-semibold text-gray-900">
                              관리자 {reply.admin?.name || '답변'}
                            </span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                          <div className="flex items-center gap-2 mt-4 text-md text-gray-900">
                            <span className="font-semibold">답변날짜:</span>
                            <span>
                              {new Date(reply.created_at).toLocaleDateString('ko-KR')} {new Date(reply.created_at).toLocaleTimeString('ko-KR')}
                            </span>
                          </div>
                           
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 하단 버튼 영역 */}
                  <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
                    <button
                      onClick={handleBackToList}
                      className="px-6 py-2 bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                    >
                      목록
                    </button>
                    
                    {selectedInquiry.status === "PENDING" && (
                      <div className="flex gap-3">
                        <button
                          onClick={handleEditInquiry}
                          className="px-6 py-2 border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                          className="px-6 py-2 border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                    
                    {selectedInquiry.status === "ANSWERED" && (
                      <button
                        onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                        className="px-6 py-2 border border-gray-300 hover:bg-gray-100 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // 문의 목록
              <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="flex bg-gray-50 border-b-2 border-gray-300 font-semibold">
                <div className="flex-shrink-0 w-36 p-4 border-r border-gray-200 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                  문의유형
                </div>
                <div className="flex-1 p-4 border-r border-gray-200 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                  제목
                </div>
                <div className="flex-shrink-0 w-28 p-4 border-r border-gray-200 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                  답변여부
                </div>
                <div className="flex-shrink-0 w-32 p-4 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                  작성일
                </div>
              </div>
              
              {loading ? (
                <div className="text-center py-8 text-base text-gray-600">
                  문의내역을 불러오는 중...
                </div>
              ) : error ? (
                <div className="text-center py-8 text-base text-red-600">
                  {error}
                  <button
                    onClick={() => fetchInquiries(1)}
                    className="ml-4 px-3 py-1.5 bg-red-600 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-red-700"
                  >
                    다시 시도
                  </button>
                </div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-8 text-base text-blue-800">
                  등록된 문의내역이 없습니다.
                </div>
              ) : (
                <div className="flex flex-col">
                  {inquiries.map((inquiry) => (
                    <div key={inquiry.id} className="flex border-b border-gray-200 last:border-b-0 transition-colors hover:bg-gray-50 cursor-pointer">
                      <div className="flex-shrink-0 w-36 p-4 border-r border-gray-200 flex items-center justify-center text-center">
                        {categoryDisplayMap[inquiry.category] || inquiry.category}
                      </div>
                                             <div 
                         className="flex-1 p-4 border-r border-gray-200 flex items-center font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                         onClick={() => handleInquiryClick(inquiry)}
                       >
                         {inquiry.title}
                       </div>
                      <div className="flex-shrink-0 w-28 p-4 border-r border-gray-200 flex items-center justify-center text-center">
                        <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                          inquiry.status === "ANSWERED" 
                            ? "bg-blue-50 text-blue-800 border border-blue-200" 
                            : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                        }`}>
                          {statusDisplayMap[inquiry.status] || inquiry.status}
                        </span>
                      </div>
                      <div className="flex-shrink-0 w-32 p-4 flex items-center justify-center text-center text-gray-600 text-sm">
                        {new Date(inquiry.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>
            )}

            {/* 문의내역 페이지네이션 */}
            {!selectedInquiry && pagination && (
              <div className="flex justify-center mt-8">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  onPageChange={handlePageChange}
                  className=""
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}