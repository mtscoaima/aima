"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, Search, FileText, Clock, MoreVertical } from "lucide-react";

interface LoadContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialActiveTab?: string;
  onSelect?: (content: { subject?: string; content: string; isAd?: boolean }) => void;
}

interface Template {
  id: number;
  name: string;
  content: string;
  subject?: string;
  created_at: string;
}

interface MessageLog {
  id: number;
  message_content: string;
  subject?: string;
  to_number: string;
  to_name?: string;
  message_type: string;
  sent_at: string;
}

const LoadContentModal: React.FC<LoadContentModalProps> = ({
  isOpen,
  onClose,
  initialActiveTab = "saved",
  onSelect,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [sortOldest, setSortOldest] = useState(false); // false: 최신순, true: 오래된순
  const [templates, setTemplates] = useState<Template[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch("/api/sms-templates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "템플릿 조회에 실패했습니다");
      }

      setTemplates(data.templates || []);
    } catch (err) {
      console.error("템플릿 조회 오류:", err);
      alert(err instanceof Error ? err.message : "템플릿 조회 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchMessageLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch("/api/message-logs?limit=20", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "발송 내역 조회에 실패했습니다");
      }

      setMessageLogs(data.logs || []);
    } catch (err) {
      console.error("발송 내역 조회 오류:", err);
      alert(err instanceof Error ? err.message : "발송 내역 조회 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialActiveTab);
      if (initialActiveTab === "saved") {
        fetchTemplates();
      } else if (initialActiveTab === "recent") {
        fetchMessageLogs();
      }
    }
  }, [isOpen, initialActiveTab, fetchTemplates, fetchMessageLogs]);

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openMenuId]);

  const handleSelectTemplate = (template: Template) => {
    if (onSelect) {
      onSelect({
        subject: template.subject,
        content: template.content,
        isAd: false,
      });
    }
    onClose();
  };

  const handleSelectLog = (log: MessageLog) => {
    if (onSelect) {
      onSelect({
        subject: log.subject,
        content: log.message_content,
        isAd: false,
      });
    }
    onClose();
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("이 템플릿을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch(`/api/sms-templates?id=${templateId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "템플릿 삭제에 실패했습니다");
      }

      // 목록에서 제거
      setTemplates(templates.filter(t => t.id !== templateId));
      setOpenMenuId(null);
      alert("템플릿이 삭제되었습니다.");
    } catch (err) {
      console.error("템플릿 삭제 오류:", err);
      alert(err instanceof Error ? err.message : "템플릿 삭제 중 오류가 발생했습니다");
    }
  };

  // 필터링 및 정렬
  const filteredTemplates = templates
    .filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOldest ? dateA - dateB : dateB - dateA; // 오래된순/최신순
    });

  const filteredLogs = messageLogs
    .filter(
      (log) =>
        log.message_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.to_name && log.to_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        log.to_number.includes(searchTerm)
    )
    .sort((a, b) => {
      const dateA = new Date(a.sent_at).getTime();
      const dateB = new Date(b.sent_at).getTime();
      return sortOldest ? dateA - dateB : dateB - dateA; // 오래된순/최신순
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">저장한 내용 불러오기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 및 필터 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="내용, 제목으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded text-sm"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={sortOldest}
                    onChange={(e) => setSortOldest(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className={`w-10 h-6 rounded-full transition-colors ${
                      sortOldest ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform translate-y-1 ${
                        sortOldest ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-600">오래된 순</span>
              </label>
            </div>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 ${
              activeTab === "saved"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("saved");
              if (templates.length === 0) {
                fetchTemplates();
              }
            }}
          >
            <FileText className="w-4 h-4" />
            저장 목록
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 ${
              activeTab === "recent"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              setActiveTab("recent");
              if (messageLogs.length === 0) {
                fetchMessageLogs();
              }
            }}
          >
            <Clock className="w-4 h-4" />
            최근 발송 목록
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
          {activeTab === "saved" && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">로딩 중...</p>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">저장된 내용이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between gap-4">
                        {/* 좌측: 타이틀, 제목, 내용 영역 */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                          {template.subject && (
                            <p className="text-sm text-gray-600 mb-1">
                              제목: {template.subject}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {template.content}
                          </p>
                        </div>
                        {/* 우측: 날짜, 버튼 영역 */}
                        <div className="flex flex-col gap-2 items-end flex-shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(template.created_at).toLocaleDateString()}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSelectTemplate(template)}
                              className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors whitespace-nowrap"
                            >
                              선택
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(openMenuId === template.id ? null : template.id);
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <MoreVertical className="w-4 h-4 text-gray-600" />
                              </button>
                              {openMenuId === template.id && (
                                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[100px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTemplate(template.id);
                                    }}
                                    className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    삭제하기
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {activeTab === "recent" && (
            <>
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">로딩 중...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-500">최근 발송 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between gap-4">
                        {/* 좌측: 수신자명/번호, 제목, 내용, 수신번호 영역 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">
                              {log.to_name || log.to_number}
                            </h3>
                            <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded">
                              {log.message_type}
                            </span>
                          </div>
                          {log.subject && (
                            <p className="text-sm text-gray-600 mb-1">
                              제목: {log.subject}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 line-clamp-2 mb-1">
                            {log.message_content}
                          </p>
                          <div className="text-xs text-gray-400">
                            수신번호: {log.to_number}
                          </div>
                        </div>
                        {/* 우측: 발송일시, 버튼 영역 */}
                        <div className="flex flex-col gap-2 items-end flex-shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {new Date(log.sent_at).toLocaleString()}
                          </span>
                          <button
                            onClick={() => handleSelectLog(log)}
                            className="px-4 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors whitespace-nowrap"
                          >
                            선택
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-end p-4 border-t bg-gray-50">
          <button
            onClick={() => router.push("/support?tab=contact")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            문의
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            닫기
            <span className="text-xs text-gray-400 ml-2">ESC</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadContentModal;