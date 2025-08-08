"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { ImageIcon, X } from "lucide-react";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";
import NaverTalkTalkTab from "@/components/NaverTalkTalkTab";
import TargetMarketingDetail from "@/components/TargetMarketingDetail";
import "./styles.css";

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

const tabs = [
  { id: "naver-talktalk", label: "네이버 톡톡" },
  { id: "campaign-management", label: "캠페인 관리" },
  { id: "template-management", label: "템플릿 관리" },
];

interface DetailProps {
  templateId?: number | null;
  useTemplate?: boolean;
  initialMessage?: string;
  initialImage?: string | null;
}

export default function TargetMarketingPage() {
  const [activeTab, setActiveTab] = useState("naver-talktalk");

  // 뷰 상태 관리
  const [currentView, setCurrentView] = useState<"main" | "detail">("main");
  const [detailProps, setDetailProps] = useState<DetailProps>({});

  // 템플릿 생성 모달 관련 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  // 네비게이션 함수들
  const handleNavigateToDetail = (
    templateId?: number,
    useTemplate?: boolean
  ) => {
    let props: DetailProps = {};

    if (templateId && useTemplate) {
      // 템플릿 사용하기 - localStorage에서 템플릿 데이터를 가져옴
      // NaverTalkTalkTab에서 이미 설정했을 것임
      props = {
        templateId: templateId,
        useTemplate: true,
      };
    } else {
      // 새로운 채팅 시작
      const savedMessage = sessionStorage.getItem("initialMessage");
      const savedImage = sessionStorage.getItem("initialImage");

      props = {
        initialMessage: savedMessage || undefined,
        initialImage: savedImage || undefined,
      };
    }

    setDetailProps(props);
    setCurrentView("detail");
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
      // 이미지 압축
      const compressedFile = await compressImage(file, 300);

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
        formData.append("file", selectedImageFile);

        const uploadResponse = await fetch("/api/templates/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.fileUrl;
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
        await response.json();

        handleCloseCreateModal();
        alert("템플릿이 성공적으로 생성되었습니다.");

        // 템플릿 목록 새로고침은 NaverTalkTalkTab에서 처리됨
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

  // 캠페인 관리 탭 콘텐츠
  const renderCampaignManagementTab = () => (
    <div className="tab-content-placeholder">
      <div className="placeholder-content">
        <h2>캠페인 관리</h2>
        <p>캠페인 관리 기능이 곧 출시됩니다.</p>
      </div>
    </div>
  );

  // 템플릿 관리 탭 콘텐츠
  const renderTemplateManagementTab = () => (
    <div className="tab-content-placeholder">
      <div className="placeholder-content">
        <h2>템플릿 관리</h2>
        <p>템플릿 관리 기능이 곧 출시됩니다.</p>
      </div>
    </div>
  );

  return (
    <AdvertiserGuardWithDisabled>
      <div className="target-marketing-landing">
        <div className="landing-container">
          {/* Header */}
          <div className="landing-header">
            <h1>AI 타겟마케팅</h1>
          </div>

          {/* Tab Navigation */}
          <div className="tab-navigation">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {currentView === "detail" ? (
              <TargetMarketingDetail {...detailProps} />
            ) : (
              <>
                {activeTab === "naver-talktalk" && (
                  <NaverTalkTalkTab
                    onNavigateToDetail={handleNavigateToDetail}
                  />
                )}
                {activeTab === "campaign-management" &&
                  renderCampaignManagementTab()}
                {activeTab === "template-management" &&
                  renderTemplateManagementTab()}
              </>
            )}
          </div>
        </div>

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
    </AdvertiserGuardWithDisabled>
  );
}
