"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AnnouncementTab from "../../components/support/AnnouncementTab";
import FaqTab from "../../components/support/FaqTab";
import ContactTab from "../../components/support/ContactTab";

interface Announcement {
  id: number;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

const SupportPage = () => {
  const searchParams = useSearchParams();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState("announcement");
  const [activeContactTab, setActiveContactTab] = useState("register");

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<number | null>(null);

  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState<string | null>(null);
  const [faqPagination, setFaqPagination] = useState<PaginationInfo | null>(null);
  const [faqCurrentPage, setFaqCurrentPage] = useState(1);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqSearchQuery, setFaqSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");

  // Fetch functions
  const fetchAnnouncements = async (page: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/announcements?page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error('공지사항을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setAnnouncements(data.announcements || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error('공지사항 조회 실패:', error);
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaqs = async (page: number, searchQuery = "", category = "전체") => {
    try {
      setFaqLoading(true);
      setFaqError(null);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        search: searchQuery,
        category: category === "전체" ? "" : category
      });
      
      const response = await fetch(`/api/faqs?${params}`);
      if (!response.ok) {
        throw new Error('FAQ를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setFaqs(data.faqs || []);
      setFaqPagination(data.pagination || null);
    } catch (error) {
      console.error('FAQ 조회 실패:', error);
      setFaqError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setFaqLoading(false);
    }
  };

  // Event handlers
  const handleAnnouncementClick = (announcement: Announcement) => {
    setExpandedAnnouncement(
      expandedAnnouncement === announcement.id ? null : announcement.id
    );
  };

  const handleFaqClick = (faq: FAQ) => {
    setExpandedFaq(expandedFaq === faq.id ? null : faq.id);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchAnnouncements(page);
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

  // Initialize data on component mount
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["announcement", "faq", "contact"].includes(tab)) {
      setActiveTab(tab);
    }

    // Fetch initial data
    fetchAnnouncements(1);
    fetchFaqs(1, "", "전체");
  }, []);

  // Refetch data when active tab changes
  useEffect(() => {
    if (activeTab === "announcement" && announcements.length === 0) {
      fetchAnnouncements(currentPage);
    } else if (activeTab === "faq" && faqs.length === 0) {
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
          <AnnouncementTab
            announcements={announcements}
            loading={loading}
            error={error}
            pagination={pagination}
            expandedAnnouncement={expandedAnnouncement}
            onAnnouncementClick={handleAnnouncementClick}
            onPageChange={handlePageChange}
            onRetry={() => fetchAnnouncements(currentPage)}
          />
        );
      case "faq":
        return (
          <FaqTab
            faqs={faqs}
            loading={faqLoading}
            error={faqError}
            pagination={faqPagination}
            expandedFaq={expandedFaq}
            searchQuery={faqSearchQuery}
            selectedCategory={selectedCategory}
            onFaqClick={handleFaqClick}
            onPageChange={handleFaqPageChange}
            onSearchChange={handleSearchChange}
            onSearchSubmit={handleSearchSubmit}
            onCategoryChange={handleCategoryChange}
            onRetry={() => fetchFaqs(faqCurrentPage, faqSearchQuery, selectedCategory)}
          />
        );
      case "contact":
        return (
          <ContactTab
            activeContactTab={activeContactTab}
            setActiveContactTab={setActiveContactTab}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col p-5 relative">
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-black text-2xl font-semibold leading-tight tracking-tight m-0 mb-2">고객센터</h1>
        </header>

        <div className="flex gap-6 border-b border-gray-300 mb-10">
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "announcement" 
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("announcement")}
          >
            공지사항
          </button>
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "faq" 
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("faq")}
          >
            자주 묻는 질문
          </button>
          <button
            className={`bg-transparent border-none pb-3 px-1 text-base font-semibold cursor-pointer relative transition-colors duration-200 ${
              activeTab === "contact" 
                ? "text-blue-600 after:content-[''] after:absolute after:-bottom-px after:left-0 after:right-0 after:h-0.5 after:bg-blue-600" 
                : "text-gray-500 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab("contact")}
          >
            문의하기
          </button>
        </div>

        <div className="flex-1">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default SupportPage;