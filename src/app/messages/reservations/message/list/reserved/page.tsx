"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";

interface ScheduledMessage {
  id: number;
  message_content: string;
  message_type: "SMS" | "LMS";
  scheduled_at: string;
  status: "pending" | "sent" | "failed";
  created_at: string;
  reservations?: {
    id: number;
    customer_name: string;
    customer_phone: string;
    start_datetime: string;
    end_datetime: string;
    spaces: {
      id: number;
      name: string;
    };
  };
  reservation_message_templates?: {
    id: number;
    name: string;
  };
}

export default function MessageReservedListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("scheduled");
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      const sortBy = activeTab === "scheduled" ? "scheduled_at" : "created_at";
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        sortBy,
      });

      const response = await fetch(
        `/api/reservations/scheduled-messages?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("메시지 목록 조회 실패");

      const data = await response.json();
      setMessages(data.messages);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("메시지 목록 조회 오류:", error);
      alert("메시지 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeTab]);

  const handleCancel = async (messageId: number) => {
    if (!confirm("이 예약 메시지를 취소하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/reservations/scheduled-messages?id=${messageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("메시지 취소 실패");

      alert("예약 메시지가 취소되었습니다.");
      fetchMessages(); // 목록 새로고침
    } catch (error) {
      console.error("메시지 취소 오류:", error);
      alert("메시지 취소에 실패했습니다.");
    }
  };

  // DB의 timestamp는 UTC 기준이므로 명시적으로 한국 시간(KST)으로 변환
  const formatDateTime = (dateString: string) => {
    // 타임존 정보가 없으면 'Z'를 붙여서 UTC로 강제 파싱
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const utcDate = new Date(utcString);

    // 한국 시간으로 표시 (Asia/Seoul timezone 사용)
    return utcDate.toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    return phone;
  };

  const getTimeRemaining = (scheduledAt: string) => {
    const now = new Date();
    // 타임존 정보가 없으면 'Z'를 붙여서 UTC로 강제 파싱
    const utcString = scheduledAt.endsWith('Z') ? scheduledAt : scheduledAt + 'Z';
    const scheduled = new Date(utcString);
    const diff = scheduled.getTime() - now.getTime();

    if (diff < 0) return "발송 대기 중";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}일 후 발송`;
    } else if (hours > 0) {
      return `${hours}시간 ${minutes}분 후 발송`;
    } else {
      return `${minutes}분 후 발송`;
    }
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">발송 예정 메시지</h1>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  새로 등록된 발송 예정 메시지가 목록에 표시되는 데에는 약간의 시간이 소요될 수 있습니다. (1분 이내)
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => {
                setActiveTab("scheduled");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "scheduled"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              발송 일정 순
            </button>
            <button
              onClick={() => {
                setActiveTab("created");
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "created"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              등록 순
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              발송예정 <span className="text-blue-500">{total}</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-gray-500 text-lg">발송 예정 메시지가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              message.message_type === "SMS"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {message.message_type}
                          </span>
                          <span className="text-sm text-gray-500">{getTimeRemaining(message.scheduled_at)}</span>
                        </div>
                        {message.reservation_message_templates && (
                          <p className="text-sm text-gray-600 mb-2">
                            템플릿: {message.reservation_message_templates.name}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleCancel(message.id)}
                        className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        취소
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">발송 예정 시간</p>
                        <p className="text-sm font-medium text-gray-900">{formatDateTime(message.scheduled_at)}</p>
                      </div>
                      {message.reservations && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">공간</p>
                            <p className="text-sm font-medium text-gray-900">{message.reservations.spaces.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">예약자</p>
                            <p className="text-sm font-medium text-gray-900">{message.reservations.customer_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">연락처</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatPhoneNumber(message.reservations.customer_phone)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.message_content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center mt-6 gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    이전
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 border rounded-lg ${
                            currentPage === pageNum
                              ? "bg-blue-500 text-white border-blue-500"
                              : "border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    다음
                  </button>
                </div>
              )}

              <div className="text-center text-sm text-gray-500 mt-4">
                전체 {total}개 중 {(currentPage - 1) * limit + 1}-{Math.min(currentPage * limit, total)}개 표시
              </div>
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
