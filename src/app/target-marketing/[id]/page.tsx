"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";
import SuccessModal from "@/components/SuccessModal";
import { PaymentModal } from "@/components/PaymentModal";
import { useBalance } from "@/contexts/BalanceContext";
import { 
  targetOptions, 
  generateTimeOptions, 
  generateBatchTimeOptions, 
  batchSendDateOptions,
  getAmountDisplayText,
  getDistrictsByCity,
  getIndustriesByTopLevel
} from "@/lib/targetOptions";
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

interface Package {
  id: string;
  name: string;
  credits: number;
  price: number;
  bonus: number;
  isPopular?: boolean;
}

// useSearchParams를 사용하는 컴포넌트를 별도로 분리
function TargetMarketingContent() {
  const searchParams = useSearchParams();
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
  const [targetGender, setTargetGender] = useState("all");
  const [targetAge, setTargetAge] = useState("all");
  const [targetCity, setTargetCity] = useState("all");
  const [targetDistrict, setTargetDistrict] = useState("all");
  const [targetTopLevelIndustry, setTargetTopLevelIndustry] = useState("all");
  const [targetIndustry, setTargetIndustry] = useState("all");
  const [cardAmount, setCardAmount] = useState("10000");
  const [customAmount, setCustomAmount] = useState("50");
  const [cardStartTime, setCardStartTime] = useState("08:00");
  const [cardEndTime, setCardEndTime] = useState("18:00");

  // 승인 신청 처리 상태
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // 성공 모달 상태
  const [showSuccessModal, setShowSuccessModal] = useState(false);

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

  // 사용자 입력을 기반으로 템플릿 제목 생성
  const generateTemplateTitle = React.useCallback((content: string) => {
    const lowerContent = content.toLowerCase();
    let title = "";

    // 업종 키워드 분석
    if (lowerContent.includes("카페") || lowerContent.includes("커피")) {
      title += "카페 ";
    } else if (
      lowerContent.includes("헤어샵") ||
      lowerContent.includes("미용실")
    ) {
      title += "헤어샵 ";
    } else if (lowerContent.includes("병원") || lowerContent.includes("의원")) {
      title += "병원 ";
    } else if (lowerContent.includes("학원") || lowerContent.includes("교육")) {
      title += "학원 ";
    } else if (
      lowerContent.includes("음식점") ||
      lowerContent.includes("식당") ||
      lowerContent.includes("레스토랑")
    ) {
      title += "음식점 ";
    } else if (
      lowerContent.includes("쇼핑몰") ||
      lowerContent.includes("옷가게") ||
      lowerContent.includes("의류")
    ) {
      title += "의류매장 ";
    } else if (
      lowerContent.includes("뷰티") ||
      lowerContent.includes("네일") ||
      lowerContent.includes("피부")
    ) {
      title += "뷰티샵 ";
    }

    // 이벤트 타입 분석
    if (lowerContent.includes("할인") || lowerContent.includes("세일")) {
      title += "할인 이벤트";
    } else if (lowerContent.includes("오픈") || lowerContent.includes("개업")) {
      title += "오픈 이벤트";
    } else if (lowerContent.includes("무료") || lowerContent.includes("체험")) {
      title += "무료 체험";
    } else if (
      lowerContent.includes("신메뉴") ||
      lowerContent.includes("새로운")
    ) {
      title += "신메뉴 출시";
    } else if (lowerContent.includes("이벤트")) {
      title += "특별 이벤트";
    } else {
      title += "프로모션";
    }

    // 할인율이나 특정 혜택이 있으면 추가
    if (lowerContent.includes("50%") || lowerContent.includes("반값")) {
      title = title.replace("할인 이벤트", "50% 할인 이벤트");
    } else if (lowerContent.includes("30%")) {
      title = title.replace("할인 이벤트", "30% 할인 이벤트");
    } else if (lowerContent.includes("20%")) {
      title = title.replace("할인 이벤트", "20% 할인 이벤트");
    }

    return title || "AI 생성 마케팅 콘텐츠";
  }, []);

  // 타겟 분석 함수 추가
  const analyzeTargetContent = React.useCallback(
    (content: string) => {
      const lowerContent = content.toLowerCase();

      // 템플릿 제목 생성 및 설정
      const generatedTitle = generateTemplateTitle(content);
      setTemplateTitle(generatedTitle);

      // 성별 분석
      if (
        lowerContent.includes("여성") ||
        lowerContent.includes("여자") ||
        lowerContent.includes("여성용") ||
        lowerContent.includes("뷰티") ||
        lowerContent.includes("미용") ||
        lowerContent.includes("헤어샵") ||
        lowerContent.includes("네일") ||
        lowerContent.includes("피부")
      ) {
        setTargetGender("female");
      } else if (
        lowerContent.includes("남성") ||
        lowerContent.includes("남자") ||
        lowerContent.includes("남성용")
      ) {
        setTargetGender("male");
      }

      // 연령대 분석
      if (
        lowerContent.includes("10대") ||
        lowerContent.includes("학생") ||
        lowerContent.includes("청소년")
      ) {
        setTargetAge("teens");
      } else if (
        lowerContent.includes("20대") ||
        lowerContent.includes("대학생") ||
        lowerContent.includes("신입")
      ) {
        setTargetAge("twenties");
      } else if (
        lowerContent.includes("30대") ||
        lowerContent.includes("직장인")
      ) {
        setTargetAge("thirties");
      } else if (
        lowerContent.includes("40대") ||
        lowerContent.includes("중년")
      ) {
        setTargetAge("forties");
      } else if (
        lowerContent.includes("50대") ||
        lowerContent.includes("시니어")
      ) {
        setTargetAge("fifties");
      }

      // 지역 분석
      if (
        lowerContent.includes("홍대") ||
        lowerContent.includes("신촌") ||
        lowerContent.includes("마포")
      ) {
        setTargetCity("seoul");
        setTargetDistrict("mapo");
      } else if (
        lowerContent.includes("강남") ||
        lowerContent.includes("역삼") ||
        lowerContent.includes("선릉")
      ) {
        setTargetCity("seoul");
        setTargetDistrict("gangnam");
      } else if (
        lowerContent.includes("강북") ||
        lowerContent.includes("노원") ||
        lowerContent.includes("도봉")
      ) {
        setTargetCity("seoul");
        setTargetDistrict("gangbuk");
      } else if (
        lowerContent.includes("서초") ||
        lowerContent.includes("양재") ||
        lowerContent.includes("교대")
      ) {
        setTargetCity("seoul");
        setTargetDistrict("seocho");
      } else if (
        lowerContent.includes("강서") ||
        lowerContent.includes("김포공항") ||
        lowerContent.includes("발산")
      ) {
        setTargetCity("seoul");
        setTargetDistrict("gangseo");
      } else if (
        lowerContent.includes("부산") ||
        lowerContent.includes("해운대") ||
        lowerContent.includes("서면")
      ) {
        setTargetCity("busan");
      } else if (
        lowerContent.includes("대구") ||
        lowerContent.includes("동성로")
      ) {
        setTargetCity("daegu");
      }

      // 카드 금액 분석
      if (
        lowerContent.includes("고급") ||
        lowerContent.includes("프리미엄") ||
        lowerContent.includes("럭셔리") ||
        lowerContent.includes("10만원") ||
        lowerContent.includes("100000")
      ) {
        setCardAmount("100000");
      } else if (
        lowerContent.includes("5만원") ||
        lowerContent.includes("50000") ||
        lowerContent.includes("중가")
      ) {
        setCardAmount("50000");
      } else if (
        lowerContent.includes("저렴") ||
        lowerContent.includes("할인") ||
        lowerContent.includes("특가") ||
        lowerContent.includes("1만원") ||
        lowerContent.includes("10000")
      ) {
        setCardAmount("10000");
      }

      // 업종 분석
      if (
        lowerContent.includes("카페") ||
        lowerContent.includes("커피") ||
        lowerContent.includes("음식점") ||
        lowerContent.includes("식당") ||
        lowerContent.includes("레스토랑") ||
        lowerContent.includes("외식")
      ) {
        setTargetTopLevelIndustry("1"); // 서비스업
        setTargetIndustry("109"); // 외식업·식음료
      } else if (
        lowerContent.includes("헤어샵") ||
        lowerContent.includes("미용실") ||
        lowerContent.includes("뷰티") ||
        lowerContent.includes("네일") ||
        lowerContent.includes("피부")
      ) {
        setTargetTopLevelIndustry("1"); // 서비스업
        setTargetIndustry("122"); // 뷰티·미용
      } else if (
        lowerContent.includes("병원") ||
        lowerContent.includes("의원") ||
        lowerContent.includes("의료")
      ) {
        setTargetTopLevelIndustry("7"); // 의료·제약·복지
        setTargetIndustry("701"); // 의료(진료과목별)
      } else if (
        lowerContent.includes("학원") ||
        lowerContent.includes("교육") ||
        lowerContent.includes("어학원")
      ) {
        setTargetTopLevelIndustry("6"); // 교육업
        setTargetIndustry("602"); // 학원·어학원
      } else if (
        lowerContent.includes("호텔") ||
        lowerContent.includes("여행") ||
        lowerContent.includes("펜션")
      ) {
        setTargetTopLevelIndustry("1"); // 서비스업
        setTargetIndustry("108"); // 호텔·여행·항공
      } else if (
        lowerContent.includes("쇼핑몰") ||
        lowerContent.includes("옷가게") ||
        lowerContent.includes("의류") ||
        lowerContent.includes("패션")
      ) {
        setTargetTopLevelIndustry("8"); // 판매·유통
        setTargetIndustry("802"); // 판매(상품품목별)
      } else if (
        lowerContent.includes("IT") ||
        lowerContent.includes("개발") ||
        lowerContent.includes("웹") ||
        lowerContent.includes("앱")
      ) {
        setTargetTopLevelIndustry("3"); // IT·웹·통신
        setTargetIndustry("301"); // 솔루션·SI·ERP·CRM
      }

      // 시간대 분석
      if (
        lowerContent.includes("아침") ||
        lowerContent.includes("오전") ||
        lowerContent.includes("모닝") ||
        lowerContent.includes("브런치")
      ) {
        setCardStartTime("08:00");
        setCardEndTime("12:00");
      } else if (
        lowerContent.includes("점심") ||
        lowerContent.includes("런치")
      ) {
        setCardStartTime("12:00");
        setCardEndTime("14:00");
      } else if (
        lowerContent.includes("저녁") ||
        lowerContent.includes("디너") ||
        lowerContent.includes("나이트")
      ) {
        setCardStartTime("18:00");
        setCardEndTime("22:00");
      }
    },
    [generateTemplateTitle]
  );

  // 시간 옵션 생성 함수 (0-23시)
  const getAllTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, "0");
      options.push({
        value: `${hourStr}:00`,
        label: `${hourStr}:00`
      });
    }
    return options;
  };

  // 시간 유효성 검증
  useEffect(() => {
    const startHour = parseInt(cardStartTime.split(':')[0]);
    const endHour = parseInt(cardEndTime.split(':')[0]);
    
    // 시작 시간이 종료 시간보다 크거나 같으면 종료 시간을 시작 시간 + 1로 설정
    if (startHour >= endHour) {
      const newEndHour = Math.min(startHour + 1, 23);
      setCardEndTime(`${newEndHour.toString().padStart(2, "0")}:00`);
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

  // JSON 옵션들을 사용하므로 함수들은 제거됨

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

  // JSON 옵션을 사용하므로 함수 제거됨

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // 예상금액 계산 함수
  const calculateTotalCost = () => {
    const campaignCostPerItem = 100; // 캠페인 건당 금액 (100원)
    const maxRecipientsNum = parseInt(maxRecipients) || 0;
    return campaignCostPerItem * maxRecipientsNum;
  };

  // 부족한 잔액 계산
  const calculateRequiredCredits = () => {
    const totalCost = calculateTotalCost();
    const shortage = totalCost - userCredits;
    return shortage > 0 ? shortage : 0;
  };

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
      // 패키지 목록 가져오기
      const response = await fetch("/api/credit-packages");
      if (!response.ok) {
        throw new Error("패키지 정보를 가져올 수 없습니다.");
      }

      const data = await response.json();
      const packages = data.packages || [];

      if (packages.length === 0) {
        alert("사용 가능한 패키지가 없습니다.");
        return;
      }

      // 필요한 크레딧 계산
      const requiredCredits = calculateRequiredCredits();

      // 필요한 크레딧보다 큰 패키지들 중에서 가장 작은 것 찾기
      const suitablePackages = packages
        .filter((pkg: { credits: number }) => pkg.credits >= requiredCredits)
        .sort(
          (a: { credits: number }, b: { credits: number }) =>
            a.credits - b.credits
        );

      if (suitablePackages.length === 0) {
        // 가장 큰 패키지라도 부족한 경우
        const largestPackage = packages.sort(
          (a: { credits: number }, b: { credits: number }) =>
            b.credits - a.credits
        )[0];
        alert(
          `최대 패키지(${largestPackage.credits.toLocaleString()}크레딧)로도 부족합니다. 더 작은 캠페인으로 진행해주세요.`
        );
        return;
      }

      // 가장 적합한 패키지 자동 선택
      const recommendedPackage = suitablePackages[0];
      const packageInfo: Package = {
        id: recommendedPackage.id.toString(),
        name: recommendedPackage.name,
        credits: recommendedPackage.credits,
        price: recommendedPackage.price,
        bonus: recommendedPackage.bonus_credits || 0,
        isPopular: recommendedPackage.is_popular || false,
      };

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
      cardStartTime,
      cardEndTime,
      maxRecipients,
      sendPolicy,
      validityStartDate,
      validityEndDate,
      showApprovalModal: true, // 결제 완료 후 발송 모달 다시 열기
      timestamp: Date.now(),
    };

    sessionStorage.setItem(
      "targetMarketingState",
      JSON.stringify(currentState)
    );
  };

  // 저장된 상태 복원
  const restoreState = React.useCallback(() => {
    try {
      const savedState = sessionStorage.getItem("targetMarketingState");
      if (!savedState) return false;

      const state = JSON.parse(savedState);

      // 5분 이내의 상태만 복원 (결제 시간 고려)
      if (Date.now() - state.timestamp > 5 * 60 * 1000) {
        sessionStorage.removeItem("targetMarketingState");
        return false;
      }

      // 상태 복원
      setTemplateTitle(state.templateTitle || "AI 생성 콘텐츠");
      setSmsTextContent(state.smsTextContent || "");
      setCurrentGeneratedImage(state.currentGeneratedImage || null);
      setTargetGender(state.targetGender || "all");
      setTargetAge(state.targetAge || "all");
      setTargetCity(state.targetCity || "all");
      setTargetDistrict(state.targetDistrict || "all");
      setTargetTopLevelIndustry(state.targetTopLevelIndustry || "all");
      setTargetIndustry(state.targetIndustry || "all");
      setCardAmount(state.cardAmount || "10000");
      setCustomAmount(state.customAmount || "50");
      setCardStartTime(state.cardStartTime || "08:00");
      setCardEndTime(state.cardEndTime || "18:00");
      setMaxRecipients(state.maxRecipients || "30");
      setSendPolicy(state.sendPolicy || "realtime");
      // validityStartDate는 읽기 전용이므로 제외
      setValidityEndDate(state.validityEndDate || validityEndDate);

      // 결제 완료 후 발송 모달 다시 열기
      if (state.showApprovalModal) {
        setTimeout(() => {
          setShowApprovalModal(true);
        }, 1000);
      }

      // 저장된 상태 제거
      sessionStorage.removeItem("targetMarketingState");
      return true;
    } catch (error) {
      console.error("상태 복원 실패:", error);
      sessionStorage.removeItem("targetMarketingState");
      return false;
    }
  }, [validityEndDate]);

  // 크레딧 충전 모달 열기 (권장 패키지 자동 선택)
  const openCreditModal = () => {
    handleAutoSelectPackage();
  };

  // 초기 메시지에 대한 AI 응답 처리 (실제 AI API 호출)
  const handleInitialResponse = React.useCallback(
    async (userMessage: string, currentMessages: Message[], initialImage?: string | null) => {
      setShowTypingIndicator(true);

      try {
        // 사용자 입력 내용을 분석하여 타겟 설정
        analyzeTargetContent(userMessage);

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
        const requestBody: any = {
          message: userMessage,
          previousMessages: [],
        };

        // 초기 이미지가 있으면 요청에 포함
        if (initialImage) {
          requestBody.initialImage = initialImage;
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
                      id: `template-${Math.random().toString(36).substr(2, 9)}`,
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

      // 세션 스토리지에서 초기 메시지 및 이미지 확인
      const savedInitialMessage = sessionStorage.getItem("initialMessage");
      const savedInitialImage = sessionStorage.getItem("initialImage");

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
        
        // 초기 이미지가 있으면 세션 스토리지에서 제거 (사용 후)
        if (savedInitialImage) {
          sessionStorage.removeItem("initialImage");
        }

        prevMessagesLengthRef.current = 1;
      } else {
        prevMessagesLengthRef.current = 0;
      }

      // 한 번에 모든 상태 설정
      setMessages(initialMessages);
      setTemplates([initialTemplate]);
      
      // 초기 이미지가 있으면 현재 생성된 이미지로 설정
      if (savedInitialImage) {
        setCurrentGeneratedImage(savedInitialImage);
      }
      
      setIsInitialized(true);

      // 초기 메시지가 있는 경우에만 AI 응답 처리 (비동기 처리)
      if (savedInitialMessage && savedInitialMessage.trim()) {
        // 상태 설정 후 약간의 지연을 두고 AI 응답 처리
        setTimeout(() => {
          // 초기 이미지도 함께 전달
          handleInitialResponse(savedInitialMessage.trim(), initialMessages, savedInitialImage);
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

  // 페이지 로드 시 저장된 상태 복원 (결제 완료 후 돌아온 경우)
  useEffect(() => {
    // 결제 완료 플래그 확인
    const paymentCompleted = localStorage.getItem("payment_completed");
    const paymentTimestamp = localStorage.getItem(
      "payment_completed_timestamp"
    );

    if (paymentCompleted === "true" && paymentTimestamp) {
      const timestamp = parseInt(paymentTimestamp);
      const now = Date.now();
      const timeDiff = now - timestamp;

      // 결제 완료 후 30초 이내인 경우에만 상태 복원
      if (timeDiff < 30000) {
        const restored = restoreState();
        if (restored) {
          // 결제 성공 시 크레딧 잔액 새로고침
          setTimeout(async () => {
            await refreshTransactions(); // 크레딧 잔액 새로고침
            alert("결제가 완료되었습니다. 크레딧이 충전되었습니다.");
          }, 1000);
        }

        // 플래그 제거
        localStorage.removeItem("payment_completed");
        localStorage.removeItem("payment_completed_timestamp");
      }
    }
  }, [refreshTransactions, restoreState]);

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
          setTemplateTitle(
            templateData.name || templateData.title || "템플릿에서 불러온 내용"
          );
          setIsFromTemplate(true);

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

    // 사용자 입력 내용을 기반으로 제목 업데이트
    const generatedTitle = generateTemplateTitle(inputMessage);
    setTemplateTitle(generatedTitle);

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
                    id: `template-${Math.random().toString(36).substr(2, 9)}`,
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
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 이미지 편집 처리
  const handleImageEdit = async (prompt: string) => {
    if (!currentGeneratedImage) {
      alert("편집할 이미지가 없습니다. 먼저 이미지를 생성해주세요.");
      return;
    }

    try {
      setIsLoading(true);
      setShowTypingIndicator(true);

      const response = await fetch("/api/ai/edit-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          baseImageUrl: currentGeneratedImage,
          editPrompt: prompt,
        }),
      });

      const data = await response.json();

      if (data.success && data.editedImageUrl) {
        setCurrentGeneratedImage(data.editedImageUrl);

        const editedMessage: Message = {
          id: `edited-${Math.random().toString(36).substr(2, 9)}`,
          role: "assistant",
          content: `✨ 이미지가 수정되었습니다: ${prompt}`,
          timestamp: new Date(),
          imageUrl: data.editedImageUrl,
        };
        setMessages((prev) => [...prev, editedMessage]);
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

  // 승인 신청 처리 함수
  const handleApprovalSubmit = async () => {
    if (!smsTextContent.trim() || !currentGeneratedImage) {
      alert("캠페인 내용과 이미지가 필요합니다.");
      return;
    }

    // 크레딧 잔액 확인
    const requiredCredits = calculateRequiredCredits();

    if (requiredCredits > 0) {
      alert("크레딧이 부족합니다. 크레딧을 충전해주세요.");
      return;
    }

    setIsSubmittingApproval(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      // 실제 계산된 비용 사용
      const totalCost = calculateTotalCost();
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
          cardAmount: cardAmount === "custom" ? `${customAmount}0000` : cardAmount,
          cardTime: {
            startTime: cardStartTime,
            endTime: cardEndTime,
          },
        },
        estimatedCost: totalCost, // 실제 계산된 예상 금액 사용
        templateDescription: smsTextContent, // 템플릿 설명 추가
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
        setShowApprovalModal(false);
        setShowSuccessModal(true); // 성공 모달 표시
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

  //상태 추가 (일괄 발송 관련)
  const [batchSendDate, setBatchSendDate] = useState("오늘+3일");
  const [batchSendTime, setBatchSendTime] = useState("00:00");
  const [targetCount, setTargetCount] = useState(500); // 타겟 대상자 수
  const [adRecipientCount, setAdRecipientCount] = useState(30); // 광고 수신자 수

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
                disabled={isLoading || showTypingIndicator}
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

        {/* 우측: 캠페인 설정 영역 */}
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
                    {isImageGenerating && (
                      <div className={styles.imageGeneratingOverlay}>
                        <div className={styles.loadingSpinner}></div>
                        <span>이미지 생성 중...</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.templateImagePlaceholder}>
                    <div className={styles.placeholderContent}>
                      {isImageGenerating ? (
                        <>
                          <div className={styles.loadingSpinner}></div>
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
                <div className={styles.templateInfo}>
                  <h3 className={styles.templateTitle}>{templateTitle}</h3>
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
                            : templateTitle, // 동적으로 생성된 제목 사용
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
                    <div className={styles.filterLabel}>성별</div>
                    <select
                      className={styles.filterSelect}
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
                  <div className={styles.filterGroup}>
                    <div className={styles.filterLabel}>연령대</div>
                    <select
                      className={styles.filterSelect}
                      value={targetAge}
                      onChange={(e) => setTargetAge(e.target.value)}
                    >
                      {targetOptions.age.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 카드 사용 위치 */}
              <div className={styles.targetFiltersSection}>
                <div className={styles.sectionTitle}>카드 사용 위치</div>
                <div className={styles.filterRow}>
                  <div className={styles.filterGroup}>
                    <div className={styles.filterLabel}>시/도</div>
                    <select
                      className={styles.filterSelect}
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
                  <div className={styles.filterGroup}>
                    <div className={styles.filterLabel}>시/군/구</div>
                    <select
                      className={styles.filterSelect}
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
              <div className={styles.targetFiltersSection}>
                <div className={styles.sectionTitle}>타겟 업종</div>
                <div className={styles.filterRow}>
                  <div className={styles.filterGroup}>
                    <div className={styles.filterLabel}>대분류</div>
                    <select
                      className={styles.filterSelect}
                      value={targetTopLevelIndustry}
                      onChange={(e) => setTargetTopLevelIndustry(e.target.value)}
                    >
                      {targetOptions.topLevelIndustries.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.filterGroup}>
                    <div className={styles.filterLabel}>세부업종</div>
                    <select
                      className={styles.filterSelect}
                      value={targetIndustry}
                      onChange={(e) => setTargetIndustry(e.target.value)}
                    >
                      {getIndustriesByTopLevel(targetTopLevelIndustry).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 카드 승인 금액 */}
              <div className={styles.cardAmountSection}>
                <div className={styles.sectionTitle}>카드 승인 금액</div>
                <div className={styles.amountCardOptions}>
                  {targetOptions.cardAmounts.map((option) => (
                    <div
                      key={option.value}
                      className={`${styles.amountCard} ${
                        cardAmount === option.value ? styles.selected : ""
                      }`}
                      onClick={() => setCardAmount(option.value)}
                    >
                      <div className={styles.amountCardLabel}>
                        {option.label}
                      </div>
                      <div className={styles.amountCardRadio}>
                        <div 
                          className={`${styles.radioCircle} ${
                            cardAmount === option.value ? styles.checked : ""
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* 직접 입력 필드 */}
                {cardAmount === "custom" && (
                  <div className={styles.customAmountInput}>
                    <div className={styles.customAmountWrapper}>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => {
                          const value = e.target.value;
                          // 숫자만 입력되도록 하고, 최대 1000만원으로 제한
                          if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 1000)) {
                            setCustomAmount(value);
                          }
                        }}
                        placeholder="50"
                        className={styles.customAmountField}
                        min="1"
                        max="1000"
                      />
                      <span className={styles.customAmountUnit}>만원</span>
                    </div>
                    <div className={styles.customAmountHint}>
                      1만원 ~ 1,000만원 사이로 입력해주세요
                    </div>
                  </div>
                )}
              </div>

              {/* 카드 승인 시간 */}
              <div className={styles.cardTimeSection}>
                <div className={styles.sectionTitle}>카드 승인 시간</div>
                <div className={styles.timeSelectors}>
                  <div className={styles.timeGroup}>
                    <select
                      className={styles.timeSelect}
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
                  <span className={styles.timeSeparator}>~</span>
                  <div className={styles.timeGroup}>
                    <select
                      className={styles.timeSelect}
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
              </div>
            </div>
          </div>

          {/* 예상금액 */}
          <div className={styles.costEstimationSection}>
            <div className={styles.costLabel}>예상금액</div>
            <div className={styles.costValue}>
              <span className={styles.costAmount}>100크레딧/</span>
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
                        <select
                          className={styles.batchSelect}
                          value={batchSendDate}
                          onChange={(e) => setBatchSendDate(e.target.value)}
                        >
                          {batchSendDateOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <select
                          className={styles.batchSelect}
                          value={batchSendTime}
                          onChange={(e) => setBatchSendTime(e.target.value)}
                        >
                          {generateBatchTimeOptions().map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.targetCountInfo}>
                        <span>타겟 대상자 수</span>
                        <input
                          type="number"
                          value={targetCount}
                          onChange={(e) =>
                            setTargetCount(parseInt(e.target.value) || 500)
                          }
                          className={styles.adRecipientInput}
                          style={{ width: "80px", textAlign: "right" }}
                        />
                        <span>명</span>
                      </div>

                      <div className={styles.adRecipientSection}>
                        <span>광고 수신자 수</span>
                        <input
                          type="number"
                          value={adRecipientCount}
                          onChange={(e) =>
                            setAdRecipientCount(parseInt(e.target.value) || 30)
                          }
                          className={styles.adRecipientInput}
                          max={targetCount}
                        />
                        <span>명</span>
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
                  <span>100크레딧/건</span>
                </div>
                <div className={styles.costRow}>
                  <span></span>
                  <span>합계</span>
                  <span>{calculateTotalCost().toLocaleString()}크레딧</span>
                </div>
                <div className={styles.costRow}>
                  <span></span>
                  <span>충전 잔액</span>
                  <span>
                    {isLoadingCredits ? (
                      <span className={styles.balanceAmount}>로딩 중...</span>
                    ) : (
                      <>
                        <span className={styles.balanceAmount}>
                          {userCredits.toLocaleString()}
                        </span>
                        <span className={styles.balanceUnit}>크레딧</span>
                      </>
                    )}
                  </span>
                </div>
                {calculateRequiredCredits() > 0 && (
                  <div className={styles.costRow}>
                    <span></span>
                    <span className={styles.chargeNoticeText}>
                      ⚠ 크레딧을 충전해주세요.
                    </span>
                    <span>
                      <button
                        className={styles.chargeButton}
                        onClick={openCreditModal}
                      >
                        + 충전하기
                      </button>
                    </span>
                  </div>
                )}
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
        className={styles.paymentModalWrapper}
        style={{
          display: isPaymentModalOpen ? "block" : "none",
          zIndex: 1010,
        }}
      >
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          packageInfo={selectedPackage}
          redirectUrl={window.location.pathname}
        />
      </div>
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
