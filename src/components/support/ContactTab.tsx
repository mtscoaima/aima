"use client";

import React, { useState, useRef } from "react";
import Pagination from "@/components/Pagination";

interface Inquiry {
  id: number;
  category: string;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  attachedFileName?: string;
  attachedFilePath?: string;
  reply?: string;
  replyDate?: string;
}

interface InquiryForm {
  category: string;
  title: string;
  content: string;
  smsNotification: boolean;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export default function ContactTab() {
  // State for contact tabs
  const [activeContactTab, setActiveContactTab] = useState("register");

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
  
  // Mock user data (should come from auth context)
  const userPhone = "010-1234-5678"; // This should come from user context

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
      
      const response = await fetch(`/api/inquiries?page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error("문의내역을 불러오는데 실패했습니다.");
      }
      
      const data = await response.json();
      setInquiries(data.inquiries || []);
      setPagination(data.pagination || null);
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

  return (
    <div className="bg-transparent p-0 rounded-none shadow-none border-none">
      {/* 문의하기 서브탭 */}
      <div className="flex gap-0 mb-0">
        <button
          className={`bg-gray-50 border border-gray-300 px-8 py-4 text-base font-semibold cursor-pointer transition-all rounded-t-lg border-b-0 relative z-10 ${
            activeContactTab === "register" 
              ? "text-blue-600 bg-white border-gray-300 z-20" 
              : "text-gray-600 hover:text-blue-600 hover:bg-gray-100 first:border-r-0"
          }`}
          onClick={() => setActiveContactTab("register")}
        >
          문의등록
        </button>
        <button
          className={`bg-gray-50 border border-gray-300 px-8 py-4 text-base font-semibold cursor-pointer transition-all rounded-t-lg border-b-0 relative z-10 ${
            activeContactTab === "history" 
              ? "text-blue-600 bg-white border-gray-300 z-20" 
              : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
          }`}
          onClick={() => setActiveContactTab("history")}
        >
          문의내역
        </button>
      </div>

      {/* 서브탭 콘텐츠 */}
      <div className="bg-white border border-gray-300 rounded-none rounded-r-lg rounded-b-lg p-0 mt-0 shadow-sm">
        {activeContactTab === "register" ? (
          <div className="p-8">
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
                      value={userPhone}
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
            <div className="text-center mt-8 pt-8 border-t border-gray-200">
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
          <div className="p-8">
            <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="flex bg-gray-50 border-b-2 border-gray-300 font-semibold">
                <div className="flex-shrink-0 w-30 p-4 border-r border-gray-200 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                  문의유형
                </div>
                <div className="flex-1 p-4 border-r border-gray-200 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                  문의제목
                </div>
                <div className="flex-shrink-0 w-35 p-4 border-r border-gray-200 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                  등록일
                </div>
                <div className="flex-shrink-0 w-30 p-4 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                  상태
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
                      <div className="flex-shrink-0 w-30 p-4 border-r border-gray-200 flex items-center justify-center text-center">
                        {inquiry.category}
                      </div>
                      <div className="flex-1 p-4 border-r border-gray-200 flex items-center font-medium text-gray-900">
                        {inquiry.title}
                      </div>
                      <div className="flex-shrink-0 w-35 p-4 border-r border-gray-200 flex items-center justify-center text-center text-gray-600 text-sm">
                        {inquiry.createdAt}
                      </div>
                      <div className="flex-shrink-0 w-30 p-4 flex items-center justify-center text-center">
                        <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
                          inquiry.status === "답변완료" 
                            ? "bg-blue-50 text-blue-800 border border-blue-200" 
                            : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                        }`}>
                          {inquiry.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 문의내역 페이지네이션 */}
            {pagination && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                onPageChange={handlePageChange}
                className="mt-8 block"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}