"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface Channel {
  id: number;
  name: string;
  isCustom: boolean;
  displayOrder: number;
}

interface ChannelSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (channelName: string) => void;
  selectedChannel: string;
}

export default function ChannelSelectModal({
  isOpen,
  onClose,
  onSelect,
  selectedChannel,
}: ChannelSelectModalProps) {
  const { getAccessToken } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 채널 목록 가져오기
  const fetchChannels = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch("/api/reservations/channels", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch channels");
      }

      const data = await response.json();
      setChannels(data.channels || []);
    } catch (err) {
      console.error("Error fetching channels:", err);
      setError("채널 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 모달이 열릴 때 채널 목록 가져오기
  useEffect(() => {
    if (isOpen) {
      fetchChannels();
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // 채널 선택
  const handleSelectChannel = (channelName: string) => {
    onSelect(channelName);
    onClose();
  };

  // 채널 추가 버튼 클릭
  const handleShowAddInput = () => {
    setShowAddInput(true);
    setNewChannelName("");
    setError(null);
  };

  // 채널 추가 취소
  const handleCancelAdd = () => {
    setShowAddInput(false);
    setNewChannelName("");
    setError(null);
  };

  // 커스텀 채널 추가
  const handleAddChannel = async () => {
    if (!newChannelName.trim()) {
      setError("채널명을 입력해주세요.");
      return;
    }

    try {
      setIsAdding(true);
      setError(null);
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch("/api/reservations/channels/custom", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelName: newChannelName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add channel");
      }

      // 성공: 채널 목록 새로고침
      await fetchChannels();
      setShowAddInput(false);
      setNewChannelName("");
    } catch (err) {
      console.error("Error adding channel:", err);
      setError(err instanceof Error ? err.message : "채널 추가에 실패했습니다.");
    } finally {
      setIsAdding(false);
    }
  };

  // 커스텀 채널 삭제
  const handleDeleteChannel = async (channelId: number) => {
    if (!confirm("이 채널을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setError(null);
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(
        `/api/reservations/channels/custom?id=${channelId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete channel");
      }

      // 성공: 채널 목록 새로고침
      await fetchChannels();
    } catch (err) {
      console.error("Error deleting channel:", err);
      setError(err instanceof Error ? err.message : "채널 삭제에 실패했습니다.");
    }
  };

  // Enter 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddChannel();
    } else if (e.key === "Escape") {
      handleCancelAdd();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-4 max-h-96 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">예약채널 선택</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 채널 목록 */}
        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">로딩 중...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">
              {error}
            </div>
          ) : (
            <>
              {channels.map((channel) => (
                <div
                  key={`${channel.isCustom ? "custom" : "system"}-${channel.id}`}
                  className={`w-full p-4 flex items-center justify-between border-b border-gray-50 last:border-b-0 transition-colors ${
                    channel.name === selectedChannel
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <button
                    onClick={() => handleSelectChannel(channel.name)}
                    className="flex-1 text-left"
                  >
                    {channel.name}
                  </button>

                  <div className="flex items-center space-x-2">
                    {/* 커스텀 채널 삭제 버튼 */}
                    {channel.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChannel(channel.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="삭제"
                      >
                        <svg
                          className="w-4 h-4 text-red-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    )}

                    {/* 선택된 채널 체크 표시 */}
                    {channel.name === selectedChannel && (
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* 채널 추가 섹션 */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {showAddInput ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="채널명 입력"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  disabled={isAdding}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddChannel}
                    disabled={isAdding || !newChannelName.trim()}
                    className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {isAdding ? "추가 중..." : "추가"}
                  </button>
                  <button
                    onClick={handleCancelAdd}
                    disabled={isAdding}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 transition-colors text-sm font-medium"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleShowAddInput}
                className="w-full text-blue-500 text-sm font-medium hover:text-blue-600 transition-colors flex items-center justify-center space-x-1"
              >
                <span>+</span>
                <span>채널 추가</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
