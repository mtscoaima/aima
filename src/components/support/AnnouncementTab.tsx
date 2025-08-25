"use client";

import React, { useState, useEffect, useCallback } from "react";
import Pagination from "@/components/Pagination";

interface Announcement {
  id: number;
  title: string;
  content: string;
  isImportant: boolean;
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export default function AnnouncementTab() {
  // State
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState<number | null>(null);

  // Fetch function
  const fetchAnnouncements = useCallback(async (page: number) => {
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
  }, []);

  // Event handlers
  const handleAnnouncementClick = (announcement: Announcement) => {
    setExpandedAnnouncement(
      expandedAnnouncement === announcement.id ? null : announcement.id
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchAnnouncements(page);
  };

  const handleRetry = () => {
    fetchAnnouncements(currentPage);
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchAnnouncements(1);
  }, [fetchAnnouncements]);
  return (
    <div className="bg-transparent p-0 rounded-none shadow-none border-none">
      <div className="w-full">
        {loading ? (
          <div className="text-center py-8 my-8 rounded-lg text-base bg-gray-50 text-gray-600 border border-gray-200">
            공지사항을 불러오는 중...
          </div>
        ) : error ? (
          <div className="text-center py-8 my-8 rounded-lg text-base bg-red-50 text-red-800 border border-red-200">
            {error}
            <button
              onClick={handleRetry}
              className="ml-4 px-3 py-1.5 bg-red-600 text-white border-none rounded cursor-pointer text-sm transition-colors hover:bg-red-700"
            >
              다시 시도
            </button>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-8 my-8 rounded-lg text-base bg-blue-50 text-blue-800 border border-blue-200">
            등록된 공지사항이 없습니다.
          </div>
        ) : (
          <div className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
            <div className="flex bg-gray-50 border-b-2 border-gray-300 font-semibold">
              <div className="flex-shrink-0 w-20 p-4 border-r border-gray-200 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                번호
              </div>
              <div className="flex-1 p-4 border-r border-gray-200 flex items-center justify-center text-center text-gray-700 text-sm font-semibold">
                제목
              </div>
              <div className="flex-shrink-0 w-30 p-4 flex items-center justify-center text-center text-gray-600 text-sm font-semibold">
                작성일
              </div>
            </div>
            <div className="flex flex-col">
              {announcements.map((announcement, index) => (
                <div
                  key={announcement.id}
                  className="border-b border-gray-200 last:border-b-0"
                >
                  <div
                    className="flex transition-colors cursor-pointer hover:bg-gray-50"
                    onClick={() => handleAnnouncementClick(announcement)}
                  >
                    <div className="flex-shrink-0 w-20 p-4 border-r border-gray-200 flex items-center justify-center text-center font-medium text-gray-600">
                      {(pagination?.totalItems || announcements.length) -
                        ((pagination?.currentPage || 1) - 1) *
                          (pagination?.limit || 10) -
                        index}
                    </div>
                    <div className={`flex-1 p-4 border-r border-gray-200 flex items-center gap-2 relative ${
                      expandedAnnouncement === announcement.id ? 'font-semibold' : ''
                    }`}>
                      {announcement.isImportant && (
                        <span className="bg-red-600 text-white text-xs font-bold py-1 px-2 rounded whitespace-nowrap mr-2">
                          중요
                        </span>
                      )}
                      <span className="flex-1">{announcement.title}</span>
                      <span className="text-gray-600 text-sm transition-transform flex-shrink-0">
                        {expandedAnnouncement === announcement.id ? "▲" : "▼"}
                      </span>
                    </div>
                    <div className="flex-shrink-0 w-30 p-4 flex items-center justify-center text-center text-gray-600 text-sm">
                      {announcement.createdAt}
                    </div>
                  </div>
                  {expandedAnnouncement === announcement.id && (
                    <div className="flex bg-gray-50 border-t border-gray-200 transition-all duration-300 ease-out">
                      <div className="flex-shrink-0 w-20"></div>
                      <div className="flex-1 p-6 border-r border-gray-200 leading-relaxed text-gray-700">
                        {announcement.content
                          .split("\n")
                          .map((line, idx) => (
                            <p key={idx} className="mb-2 text-sm last:mb-0">{line}</p>
                          ))}
                      </div>
                      <div className="flex-shrink-0 w-30"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 페이지네이션은 항상 표시 */}
        <div className="flex justify-center mt-8">
          <Pagination
            currentPage={pagination?.currentPage || 1}
            totalPages={pagination?.totalPages || 2}
            totalItems={pagination?.totalItems || 15}
            onPageChange={handlePageChange}
            className=""
          />
        </div>
      </div>
    </div>
  );
}
