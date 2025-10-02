"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";

interface MessageLog {
  id: number;
  to_name: string;
  to_number: string;
  message_content: string;
  message_type: "SMS" | "LMS";
  sent_at: string;
  status: "sent" | "failed";
  error_message?: string;
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

interface Statistics {
  total: number;
  sent: number;
  failed: number;
  sms: number;
  lms: number;
}

export default function MessageListPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<Statistics>({
    total: 0,
    sent: 0,
    failed: 0,
    sms: 0,
    lms: 0,
  });

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [messageTypeFilter, setMessageTypeFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [currentPage, search, statusFilter, messageTypeFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (search) params.append("search", search);
      if (statusFilter) params.append("status", statusFilter);
      if (messageTypeFilter) params.append("messageType", messageTypeFilter);

      const response = await fetch(
        `/api/reservations/message-logs?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("메시지 목록 조회 실패");

      const data = await response.json();
      setLogs(data.logs);
      setStatistics(data.statistics);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("메시지 목록 조회 오류:", error);
      alert("메시지 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchInput);
    setCurrentPage(1);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleFilterChange = (type: "status" | "messageType", value: string) => {
    if (type === "status") {
      setStatusFilter(value);
    } else {
      setMessageTypeFilter(value);
    }
    setCurrentPage(1);
  };

  const handleViewDetail = async (logId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/reservations/message-logs/${logId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("메시지 상세 조회 실패");

      const data = await response.json();
      setSelectedLog(data.log);
      setShowDetailModal(true);
    } catch (error) {
      console.error("메시지 상세 조회 오류:", error);
      alert("메시지 상세 정보를 불러오는데 실패했습니다.");
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
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

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">보낸 메시지</h1>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">전체</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.total}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">발송 성공</p>
              <p className="text-2xl font-bold text-green-600">{statistics.sent}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">발송 실패</p>
              <p className="text-2xl font-bold text-red-600">{statistics.failed}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">SMS</p>
              <p className="text-2xl font-bold text-blue-600">{statistics.sms}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">LMS</p>
              <p className="text-2xl font-bold text-purple-600">{statistics.lms}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="수신자 이름 또는 전화번호로 검색"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    검색
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체 상태</option>
                  <option value="sent">발송 성공</option>
                  <option value="failed">발송 실패</option>
                </select>

                <select
                  value={messageTypeFilter}
                  onChange={(e) => handleFilterChange("messageType", e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체 타입</option>
                  <option value="SMS">SMS</option>
                  <option value="LMS">LMS</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <p className="text-gray-500 text-lg">보낸 메시지가 없습니다.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">발송 시간</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수신자</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">예약 정보</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">메시지 내용</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">타입</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">동작</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(log.sent_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{log.to_name}</div>
                            <div className="text-sm text-gray-500">{formatPhoneNumber(log.to_number)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {log.reservations ? (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">{log.reservations.spaces.name}</div>
                                <div className="text-gray-500">
                                  {new Date(log.reservations.start_datetime).toLocaleDateString("ko-KR")}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">{log.message_content}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.message_type === "SMS" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {log.message_type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.status === "sent" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {log.status === "sent" ? "성공" : "실패"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button onClick={() => handleViewDetail(log.id)} className="text-blue-600 hover:text-blue-900">
                              상세보기
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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

      {showDetailModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">메시지 상세 정보</h2>
                <button onClick={() => setShowDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">발송 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">발송 시간</p>
                      <p className="text-sm font-medium text-gray-900">{formatDateTime(selectedLog.sent_at)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">메시지 타입</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLog.message_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">발송 상태</p>
                      <p className="text-sm font-medium text-gray-900">
                        <span className={`px-2 py-1 rounded-full ${
                          selectedLog.status === "sent" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                          {selectedLog.status === "sent" ? "발송 성공" : "발송 실패"}
                        </span>
                      </p>
                    </div>
                    {selectedLog.error_message && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">오류 메시지</p>
                        <p className="text-sm font-medium text-red-600">{selectedLog.error_message}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">수신자 정보</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">이름</p>
                      <p className="text-sm font-medium text-gray-900">{selectedLog.to_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">전화번호</p>
                      <p className="text-sm font-medium text-gray-900">{formatPhoneNumber(selectedLog.to_number)}</p>
                    </div>
                  </div>
                </div>

                {selectedLog.reservations && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-900 mb-3">예약 정보</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">공간</p>
                        <p className="text-sm font-medium text-gray-900">{selectedLog.reservations.spaces.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">예약 날짜</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(selectedLog.reservations.start_datetime).toLocaleDateString("ko-KR")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedLog.reservation_message_templates && (
                  <div className="border-b pb-4">
                    <h3 className="font-semibold text-gray-900 mb-3">템플릿</h3>
                    <p className="text-sm text-gray-900">{selectedLog.reservation_message_templates.name}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">메시지 내용</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedLog.message_content}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
