"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Layout, Phone, Smartphone, ImageIcon, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  "커스텀",
];

export default function TemplateStartPage() {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState("추천");
  const [showSendModal, setShowSendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
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
  const [recipientNumber, setRecipientNumber] = useState("");
  const [smsTextContent, setSmsTextContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };

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
      setIsLoading(true);

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
      setIsLoading(false);
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchTemplates(selectedCategory);
  }, [selectedCategory]);

  const filteredTemplates = templates;

  const handleUseTemplate = (templateId: number) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setSmsTextContent(template.content);
      setShowSendModal(true);
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

  const handleCreateTemplate = () => {
    setCreateFormData({
      name: "",
      content: "",
      category: "카페/식음료",
      is_private: true,
    });
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setShowCreateModal(true);
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
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");

      img.onload = () => {
        // 원본 크기가 300KB 이하면 그대로 반환
        if (file.size <= maxSizeKB * 1024) {
          resolve(file);
          return;
        }

        // 압축을 위한 초기 설정
        let { width, height } = img;
        const quality = 0.8;

        // 이미지가 너무 크면 크기 조정
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지를 캔버스에 그리기
        ctx?.drawImage(img, 0, 0, width, height);

        // 압축 시도
        const tryCompress = (currentQuality: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // 목표 크기에 도달했거나 품질이 너무 낮아지면 완료
                if (blob.size <= maxSizeKB * 1024 || currentQuality <= 0.1) {
                  const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // 품질을 낮춰서 다시 시도
                  tryCompress(currentQuality - 0.1);
                }
              }
            },
            file.type,
            currentQuality
          );
        };

        tryCompress(quality);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  // 이미지 파일 선택 핸들러
  const handleImageSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // 파일 타입 검증
      if (!file.type.startsWith("image/")) {
        alert("이미지 파일만 선택할 수 있습니다.");
        return;
      }

      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하여야 합니다.");
        return;
      }

      try {
        // 300KB 이상이면 압축 처리
        const processedFile = await compressImage(file, 300);

        setSelectedImageFile(processedFile);

        // 미리보기 URL 생성
        const previewUrl = URL.createObjectURL(processedFile);
        setImagePreviewUrl(previewUrl);
      } catch (error) {
        console.error("이미지 처리 중 오류:", error);
        alert("이미지 처리 중 오류가 발생했습니다.");
      }
    }
  };

  // 이미지 변경 버튼 클릭 핸들러
  const handleImageChangeClick = () => {
    fileInputRef.current?.click();
  };

  // 이미지 삭제 핸들러
  const handleImageDelete = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getCurrentUserId = () => {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const userInfo = localStorage.getItem("userInfo");

    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);

        // 다양한 필드명 시도
        const userId =
          parsed.id || parsed.user_id || parsed.userId || parsed.ID;

        return userId;
      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
      }
    }

    // userInfo가 없는 경우 JWT 토큰에서 사용자 정보 확인
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        const userId =
          payload.id || payload.user_id || payload.userId || payload.sub;

        return userId;
      } catch (error) {
        console.error("토큰 파싱 오류:", error);
      }
    }

    return null;
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setIsSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      const currentUserId = getCurrentUserId();

      if (!token) {
        alert("로그인 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      if (!currentUserId) {
        alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
        return;
      }

      let imageUrl = editingTemplate.image_url;

      // 새로운 이미지가 선택된 경우 서버에 업로드
      if (selectedImageFile) {
        setIsUploadingImage(true);
        try {
          const formData = new FormData();
          formData.append("file", selectedImageFile);
          formData.append("templateId", editingTemplate.id.toString());

          const uploadResponse = await fetch("/api/templates/upload-image", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || "이미지 업로드에 실패했습니다.");
          }

          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.fileUrl;
        } catch (uploadError) {
          console.error("이미지 업로드 실패:", uploadError);
          alert(
            uploadError instanceof Error
              ? uploadError.message
              : "이미지 업로드에 실패했습니다. 다시 시도해주세요."
          );
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }

      // 현재 로그인한 유저가 템플릿의 소유자인지 확인
      const isOwner =
        editingTemplate.user_id === currentUserId || editingTemplate.is_owner;

      let response;

      if (isOwner) {
        // 기존 템플릿 수정 (is_private는 항상 true로 고정)
        response = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editFormData.name,
            content: editFormData.content,
            category: editFormData.category,
            is_private: true, // 템플릿 수정 시 항상 비공개로 설정
            image_url: imageUrl,
            user_id: currentUserId,
          }),
        });
      } else {
        // 새로운 템플릿 생성 (복사)
        response = await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editFormData.name,
            content: editFormData.content,
            category: editFormData.category,
            is_private: editFormData.is_private,
            image_url: imageUrl,
            user_id: currentUserId,
          }),
        });
      }

      if (response.ok) {
        if (isOwner) {
          alert("템플릿이 성공적으로 수정되었습니다!");
        } else {
          alert("새로운 템플릿이 생성되었습니다!");
        }

        // 템플릿 목록 새로고침
        await fetchTemplates(selectedCategory);
        handleCloseEditModal();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "템플릿 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("템플릿 저장 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "템플릿 저장 중 오류가 발생했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // MMS 전송용 이미지 최적화 함수
  const optimizeImageForMMS = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");

      img.onload = () => {
        let { width, height } = img;

        // MMS 권장 해상도: 1500x1440 이하로 조정
        const maxWidth = 1500;
        const maxHeight = 1440;

        // 비율을 유지하면서 크기 조정
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const ratio = Math.min(widthRatio, heightRatio);

          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // 이미지를 캔버스에 그리기
        ctx?.drawImage(img, 0, 0, width, height);

        // 품질을 조정하여 파일 크기도 최적화 (300KB 이하)
        const tryOptimize = (quality: number) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // 300KB 이하이거나 품질이 너무 낮아지면 완료
                if (blob.size <= 300 * 1024 || quality <= 0.3) {
                  const optimizedFile = new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });

                  resolve(optimizedFile);
                } else {
                  // 품질을 낮춰서 다시 시도
                  tryOptimize(quality - 0.1);
                }
              }
            },
            "image/jpeg",
            quality
          );
        };

        tryOptimize(0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleSendMMS = async () => {
    if (!recipientNumber.trim() || !smsTextContent.trim()) {
      alert("수신번호와 메시지 내용을 모두 입력해주세요.");
      return;
    }

    setIsSending(true);

    try {
      let fileId = null;

      // 템플릿 이미지가 있는 경우 파일 업로드
      if (selectedTemplate?.image_url) {
        // 외부 URL 이미지를 fetch하여 blob으로 변환
        const imageResponse = await fetch(selectedTemplate.image_url);
        if (!imageResponse.ok) {
          throw new Error("이미지를 가져올 수 없습니다.");
        }

        const imageBlob = await imageResponse.blob();

        // Blob을 File 객체로 변환
        let file = new File(
          [imageBlob],
          `template-${selectedTemplate.id}.jpg`,
          {
            type: "image/jpeg",
          }
        );

        // MMS 전송을 위한 이미지 최적화
        try {
          file = await optimizeImageForMMS(file);
        } catch (optimizeError) {
          console.warn("이미지 최적화 실패, 원본 사용:", optimizeError);
        }

        // FormData로 파일 업로드
        const formData = new FormData();
        formData.append("file", file);

        const uploadResponse = await fetch("/api/message/upload-file", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          fileId = uploadResult.fileId;
        } else {
          const uploadError = await uploadResponse.json();
          throw new Error(`파일 업로드 실패: ${uploadError.error}`);
        }
      }

      // 메시지 전송
      const response = await fetch("/api/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toNumbers: [recipientNumber.trim().replace(/-/g, "")], // 하이픈 제거
          message: smsTextContent,
          fileIds: fileId ? [fileId] : undefined,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert("MMS가 성공적으로 전송되었습니다!");
        setShowSendModal(false);
        setRecipientNumber("");
        setSmsTextContent("");
        setSelectedTemplate(null);
      } else {
        throw new Error(result.error || "MMS 전송에 실패했습니다.");
      }
    } catch (error) {
      console.error("MMS 전송 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "MMS 전송 중 오류가 발생했습니다."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseModal = () => {
    setShowSendModal(false);
    setRecipientNumber("");
    setSmsTextContent("");
    setSelectedTemplate(null);
  };

  const handleSaveNewTemplate = async () => {
    setIsSaving(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const userId = getCurrentUserId();
      if (!userId) {
        alert("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      let imageUrl = "";

      // 이미지가 선택된 경우 업로드
      if (selectedImageFile) {
        setIsUploadingImage(true);
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
          throw new Error("이미지 업로드에 실패했습니다.");
        }
        setIsUploadingImage(false);
      } else {
        // 기본 이미지 URL 설정
        imageUrl =
          "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=300&h=200&fit=crop&crop=center&auto=format&q=60";
      }

      // 새 템플릿 생성
      const templateData = {
        name: createFormData.name,
        content: createFormData.content,
        category: createFormData.category,
        image_url: imageUrl,
        is_private: createFormData.is_private,
        user_id: userId,
      };

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        alert("새 템플릿이 성공적으로 생성되었습니다!");
        handleCloseCreateModal();
        // 커스텀 카테고리로 이동하여 새로 생성된 템플릿 확인
        setSelectedCategory("커스텀");
        fetchTemplates("커스텀");
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "템플릿 생성에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      alert(
        error instanceof Error ? error.message : "템플릿 생성에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
      setIsUploadingImage(false);
    }
  };

  return (
    <div className="template-start-container">
      <div className="template-start-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <Layout size={24} />
            </div>
            <div className="header-text">
              <h1>템플릿으로 시작</h1>
              <p>
                AI와 대화하며 맞춤형 마케팅 캠페인을 생성하고 MMS로 전송하세요
              </p>
            </div>
          </div>
          <div className="header-actions">
            <button
              onClick={handleCreateTemplate}
              className="create-template-button"
            >
              템플릿 작성하기
            </button>
          </div>
        </div>
      </div>

      <div className="template-start-content">
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
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>템플릿을 불러오는 중...</p>
          </div>
        ) : (
          <>
            <div className="templates-grid">
              {filteredTemplates.map((template) => (
                <div key={template.id} className="template-card">
                  {template.isPopular && (
                    <div className="grand-opening-badge">POPULAR</div>
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
                    <p className="template-description">{template.content}</p>
                    <div className="template-period">
                      {formatDate(template.created_at)}
                    </div>

                    <div className="template-actions">
                      <button
                        onClick={() => handleEditTemplate(template.id)}
                        className="action-button secondary"
                      >
                        템플릿 수정하기
                      </button>
                      <button
                        onClick={() => handleUseTemplate(template.id)}
                        className="action-button"
                      >
                        템플릿 사용하기
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="empty-state">
                <Layout size={48} />
                {selectedCategory === "커스텀" && !isAuthenticated ? (
                  <>
                    <h3>로그인이 필요합니다</h3>
                    <p>커스텀 템플릿을 보려면 로그인해주세요</p>
                  </>
                ) : selectedCategory === "커스텀" && isAuthenticated ? (
                  <>
                    <h3>생성한 템플릿이 없습니다</h3>
                    <p>나만의 템플릿을 만들어보세요</p>
                  </>
                ) : (
                  <>
                    <h3>해당 카테고리에 템플릿이 없습니다</h3>
                    <p>다른 카테고리를 선택해보세요</p>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MMS 전송 모달 */}
      {showSendModal && selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal-content send-modal">
            <div className="modal-header">
              <h2>MMS 전송</h2>
              <button onClick={handleCloseModal} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="template-preview">
                <h3>전송할 템플릿</h3>
                <div className="preview-card">
                  <div className="preview-image">
                    <Image
                      src={selectedTemplate.image_url}
                      alt={selectedTemplate.name}
                      width={300}
                      height={200}
                      style={{ objectFit: "cover" }}
                      onError={handleImageError}
                    />
                  </div>
                  <div className="preview-content">
                    <h4>{selectedTemplate.name}</h4>
                    <p>{selectedTemplate.content}</p>
                  </div>
                </div>
              </div>

              <div className="mms-send-content">
                <div className="content-section">
                  <div className="section-header">
                    <Smartphone size={16} />
                    <span>메시지 발신번호</span>
                  </div>
                  <div className="selected-sender">
                    <div className="sender-info-row">
                      <div className="sender-details">
                        <div className="sender-display">
                          <Phone className="sender-icon" size={16} />
                          <span className="sender-title">메시지 발신번호</span>
                        </div>
                        <div className="sender-number">테스트 번호</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-section">
                  <div className="section-header">
                    <Phone size={16} />
                    <span>메시지 수신번호</span>
                  </div>
                  <div className="recipient-input">
                    <input
                      type="text"
                      value={recipientNumber}
                      onChange={(e) => setRecipientNumber(e.target.value)}
                      placeholder="01012345678"
                      className="number-input"
                    />
                  </div>
                </div>

                <div className="content-section">
                  <div className="section-header">
                    <span>내용 입력</span>
                  </div>
                  <div className="message-input-section">
                    <div className="form-group">
                      <textarea
                        value={smsTextContent}
                        onChange={(e) => setSmsTextContent(e.target.value)}
                        placeholder="문자 내용을 입력해주세요."
                        className="message-textarea"
                        maxLength={2000}
                      />
                      <div className="message-footer">
                        <span className="char-count">
                          {new Blob([smsTextContent]).size} / 2,000 bytes
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="content-section">
                  <div className="section-header">
                    <ImageIcon size={16} />
                    <span>이미지 첨부</span>
                    <span className="file-info">(템플릿 이미지 자동 첨부)</span>
                  </div>
                  <div className="file-attachment-section">
                    <div className="attached-image-preview">
                      <Image
                        src={selectedTemplate.image_url}
                        alt={selectedTemplate.name}
                        width={200}
                        height={120}
                        style={{ objectFit: "cover" }}
                        onError={handleImageError}
                      />
                      <div className="image-info">
                        <span className="image-status">
                          ✓ 템플릿 이미지 첨부됨
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={handleCloseModal}
                className="cancel-button"
                disabled={isSending}
              >
                취소
              </button>
              <button
                onClick={handleSendMMS}
                className="send-button primary"
                disabled={
                  !recipientNumber.trim() || !smsTextContent.trim() || isSending
                }
              >
                {isSending ? "전송 중..." : "전송"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      setEditFormData({ ...editFormData, name: e.target.value })
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
                      .filter((cat) => cat !== "추천" && cat !== "커스텀")
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
              <button onClick={handleCloseEditModal} className="cancel-button">
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
              <button onClick={handleCloseCreateModal} className="modal-close">
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
                      .filter((cat) => cat !== "추천" && cat !== "커스텀")
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
  );
}
