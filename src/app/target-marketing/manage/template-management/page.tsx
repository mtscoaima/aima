"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AdvertiserGuard } from "@/components/RoleGuard";
import "./styles.css";

// 템플릿 타입 정의
interface Template {
  id: string;
  title: string;
  createdAt: string;
  lastModified: string;
  imageUrl?: string;
  status: "active" | "inactive";
  type: "target" | "message";
}

export default function TemplateManagementPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "title">("newest");
  const [isLoading, setIsLoading] = useState(true);

  // 템플릿 데이터 불러오기 (실제로는 API 연동 필요)
  useEffect(() => {
    // 데모 데이터
    const demoTemplates: Template[] = [
      {
        id: "1",
        title: "여름 시즌 프로모션",
        createdAt: "2023-06-15T12:30:00",
        lastModified: "2023-06-16T09:15:00",
        status: "active",
        type: "target",
      },
      {
        id: "2",
        title: "신규 고객 할인 안내",
        createdAt: "2023-05-20T14:45:00",
        lastModified: "2023-05-25T11:20:00",
        imageUrl:
          "https://images.unsplash.com/photo-1556742212-5b321f3c261b?w=600&auto=format&fit=crop&q=60",
        status: "active",
        type: "target",
      },
      {
        id: "3",
        title: "겨울 상품 프로모션",
        createdAt: "2023-04-10T10:00:00",
        lastModified: "2023-04-12T16:30:00",
        imageUrl:
          "https://images.unsplash.com/photo-1513001900722-370f803f498d?w=600&auto=format&fit=crop&q=60",
        status: "inactive",
        type: "target",
      },
      {
        id: "4",
        title: "회원 안내 메시지",
        createdAt: "2023-03-22T09:15:00",
        lastModified: "2023-03-22T09:15:00",
        status: "active",
        type: "message",
      },
      {
        id: "5",
        title: "특별 이벤트 알림",
        createdAt: "2023-02-05T15:20:00",
        lastModified: "2023-02-06T11:40:00",
        imageUrl:
          "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=600&auto=format&fit=crop&q=60",
        status: "inactive",
        type: "target",
      },
    ];

    // 데이터 로딩 지연 효과 (실제 구현에서는 제거)
    setTimeout(() => {
      setTemplates(demoTemplates);
      setIsLoading(false);
    }, 1000);
  }, []);

  // 필터링된 템플릿 목록
  const filteredTemplates = templates
    .filter((template) => {
      // 검색어 필터링
      const matchesSearch = template.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // 상태 필터링
      const matchesFilter =
        filter === "all" ||
        (filter === "active" && template.status === "active") ||
        (filter === "inactive" && template.status === "inactive");

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      // 정렬
      if (sort === "newest") {
        return (
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime()
        );
      } else if (sort === "oldest") {
        return (
          new Date(a.lastModified).getTime() -
          new Date(b.lastModified).getTime()
        );
      } else {
        return a.title.localeCompare(b.title);
      }
    });

  // 템플릿 삭제 핸들러
  const handleDeleteTemplate = (id: string) => {
    if (window.confirm("정말 이 템플릿을 삭제하시겠습니까?")) {
      // 실제로는 API 호출 필요
      setTemplates((prev) => prev.filter((template) => template.id !== id));
    }
  };

  // 템플릿 상태 토글
  const handleToggleStatus = (id: string) => {
    setTemplates((prev) =>
      prev.map((template) => {
        if (template.id === id) {
          return {
            ...template,
            status: template.status === "active" ? "inactive" : "active",
          };
        }
        return template;
      })
    );
  };

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(date.getDate()).padStart(2, "0")}`;
  };

  // 토글 스위치 렌더링
  const renderToggleSwitch = (id: string, status: string) => {
    const isActive = status === "active";

    return (
      <div className="toggle-switch" onClick={() => handleToggleStatus(id)}>
        <div className={`toggle-slider ${isActive ? "active" : ""}`}></div>
      </div>
    );
  };

  return (
    <AdvertiserGuard>
      <div className="template-management-container">
        <div className="management-header">
          <h1>템플릿 관리</h1>
          <p>타겟마케팅에 사용할 템플릿을 관리하고 수정하세요</p>
        </div>

        <div className="controls-container">
          <div className="search-filter-container">
            <div className="search-box">
              <input
                type="text"
                placeholder="템플릿 이름 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-button">
                <span className="search-icon">🔍</span>
              </button>
            </div>

            <div className="filter-controls">
              <select
                value={filter}
                onChange={(e) =>
                  setFilter(e.target.value as "all" | "active" | "inactive")
                }
                className="filter-select"
              >
                <option value="all">모든 상태</option>
                <option value="active">활성화</option>
                <option value="inactive">비활성화</option>
              </select>

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value as "newest" | "oldest" | "title")
                }
                className="sort-select"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="title">이름순</option>
              </select>
            </div>
          </div>

          <Link href="/target-marketing/send/create-template">
            <button className="create-button">
              <span className="plus-icon">+</span> 새 템플릿 만들기
            </button>
          </Link>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">
              <p>템플릿 로딩 중...</p>
            </div>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="templates-grid">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className={`template-card ${
                  template.status === "inactive"
                    ? "inactive-template"
                    : "active-template"
                }`}
              >
                <div className="template-image">
                  {template.imageUrl ? (
                    <Image
                      src={template.imageUrl}
                      alt={template.title}
                      width={300}
                      height={200}
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div className="no-image">
                      <div className="no-image-icon">📄</div>
                      <p>이미지 없음</p>
                    </div>
                  )}
                </div>
                <div className="template-info">
                  <h3>{template.title}</h3>
                  <div className="template-meta">
                    <span className="template-date">
                      작성일: {formatDate(template.createdAt)}
                    </span>
                    <span className="template-type">
                      {template.type === "target" ? "타겟마케팅" : "문자메시지"}
                    </span>
                  </div>
                </div>
                <div className="template-actions">
                  <div className="toggle-container">
                    <span className="status-label">활성화</span>
                    {renderToggleSwitch(template.id, template.status)}
                  </div>
                  <div className="button-container">
                    <Link
                      href={`/target-marketing/send/create-template?edit=${template.id}`}
                    >
                      <button className="edit-button">수정</button>
                    </Link>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteTemplate(template.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
                {template.status === "inactive" && (
                  <div className="inactive-overlay"></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="no-templates">
            <p>검색 결과가 없습니다.</p>
            <p>새 템플릿을 만들거나 검색 조건을 변경해보세요.</p>
          </div>
        )}
      </div>
    </AdvertiserGuard>
  );
}
