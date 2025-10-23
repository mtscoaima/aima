"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import SuccessModal from "@/components/SuccessModal";
import ApprovalRequestComplete from "@/components/approval/ApprovalRequestComplete";
import { PaymentModal } from "@/components/credit/PaymentModal";
import { useBalance } from "@/contexts/BalanceContext";
import { useAuth } from "@/contexts/AuthContext";
import { usePricing } from "@/contexts/PricingContext";
import { saveCampaignDraft, clearCampaignDraft, fileToBase64, type CampaignDraft } from "@/lib/campaignDraft";
import {
  targetOptions,
} from "@/lib/targetOptions";
// Import separated types and hooks
import {
  Message,
  GeneratedTemplate,
  Package,
  DynamicButton,
  TargetMarketingDetailProps,
  Campaign,
  Template,
  isSimpleLocationStructure
} from "@/types/targetMarketing";
import {
  useTemplateGeneration,
  useTargetAnalysis,
  useDynamicButtons,
  useTargetOptions,
  useCalculations
} from "@/hooks/useTargetMarketing";
import {
  FILE_CONSTRAINTS,
  CAMPAIGN_CONSTANTS,
  TEXT_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  BUTTON_CONSTRAINTS
} from "@/constants/targetMarketing";
// 분리된 모달 컴포넌트들
import CampaignModal from "@/components/modals/CampaignModal";
import TemplateModal from "@/components/modals/TemplateModal";
import PreviewModal from "@/components/modals/PreviewModal";
import SaveTemplateModal from "@/components/modals/SaveTemplateModal";
// 분리된 API 서비스들
import * as templateService from "@/services/templateService";
import * as campaignService from "@/services/campaignService";
// import * as uploadService from "@/services/uploadService"; // 현재 미사용
// 분리된 유틸리티 함수들
import * as dateUtils from "@/utils/dateUtils";
// import * as formatUtils from "@/utils/formatUtils"; // 현재 미사용
import * as validationUtils from "@/utils/validationUtils";
import * as storageUtils from "@/utils/storageUtils";
import * as idUtils from "@/utils/idUtils";
import { tokenManager } from "@/lib/api";
import StructuredRecommendationTable from "./StructuredRecommendationTable";
import NumberedParagraph from "./NumberedParagraph";
// styles import removed - using Tailwind CSS instead

function TargetMarketingDetailContent({
  templateId,
  useTemplate,
  initialMessage,
  initialImage,
  shouldRestore,
}: TargetMarketingDetailProps) {
  const router = useRouter();
  const { user } = useAuth();
  const {
    isLoading: isLoadingCredits,
    refreshTransactions,
    calculateBalance,
    calculatePoints,
  } = useBalance();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTypingIndicator, setShowTypingIndicator] = useState(false);
  const [smsTextContent, setSmsTextContent] = useState("");
  const [quickActionButtons, setQuickActionButtons] = useState<Array<{text: string}>>([]);
  const [structuredRecommendation, setStructuredRecommendation] = useState<Array<{ section: string; items: string[] }>>([]);
  const [currentGeneratedImage, setCurrentGeneratedImage] = useState<
    string | null
  >(null);

  // 첫 채팅 질문 관련 상태
  const [isFirstChat, setIsFirstChat] = useState(true);
  const [hasShownFirstQuestion, setHasShownFirstQuestion] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  
  // 질문 목록 정의 (useMemo로 최적화)
  const initialQuestions = useMemo(() => [
    "광고의 목적은 무엇인가요? (답변예시 : 신규고객 유입, 단골고객 확보, 리뷰 및 SNS, 안내)",
    "제공할 혜택이 있다면, 혜택 내용과 제공하는 기간을 알려주세요.(없다면 없다고 말씀해주세요.)",
    "광고에 사용하고 싶은 이미지가 있다면 올려주세요. 없다면 없다고 말씀해주세요."
  ], []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [templates, setTemplates] = useState<GeneratedTemplate[]>([]);
  const [images] = useState<(File | string | null)[]>([]);
  const [sendPolicy, setSendPolicy] = useState<"realtime" | "batch">(
    "realtime"
  );
  const [validityStartDate, setValidityStartDate] = useState(dateUtils.getTodayString());
  const [validityEndDate, setValidityEndDate] = useState(dateUtils.getDateAfterWeek());


  // 📡 사이트 설정값
  const [siteSettings, setSiteSettings] = useState({
    minimum_campaign_price: "200000",
    default_daily_limit: "50000"
  });

  // ✅ 새로운 예산 필드들 (초기값은 사이트 설정에서 가져옴)
  const [campaignBudget, setCampaignBudget] = useState(siteSettings.minimum_campaign_price); // 캠페인 전체 예산
  const [dailyAdSpendLimit, setDailyAdSpendLimit] = useState(siteSettings.default_daily_limit); // 일 최대 광고비 제한

  const [selectedPeriod, setSelectedPeriod] = useState<
    "week" | "month" | "year"
  >("week");

  // 타겟 필터 상태들 추가
  const [targetGender, setTargetGender] = useState("all");
  const [targetAge, setTargetAge] = useState<string[]>(["all"]);
  // 도시/구/동 선택(추가용)
  const [targetCity, setTargetCity] = useState("all");
  const [targetDistrict, setTargetDistrict] = useState("all");
  const [targetDong, setTargetDong] = useState("all");
  const [availableCities, setAvailableCities] = useState<Array<{name: string, code: string}>>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableDongs, setAvailableDongs] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingDongs, setIsLoadingDongs] = useState(false);
  // 다중 위치 선택 목록 (동 기준)
  const [selectedLocations, setSelectedLocations] = useState<
    Array<{ city: string; district: string; dong: string }>
  >([]);
  // const [targetTopLevelIndustry, setTargetTopLevelIndustry] = useState("all");
  // const [targetIndustry, setTargetIndustry] = useState("all");
  
  // 업종 선택 상태
  const [selectedIndustryId, setSelectedIndustryId] = useState<number | null>(null);
  const [campaignIndustries, setCampaignIndustries] = useState<Array<{ id: number; order_number: number; name: string }>>([]);
  const [customIndustryName, setCustomIndustryName] = useState<string>("");

  const [cardAmount, setCardAmount] = useState(CAMPAIGN_CONSTANTS.DEFAULT_CARD_AMOUNT);
  const [customAmount, setCustomAmount] = useState(CAMPAIGN_CONSTANTS.DEFAULT_CUSTOM_AMOUNT);
  const [cardAmountInput, setCardAmountInput] = useState(CAMPAIGN_CONSTANTS.DEFAULT_CARD_AMOUNT_INPUT);
  const [cardStartTime, setCardStartTime] = useState(CAMPAIGN_CONSTANTS.DEFAULT_START_TIME);
  const [cardEndTime, setCardEndTime] = useState(CAMPAIGN_CONSTANTS.DEFAULT_END_TIME);
  
  // 카드 승인 금액 관련 상태
  const [selectedAmountButton, setSelectedAmountButton] = useState("10000"); // 기본값: 1만원
  const [cardAmountInputValue, setCardAmountInputValue] = useState("10,000원");

  // 카드 승인 시간 관련 상태
  const [selectedTimeButton, setSelectedTimeButton] = useState("morning"); // 기본값: 오전

  // 승인 신청 처리 상태
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  
  // 전문가 검토 요청 상태
  const [expertReviewRequested, setExpertReviewRequested] = useState(false);

  // 드롭다운 상태
  const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);
  const ageDropdownRef = useRef<HTMLDivElement>(null);
  // 연령 추가용 단일 선택 값
  const [ageToAdd, setAgeToAdd] = useState<string>("thirties");

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
  const [activeTemplateTab, setActiveTemplateTab] = useState<'my' | 'public'>('my');

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

  // 캠페인 이름 상태 (별도로 관리)
  // 기본값을 '캠페인01'로 설정
  const [campaignName, setCampaignName] = useState("캠페인01");


  // 기존 템플릿 ID 상태 (템플릿 사용하기로 온 경우)
  const [existingTemplateId, setExistingTemplateId] = useState<number | null>(
    null
  );

  // 크레딧 관련 상태
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [requiredAmount, setRequiredAmount] = useState<number>(0);

  // BalanceContext에서 크레딧 정보 가져오기 (광고머니 + 포인트)
  const userCredits = calculateBalance() + calculatePoints();

  // 이미지 생성 로딩 상태 추가
  const [isImageGenerating, setIsImageGenerating] = useState(false);

  // 일괄 발송 관련 상태
  const [batchSendDate, setBatchSendDate] = useState("오늘+3일");
  const [batchSendTime, setBatchSendTime] = useState("00:00");
  const [targetCount, setTargetCount] = useState(CAMPAIGN_CONSTANTS.DEFAULT_TARGET_COUNT); // 타겟 대상자 수
  const [adRecipientCount, setAdRecipientCount] = useState(CAMPAIGN_CONSTANTS.DEFAULT_AD_RECIPIENT_COUNT); // 광고 수신자 수

  // 성별 비율 관리 상태
  const [femaleRatio, setFemaleRatio] = useState(70); // 여성 비율
  const [maleRatio, setMaleRatio] = useState(30); // 남성 비율

  // 희망 수신자 입력 상태
  const [desiredRecipients, setDesiredRecipients] = useState(""); // 희망 수신자 직접 입력

  // 동적 버튼 관리 상태
  const [dynamicButtons, setDynamicButtons] = useState<DynamicButton[]>([]);

  // 커스텀 훅들 사용
  const { generateTemplateTitle } = useTemplateGeneration();
  const { analyzeTargetContent } = useTargetAnalysis();
  const { addDynamicButton, removeDynamicButton, updateDynamicButton, handleLinkCheck, validateAllButtonUrls } = useDynamicButtons();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { getAllTimeOptions, getSelectedAgeDisplay } = useTargetOptions();
  const { calculateUnitCost, calculateTotalCost, calculateRequiredCredits } = useCalculations();
  const { getPriceByType } = usePricing();

  // 📡 사이트 설정 로드
  useEffect(() => {
    const fetchSiteSettings = async () => {
      try {
        const response = await fetch('/api/site-settings');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSiteSettings(result.data);
            // 기본값 업데이트
            setCampaignBudget(result.data.minimum_campaign_price);
            setDailyAdSpendLimit(result.data.default_daily_limit);
          }
        }
      } catch (error) {
        console.error('사이트 설정 로드 실패:', error);
      }
    };

    fetchSiteSettings();
  }, []);

  // 캠페인 업종 목록 로드
  useEffect(() => {
    const fetchCampaignIndustries = async () => {
      try {
        const response = await fetch('/api/campaign-industries');
        if (response.ok) {
          const result = await response.json();
          if (result.industries) {
            setCampaignIndustries(result.industries);
          }
        }
      } catch (error) {
        console.error('업종 목록 로드 실패:', error);
      }
    };

    fetchCampaignIndustries();
  }, []);

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

  // 동 정보 가져오기 함수
  const fetchDongs = useCallback(async (city: string, district: string) => {
    if (!city || !district || city === 'all' || district === 'all') {
      setAvailableDongs([]);
      return;
    }

    setIsLoadingDongs(true);
    try {
      const response = await fetch(`/api/locations/dongs?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`);
      if (response.ok) {
        const data = await response.json();
        setAvailableDongs(data.dongs || []);
      } else {
        setAvailableDongs([]);
      }
    } catch (error) {
      console.error('동 정보 조회 실패:', error);
      setAvailableDongs([]);
    } finally {
      setIsLoadingDongs(false);
    }
  }, []);

  // 시/도 목록 로드
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await fetch('/api/locations/cities');
        if (response.ok) {
          const data = await response.json();
          setAvailableCities([{name: '전체', code: 'all'}, ...data.cities]);
        } else {
          console.error('시/도 목록 조회 실패:', response.statusText);
        }
      } catch (error) {
        console.error('시/도 목록 조회 실패:', error);
      } finally {
        setIsLoadingCities(false);
      }
    };
    fetchCities();
  }, []);

  // 시/군/구 목록 로드
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!targetCity || targetCity === 'all') {
        setAvailableDistricts(['all']);
        setTargetDistrict('all');
        return;
      }

      setIsLoadingDistricts(true);
      try {
        const response = await fetch(`/api/locations/districts?city=${encodeURIComponent(targetCity)}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableDistricts(['all', ...data.districts]);
          setTargetDistrict('all');
        } else {
          console.error('시/군/구 목록 조회 실패:', response.statusText);
          setAvailableDistricts(['all']);
        }
      } catch (error) {
        console.error('시/군/구 목록 조회 실패:', error);
        setAvailableDistricts(['all']);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [targetCity]);

  // 구 선택 시 동 정보 로드
  useEffect(() => {
    if (targetDistrict && targetDistrict !== 'all') {
      fetchDongs(targetCity, targetDistrict);
    } else {
      setAvailableDongs([]);
      setTargetDong('all');
    }
  }, [targetCity, targetDistrict, fetchDongs]);

  // 카드 승인 금액 버튼 클릭 핸들러
  const handleCardAmountButtonClick = (buttonValue: string) => {
    setSelectedAmountButton(buttonValue);
    
    // 각 버튼에 따라 input 값 설정
    switch (buttonValue) {
      case "10000":
        setCardAmountInputValue("10,000원");
        setCardAmount("10000");
        setCardAmountInput("1");
        break;
      case "50000":
        setCardAmountInputValue("50,000원");
        setCardAmount("50000");
        setCardAmountInput("5");
        break;
      case "100000":
        setCardAmountInputValue("100,000원");
        setCardAmount("100000");
        setCardAmountInput("10");
        break;
      case "all":
        setCardAmountInputValue("전체");
        setCardAmount("all");
        setCardAmountInput("");
        break;
      default:
        setCardAmountInputValue("10,000원");
        setCardAmount("10000");
        setCardAmountInput("1");
    }
  };

  // 카드 승인 시간 버튼 클릭 핸들러
  const handleCardTimeButtonClick = (preset: string) => {
    setSelectedTimeButton(preset);
    
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
        setCardStartTime("00:00");
        setCardEndTime("23:00");
        break;
      default:
        break;
    }
  };

  // 시간 옵션 생성 함수
  const generateTimeOptions = () => {
    const timeOptions = [];
    for (let hour = 0; hour < 24; hour++) {
      const timeString = `${hour.toString().padStart(2, '0')}:00`;
      timeOptions.push(timeString);
    }
    return timeOptions;
  };



  // 마지막 변경된 시간 추적을 위한 ref
  const lastChangedTimeRef = useRef<'start' | 'end' | null>(null);

  // 시간 변경 핸들러
  const handleStartTimeChange = (newStartTime: string) => {
    lastChangedTimeRef.current = 'start';
    setCardStartTime(newStartTime);
  };

  const handleEndTimeChange = (newEndTime: string) => {
    lastChangedTimeRef.current = 'end';
    setCardEndTime(newEndTime);
  };

  // 시간 유효성 검증 - 마지막에 변경된 시간에 따라 다른 시간 조정
  useEffect(() => {
    const startHour = dateUtils.parseHourFromTimeString(cardStartTime);
    const endHour = dateUtils.parseHourFromTimeString(cardEndTime);

    if (startHour >= endHour) {
      if (lastChangedTimeRef.current === 'start') {
        // 시작 시간을 변경한 경우: 종료 시간 조정
        const { endTime, isAdjusted } = dateUtils.validateAndAdjustTimeRange(cardStartTime, cardEndTime);
        if (isAdjusted) {
          setCardEndTime(endTime);
        }
      } else if (lastChangedTimeRef.current === 'end') {
        // 종료 시간을 변경한 경우: 시작 시간 조정
        const { startTime, isAdjusted } = dateUtils.validateAndAdjustTimeRangeReverse(cardStartTime, cardEndTime);
        if (isAdjusted) {
          setCardStartTime(startTime);
        }
      }
    }
  }, [cardStartTime, cardEndTime]);


  // 연령 라벨 변환 헬퍼
  const getAgeLabel = (value: string) => {
    const opt = targetOptions.age.find((a) => a.value === value);
    return opt ? opt.label : value;
  };

  // 도시/구 라벨 변환 헬퍼
  const getCityLabel = (value: string) => {
    const city = availableCities.find((c) => c.code === value);
    if (!city) return value;

    // 시 제거 (특별시, 광역시, 특별자치시, 특별자치도만 제거, 도는 유지)
    return city.name
      .replace(/특별시$/, '')
      .replace(/광역시$/, '')
      .replace(/특별자치시$/, '')
      .replace(/특별자치도$/, '');
  };
  const getDistrictLabel = (city: string, value: string) => {
    return value === 'all' ? '전체' : value;
  };

  // 연령 추가/삭제
  const MAX_AGES = 5;
  const handleAddAge = () => {
    if (!ageToAdd) return;
    if (ageToAdd === "all") {
      setTargetAge(["all"]);
      return;
    }
    setTargetAge((prev) => {
      if (prev.includes("all")) {
        return [ageToAdd];
      }
      if (prev.includes(ageToAdd)) return prev;
      if (prev.length >= MAX_AGES) return prev; // 제한
      return [...prev, ageToAdd];
    });
  };
  const handleRemoveAge = (value: string) => {
    setTargetAge((prev) => prev.filter((v) => v !== value));
  };

  // 위치 추가/삭제 (동 기준)
  const MAX_LOCATIONS = 5;
  const handleAddLocation = () => {
    if (!targetCity || !targetDistrict || !targetDong) return;

    // 전체 선택 시 전역 전체로 대체
    if (targetCity === "all") {
      setSelectedLocations([{ city: "all", district: "all", dong: "all" }]);
      return;
    }

    setSelectedLocations((prev) => {
      // 최대 개수 제한
      if (prev.length >= MAX_LOCATIONS) return prev;

      // 중복 확인
      const exists = prev.some(loc =>
        loc.city === targetCity &&
        loc.district === targetDistrict &&
        loc.dong === targetDong
      );

      if (exists) return prev;

      // 새 위치 추가
      return [...prev, {
        city: targetCity,
        district: targetDistrict,
        dong: targetDong
      }];
    });
  };
  const handleRemoveLocation = (city: string, district: string, dong: string) => {
    setSelectedLocations((prev) => {
      return prev.filter(loc =>
        !(loc.city === city && loc.district === district && loc.dong === dong)
      );
    });
  };


  // 상위 업종 변경시 세부 업종 옵션 업데이트 (하위 호환성을 위해 유지)
  // useEffect(() => {
  //   const loadIndustries = async () => {
  //     try {
  //       const industriesData = await fetchIndustriesByTopLevel(targetTopLevelIndustry);
  //       setIndustries(industriesData);

  //       // 현재 선택된 업종이 유효한지 확인하고 없으면 첫 번째 옵션으로 설정
  //       const validIndustry = industriesData.find(
  //         (option) => option.value === targetIndustry
  //       );

  //       if (!validIndustry && industriesData.length > 0) {
  //         setTargetIndustry(industriesData[0].value);
  //       }
  //     } catch (error) {
  //       console.error('세부 업종 로딩 오류:', error);
  //     } 
  //   };

  //   loadIndustries();
  // }, [targetTopLevelIndustry, targetIndustry]);

  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // 유효기간 설정 함수
  const setPeriod = (period: "week" | "month" | "year") => {
    const todayString = dateUtils.getTodayString();
    const endDate = dateUtils.getDateAfterPeriod(period);
    setValidityStartDate(todayString);
    setValidityEndDate(endDate);
    setSelectedPeriod(period);
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(0);


  // // 직접 입력 충전 모달 열기 (기존 로직 보존)
  // const handleAutoSelectPackage = () => {
  //   try {
      
  //     // 결제 전 현재 상태 저장
  //     saveCurrentState();
      
  //     // 필요한 크레딧 계산
  //     const totalCostForPackage = calculateTotalCost(sendPolicy, campaignBudget);
      
  //     const requiredCredits = calculateRequiredCredits(totalCostForPackage, userCredits);

  //     // PaymentModal을 직접 입력 모드로 열기
  //     setSelectedPackage(null);
  //     setRequiredAmount(requiredCredits);
  //     setIsPaymentModalOpen(true);
      
  //   } catch (error) {
  //     console.error("충전 모달 열기 오류:", error);
  //     alert(`충전 준비 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
  //   }
  // };

  // 결제 모달 닫기
  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPackage(null);
  };

  // 현재 상태 저장 (확장된 버전)
  const saveState = useCallback(() => {
    const currentState = {
      // 채팅 관련 상태
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp?.toISOString ? msg.timestamp.toISOString() : msg.timestamp
      })),
      isFirstChat,
      hasShownFirstQuestion,
      currentQuestionIndex,
      userAnswers,
      
      // 생성된 콘텐츠
      templateTitle,
      smsTextContent,
      currentGeneratedImage,
      dynamicButtons,
      structuredRecommendation,
      
      // 캠페인 설정
      campaignName,
      sendPolicy,
      validityStartDate,
      validityEndDate,
      selectedPeriod,
      
      // 타겟 필터
      targetGender,
      targetAge,
      targetCity,
      targetDistrict,
      selectedLocations,
      // targetTopLevelIndustry,
      // targetIndustry,
      
      // 카드 관련 설정
      cardAmount,
      customAmount,
      cardAmountInput,
      cardStartTime,
      cardEndTime,
      selectedAmountButton,
      cardAmountInputValue,
      selectedTimeButton,
      
      // 일괄 발송 설정
      batchSendDate,
      batchSendTime,
      targetCount,
      adRecipientCount,
      femaleRatio,
      maleRatio,
      desiredRecipients,
      
      // 기타
      existingTemplateId
    };

    storageUtils.saveTargetMarketingState(currentState);
  }, [
    messages, isFirstChat, hasShownFirstQuestion, currentQuestionIndex, userAnswers,
    templateTitle, smsTextContent, currentGeneratedImage, dynamicButtons, structuredRecommendation,
    campaignName, sendPolicy, validityStartDate, validityEndDate, selectedPeriod,
    targetGender, targetAge, targetCity, targetDistrict, selectedLocations,
    cardAmount, customAmount, cardAmountInput, cardStartTime, cardEndTime, selectedAmountButton, cardAmountInputValue, selectedTimeButton,
    batchSendDate, batchSendTime, targetCount, adRecipientCount, femaleRatio, maleRatio, desiredRecipients,
    existingTemplateId
  ]);

  // 저장된 상태 복원 (확장된 버전)
  const restoreState = React.useCallback(() => {
    try {
      const state = storageUtils.restoreTargetMarketingState() as {
        [key: string]: unknown;
      } | null;
      if (!state) return false;

      // 채팅 관련 상태 복원
      if (state.messages) {
        const restoredMessages = (state.messages as Array<{
          id: string;
          role: string;
          content: string;
          timestamp: string | Date;
          attachedFile?: unknown;
        }>).map(msg => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? new Date(msg.timestamp) : msg.timestamp
        }));
        setMessages(restoredMessages as Message[]);
      }
      
      setIsFirstChat((state.isFirstChat as boolean) ?? false);
      setHasShownFirstQuestion((state.hasShownFirstQuestion as boolean) ?? true);
      setCurrentQuestionIndex((state.currentQuestionIndex as number) ?? 0);
      setUserAnswers((state.userAnswers as {[key: number]: string}) ?? {});

      // 생성된 콘텐츠 복원
      setTemplateTitle((state.templateTitle as string) || "AI 생성 콘텐츠");
      setSmsTextContent((state.smsTextContent as string) || "");
      setCurrentGeneratedImage((state.currentGeneratedImage as string) || null);
      setDynamicButtons((state.dynamicButtons as typeof dynamicButtons) || []);
      if (state.structuredRecommendation) {
        setStructuredRecommendation(state.structuredRecommendation as Array<{ section: string; items: string[] }>);
      }
      
      // 캠페인 설정 복원
      setCampaignName((state.campaignName as string) || "캠페인01");
      setSendPolicy((state.sendPolicy as "realtime" | "batch") || "realtime");
      setValidityStartDate((state.validityStartDate as string) || validityStartDate);
      setValidityEndDate((state.validityEndDate as string) || validityEndDate);

      // ✅ 새로운 예산 필드들 복원
      setCampaignBudget((state.campaignBudget as string) || siteSettings.minimum_campaign_price);
      setDailyAdSpendLimit((state.dailyAdSpendLimit as string) || siteSettings.default_daily_limit);
      setSelectedPeriod((state.selectedPeriod as "week" | "month" | "year") || "week");
      
      // 타겟 필터 복원
      setTargetGender((state.targetGender as string) || "all");
      setTargetAge((state.targetAge as string[]) || ["all"]);
      setTargetCity((state.targetCity as string) || "all");
      setTargetDistrict((state.targetDistrict as string) || "all");
      setSelectedLocations(
        (state.selectedLocations as Array<{ city: string; district: string; dong: string }>) || []
      );
      // setTargetTopLevelIndustry((state.targetTopLevelIndustry as string) || "all");
      // setTargetIndustry((state.targetIndustry as string) || "all");
      
      // 카드 관련 설정 복원
      setCardAmount((state.cardAmount as string) || "10000");
      setCustomAmount((state.customAmount as string) || "50");
      setCardAmountInput((state.cardAmountInput as string) || "1");
      setCardStartTime((state.cardStartTime as string) || "08:00");
      setCardEndTime((state.cardEndTime as string) || "18:00");
      setSelectedAmountButton((state.selectedAmountButton as string) || "10000");
      setCardAmountInputValue((state.cardAmountInputValue as string) || "10,000원");
      setSelectedTimeButton((state.selectedTimeButton as string) || "morning");
      
      // 일괄 발송 설정 복원
      setBatchSendDate((state.batchSendDate as string) || "오늘+3일");
      setBatchSendTime((state.batchSendTime as string) || "00:00");
      setTargetCount((state.targetCount as number) || CAMPAIGN_CONSTANTS.DEFAULT_TARGET_COUNT);
      setAdRecipientCount((state.adRecipientCount as number) || CAMPAIGN_CONSTANTS.DEFAULT_AD_RECIPIENT_COUNT);
      setFemaleRatio((state.femaleRatio as number) || 70);
      setMaleRatio((state.maleRatio as number) || 30);
      setDesiredRecipients((state.desiredRecipients as string) || "");
      
      // 기타 상태 복원
      setExistingTemplateId((state.existingTemplateId as number) || null);

      return true;
    } catch (error) {
      console.error("상태 복원 실패:", error);
      storageUtils.clearTargetMarketingState();
      return false;
    }
  }, [validityStartDate, validityEndDate, siteSettings.default_daily_limit, siteSettings.minimum_campaign_price]);


  // 상태 변경 시 자동 저장 (debounced)
  useEffect(() => {
    if (isInitialized && (smsTextContent || messages.length > 0)) {
      const saveTimer = setTimeout(() => {
        saveState();
      }, 1000);
      return () => clearTimeout(saveTimer);
    }
  }, [
    isInitialized, smsTextContent, messages, campaignName, 
    targetGender, targetAge, selectedLocations, dynamicButtons,
    validityStartDate, validityEndDate, sendPolicy, campaignBudget, dailyAdSpendLimit, saveState
  ]);

  // 광고머니 충전 모달 열기
  const openCreditModal = () => {
    try {
      // 결제 전 현재 상태 저장
      saveState();

      // 필요한 광고머니 계산
      const totalCost = calculateTotalCost(sendPolicy, campaignBudget);
      const requiredCredits = calculateRequiredCredits(totalCost, userCredits);

      // PaymentModal 열기 (필요한 금액 설정)
      setSelectedPackage(null);
      setRequiredAmount(requiredCredits);
      setIsPaymentModalOpen(true);

    } catch (error) {
      console.error("충전 모달 열기 오류:", error);
      alert(`충전 준비 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 캠페인 임시저장 로직
  const saveCampaignDraftData = useCallback(async () => {
    if (!user?.id) return false;

    try {
      // 이미지들을 base64로 변환
      const imagePromises = images.map(async (image) => {
        if (image instanceof File) {
          return await fileToBase64(image);
        }
        return image; // 이미 URL이거나 null인 경우
      });
      
      const convertedImages = await Promise.all(imagePromises);

      const draftData: CampaignDraft = {
        messages: messages.map(msg => typeof msg === 'string' ? msg : msg.content),
        images: convertedImages,
        sendPolicy: {
          firstSendTime: sendPolicy === "realtime" ? "즉시 발송" : validityStartDate,
          sendCount: 1,
          sendInterval: 0,
          smsFailover: true,
          duplicateCheck: true,
          skipWeekend: false,
        },

        // ✅ 새로운 예산 필드들
        campaignBudget: parseInt(campaignBudget) || 0,
        dailyAdSpendLimit: parseInt(dailyAdSpendLimit) || 0,
        adRecipientCount: parseInt(desiredRecipients) || 0,
        selectedTemplate: templateId ? {
          id: templateId,
          title: templateTitle,
          content: typeof messages[0] === 'string' ? messages[0] : messages[0]?.content || "",
          image_url: typeof images[0] === 'string' ? images[0] : undefined,
        } : undefined,
        templateTitle,
        templateContent: typeof messages[0] === 'string' ? messages[0] : messages[0]?.content || "",
        templateImageUrl: typeof images[0] === 'string' ? images[0] : undefined,
        timestamp: Date.now(),
        userId: Number(user.id),
      };

      return saveCampaignDraft(draftData);
    } catch (error) {
      console.error("캠페인 임시저장 실패:", error);
      return false;
    }
  }, [user?.id, messages, images, sendPolicy, validityStartDate, campaignBudget, dailyAdSpendLimit, desiredRecipients, templateId, templateTitle]);

  // 자동 저장 (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length > 0 || images.some(img => img)) {
        saveCampaignDraftData();
      }
    }, 2000); // 2초 후 자동 저장

    return () => clearTimeout(timer);
  }, [messages, images, saveCampaignDraftData]);

  // 페이지 이탈 전 자동 저장
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      saveCampaignDraftData();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveCampaignDraftData]);

  // 컴포넌트 마운트 시 기존 임시저장 데이터 정리
  React.useEffect(() => {
    if (!user?.id) return;
    // 기존 임시저장 데이터가 있으면 제거 (새로운 복원 시스템 사용)
    clearCampaignDraft(Number(user.id));
  }, [user?.id]);

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
        // setTargetTopLevelIndustry(analysis.topLevelIndustry);
        // setTargetIndustry(analysis.industry);
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
                  // 텍스트 교체 시 이미지 생성 로딩 상태도 해제
                  setIsImageGenerating(false);

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

                  if (data.quickActionButtons) {
                    setQuickActionButtons(data.quickActionButtons);
                  }

                  if (data.conciseTitle) {
                    setTemplateTitle(data.conciseTitle);
                  } else if (data.templateData && data.templateData.title) {
                    setTemplateTitle(data.templateData.title);
                  }
                  if (data.structuredRecommendation) {
                    setStructuredRecommendation(data.structuredRecommendation);
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
                  // 초기 응답도 완료 시 로딩 상태 해제
                  setIsLoading(false);
                  setShowTypingIndicator(false);
                  setIsImageGenerating(false);
                  
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

                  if (data.conciseTitle) {
                    setTemplateTitle(data.conciseTitle);
                  } else if (data.templateData && data.templateData.title) {
                    setTemplateTitle(data.templateData.title);
                  }
                  if (data.structuredRecommendation) {
                    setStructuredRecommendation(data.structuredRecommendation);
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
        const attachedFileRaw = storageUtils.getAndClearInitialFile();
        const attachedFile = attachedFileRaw ? attachedFileRaw as { name: string; size: number; type: string; previewUrl?: string | null | undefined; } : undefined;

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
      // getLocalStorageItem을 사용하여 올바른 형식으로 데이터 가져오기
      interface StoredTemplateData {
        id?: number;
        name?: string;
        title?: string;
        content?: string;
        image_url?: string;
      }
      const templateData = storageUtils.getLocalStorageItem<StoredTemplateData | null>("selectedTemplate", null);
      if (templateData) {
        // 우측 MMS 전송 섹션에 템플릿 데이터 설정
        setSmsTextContent(templateData.content || "");
        setCurrentGeneratedImage(templateData.image_url || null);
        setTemplateTitle(
          templateData.name || templateData.title || "템플릿에서 불러온 내용"
        );

        // 기존 템플릿 ID 설정
        if (templateData.id) {
          setExistingTemplateId(templateData.id);
        }

        // localStorage에서 템플릿 데이터 제거
        storageUtils.removeLocalStorageItem("selectedTemplate");

        // 템플릿을 사용하는 경우 첫 채팅 모드 비활성화
        setIsFirstChat(false);
        setHasShownFirstQuestion(false);
      }
    }
  }, [useTemplate, templateId, isInitialized]);

  // 첫 채팅 시 첫 번째 질문 표시 - 제거 (사용자가 첫 메시지를 보낸 후에 질문 표시)

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


  // 메시지 전송 처리
  const handleSendMessage = useCallback(async (messageOverride?: string) => {
    const messageToSend = messageOverride || inputMessage;
    if (!messageToSend.trim() || isLoading) return;


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
      // 첫 채팅 중인 경우 처리
      if (isFirstChat) {
        // 아직 첫 번째 질문을 보여주지 않은 경우 (사용자의 첫 메시지)
        if (!hasShownFirstQuestion) {
          // 첫 번째 질문 표시
          setTimeout(() => {
            const firstQuestionMessage = `효과적인 마케팅 캠페인을 만들기 위해 몇 가지 질문을 드리겠습니다.\n\n${initialQuestions[0]}`;
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: firstQuestionMessage,
                      isQuestion: true,
                    }
                  : msg
              )
            );
            setHasShownFirstQuestion(true);
            setShowTypingIndicator(false);
            setIsLoading(false);
            scrollToBottom();
          }, 500);
          return;
        }
        
        // 질문에 대한 답변인 경우
        if (hasShownFirstQuestion && currentQuestionIndex < initialQuestions.length) {
          // 현재 질문에 대한 답변 저장
          setUserAnswers(prev => ({...prev, [currentQuestionIndex]: messageToSend}));
          
          // 다음 질문이 있는 경우
          if (currentQuestionIndex < initialQuestions.length - 1) {
            // 다음 질문 표시
            setTimeout(() => {
              const nextQuestionMessage = `${initialQuestions[currentQuestionIndex + 1]}`;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: nextQuestionMessage,
                        isQuestion: true,
                      }
                    : msg
                )
              );
              setCurrentQuestionIndex(currentQuestionIndex + 1);
              setShowTypingIndicator(false);
              setIsLoading(false);
              scrollToBottom();
            }, 500);
            return;
          } else {
          // 마지막 질문에 대한 답변인 경우 - AI 호출 준비
          const allAnswers = {...userAnswers, [currentQuestionIndex]: messageToSend};
          
          // 업종 정보 가져오기
          const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
          const industryInfo = userInfo.industry || '일반';
          
          // 첫 채팅 모드 종료
          setIsFirstChat(false);
          setHasShownFirstQuestion(false);
          
          // AI 메시지 생성
          const aiPrompt = `사용자 정보:
- 업종: ${industryInfo}
- 광고 목적: ${allAnswers[0]}
- 제공 혜택: ${allAnswers[1]}
- 타겟 고객: ${allAnswers[2]}

위 정보를 바탕으로 효과적인 마케팅 콘텐츠를 생성해주세요.`;
          
          // 이미지 처리 및 AI 호출 진행
          let initialImageBase64: string | undefined;
          if (selectedFile && selectedFile.type.startsWith("image/")) {
            initialImageBase64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve(e.target?.result as string);
              };
              reader.readAsDataURL(selectedFile);
            });
          } else {
            // selectedFile이 없으면 sessionStorage에서 확인
            const savedFileData = sessionStorage.getItem('selectedFile');
            if (savedFileData) {
              try {
                const fileInfo = JSON.parse(savedFileData);
                if (fileInfo.dataUrl && fileInfo.type?.startsWith("image/")) {
                  initialImageBase64 = fileInfo.dataUrl;
                }
              } catch (error) {
                console.error('Failed to parse sessionStorage file data:', error);
              }
            }
          }

          // 스트리밍 API 호출 - AI 프롬프트 사용
          const response = await fetch("/api/ai/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: aiPrompt,
              previousMessages: [],
              initialImage: initialImageBase64,
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

              // JSON 검증 (개선된 버전 - response_complete 이벤트 허용)
              if (
                !jsonString ||
                jsonString.length < 5 ||
                jsonString === "{" ||
                !jsonString.endsWith("}")
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
                // 텍스트 교체 시 이미지 생성 로딩 상태도 해제
                setIsImageGenerating(false);
                // text_replace를 받으면 응답이 완료된 것으로 간주하고 isLoading 해제
                setIsLoading(false);

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

                // 퀵 액션 버튼 업데이트
                if (data.quickActionButtons) {
                  setQuickActionButtons(data.quickActionButtons);
                }
                
                // 질문인 경우 처리
                if (data.isQuestion) {
                  // 질문인 경우 메시지에 표시
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            isQuestion: true,
                          }
                        : msg
                    )
                  );
                }

                // 템플릿 제목 업데이트 (API 응답에서 온 경우 - text_replace)
                if (data.conciseTitle) {
                  setTemplateTitle(data.conciseTitle);
                } else if (data.templateData && data.templateData.title) {
                  setTemplateTitle(data.templateData.title);
                }
                if (data.structuredRecommendation) {
                  setStructuredRecommendation(data.structuredRecommendation);
                }

                // 텍스트 교체 후 스크롤
                setTimeout(() => scrollToBottom(), 50);
              } else if (data.type === "partial_image") {
                // 첫 번째 이미지 응답이 오면 타이핑 인디케이터 숨기기
                setShowTypingIndicator(false);
                // 좌측 채팅과 동일: 이미지 생성 중 상태 활성화
                setIsImageGenerating(true);
                
                // 좌측 채팅창에서 isImageLoading을 true로 설정하는 것처럼 우측도 동일하게 처리
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          isImageLoading: true,
                        }
                      : msg
                  )
                );

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
                // 좌측 채팅과 동일: 이미지 생성 완료 시 로딩 상태 해제
                setIsImageGenerating(false);
                
                // image_generated에서도 isLoading을 false로 설정 (임시 해결책)
                setIsLoading(false);

                // 최종 이미지 생성 완료 시 스크롤
                setTimeout(() => scrollToBottom(), 100);
              } else if (data.type === "response_complete") {
                // 응답 완료 - 로딩 상태 초기화
                setIsLoading(false);
                setShowTypingIndicator(false);
                
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

                // 퀵 액션 버튼 업데이트
                if (data.quickActionButtons) {
                  setQuickActionButtons(data.quickActionButtons);
                }
                
                // 질문인 경우 처리
                if (data.isQuestion) {
                  // 질문인 경우 메시지에 표시
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            isQuestion: true,
                          }
                        : msg
                    )
                  );
                }

                // 생성된 이미지가 있으면 currentGeneratedImage에도 설정
                if (data.imageUrl && !currentGeneratedImage) {
                  setCurrentGeneratedImage(data.imageUrl);
                }

                // 생성된 이미지를 우측 첨부 영역에 표시
                if (data.imageUrl) {
                  setCurrentGeneratedImage(data.imageUrl);
                }

                setIsImageGenerating(false);

                // 템플릿 제목 업데이트 (API 응답에서 온 경우 - response_complete)
                if (data.conciseTitle) {
                  setTemplateTitle(data.conciseTitle);
                } else if (data.templateData && data.templateData.title) {
                  setTemplateTitle(data.templateData.title);
                }
                if (data.structuredRecommendation) {
                  setStructuredRecommendation(data.structuredRecommendation);
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
              console.error("JSON 파싱 오류:", parseError, "원본 라인:", line.slice(0, 100));
              // JSON 파싱 오류가 발생한 경우 해당 라인을 무시하고 곈4속 진행
              continue;
            }
          }
        }
      }
      // 스트림이 종료되었는데 response_complete가 없는 경우 강제로 isLoading 해제
      setIsLoading(false);
      setShowTypingIndicator(false);
      setIsImageGenerating(false);
        }
      }
      } else {
        // 첫 채팅이 아닌 경우 - 기존 로직 그대로 실행
        let initialImageBase64: string | undefined;
        if (selectedFile && selectedFile.type.startsWith("image/")) {
          initialImageBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve(e.target?.result as string);
            };
            reader.readAsDataURL(selectedFile);
          });
        } else {
          // selectedFile이 없으면 sessionStorage에서 확인
          const savedFileData = sessionStorage.getItem('selectedFile');
          if (savedFileData) {
            try {
              const fileInfo = JSON.parse(savedFileData);
              if (fileInfo.dataUrl && fileInfo.type?.startsWith("image/")) {
                initialImageBase64 = fileInfo.dataUrl;
              }
            } catch (error) {
              console.error('Failed to parse sessionStorage file data:', error);
            }
          }
        }

        // 스트리밍 API 호출
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageToSend,
            previousMessages: messages,
            initialImage: initialImageBase64,
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

                // JSON 검증 (개선된 버전 - response_complete 이벤트 허용)
                if (
                  !jsonString ||
                  jsonString.length < 5 ||
                  jsonString === "{" ||
                  !jsonString.endsWith("}")
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
                  // 텍스트 교체 시 이미지 생성 로딩 상태도 해제
                  setIsImageGenerating(false);
                  // text_replace를 받으면 응답이 완료된 것으로 간주하고 isLoading 해제
                  setIsLoading(false);

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

                  // 퀵 액션 버튼 업데이트
                  if (data.quickActionButtons) {
                    setQuickActionButtons(data.quickActionButtons);
                  }
                  
                  // 질문인 경우 처리
                  if (data.isQuestion) {
                    // 질문인 경우 메시지에 표시
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? {
                              ...msg,
                              isQuestion: true,
                            }
                          : msg
                      )
                    );
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
                  // 좌측 채팅과 동일: 이미지 생성 중 상태 활성화
                  setIsImageGenerating(true);
                  
                  // 좌측 채팅창에서 isImageLoading을 true로 설정하는 것처럼 우측도 동일하게 처리
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            isImageLoading: true,
                          }
                        : msg
                    )
                  );

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
                  // 좌측 채팅과 동일: 이미지 생성 완료 시 로딩 상태 해제
                  setIsImageGenerating(false);
                  
                  // 이미지 생성 완료 후 스크롤
                  setTimeout(() => scrollToBottom(), 150);
                } else if (data.type === "response_complete") {
                  setIsLoading(false);
                  setShowTypingIndicator(false);
                  setIsImageGenerating(false);

                  // 최종 업데이트 확인
                  if (data.smsTextContent) {
                    setSmsTextContent(data.smsTextContent);
                  }
                  if (data.quickActionButtons) {
                    setQuickActionButtons(data.quickActionButtons);
                  }
                  if (data.imageUrl) {
                    setCurrentGeneratedImage(data.imageUrl);
                  }

                  // 템플릿 제목 업데이트 (API 응답에서 온 경우 - response_complete)
                  if (data.templateData && data.templateData.title) {
                    setTemplateTitle(data.templateData.title);
                  }

                  // 최종 스크롤
                  setTimeout(() => scrollToBottom(), 200);
                } else if (data.type === "error") {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error("JSON 파싱 오류:", parseError, "원본 라인:", line.slice(0, 100));
                // JSON 파싱 오류가 발생한 경우 해당 라인을 무시하고 계속 진행
                continue;
              }
            }
          }
        }
        // 스트림이 종료되었는데 response_complete가 없는 경우 강제로 isLoading 해제
        setIsLoading(false);
        setShowTypingIndicator(false);
        setIsImageGenerating(false);
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
      
      // 파일이 성공적으로 전송되었으면 선택된 파일 정리
      if (selectedFile) {
        setSelectedFile(null);
        setFilePreviewUrl(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // sessionStorage도 정리
        sessionStorage.removeItem('selectedFile');
      }
    }
  }, [messages, inputMessage, isLoading, currentGeneratedImage, generateTemplateTitle, smsTextContent, templateTitle, selectedFile, currentQuestionIndex, hasShownFirstQuestion, initialQuestions, isFirstChat, userAnswers]);

  // 페이지 진입 시 초기화 처리
  useEffect(() => {
    if (!isInitialized) {
      const sessionInitialMessage = sessionStorage.getItem("initialMessage");
      
      if (shouldRestore) {
        // 메인 페이지에서 복원 확인 후 진입한 경우
        const restored = restoreState();
        if (restored) {
          setIsFirstChat(false);
          setHasShownFirstQuestion(true);
        }
        setIsInitialized(true);
      } else if (sessionInitialMessage) {
        // 새로운 초기 메시지가 있으면 기존 로직 실행
        setIsInitialized(true);
        // 초기 메시지를 자동으로 전송
        setTimeout(() => {
          handleSendMessage(sessionInitialMessage);
        }, 500);
        // 세션 스토리지에서 초기 메시지 제거
        sessionStorage.removeItem("initialMessage");
        sessionStorage.removeItem("initialFile");
      } else {
        // 일반적인 경우 정상 초기화
        setIsInitialized(true);
      }
    }
  }, [isInitialized, shouldRestore, handleSendMessage, restoreState]);

  // sessionStorage에서 선택된 파일 복원
  useEffect(() => {
    const savedFileData = sessionStorage.getItem('selectedFile');
    if (savedFileData) {
      try {
        const fileInfo = JSON.parse(savedFileData);
        if (fileInfo.dataUrl && fileInfo.type?.startsWith("image/")) {
          // base64 데이터를 File 객체로 변환
          fetch(fileInfo.dataUrl)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], fileInfo.name, { type: fileInfo.type });
              setSelectedFile(file);
              setFilePreviewUrl(fileInfo.dataUrl);
            })
            .catch(error => {
              console.error('Failed to restore file:', error);
              sessionStorage.removeItem('selectedFile');
            });
        } else if (fileInfo.dataUrl === null) {
          // 이미지가 아닌 파일의 경우
          const blob = new Blob([''], { type: fileInfo.type });
          const file = new File([blob], fileInfo.name, { type: fileInfo.type });
          setSelectedFile(file);
          setFilePreviewUrl(null);
        }
      } catch (error) {
        console.error('Failed to parse saved file data:', error);
        sessionStorage.removeItem('selectedFile');
      }
    }
  }, []);

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

    // 이미지 파일인 경우 미리보기 생성 및 sessionStorage에 저장
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setFilePreviewUrl(dataUrl);
        
        // sessionStorage에 파일 정보 저장
        sessionStorage.setItem('selectedFile', JSON.stringify({
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: dataUrl
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreviewUrl(null);
      // 이미지가 아닌 파일도 sessionStorage에 저장
      sessionStorage.setItem('selectedFile', JSON.stringify({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: null
      }));
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
    // sessionStorage도 정리
    sessionStorage.removeItem('selectedFile');
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

    // 동적 버튼 URL 유효성 검사
    if (dynamicButtons.length > 0) {
      const validation = validateAllButtonUrls(dynamicButtons);
      if (!validation.isValid) {
        alert(`버튼 URL 오류:\n${validation.errorMessage}`);
        return;
      }
    }

    setIsSavingTemplate(true);

    try {
      const token = tokenManager.getAccessToken();
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
      const token = tokenManager.getAccessToken();
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
      const token = tokenManager.getAccessToken();
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
    setActiveTemplateTab('my'); // 탭 초기화
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

      // 타겟 정보 적용 (개별 컬럼들에서 직접 가져오기)
      // gender_ratio에서 성별 정보 추출
      if (campaignData.gender_ratio) {
        const { female, male } = campaignData.gender_ratio;
        if (female > 0 && male === 0) {
          setTargetGender("female");
        } else if (male > 0 && female === 0) {
          setTargetGender("male");
        } else {
          setTargetGender("all");
        }
      } else {
        setTargetGender("all");
      }

      // 연령 그룹 설정
      setTargetAge(campaignData.target_age_groups || ["all"]);

      // 위치 정보 설정 (target_locations_detailed에서 첫 번째 항목 사용)
      if (campaignData.target_locations_detailed && campaignData.target_locations_detailed.length > 0) {
        const firstLocation = campaignData.target_locations_detailed[0];

        // SimpleLocation 구조 확인 (새로운 구조)
        if (isSimpleLocationStructure(firstLocation)) {
          setTargetCity(firstLocation.city || "all");
          setTargetDistrict(firstLocation.district || "all");
          setTargetDong(firstLocation.dong || "all");
        } else if (typeof firstLocation === 'object' && 'city' in firstLocation) {
          // 레거시 구조 처리
          setTargetCity(firstLocation.city || "all");
          if ('districts' in firstLocation && Array.isArray((firstLocation as Record<string, unknown>).districts)) {
            const districts = (firstLocation as Record<string, unknown>).districts as string[];
            setTargetDistrict(districts?.[0] || "all");
          } else {
            setTargetDistrict("all");
          }
          setTargetDong("all");
        } else {
          // 문자열인 경우 (가장 오래된 레거시 데이터)
          setTargetCity(typeof firstLocation === 'string' ? firstLocation : "all");
          setTargetDistrict("all");
          setTargetDong("all");
        }

        // target_locations_detailed를 selectedLocations 형식으로 변환
        const convertedLocations = campaignData.target_locations_detailed
          .map(location => {
            if (isSimpleLocationStructure(location)) {
              // 새로운 SimpleLocation 구조
              return location;
            } else if (typeof location === 'object' && 'city' in location && 'districts' in location) {
              // 레거시 구조를 SimpleLocation으로 변환
              const districts = Array.isArray(location.districts) ? location.districts : ["all"];
              return districts.map(district => ({
                city: location.city,
                district: district,
                dong: "all"
              }));
            } else if (typeof location === 'string') {
              // 가장 오래된 레거시 구조
              return {
                city: location,
                district: "all",
                dong: "all"
              };
            }
            return null;
          })
          .flat()
          .filter(Boolean) as Array<{ city: string; district: string; dong: string }>;

        setSelectedLocations(convertedLocations);
      } else {
        setTargetCity("all");
        setTargetDistrict("all");
        setTargetDong("all");
      }

      // 업종 정보 설정
      if (campaignData.campaign_industry_id) {
        setSelectedIndustryId(campaignData.campaign_industry_id);
      }

      // 카드 승인 금액 설정
      if (campaignData.card_amount_max) {
        const amount = campaignData.card_amount_max / 10000;
        setCardAmount(amount.toString() + "0000");
        setCardAmountInput(amount.toString());
      } else {
        setCardAmount("10000");
        setCardAmountInput("1");
      }

      // 카드 승인 시간 설정
      setCardStartTime(campaignData.card_time_start || "08:00");
      setCardEndTime(campaignData.card_time_end || "18:00");

      // 버튼 정보 적용 (캠페인에서 buttons 가져오기)
      if (campaignData.buttons && Array.isArray(campaignData.buttons)) {
        setDynamicButtons(campaignData.buttons);
      } else {
        setDynamicButtons([]);
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

    // 동적 버튼 URL 유효성 검사
    if (dynamicButtons.length > 0) {
      const validation = validateAllButtonUrls(dynamicButtons);
      if (!validation.isValid) {
        alert(`버튼 URL 오류:\n${validation.errorMessage}`);
        return;
      }
    }

    // 커스텀 업종명 유효성 검사
    if (selectedIndustryId === 14 && !customIndustryName.trim()) {
      alert("기타 업종을 선택하셨습니다. 업종명을 입력해주세요.");
      return;
    }

    // ✅ 크레딧 잔액 확인은 서버에서 처리 (예약금 로직 때문에 클라이언트 검증 제거)
    // 서버가 needCharge 플래그와 함께 에러를 반환하면 충전 페이지로 안내

    setIsSubmittingApproval(true);

    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        alert(ERROR_MESSAGES.LOGIN_REQUIRED);
        return;
      }

      // 실제 계산된 비용 사용
      const totalCost = calculateTotalCost(sendPolicy, campaignBudget);

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

      // primaryLocation 변수 제거됨 - 더 이상 사용하지 않음

      // 캠페인 데이터 준비 (새로운 컬럼들 직접 사용)
      const campaignData = {
        title: campaignName || templateTitle,
        content: smsTextContent,
        imageUrl: currentGeneratedImage,
        sendPolicy: sendPolicy,
        validityStartDate: sendPolicy === "realtime" ? validityStartDate : null,
        validityEndDate: sendPolicy === "realtime" ? validityEndDate : null,
        scheduledSendDate:
          sendPolicy === "batch"
            ? scheduledDate?.toISOString().split("T")[0]
            : null,
        scheduledSendTime: sendPolicy === "batch" ? batchSendTime : null,

        // ✅ 새로운 예산 필드들
        budget: parseInt(campaignBudget) || parseInt(siteSettings.minimum_campaign_price),
        campaignBudget: parseInt(campaignBudget) || parseInt(siteSettings.minimum_campaign_price),
        dailyAdSpendLimit: parseInt(dailyAdSpendLimit) || parseInt(siteSettings.default_daily_limit),
        existingTemplateId: existingTemplateId,
        // 새로운 데이터베이스 컬럼들 직접 사용
        targetAgeGroups: targetAge && targetAge.length > 0 ? targetAge : ["all"],
        targetLocationsDetailed: selectedLocations,
        cardAmountMax: cardAmount === "all" ? null : parseInt(cardAmountInput) * 10000,
        cardTimeStart: cardStartTime,
        cardTimeEnd: cardEndTime,
        campaignIndustryId: selectedIndustryId,
        customIndustryName: selectedIndustryId === 14 ? customIndustryName : null,
        unitCost: unitCost,
        estimatedTotalCost: totalCost,
        expertReviewRequested: expertReviewRequested,
        expertReviewNotes: null,
        buttons: dynamicButtons,
        genderRatio: {
          female: femaleRatio,
          male: maleRatio,
        },
        desiredRecipients: desiredRecipients.trim() || null,
        estimatedCost: totalCost,
        templateDescription: templateTitle.trim() || `AI 생성 템플릿 ${new Date().toLocaleDateString('ko-KR')}`,
      };

      // 캠페인 생성 API 호출
      const result = await campaignService.createCampaign(campaignData as campaignService.CreateCampaignRequest, token);

      if (result.success) {
        setShowApprovalComplete(true); // 승인 요청 완료 페이지 표시
      } else {
        throw new Error(result.message || "캠페인 저장에 실패했습니다.");
      }
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "승인 신청 중 오류가 발생했습니다.";

      // ✅ 잔액 부족 메시지이면 충전 페이지로 이동 안내
      if (errorMessage.includes("잔액이 부족") || errorMessage.includes("충전이 필요")) {
        const shouldRedirect = confirm(
          `${errorMessage}\n\n충전 페이지로 이동하시겠습니까?`
        );
        if (shouldRedirect) {
          window.location.href = "/credit-management";
        }
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // 차등 단가 계산을 위한 파생 값
  const hasLocationFilter = React.useMemo(() => {
    if (selectedLocations.length > 0) {
      // 전국(all)만 선택된 경우는 필터 아님
      if (selectedLocations.length === 1 && selectedLocations[0].city === 'all') return false;
      return true;
    }
    return targetCity !== 'all' || targetDistrict !== 'all';
  }, [selectedLocations, targetCity, targetDistrict]);

  const hasIndustryFilter = React.useMemo(() => {
    return selectedIndustryId !== null;
  }, [selectedIndustryId]);

  const hasAmountFilter = React.useMemo(() => {
    return cardAmount !== 'all';
  }, [cardAmount]);

  const unitCost = React.useMemo(() => {
    return calculateUnitCost({
      selectedLocations,
      gender: targetGender,
      ages: targetAge,
      hasLocationFilter,
      hasIndustryFilter,
      hasAmountFilter,
      hasTimeFilter: cardStartTime !== '00:00' || cardEndTime !== '23:59',
      carouselFirst: false, // UI 미지원, 필요 시 true 처리
      getPriceByType,
    });
  }, [selectedLocations, targetGender, targetAge, hasLocationFilter, hasIndustryFilter, hasAmountFilter, cardStartTime, cardEndTime, calculateUnitCost, getPriceByType]);

  // 마지막 어시스턴트 메시지 인덱스 (표는 마지막 답변에만 표시)
  const lastAssistantIndex = React.useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]?.role === "assistant") return i;
    }
    return -1;
  }, [messages]);

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
      <div className="flex flex-row relative gap-0 p-0">
        {/* 좌측: AI 채팅 영역 */}
        <div className="flex-1 flex flex-col p-6 bg-white border-r border-gray-200 max-w-[800px] h-fit w-full">
          <div className="flex-1 overflow-y-auto pb-4 flex flex-col gap-4 min-h-[calc(100vh-550px)] h-fit scroll-smooth" ref={chatMessagesRef}>
            {messages.map((message, idx) => (
              <div
                key={message.id}
                className={`flex flex-col max-w-[80%] mb-4 ${
                  message.role === "user"
                    ? "self-end"
                    : "self-start"
                }`}
              >
                <div className={`p-4 break-words text-sm leading-relaxed relative ${
                  message.role === "user"
                    ? "bg-gray-200 text-gray-800 rounded-3xl"
                    : "bg-trasparent text-gray-800 rounded-3xl"
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
                  <NumberedParagraph text={message.content} />
                  {message.role === "assistant" && idx === lastAssistantIndex && structuredRecommendation?.length > 0 && (
                    <StructuredRecommendationTable sections={structuredRecommendation} />
                  )}
                </div>
                {/* AI 답변에만 빠른 버튼 표시 (로딩 중이 아니고 질문이 아닐 때만) */}
                {message.role === "assistant" && !showTypingIndicator && !message.isQuestion && (
                  <div className="flex gap-2 mt-4 flex-wrap">
                    {/* Dynamic quick action buttons from AI response */}
                    {quickActionButtons.length > 0 ? (
                      quickActionButtons.map((button, index) => (
                        <button
                          key={index}
                          className="bg-gray-100 text-gray-700 border-none rounded-2xl px-4 py-2 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-gray-400 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleQuickBadgeClick(button.text)}
                          disabled={isLoading || showTypingIndicator}
                        >
                          {button.text}
                        </button>
                      ))
                    ) : (
                      // Fallback to static buttons if no dynamic buttons are available
                      <>
                        <button
                          className="bg-gray-100 text-gray-700 border-none rounded-2xl px-4 py-2 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-gray-400 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleQuickBadgeClick("이미지를 다른 스타일로 수정해주세요")}
                          disabled={isLoading || showTypingIndicator}
                        >
                          이미지 수정
                        </button>
                        <button
                          className="bg-gray-100 text-gray-700 border-none rounded-2xl px-4 py-2 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-gray-400 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleQuickBadgeClick("텍스트 내용을 수정해주세요")}
                          disabled={isLoading || showTypingIndicator}
                        >
                          텍스트 수정
                        </button>
                        <button
                          className="bg-gray-100 text-gray-700 border-none rounded-2xl px-4 py-2 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-gray-400 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleQuickBadgeClick("타깃 고객층을 수정해주세요")}
                          disabled={isLoading || showTypingIndicator}
                        >
                          타깃 수정
                        </button>
                        <button
                          className="bg-gray-100 text-gray-700 border-none rounded-2xl px-4 py-2 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 hover:bg-gray-400 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleQuickBadgeClick("할인율을 조정해주세요")}
                          disabled={isLoading || showTypingIndicator}
                        >
                          할인율 수정
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            {showTypingIndicator && (
              <div className="flex flex-col max-w-[80%] mb-4 self-start">
                <div className="p-4 break-words text-sm leading-relaxed text-gray-800 rounded-3xl relative">
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
            <div className="w-full max-w-4xl">
              <div className="rounded-2xl bg-white shadow-[0px_4px_13px_0px_rgba(0,0,0,0.25)] p-4 flex flex-col gap-4 border-none">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="어떤 광고를 만들고 싶나요?"
                  className="w-full text-base resize-none transition-colors duration-200 font-inherit border-none outline-none placeholder-gray-400 whitespace-pre-line"
                  rows={4}
                  disabled={isLoading || showTypingIndicator}
                />

                {/* 첨부된 파일 미리보기 */}
                {selectedFile && (
                  <div className="relative mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50 flex items-center gap-3">
                    {filePreviewUrl ? (
                      <div className="w-20 h-15 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={filePreviewUrl}
                          alt="미리보기"
                          width={80}
                          height={60}
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <div className="text-2xl text-gray-500">📄</div>
                        <div className="text-sm font-medium text-gray-700 break-all flex-1">{selectedFile.name}</div>
                        <div className="text-xs text-gray-500 whitespace-nowrap">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    )}
                    <button
                      className="absolute top-2 right-2 w-6 h-6 bg-black bg-opacity-60 text-white border-none rounded-full flex items-center justify-center cursor-pointer text-xs transition-colors hover:bg-black hover:bg-opacity-80"
                      onClick={handleRemoveFile}
                      title="파일 제거"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-3 mt-2 flex-wrap justify-between">
                  <div className="relative inline-block" ref={dropdownRef}>
                    <button
                      className="w-8 h-8 rounded-full bg-blue-500 text-white border-none flex items-center justify-center cursor-pointer text-[32px] font-bold leading-none transition-colors hover:bg-blue-600"
                      title="AI 및 파일 추가"
                      onClick={() => setShowImageDropdown(!showImageDropdown)}
                    >
                      <span>+</span>
                    </button>
                    {showImageDropdown && (
                      <div className="absolute top-full left-0 bg-white border border-red-500 rounded-lg shadow-[0_2px_10px_rgba(0,0,0,0.1)] z-[9999] min-w-[200px] mt-2">
                        <button
                          className="block w-full px-4 py-3 bg-none border-none text-left cursor-pointer text-gray-800 text-sm transition-colors hover:bg-gray-50"
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
                  <div className="flex gap-2 flex-1 flex-wrap py-0.5 min-w-0 items-center">
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-4 h-8 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                      onClick={() =>
                        handleQuickBadgeClick("단골 고객을 위한 특별 이벤트")
                      }
                    >
                      단골 이벤트
                    </button>
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-4 h-8 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                      onClick={() =>
                        handleQuickBadgeClick("할인 이벤트 진행 중입니다")
                      }
                    >
                      할인 이벤트
                    </button>
                    <button
                      className="bg-gray-100 text-gray-600 border-none rounded-full px-4 h-8 text-sm font-medium cursor-pointer whitespace-nowrap transition-all flex-shrink-0 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600"
                      onClick={() =>
                        handleQuickBadgeClick("신규 고객 유치를 위한 특별 혜택")
                      }
                    >
                      고객유치 이벤트
                    </button>
                    
                    {/* 템플릿 이미지 업로드용 숨겨진 input */}
                    <input
                      ref={imageUploadInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageUploadSelect}
                      style={{ display: "none" }}
                    />
                  </div>
                  <button
                    className="self-end px-6 py-3 rounded-full bg-blue-500 text-white text-center text-base font-medium leading-[120%] tracking-[-0.32px] border-none cursor-pointer transition-all flex items-center justify-center min-w-[80px] h-11 flex-shrink-0 font-sans hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
        <div className="flex-shrink-0 bg-white">
          <div className="w-[480px] bg-gray-200 border-l border-gray-200 flex flex-col">
            {/* 캠페인 설정 섹션 */}
            <div className="bg-gray-100 p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-semibold text-gray-800">캠페인 설정</h3>
                <button
                  className="px-3 py-1.5 bg-white text-blue-600 border border-blue-600 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-100"
                  onClick={handleOpenCampaignModal}
                >
                  캠페인 불러오기
                </button>
              </div>
              
              {/* 공고제목 섹션 */}
              <div className="mb-4">
                <div className="relative flex items-center">
                  <label className="text-sm font-medium text-gray-700 mr-2 flex-shrink-0">캠페인 이름</label>
                  <input
                    value={campaignName}
                    onChange={(e) => {
                      if (e.target.value.length <= 20) {
                        setCampaignName(e.target.value);
                      }
                    }}
                    placeholder="캠페인 타이틀을 입력해 주세요"
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                    maxLength={20}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                    {campaignName.length} / 20
                  </span>
                </div>
              </div>
            </div>

            {/* 템플릿 생성결과 섹션 */}
            <div className="bg-gray-100 mb-1 p-4">
              <div className="flex justify-between items-center mb-4">
                <div className="text-base font-semibold text-gray-800">템플릿 생성결과</div>
                <button
                  className="px-3 py-1.5 bg-white text-blue-600 border border-blue-600 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-100"
                  onClick={() => setIsPreviewModalOpen(true)}
                >
                  미리보기 및 이미지 저장
                </button>
              </div>
                <div className="flex flex-col gap-4">
                 {currentGeneratedImage ? (
                   <div className="relative w-full aspect-square overflow-hidden rounded-lg flex-shrink-0">
                     <Image
                       src={currentGeneratedImage}
                       alt="생성된 템플릿 이미지"
                       width={192}
                       height={192}
                       className="w-full h-full object-cover"
                     />
                     {/* 가장 간단한 로직: currentGeneratedImage가 있고 isImageGenerating이 false일 때만 로딩 숨김 */}
                     {isImageGenerating && (
                       <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col text-white text-sm rounded-lg">
                         <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                         <span>이미지 생성 중...</span>
                       </div>
                     )}
                   </div>
                 ) : (
                   <div className="relative w-48 aspect-square bg-gray-100 flex items-center justify-center rounded-lg flex-shrink-0 mx-auto">
                     <div className="flex flex-col items-center gap-2 text-gray-500 text-center p-4">
                       {isImageGenerating ? (
                         <>
                           <div className="w-6 h-6 border-2 border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
                           <span className="text-xs">AI가 이미지를 생성하고 있습니다...</span>
                         </>
                       ) : (
                         <>
                           <Sparkles size={32} />
                           <span className="text-xs text-center">AI가 이미지를 생성하면 여기에 표시됩니다</span>
                         </>
                       )}
                     </div>
                   </div>
                 )}
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    <label className="text-sm font-medium text-gray-700 min-w-8">제목:</label>
                      <div className="relative w-full flex items-center">
                        <input
                          value={templateTitle}
                          onChange={(e) => {
                            if (e.target.value.length <= 20) {
                              setTemplateTitle(e.target.value);
                            }
                          }}
                          placeholder="템플릿 제목을 입력하세요"
                          className="w-full px-3 py-2 border bg-white border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                          maxLength={TEXT_LIMITS.TEMPLATE_TITLE_MAX}
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                          {templateTitle.length} / {TEXT_LIMITS.TEMPLATE_TITLE_MAX}
                        </span>
                      </div>
                  </div>
                  <div className="flex gap-2">
                    <label className="text-sm font-medium text-gray-700 min-w-8">내용:</label>
                    <div className="relative w-full">
                      <textarea
                        value={smsTextContent || ""}
                        onChange={(e) => {
                          if (e.target.value.length <= TEXT_LIMITS.SMS_CONTENT_MAX) {
                            setSmsTextContent(e.target.value);
                          }
                        }}
                        placeholder="AI가 생성한 마케팅 콘텐츠가 여기에 표시됩니다."
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:border-blue-500"
                        rows={4}
                        maxLength={TEXT_LIMITS.SMS_CONTENT_MAX}
                      />
                      <span className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1">
                        {(smsTextContent || "").length} / {TEXT_LIMITS.SMS_CONTENT_MAX}
                      </span>
                    </div>
                  </div>

                  {/* 동적 버튼 영역 */}
                  <div className="flex gap-2">
                    <label className="text-sm font-medium text-gray-700 min-w-8">버튼:</label>
                    <div className="border border-gray-200 rounded-lg p-3 w-full">
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
                              
                              {/* 웹링크 입력창 */}
                                <input
                                  type="text"
                                  placeholder="웹링크 주소"
                                  value={button.url || ''}
                                  onChange={(e) => updateDynamicButton(button.id, 'url', e.target.value, dynamicButtons, setDynamicButtons)}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                                />

                              <div className="col-span-2 flex gap-2 justify-end">
                                <button
                                  className="px-3 py-1 text-sm bg-gray-200 text-gray-800 border-none rounded cursor-pointer hover:bg-blue-100"
                                  title="링크 확인"
                                  onClick={() => handleLinkCheck(button)}
                                >
                                  링크확인
                                </button>
                                {index === dynamicButtons.length - 1 && (
                                  <button
                                    onClick={() => removeDynamicButton(button.id, dynamicButtons, setDynamicButtons)}
                                    className="px-3 py-1 text-sm text-gray-600 border-none rounded cursor-pointer hover:text-gray-700"
                                  >
                                    삭제
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
                    className="flex-1 px-3 py-1.5 bg-white text-blue-600 border border-blue-600 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-100"
                    onClick={handleOpenTemplateModal}
                  >
                    템플릿 불러오기
                  </button>
                  <button
                    className="flex-1 px-3 py-1.5 bg-white text-blue-600 border border-blue-600 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-100"
                    onClick={handleOpenSaveTemplateModal}
                  >
                    템플릿 저장
                  </button>
                  <button
                    className="flex-1 px-3 py-1.5 bg-white text-blue-600 border border-blue-600 rounded-md text-sm font-medium cursor-pointer transition-colors hover:bg-blue-100"
                    onClick={handleImageUploadClick}
                  >
                    이미지 업로드
                  </button>
                </div>
              </div>
            </div>

            {/* 광고 수신자 설정 섹션 */}
            <div className="bg-gray-100 p-4 mb-1">
              <div className="flex justify-between items-center mb-1">
                <div className="text-base font-semibold text-gray-800">광고 수신자 설정</div>
              </div>
              
              {/* 설명 */}
              <div className="mb-4 rounded-lg">
                <div className="text-xs text-gray-500 mt-1">에이마가 제휴한 결제데이터를 기반으로</div>
                <div className="text-xs text-gray-500">광고주의 가장 적합한 타깃에게 광고를 노출합니다.</div>
              </div>

              {/* 성별 */}
               <div className="mb-4">
                 <div className="text-sm font-medium text-gray-700 mb-2">성별</div>
                 {femaleRatio > 0 && (
                   <div className="flex gap-2">
                     <div className="flex-1">
                       <select
                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                         value="여성"
                         disabled
                       >
                         <option>여성</option>
                       </select>
                     </div>
                     <div className="flex-1">
                       <select
                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                         value={femaleRatio === 100 ? "전체" : `${femaleRatio}%`}
                         onChange={(e) => {
                           const value = e.target.value;
                           const newFemaleRatio = value === "전체" ? 100 : parseInt(value.replace('%', ''));
                           setFemaleRatio(newFemaleRatio);
                           setMaleRatio(100 - newFemaleRatio);
                         }}
                       >
                         {Array.from({ length: 101 }, (_, i) => (
                           <option key={i} value={i === 100 ? "전체" : `${i}%`}>
                             {i === 100 ? "전체" : `${i}%`}
                           </option>
                         ))}
                       </select>
                         </div>
                           </div>
                 )}
                 {maleRatio > 0 && (
                   <div className="flex gap-2 mt-2">
                     <div className="flex-1">
                       <select
                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                         value="남성"
                         disabled
                       >
                         <option>남성</option>
                       </select>
                       </div>
                     <div className="flex-1">
                       <select
                         className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                         value={maleRatio === 100 ? "전체" : `${maleRatio}%`}
                         onChange={(e) => {
                           const value = e.target.value;
                           const newMaleRatio = value === "전체" ? 100 : parseInt(value.replace('%', ''));
                           setMaleRatio(newMaleRatio);
                           setFemaleRatio(100 - newMaleRatio);
                         }}
                       >
                         {Array.from({ length: 101 }, (_, i) => (
                           <option key={i} value={i === 100 ? "전체" : `${i}%`}>
                             {i === 100 ? "전체" : `${i}%`}
                           </option>
                         ))}
                       </select>
                     </div>
                   </div>
                 )}
               </div>

              {/* 연령 */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">연령</div>
                <div className="flex gap-2 items-center">
                  <select
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                    value={ageToAdd}
                    onChange={(e) => setAgeToAdd(e.target.value)}
                  >
                    {targetOptions.age.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="px-3 py-2 rounded-md bg-white text-blue-600 border border-blue-600 text-sm font-medium cursor-pointer hover:bg-blue-50"
                    onClick={handleAddAge}
                  >
                    + 추가
                  </button>
                </div>
                {targetAge.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {targetAge.map((age) => (
                      <span
                        key={age}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200"
                      >
                        {getAgeLabel(age)}
                        <button
                          type="button"
                          className="ml-1 text-blue-600 hover:text-blue-800"
                          onClick={() => handleRemoveAge(age)}
                          aria-label={`연령 ${getAgeLabel(age)} 제거`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">최대 5개까지 선택 가능, ‘전체’ 선택 시 단일 선택</div>
              </div>

              {/* 카드 사용 위치 */}
              <div className="mb-6">
                <div className="text-sm font-medium text-gray-700 mb-2">결제 위치</div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-100"
                      value={targetCity}
                      disabled={isLoadingCities}
                      onChange={(e) => {
                        setTargetCity(e.target.value);
                        setTargetDistrict('all');
                        setTargetDong('all');
                      }}
                    >
                      {isLoadingCities ? (
                        <option value="all">로딩 중...</option>
                      ) : (
                        availableCities.map((city) => (
                          <option key={city.code} value={city.code}>
                            {city.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="flex-1">
                    <select
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-100"
                      value={targetDistrict}
                      disabled={isLoadingCities || isLoadingDistricts}
                      onChange={(e) => {
                        setTargetDistrict(e.target.value);
                        setTargetDong('all');
                      }}
                    >
                      {isLoadingDistricts ? (
                        <option value="all">로딩 중...</option>
                      ) : (
                        availableDistricts.map((district) => (
                          <option key={district} value={district}>
                            {district === 'all' ? '전체' : district}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  {/* 동 선택 드롭다운 */}
                  {targetDistrict !== 'all' && (
                    <div className="flex-1">
                      <select
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-100"
                        value={targetDong}
                        onChange={(e) => setTargetDong(e.target.value)}
                        disabled={isLoadingDongs}
                      >
                        {isLoadingDongs ? (
                          <option value="all">로딩 중...</option>
                        ) : (
                          availableDongs.map((dong) => (
                            <option key={dong} value={dong}>
                              {dong === 'all' ? '전체' : dong}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={!targetCity || !targetDistrict || !targetDong || selectedLocations.length >= MAX_LOCATIONS}
                    className="px-3 py-2 rounded-md bg-white text-blue-600 border border-blue-600 text-sm font-medium cursor-pointer hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                    onClick={handleAddLocation}
                  >
                    + 추가
                  </button>
                </div>
                {selectedLocations.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {selectedLocations.map((loc, index) => (
                      <span
                        key={`${loc.city}-${loc.district}-${loc.dong}-${index}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200 whitespace-nowrap"
                      >
                        {getCityLabel(loc.city)}/{getDistrictLabel(loc.city, loc.district)}/{loc.dong === 'all' ? '전체' : loc.dong}
                        <button
                          type="button"
                          className="ml-1 text-green-600 hover:text-green-800"
                          onClick={() => handleRemoveLocation(loc.city, loc.district, loc.dong)}
                          aria-label={`${getCityLabel(loc.city)} ${getDistrictLabel(loc.city, loc.district)} ${loc.dong === 'all' ? '전체' : loc.dong} 제거`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-xs text-gray-500">위치는 동 기준으로 최대 5곳까지 추가 가능. 시=전체 선택 시 전국 적용</div>
              </div>

                             {/* 타겟 업종 */}
               <div className="mb-4">
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   결제 업종
                 </label>
                 <select
                   value={selectedIndustryId || ""}
                   onChange={(e) => {
                     const newId = e.target.value ? Number(e.target.value) : null;
                     setSelectedIndustryId(newId);
                     // 14번 업종이 아니면 커스텀 업종명 초기화
                     if (newId !== 14) {
                       setCustomIndustryName("");
                     }
                   }}
                   className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                 >
                   <option value="">업종 선택</option>
                   {campaignIndustries.map((industry) => (
                     <option key={industry.id} value={industry.id}>
                       {industry.order_number}. {industry.name}
                     </option>
                   ))}
                 </select>
               </div>

               {/* 커스텀 업종명 입력 (14번 업종 선택 시) */}
               {selectedIndustryId === 14 && (
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     업종명 (직접입력)
                   </label>
                   <input
                     type="text"
                     value={customIndustryName}
                     onChange={(e) => setCustomIndustryName(e.target.value)}
                     placeholder="업종명을 입력해주세요"
                     className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                     maxLength={100}
                   />
                 </div>
               )}

              {/* 카드 승인 금액 */}
               <div className="mb-4">
                 <div className="text-sm font-medium text-gray-700 mb-2">결제 승인 금액</div>
                 
                 {/* 금액 입력 필드 */}
                 <div className="mb-3">
                   <div className="relative flex items-center">
                       <input
                       type="text"
                       value={cardAmountInputValue}
                       onChange={(e) => setCardAmountInputValue(e.target.value)}
                       placeholder="금액 입력"
                       className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                     />
                     <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">미만</span>
                     </div>
                     </div>

                 {/* 금액 선택 버튼들 */}
                 <div className="flex gap-2 mb-4">
                   <button 
                     className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors flex-1 ${
                       selectedAmountButton === "10000" 
                         ? "bg-blue-100 text-blue-600 border-blue-600" 
                         : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                     }`}
                     onClick={() => handleCardAmountButtonClick("10000")}
                   >
                     1만원 미만
                   </button>
                   <button 
                     className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors flex-1 ${
                       selectedAmountButton === "50000" 
                         ? "bg-blue-100 text-blue-600 border-blue-600" 
                         : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                     }`}
                     onClick={() => handleCardAmountButtonClick("50000")}
                   >
                     5만원 미만
                   </button>
                   <button 
                     className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors flex-1 ${
                       selectedAmountButton === "100000" 
                         ? "bg-blue-100 text-blue-600 border-blue-600" 
                         : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                     }`}
                     onClick={() => handleCardAmountButtonClick("100000")}
                   >
                     10만원 미만
                   </button>
                   <button 
                     className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors flex-1 ${
                       selectedAmountButton === "all" 
                         ? "bg-blue-100 text-blue-600 border-blue-600" 
                         : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                     }`}
                     onClick={() => handleCardAmountButtonClick("all")}
                   >
                     전체
                   </button>
                   </div>
               </div>

              {/* 카드 승인 시간 */}
               <div className="mb-4">
                 <div className="text-sm font-medium text-gray-700 mb-2">결제 승인 시간</div>
                 
                 {/* 시간 선택 드롭다운 */}
                 <div className="flex items-center gap-2 mb-3">
                   <div className="flex-1">
                     <select
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                       value={cardStartTime}
                       onChange={(e) => handleStartTimeChange(e.target.value)}
                     >
                       {generateTimeOptions().map((time) => (
                         <option key={`start-${time}`} value={time}>
                           {time}
                         </option>
                       ))}
                     </select>
                   </div>
                   <span className="text-gray-500 px-2">~</span>
                   <div className="flex-1">
                     <select
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                       value={cardEndTime}
                       onChange={(e) => handleEndTimeChange(e.target.value)}
                     >
                       {generateTimeOptions().map((time) => (
                         <option key={`end-${time}`} value={time}>
                           {time}
                         </option>
                       ))}
                     </select>
                   </div>
                 </div>

                 {/* 시간 프리셋 버튼들 */}
                 <div className="grid grid-cols-3 gap-2 mb-4">
                   <button 
                     className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors ${
                       selectedTimeButton === "morning" 
                         ? "bg-blue-100 text-blue-600 border-blue-600" 
                         : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                     }`}
                     onClick={() => handleCardTimeButtonClick("morning")}
                   >
                     오전
                   </button>
                   <button 
                     className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors ${
                       selectedTimeButton === "afternoon" 
                         ? "bg-blue-100 text-blue-600 border-blue-600" 
                         : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                     }`}
                     onClick={() => handleCardTimeButtonClick("afternoon")}
                   >
                     오후
                   </button>
                   <button 
                     className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors ${
                       selectedTimeButton === "all" 
                         ? "bg-blue-100 text-blue-600 border-blue-600" 
                         : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                     }`}
                     onClick={() => handleCardTimeButtonClick("all")}
                   >
                     전체
                   </button>
             </div>
           </div>

                             {/* 희망 수신자 입력 */}
               <div className="mb-4">
                 <div className="text-sm font-medium text-gray-700 mb-2">희망 수신자 입력</div>
                 <textarea
                   value={desiredRecipients}
                   onChange={(e) => setDesiredRecipients(e.target.value)}
                   placeholder="원하시는 타겟팅 조건을 직접 입력해주시면 유사한 타겟팅을 추천해 드립니다."
                   className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:border-blue-500 bg-white"
                   rows={3}
                   maxLength={500}
                 />
                 <div className="text-xs text-gray-500 mt-1 text-right">
                   {desiredRecipients.length} / 500
                 </div>
             </div>
          </div>

            {/* 발송 정책 설정 섹션 */}
            <div className="bg-gray-100 p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">발송 정책 설정</h3>
              
              <div>
                <p className="text-sm text-gray-800 mb-2">
                  ※ 실시간 발송이란? 결제 즉시 광고 메시지를 발송하는 방식입니다.
                </p>
              </div>

              {/* 발송 방식 선택 */}
              <div className="space-y-3 mb-2 flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer mb-0">
                  <input
                    type="radio"
                    name="sendPolicy"
                    checked={sendPolicy === "realtime"}
                    onChange={() => setSendPolicy("realtime")}
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-gray-700 leading-4">실시간 발송</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="sendPolicy"
                    checked={sendPolicy === "batch"}
                    onChange={() => {
                      setSendPolicy("batch");
                      // 일괄 발송으로 변경할 때 광고 수신자 수가 타겟 대상자 수를 초과하면 조정
                      if (adRecipientCount > targetCount) {
                        setAdRecipientCount(targetCount);
                      }
                    }}
                    className="text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-sm font-semibold text-gray-700 leading-4">일괄 발송</span>
                </label>
              </div>

              {/* 실시간 발송 설정 */}
              {sendPolicy === "realtime" && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">실시간 발송 설정</div>
                
                {/* 유효 기간 */}
                <div className="mb-4">
                  <div className="text-xs text-gray-600 mb-2">유효 기간</div>
                  <div className="flex items-center gap-2 mb-3">
                                          <input
                      type="date"
                      value={validityStartDate}
                      onChange={(e) => setValidityStartDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                    />
                    <span className="text-gray-500">-</span>
                      <input
                        type="date"
                        value={validityEndDate}
                        onChange={(e) => setValidityEndDate(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                  <div className="flex gap-2 mb-4">
                                          <button
                    className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors ${
                      selectedPeriod === "week" 
                        ? "bg-blue-100 text-blue-600 border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                      }`}
                      onClick={() => setPeriod("week")}
                    >
                      일주일
                    </button>
                                          <button
                    className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors ${
                      selectedPeriod === "month" 
                        ? "bg-blue-100 text-blue-600 border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                      }`}
                      onClick={() => setPeriod("month")}
                    >
                      한달
                    </button>
                                          <button
                    className={`px-4 py-2 text-xs border rounded cursor-pointer transition-colors ${
                      selectedPeriod === "year" 
                        ? "bg-blue-100 text-blue-600 border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500"
                      }`}
                      onClick={() => setPeriod("year")}
                    >
                      1년
                    </button>
                    </div>
                  </div>

                                  {/* 캠페인 예산 */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 mb-2">캠페인 예산</div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={campaignBudget.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setCampaignBudget(value || "0");
                        }}
                        className={`w-full px-3 py-2 pr-8 text-sm border rounded focus:outline-none bg-white text-right ${
                          parseInt(campaignBudget) < parseInt(siteSettings.minimum_campaign_price) ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder={parseInt(siteSettings.minimum_campaign_price).toLocaleString()}
                      />
                      <span className="absolute right-3 text-sm text-gray-600">원</span>
                    </div>
                    {parseInt(campaignBudget) < parseInt(siteSettings.minimum_campaign_price) ? (
                      <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>캠페인 예산은 최소 {parseInt(siteSettings.minimum_campaign_price).toLocaleString()}원 이상이어야 합니다</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">최소 {parseInt(siteSettings.minimum_campaign_price).toLocaleString()}원 이상</div>
                    )}
                  </div>

                  {/* 일 최대 광고비 제한 */}
                  <div className="mb-4">
                    <div className="text-xs text-gray-600 mb-2">일 최대 광고비 제한</div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        value={dailyAdSpendLimit.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          setDailyAdSpendLimit(value || "0");
                        }}
                        className={`w-full px-3 py-2 pr-8 text-sm border rounded focus:outline-none bg-white text-right ${
                          parseInt(dailyAdSpendLimit) < parseInt(siteSettings.default_daily_limit) ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                        }`}
                        placeholder={parseInt(siteSettings.default_daily_limit).toLocaleString()}
                      />
                      <span className="absolute right-3 text-sm text-gray-600">원</span>
                    </div>
                    {parseInt(dailyAdSpendLimit) < parseInt(siteSettings.default_daily_limit) ? (
                      <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>일 최대 광고비는 최소 {parseInt(siteSettings.default_daily_limit).toLocaleString()}원 이상이어야 합니다</span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 mt-1">하루에 사용할 최대 광고비</div>
                    )}
                  </div>
                </div>
              )}

              {/* 일괄 발송 설정 */}
              {sendPolicy === "batch" && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">일괄 발송 설정</div>
                  
                  <div className="mb-3">
                    <div className="text-xs text-gray-600 mb-1">발송 일·시간</div>
                    <p className="text-xs text-gray-500 mb-3">
                      ※ 발송 일·시는 승인 이후에 가능합니다. (승인은 2일 정도 소요)
                    </p>
                    <div className="flex gap-2 mb-4">
                        <select
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                          value={batchSendDate}
                          onChange={(e) => setBatchSendDate(e.target.value)}
                        >
                        <option value="오늘+3일">오늘+3일</option>
                        <option value="오늘+7일">오늘+7일</option>
                        <option value="오늘+14일">오늘+14일</option>
                        </select>
                        <select
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                          value={batchSendTime}
                          onChange={(e) => setBatchSendTime(e.target.value)}
                        >
                        <option value="00:00">00:00</option>
                        <option value="09:00">09:00</option>
                        <option value="12:00">12:00</option>
                        <option value="15:00">15:00</option>
                        <option value="18:00">18:00</option>
                        </select>
                    </div>
                      </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">타겟 대상자 수</span>
                        <input
                          type="number"
                          value={targetCount}
                          onChange={(e) => {
                            const newTargetCount = parseInt(e.target.value) || 500;
                            setTargetCount(newTargetCount);
                            
                            // 타겟 대상자 수가 줄어들면 광고 수신자 수도 조정
                            if (adRecipientCount > newTargetCount) {
                              setAdRecipientCount(newTargetCount);
                            }
                          }}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-gray-100 cursor-not-allowed text-gray-600"
                          disabled={sendPolicy === "batch"}
                        />
                      <span className="text-xs text-gray-600">명</span>
                      </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">광고 수신자 수</span>
                        <input
                          type="number"
                          value={adRecipientCount}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            // 타겟 대상자 수를 넘지 않도록 제한
                            const limitedValue = Math.min(newValue, targetCount);
                            setAdRecipientCount(limitedValue);
                          }}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
                          max={targetCount}
                          min={1}
                        />
                      <span className="text-xs text-gray-600">명</span>
                    </div>
                      </div>

                  <p className="text-xs text-gray-500 mt-3">
                    ※ 광고 수신자 수는 타겟 대상자 수를 초과할 수 없습니다.
                    <br />※ 일괄 발송 시 타겟 대상자 수는 수정할 수 없습니다.
                      </p>
                    </div>
              )}
            </div>

            {/* 예상단가 섹션 */}
            <div className="bg-white p-4">
              <h3 className="text-base font-semibold text-gray-800 mb-4">예상단가</h3>
              <div className="text-xs text-gray-600 mb-2">
                ※ 실시간 발송이면 카드 승인 시간에 해당 카드를 사용한
                광고 수신자에게 즉시 광고 메시지를 발송하는 방식입니다.
                </div>

              <div className="bg-white p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">광고 단가(발송 건 당)</span>
                  <span className="text-sm font-semibold text-gray-900">{unitCost}원/건</span>
                </div>

                {/* 상세 계산 설명 */}
                <div className="bg-gray-50 p-3 rounded-md space-y-2 text-xs">
                  <div className="font-semibold text-gray-700 mb-2">💰 단가 계산 내역</div>

                  {/* 기본 단가 */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">기본 단가</span>
                    <span className="font-medium text-gray-900">{getPriceByType('기본단가')}원</span>
                  </div>

                  {/* 위치 필터 */}
                  {hasLocationFilter && selectedLocations.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600"> 결제 위치 ({selectedLocations.length})</span>
                      <span className="font-medium text-gray-900">
                        {selectedLocations.length} × {getPriceByType('위치')}원 = {selectedLocations.length * getPriceByType('위치')}원
                      </span>
                    </div>
                  )}

                  {/* 성별 필터 */}
                  {targetGender !== 'all' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">성별 필터</span>
                      <span className="font-medium text-gray-900">{getPriceByType('성별')}원</span>
                    </div>
                  )}

                  {/* 나이 필터 */}
                  {!(targetAge.length === 1 && targetAge[0] === 'all') && targetAge.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">나이 ({targetAge.length})</span>
                      <span className="font-medium text-gray-900">
                        {targetAge.length} × {getPriceByType('나이')}원 = {targetAge.length * getPriceByType('나이')}원
                      </span>
                    </div>
                  )}

                  {/* 업종 필터 */}
                  {hasIndustryFilter && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">업종 필터</span>
                      <span className="font-medium text-gray-900">{getPriceByType('업종')}원</span>
                    </div>
                  )}

                  {/* 승인금액 필터 */}
                  {hasAmountFilter && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">결제 금액 필터</span>
                      <span className="font-medium text-gray-900">{getPriceByType('결제금액')}원</span>
                    </div>
                  )}

                  {/* 시간 필터 */}
                  {(cardStartTime !== '00:00' || cardEndTime !== '23:59') && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">결제 시간 필터</span>
                      <span className="font-medium text-gray-900">{getPriceByType('결제이력')}원</span>
                    </div>
                  )}

                  {/* 총합 */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-700">총 단가</span>
                    <span className="font-bold text-blue-600">{unitCost}원</span>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="text-base font-semibold text-gray-900">합계</span>
                  <span className="text-base font-semibold text-blue-600">
                    {calculateTotalCost(sendPolicy, campaignBudget).toLocaleString()}원
                  </span>
                    </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">전체 가용 금액</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {isLoadingCredits ? (
                        <span className="text-gray-500">500원</span>
                      ) : (
                        <>
                          <span className="font-semibold text-gray-900">
                            {userCredits.toLocaleString()}
                          </span>
                          <span className="text-gray-600 ml-1">원</span>
                        </>
                      )}
                    </span>
                   
                  </div>
                </div>
                                {calculateRequiredCredits(calculateTotalCost(sendPolicy, campaignBudget), userCredits) > 0 && (
                  <div className="flex flex-col w-fit ml-auto">
                   <button
                      className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded cursor-pointer transition-colors hover:bg-blue-700"
                      onClick={openCreditModal}
                    >
                      + 충전하기
                    </button>
                    <span className="text-sm font-semibold text-red-600">
                      ⊗ 잔액을 충전해주세요.
                    </span>
                  </div>
                )}
            </div>

              {/* 승인 신청 버튼 */}
              <div className="pt-4">
              <button
                  className="w-full px-6 py-3 bg-blue-600 text-white border-none rounded-lg text-base font-medium cursor-pointer transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={handleApprovalSubmit}
                disabled={isSubmittingApproval || parseInt(campaignBudget) < parseInt(siteSettings.minimum_campaign_price) || parseInt(dailyAdSpendLimit) < parseInt(siteSettings.default_daily_limit)}
              >
                {isSubmittingApproval ? (
                  <>
                      <div className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    승인 신청 중...
                  </>
                ) : (
                  "승인 신청"
                )}
              </button>

              {/* 예산 최소값 미달 시 안내 메시지 */}
              {(parseInt(campaignBudget) < parseInt(siteSettings.minimum_campaign_price) || parseInt(dailyAdSpendLimit) < parseInt(siteSettings.default_daily_limit)) && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 text-sm">⚠️</span>
                    <div className="text-sm">
                      <div className="font-medium text-red-800 mb-1">승인 신청이 불가능합니다</div>
                      <div className="text-red-600 text-xs">
                        {parseInt(campaignBudget) < parseInt(siteSettings.minimum_campaign_price) && `• 캠페인 예산: 최소 ${parseInt(siteSettings.minimum_campaign_price).toLocaleString()}원 이상 필요`}
                        {parseInt(campaignBudget) < parseInt(siteSettings.minimum_campaign_price) && parseInt(dailyAdSpendLimit) < parseInt(siteSettings.default_daily_limit) && <br />}
                        {parseInt(dailyAdSpendLimit) < parseInt(siteSettings.default_daily_limit) && `• 일 최대 광고비: 최소 ${parseInt(siteSettings.default_daily_limit).toLocaleString()}원 이상 필요`}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 전문가 검토 요청하기 체크박스 */}
              <div className="flex items-center gap-1 mt-3 ml-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4" 
                  checked={expertReviewRequested}
                  onChange={(e) => setExpertReviewRequested(e.target.checked)}
                />
                <span className="text-sm text-gray-800">전문가 검토 요청하기</span>
                <div className="relative group">
                  <div className="w-4 h-4 ml-1 cursor-help flex items-center justify-center rounded-full border border-gray-400 text-gray-500">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                      <circle cx="12" cy="17" r="1"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    생성하신 캠페인을 실제 전문가가 보고 의견을 드립니다.<br />
                    단, 검토가 밀렸을 때는 승인이 지연될 수 있는 점 양해바랍니다.
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>



      {/* 성공 모달 */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="승인 요청이 완료되었습니다"
        message="캠페인 승인 요청이 성공적으로 제출되었습니다."
        buttonText="확인"
      />

      {/* 결제 모달 */}
      {/* Nice Payments 광고머니 충전 모달 */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        chargeAmount={selectedPackage?.price || requiredAmount || 0}
      />

      {/* 충전 안내 모달 (비활성화) */}
      {/* <PaymentNoticeModal
        isOpen={isNoticeModalOpen}
        onClose={handleCloseNoticeModal}
      /> */}

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
        activeTab={activeTemplateTab}
        setActiveTab={setActiveTemplateTab}
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
