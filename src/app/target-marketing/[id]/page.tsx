"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { Send, Sparkles, X, Phone } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";
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

  const [isFromTemplate, setIsFromTemplate] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [sendPolicy, setSendPolicy] = useState<"realtime" | "batch">(
    "realtime"
  );
  const [validityStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [validityEndDate, setValidityEndDate] = useState(() => {
    const today = new Date();
    const oneWeekLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return oneWeekLater.toISOString().split("T")[0];
  });
  const [maxRecipients, setMaxRecipients] = useState("30");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("week");

  // 타겟 필터 상태들 추가
  const [targetGender, setTargetGender] = useState("female");
  const [targetAge, setTargetAge] = useState("thirties");
  const [targetCity, setTargetCity] = useState("seoul");
  const [targetDistrict, setTargetDistrict] = useState("gangnam");
  const [cardAmount, setCardAmount] = useState("10000");
  const [cardStartTime, setCardStartTime] = useState("08:00");
  const [cardEndTime, setCardEndTime] = useState("12:00");
  const [cardTimePeriod, setCardTimePeriod] = useState("오전");

  // 승인 신청 처리 상태
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // 시간대 변경시 시간 옵션 업데이트
  useEffect(() => {
    const timeOptions = getTimeOptions(cardTimePeriod);

    // 현재 선택된 시간이 유효한지 확인하고 없으면 첫 번째 옵션으로 설정
    const validStartTime = timeOptions.find(
      (option) => option.value === cardStartTime
    );
    const validEndTime = timeOptions.find(
      (option) => option.value === cardEndTime
    );

    if (!validStartTime && timeOptions.length > 0) {
      setCardStartTime(timeOptions[0].value);
    }

    if (!validEndTime && timeOptions.length > 0) {
      setCardEndTime(timeOptions[timeOptions.length - 1].value);
    }
  }, [cardTimePeriod, cardStartTime, cardEndTime]);

  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // 카드 금액을 표시용 텍스트로 변환
  const getAmountDisplayText = (amount: string) => {
    switch (amount) {
      case "10000":
        return "1만원";
      case "50000":
        return "5만원";
      case "100000":
        return "10만원";
      case "all":
        return "전체";
      default:
        return "1만원";
    }
  };

  // 시간대별 시간 옵션 생성
  const getTimeOptions = (period: string) => {
    const options: { value: string; label: string }[] = [];

    let startHour = 0;
    let endHour = 23;

    if (period === "오전") {
      startHour = 0;
      endHour = 12;
    } else if (period === "오후") {
      startHour = 12;
      endHour = 23;
    } else if (period === "전체") {
      startHour = 0;
      endHour = 23;
    }

    for (let hour = startHour; hour <= endHour; hour++) {
      const hourStr = hour.toString().padStart(2, "0");

      options.push({
        value: `${hourStr}:00`,
        label: `${hourStr}:00`,
      });
    }

    return options;
  };

  // 유효기간 설정 함수
  const setPeriod = (period: "week" | "month" | "year") => {
    const today = new Date();
    let endDate: Date;

    switch (period) {
      case "week":
        endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        endDate = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate()
        );
        break;
      case "year":
        endDate = new Date(
          today.getFullYear() + 1,
          today.getMonth(),
          today.getDate()
        );
        break;
      default:
        endDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    setValidityEndDate(endDate.toISOString().split("T")[0]);
    setSelectedPeriod(period);
  };

  // 일괄발송 시간 옵션 생성 (00:00 ~ 23:00)
  const getBatchTimeOptions = () => {
    const options: { value: string; label: string }[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, "0");
      options.push({
        value: `${hourStr}:00`,
        label: `${hourStr}:00`,
      });
    }

    return options;
  };

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

  // 승인 신청 처리 함수
  const handleApprovalSubmit = async () => {
    if (!smsTextContent.trim() || !currentGeneratedImage) {
      alert("캠페인 내용과 이미지가 필요합니다.");
      return;
    }

    setIsSubmittingApproval(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      // 캠페인 데이터 준비
      const campaignData = {
        title: "AI 생성 캠페인",
        content: smsTextContent,
        imageUrl: currentGeneratedImage,
        sendPolicy: sendPolicy,
        validityStartDate: validityStartDate,
        validityEndDate: validityEndDate,
        maxRecipients: maxRecipients,
        targetFilters: {
          gender: targetGender,
          ageGroup: targetAge,
          location: {
            city: targetCity,
            district: targetDistrict,
          },
          cardAmount: cardAmount,
          cardTime: {
            startTime: cardStartTime,
            endTime: cardEndTime,
            period: cardTimePeriod,
          },
        },
        estimatedCost: 21000, // 예상 금액
      };

      // 캠페인 생성 API 호출
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(campaignData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "캠페인 저장에 실패했습니다.");
      }

      const result = await response.json();

      if (result.success) {
        alert("승인 신청이 성공적으로 제출되었습니다!");
        setShowApprovalModal(false);

        // 폼 초기화 (선택사항)
        // setSmsTextContent("");
        // setCurrentGeneratedImage(null);
      } else {
        throw new Error(result.message || "캠페인 저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 신청 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "승인 신청 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmittingApproval(false);
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

            {/* 타겟 추천 결과 섹션 */}
            <div className={styles.targetRecommendationCard}>
              <div className={styles.templateBadge}>타겟 추천 결과</div>

              {/* 타겟 설정 */}
              <div className={styles.targetFiltersSection}>
                <div className={styles.sectionTitle}>타겟 설정</div>
                <div className={styles.filterRow}>
                  <div className={styles.filterGroup}>
                    <select
                      className={styles.filterSelect}
                      value={targetGender}
                      onChange={(e) => setTargetGender(e.target.value)}
                    >
                      <option value="female">여성</option>
                      <option value="male">남성</option>
                      <option value="all">전체</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <select
                      className={styles.filterSelect}
                      value={targetAge}
                      onChange={(e) => setTargetAge(e.target.value)}
                    >
                      <option value="thirties">30대</option>
                      <option value="teens">10대</option>
                      <option value="twenties">20대</option>
                      <option value="forties">40대</option>
                      <option value="fifties">50대+</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 카드 사용 위치 */}
              <div className={styles.targetFiltersSection}>
                <div className={styles.sectionTitle}>카드 사용 위치</div>
                <div className={styles.filterRow}>
                  <div className={styles.filterGroup}>
                    <select
                      className={styles.filterSelect}
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                    >
                      <option value="seoul">서울시</option>
                      <option value="busan">부산광역시</option>
                      <option value="daegu">대구광역시</option>
                      <option value="incheon">인천광역시</option>
                      <option value="gwangju">광주광역시</option>
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <select
                      className={styles.filterSelect}
                      value={targetDistrict}
                      onChange={(e) => setTargetDistrict(e.target.value)}
                    >
                      <option value="gangnam">강남구</option>
                      <option value="gangdong">강동구</option>
                      <option value="gangbuk">강북구</option>
                      <option value="gangseo">강서구</option>
                      <option value="seocho">서초구</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 카드 송신 금액 */}
              <div className={styles.cardAmountSection}>
                <div className={styles.sectionTitle}>카드 송신 금액</div>
                <div className={styles.amountInputSection}>
                  <input
                    type="text"
                    value={getAmountDisplayText(cardAmount)}
                    className={styles.amountInput}
                    readOnly
                  />
                  <span className={styles.amountLabel}>
                    {cardAmount === "all" ? "" : "미만"}
                  </span>
                </div>
                <div className={styles.amountOptions}>
                  <button
                    className={`${styles.amountButton} ${
                      cardAmount === "10000" ? styles.active : ""
                    }`}
                    onClick={() => setCardAmount("10000")}
                  >
                    1만원 미만
                  </button>
                  <button
                    className={`${styles.amountButton} ${
                      cardAmount === "50000" ? styles.active : ""
                    }`}
                    onClick={() => setCardAmount("50000")}
                  >
                    5만원 미만
                  </button>
                  <button
                    className={`${styles.amountButton} ${
                      cardAmount === "100000" ? styles.active : ""
                    }`}
                    onClick={() => setCardAmount("100000")}
                  >
                    10만원 미만
                  </button>
                  <button
                    className={`${styles.amountButton} ${
                      cardAmount === "all" ? styles.active : ""
                    }`}
                    onClick={() => setCardAmount("all")}
                  >
                    전체
                  </button>
                </div>
              </div>

              {/* 카드 송신 시간 */}
              <div className={styles.cardTimeSection}>
                <div className={styles.sectionTitle}>카드 송신 시간</div>
                <div className={styles.timeSelectors}>
                  <div className={styles.timeGroup}>
                    <select
                      className={styles.timeSelect}
                      value={cardStartTime}
                      onChange={(e) => setCardStartTime(e.target.value)}
                    >
                      {getTimeOptions(cardTimePeriod).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className={styles.timeSeparator}>~</span>
                  <div className={styles.timeGroup}>
                    <select
                      className={styles.timeSelect}
                      value={cardEndTime}
                      onChange={(e) => setCardEndTime(e.target.value)}
                    >
                      {getTimeOptions(cardTimePeriod).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.timeOptions}>
                  <button
                    className={`${styles.timeButton} ${
                      cardTimePeriod === "오전" ? styles.active : ""
                    }`}
                    onClick={() => setCardTimePeriod("오전")}
                  >
                    오전
                  </button>
                  <button
                    className={`${styles.timeButton} ${
                      cardTimePeriod === "오후" ? styles.active : ""
                    }`}
                    onClick={() => setCardTimePeriod("오후")}
                  >
                    오후
                  </button>
                  <button
                    className={`${styles.timeButton} ${
                      cardTimePeriod === "전체" ? styles.active : ""
                    }`}
                    onClick={() => setCardTimePeriod("전체")}
                  >
                    전체
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 예상금액 */}
          <div className={styles.costEstimationSection}>
            <div className={styles.costLabel}>예상금액</div>
            <div className={styles.costValue}>
              <span className={styles.costAmount}>100원/</span>
              <span className={styles.costUnit}>건</span>
            </div>
          </div>

          {/* 승인 신청 버튼 */}
          <div className={styles.approvalButtonSection}>
            <button
              className={`${styles.approvalButton} ${styles.primary}`}
              onClick={() => {
                if (smsTextContent.trim() && currentGeneratedImage) {
                  setShowApprovalModal(true);
                } else {
                  alert("템플릿 내용을 먼저 생성해주세요.");
                }
              }}
            >
              승인 신청
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

      {/* 발송 정책 선택 모달 */}
      {showApprovalModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalContent} ${styles.approvalModal}`}>
            <div className={styles.modalHeader}>
              <h2>발송 정책 선택</h2>
              <button
                onClick={() => setShowApprovalModal(false)}
                className={styles.modalClose}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.policyDescription}>
                <p>
                  ※ 실시간 발송이란? 유효 기간 동안 카드 승인 시간에 고객에게
                  문자 메시지를 즉시 발송하는 방식입니다.
                </p>
                <p>
                  ※ 일괄 발송이란? 수집된 고객 데이터를 기반으로, AI가 가장 반응
                  가능성이 높은 타겟을 선별하여 한 번에 문자 메시지를 발송하는
                  방식입니다.
                </p>
              </div>

              <div className={styles.policyOptions}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={sendPolicy === "realtime"}
                    onChange={() => setSendPolicy("realtime")}
                    className={styles.checkbox}
                  />
                  <span>실시간 발송</span>
                </label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={sendPolicy === "batch"}
                    onChange={() => setSendPolicy("batch")}
                    className={styles.checkbox}
                  />
                  <span>일괄 발송</span>
                </label>
              </div>

              {sendPolicy === "realtime" && (
                <>
                  <div className={styles.validitySection}>
                    <label>유효 기간</label>
                    <div className={styles.dateInputs}>
                      <input
                        type="date"
                        value={validityStartDate}
                        className={styles.dateInput}
                        readOnly
                      />
                      <span>~</span>
                      <input
                        type="date"
                        value={validityEndDate}
                        onChange={(e) => setValidityEndDate(e.target.value)}
                        className={styles.dateInput}
                      />
                    </div>
                    <div className={styles.periodButtons}>
                      <button
                        className={`${styles.periodButton} ${
                          selectedPeriod === "week" ? styles.active : ""
                        }`}
                        onClick={() => setPeriod("week")}
                      >
                        일주일
                      </button>
                      <button
                        className={`${styles.periodButton} ${
                          selectedPeriod === "month" ? styles.active : ""
                        }`}
                        onClick={() => setPeriod("month")}
                      >
                        한달
                      </button>
                      <button
                        className={`${styles.periodButton} ${
                          selectedPeriod === "year" ? styles.active : ""
                        }`}
                        onClick={() => setPeriod("year")}
                      >
                        1년
                      </button>
                    </div>
                  </div>

                  <div className={styles.recipientLimitSection}>
                    <label>일 최대 건수</label>
                    <input
                      type="text"
                      value={maxRecipients + "건"}
                      onChange={(e) =>
                        setMaxRecipients(e.target.value.replace("건", ""))
                      }
                      className={styles.recipientInput}
                    />
                  </div>
                </>
              )}

              {sendPolicy === "batch" && (
                <>
                  <div className={styles.batchSection}>
                    <div className={styles.batchInfo}>
                      <span>발송 일·시간</span>
                      <p>
                        ※ 발송 일·시는 승인 이후에 가능합니다. (승인은 2일 정도
                        소요)
                      </p>
                    </div>
                    <div className={styles.batchContentContainer}>
                      <div className={styles.batchSelectors}>
                        <select className={styles.batchSelect}>
                          <option>오늘+3일</option>
                          <option>오늘+7일</option>
                          <option>오늘+14일</option>
                        </select>
                        <select className={styles.batchSelect}>
                          {getBatchTimeOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.targetCountInfo}>
                        <span>타겟 대상자 수</span>
                        <span>500명</span>
                      </div>

                      <div className={styles.adRecipientSection}>
                        <span>광고 수신자 수</span>
                        <input
                          type="text"
                          value="30명"
                          onChange={(e) =>
                            setMaxRecipients(e.target.value.replace("명", ""))
                          }
                          className={styles.adRecipientInput}
                        />
                      </div>

                      <p className={styles.adRecipientNotice}>
                        ※ 광고 수신자 수는 타겟 대상자 수를 초과할 수 없습니다.
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className={styles.costSummary}>
                <div className={styles.costRow}>
                  <span>예상금액</span>
                  <span>캠페인</span>
                  <span>100원/건</span>
                </div>
                <div className={styles.costRow}>
                  <span></span>
                  <span>합계</span>
                  <span>21,000원</span>
                </div>
                <div className={styles.costRow}>
                  <span></span>
                  <span>충전 잔액</span>
                  <span>
                    <span className={styles.balanceAmount}>500</span>
                    <span className={styles.balanceUnit}>원</span>
                  </span>
                </div>
                <div className={styles.costRow}>
                  <span></span>
                  <span className={styles.chargeNoticeText}>
                    ⚠ 잔액을 충전해주세요.
                  </span>
                  <span>
                    <button className={styles.chargeButton}>+ 충전하기</button>
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowApprovalModal(false)}
                className={styles.cancelButton}
                disabled={isSubmittingApproval}
              >
                닫기
              </button>
              <button
                onClick={handleApprovalSubmit}
                className={`${styles.sendButton} ${styles.primary}`}
                disabled={isSubmittingApproval}
              >
                {isSubmittingApproval ? (
                  <>
                    <div className={styles.loadingSpinner}></div>
                    승인 신청 중...
                  </>
                ) : (
                  "승인 신청"
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
    <AdvertiserGuardWithDisabled>
      <Suspense fallback={<div>Loading...</div>}>
        <TargetMarketingContent />
      </Suspense>
    </AdvertiserGuardWithDisabled>
  );
}
