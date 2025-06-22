"use client";

import React, { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import "./styles.css";

interface Message {
  id: string;
  type: "SMS" | "Email" | "Kakao";
  recipient: string;
  content: string;
  status: "성공" | "실패" | "대기";
  sentAt: string;
  result: string;
}

export default function MessageManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // 필터 상태
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    status: "",
    type: "",
    searchTerm: "",
  });

  // 샘플 데이터
  useEffect(() => {
    const sampleMessages: Message[] = [
      {
        id: "MSG-20240620-001",
        type: "SMS",
        recipient: "010-1234-5678",
        content: "고객님, 이벤트에 대한 특별 할인...",
        status: "성공",
        sentAt: "2024-06-20 10:30",
        result: "성공",
      },
      {
        id: "MSG-20240620-002",
        type: "Email",
        recipient: "test@example.com",
        content: "주간 뉴스레터입니다.",
        status: "실패",
        sentAt: "2024-06-20 09:15",
        result: "실패",
      },
      {
        id: "MSG-20240619-003",
        type: "Kakao",
        recipient: "친구톡ID",
        content: "이벤트 안내 메시지입니다.",
        status: "성공",
        sentAt: "2024-06-19 17:45",
        result: "성공",
      },
      {
        id: "MSG-20240619-004",
        type: "SMS",
        recipient: "010-8765-4321",
        content: "예약 확인: 내일 오전 10시 예약이...",
        status: "대기",
        sentAt: "2024-06-19 15:00",
        result: "대기",
      },
      {
        id: "MSG-20240618-005",
        type: "Email",
        recipient: "another@example.com",
        content: "회원가입을 축하합니다!",
        status: "성공",
        sentAt: "2024-06-18 11:20",
        result: "성공",
      },
    ];
    setMessages(sampleMessages);
    setFilteredMessages(sampleMessages);
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = messages;

    if (filters.startDate) {
      filtered = filtered.filter((msg) => msg.sentAt >= filters.startDate);
    }
    if (filters.endDate) {
      filtered = filtered.filter((msg) => msg.sentAt <= filters.endDate);
    }
    if (filters.status) {
      filtered = filtered.filter((msg) => msg.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter((msg) => msg.type === filters.type);
    }
    if (filters.searchTerm) {
      filtered = filtered.filter(
        (msg) =>
          msg.recipient.includes(filters.searchTerm) ||
          msg.content.includes(filters.searchTerm) ||
          msg.id.includes(filters.searchTerm)
      );
    }

    setFilteredMessages(filtered);
    setCurrentPage(1);
  }, [filters, messages]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMessages = filteredMessages.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    // 검색 버튼 클릭 시 필터 적용 (이미 useEffect에서 처리됨)
  };

  const handleResend = () => {
    // 재발송 로직
    console.log("Resend selected messages");
  };

  const handleDelete = () => {
    // 삭제 로직
    console.log("Delete selected messages");
  };

  const handleExportCSV = () => {
    // CSV 다운로드 로직
    console.log("Export to CSV");
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "성공":
        return "status-success";
      case "실패":
        return "status-error";
      case "대기":
        return "status-pending";
      default:
        return "";
    }
  };

  return (
    <AdminGuard>
      <div className="admin-layout">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="admin-main-content">
          <div className="message-management-page">
            <div className="page-header">
              <h1>메시지 관리</h1>
            </div>

            {/* 검색 및 필터 섹션 */}
            <div className="filter-section">
              <div className="filter-header">
                <h3>검색 및 필터</h3>
                <p>
                  기간, 채널, 상태, 키워드로 메시지를 검색하고 필터링합니다.
                </p>
              </div>

              <div className="filter-controls">
                <div className="filter-row">
                  <div className="date-range">
                    <div className="date-input-group">
                      <label>시작일-종료일</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) =>
                          handleFilterChange("startDate", e.target.value)
                        }
                      />
                    </div>
                    <span className="date-separator">-</span>
                    <div className="date-input-group">
                      <label>시작일-종료일</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) =>
                          handleFilterChange("endDate", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="select-group">
                    <label>채널 선택</label>
                    <select
                      value={filters.type}
                      onChange={(e) =>
                        handleFilterChange("type", e.target.value)
                      }
                    >
                      <option value="">전체</option>
                      <option value="SMS">SMS</option>
                      <option value="Email">Email</option>
                      <option value="Kakao">Kakao</option>
                    </select>
                  </div>

                  <div className="select-group">
                    <label>상태 선택</label>
                    <select
                      value={filters.status}
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                    >
                      <option value="">전체</option>
                      <option value="성공">성공</option>
                      <option value="실패">실패</option>
                      <option value="대기">대기</option>
                    </select>
                  </div>
                </div>

                <div className="search-row">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="키워드 검색 (내용, 수신자 등)"
                      value={filters.searchTerm}
                      onChange={(e) =>
                        handleFilterChange("searchTerm", e.target.value)
                      }
                      className="search-input"
                    />
                  </div>
                  <button className="search-btn" onClick={handleSearch}>
                    검색
                  </button>
                </div>
              </div>
            </div>

            {/* 메시지 목록 섹션 */}
            <div className="message-list-section">
              <div className="list-header">
                <h3>메시지 목록</h3>
                <div className="list-actions">
                  <button
                    className="action-btn resend-btn"
                    onClick={handleResend}
                  >
                    재발송
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={handleDelete}
                  >
                    삭제
                  </button>
                  <button
                    className="action-btn export-btn"
                    onClick={handleExportCSV}
                  >
                    CSV 다운로드
                  </button>
                </div>
              </div>

              <div className="message-table-container">
                <table className="message-table">
                  <thead>
                    <tr>
                      <th>메시지 ID</th>
                      <th>채널</th>
                      <th>수신자</th>
                      <th>내용 (일부)</th>
                      <th>상태</th>
                      <th>발송일시</th>
                      <th>액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMessages.map((message) => (
                      <tr key={message.id}>
                        <td>{message.id}</td>
                        <td>
                          <span
                            className={`channel-badge ${message.type.toLowerCase()}`}
                          >
                            {message.type}
                          </span>
                        </td>
                        <td>{message.recipient}</td>
                        <td className="content-cell">{message.content}</td>
                        <td>
                          <span
                            className={`status-badge ${getStatusClass(
                              message.status
                            )}`}
                          >
                            {message.status}
                          </span>
                        </td>
                        <td>{message.sentAt}</td>
                        <td className="action-cell">
                          <button className="action-detail-btn">상세</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              <div className="pagination">
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      className={`pagination-btn ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>

              <div className="table-footer">
                <p>
                  * 메시지 상세 보기는 클릭하면 Drawer 형태로 열리며,
                  메타데이터, 발송 결과 등 상세 정보를 제공합니다.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
