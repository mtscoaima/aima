"use client";

import React from "react";
import Pagination from "@/components/Pagination";

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

interface FaqTabProps {
  faqs: FAQ[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  expandedFaq: number | null;
  searchQuery: string;
  selectedCategory: string;
  onFaqClick: (faq: FAQ) => void;
  onPageChange: (page: number) => void;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onCategoryChange: (category: string) => void;
  onRetry: () => void;
}

export default function FaqTab({
  faqs,
  loading,
  error,
  pagination,
  expandedFaq,
  searchQuery,
  selectedCategory,
  onFaqClick,
  onPageChange,
  onSearchChange,
  onSearchSubmit,
  onCategoryChange,
  onRetry,
}: FaqTabProps) {
  const categories = [
    "전체",
    "AI타깃마케팅",
    "요금제",
    "충전",
    "로그인",
    "회원정보",
    "문자",
    "발송결과",
    "기타",
  ];

  return (
    <div className="bg-transparent p-0 rounded-none shadow-none border-none">
      {/* 검색창 */}
      <div className="mb-8">
        <form onSubmit={onSearchSubmit} className="flex max-w-2xl mx-0 relative">
          <input
            type="text"
            placeholder="궁금한 사항을 입력해주세요"
            value={searchQuery}
            onChange={onSearchChange}
            className="flex-1 py-4 pr-12 pl-4 border-2 border-gray-200 rounded-full text-base outline-none transition-colors focus:border-blue-600"
          />
          <button 
            type="submit" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent border-none p-2 cursor-pointer rounded-full flex items-center justify-center transition-colors hover:bg-gray-50"
          >
            <span className="text-xl">🔍</span>
          </button>
        </form>
      </div>

      {/* 카테고리 분류 버튼 */}
      <div className="flex flex-wrap gap-2 mb-8 justify-start">
        {categories.map((category) => (
          <button
            key={category}
            className={`py-3 px-6 border border-gray-200 bg-white rounded text-sm font-medium cursor-pointer transition-all whitespace-nowrap ${
              selectedCategory === category
                ? "bg-gray-50 border-blue-600 text-blue-600"
                : "text-gray-600 hover:border-blue-600 hover:text-blue-600"
            }`}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* FAQ 목록 - 테이블 형식 */}
      <div className="w-full">
        {loading ? (
          <div className="text-center py-8 my-8 rounded-lg text-base bg-gray-50 text-gray-600 border border-gray-200">
            FAQ를 불러오는 중...
          </div>
        ) : error ? (
          <div className="text-center py-8 my-8 rounded-lg text-base bg-red-50 text-red-800 border border-red-200">
            {error}
            <button
              onClick={onRetry}
              className="ml-4 px-3 py-1.5 bg-red-600 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-8 my-8 rounded-lg text-base bg-blue-50 text-blue-800 border border-blue-200">
            등록된 FAQ가 없습니다.
          </div>
        ) : (
          <div className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <div className="flex flex-col">
              {faqs.map((faq) => (
                <div key={faq.id} className="border-b border-gray-200 last:border-b-0">
                  <div
                    className="flex transition-colors cursor-pointer hover:bg-gray-50"
                    onClick={() => onFaqClick(faq)}
                  >
                    <div className="flex-shrink-0 w-20 p-4 border-r border-gray-200 flex justify-center items-center text-center">
                      <span className="text-blue-600 font-bold text-lg">Q.</span>
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-between font-semibold text-gray-900 leading-relaxed">
                      <span className="flex-1">{faq.question}</span>
                      <span className="text-gray-600 text-sm transition-transform flex-shrink-0 ml-4">
                        {expandedFaq === faq.id ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                  {expandedFaq === faq.id && (
                    <div className="flex bg-gray-50 border-t border-gray-200 transition-all duration-300 ease-out">
                      <div className="flex-shrink-0 w-20 flex justify-center items-start p-6">
                        <span className="text-red-600 font-bold text-lg mt-1">A.</span>
                      </div>
                      <div className="flex-1 leading-relaxed text-gray-700 py-6 pr-6">
                        {faq.answer.split("\n").map((line, idx) => (
                          <p key={idx} className="mb-2 text-sm last:mb-0">{line}</p>
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
          currentPage={pagination?.currentPage || 1}
          totalPages={pagination?.totalPages || 1}
          totalItems={pagination?.totalItems || 10}
          onPageChange={onPageChange}
          className="mt-8 block"
        />
      </div>
    </div>
  );
}
