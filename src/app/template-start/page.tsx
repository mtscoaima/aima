"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Layout, Phone, Smartphone, ImageIcon, X } from "lucide-react";
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

export default function TemplateStartPage() {
  const [selectedCategory, setSelectedCategory] = useState("추천");
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [recipientNumber, setRecipientNumber] = useState("");
  const [smsTextContent, setSmsTextContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        console.log("템플릿 이미지를 파일로 업로드 중...");

        // 외부 URL 이미지를 fetch하여 blob으로 변환
        const imageResponse = await fetch(selectedTemplate.image_url);
        if (!imageResponse.ok) {
          throw new Error("이미지를 가져올 수 없습니다.");
        }

        const imageBlob = await imageResponse.blob();

        // Blob을 File 객체로 변환
        const file = new File(
          [imageBlob],
          `template-${selectedTemplate.id}.jpg`,
          {
            type: "image/jpeg",
          }
        );

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

  return (
    <div className="template-start-container">
      <div className="template-start-header">
        <div className="header-content">
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
                <h3>해당 카테고리에 템플릿이 없습니다</h3>
                <p>다른 카테고리를 선택해보세요</p>
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
    </div>
  );
}
