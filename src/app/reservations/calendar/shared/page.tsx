"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";

interface SharedCalendar {
  id: number;
  share_token: string;
  title: string;
  space_ids: number[];
  reservation_description: string | null;
  view_count: number;
  created_at: string;
}

export default function SharedCalendarPage() {
  const router = useRouter();
  const [calendars, setCalendars] = useState<SharedCalendar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCalendars();
  }, []);

  const fetchCalendars = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/shared-calendars", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setCalendars(data.sharedCalendars || []);
      }
    } catch (error) {
      console.error("Error fetching calendars:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleCreateCalendar = () => {
    router.push('/reservations/calendar/shared/create');
  };

  const handleCopyLink = (token: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/shared/calendar/${token}`;
    navigator.clipboard.writeText(shareUrl);
    alert("공유 링크가 복사되었습니다.");
  };

  const handleDeleteCalendar = async (id: number) => {
    if (!confirm("이 공유 캘린더를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/reservations/shared-calendars/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        alert("공유 캘린더가 삭제되었습니다.");
        fetchCalendars();
      }
    } catch (error) {
      console.error("Error deleting calendar:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["USER"]}>
        <div className="flex justify-center items-center min-h-screen">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center mb-8">
            <button
              onClick={handleBackClick}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              공유 캘린더
            </h1>
          </div>

          {/* 내 공유 캘린더 섹션 */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              내 공유 캘린더 <span className="text-blue-500">{calendars.length}</span>
            </h2>
          </div>

          {/* 캘린더 목록 또는 빈 상태 */}
          {calendars.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-gray-500 text-lg mb-8">
                공유 캘린더가 없습니다.
              </p>

              {/* 공유 캘린더 만들기 버튼 */}
              <button
                onClick={handleCreateCalendar}
                className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">공유 캘린더 만들기</span>
              </button>
            </div>
          ) : (
            <>
              {/* 캘린더 목록 */}
              <div className="space-y-4 mb-6">
                {calendars.map((calendar) => (
                  <div key={calendar.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{calendar.title}</h3>
                      <button
                        onClick={() => handleDeleteCalendar(calendar.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      조회수: {calendar.view_count || 0}회 · {new Date(calendar.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/shared/calendar/${calendar.share_token}`}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={() => handleCopyLink(calendar.share_token)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                      >
                        복사
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* 새 캘린더 만들기 버튼 */}
              <button
                onClick={handleCreateCalendar}
                className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">공유 캘린더 만들기</span>
              </button>
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
