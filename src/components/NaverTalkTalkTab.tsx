"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

const categories = [
  "추천",
  "카페/식음료",
  "병원",
  "학원",
  "뷰티/미용",
  "반려동물",
  "한식",
  "여행",
  "의류/패션",
  "과일",
  "리뷰",
];

interface Template {
  id: number;
  name: string;
  content: string;
  image_url: string;
  category: string;
  usage_count?: number;
  user_id?: number;
  created_at: string;
}

interface NaverTalkTalkTabProps {
  onNavigateToDetail: (templateId?: number, useTemplate?: boolean) => void;
}

export default function NaverTalkTalkTab({
  onNavigateToDetail,
}: NaverTalkTalkTabProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("추천");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 5;
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 템플릿 데이터 불러오기
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsTemplatesLoading(true);
        const url =
          selectedCategory === "추천"
            ? "/api/templates?category=추천"
            : `/api/templates?category=${encodeURIComponent(selectedCategory)}`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
          setFilteredTemplates(data.templates || []);
        }
      } catch (error) {
        console.error("템플릿 로딩 실패:", error);
      } finally {
        setIsTemplatesLoading(false);
      }
    };

    fetchTemplates();
    setCurrentPage(1);
  }, [selectedCategory]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowImageDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredTemplates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const endIndex = startIndex + templatesPerPage;
  const currentTemplates = filteredTemplates.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 끝 페이지가 maxVisiblePages보다 작으면 시작 페이지 조정
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 이전 버튼
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          className="pagination-btn prev-next"
          onClick={() => handlePageChange(currentPage - 1)}
        >
          이전
        </button>
      );
    }

    // 첫 페이지와 점점점
    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          className="pagination-btn"
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="ellipsis1" className="pagination-ellipsis">
            ...
          </span>
        );
      }
    }

    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          className={`pagination-btn ${currentPage === i ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // 마지막 페이지와 점점점
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="ellipsis2" className="pagination-ellipsis">
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={totalPages}
          className="pagination-btn"
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // 다음 버튼
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          className="pagination-btn prev-next"
          onClick={() => handlePageChange(currentPage + 1)}
        >
          다음
        </button>
      );
    }

    return <div className="pagination">{pages}</div>;
  };

  const handleStartChat = (message?: string) => {
    const messageToUse = message || inputValue.trim();

    if (!messageToUse) {
      alert("메시지를 입력해주세요.");
      return;
    }

    setIsLoading(true);

    // 세션 스토리지에 초기 메시지와 파일 정보 저장
    sessionStorage.setItem("initialMessage", messageToUse);

    if (selectedFile) {
      // 파일 정보를 세션 스토리지에 저장
      const fileInfo = {
        name: selectedFile.name,
        size: selectedFile.size,
        type: selectedFile.type,
        previewUrl: filePreviewUrl,
      };
      sessionStorage.setItem("initialFile", JSON.stringify(fileInfo));

      // 실제 파일은 FormData로 처리하기 위해 별도 저장
      const formData = new FormData();
      formData.append("file", selectedFile);
      // TODO: 실제 파일 업로드 API 호출 시 사용
    }

    // 상세 페이지로 이동
    setTimeout(() => {
      setIsLoading(false);
      onNavigateToDetail();
    }, 1000);
  };

  const handleQuickBadgeClick = (message: string) => {
    setInputValue(message);
    handleStartChat(message);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하로 선택해주세요.");
      return;
    }

    // 허용된 파일 형식 확인
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert(
        "지원하지 않는 파일 형식입니다.\n지원 형식: 이미지(JPG, PNG, GIF, WEBP), PDF, TXT, DOC, DOCX"
      );
      return;
    }

    setSelectedFile(file);

    // 이미지 파일인 경우 미리보기 생성
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl(null);
    }

    setShowImageDropdown(false);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
    setShowImageDropdown(false);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUseTemplate = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // 선택된 템플릿을 localStorage에 저장
      localStorage.setItem("selectedTemplate", JSON.stringify(template));

      // 상세 페이지로 이동 (템플릿 사용)
      onNavigateToDetail(templateId, true);
    }
  };

  return (
    <>
      <div className="landing-content">
        <div className="chat-bot-icon">
          <Image
            src="/images/ChatGPT.png"
            alt="AI 챗봇"
            width={120}
            height={120}
            className="robot-image"
          />
        </div>

        <h2>어떤 광고를 만들고 싶나요?</h2>

        {/* Input Section */}
        <div className="input-section">
          <div className="chat-input-container">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ex) 서울 홍대 헤어샵 오픈 행사 카페 50%할인 이벤트 홍보 여름 맞이 최대 50% 할인 이벤트 홍보 카페 시즌 음료 무료 시음 이벤트 안내"
              className="chat-input-field"
              rows={4}
            />

            {/* 첨부된 파일 미리보기 */}
            {selectedFile && (
              <div className="attached-file-preview">
                {filePreviewUrl ? (
                  <div className="file-preview-image">
                    <Image
                      src={filePreviewUrl}
                      alt="미리보기"
                      width={80}
                      height={60}
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                ) : (
                  <div className="file-preview-document">
                    <div className="file-icon">📄</div>
                    <div className="file-name">{selectedFile.name}</div>
                    <div className="file-size">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                )}
                <button
                  className="remove-file-btn"
                  onClick={handleRemoveFile}
                  title="파일 제거"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="input-controls">
              <div className="image-upload-wrapper" ref={dropdownRef}>
                <button
                  className="add-image-btn circle"
                  title="AI 및 파일 추가"
                  onClick={() => setShowImageDropdown(!showImageDropdown)}
                >
                  <span>+</span>
                </button>
                {showImageDropdown && (
                  <div className="image-dropdown">
                    <button
                      className="dropdown-item"
                      onClick={handleFileButtonClick}
                    >
                      📎 사진 및 파일 추가
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.txt,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
              </div>
              <div className="quick-start-badges">
                <button
                  className="quick-badge"
                  onClick={() =>
                    handleQuickBadgeClick("단골 고객을 위한 특별 이벤트")
                  }
                >
                  단골 이벤트
                </button>
                <button
                  className="quick-badge"
                  onClick={() =>
                    handleQuickBadgeClick("할인 이벤트 진행 중입니다")
                  }
                >
                  할인 이벤트
                </button>
                <button
                  className="quick-badge"
                  onClick={() =>
                    handleQuickBadgeClick("신규 고객 유치를 위한 특별 혜택")
                  }
                >
                  고객유치 이벤트
                </button>
              </div>
              <button
                className="start-chat-btn"
                onClick={() => handleStartChat()}
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? "생성 중..." : "생성"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Section */}
      <div className="template-section">
        <div className="template-header">
          <h2>템플릿으로 시작</h2>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-tab ${
                selectedCategory === category ? "active" : ""
              }`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {isTemplatesLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>템플릿을 불러오는 중...</p>
          </div>
        ) : currentTemplates.length === 0 ? (
          <div className="empty-state">
            <p>해당 카테고리의 템플릿이 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="templates-grid">
              {currentTemplates.map((template) => (
                <div key={template.id} className="template-card">
                  <div className="grand-opening-badge">GRAND OPENING</div>
                  <div className="template-image">
                    <Image
                      src={template.image_url || "/images/No Image"}
                      alt={template.name}
                      width={220}
                      height={150}
                      style={{ objectFit: "cover" }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = "<div>No Image</div>";
                        }
                      }}
                    />
                  </div>
                  <div className="template-content">
                    <h3 className="template-title">{template.name}</h3>
                    <p className="template-description">{template.content}</p>
                    <div className="template-actions">
                      <button
                        onClick={() => handleUseTemplate(template.id)}
                        className="action-button primary"
                      >
                        템플릿 사용하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {renderPagination()}
          </>
        )}
      </div>
    </>
  );
}
