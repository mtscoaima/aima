"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Image as ImageIcon,
  MessageSquare,
  Target,
  Sparkles,
  X,
  Phone,
  Smartphone,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import "./styles.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  imageUrl?: string;
  isImageLoading?: boolean;
}

interface GeneratedTemplate {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  createdAt: Date;
  status: "생성완료" | "전송준비" | "전송완료";
}

export default function TargetMarketingPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "안녕하세요! AI 타깃마케팅 도우미입니다. 어떤 마케팅 캠페인을 만들어드릴까요?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<GeneratedTemplate | null>(null);
  const [recipients, setRecipients] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [smsTextContent, setSmsTextContent] = useState("");
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<
    string | null
  >(null);
  const [recipientNumber, setRecipientNumber] = useState("");
  const [isFromTemplate, setIsFromTemplate] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([
    {
      id: "1",
      title: "카페 아메리카노 20% 할인",
      description:
        "2025년 카페 탐방의 오픈 프로모션을 시작합니다 3월 11일 부터 6월 12일까지 아메리카노 20% 할인 혜택을 만나보세요.",
      imageUrl: "/api/placeholder/300/200",
      createdAt: new Date(),
      status: "생성완료",
    },
  ]);

  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  // Base64 이미지를 리사이징하는 함수
  const resizeBase64Image = async (
    base64Data: string,
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas context를 생성할 수 없습니다."));
          return;
        }

        // 원본 크기
        const { width: originalWidth, height: originalHeight } = img;

        // 최대 해상도 제한 (1500x1440)
        const maxWidth = 1500;
        const maxHeight = 1440;

        // 비율 계산
        const ratio = Math.min(
          maxWidth / originalWidth,
          maxHeight / originalHeight,
          1 // 확대는 하지 않음
        );

        // 새로운 크기 계산
        const newWidth = Math.round(originalWidth * ratio);
        const newHeight = Math.round(originalHeight * ratio);

        // Canvas 크기 설정
        canvas.width = newWidth;
        canvas.height = newHeight;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Base64로 변환
        const resizedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(resizedBase64);
      };

      img.onerror = () => {
        reject(new Error("이미지를 로드할 수 없습니다."));
      };

      img.src = base64Data;
    });
  };

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // 메시지가 변경될 때마다 스크롤 (초기 로드 제외)
    if (
      messages.length > 0 &&
      messages.length >= prevMessagesLengthRef.current
    ) {
      // 약간의 지연을 두어 DOM 업데이트 후 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // 로딩 상태 변경 시에도 스크롤
  useEffect(() => {
    if (showTypingIndicator) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [showTypingIndicator]);

  // 템플릿 사용하기로 온 경우 처리
  useEffect(() => {
    const useTemplate = searchParams.get("useTemplate");
    if (useTemplate === "true") {
      const savedTemplateId = localStorage.getItem("selectedTemplateId");
      if (savedTemplateId) {
        // DB에서 템플릿 데이터 불러오기
        fetchTemplateById(savedTemplateId);

        // localStorage에서 템플릿 ID 제거
        localStorage.removeItem("selectedTemplateId");
      }
    }
  }, [searchParams]);

  // 템플릿 ID로 DB에서 템플릿 데이터 불러오기
  const fetchTemplateById = async (templateId: string) => {
    try {
      // 로컬 스토리지에서 토큰 가져오기
      const token = localStorage.getItem("accessToken");

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // 토큰이 있으면 Authorization 헤더 추가
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`/api/templates/${templateId}`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        const templateData = data.template;

        // 우측 MMS 전송 섹션에 템플릿 데이터 설정 (모달 사용 안함)
        setSmsTextContent(templateData.content);
        setCurrentGeneratedImage(templateData.image_url);
        setIsFromTemplate(true);
      } else {
        const errorData = await response.json();
        console.error("템플릿 불러오기 실패:", errorData);
      }
    } catch (error) {
      console.error("템플릿 불러오기 오류:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setShowTypingIndicator(true);

    // 스트리밍 응답을 위한 임시 메시지 생성
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // 스트리밍 API 호출
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputMessage,
          previousMessages: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("API 요청에 실패했습니다.");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("스트림을 읽을 수 없습니다.");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "text_delta") {
                // 첫 번째 텍스트 응답이 오면 타이핑 인디케이터 숨기기
                setShowTypingIndicator(false);

                // 텍스트 스트리밍 업데이트
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: msg.content + data.content,
                          // 텍스트가 들어오면 이미지 로딩 상태 해제
                          isImageLoading: false,
                        }
                      : msg
                  )
                );
                // 텍스트 스트리밍 중 스크롤
                setTimeout(() => scrollToBottom(), 50);
              } else if (data.type === "text_replace") {
                // JSON 파싱 완료 후 텍스트 교체
                setShowTypingIndicator(false);

                // 기존 텍스트를 새로운 텍스트로 교체
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: data.content,
                          isImageLoading: false,
                        }
                      : msg
                  )
                );

                // SMS 텍스트 내용 업데이트
                if (data.smsTextContent) {
                  setSmsTextContent(data.smsTextContent);
                }

                // 텍스트 교체 후 스크롤
                setTimeout(() => scrollToBottom(), 50);
              } else if (data.type === "partial_image") {
                // 첫 번째 이미지 응답이 오면 타이핑 인디케이터 숨기기
                setShowTypingIndicator(false);

                // 부분 이미지 생성 중 (미리보기)
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          imageUrl: data.imageUrl,
                          isImageLoading: true,
                        }
                      : msg
                  )
                );

                setCurrentGeneratedImage(data.imageUrl);

                // 이미지 생성 중 스크롤
                setTimeout(() => scrollToBottom(), 100);
              } else if (data.type === "image_generated") {
                // 최종 이미지 생성 완료
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          imageUrl: data.imageUrl,
                          isImageLoading: false,
                        }
                      : msg
                  )
                );

                // 생성된 이미지를 우측 첨부 영역에 표시
                setCurrentGeneratedImage(data.imageUrl);

                // 최종 이미지 생성 완료 시 스크롤
                setTimeout(() => scrollToBottom(), 100);
              } else if (data.type === "response_complete") {
                // 응답 완료
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: data.fullText,
                          imageUrl: data.imageUrl || msg.imageUrl,
                          isImageLoading: false,
                        }
                      : msg
                  )
                );

                // SMS 텍스트 내용 업데이트
                if (data.smsTextContent) {
                  setSmsTextContent(data.smsTextContent);
                }

                // 생성된 이미지가 있으면 currentGeneratedImage에도 설정
                if (data.imageUrl && !currentGeneratedImage) {
                  setCurrentGeneratedImage(data.imageUrl);
                }

                // 생성된 이미지를 우측 첨부 영역에 표시
                if (data.imageUrl) {
                  setCurrentGeneratedImage(data.imageUrl);
                }

                // 이미지가 생성된 경우 템플릿에 추가
                if (data.imageUrl && data.templateData) {
                  const newTemplate: GeneratedTemplate = {
                    id: Date.now().toString(),
                    title: data.templateData.title,
                    description: data.templateData.description,
                    imageUrl: data.imageUrl,
                    createdAt: new Date(),
                    status: "생성완료",
                  };
                  setTemplates((prev) => [newTemplate, ...prev]);
                }
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.error("JSON 파싱 오류:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("AI 채팅 오류:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setShowTypingIndicator(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 우측 발신 영역에서 직접 전송
  const handleDirectSendMMS = async () => {
    if (!recipientNumber.trim()) {
      alert("수신번호를 입력해주세요.");
      return;
    }

    if (!smsTextContent.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    setIsSending(true);
    try {
      let fileId = null;

      // 이미지가 있는 경우 파일 업로드 (Base64 또는 URL)
      if (
        currentGeneratedImage &&
        (currentGeneratedImage.startsWith("data:image/") ||
          currentGeneratedImage.startsWith("http"))
      ) {
        let blob: Blob;
        let fileName: string;

        if (currentGeneratedImage.startsWith("data:image/")) {
          let processedImage = currentGeneratedImage;

          // 먼저 현재 이미지 크기 확인
          const base64Data = currentGeneratedImage.split(",")[1];
          const originalByteCharacters = atob(base64Data);
          const originalSize = originalByteCharacters.length;

          // 300KB 초과 시 자동 리사이징
          if (originalSize > 300 * 1024) {
            try {
              // 품질을 점진적으로 낮춰가며 300KB 이하로 만들기
              let quality = 0.8;
              let resizedImage = processedImage;
              let attempts = 0;
              const maxAttempts = 5;

              while (attempts < maxAttempts) {
                resizedImage = await resizeBase64Image(processedImage, quality);
                const resizedBase64Data = resizedImage.split(",")[1];
                const resizedBytes = atob(resizedBase64Data);
                const resizedSize = resizedBytes.length;

                if (resizedSize <= 300 * 1024) {
                  processedImage = resizedImage;
                  break;
                }

                quality -= 0.15; // 품질을 15%씩 낮춤
                if (quality < 0.1) quality = 0.1; // 최소 품질 제한
                attempts++;
              }

              if (attempts >= maxAttempts) {
                console.warn("최대 시도 횟수에 도달했지만 계속 진행합니다.");
              }
            } catch (error) {
              console.error("이미지 리사이징 실패:", error);
              alert(
                "이미지 크기 조정 중 오류가 발생했습니다. 원본 이미지로 전송을 시도합니다."
              );
            }
          }

          // Base64 데이터에서 파일 정보 추출
          const finalBase64Data = processedImage.split(",")[1];
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const mimeType = processedImage.split(";")[0].split(":")[1];

          // Base64를 Blob으로 변환
          const finalByteCharacters = atob(finalBase64Data);
          const byteNumbers = new Array(finalByteCharacters.length);
          for (let i = 0; i < finalByteCharacters.length; i++) {
            byteNumbers[i] = finalByteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: "image/jpeg" }); // JPEG로 강제 변환
          fileName = `ai-generated-${Date.now()}.jpg`;
        } else if (currentGeneratedImage.startsWith("http")) {
          // URL에서 이미지 다운로드
          const imageResponse = await fetch(currentGeneratedImage);
          if (!imageResponse.ok) {
            throw new Error(
              `이미지 다운로드 실패: ${imageResponse.status} ${imageResponse.statusText}`
            );
          }

          blob = await imageResponse.blob();

          // URL에서 파일명 추출 또는 기본 파일명 사용
          const urlParts = currentGeneratedImage.split("/");
          const originalFileName = urlParts[urlParts.length - 1];
          fileName = originalFileName.includes(".")
            ? originalFileName
            : `template-${Date.now()}.jpg`;

          // JPEG가 아닌 경우 파일명과 타입을 JPEG로 변경
          if (!blob.type.includes("jpeg") && !blob.type.includes("jpg")) {
            fileName = fileName.replace(/\.[^/.]+$/, ".jpg");
            blob = new Blob([blob], { type: "image/jpeg" });
          }
        } else {
          throw new Error("지원하지 않는 이미지 형식입니다.");
        }

        // Blob을 File 객체로 변환
        const file = new File([blob], fileName, {
          type: "image/jpeg",
        });

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
      const sendRequestBody = {
        toNumbers: [recipientNumber.trim().replace(/-/g, "")], // 하이픈 제거
        message: smsTextContent,
        fileIds: fileId ? [fileId] : undefined,
      };

      const response = await fetch("/api/message/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendRequestBody),
      });

      const result = await response.json();

      if (response.ok) {
        alert("MMS가 성공적으로 전송되었습니다!");
        // 전송 후 수신번호만 초기화 (내용과 이미지는 유지)
        setRecipientNumber("");
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

  // 템플릿 기반 전송 (모달용)
  const handleSendMMS = async () => {
    if (!recipients.trim()) {
      alert("수신번호를 입력해주세요.");
      return;
    }

    if (!smsTextContent.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    setIsSending(true);
    try {
      const requestBody = {
        templateId: selectedTemplate?.id || `temp-${Date.now()}`,
        recipients: recipients.split(",").map((num) => num.trim()),
        message: smsTextContent,
        imageUrl: currentGeneratedImage,
      };

      const response = await fetch("/api/ai/send-mms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        alert("MMS가 성공적으로 전송되었습니다!");
        setShowSendModal(false);
        setRecipients("");

        // 템플릿 상태 업데이트 (selectedTemplate이 있는 경우에만)
        if (selectedTemplate) {
          setTemplates((prev) =>
            prev.map((t) =>
              t.id === selectedTemplate.id
                ? { ...t, status: "전송완료" as const }
                : t
            )
          );
        }
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

  return (
    <div className="target-marketing-container">
      <div className="target-marketing-header">
        <div className="header-content">
          <div className="header-icon">
            <Target size={24} />
          </div>
          <div className="header-text">
            <h1>AI 타깃마케팅</h1>
            <p>
              AI와 대화하며 맞춤형 마케팅 캠페인을 생성하고 MMS로 전송하세요
            </p>
          </div>
        </div>
      </div>

      <div className="target-marketing-content">
        {/* 좌측: AI 채팅 영역 */}
        <div className="chat-section">
          <div className="chat-header">
            <MessageSquare size={20} />
            <span>AI 마케팅 어시스턴트</span>
            <div className="chat-status">
              <div className="status-dot"></div>
              온라인
            </div>
          </div>

          <div className="chat-messages" ref={chatMessagesRef}>
            {messages
              .filter(
                (message) => message.content.trim() !== "" || message.imageUrl
              ) // 빈 메시지 필터링
              .map((message) => (
                <div
                  key={message.id}
                  className={`message ${
                    message.role === "user"
                      ? "user-message"
                      : "assistant-message"
                  }`}
                >
                  <div className="message-content">
                    {message.imageUrl && (
                      <div className="message-image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={message.imageUrl} alt="Generated content" />
                        {message.isImageLoading && (
                          <div className="image-loading-overlay">
                            <div className="loading-spinner"></div>
                            <span>이미지 생성 중...</span>
                          </div>
                        )}
                      </div>
                    )}
                    <p>{message.content}</p>
                  </div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            {showTypingIndicator && (
              <div className="message assistant-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="chat-input-section">
            <div className="input-wrapper">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="마케팅 캠페인에 대해 설명해주세요. 예: '카페 신메뉴 홍보용 이미지를 만들어주세요'"
                className="chat-input"
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="send-button"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="input-help">
              <Sparkles size={14} />
              <span>AI가 이미지 생성과 마케팅 문구를 도와드립니다</span>
            </div>
          </div>
        </div>

        {/* 우측: MMS 전송 영역 */}
        <div className="mms-send-section">
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
                {isFromTemplate && (
                  <span className="template-badge">📋 템플릿에서 불러옴</span>
                )}
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
                <span className="file-info">
                  {isFromTemplate
                    ? "(템플릿 이미지 자동 첨부)"
                    : "(AI 생성 이미지 자동 첨부)"}
                </span>
              </div>
              <div className="file-attachment-section">
                {currentGeneratedImage ? (
                  <div className="attached-image-preview">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={currentGeneratedImage} alt="AI 생성 이미지" />
                    <div className="image-info">
                      <span className="image-status">
                        {isFromTemplate
                          ? "✓ 템플릿 이미지 첨부됨"
                          : "✓ AI 생성 이미지 첨부됨"}
                      </span>
                      <button
                        type="button"
                        className="remove-image-button"
                        onClick={() => {
                          setCurrentGeneratedImage(null);
                          setIsFromTemplate(false);
                        }}
                      >
                        제거
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-image-placeholder">
                    <ImageIcon size={24} />
                    <span>AI가 이미지를 생성하면 자동으로 첨부됩니다</span>
                  </div>
                )}
              </div>
            </div>

            <div className="content-section">
              <div className="button-group">
                <button
                  className="send-button"
                  onClick={handleDirectSendMMS}
                  disabled={
                    !recipientNumber.trim() ||
                    !smsTextContent.trim() ||
                    isSending
                  }
                >
                  {isSending ? "전송 중..." : "전송"}
                </button>
                <button
                  className="clear-button"
                  onClick={() => {
                    setRecipientNumber("");
                    setSmsTextContent("");
                    setCurrentGeneratedImage(null);
                    setIsFromTemplate(false);
                  }}
                  disabled={isSending}
                  title="모든 내용 초기화"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MMS 전송 모달 */}
      {showSendModal && (
        <div className="modal-overlay">
          <div className="modal-content send-modal">
            <div className="modal-header">
              <h2>MMS 전송</h2>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setRecipients("");
                  setSelectedTemplate(null);
                }}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="template-preview">
                <h3>전송할 내용</h3>
                <div className="preview-card">
                  {currentGeneratedImage && (
                    <div className="preview-image">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentGeneratedImage} alt="전송할 이미지" />
                    </div>
                  )}
                  <div className="preview-content">
                    <h4>{selectedTemplate?.title || "템플릿 내용"}</h4>
                    <p>{smsTextContent}</p>
                  </div>
                </div>
              </div>

              <div className="recipient-section">
                <label htmlFor="recipients">
                  <Phone size={16} />
                  수신번호
                </label>
                <textarea
                  id="recipients"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="수신번호를 입력하세요. 여러 번호는 쉼표(,)로 구분해주세요.&#10;예: 010-1234-5678, 010-9876-5432"
                  className="recipients-input"
                  rows={3}
                />
                <div className="input-help">
                  여러 번호를 입력할 때는 쉼표(,)로 구분해주세요.
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setRecipients("");
                  setSelectedTemplate(null);
                }}
                className="cancel-button"
                disabled={isSending}
              >
                취소
              </button>
              <button
                onClick={handleSendMMS}
                className="send-button primary"
                disabled={!recipients.trim() || isSending}
              >
                {isSending ? (
                  <>
                    <div className="loading-spinner"></div>
                    전송 중...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    MMS 전송
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
