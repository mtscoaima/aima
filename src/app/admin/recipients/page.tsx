"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import "./styles.css";

interface Recipient {
  id: string;
  name: string;
  phone: string;
  email: string;
  segment: string;
  lastContact: string;
}

interface Segment {
  id: string;
  name: string;
  count: number;
}

export default function RecipientsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // 샘플 데이터
  const segments: Segment[] = [
    { id: "vip", name: "VIP 고객", count: 354 },
    { id: "new", name: "뉴스레터 구독자", count: 1278 },
    { id: "recent", name: "최근 가입자", count: 1023 },
    { id: "inactive", name: "장기 미접촉자", count: 3238 },
  ];

  const recipients: Recipient[] = [
    {
      id: "USR001",
      name: "홍길동",
      phone: "010-1234-5678",
      email: "gildong@example.com",
      segment: "VIP",
      lastContact: "2024-06-15",
    },
    {
      id: "USR002",
      name: "김영희",
      phone: "010-8765-4321",
      email: "younghee@example.com",
      segment: "신규회원",
      lastContact: "2024-06-20",
    },
    {
      id: "USR003",
      name: "이철수",
      phone: "010-1111-2222",
      email: "chulsoo@example.com",
      segment: "장기 미접촉",
      lastContact: "2023-12-01",
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSegmentClick = (segmentId: string) => {
    setSelectedSegment(segmentId);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch =
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.phone.includes(searchTerm);

    if (selectedSegment === "all") return matchesSearch;
    return matchesSearch && recipient.segment === selectedSegment;
  });

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="recipients-page">
        <div className="recipients-main-container">
          <div className="recipients-header">
            <h1>수신자 관리</h1>
            <button className="btn-primary add-recipient-btn">
              수신자 추가
            </button>
          </div>

          <div className="recipients-content-wrapper">
            {/* 수신자 세그먼트 카드 */}
            <div className="segments-card">
              <div className="segments-card-header">
                <div className="segments-title">
                  <span className="segments-icon">▼</span>
                  <h3>수신자 세그먼트</h3>
                </div>
                <p>조건 빌더로 세그먼트를 만들고 관리합니다.</p>
              </div>

              <div className="segments-card-content">
                <button className="create-segment-btn">
                  <span className="create-icon">⊕</span>새 세그먼트 만들기
                </button>

                <div className="segment-search">
                  <input
                    type="text"
                    placeholder="세그먼트 검색..."
                    className="segment-search-input"
                  />
                </div>

                <div className="segments-list">
                  {segments.map((segment) => (
                    <div
                      key={segment.id}
                      className={`segment-list-item ${
                        selectedSegment === segment.id ? "active" : ""
                      }`}
                      onClick={() => handleSegmentClick(segment.id)}
                    >
                      <span className="segment-name">{segment.name}</span>
                      <span className="segment-count">({segment.count}명)</span>
                    </div>
                  ))}
                </div>

                <div className="filter-section">
                  <h4>조건 필터 (UI 툴)</h4>
                  <div className="filter-controls">
                    <select className="filter-select">
                      <option>속성</option>
                      <option>이벤트</option>
                    </select>
                    <select className="filter-select">
                      <option>같음</option>
                      <option>포함</option>
                    </select>
                    <button className="filter-add-btn">조건 추가</button>
                  </div>
                </div>
              </div>
            </div>

            {/* 수신자 목록 카드 */}
            <div className="recipients-content">
              <div className="recipients-card-header">
                <h3>수신자 목록</h3>
                <div className="recipients-search">
                  <input
                    type="text"
                    placeholder="수신자 검색 (이름, 연락처, 이메일)"
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="recipients-table-container">
                <table className="recipients-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("id")}>
                        ID
                        {sortBy === "id" && (
                          <span className="sort-indicator">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort("name")}>
                        이름
                        {sortBy === "name" && (
                          <span className="sort-indicator">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort("phone")}>
                        연락처
                        {sortBy === "phone" && (
                          <span className="sort-indicator">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort("email")}>
                        이메일
                        {sortBy === "email" && (
                          <span className="sort-indicator">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort("segment")}>
                        세그먼트
                        {sortBy === "segment" && (
                          <span className="sort-indicator">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                      <th onClick={() => handleSort("lastContact")}>
                        최근 연락일
                        {sortBy === "lastContact" && (
                          <span className="sort-indicator">
                            {sortOrder === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipients.map((recipient) => (
                      <tr key={recipient.id}>
                        <td>{recipient.id}</td>
                        <td>{recipient.name}</td>
                        <td>{recipient.phone}</td>
                        <td>{recipient.email}</td>
                        <td>
                          <span className="segment-badge">
                            {recipient.segment}
                          </span>
                        </td>
                        <td>{recipient.lastContact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredRecipients.length === 0 && (
                  <div className="empty-state">
                    <p>검색 조건에 맞는 수신자가 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
