"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  BarChart3,
  Tag,
  FileText,
  Send,
  RotateCcw,
  Clock,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";
import "./styles.css";

interface MessageHistory {
  id: string;
  createdAt: string;
  groupId: string;
  recipient: string;
  message: string;
  status: "success" | "failed" | "pending";
  sentAt: string;
  type: "전송요청내역" | "메시지목록";
  lastUpdate: string;
}

export default function MessageHistoryPage() {
  const [activeTab, setActiveTab] = useState<"전송요청내역" | "메시지목록">(
    "전송요청내역"
  );
  const [messages, setMessages] = useState<MessageHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [filters, setFilters] = useState({
    생성일: "",
    그룹상태: "사용자정렬하기",
    GroupID: "",
    접수건수: "",
    발송건수: "",
  });

  useEffect(() => {
    // 임시 데이터 로드
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const mockData: MessageHistory[] = [
          {
            id: "1",
            createdAt: "2024-01-15",
            groupId: "GRP001",
            recipient: "010-1234-5678",
            message: "안녕하세요! 새로운 이벤트 소식을 알려드립니다.",
            status: "success",
            sentAt: "2024-01-15 14:30:00",
            type: "전송요청내역",
            lastUpdate: "2024-01-15 14:30:00",
          },
          {
            id: "2",
            createdAt: "2024-01-15",
            groupId: "GRP002",
            recipient: "010-9876-5432",
            message: "할인 쿠폰이 발급되었습니다. 확인해보세요!",
            status: "success",
            sentAt: "2024-01-15 13:15:00",
            type: "전송요청내역",
            lastUpdate: "2024-01-15 13:15:00",
          },
          {
            id: "3",
            createdAt: "2024-01-15",
            groupId: "GRP003",
            recipient: "010-5555-1234",
            message: "배송이 완료되었습니다.",
            status: "failed",
            sentAt: "2024-01-15 12:00:00",
            type: "메시지목록",
            lastUpdate: "2024-01-15 12:00:00",
          },
        ];

        setMessages(mockData);
      } catch (error) {
        console.error("메시지 내역 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, []);

  const filteredMessages = messages.filter((msg) => msg.type === activeTab);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleExport = () => {
    // TODO: 엑셀 다운로드 기능 구현
  };

  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);

  return (
    <AdvertiserGuardWithDisabled>
      <div className="message-history-container">
        <div className="history-header">
          <h1>
            모든 발송 내역과 메시지 목록을 접수일로부터 6개월간 보관됩니다.
          </h1>
        </div>

        <div className="history-content">
          {/* 탭 메뉴 */}
          <div className="history-tabs">
            <button
              className={`tab-button ${
                activeTab === "전송요청내역" ? "active" : ""
              }`}
              onClick={() => setActiveTab("전송요청내역")}
            >
              전송요청내역
            </button>
            <button
              className={`tab-button ${
                activeTab === "메시지목록" ? "active" : ""
              }`}
              onClick={() => setActiveTab("메시지목록")}
            >
              메시지목록
            </button>
          </div>

          {/* 필터 섹션 */}
          <div className="filter-section">
            <div className="filter-header">
              <Filter size={16} className="filter-main-icon" />
              <span>필터</span>
            </div>
            <div className="filter-row">
              {activeTab === "전송요청내역" ? (
                <>
                  <div className="filter-group">
                    <Calendar className="filter-icon" size={16} />
                    <span className="filter-label">생성일</span>
                    <input
                      type="date"
                      className="filter-input"
                      value={filters.생성일}
                      onChange={(e) =>
                        setFilters({ ...filters, 생성일: e.target.value })
                      }
                    />
                  </div>
                  <div className="filter-group">
                    <BarChart3 className="filter-icon" size={16} />
                    <span className="filter-label">그룹상태</span>
                    <select
                      className="filter-select"
                      value={filters.그룹상태}
                      onChange={(e) =>
                        setFilters({ ...filters, 그룹상태: e.target.value })
                      }
                    >
                      <option value="사용자정렬하기">사용자정렬하기</option>
                      <option value="전체">전체</option>
                      <option value="성공">성공</option>
                      <option value="실패">실패</option>
                      <option value="대기중">대기중</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <Tag className="filter-icon" size={16} />
                    <span className="filter-label">Group ID</span>
                    <input
                      type="text"
                      className="filter-input"
                      placeholder="Group ID 입력"
                      value={filters.GroupID}
                      onChange={(e) =>
                        setFilters({ ...filters, GroupID: e.target.value })
                      }
                    />
                  </div>
                  <div className="filter-group">
                    <FileText className="filter-icon" size={16} />
                    <span className="filter-label">접수건수</span>
                    <input
                      type="number"
                      className="filter-input"
                      placeholder="건수"
                      value={filters.접수건수}
                      onChange={(e) =>
                        setFilters({ ...filters, 접수건수: e.target.value })
                      }
                    />
                  </div>
                  <div className="filter-group">
                    <Send className="filter-icon" size={16} />
                    <span className="filter-label">발송건수</span>
                    <input
                      type="number"
                      className="filter-input"
                      placeholder="건수"
                      value={filters.발송건수}
                      onChange={(e) =>
                        setFilters({ ...filters, 발송건수: e.target.value })
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="filter-group">
                    <Calendar className="filter-icon" size={16} />
                    <span className="filter-label">생성일</span>
                  </div>
                  <div className="filter-group">
                    <BarChart3 className="filter-icon" size={16} />
                    <span className="filter-label">메시지종류</span>
                  </div>
                  <div className="filter-group">
                    <Tag className="filter-icon" size={16} />
                    <span className="filter-label">수신번호</span>
                  </div>
                  <div className="filter-group">
                    <FileText className="filter-icon" size={16} />
                    <span className="filter-label">발신번호</span>
                  </div>
                  <div className="filter-group">
                    <Send className="filter-icon" size={16} />
                    <span className="filter-label">상태코드</span>
                  </div>
                  <div className="filter-group">
                    <Tag className="filter-icon" size={16} />
                    <span className="filter-label">Message ID</span>
                  </div>
                  <div className="filter-group">
                    <BarChart3 className="filter-icon" size={16} />
                    <span className="filter-label">Group ID</span>
                  </div>
                  <div className="filter-group">
                    <FileText className="filter-icon" size={16} />
                    <span className="filter-label">알림톡 템플릿 ID</span>
                  </div>
                </>
              )}
              <button className="filter-reset-btn">모두 제거</button>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="action-buttons">
            <button className="action-btn refresh-btn" onClick={handleRefresh}>
              <RotateCcw size={16} />
              새로고침
            </button>
            {activeTab === "메시지목록" ? (
              <>
                <button className="action-btn status-btn success">
                  <span className="status-indicator"></span>
                  발송성공건
                </button>
                <button className="action-btn status-btn failed">
                  <span className="status-indicator"></span>
                  발송실패건
                </button>
                <button className="action-btn status-btn pending">
                  <span className="status-indicator"></span>
                  발송불가건
                </button>
                <button className="action-btn export-btn">
                  <Clock size={16} />
                  CSV 내보내기
                </button>
              </>
            ) : (
              <button className="action-btn export-btn" onClick={handleExport}>
                <Clock size={16} />
                예약대기건
              </button>
            )}
          </div>

          {/* 테이블 헤더 */}
          <div className="table-container">
            <div
              className={`table-header ${
                activeTab === "메시지목록" ? "message-list-grid" : ""
              }`}
            >
              {activeTab === "전송요청내역" ? (
                <>
                  <div className="header-cell">
                    생성일 <HelpCircle size={14} />
                  </div>
                  <div className="header-cell">
                    상태 <HelpCircle size={14} />
                  </div>
                  <div className="header-cell">
                    타입 <HelpCircle size={14} />
                  </div>
                  <div className="header-cell">
                    현황 <HelpCircle size={14} />
                  </div>
                  <div className="header-cell">최근 업데이트</div>
                </>
              ) : (
                <>
                  <div className="header-cell">
                    생성일 <HelpCircle size={14} />
                  </div>
                  <div className="header-cell">타입</div>
                  <div className="header-cell">발신번호</div>
                  <div className="header-cell">수신번호</div>
                  <div className="header-cell">상태코드</div>
                  <div className="header-cell">비고</div>
                  <div className="header-cell">내용</div>
                </>
              )}
            </div>

            {/* 테이블 내용 */}
            {isLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  <p>목록을 불러오는 중...</p>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="empty-container">
                <div className="empty-message">목록이 없습니다.</div>
              </div>
            ) : (
              <div className="table-body">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`table-row ${
                      activeTab === "메시지목록" ? "message-list-grid" : ""
                    }`}
                  >
                    {activeTab === "전송요청내역" ? (
                      <>
                        <div className="table-cell">{message.createdAt}</div>
                        <div className="table-cell">
                          <span
                            className={`status-badge status-${message.status}`}
                          >
                            {message.status === "success"
                              ? "성공"
                              : message.status === "failed"
                              ? "실패"
                              : "대기중"}
                          </span>
                        </div>
                        <div className="table-cell">{message.type}</div>
                        <div className="table-cell">{message.groupId}</div>
                        <div className="table-cell">{message.lastUpdate}</div>
                      </>
                    ) : (
                      <>
                        <div className="table-cell">{message.createdAt}</div>
                        <div className="table-cell">SMS</div>
                        <div className="table-cell">010-1234-5678</div>
                        <div className="table-cell">{message.recipient}</div>
                        <div className="table-cell">
                          <span
                            className={`status-badge status-${message.status}`}
                          >
                            {message.status === "success"
                              ? "성공"
                              : message.status === "failed"
                              ? "실패"
                              : "대기중"}
                          </span>
                        </div>
                        <div className="table-cell">-</div>
                        <div className="table-cell message-content-cell">
                          {message.message.length > 20
                            ? `${message.message.substring(0, 20)}...`
                            : message.message}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 하단 페이지네이션 */}
          <div className="bottom-pagination">
            <div className="pagination-info">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="items-per-page-select"
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
              <span className="page-info">
                {currentPage} / {totalPages}
              </span>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdvertiserGuardWithDisabled>
  );
}
