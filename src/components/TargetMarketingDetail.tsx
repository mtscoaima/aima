"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import SuccessModal from "@/components/SuccessModal";
import ApprovalRequestComplete from "./ApprovalRequestComplete";
import { PaymentModal } from "@/components/PaymentModal";
import { useBalance } from "@/contexts/BalanceContext";
import {
  targetOptions,
  getDistrictsByCity,
  getIndustriesByTopLevel,
} from "@/lib/targetOptions";
// Import separated types and hooks
import {
  Message,
  GeneratedTemplate,
  Package,
  DynamicButton,
  TargetMarketingDetailProps,
  Campaign,
  Template
} from "@/types/targetMarketing";
import {
  useTemplateGeneration,
  useTargetAnalysis,
  useDynamicButtons,
  useTargetOptions,
  useCalculations
} from "@/hooks/useTargetMarketing";
import {
  IMAGE_EDIT_KEYWORDS,
  FILE_CONSTRAINTS,
  CAMPAIGN_CONSTANTS,
  TEXT_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  BUTTON_CONSTRAINTS
} from "@/constants/targetMarketing";
// 분리된 모달 컴포넌트들
import ApprovalModal from "@/components/modals/ApprovalModal";
import CampaignModal from "@/components/modals/CampaignModal";
import TemplateModal from "@/components/modals/TemplateModal";
import PreviewModal from "@/components/modals/PreviewModal";
import SaveTemplateModal from "@/components/modals/SaveTemplateModal";
// 분리된 API 서비스들
import * as aiService from "@/services/aiService";
import * as templateService from "@/services/templateService";
import * as campaignService from "@/services/campaignService";
import * as creditService from "@/services/creditService";
// import * as uploadService from "@/services/uploadService"; // 현재 미사용
// 분리된 유틸리티 함수들
import * as dateUtils from "@/utils/dateUtils";
// import * as formatUtils from "@/utils/formatUtils"; // 현재 미사용
import * as validationUtils from "@/utils/validationUtils";
import * as storageUtils from "@/utils/storageUtils";
import * as idUtils from "@/utils/idUtils";
// styles import removed - using Tailwind CSS instead

function TargetMarketingDetailContent({
  templateId,
  useTemplate,
  initialMessage,
  initialImage,
}: TargetMarketingDetailProps) {
  const router = useRouter();
  const {
    balanceData,
    isLoading: isLoadingCredits,
    refreshTransactions,
  } = useBalance();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [smsTextContent, setSmsTextContent] = useState("");
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<
    string | null
  >(null);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([]);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [sendPolicy, setSendPolicy] = useState<"realtime" | "batch">(
    "realtime"
  );
  const [validityStartDate] = useState(dateUtils.getTodayString());
  const [validityEndDate, setValidityEndDate] = useState(dateUtils.getDateAfterWeek());
  const [maxRecipients, setMaxRecipients] = useState(CAMPAIGN_CONSTANTS.DEFAULT_MAX_RECIPIENTS);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("week");

  // 타겟 필터 상태들 추가
  const [targetGender, setTargetGender] = useState("all");
  const [targetAge, setTargetAge] = useState<string[]>(["all"]);
  const [targetCity, setTargetCity] = useState("all");
  const [targetDistrict, setTargetDistrict] = useState("all");
  const [targetTopLevelIndustry, setTargetTopLevelIndustry] = useState("all");
  const [targetIndustry, setTargetIndustry] = useState("all");
  const [cardAmount, setCardAmount] = useState(CAMPAIGN_CONSTANTS.DEFAULT_CARD_AMOUNT);
  const [customAmount, setCustomAmount] = useState(CAMPAIGN_CONSTANTS.DEFAULT_CUSTOM_AMOUNT);
  const [cardAmountInput, setCardAmountInput] = useState(CAMPAIGN_CONSTANTS.DEFAULT_CARD_AMOUNT_INPUT);
  const [cardStartTime, setCardStartTime] = useState(CAMPAIGN_CONSTANTS.DEFAULT_START_TIME);
  const [cardEndTime, setCardEndTime] = useState(CAMPAIGN_CONSTANTS.DEFAULT_END_TIME);

  // 승인 신청 처리 상태
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // 드롭다운 상태
  const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);
  const ageDropdownRef = useRef<HTMLDivElement>(null);

  // 캠페인 불러오기 모달 상태
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // 템플릿 불러오기 모달 상태
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateList, setTemplateList] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // 미리보기 모달 상태
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // 템플릿 저장 모달 상태
  const [isSaveTemplateModalOpen, setIsSaveTemplateModalOpen] = useState(false);
  const [templateSaveName, setTemplateSaveName] = useState("");
  const [templateSaveCategory, setTemplateSaveCategory] = useState("");
  const [templateIsPrivate, setTemplateIsPrivate] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  // 파일 업로드 관련 상태
  const [showImageDropdown, setShowImageDropdown] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 템플릿 이미지 업로드 관련 상태
  const imageUploadInputRef = useRef<HTMLInputElement>(null);

  // 성공 모달 상태
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // 승인 요청 완료 페이지 표시 상태
  const [showApprovalComplete, setShowApprovalComplete] = useState(false);

  // 템플릿 제목 상태
  const [templateTitle, setTemplateTitle] = useState("AI 생성 콘텐츠");

  // 기존 템플릿 ID 상태 (템플릿 사용하기로 온 경우)
  const [existingTemplateId, setExistingTemplateId] = useState<number | null>(
    null
  );

  // 크레딧 관련 상태
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // BalanceContext에서 크레딧 정보 가져오기
  const userCredits = balanceData.balance;

  // 이미지 생성 로딩 상태 추가
  const [isImageGenerating, setIsImageGenerating] = useState(false);

  // 일괄 발송 관련 상태
  const [batchSendDate, setBatchSendDate] = useState("오늘+3일");
  const [batchSendTime, setBatchSendTime] = useState("00:00");
  const [targetCount, setTargetCount] = useState(CAMPAIGN_CONSTANTS.DEFAULT_TARGET_COUNT); // 타겟 대상자 수
  const [adRecipientCount, setAdRecipientCount] = useState(CAMPAIGN_CONSTANTS.DEFAULT_AD_RECIPIENT_COUNT); // 광고 수신자 수

  // 동적 버튼 관리 상태
  const [dynamicButtons, setDynamicButtons] = useState<DynamicButton[]>([]);

  // 커스텀 훅들 사용
  const { generateTemplateTitle } = useTemplateGeneration();
  const { analyzeTargetContent } = useTargetAnalysis();
  const { addDynamicButton, removeDynamicButton, updateDynamicButton, handleLinkCheck } = useDynamicButtons();
  const { getAllTimeOptions, getSelectedAgeDisplay } = useTargetOptions();
  const { calculateTotalCost, calculateRequiredCredits } = useCalculations();

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ageDropdownRef.current && !ageDropdownRef.current.contains(event.target as Node)) {
        setIsAgeDropdownOpen(false);
      }
    };

    if (isAgeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAgeDropdownOpen]);

  // 카드 승인 금액 버튼 클릭 핸들러
  const handleAmountButtonClick = (optionValue: string) => {
    setCardAmount(optionValue);
    
    // 각 버튼에 따라 input 값 설정
    switch (optionValue) {
      case "10000":
        setCardAmountInput("1");
        break;
      case "50000":
        setCardAmountInput("5");
        break;
      case "100000":
        setCardAmountInput("10");
        break;
      case "all":
        setCardAmountInput("");
        break;
      case "custom":
        // 직접 입력의 경우 현재 customAmount 값 사용
        setCardAmountInput(customAmount);
        break;
      default:
        setCardAmountInput("1");
    }
  };

  // 카드 승인 시간 버튼 클릭 핸들러
  const handleTimePresetClick = (preset: string) => {
    switch (preset) {
      case "morning":
        setCardStartTime("08:00");
        setCardEndTime("12:00");
        break;
      case "afternoon":
        setCardStartTime("12:00");
        setCardEndTime("18:00");
        break;
      case "all":
        setCardStartTime("08:00");
        setCardEndTime("18:00");
        break;
      default:
        break;
    }
  };



  // 시간 유효성 검증
  useEffect(() => {
    const { endTime, isAdjusted } = dateUtils.validateAndAdjustTimeRange(cardStartTime, cardEndTime);
    if (isAdjusted) {
      setCardEndTime(endTime);
    }
  }, [cardStartTime, cardEndTime]);

  // 도시 변경시 구/군 옵션 업데이트
  useEffect(() => {
    const districts = getDistrictsByCity(targetCity);

    // 현재 선택된 구가 유효한지 확인하고 없으면 첫 번째 옵션으로 설정
    const validDistrict = districts.find(
      (option) => option.value === targetDistrict
    );

    if (!validDistrict && districts.length > 0) {
      setTargetDistrict(districts[0].value);
    }
  }, [targetCity, targetDistrict]);

  // 상위 업종 변경시 세부 업종 옵션 업데이트
  useEffect(() => {
    const industries = getIndustriesByTopLevel(targetTopLevelIndustry);

    // 현재 선택된 업종이 유효한지 확인하고 없으면 첫 번째 옵션으로 설정
    const validIndustry = industries.find(
      (option) => option.value === targetIndustry
    );

    if (!validIndustry && industries.length > 0) {
      setTargetIndustry(industries[0].value);
    }
  }, [targetTopLevelIndustry, targetIndustry]);

  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // 유효기간 설정 함수
  const setPeriod = (period: "week" | "month" | "year") => {
    const endDate = dateUtils.getDateAfterPeriod(period);
    setValidityEndDate(endDate);
    setSelectedPeriod(period);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // 크레딧 패키지 선택 처리
  const handleCharge = async (packageInfo: Package) => {
    try {
      // 결제 전 현재 상태 저장
      saveCurrentState();
      setSelectedPackage(packageInfo);
      setIsPaymentModalOpen(true);
    } catch (error) {
      console.error("패키지 선택 오류:", error);
      alert("패키지 선택 중 오류가 발생했습니다.");
    }
  };

  // 권장 패키지 자동 선택 처리
  const handleAutoSelectPackage = async () => {
    try {
      // 필요한 크레딧 계산
      const totalCostForPackage = calculateTotalCost(sendPolicy, maxRecipients, adRecipientCount);
      const requiredCredits = calculateRequiredCredits(totalCostForPackage, userCredits);

      // 권장 패키지 조회
      const recommendedPackage = await creditService.getRecommendedPackage(requiredCredits);

      if (!recommendedPackage) {
        // 패키지 목록이 없거나 가장 큰 패키지로도 부족한 경우
        const { packages } = await creditService.getCreditPackages();
        
        if (packages.length === 0) {
          alert(ERROR_MESSAGES.NO_PACKAGES_AVAILABLE);
          return;
        }

        const largestPackage = packages.sort((a, b) => b.credits - a.credits)[0];
        alert(
          `최대 패키지(${largestPackage.credits.toLocaleString()}크레딧)로도 부족합니다. 더 작은 캠페인으로 진행해주세요.`
        );
        return;
      }

      // Package 타입으로 변환
      const packageInfo = creditService.convertToPackageType(recommendedPackage);
      await handleCharge(packageInfo);
    } catch (error) {
      console.error("자동 패키지 선택 오류:", error);
      alert("패키지 정보를 가져오는 중 오류가 발생했습니다.");
    }
  };

  // 결제 모달 닫기
  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPackage(null);
  };

  // 현재 상태 저장 (결제 전)
  const saveCurrentState = () => {
    const currentState = {
      templateTitle,
      smsTextContent,
      currentGeneratedImage,
      targetGender,
      targetAge,
      targetCity,
      targetDistrict,
      targetTopLevelIndustry,
      targetIndustry,
      cardAmount,
      customAmount,
      cardAmountInput,
      cardStartTime,
      cardEndTime,
      maxRecipients,
      sendPolicy,
      validityStartDate,
      validityEndDate,
      dynamicButtons,
      showApprovalModal: true, // 결제 완료 후 발송 모달 다시 열기
    };

    storageUtils.saveTargetMarketingState(currentState);
  };

  // 저장된 상태 복원
  const restoreState = React.useCallback(() => {
    try {
      const state = storageUtils.restoreTargetMarketingState();
      if (!state) return false;

      // 상태 복원
      setTemplateTitle(state.templateTitle || "AI 생성 콘텐츠");
      setSmsTextContent(state.smsTextContent || "");
      setCurrentGeneratedImage(state.currentGeneratedImage || null);
      setTargetGender(state.targetGender || "all");
      setTargetAge(state.targetAge || ["all"]);
      setTargetCity(state.targetCity || "all");
      setTargetDistrict(state.targetDistrict || "all");
      setTargetTopLevelIndustry(state.targetTopLevelIndustry || "all");
      setTargetIndustry(state.targetIndustry || "all");
      setCardAmount(state.cardAmount || "10000");
      setCustomAmount(state.customAmount || "50");
      setCardAmountInput(state.cardAmountInput || "1");
      setCardStartTime(state.cardStartTime || "08:00");
      setCardEndTime(state.cardEndTime || "18:00");
      setMaxRecipients(state.maxRecipients || "30");
      setSendPolicy(state.sendPolicy || "realtime");
      // validityStartDate는 읽기 전용이므로 제외
      setValidityEndDate(state.validityEndDate || validityEndDate);
      setDynamicButtons(state.dynamicButtons || []);

      // 결제 완료 후 발송 모달 다시 열기
      if (state.showApprovalModal) {
        setTimeout(() => {
          setShowApprovalModal(true);
        }, 1000);
      }

      // 저장된 상태 제거
      storageUtils.clearTargetMarketingState();
      return true;
    } catch (error) {
      console.error("상태 복원 실패:", error);
      storageUtils.clearTargetMarketingState();
      return false;
    }
  }, [validityEndDate]);

  // 크레딧 충전 모달 열기 (권장 패키지 자동 선택)
  const openCreditModal = () => {
    handleAutoSelectPackage();
  };

  // 초기 메시지에 대한 AI 응답 처리 (실제 AI API 호출)
  const handleInitialResponse = React.useCallback(
    async (
      userMessage: string,
      currentMessages: Message[],
      initialImageUrl?: string | null
    ) => {
      setShowTypingIndicator(true);

      try {
        // 사용자 입력 내용을 분석하여 타겟 설정
        const analysis = analyzeTargetContent(userMessage);
        setTargetGender(analysis.gender);
        setTargetAge(analysis.age);
        setTargetCity(analysis.city);
        setTargetDistrict(analysis.district);
        setTargetTopLevelIndustry(analysis.topLevelIndustry);
        setTargetIndustry(analysis.industry);
        setCardAmount(analysis.cardAmount);
        setCardStartTime(analysis.startTime);
        setCardEndTime(analysis.endTime);

        // 사용자 입력 내용을 기반으로 제목 업데이트
        const generatedTitle = generateTemplateTitle(userMessage);
        setTemplateTitle(generatedTitle);

        // 스트리밍 응답을 위한 임시 메시지 생성
        const assistantMessageId = `assistant-initial-${Date.now()}`;
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
        };

        const initialMessages = [...currentMessages, assistantMessage];
        setMessages(initialMessages);

        // 실제 AI API 호출
        const requestBody: {
          message: string;
          previousMessages: Message[];
          initialImage?: string;
        } = {
          message: userMessage,
          previousMessages: [],
        };

        // 초기 이미지가 있으면 요청에 포함
        if (initialImageUrl) {
          requestBody.initialImage = initialImageUrl;
        }

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
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
                const jsonString = line.slice(6).trim();

                // 더 강화된 JSON 검증 (초기 응답)
                if (
                  !jsonString ||
                  jsonString.length < 10 ||
                  jsonString === "{" ||
                  jsonString.startsWith('{"response') ||
                  jsonString.startsWith('{ "response') ||
                  !jsonString.endsWith("}") ||
                  !jsonString.includes('"type"')
                ) {
                  continue;
                }

                const data = JSON.parse(jsonString);

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
                            isImageLoading: false,
                          }
                        : msg
                    )
                  );
                  setTimeout(() => {
                    if (chatMessagesRef.current) {
                      chatMessagesRef.current.scrollTop =
                        chatMessagesRef.current.scrollHeight;
                    }
                  }, 50);
                } else if (data.type === "text_replace") {
                  setShowTypingIndicator(false);

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

                  if (data.smsTextContent) {
                    setSmsTextContent(data.smsTextContent);
                  }

                  if (data.templateData && data.templateData.title) {
                    setTemplateTitle(data.templateData.title);
                  }

                  setTimeout(() => {
                    if (chatMessagesRef.current) {
                      chatMessagesRef.current.scrollTop =
                        chatMessagesRef.current.scrollHeight;
                    }
                  }, 50);
                } else if (data.type === "partial_image") {
                  setShowTypingIndicator(false);
                  setIsImageGenerating(true);

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
                  setTimeout(() => {
                    if (chatMessagesRef.current) {
                      chatMessagesRef.current.scrollTop =
                        chatMessagesRef.current.scrollHeight;
                    }
                  }, 100);
                } else if (data.type === "image_generated") {
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

                  setCurrentGeneratedImage(data.imageUrl);
                  setIsImageGenerating(false);
                  setTimeout(() => {
                    if (chatMessagesRef.current) {
                      chatMessagesRef.current.scrollTop =
                        chatMessagesRef.current.scrollHeight;
                    }
                  }, 100);
                } else if (data.type === "response_complete") {
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

                  if (data.smsTextContent) {
                    setSmsTextContent(data.smsTextContent);
                  }

                  if (data.imageUrl) {
                    setCurrentGeneratedImage(data.imageUrl);
                  }

                  // 응답이 완료되면 이미지 생성 로딩 상태를 항상 해제
                  setIsImageGenerating(false);

                  if (data.templateData && data.templateData.title) {
                    setTemplateTitle(data.templateData.title);
                  }

                  if (data.imageUrl && data.templateData) {
                    const newTemplate: GeneratedTemplate = {
                      id: idUtils.generateTemplateId(),
                      title: data.templateData.title || templateTitle,
                      description:
                        data.templateData.description ||
                        data.smsTextContent ||
                        smsTextContent,
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
                console.error(
                  "JSON 파싱 오류:",
                  parseError,
                  "원본 라인:",
                  line
                );
                continue;
              }
            }
          }
        }
      } catch (error) {
        console.error("초기 AI 채팅 오류:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id.includes("initial")
              ? {
                  ...msg,
                  content:
                    "죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.",
                }
              : msg
          )
        );
      } finally {
        setShowTypingIndicator(false);
        setIsImageGenerating(false);
      }
    },
    [analyzeTargetContent, generateTemplateTitle, templateTitle, smsTextContent]
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

      const initialMessages: Message[] = [];

      if (initialMessage && initialMessage.trim()) {
        // 첨부 파일 정보 확인
        const attachedFile = storageUtils.getAndClearInitialFile();

        // 사용자의 초기 메시지를 첫 번째로 추가
        const userMessage: Message = {
          id: "user-initial",
          role: "user",
          content: initialMessage.trim(),
          timestamp: new Date(),
          attachedFile,
        };

        initialMessages.push(userMessage);
        prevMessagesLengthRef.current = 1;
      } else {
        prevMessagesLengthRef.current = 0;
      }

      // 한 번에 모든 상태 설정
      setMessages(initialMessages);
      setTemplates([initialTemplate]);

      // 초기 이미지가 있으면 현재 생성된 이미지로 설정
      if (initialImage) {
        setCurrentGeneratedImage(initialImage);
      }

      setIsInitialized(true);

      // 초기 메시지가 있는 경우에만 AI 응답 처리 (비동기 처리)
      if (initialMessage && initialMessage.trim()) {
        // 상태 설정 후 약간의 지연을 두고 AI 응답 처리
        setTimeout(() => {
          // 초기 이미지도 함께 전달
          handleInitialResponse(
            initialMessage.trim(),
            initialMessages,
            initialImage
          );
        }, 1000);
      }
    }
  }, [isInitialized, handleInitialResponse, initialMessage, initialImage]);

  // 템플릿 사용하기로 온 경우 처리
  useEffect(() => {
    if (!isInitialized) return;

    if (useTemplate && templateId) {
      const savedTemplate = localStorage.getItem("selectedTemplate");
      if (savedTemplate) {
        try {
          const templateData = JSON.parse(savedTemplate);

          // 우측 MMS 전송 섹션에 템플릿 데이터 설정
          setSmsTextContent(templateData.content);
          setCurrentGeneratedImage(templateData.image_url);
          setTemplateTitle(
            templateData.name || templateData.title || "템플릿에서 불러온 내용"
          );

          // 기존 템플릿 ID 설정
          if (templateData.id) {
            setExistingTemplateId(templateData.id);
          }

          // localStorage에서 템플릿 데이터 제거
          localStorage.removeItem("selectedTemplate");
        } catch (error) {
          console.error("템플릿 데이터 파싱 오류:", error);
        }
      }
    }
  }, [useTemplate, templateId, isInitialized]);

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

  // 페이지 로드 시 저장된 상태 복원 (결제 완료 후 돌아온 경우)
  useEffect(() => {
    // 결제 완료 플래그 확인
    const { completed, timeDiff } = storageUtils.isPaymentCompleted();

    if (completed && timeDiff !== undefined) {
      // 결제 완료 후 30초 이내인 경우에만 상태 복원
      if (timeDiff < 30000) {
        const restored = restoreState();
        if (restored) {
          // 결제 성공 시 크레딧 잔액 새로고침
          setTimeout(async () => {
            await refreshTransactions(); // 크레딧 잔액 새로고침
            alert(SUCCESS_MESSAGES.PAYMENT_COMPLETED);
          }, 1000);
        }

        // 플래그 제거
        storageUtils.clearPaymentCompleted();
      }
    }
  }, [refreshTransactions, restoreState]);

  // 이미지 편집 처리
  const handleImageEdit = useCallback(async (prompt: string) => {
    if (!currentGeneratedImage) {
      alert("편집할 이미지가 없습니다. 먼저 이미지를 생성해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setShowTypingIndicator(true);

      const data = await aiService.editImage({
        baseImageUrl: currentGeneratedImage,
        editPrompt: prompt,
      });

      setCurrentGeneratedImage(data.imageUrl);

      const editedMessage: Message = {
        id: idUtils.generateEditedImageId(),
        role: "assistant",
        content: `✨ 이미지가 수정되었습니다: ${prompt}`,
        timestamp: new Date(),
        imageUrl: data.imageUrl,
      };
      setMessages((prev) => [...prev, editedMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: idUtils.generateErrorMessageId(),
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
  }, [currentGeneratedImage]);

  // 메시지 전송 처리
  const handleSendMessage = useCallback(async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputMessage;
    if (!messageToSend.trim() || isLoading) return;

    // 이미지 수정 키워드 감지
    const hasImageEditKeyword = IMAGE_EDIT_KEYWORDS.some((keyword) =>
      messageToSend.includes(keyword)
    );

    // 현재 이미지가 있고 이미지 수정 키워드가 포함된 경우
    if (currentGeneratedImage && hasImageEditKeyword) {
      await handleImageEdit(messageToSend);
      return;
    }

    const userMessage: Message = {
      id: idUtils.generateUserMessageId(),
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    };

    // 사용자 입력 내용을 기반으로 제목 업데이트
    const generatedTitle = generateTemplateTitle(messageToSend);
    setTemplateTitle(generatedTitle);

    setMessages((prev) => [...prev, userMessage]);
    // messageOverride가 없을 때만 input 비우기 (직접 입력한 경우)
    if (!messageOverride) {
    setInputMessage("");
    }
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
          message: messageToSend,
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
              const jsonString = line.slice(6).trim();

              // 더 강화된 JSON 검증 (일반 메시지)
              if (
                !jsonString ||
                jsonString.length < 10 ||
                jsonString === "{" ||
                jsonString.startsWith('{"response') ||
                jsonString.startsWith('{ "response') ||
                !jsonString.endsWith("}") ||
                !jsonString.includes('"type"')
              ) {
                continue;
              }

              const data = JSON.parse(jsonString);

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

                // 템플릿 제목 업데이트 (API 응답에서 온 경우 - text_replace)
                if (data.templateData && data.templateData.title) {
                  setTemplateTitle(data.templateData.title);
                }

                // 텍스트 교체 후 스크롤
                setTimeout(() => scrollToBottom(), 50);
              } else if (data.type === "partial_image") {
                // 첫 번째 이미지 응답이 오면 타이핑 인디케이터 숨기기
                setShowTypingIndicator(false);
                // 이미지 생성 중 상태 활성화
                setIsImageGenerating(true);

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
                // 이미지 생성 완료 시 로딩 상태 해제
                setIsImageGenerating(false);

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

                // 응답이 완료되면 이미지 생성 로딩 상태를 항상 해제
                setIsImageGenerating(false);

                // 템플릿 제목 업데이트 (API 응답에서 온 경우 - response_complete)
                if (data.templateData && data.templateData.title) {
                  setTemplateTitle(data.templateData.title);
                }

                // 이미지가 생성된 경우 템플릿에 추가
                if (data.imageUrl && data.templateData) {
                  const newTemplate: GeneratedTemplate = {
                    id: idUtils.generateTemplateId(),
                    title: data.templateData.title || templateTitle,
                    description:
                      data.templateData.description ||
                      data.smsTextContent ||
                      smsTextContent,
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
              console.error("JSON 파싱 오류:", parseError, "원본 라인:", line);
              // JSON 파싱 오류가 발생한 경우 해당 라인을 무시하고 계속 진행
              continue;
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
  }, [messages, inputMessage, isLoading, currentGeneratedImage, generateTemplateTitle, handleImageEdit, smsTextContent, templateTitle]);

  // 초기 메시지 처리
  useEffect(() => {
    if (!isInitialized) {
      const initialMessage = sessionStorage.getItem("initialMessage");
      if (initialMessage) {
        setIsInitialized(true);
        // 초기 메시지를 자동으로 전송
        setTimeout(() => {
          handleSendMessage(initialMessage);
        }, 500);
        // 세션 스토리지에서 초기 메시지 제거
        sessionStorage.removeItem("initialMessage");
        sessionStorage.removeItem("initialFile");
      }
    }
  }, [isInitialized, handleSendMessage]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 파일 업로드 관련 핸들러들
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (10MB)
    if (file.size > FILE_CONSTRAINTS.MAX_FILE_SIZE) {
      alert(ERROR_MESSAGES.FILE_SIZE_EXCEEDED);
      return;
    }

    // 허용된 파일 형식 확인
    if (!FILE_CONSTRAINTS.ALLOWED_FILE_TYPES.includes(file.type as typeof FILE_CONSTRAINTS.ALLOWED_FILE_TYPES[number])) {
      alert(ERROR_MESSAGES.UNSUPPORTED_FILE_TYPE);
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

  // 템플릿 이미지 업로드 핸들러들
  const handleImageUploadClick = () => {
    imageUploadInputRef.current?.click();
  };

  const handleImageUploadSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증 (jpg, jpeg, png, gif만 허용)
    if (!FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES.includes(file.type as typeof FILE_CONSTRAINTS.ALLOWED_IMAGE_TYPES[number])) {
      alert(ERROR_MESSAGES.UNSUPPORTED_IMAGE_TYPE);
      return;
    }

    // 파일 크기 검증 (300KB 이하)
    const validation = validationUtils.validateImageFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    // 권장 비율 1:1 안내 (필수는 아님)
    const img = new window.Image();
    img.onload = () => {
      const ratio = img.width / img.height;
      if (ratio < 0.8 || ratio > 1.2) {
        // 1:1 비율에서 20% 이상 벗어난 경우 안내
        alert('권장 이미지 비율은 1:1(정사각형)입니다.\n더 나은 표시를 위해 정사각형 이미지를 사용해주세요.');
      }
    };
    img.src = URL.createObjectURL(file);

    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCurrentGeneratedImage(result);
    };
    reader.readAsDataURL(file);

    // 파일 선택 후 input 초기화
    event.target.value = '';
  };

  const handleQuickBadgeClick = (message: string) => {
    handleSendMessage(message);
  };

  // 템플릿 저장 관련 함수들

  const handleOpenSaveTemplateModal = () => {
    // 필수 데이터 확인
    if (!smsTextContent.trim()) {
      alert(ERROR_MESSAGES.TEMPLATE_CONTENT_REQUIRED);
      return;
    }

    // 모달 열기 및 초기값 설정
    setTemplateSaveName(templateTitle || "");
    setTemplateSaveCategory("");
    setTemplateIsPrivate(false);
    setIsSaveTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    // 입력값 검증
    if (!templateSaveName.trim()) {
      alert(ERROR_MESSAGES.TEMPLATE_NAME_REQUIRED);
      return;
    }

    if (!templateSaveCategory) {
      alert(ERROR_MESSAGES.CATEGORY_REQUIRED);
      return;
    }

    if (!smsTextContent.trim()) {
      alert(ERROR_MESSAGES.TEMPLATE_CONTENT_REQUIRED);
      return;
    }

    setIsSavingTemplate(true);

    try {
      const token = storageUtils.getAccessToken();
      if (!token) {
        alert(ERROR_MESSAGES.LOGIN_REQUIRED);
        setIsSavingTemplate(false);
        return;
      }

      await templateService.saveTemplate({
        name: templateSaveName.trim(),
        content: smsTextContent.trim(),
        image_url: currentGeneratedImage || null,
        category: templateSaveCategory,
        is_private: templateIsPrivate,
        buttons: dynamicButtons, // 동적 버튼 데이터 추가
      }, token);
      
      alert(SUCCESS_MESSAGES.TEMPLATE_SAVED);
      setIsSaveTemplateModalOpen(false);
      
      // 저장 후 폼 초기화 (선택사항)
      setTemplateSaveName("");
      setTemplateSaveCategory("");
      setTemplateIsPrivate(false);

    } catch (error) {
      console.error("템플릿 저장 실패:", error);
      alert(error instanceof Error ? error.message : "템플릿 저장에 실패했습니다.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // 승인 요청 완료 페이지 핸들러들
  const handleApprovalCompleteGoBack = () => {
    setShowApprovalComplete(false);
  };

  const handleApprovalCompleteConfirm = () => {
    // 완료 컴포넌트 숨기기
    setShowApprovalComplete(false);
    // 캠페인 관리 탭으로 이동
    router.push("/target-marketing?tab=campaign-management");
  };

  // 캠페인 목록 가져오기
  const fetchCampaigns = async () => {
    setIsLoadingCampaigns(true);
    try {
      const token = storageUtils.getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        setIsLoadingCampaigns(false);
        return;
      }

      const { campaigns: approvedCampaigns } = await campaignService.getCampaigns(token);
      setCampaigns(approvedCampaigns);
    } catch (error) {
      console.error("캠페인 목록 가져오기 실패:", error);
      alert(error instanceof Error ? error.message : "캠페인 목록을 가져오는데 실패했습니다.");
      
      // 인증 실패 또는 권한 실패 시 모달 닫기
      if (error instanceof Error && (error.message.includes("인증") || error.message.includes("권한"))) {
        setIsCampaignModalOpen(false);
      }
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  // 템플릿 목록 가져오기
  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const token = storageUtils.getAccessToken();
      if (!token) {
        alert("로그인이 필요합니다.");
        setIsLoadingTemplates(false);
        return;
      }

      const { templates } = await templateService.getTemplates(token);
      setTemplateList(templates);
    } catch (error) {
      console.error("템플릿 목록 가져오기 실패:", error);
      alert(error instanceof Error ? error.message : "템플릿 목록을 가져오는데 실패했습니다.");
      
      // 인증 실패 또는 권한 실패 시 모달 닫기
      if (error instanceof Error && (error.message.includes("인증") || error.message.includes("권한"))) {
        setIsTemplateModalOpen(false);
      }
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // 템플릿 불러오기 모달 열기
  const handleOpenTemplateModal = () => {
    setIsTemplateModalOpen(true);
    setSelectedTemplateId(null); // 선택 초기화
    fetchTemplates();
  };

  // 선택된 템플릿 불러오기
  const handleLoadTemplate = async () => {
    if (!selectedTemplateId) {
      alert("템플릿을 선택해주세요.");
      return;
    }

    try {
      // 이미 로드된 템플릿 목록에서 선택된 템플릿 찾기
      const selectedTemplate = templateList.find(template => 
        template.id === selectedTemplateId || 
        template.id.toString() === selectedTemplateId || 
        selectedTemplateId.toString() === template.id.toString()
      );
      
      if (!selectedTemplate) {
        alert("선택된 템플릿을 찾을 수 없습니다.");
        return;
      }

      // 템플릿 데이터로 폼 필드 업데이트
      setTemplateTitle(selectedTemplate.name || "AI 생성 콘텐츠");
      setSmsTextContent(selectedTemplate.content || "");
      setCurrentGeneratedImage(selectedTemplate.image_url || null);
      
      // 버튼 정보가 있으면 업데이트
      if (selectedTemplate.buttons && selectedTemplate.buttons.length > 0) {
        setDynamicButtons(selectedTemplate.buttons);
      } else {
        setDynamicButtons([]);
      }

      alert(SUCCESS_MESSAGES.TEMPLATE_LOADED);
      setIsTemplateModalOpen(false);
    } catch (error) {
      console.error("템플릿 불러오기 실패:", error);
      alert("템플릿을 불러오는데 실패했습니다.");
    }
  };

  // 캠페인 불러오기 모달 열기
  const handleOpenCampaignModal = () => {
    setIsCampaignModalOpen(true);
    setSelectedCampaignId(null); // 선택 초기화
    fetchCampaigns();
  };

  // 선택된 캠페인 불러오기
  const handleLoadCampaign = async () => {
    if (!selectedCampaignId) {
      alert("캠페인을 선택해주세요.");
      return;
    }

    try {
      // 이미 로드된 캠페인 목록에서 선택된 캠페인 찾기
      // ID 타입을 맞춰서 비교 (string과 number 모두 지원)
      const selectedCampaign = campaigns.find(campaign => 
        campaign.id === selectedCampaignId || 
        campaign.id.toString() === selectedCampaignId ||
        selectedCampaignId.toString() === campaign.id.toString()
      );
      
      if (!selectedCampaign) {
        console.error("캠페인을 찾을 수 없음. 선택된 ID:", selectedCampaignId, "사용 가능한 ID들:", campaigns.map(c => c.id));
        alert("선택된 캠페인 정보를 찾을 수 없습니다.");
        return;
      }

      const campaignData = selectedCampaign;
      
      // 템플릿 정보 적용 (message_templates에서 가져오기)
      const messageTemplate = campaignData.message_templates;
      if (messageTemplate) {
        if (messageTemplate.name) {
          setTemplateTitle(messageTemplate.name);
        }
        if (messageTemplate.content) {
          setSmsTextContent(messageTemplate.content);
        }
        if (messageTemplate.image_url) {
          setCurrentGeneratedImage(messageTemplate.image_url);
        }
      }

      // 타겟 정보 적용 (캠페인 데이터에서 직접 가져오기)
      const targetData = campaignData.target_criteria || campaignData.targetCriteria;
      if (targetData) {
        setTargetGender(targetData.gender || "all");
        setTargetAge(targetData.age || ["all"]);
        setTargetCity(targetData.city || "all");
        setTargetDistrict(targetData.district || "all");
        setTargetTopLevelIndustry(targetData.industry?.topLevel || "all");
        setTargetIndustry(targetData.industry?.specific || "all");
        setCardAmount(targetData.cardAmount || "10000");
        setCardAmountInput(targetData.cardAmountInput || "1");
        setCardStartTime(targetData.cardTime?.startTime || "08:00");
        setCardEndTime(targetData.cardTime?.endTime || "18:00");
      }

      // 모달 닫기
      setIsCampaignModalOpen(false);
      setSelectedCampaignId(null);
      
      alert(SUCCESS_MESSAGES.CAMPAIGN_LOADED);
    } catch (error) {
      console.error("캠페인 불러오기 실패:", error);
      alert(error instanceof Error ? error.message : "캠페인을 불러오는데 실패했습니다.");
    }
  };

  // 승인 신청 처리 함수
  const handleApprovalSubmit = async () => {
    if (!smsTextContent.trim() || !currentGeneratedImage) {
      alert(ERROR_MESSAGES.CAMPAIGN_CONTENT_REQUIRED);
      return;
    }

    // 크레딧 잔액 확인
    const totalCost = calculateTotalCost(sendPolicy, maxRecipients, adRecipientCount);
    const requiredCredits = calculateRequiredCredits(totalCost, userCredits);

    if (requiredCredits > 0) {
      alert(ERROR_MESSAGES.INSUFFICIENT_CREDITS);
      return;
    }

    setIsSubmittingApproval(true);

    try {
      const token = storageUtils.getAccessToken();
      if (!token) {
        alert(ERROR_MESSAGES.LOGIN_REQUIRED);
        return;
      }

      // 실제 계산된 비용 사용
      const totalCost = calculateTotalCost(sendPolicy, maxRecipients, adRecipientCount);
      const actualMaxRecipients =
        sendPolicy === "batch" ? adRecipientCount : parseInt(maxRecipients);

      // 일괄 발송의 경우 발송 예정 날짜 계산
      let scheduledDate = null;
      if (sendPolicy === "batch") {
        const today = new Date();
        const daysToAdd =
          batchSendDate === "오늘+3일"
            ? 3
            : batchSendDate === "오늘+7일"
            ? 7
            : 14;
        scheduledDate = new Date(
          today.getTime() + daysToAdd * 24 * 60 * 60 * 1000
        );
      }

      // 캠페인 데이터 준비
      const campaignData = {
        title: templateTitle, // 템플릿의 실제 제목 사용
        content: smsTextContent,
        imageUrl: currentGeneratedImage,
        sendPolicy: sendPolicy, // 실제 선택된 발송 정책
        validityStartDate: sendPolicy === "realtime" ? validityStartDate : null,
        validityEndDate: sendPolicy === "realtime" ? validityEndDate : null,
        scheduledSendDate:
          sendPolicy === "batch"
            ? scheduledDate?.toISOString().split("T")[0]
            : null,
        scheduledSendTime: sendPolicy === "batch" ? batchSendTime : null,
        maxRecipients: actualMaxRecipients.toString(), // 실제 설정된 수신자 수
        targetCount: sendPolicy === "batch" ? targetCount : null, // 타겟 대상자 수
        existingTemplateId: existingTemplateId, // 기존 템플릿 ID 전달
        targetFilters: {
          gender: targetGender,
          ageGroup: targetAge,
          location: {
            city: targetCity,
            district: targetDistrict,
          },
          industry: {
            topLevel: targetTopLevelIndustry,
            specific: targetIndustry,
          },
          cardAmount:
            cardAmount === "all" ? cardAmount : `${cardAmountInput}0000`,
          cardTime: {
            startTime: cardStartTime,
            endTime: cardEndTime,
          },
        },
        estimatedCost: totalCost, // 실제 계산된 예상 금액 사용
        templateDescription: smsTextContent, // 템플릿 설명 추가
      };

      // 캠페인 생성 API 호출
      const result = await campaignService.createCampaign(campaignData as campaignService.CreateCampaignRequest, token);

      if (result.success) {
        setShowApprovalModal(false);
        setShowApprovalComplete(true); // 승인 요청 완료 페이지 표시
      } else {
        throw new Error(result.message || "캠페인 저장에 실패했습니다.");
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "승인 신청 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // 승인 요청 완료 페이지 표시
  if (showApprovalComplete) {
    return (
      <ApprovalRequestComplete
        onGoBack={handleApprovalCompleteGoBack}
        onConfirm={handleApprovalCompleteConfirm}
      />
    );
  }

  return (
    <div className="relative w-full max-w-[1920px] mx-auto bg-white">
      <div className="flex flex-row min-h-screen bg-gray-100 relative gap-0 p-0">
        {/* 좌측: AI 채팅 영역 */}
        <div className="flex-1 flex flex-col p-6 bg-white border-r border-gray-200 max-w-[800px] w-full">
          <div className="flex-1 overflow-y-auto pb-4 flex flex-col gap-4 max-h-[calc(100vh-200px)] scroll-smooth" ref={chatMessagesRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col max-w-[70%] mb-3 ${
                  message.role === "user"
                    ? "self-end"
                    : "self-start"
                }`}
              >
                <div className={`p-3 px-4 break-words text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-blue-600 text-white rounded-2xl rounded-br-md"
                    : "bg-gray-100 text-gray-700 rounded-2xl rounded-bl-md"
                }`}>
                  {message.imageUrl && (
                    <div className="relative mb-3 overflow-hidden rounded-lg max-w-[300px]">
                      <Image
                        src={message.imageUrl}
                        alt="Generated content"
                        width={300}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                      {message.isImageLoading && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col text-white text-sm rounded-lg">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>이미지 생성 중...</span>
                        </div>
                      )}
                    </div>
                  )}
                  {/* 첨부 파일 표시 */}
                  {message.attachedFile && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      {message.attachedFile.previewUrl ? (
                        <div className="flex items-center gap-3">
                          <Image
                            src={message.attachedFile.previewUrl}
                            alt={message.attachedFile.name}
                            width={200}
                            height={150}
                            className="rounded object-cover"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">
                              {message.attachedFile.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(
                                message.attachedFile.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">📄</div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700">
                              {message.attachedFile.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(
                                message.attachedFile.size /
                                1024 /
                                1024
                              ).toFixed(2)}{" "}
                              MB
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <p>{message.content}</p>
                </div>
                {/* AI 답변에만 빠른 버튼 표시 */}
                {message.role === "assistant" && (
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleQuickBadgeClick("이미지를 다른 스타일로 수정해주세요")}
                      disabled={isLoading || showTypingIndicator}
                    >
                      이미지 수정
                    </button>
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleQuickBadgeClick("텍스트 내용을 수정해주세요")}
                      disabled={isLoading || showTypingIndicator}
                    >
                      텍스트 수정
                    </button>
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleQuickBadgeClick("타깃 고객층을 수정해주세요")}
                      disabled={isLoading || showTypingIndicator}
                    >
                      타겟 수정
                    </button>
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleQuickBadgeClick("할인율을 조정해주세요")}
                      disabled={isLoading || showTypingIndicator}
                    >
                      할인율 수정
                    </button>
                  </div>
                )}
              </div>
            ))}
            {showTypingIndicator && (
              <div className="flex flex-col max-w-[70%] mb-3 self-start">
                <div className="p-3 px-4 break-words text-sm leading-relaxed bg-gray-100 text-gray-700 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-pulse" style={{animationDelay: '0.6s'}}></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4">
            <div className="w-full max-w-[1000px]">
              <div className="relative bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-4 border-none">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="어떤 광고를 만들고 싶나요?"
                  className="w-full p-3 px-4 text-base border-none rounded-xl resize-none min-h-[80px] font-inherit bg-transparent transition-colors outline-none placeholder-gray-400"
                  rows={4}
                  disabled={isLoading || showTypingIndicator}
                />

                {/* 첨부된 파일 미리보기 */}
                {selectedFile && (
                  <div className="relative mt-3 p-3 border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-3">
                    {filePreviewUrl ? (
                      <div className="relative flex flex-shrink-0">
                        <Image
                          src={filePreviewUrl}
                          alt="미리보기"
                          width={80}
                          height={60}
                          className="rounded object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl">📄</div>
                        <div className="font-medium text-gray-700 text-sm">{selectedFile.name}</div>
                        <div className="text-gray-600 text-xs">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    )}
                    <button
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white border-none text-xs cursor-pointer flex items-center justify-center font-bold hover:bg-red-700"
                      onClick={handleRemoveFile}
                      title="파일 제거"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-3 justify-between flex-wrap">
                  <div className="relative flex" ref={dropdownRef}>
                    <button
                      className="bg-blue-600 text-white border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer text-[32px] leading-none transition-colors hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                      title="AI 및 파일 추가"
                      onClick={() => setShowImageDropdown(!showImageDropdown)}
                    >
                      <span>+</span>
                    </button>
                    {showImageDropdown && (
                      <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[200px] mt-1">
                        <button
                          className="block w-full p-3 px-4 border-none bg-transparent text-left text-sm cursor-pointer transition-colors hover:bg-gray-50"
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
                      className="hidden"
                    />
                    
                    {/* 템플릿 이미지 업로드용 숨겨진 input */}
                    <input
                      ref={imageUploadInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageUploadSelect}
                      className="hidden"
                    />
                  </div>
                  <div className="flex gap-2 items-center py-1 flex-wrap flex-1 min-w-0">
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() =>
                        handleQuickBadgeClick("단골 고객을 위한 특별 이벤트")
                      }
                    >
                      단골 이벤트
                    </button>
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() =>
                        handleQuickBadgeClick("할인 이벤트 진행 중입니다")
                      }
                    >
                      할인 이벤트
                    </button>
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-3 py-1 text-xs font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-blue-50 hover:text-blue-600"
                      onClick={() =>
                        handleQuickBadgeClick("신규 고객 유치를 위한 특별 혜택")
                      }
                    >
                      고객유치 이벤트
                    </button>
                  </div>
                  <button
                    className="px-6 py-3 bg-blue-600 text-white border-none rounded-3xl text-base font-medium cursor-pointer text-center leading-[120%] tracking-[-0.32px] transition-all flex items-center justify-center min-w-[80px] h-11 flex-shrink-0 font-sans hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    onClick={() => handleSendMessage()}
                    disabled={
                      isLoading || showTypingIndicator || !inputMessage.trim()
                    }
                  >
                    {isLoading ? "생성 중..." : "생성"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 캠페인 설정 영역 */}
        <div className="flex-shrink-0">
          <div className="w-[400px] bg-white border-l border-gray-200 flex flex-col max-h-screen overflow-y-auto p-6 gap-6">
            {/* 템플릿 미리보기 카드 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              {/* 상단 버튼 영역 */}
              <div className="flex justify-between items-center mb-4">
                <button
                  className="px-4 py-2 bg-blue-600 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-blue-700"
                  onClick={handleOpenCampaignModal}
                >
                  캠페인 불러오기
                </button>
              </div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-semibold text-gray-800">템플릿 생성결과</div>
                <button
                  className="px-3 py-1 bg-gray-100 text-gray-700 border-none rounded text-sm cursor-pointer hover:bg-gray-200"
                  onClick={() => setIsPreviewModalOpen(true)}
                >
                  미리보기
                </button>
              </div>
              <div className="flex flex-col gap-4">
                {currentGeneratedImage ? (
                  <div className="relative h-40 overflow-hidden rounded-lg flex-shrink-0">
                    <Image
                      src={currentGeneratedImage}
                      alt="생성된 템플릿 이미지"
                      width={300}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                    {isImageGenerating && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col text-white text-sm rounded-lg">
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>이미지 생성 중...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative h-40 bg-gray-100 flex items-center justify-center rounded-lg flex-shrink-0">
                    <div className="flex flex-col items-center gap-2 text-gray-500 text-center">
                      {isImageGenerating ? (
                        <>
                          <div className="w-6 h-6 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
                          <span>AI가 이미지를 생성하고 있습니다...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={32} />
                          <span>AI가 이미지를 생성하면 여기에 표시됩니다</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">제목:</label>
                    <div className="flex flex-col">
                      <div className="relative flex items-center">
                        <input
                          value={templateTitle}
                          onChange={(e) => {
                            if (e.target.value.length <= 20) {
                              setTemplateTitle(e.target.value);
                            }
                          }}
                          placeholder="템플릿 제목을 입력하세요"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                          maxLength={TEXT_LIMITS.TEMPLATE_TITLE_MAX}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                          {templateTitle.length} / {TEXT_LIMITS.TEMPLATE_TITLE_MAX}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">내용:</label>
                    <div className="relative">
                      <textarea
                        value={smsTextContent || ""}
                        onChange={(e) => {
                          if (e.target.value.length <= TEXT_LIMITS.SMS_CONTENT_MAX) {
                            setSmsTextContent(e.target.value);
                          }
                        }}
                        placeholder="AI가 생성한 마케팅 콘텐츠가 여기에 표시됩니다."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:border-blue-500"
                        rows={4}
                        maxLength={TEXT_LIMITS.SMS_CONTENT_MAX}
                      />
                      <span className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1">
                        {(smsTextContent || "").length} / {TEXT_LIMITS.SMS_CONTENT_MAX}
                      </span>
                    </div>
                  </div>

                  {/* 동적 버튼 영역 */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">버튼:</label>
                    <div className="border border-gray-200 rounded-lg p-3">
                      <div className="space-y-3">
                        {dynamicButtons.map((button, index) => (
                          <div key={button.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="버튼명"
                                  value={button.text}
                                  onChange={(e) => updateDynamicButton(button.id, 'text', e.target.value, dynamicButtons, setDynamicButtons)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                  maxLength={TEXT_LIMITS.BUTTON_TEXT_MAX}
                                />
                                <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                                  {button.text.length} / {TEXT_LIMITS.BUTTON_TEXT_MAX}
                                </span>
                              </div>
                              
                              {/* 링크 타입 선택 */}
                              <div className="mb-2">
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`linkType-${button.id}`}
                                      value="web"
                                      checked={button.linkType === 'web'}
                                      onChange={(e) => updateDynamicButton(button.id, 'linkType', e.target.value as 'web' | 'app', dynamicButtons, setDynamicButtons)}
                                      className="text-blue-600"
                                    />
                                    웹링크
                                  </label>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                      type="radio"
                                      name={`linkType-${button.id}`}
                                      value="app"
                                      checked={button.linkType === 'app'}
                                      onChange={(e) => updateDynamicButton(button.id, 'linkType', e.target.value as 'web' | 'app', dynamicButtons, setDynamicButtons)}
                                      className="text-blue-600"
                                    />
                                    앱링크
                                  </label>
                                </div>
                              </div>

                              {/* 링크 입력창 */}
                              <div className="col-span-2 mb-2">
                                {button.linkType === 'web' ? (
                                  <input
                                    type="text"
                                    placeholder="웹링크 주소"
                                    value={button.url || ''}
                                    onChange={(e) => updateDynamicButton(button.id, 'url', e.target.value, dynamicButtons, setDynamicButtons)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                  />
                                ) : (
                                  <div className="space-y-2">
                                    <input
                                      type="text"
                                      placeholder="iOS 앱 링크"
                                      value={button.iosUrl || ''}
                                      onChange={(e) => updateDynamicButton(button.id, 'iosUrl', e.target.value, dynamicButtons, setDynamicButtons)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Android 앱 링크"
                                      value={button.androidUrl || ''}
                                      onChange={(e) => updateDynamicButton(button.id, 'androidUrl', e.target.value, dynamicButtons, setDynamicButtons)}
                                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="col-span-2 flex gap-2 justify-end">
                                <button
                                  className="px-3 py-1 text-sm bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700"
                                  title="링크 확인"
                                  onClick={() => handleLinkCheck(button)}
                                >
                                  링크확인
                                </button>
                                {index === dynamicButtons.length - 1 && (
                                  <button
                                    onClick={() => removeDynamicButton(button.id, dynamicButtons, setDynamicButtons)}
                                    className="px-3 py-1 text-sm bg-red-600 text-white border-none rounded cursor-pointer hover:bg-red-700"
                                  >
                                    🗑️ 삭제
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {dynamicButtons.length === 0 && (
                          <div className="text-center text-gray-500 py-4">
                            <span>0 / {BUTTON_CONSTRAINTS.MAX_BUTTONS}</span>
                          </div>
                        )}
                        
                        {dynamicButtons.length < BUTTON_CONSTRAINTS.MAX_BUTTONS && (
                          <button
                            onClick={() => addDynamicButton(dynamicButtons, setDynamicButtons)}
                            className="w-full px-4 py-2 text-sm bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200 text-gray-700"
                          >
                            + 버튼 추가({dynamicButtons.length}/{BUTTON_CONSTRAINTS.MAX_BUTTONS})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 템플릿 액션 버튼들 */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200 text-gray-700"
                    onClick={handleOpenTemplateModal}
                  >
                    템플릿 불러오기
                  </button>
                  <button
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200 text-gray-700"
                    onClick={handleOpenSaveTemplateModal}
                  >
                    템플릿 저장
                  </button>
                  <button
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded cursor-pointer hover:bg-gray-200 text-gray-700"
                    onClick={handleImageUploadClick}
                  >
                    이미지 업로드
                  </button>
                </div>
              </div>
            </div>

            {/* 타겟 추천 결과 섹션 */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="text-sm font-semibold text-gray-800 mb-4">타깃 추천 결과</div>

              {/* 타겟 설정 */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">성별, 연령</div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      value={targetGender}
                      onChange={(e) => setTargetGender(e.target.value)}
                    >
                      {targetOptions.gender.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <div className="relative" ref={ageDropdownRef}>
                      <div 
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white cursor-pointer flex justify-between items-center hover:border-blue-500"
                        onClick={() => setIsAgeDropdownOpen(!isAgeDropdownOpen)}
                      >
                        <span className="text-gray-700">
                          {getSelectedAgeDisplay(targetAge)}
                        </span>
                        <span className={`transform transition-transform ${isAgeDropdownOpen ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </div>
                      {isAgeDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {targetOptions.age.map((option) => (
                            <label key={option.value} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={targetAge.includes(option.value)}
                                onChange={(e) => {
                                  if (option.value === "all") {
                                    // "전체" 선택 시 다른 모든 선택 해제
                                    setTargetAge(e.target.checked ? ["all"] : []);
                                  } else {
                                    // 개별 항목 선택/해제
                                    if (e.target.checked) {
                                      // "전체"가 선택되어 있다면 제거하고 현재 항목 추가
                                      const newAges = targetAge.includes("all") 
                                        ? [option.value] 
                                        : [...targetAge, option.value];
                                      setTargetAge(newAges);
                                    } else {
                                      // 현재 항목 제거
                                      const newAges = targetAge.filter(age => age !== option.value);
                                      // 아무것도 선택되지 않았으면 "전체" 선택
                                      setTargetAge(newAges.length === 0 ? ["all"] : newAges);
                                    }
                                  }
                                }}
                                className="text-blue-600"
                              />
                              <span className="text-sm text-gray-700">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 카드 사용 위치 */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">카드 사용 위치</div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                    >
                      {targetOptions.cities.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      value={targetDistrict}
                      onChange={(e) => setTargetDistrict(e.target.value)}
                    >
                      {getDistrictsByCity(targetCity).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 타겟 업종 */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">카드 사용 업종</div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      value={targetTopLevelIndustry}
                      onChange={(e) => {
                        setTargetTopLevelIndustry(e.target.value);
                        // 대분류 변경 시 세부업종을 "all"로 자동 설정
                        setTargetIndustry("all");
                      }}
                    >
                      {targetOptions.topLevelIndustries.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 카드 승인 금액 */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">카드 승인 금액</div>
                
                {/* 금액 입력 필드 */}
                <div className="mb-3">
                  <div className="relative flex items-center">
                      <input
                        type="number"
                      value={cardAmountInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          // 숫자만 입력되도록 하고, 최대 1000만원으로 제한
                          if (
                            value === "" ||
                            (parseInt(value) >= 1 && parseInt(value) <= 1000)
                          ) {
                          setCardAmountInput(value);
                          setCardAmount("custom");
                          }
                        }}
                      placeholder="금액 입력"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-l focus:outline-none focus:border-blue-500"
                        min="1"
                        max="1000"
                      disabled={cardAmount === "all"}
                      />
                    <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r text-sm text-gray-600">만원</span>
                    </div>
                    </div>

                {/* 금액 선택 버튼들 */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {targetOptions.cardAmounts.filter(option => option.value !== "custom").map((option) => (
                    <button
                      key={option.value}
                      className={`px-4 py-2 text-sm border rounded cursor-pointer transition-colors ${
                        cardAmount === option.value 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                      }`}
                      onClick={() => handleAmountButtonClick(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                  </div>
              </div>

              {/* 카드 승인 시간 */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">카드 승인 시간</div>
                
                {/* 시간 선택 드롭다운 */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      value={cardStartTime}
                      onChange={(e) => setCardStartTime(e.target.value)}
                    >
                      {getAllTimeOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-gray-500 px-2">~</span>
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      value={cardEndTime}
                      onChange={(e) => setCardEndTime(e.target.value)}
                    >
                      {getAllTimeOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 시간 프리셋 버튼들 */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    className={`px-4 py-2 text-sm border rounded cursor-pointer transition-colors ${
                      cardStartTime === "08:00" && cardEndTime === "12:00" 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                    }`}
                    onClick={() => handleTimePresetClick("morning")}
                  >
                    오전
                  </button>
                  <button
                    className={`px-4 py-2 text-sm border rounded cursor-pointer transition-colors ${
                      cardStartTime === "12:00" && cardEndTime === "18:00" 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                    }`}
                    onClick={() => handleTimePresetClick("afternoon")}
                  >
                    오후
                  </button>
                  <button
                    className={`px-4 py-2 text-sm border rounded cursor-pointer transition-colors ${
                      cardStartTime === "08:00" && cardEndTime === "18:00" 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                    }`}
                    onClick={() => handleTimePresetClick("all")}
                  >
                    전체
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 예상금액 */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">예상금액</div>
            <div className="text-lg font-semibold text-gray-900">
              <span className="text-blue-600">100크레딧/</span>
              <span className="text-gray-600">건</span>
            </div>
          </div>

          {/* 승인 신청 버튼 */}
          <div className="pt-4">
            <button
              className="w-full px-6 py-3 bg-blue-600 text-white border-none rounded-lg text-base font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              onClick={() => {
                if (smsTextContent.trim() && currentGeneratedImage) {
                  setShowApprovalModal(true);
                } else {
                  alert(ERROR_MESSAGES.TEMPLATE_GENERATION_REQUIRED);
                }
              }}
            >
              승인 신청
            </button>
          </div>
        </div>
      </div>

      {/* 발송 정책 선택 모달 */}
      <ApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        onSubmit={handleApprovalSubmit}
        isSubmitting={isSubmittingApproval}
        sendPolicy={sendPolicy}
        setSendPolicy={setSendPolicy}
        validityStartDate={validityStartDate}
        validityEndDate={validityEndDate}
        setValidityEndDate={setValidityEndDate}
        selectedPeriod={selectedPeriod}
        setPeriod={setPeriod}
        maxRecipients={maxRecipients}
        setMaxRecipients={setMaxRecipients}
        batchSendDate={batchSendDate}
        setBatchSendDate={setBatchSendDate}
        batchSendTime={batchSendTime}
        setBatchSendTime={setBatchSendTime}
        targetCount={targetCount}
        setTargetCount={setTargetCount}
        adRecipientCount={adRecipientCount}
        setAdRecipientCount={setAdRecipientCount}
        calculateTotalCost={calculateTotalCost}
        calculateRequiredCredits={calculateRequiredCredits}
        userCredits={userCredits}
        isLoadingCredits={isLoadingCredits}
        openCreditModal={openCreditModal}
      />

      {/* 성공 모달 */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="승인 요청이 완료되었습니다"
        message="캠페인 승인 요청이 성공적으로 제출되었습니다."
        buttonText="확인"
      />

      {/* 결제 모달 */}
      <div
        className="fixed left-0 top-0 w-screen h-screen z-[999999]"
        style={{
          display: isPaymentModalOpen ? "block" : "none",
        }}
      >
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          packageInfo={selectedPackage}
          redirectUrl={window.location.pathname}
        />
      </div>

      {/* 캠페인 불러오기 모달 */}
      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        onLoadCampaign={handleLoadCampaign}
        isLoading={isLoadingCampaigns}
        campaigns={campaigns}
        selectedCampaignId={selectedCampaignId}
        setSelectedCampaignId={setSelectedCampaignId}
      />

      {/* 템플릿 불러오기 모달 */}
      <TemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onLoadTemplate={handleLoadTemplate}
        isLoading={isLoadingTemplates}
        templateList={templateList}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
      />

      {/* 미리보기 모달 */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        currentGeneratedImage={currentGeneratedImage}
        templateTitle={templateTitle}
        smsTextContent={smsTextContent}
        dynamicButtons={dynamicButtons}
      />

      {/* 템플릿 저장 모달 */}
      <SaveTemplateModal
        isOpen={isSaveTemplateModalOpen}
        onClose={() => setIsSaveTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
        isSaving={isSavingTemplate}
        templateSaveName={templateSaveName}
        setTemplateSaveName={setTemplateSaveName}
        templateSaveCategory={templateSaveCategory}
        setTemplateSaveCategory={setTemplateSaveCategory}
        templateIsPrivate={templateIsPrivate}
        setTemplateIsPrivate={setTemplateIsPrivate}
        smsTextContent={smsTextContent}
        currentGeneratedImage={currentGeneratedImage}
        dynamicButtons={dynamicButtons}
      />
    </div>
  );
}

// Suspense로 감싼 메인 컴포넌트
export default function TargetMarketingDetail(
  props: TargetMarketingDetailProps
) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TargetMarketingDetailContent {...props} />
    </Suspense>
  );
}
