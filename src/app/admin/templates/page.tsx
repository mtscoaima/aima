"use client";

import React, { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import "./styles.css";

interface Template {
  id: string;
  name: string;
  type: "SMS" | "Email" | "Kakao";
  status: "활성" | "비활성" | "검수중";
  createdAt: string;
  isApproved: "Yes" | "No";
}

export default function TemplateManagementPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  // 샘플 데이터
  useEffect(() => {
    const sampleTemplates: Template[] = [
      {
        id: "TPL001",
        name: "회원가입 환영 (SMS)",
        type: "SMS",
        status: "활성",
        createdAt: "2024-06-18",
        isApproved: "Yes",
      },
      {
        id: "TPL002",
        name: "주간 프로모션 (Email)",
        type: "Email",
        status: "검수중",
        createdAt: "2024-06-20",
        isApproved: "No",
      },
      {
        id: "TPL003",
        name: "주문 완료 알림 (Kakao)",
        type: "Kakao",
        status: "활성",
        createdAt: "2024-05-30",
        isApproved: "No",
      },
      {
        id: "TPL004",
        name: "비밀번호 재설정 (Email)",
        type: "Email",
        status: "비활성",
        createdAt: "2024-06-15",
        isApproved: "Yes",
      },
    ];
    setTemplates(sampleTemplates);
    setFilteredTemplates(sampleTemplates);
  }, []);

  // 검색 필터링
  useEffect(() => {
    let filtered = templates;

    if (searchTerm) {
      filtered = filtered.filter(
        (template) =>
          template.name.includes(searchTerm) ||
          template.id.includes(searchTerm) ||
          template.type.includes(searchTerm)
      );
    }

    setFilteredTemplates(filtered);
    setCurrentPage(1);
  }, [searchTerm, templates]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTemplates = filteredTemplates.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTemplates.length === currentTemplates.length) {
      setSelectedTemplates([]);
    } else {
      setSelectedTemplates(currentTemplates.map((t) => t.id));
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "활성":
        return "status-active";
      case "비활성":
        return "status-inactive";
      case "검수중":
        return "status-pending";
      default:
        return "";
    }
  };

  const getTypeClass = (type: string) => {
    switch (type) {
      case "SMS":
        return "type-sms";
      case "Email":
        return "type-email";
      case "Kakao":
        return "type-kakao";
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
          <div className="template-management-page">
            {/* 메인 콘텐츠 */}
            <div className="template-main-content">
              <div className="page-header">
                <h1>템플릿 관리</h1>
                <button className="btn-add-template">세 템플릿 만들기</button>
              </div>

              <div className="template-content-wrapper">
                {/* 사이드바 카테고리 */}
                <div className="template-sidebar">
                  <div className="sidebar-header">
                    <h2>템플릿 카테고리</h2>
                    <p>드래그 & 드롭으로 관리 (예정)</p>
                  </div>
                  <div className="category-list">
                    <div className="category-item">
                      <span className="category-name">전체 (4)</span>
                    </div>
                    <div className="category-item">
                      <span className="category-name">회원관리</span>
                    </div>
                    <div className="category-item">
                      <span className="category-name">마케팅</span>
                    </div>
                    <div className="category-item">
                      <span className="category-name">주문/배송</span>
                    </div>
                    <div className="category-item">
                      <span className="category-name">계정</span>
                    </div>
                    <div className="category-item">
                      <span className="category-name">공지사항</span>
                    </div>
                  </div>
                </div>

                {/* 템플릿 콘텐츠 */}
                <div className="template-content">
                  {/* 템플릿 목록 섹션 */}
                  <div className="template-list-section">
                    <div className="list-header">
                      <h3>템플릿 목록</h3>
                      <div className="search-wrapper">
                        <input
                          type="text"
                          placeholder="템플릿 검색..."
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="search-input"
                        />
                      </div>
                    </div>

                    <div className="template-table-container">
                      <table className="template-table">
                        <thead>
                          <tr>
                            <th>
                              <input
                                type="checkbox"
                                checked={
                                  selectedTemplates.length ===
                                    currentTemplates.length &&
                                  currentTemplates.length > 0
                                }
                                onChange={handleSelectAll}
                              />
                            </th>
                            <th>ID</th>
                            <th>템플릿명</th>
                            <th>채널</th>
                            <th>상태</th>
                            <th>최종수정일</th>
                            <th>AI 생성</th>
                            <th>액션</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentTemplates.map((template) => (
                            <tr key={template.id}>
                              <td>
                                <input
                                  type="checkbox"
                                  checked={selectedTemplates.includes(
                                    template.id
                                  )}
                                  onChange={() =>
                                    handleSelectTemplate(template.id)
                                  }
                                />
                              </td>
                              <td>{template.id}</td>
                              <td className="template-name-cell">
                                {template.name}
                              </td>
                              <td>
                                <span
                                  className={`type-badge ${getTypeClass(
                                    template.type
                                  )}`}
                                >
                                  {template.type}
                                </span>
                              </td>
                              <td>
                                <span
                                  className={`status-badge ${getStatusClass(
                                    template.status
                                  )}`}
                                >
                                  {template.status}
                                </span>
                              </td>
                              <td>{template.createdAt}</td>
                              <td>{template.isApproved}</td>
                              <td className="action-cell">
                                <button className="action-btn edit-btn">
                                  ✏️
                                </button>
                                <button className="action-btn copy-btn">
                                  📋
                                </button>
                                <button className="action-btn delete-btn">
                                  🗑️
                                </button>
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
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        이전
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => (
                        <button
                          key={i + 1}
                          className={`pagination-btn ${
                            currentPage === i + 1 ? "active" : ""
                          }`}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        className="pagination-btn"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        다음
                      </button>
                    </div>

                    <div className="table-footer">
                      <p>
                        * 새 템플릿 만들기 또는 수정 버튼 클릭 시 WYSIWYG 편집기
                        호출됩니다. 텍스트 형식 버튼 호출 시 텍스트 형식 모달이
                        호출됩니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
