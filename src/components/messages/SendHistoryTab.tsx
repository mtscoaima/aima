"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import SendRequestDetailModal from "../modals/SendRequestDetailModal";

interface SendRequest {
  id: string;
  user_id: number;
  channel_type: string;
  message_preview: string;
  total_count: number;
  success_count: number;
  fail_count: number;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface Stats {
  total: number;
  totalSuccess: number;
  totalFail: number;
  byChannel: Record<string, number>;
}

// 채널 타입 라벨
const CHANNEL_LABELS: Record<string, string> = {
  SMS: "SMS",
  LMS: "LMS",
  MMS: "MMS",
  KAKAO_ALIMTALK: "카카오 알림톡",
  KAKAO_BRAND: "카카오 브랜드",
  NAVER_TALK: "네이버 톡톡",
};

// 채널 타입 색상
const CHANNEL_COLORS: Record<string, string> = {
  SMS: "bg-purple-100 text-purple-800",
  LMS: "bg-indigo-100 text-indigo-800",
  MMS: "bg-blue-100 text-blue-800",
  KAKAO_ALIMTALK: "bg-yellow-100 text-yellow-800",
  KAKAO_BRAND: "bg-amber-100 text-amber-800",
  NAVER_TALK: "bg-green-100 text-green-800",
};

// 상태 라벨
const STATUS_LABELS: Record<string, string> = {
  pending: "대기중",
  processing: "진행중",
  completed: "완료",
};

const SendHistoryTab = () => {
  const [requests, setRequests] = useState<SendRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 상태
  const [channelFilter, setChannelFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // 페이지네이션
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  // 상세 모달
  const [selectedRequest, setSelectedRequest] = useState<SendRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 데이터 조회
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("로그인이 필요합니다.");
        setIsLoading(false);
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (channelFilter) params.append("channelType", channelFilter);
      if (statusFilter) params.append("status", statusFilter);
      if (startDate) params.append("startDate", new Date(startDate).toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        params.append("endDate", end.toISOString());
      }

      const response = await fetch(`/api/send-requests?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("데이터 조회에 실패했습니다.");
      }

      const data = await response.json();
      setRequests(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  }, [page, channelFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 상세 보기
  const handleViewDetail = (request: SendRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  // 날짜 포맷팅
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 필터 초기화
  const resetFilters = () => {
    setChannelFilter("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">총 발송 의뢰</p>
                <p className="text-xl font-semibold">{stats.total.toLocaleString()}건</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">성공</p>
                <p className="text-xl font-semibold text-green-600">
                  {stats.totalSuccess.toLocaleString()}건
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">실패</p>
                <p className="text-xl font-semibold text-red-600">
                  {stats.totalFail.toLocaleString()}건
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">성공률</p>
                <p className="text-xl font-semibold text-purple-600">
                  {stats.totalSuccess + stats.totalFail > 0
                    ? ((stats.totalSuccess / (stats.totalSuccess + stats.totalFail)) * 100).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 필터 영역 */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* 채널 필터 */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={channelFilter}
              onChange={(e) => {
                setChannelFilter(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 채널</option>
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* 상태 필터 */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 상태</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          {/* 날짜 필터 */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 초기화 & 새로고침 */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={resetFilters}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              필터 초기화
            </button>
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-red-500">
            {error}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
            <p>발송 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    발송일시
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    채널
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    메시지
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    총 건수
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    성공/실패
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => handleViewDetail(request)}
                  >
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(request.created_at)}
                      {request.scheduled_at && (
                        <span className="block text-xs text-gray-500">
                          (예약: {formatDate(request.scheduled_at)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          CHANNEL_COLORS[request.channel_type] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {CHANNEL_LABELS[request.channel_type] || request.channel_type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {request.message_preview || "-"}
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-medium">
                      {request.total_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-center text-sm">
                      <span className="text-green-600 font-medium">
                        {request.success_count.toLocaleString()}
                      </span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-red-600 font-medium">
                        {request.fail_count.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          request.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : request.status === "processing"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {STATUS_LABELS[request.status] || request.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(request);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {!isLoading && requests.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            총 {total.toLocaleString()}건 중 {(page - 1) * limit + 1}-
            {Math.min(page * limit, total)}건 표시
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 text-sm">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {selectedRequest && (
        <SendRequestDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedRequest(null);
          }}
          sendRequest={selectedRequest}
        />
      )}
    </div>
  );
};

export default SendHistoryTab;

