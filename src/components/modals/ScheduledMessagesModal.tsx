"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Clock, Trash2, Calendar } from "lucide-react";

interface ScheduledMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ScheduledMessage {
  id: number;
  to_number: string;
  to_name?: string;
  message_content: string;
  subject?: string;
  scheduled_at: string;
  status: string;
  message_type: string;
  created_at: string;
}

const ScheduledMessagesModal: React.FC<ScheduledMessagesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchScheduledMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch("/api/messages/scheduled", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "예약 메시지 조회에 실패했습니다");
      }

      setMessages(data.messages || []);
    } catch (err) {
      console.error("예약 메시지 조회 오류:", err);
      alert(err instanceof Error ? err.message : "예약 메시지 조회 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchScheduledMessages();
    }
  }, [isOpen, fetchScheduledMessages]);

  const handleCancelMessage = async (id: number) => {
    if (!confirm("예약을 취소하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch(`/api/messages/scheduled?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "예약 취소에 실패했습니다");
      }

      alert("예약이 취소되었습니다");
      fetchScheduledMessages(); // 목록 갱신
    } catch (err) {
      console.error("예약 취소 오류:", err);
      alert(err instanceof Error ? err.message : "예약 취소 중 오류가 발생했습니다");
    }
  };

  const handleSupportClick = () => {
    router.push("/support?tab=contact");
    onClose();
  };

  const filteredMessages = messages.filter((msg) => {
    const search = searchTerm.toLowerCase();
    return (
      msg.to_number.includes(search) ||
      msg.to_name?.toLowerCase().includes(search) ||
      msg.message_content.toLowerCase().includes(search)
    );
  });

  const formatDateTime = (dateString: string) => {
    // DB의 timestamp는 UTC 기준이므로 명시적으로 UTC로 파싱
    // 타임존 정보가 없으면 'Z'를 붙여서 UTC로 강제 파싱
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const utcDate = new Date(utcString);

    // 한국 시간은 UTC + 9시간
    const koreaDate = new Date(utcDate.getTime() + (9 * 60 * 60 * 1000));

    const year = koreaDate.getUTCFullYear();
    const month = String(koreaDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(koreaDate.getUTCDate()).padStart(2, '0');
    const hours = String(koreaDate.getUTCHours()).padStart(2, '0');
    const minutes = String(koreaDate.getUTCMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      pending: { text: "대기중", color: "bg-yellow-100 text-yellow-800" },
      sent: { text: "발송완료", color: "bg-green-100 text-green-800" },
      cancelled: { text: "취소됨", color: "bg-gray-100 text-gray-800" },
      failed: { text: "실패", color: "bg-red-100 text-red-800" },
    };

    const badge = statusMap[status] || { text: status, color: "bg-gray-100 text-gray-800" };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">예약 발송 내역</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 검색 영역 */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="수신번호, 이름, 내용으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* 목록 영역 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-gray-500">로딩 중...</div>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Calendar className="w-12 h-12 mb-2 text-gray-300" />
              <p>예약된 메시지가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* 좌측: 메시지 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">
                          {msg.to_name || "이름 없음"}
                        </span>
                        <span className="text-gray-500">({msg.to_number})</span>
                        {getStatusBadge(msg.status)}
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {msg.message_type}
                        </span>
                      </div>

                      {msg.subject && (
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          제목: {msg.subject}
                        </div>
                      )}

                      <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {msg.message_content}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          예약: {formatDateTime(msg.scheduled_at)}
                        </span>
                        <span>등록: {formatDateTime(msg.created_at)}</span>
                      </div>
                    </div>

                    {/* 우측: 취소 버튼 */}
                    {msg.status === "pending" && (
                      <button
                        onClick={() => handleCancelMessage(msg.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        취소
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleSupportClick}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            문의
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduledMessagesModal;
