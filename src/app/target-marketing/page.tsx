"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Layout, ImageIcon, X } from "lucide-react";
import { AdvertiserGuard } from "@/components/RoleGuard";
import "./styles.css";

interface Template {
  id: number;
  name: string;
  content: string;
  image_url: string;
  category: string;
  created_at: string;
  usage_count: number;
  is_private: boolean;
  is_owner: boolean;
  user_id?: number;
  isPopular?: boolean;
}

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

export default function TargetMarketingPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 템플릿 관련 상태
  const [selectedCategory, setSelectedCategory] = useState("추천");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 5;

  // 템플릿 수정/생성 모달 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    content: "",
    category: "",
    is_private: false,
  });
  const [createFormData, setCreateFormData] = useState({
    name: "",
    content: "",
    category: "카페/식음료",
    is_private: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 에러 처리 함수
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    const fallbackImages = [
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop&crop=center&auto=format&q=60",
      "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop&crop=center&auto=format&q=60",
      "https://picsum.photos/300/200?random=1",
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==",
    ];

    const currentSrc = target.src;
    const currentIndex = fallbackImages.findIndex((img) =>
      currentSrc.includes(img.split("?")[0])
    );

    if (currentIndex < fallbackImages.length - 1) {
      target.src = fallbackImages[currentIndex + 1];
    }
  };

  // 템플릿 데이터 불러오기
  const fetchTemplates = async (category: string) => {
    try {
      setIsTemplatesLoading(true);
      setCurrentPage(1); // 카테고리 변경 시 첫 페이지로 리셋

      // 로컬 스토리지에서 토큰 가져오기
      const token = localStorage.getItem("accessToken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // 토큰이 있으면 Authorization 헤더 추가
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `/api/templates?category=${encodeURIComponent(category)}`,
        {
          method: "GET",
          headers,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const templatesWithPopular = data.templates.map(
          (template: Template) => ({
            ...template,
            isPopular: category === "추천", // 추천 카테고리의 템플릿들은 인기 템플릿으로 표시
          })
        );
        setTemplates(templatesWithPopular);
      } else {
        console.error("Failed to fetch templates");
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    } finally {
      setIsTemplatesLoading(false);
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchTemplates(selectedCategory);
  }, [selectedCategory]);

  const handleStartChat = async () => {
    if (!inputValue.trim()) return;

    setIsLoading(true);

    try {
      // 고유한 채팅 ID 생성
      const chatId = Date.now().toString();

      // 초기 메시지를 세션 스토리지에 저장
      console.log("세션 스토리지에 저장할 메시지:", inputValue);
      sessionStorage.setItem("initialMessage", inputValue);
      console.log("세션 스토리지 저장 완료");

      // 동적 라우트로 이동
      router.push(`/target-marketing/${chatId}`);
    } catch (error) {
      console.error("채팅 시작 중 오류:", error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleStartChat();
    }
  };

  const handleUseTemplate = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      // 템플릿 데이터를 localStorage에 저장
      localStorage.setItem(
        "selectedTemplate",
        JSON.stringify({
          id: template.id,
          name: template.name,
          content: template.content,
          image_url: template.image_url,
          category: template.category,
        })
      );

      // 고유한 채팅 ID 생성
      const chatId = Date.now().toString();

      // target-marketing/[id] 페이지로 리다이렉트
      router.push(`/target-marketing/${chatId}?useTemplate=true`);
    }
  };

  const handleEditTemplate = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setEditingTemplate(template);
      setEditFormData({
        name: template.name,
        content: template.content,
        category: template.category,
        is_private: true, // 템플릿 수정 시 항상 비공개로 설정
      });
      // 이미지 관련 상태 초기화
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setShowEditModal(true);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingTemplate(null);
    setEditFormData({
      name: "",
      content: "",
      category: "",
      is_private: true, // 기본값을 true로 설정
    });
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({
      name: "",
      content: "",
      category: "카페/식음료",
      is_private: true,
    });
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  };

  // 이미지 압축 함수
  const compressImage = (
    file: File,
    maxSizeKB: number = 300
  ): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new window.Image();

      img.onload = () => {
        // 원본 크기 유지하면서 최대 크기 제한
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Failed to compress image"));
                return;
              }

              const sizeKB = blob.size / 1024;
              console.log(
                `Compressed image size: ${sizeKB.toFixed(
                  2
                )}KB at quality ${currentQuality}`
              );

              if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                tryCompress(currentQuality - 0.1);
              }
            },
            file.type,
            currentQuality
          );
        };

        tryCompress(0.8);
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      console.log(`Original file size: ${(file.size / 1024).toFixed(2)}KB`);

      // 이미지 압축
      const compressedFile = await compressImage(file, 300);
      console.log(
        `Compressed file size: ${(compressedFile.size / 1024).toFixed(2)}KB`
      );

      setSelectedImageFile(compressedFile);
      setImagePreviewUrl(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("Error processing image:", error);
      alert("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageChangeClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageDelete = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 템플릿 수정 저장
  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    try {
      setIsSaving(true);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      let imageUrl = editingTemplate.image_url;

      // 새로운 이미지가 선택된 경우 업로드
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append("image", selectedImageFile);

        const uploadResponse = await fetch("/api/templates/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
        } else {
          throw new Error("이미지 업로드 실패");
        }
      }

      // 템플릿 업데이트
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editFormData.name,
          content: editFormData.content,
          category: editFormData.category,
          image_url: imageUrl,
          is_private: editFormData.is_private,
        }),
      });

      if (response.ok) {
        const updatedTemplate = await response.json();
        console.log("템플릿 업데이트 성공:", updatedTemplate);

        // 로컬 상태 업데이트
        setTemplates(
          templates.map((template) =>
            template.id === editingTemplate.id
              ? { ...template, ...updatedTemplate.template }
              : template
          )
        );

        handleCloseEditModal();
        alert("템플릿이 성공적으로 수정되었습니다.");

        // 템플릿 목록 새로고침
        fetchTemplates(selectedCategory);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "템플릿 수정 실패");
      }
    } catch (error) {
      console.error("템플릿 수정 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "템플릿 수정 중 오류가 발생했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 새 템플릿 생성
  const handleSaveNewTemplate = async () => {
    try {
      setIsSaving(true);

      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      let imageUrl = "";

      // 이미지가 선택된 경우 업로드
      if (selectedImageFile) {
        const formData = new FormData();
        formData.append("image", selectedImageFile);

        const uploadResponse = await fetch("/api/templates/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.imageUrl;
        } else {
          console.warn("이미지 업로드 실패, 기본 이미지 사용");
        }
      }

      // 기본 이미지 URL 설정
      if (!imageUrl) {
        imageUrl =
          "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop&crop=center&auto=format&q=60";
      }

      // 템플릿 생성
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: createFormData.name,
          content: createFormData.content,
          category: createFormData.category,
          image_url: imageUrl,
          is_private: createFormData.is_private,
        }),
      });

      if (response.ok) {
        const newTemplate = await response.json();
        console.log("템플릿 생성 성공:", newTemplate);

        handleCloseCreateModal();
        alert("템플릿이 성공적으로 생성되었습니다.");

        // 템플릿 목록 새로고침
        fetchTemplates(selectedCategory);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "템플릿 생성 실패");
      }
    } catch (error) {
      console.error("템플릿 생성 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "템플릿 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(templates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const endIndex = startIndex + templatesPerPage;
  const currentTemplates = templates.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
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

    return (
      <div className="pagination">
        {pages}
        <span className="pagination-info">다음</span>
      </div>
    );
  };

  return (
    <AdvertiserGuard>
      <div className="target-marketing-landing">
        <div className="landing-container">
          {/* Header */}
          <div className="landing-header">
            <h1>AI타겟마케팅</h1>
          </div>

          {/* Main Content */}
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
                  onKeyPress={handleKeyPress}
                  placeholder={`Ex) 서울 홍대 헤어샵 오픈 행사 카드 50%할인 이벤트 홍보
여름 맞이 최대 50% 할인 이벤트 홍보
카페 시즌 음료 무료 시음 업 이벤트 안내`}
                  className="chat-input-field"
                  rows={3}
                  disabled={isLoading}
                />
                <button
                  onClick={handleStartChat}
                  disabled={!inputValue.trim() || isLoading}
                  className="start-chat-btn"
                >
                  {isLoading ? (
                    <div className="loading-spinner-small" />
                  ) : (
                    "생성"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 템플릿으로 시작 섹션 */}
          <div className="template-section">
            <div className="template-header">
              <h2>템플릿으로 시작</h2>
            </div>

            {/* 카테고리 탭 */}
            <div className="category-tabs">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`category-tab ${
                    selectedCategory === category ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedCategory(category);
                    fetchTemplates(category);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 템플릿 그리드 */}
            {isTemplatesLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  <p>템플릿을 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="templates-grid">
                  {currentTemplates.map((template) => (
                    <div key={template.id} className="template-card">
                      {template.isPopular && (
                        <div className="grand-opening-badge">GRAND OPENING</div>
                      )}

                      <div className="template-image">
                        <Image
                          src={template.image_url}
                          alt={template.name}
                          width={300}
                          height={160}
                          style={{ objectFit: "cover" }}
                          onError={handleImageError}
                        />
                      </div>

                      <div className="template-content">
                        <h3 className="template-title">{template.name}</h3>
                        <p className="template-description">
                          {template.content}
                        </p>

                        <div className="template-actions">
                          <button
                            onClick={() => handleEditTemplate(template.id)}
                            className="action-button secondary"
                          >
                            템플릿 수정하기
                          </button>
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

                {/* 페이지네이션 */}
                {renderPagination()}

                {currentTemplates.length === 0 && (
                  <div className="empty-state">
                    <Layout size={48} />
                    <h3>해당 카테고리에 템플릿이 없습니다</h3>
                    <p>다른 카테고리를 선택해보세요</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* 템플릿 수정 모달 */}
        {showEditModal && editingTemplate && (
          <div className="modal-overlay">
            <div className="modal-content edit-modal">
              <div className="modal-header">
                <h2>템플릿 수정</h2>
                <button onClick={handleCloseEditModal} className="modal-close">
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="edit-form">
                  <div className="form-section">
                    <label className="form-label">템플릿 이름</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          name: e.target.value,
                        })
                      }
                      className="form-input"
                      placeholder="템플릿 이름을 입력하세요"
                    />
                  </div>

                  <div className="form-section">
                    <label className="form-label">카테고리</label>
                    <select
                      value={editFormData.category}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          category: e.target.value,
                        })
                      }
                      className="form-select"
                    >
                      {categories
                        .filter((cat) => cat !== "추천")
                        .map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-section">
                    <label className="form-label">템플릿 내용</label>
                    <textarea
                      value={editFormData.content}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          content: e.target.value,
                        })
                      }
                      className="form-textarea"
                      placeholder="템플릿 내용을 입력하세요"
                      rows={6}
                    />
                  </div>

                  <div className="form-section">
                    <label className="form-label">이미지</label>
                    <div className="image-upload-section">
                      <div className="current-image">
                        <Image
                          src={imagePreviewUrl || editingTemplate.image_url}
                          alt={editingTemplate.name}
                          width={200}
                          height={120}
                          style={{ objectFit: "cover" }}
                          onError={handleImageError}
                        />
                        <div className="image-actions">
                          <button
                            type="button"
                            onClick={handleImageChangeClick}
                            className="image-action-btn"
                            disabled={isUploadingImage}
                          >
                            <ImageIcon size={16} />
                            {isUploadingImage ? "업로드 중..." : "이미지 변경"}
                          </button>
                          <button
                            type="button"
                            onClick={handleImageDelete}
                            className="image-action-btn delete"
                            disabled={isUploadingImage}
                          >
                            <X size={16} />
                            이미지 삭제
                          </button>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={handleCloseEditModal}
                  className="cancel-button"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="save-button primary"
                  disabled={
                    isSaving ||
                    isUploadingImage ||
                    !editFormData.name.trim() ||
                    !editFormData.content.trim()
                  }
                >
                  {isSaving
                    ? "저장 중..."
                    : isUploadingImage
                    ? "이미지 업로드 중..."
                    : "저장"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 템플릿 작성 모달 */}
        {showCreateModal && (
          <div className="modal-overlay">
            <div className="modal-content create-modal">
              <div className="modal-header">
                <h2>새 템플릿 작성</h2>
                <button
                  onClick={handleCloseCreateModal}
                  className="modal-close"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="create-form">
                  <div className="form-section">
                    <label className="form-label">템플릿 이름</label>
                    <input
                      type="text"
                      value={createFormData.name}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          name: e.target.value,
                        })
                      }
                      className="form-input"
                      placeholder="템플릿 이름을 입력하세요"
                    />
                  </div>

                  <div className="form-section">
                    <label className="form-label">카테고리</label>
                    <select
                      value={createFormData.category}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          category: e.target.value,
                        })
                      }
                      className="form-select"
                    >
                      {categories
                        .filter((cat) => cat !== "추천")
                        .map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="form-section">
                    <label className="form-label">템플릿 내용</label>
                    <textarea
                      value={createFormData.content}
                      onChange={(e) =>
                        setCreateFormData({
                          ...createFormData,
                          content: e.target.value,
                        })
                      }
                      className="form-textarea"
                      placeholder="템플릿 내용을 입력하세요"
                      rows={6}
                    />
                  </div>

                  <div className="form-section">
                    <label className="form-label">이미지 (선택사항)</label>
                    <div className="image-upload-section">
                      {imagePreviewUrl ? (
                        <div className="current-image">
                          <Image
                            src={imagePreviewUrl}
                            alt="미리보기"
                            width={200}
                            height={120}
                            style={{ objectFit: "cover" }}
                          />
                          <div className="image-actions">
                            <button
                              type="button"
                              onClick={handleImageChangeClick}
                              className="image-action-btn"
                              disabled={isUploadingImage}
                            >
                              <ImageIcon size={16} />
                              {isUploadingImage
                                ? "업로드 중..."
                                : "이미지 변경"}
                            </button>
                            <button
                              type="button"
                              onClick={handleImageDelete}
                              className="image-action-btn delete"
                              disabled={isUploadingImage}
                            >
                              <X size={16} />
                              이미지 삭제
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="image-upload-placeholder">
                          <button
                            type="button"
                            onClick={handleImageChangeClick}
                            className="upload-button"
                            disabled={isUploadingImage}
                          >
                            <ImageIcon size={24} />
                            <span>이미지 업로드</span>
                          </button>
                          <p className="upload-hint">
                            이미지를 업로드하지 않으면 기본 이미지가 사용됩니다.
                          </p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        style={{ display: "none" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={handleCloseCreateModal}
                  className="cancel-button"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveNewTemplate}
                  className="save-button primary"
                  disabled={
                    isSaving ||
                    isUploadingImage ||
                    !createFormData.name.trim() ||
                    !createFormData.content.trim()
                  }
                >
                  {isSaving
                    ? "생성 중..."
                    : isUploadingImage
                    ? "이미지 업로드 중..."
                    : "템플릿 생성"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvertiserGuard>
  );
}
