"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { Send, Sparkles, X, Phone, Smartphone } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AdvertiserGuard } from "@/components/RoleGuard";
import styles from "./styles.module.css";

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

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function TargetMarketingContent() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
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
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([]);

  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // 초기 메시지에 대한 AI 응답 처리
  const handleInitialResponse = React.useCallback(
    async (userMessage: string, currentMessages: Message[]) => {
      setShowTypingIndicator(true);

      try {
        // AI 응답 시뮬레이션 (실제로는 API 호출)
        const response = `"${userMessage}"에 대한 마케팅 캠페인을 만들어드리겠습니다! 어떤 타겟 고객층을 대상으로 하시나요?`;

        // 2초 후 AI 응답 추가
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const aiResponse: Message = {
          id: `ai-${Date.now()}`,
          role: "assistant",
          content: response,
          timestamp: new Date(),
        };

        // 현재 메시지들에 AI 응답 추가
        const newMessages = [...currentMessages, aiResponse];

        setMessages(newMessages);
        setShowTypingIndicator(false);
      } catch (error) {
        console.error("초기 응답 처리 중 오류:", error);
        setShowTypingIndicator(false);
      }
    },
    []
  );

  // 클라이언트에서만 초기 데이터 설정
  useEffect(() => {
    if (!isInitialized) {
      const initialTemplate: GeneratedTemplate = {
        id: "1",
        title: "카페 아메리카노 20% 할인",
        description:
          "2025년 카페 탐방의 오픈 프로모션을 시작합니다 3월 11일 부터 6월 12일까지 아메리카노 20% 할인 혜택을 만나보세요.",
        imageUrl: "/api/placeholder/300/200",
        createdAt: new Date(),
        status: "생성완료",
      };

      // 세션 스토리지에서 초기 메시지 확인
      const savedInitialMessage = sessionStorage.getItem("initialMessage");

      const initialMessages: Message[] = [];

      if (savedInitialMessage && savedInitialMessage.trim()) {
        // 사용자의 초기 메시지를 첫 번째로 추가
        const userMessage: Message = {
          id: "user-initial",
          role: "user",
          content: savedInitialMessage.trim(),
          timestamp: new Date(),
        };

        initialMessages.push(userMessage);

        // 세션 스토리지에서 제거
        sessionStorage.removeItem("initialMessage");

        prevMessagesLengthRef.current = 1;
      } else {
        prevMessagesLengthRef.current = 0;
      }

      // 한 번에 모든 상태 설정
      setMessages(initialMessages);
      setTemplates([initialTemplate]);
      setIsInitialized(true);

      // 초기 메시지가 있는 경우에만 AI 응답 처리 (비동기 처리)
      if (savedInitialMessage && savedInitialMessage.trim()) {
        // 상태 설정 후 약간의 지연을 두고 AI 응답 처리
        setTimeout(() => {
          handleInitialResponse(savedInitialMessage.trim(), initialMessages);
        }, 1000);
      }
    }
  }, [isInitialized, handleInitialResponse]);

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
    // 메시지가 변경될 때마다 스크롤
    if (messages.length > 0) {
      // 약간의 지연을 두어 DOM 업데이트 후 스크롤
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }

    // 이전 메시지 개수 업데이트
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
    if (!isInitialized) return;

    const useTemplate = searchParams.get("useTemplate");
    if (useTemplate === "true") {
      const savedTemplate = localStorage.getItem("selectedTemplate");
      if (savedTemplate) {
        try {
          const templateData = JSON.parse(savedTemplate);

          // 우측 MMS 전송 섹션에 템플릿 데이터 설정
          setSmsTextContent(templateData.content);
          setCurrentGeneratedImage(templateData.image_url);
          setIsFromTemplate(true);

          // localStorage에서 템플릿 데이터 제거
          localStorage.removeItem("selectedTemplate");
        } catch (error) {
          console.error("템플릿 데이터 파싱 오류:", error);
        }
      }
    }
  }, [searchParams, isInitialized]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // 이미지 수정 키워드 감지
    const imageEditKeywords = [
      "수정",
      "편집",
      "바꿔",
      "변경",
      "바꾸",
      "바꿔줘",
      "바꿔주세요",
      "색깔",
      "색상",
      "배경",
      "크기",
      "위치",
      "추가",
      "제거",
      "삭제",
      "더 크게",
      "더 작게",
      "밝게",
      "어둡게",
      "다른 색",
      "다른 배경",
    ];

    const hasImageEditKeyword = imageEditKeywords.some((keyword) =>
      inputMessage.includes(keyword)
    );

    // 현재 이미지가 있고 이미지 수정 키워드가 포함된 경우
    if (currentGeneratedImage && hasImageEditKeyword) {
      await handleImageEdit(inputMessage);
      return;
    }

    const userMessage: Message = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setShowTypingIndicator(true);

    // 스트리밍 응답을 위한 임시 메시지 생성
    const assistantMessageId = `assistant-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
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
                    id: `template-${Math.random().toString(36).substr(2, 9)}`,
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
          fileName = `ai-generated-${Math.random()
            .toString(36)
            .substr(2, 9)}.jpg`;
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
            : `template-${Math.random().toString(36).substr(2, 9)}.jpg`;

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

  // 이미지 편집 처리
  const handleImageEdit = async (prompt: string) => {
    if (!currentGeneratedImage) return;

    const userMessage: Message = {
      id: `user-${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setShowTypingIndicator(true);

    try {
      // 기본적으로 직접 편집 사용
      const editType = "edit";

      const response = await fetch("/api/ai/edit-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: currentGeneratedImage,
          prompt: prompt,
          editType: editType,
        }),
      });

      if (!response.ok) {
        throw new Error("이미지 편집에 실패했습니다.");
      }

      const data = await response.json();

      if (data.success && data.imageUrl) {
        // 편집된 이미지로 교체
        setCurrentGeneratedImage(data.imageUrl);

        // 성공 메시지 추가
        const successMessage: Message = {
          id: `edit-success-${Math.random().toString(36).substr(2, 9)}`,
          role: "assistant",
          content: `🎉 이미지가 성공적으로 편집되었습니다!\n\n편집된 이미지가 우측 첨부 영역에 적용되었습니다.`,
          timestamp: new Date(),
          imageUrl: data.imageUrl,
        };

        setMessages((prev) => [...prev, successMessage]);
      } else {
        throw new Error(data.error || "이미지 편집에 실패했습니다.");
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `edit-error-${Math.random().toString(36).substr(2, 9)}`,
        role: "assistant",
        content: `❌ 이미지 편집 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setShowTypingIndicator(false);
    }
  };

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
        templateId:
          selectedTemplate?.id ||
          `temp-${Math.random().toString(36).substr(2, 9)}`,
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
    <div className={styles.targetMarketingContainer}>
      <div className={styles.targetMarketingHeader}>
        <div className={styles.landingHeader}>
          <h1>AI타겟마케팅</h1>
        </div>
      </div>

      <div className={styles.targetMarketingContent}>
        {/* 좌측: AI 채팅 영역 */}
        <div className={styles.chatSection}>
          <div className={styles.chatMessages} ref={chatMessagesRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`${styles.message} ${
                  message.role === "user"
                    ? styles.userMessage
                    : styles.assistantMessage
                }`}
              >
                <div className={styles.messageContent}>
                  {message.imageUrl && (
                    <div className={styles.messageImage}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={message.imageUrl} alt="Generated content" />
                      {message.isImageLoading && (
                        <div className={styles.imageLoadingOverlay}>
                          <div className={styles.loadingSpinner}></div>
                          <span>이미지 생성 중...</span>
                        </div>
                      )}
                    </div>
                  )}
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
            {showTypingIndicator && (
              <div className={`${styles.message} ${styles.assistantMessage}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.chatInputSection}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="어떤 광고를 만들고 싶나요?"
                className={styles.chatInput}
                rows={3}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={styles.sendButton}
              >
                입력
              </button>
            </div>
            <div className={styles.inputHelp}>
              <Sparkles size={14} />
              <span>AI가 이미지 생성, 편집과 마케팅 문구를 도와드립니다</span>
            </div>
          </div>
        </div>

        {/* 우측: MMS 전송 영역 */}
        <div className={styles.mmsSendContainer}>
          <div className={styles.mmsSendSection}>
            {/* 템플릿 미리보기 카드 */}
            <div className={styles.templatePreviewCard}>
              <div className={styles.templateBadge}>템플릿 생성결과</div>
              <div className={styles.templateCardContent}>
                {currentGeneratedImage ? (
                  <div className={styles.templateImage}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentGeneratedImage}
                      alt="생성된 템플릿 이미지"
                    />
                  </div>
                ) : (
                  <div className={styles.templateImagePlaceholder}>
                    <div className={styles.placeholderContent}>
                      <Sparkles size={32} />
                      <span>AI가 이미지를 생성하면 여기에 표시됩니다</span>
                    </div>
                  </div>
                )}
                <div className={styles.templateInfo}>
                  <h3 className={styles.templateTitle}>
                    {isFromTemplate
                      ? "템플릿에서 불러온 내용"
                      : currentGeneratedImage
                      ? "AI 생성 콘텐츠"
                      : "AI 생성 대기 중"}
                  </h3>
                  <div className={styles.templateDescription}>
                    <textarea
                      value={smsTextContent || ""}
                      onChange={(e) => setSmsTextContent(e.target.value)}
                      placeholder="AI가 생성한 마케팅 콘텐츠가 여기에 표시됩니다."
                      className={styles.templateDescriptionTextarea}
                      rows={4}
                    />
                    <span className={styles.charCount}>
                      {new Blob([smsTextContent]).size} / 2,000 bytes
                    </span>
                  </div>
                </div>

                {/* 템플릿 액션 버튼들 */}
                <div className={styles.templateActions}>
                  <button
                    className={styles.templateActionButton}
                    onClick={() => {
                      // 템플릿 불러오기 기능
                      if (currentGeneratedImage || smsTextContent) {
                        const confirmed = confirm(
                          "현재 내용을 템플릿으로 불러오시겠습니까?"
                        );
                        if (confirmed) {
                          // 템플릿 불러오기 로직
                          console.log("템플릿 불러오기");
                        }
                      }
                    }}
                  >
                    템플릿 불러오기
                  </button>
                  <button
                    className={styles.templateActionButton}
                    onClick={() => {
                      // 이미지 편집 모드 활성화
                      if (currentGeneratedImage) {
                        setInputMessage("이미지를 수정해주세요");
                        textareaRef.current?.focus();
                      } else {
                        alert(
                          "편집할 이미지가 없습니다. 먼저 이미지를 생성해주세요."
                        );
                      }
                    }}
                  >
                    이미지 편집
                  </button>
                  <button
                    className={styles.templateActionButton}
                    onClick={() => {
                      // 템플릿 저장 기능
                      if (currentGeneratedImage && smsTextContent) {
                        const templateData = {
                          id: `saved-${Date.now()}`,
                          title: isFromTemplate
                            ? "템플릿에서 불러온 내용"
                            : "AI 생성 콘텐츠",
                          description: smsTextContent,
                          imageUrl: currentGeneratedImage,
                          createdAt: new Date(),
                          status: "생성완료" as const,
                        };

                        // 로컬 스토리지에 저장
                        const savedTemplates = JSON.parse(
                          localStorage.getItem("savedTemplates") || "[]"
                        );
                        savedTemplates.push(templateData);
                        localStorage.setItem(
                          "savedTemplates",
                          JSON.stringify(savedTemplates)
                        );

                        alert("템플릿이 저장되었습니다!");
                      } else {
                        alert("저장할 템플릿 내용이 없습니다.");
                      }
                    }}
                  >
                    템플릿 저장
                  </button>
                </div>
              </div>
            </div>

            {/* 발송 정보 카드 */}
            <div className={styles.sendInfoCard}>
              {/* 발송 정보 */}
              <div className={styles.templateBadge}>발송 정보</div>

              {/* 발신번호 입력 */}
              <div className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Phone size={16} />
                  <span>발신번호</span>
                </div>
                <div className={styles.selectedSender}>
                  <div className={styles.senderInfoRow}>
                    <div className={styles.senderDetails}>
                      <div className={styles.senderDisplay}>
                        <Phone className={styles.senderIcon} size={16} />
                        <span className={styles.senderTitle}>
                          메시지 발신번호
                        </span>
                      </div>
                      <div className={styles.senderNumber}>테스트 번호</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 수신번호 입력 */}
              <div className={styles.contentSection}>
                <div className={styles.sectionHeader}>
                  <Smartphone size={16} />
                  <span>수신번호</span>
                </div>
                <div className={styles.recipientInput}>
                  <input
                    type="text"
                    value={recipientNumber}
                    onChange={(e) => setRecipientNumber(e.target.value)}
                    placeholder="수신번호를 입력하세요 (예: 01012345678)"
                    className={styles.numberInput}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 전송 버튼 */}
          <div className={styles.sendButtonSection}>
            <button
              className={`${styles.sendButton} ${styles.primary}`}
              onClick={handleDirectSendMMS}
              disabled={
                !recipientNumber.trim() ||
                !smsTextContent.trim() ||
                !currentGeneratedImage ||
                isSending
              }
            >
              {isSending ? "전송 중..." : "전송"}
            </button>
          </div>
        </div>
      </div>

      {/* MMS 전송 모달 */}
      {showSendModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.sendModal}`}>
            <div className={styles.modalHeader}>
              <h2>MMS 전송</h2>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setRecipients("");
                  setSelectedTemplate(null);
                }}
                className={styles.modalClose}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.templatePreview}>
                <h3>전송할 내용</h3>
                <div className={styles.previewCard}>
                  {currentGeneratedImage && (
                    <div className={styles.previewImage}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={currentGeneratedImage} alt="전송할 이미지" />
                    </div>
                  )}
                  <div className={styles.previewContent}>
                    <h4>{selectedTemplate?.title || "템플릿 내용"}</h4>
                    <p>{smsTextContent}</p>
                  </div>
                </div>
              </div>

              <div className={styles.recipientSection}>
                <label htmlFor="recipients">
                  <Phone size={16} />
                  수신번호
                </label>
                <textarea
                  id="recipients"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="수신번호를 입력하세요. 여러 번호는 쉼표(,)로 구분해주세요.&#10;예: 010-1234-5678, 010-9876-5432"
                  className={styles.recipientsInput}
                  rows={3}
                />
                <div className={styles.inputHelp}>
                  여러 번호를 입력할 때는 쉼표(,)로 구분해주세요.
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => {
                  setShowSendModal(false);
                  setRecipients("");
                  setSelectedTemplate(null);
                }}
                className={styles.cancelButton}
                disabled={isSending}
              >
                취소
              </button>
              <button
                onClick={handleSendMMS}
                className={`${styles.sendButton} ${styles.primary}`}
                disabled={!recipients.trim() || isSending}
              >
                {isSending ? (
                  <>
                    <div className={styles.loadingSpinner}></div>
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

// Suspense로 감싼 메인 컴포넌트
export default function TargetMarketingPage() {
  return (
    <AdvertiserGuard>
      <Suspense fallback={<div>Loading...</div>}>
        <TargetMarketingContent />
      </Suspense>
    </AdvertiserGuard>
  );
}
