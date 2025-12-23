"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  User,
  Phone,
  Clock,
  AlertCircle,
} from "lucide-react";

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

interface MessageLog {
  id: number;
  to_number: string;
  to_name: string | null;
  message_content: string;
  message_type: string;
  status: string;
  sent_at: string | null;
  error_message: string | null;
  credit_used: number;
  metadata: {
    mts_msg_id?: string;
    error_code?: string;
    [key: string]: unknown;
  };
}

interface SendRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sendRequest: SendRequest;
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

const SendRequestDetailModal: React.FC<SendRequestDetailModalProps> = ({
  isOpen,
  onClose,
  sendRequest,
}) => {
  const [messages, setMessages] = useState<MessageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [statusFilter, setStatusFilter] = useState<string>("");

  // 페이지네이션
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // 선택된 메시지 (상세 보기용)
  const [selectedMessage, setSelectedMessage] = useState<MessageLog | null>(null);

  // 데이터 조회
  const fetchMessages = useCallback(async () => {
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

      if (statusFilter) params.append("status", statusFilter);

      const response = await fetch(`/api/send-requests/${sendRequest.id}?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("데이터 조회에 실패했습니다.");
      }

      const data = await response.json();
      setMessages(data.messages?.data || []);
      setTotal(data.messages?.pagination?.total || 0);
      setTotalPages(data.messages?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류");
    } finally {
      setIsLoading(false);
    }
  }, [sendRequest.id, page, statusFilter]);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
    }
  }, [isOpen, fetchMessages]);

  // 날짜 포맷팅
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 전화번호 포맷팅
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };

  // 클립보드 복사
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: 토스트 메시지
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col relative" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">발송 상세</h2>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              {CHANNEL_LABELS[sendRequest.channel_type] || sendRequest.channel_type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 요약 정보 */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">발송일시</p>
              <p className="text-sm font-medium">{formatDate(sendRequest.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">총 건수</p>
              <p className="text-sm font-medium">{sendRequest.total_count.toLocaleString()}건</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">성공</p>
              <p className="text-sm font-medium text-green-600">
                {sendRequest.success_count.toLocaleString()}건
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">실패</p>
              <p className="text-sm font-medium text-red-600">
                {sendRequest.fail_count.toLocaleString()}건
              </p>
            </div>
          </div>
          {sendRequest.message_preview && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-1">메시지 미리보기</p>
              <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border whitespace-pre-wrap">
                {sendRequest.message_preview}
              </p>
            </div>
          )}
        </div>

        {/* 필터 */}
        <div className="px-6 py-3 border-b flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 상태</option>
            <option value="sent">성공</option>
            <option value="failed">실패</option>
          </select>
          <span className="text-sm text-gray-500">
            총 {total.toLocaleString()}건
          </span>
        </div>

        {/* 메시지 목록 */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 350px)" }}>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-red-500">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-500">
              메시지 내역이 없습니다.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    수신자
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    전화번호
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    발송시간
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    메시지 ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    에러
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {messages.map((msg) => (
                  <tr
                    key={msg.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedMessage(msg)}
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {msg.to_name || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {formatPhone(msg.to_number)}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(msg.to_number);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="복사"
                        >
                          <Copy className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {msg.status === "sent" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          성공
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" />
                          실패
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        {formatDate(msg.sent_at)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {msg.metadata?.mts_msg_id ? (
                        <span className="font-mono text-xs">
                          {String(msg.metadata.mts_msg_id).substring(0, 12)}...
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {msg.error_message ? (
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="truncate max-w-md" title={msg.error_message}>
                            {msg.metadata?.error_code && `[${msg.metadata.error_code}] `}
                            {msg.error_message}
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        {!isLoading && messages.length > 0 && (
          <div className="px-6 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {(page - 1) * limit + 1}-{Math.min(page * limit, total)} / {total.toLocaleString()}건
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 text-sm">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 메시지 상세 패널 (선택 시) */}
        {selectedMessage && (
          <div className="absolute inset-0 bg-white flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-semibold">메시지 상세</h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">수신자</p>
                  <p className="font-medium">{selectedMessage.to_name || "-"}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">전화번호</p>
                  <p className="font-medium">{formatPhone(selectedMessage.to_number)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">상태</p>
                  <p className={`font-medium ${selectedMessage.status === "sent" ? "text-green-600" : "text-red-600"}`}>
                    {selectedMessage.status === "sent" ? "성공" : "실패"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">발송시간</p>
                  <p className="font-medium">{formatDate(selectedMessage.sent_at)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">크레딧 사용</p>
                  <p className="font-medium">{selectedMessage.credit_used}원</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">메시지 ID</p>
                  <p className="font-mono text-sm">{selectedMessage.metadata?.mts_msg_id || "-"}</p>
                </div>
              </div>

              {selectedMessage.error_message && (
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-600 mb-1">에러 메시지</p>
                  <p className="text-red-700">
                    {selectedMessage.metadata?.error_code && `[${selectedMessage.metadata.error_code}] `}
                    {selectedMessage.error_message}
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-2">메시지 내용</p>
                <div className="bg-white border rounded-lg p-4 whitespace-pre-wrap text-sm">
                  {selectedMessage.message_content}
                </div>
              </div>

              {selectedMessage.metadata && Object.keys(selectedMessage.metadata).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-2">메타데이터</p>
                  <pre className="bg-white border rounded-lg p-4 text-xs overflow-x-auto">
                    {JSON.stringify(selectedMessage.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendRequestDetailModal;

