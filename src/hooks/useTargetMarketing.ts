import { useCallback } from "react";
import { DynamicButton } from "@/types/targetMarketing";
import { targetOptions } from "@/lib/targetOptions";
import { 
  CAMPAIGN_CONSTANTS, 
  ERROR_MESSAGES,
  TIME_CONSTANTS,
  BUTTON_CONSTRAINTS
} from "@/constants/targetMarketing";

// 템플릿 제목 생성 훅
export const useTemplateGeneration = () => {
  const generateTemplateTitle = useCallback((content: string) => {
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

  return { generateTemplateTitle };
};

// 타겟 분석 훅
export const useTargetAnalysis = () => {
  const analyzeTargetContent = useCallback((content: string) => {
    const lowerContent = content.toLowerCase();
    const analysis = {
      gender: "all",
      age: ["all"] as string[],
      city: "all",
      district: "all",
      topLevelIndustry: "all",
      industry: "all",
      cardAmount: "10000",
      startTime: "08:00",
      endTime: "18:00"
    };

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
      analysis.gender = "female";
    } else if (
      lowerContent.includes("남성") ||
      lowerContent.includes("남자") ||
      lowerContent.includes("남성용")
    ) {
      analysis.gender = "male";
    }

    // 연령대 분석 (다중 선택 지원)
    const detectedAges = [];
    
    if (
      lowerContent.includes("10대") ||
      lowerContent.includes("학생") ||
      lowerContent.includes("청소년")
    ) {
      detectedAges.push("teens");
    }
    
    if (
      lowerContent.includes("20대") ||
      lowerContent.includes("대학생") ||
      lowerContent.includes("신입")
    ) {
      detectedAges.push("twenties");
    }
    
    if (
      lowerContent.includes("30대") ||
      lowerContent.includes("직장인")
    ) {
      detectedAges.push("thirties");
    }
    
    if (
      lowerContent.includes("40대") ||
      lowerContent.includes("중년")
    ) {
      detectedAges.push("forties");
    }
    
    if (
      lowerContent.includes("50대") ||
      lowerContent.includes("시니어")
    ) {
      detectedAges.push("fifties");
    }
    
    if (detectedAges.length > 0) {
      analysis.age = detectedAges;
    }

    // 지역 분석
    if (
      lowerContent.includes("홍대") ||
      lowerContent.includes("신촌") ||
      lowerContent.includes("마포")
    ) {
      analysis.city = "seoul";
      analysis.district = "mapo";
    } else if (
      lowerContent.includes("강남") ||
      lowerContent.includes("역삼") ||
      lowerContent.includes("선릉")
    ) {
      analysis.city = "seoul";
      analysis.district = "gangnam";
    } else if (
      lowerContent.includes("강북") ||
      lowerContent.includes("노원") ||
      lowerContent.includes("도봉")
    ) {
      analysis.city = "seoul";
      analysis.district = "gangbuk";
    } else if (
      lowerContent.includes("서초") ||
      lowerContent.includes("양재") ||
      lowerContent.includes("교대")
    ) {
      analysis.city = "seoul";
      analysis.district = "seocho";
    } else if (
      lowerContent.includes("강서") ||
      lowerContent.includes("김포공항") ||
      lowerContent.includes("발산")
    ) {
      analysis.city = "seoul";
      analysis.district = "gangseo";
    } else if (
      lowerContent.includes("부산") ||
      lowerContent.includes("해운대") ||
      lowerContent.includes("서면")
    ) {
      analysis.city = "busan";
    } else if (
      lowerContent.includes("대구") ||
      lowerContent.includes("동성로")
    ) {
      analysis.city = "daegu";
    }

    // 카드 금액 분석
    if (
      lowerContent.includes("고급") ||
      lowerContent.includes("프리미엄") ||
      lowerContent.includes("럭셔리") ||
      lowerContent.includes("10만원") ||
      lowerContent.includes("100000")
    ) {
      analysis.cardAmount = "100000";
    } else if (
      lowerContent.includes("5만원") ||
      lowerContent.includes("50000") ||
      lowerContent.includes("중가")
    ) {
      analysis.cardAmount = "50000";
    } else if (
      lowerContent.includes("저렴") ||
      lowerContent.includes("할인") ||
      lowerContent.includes("특가") ||
      lowerContent.includes("1만원") ||
      lowerContent.includes("10000")
    ) {
      analysis.cardAmount = "10000";
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
      analysis.topLevelIndustry = "1"; // 서비스업
      analysis.industry = "109"; // 외식업·식음료
    } else if (
      lowerContent.includes("헤어샵") ||
      lowerContent.includes("미용실") ||
      lowerContent.includes("뷰티") ||
      lowerContent.includes("네일") ||
      lowerContent.includes("피부")
    ) {
      analysis.topLevelIndustry = "1"; // 서비스업
      analysis.industry = "122"; // 뷰티·미용
    } else if (
      lowerContent.includes("병원") ||
      lowerContent.includes("의원") ||
      lowerContent.includes("의료")
    ) {
      analysis.topLevelIndustry = "7"; // 의료·제약·복지
      analysis.industry = "701"; // 의료(진료과목별)
    } else if (
      lowerContent.includes("학원") ||
      lowerContent.includes("교육") ||
      lowerContent.includes("어학원")
    ) {
      analysis.topLevelIndustry = "6"; // 교육업
      analysis.industry = "602"; // 학원·어학원
    } else if (
      lowerContent.includes("호텔") ||
      lowerContent.includes("여행") ||
      lowerContent.includes("펜션")
    ) {
      analysis.topLevelIndustry = "1"; // 서비스업
      analysis.industry = "108"; // 호텔·여행·항공
    } else if (
      lowerContent.includes("쇼핑몰") ||
      lowerContent.includes("옷가게") ||
      lowerContent.includes("의류") ||
      lowerContent.includes("패션")
    ) {
      analysis.topLevelIndustry = "8"; // 판매·유통
      analysis.industry = "802"; // 판매(상품품목별)
    } else if (
      lowerContent.includes("IT") ||
      lowerContent.includes("개발") ||
      lowerContent.includes("웹") ||
      lowerContent.includes("앱")
    ) {
      analysis.topLevelIndustry = "3"; // IT·웹·통신
      analysis.industry = "301"; // 솔루션·SI·ERP·CRM
    }

    // 시간대 분석
    if (
      lowerContent.includes("아침") ||
      lowerContent.includes("오전") ||
      lowerContent.includes("모닝") ||
      lowerContent.includes("브런치")
    ) {
      analysis.startTime = "08:00";
      analysis.endTime = "12:00";
    } else if (
      lowerContent.includes("점심") ||
      lowerContent.includes("런치")
    ) {
      analysis.startTime = "12:00";
      analysis.endTime = "14:00";
    } else if (
      lowerContent.includes("저녁") ||
      lowerContent.includes("디너") ||
      lowerContent.includes("나이트")
    ) {
      analysis.startTime = "18:00";
      analysis.endTime = "22:00";
    }

    return analysis;
  }, []);

  return { analyzeTargetContent };
};

// 동적 버튼 관리 훅
export const useDynamicButtons = () => {
  const addDynamicButton = useCallback((dynamicButtons: DynamicButton[], setDynamicButtons: (buttons: DynamicButton[]) => void) => {
    if (dynamicButtons.length < BUTTON_CONSTRAINTS.MAX_BUTTONS) {
      const newButton: DynamicButton = {
        id: `button-${Date.now()}`,
        text: "",
        linkType: 'web',
        url: ""
      };
      setDynamicButtons([...dynamicButtons, newButton]);
    }
  }, []);

  const removeDynamicButton = useCallback((id: string, dynamicButtons: DynamicButton[], setDynamicButtons: (buttons: DynamicButton[]) => void) => {
    setDynamicButtons(dynamicButtons.filter(button => button.id !== id));
  }, []);

  const updateDynamicButton = useCallback((id: string, field: keyof DynamicButton, value: string, dynamicButtons: DynamicButton[], setDynamicButtons: (buttons: DynamicButton[]) => void) => {
    setDynamicButtons(dynamicButtons.map(button => {
      if (button.id === id) {
        const updatedButton = { ...button, [field]: value };
        
        // linkType이 변경될 때 적절한 필드들을 초기화
        if (field === 'linkType') {
          if (value === 'web') {
            updatedButton.iosUrl = undefined;
            updatedButton.androidUrl = undefined;
            updatedButton.url = updatedButton.url || "";
          } else if (value === 'app') {
            updatedButton.url = undefined;
            updatedButton.iosUrl = updatedButton.iosUrl || "";
            updatedButton.androidUrl = updatedButton.androidUrl || "";
          }
        }
        
        return updatedButton;
      }
      return button;
    }));
  }, []);

  const handleLinkCheck = useCallback((button: DynamicButton) => {
    if (button.linkType === 'web') {
      if (!button.url?.trim()) {
        alert(ERROR_MESSAGES.WEB_LINK_REQUIRED);
        return;
      }
      
      let validUrl = button.url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }

      try {
        new URL(validUrl);
        window.open(validUrl, '_blank', 'noopener,noreferrer');
      } catch {
        alert(ERROR_MESSAGES.INVALID_URL);
      }
    } else if (button.linkType === 'app') {
      if (!button.iosUrl?.trim() && !button.androidUrl?.trim()) {
        alert(ERROR_MESSAGES.APP_LINK_REQUIRED);
        return;
      }
      
      let message = '앱링크 확인:\n';
      if (button.iosUrl?.trim()) {
        message += `iOS: ${button.iosUrl}\n`;
      }
      if (button.androidUrl?.trim()) {
        message += `Android: ${button.androidUrl}`;
      }
      alert(message);
    }
  }, []);

  return { addDynamicButton, removeDynamicButton, updateDynamicButton, handleLinkCheck };
};

// 시간 옵션 및 연령대 표시 훅
export const useTargetOptions = () => {
  const getAllTimeOptions = useCallback(() => {
    const options = [];
    for (let hour = 0; hour < TIME_CONSTANTS.HOURS_IN_DAY; hour++) {
      const hourStr = hour.toString().padStart(2, "0");
      options.push({
        value: `${hourStr}:00`,
        label: `${hourStr}:00`,
      });
    }
    return options;
  }, []);

  const getSelectedAgeDisplay = useCallback((targetAge: string[]) => {
    if (targetAge.includes("all")) {
      return "전체";
    }
    
    const selectedLabels = targetAge.map(value => {
      const option = targetOptions.age.find(opt => opt.value === value);
      return option?.label || value;
    }).filter(Boolean);
    
    if (selectedLabels.length === 0) {
      return "선택하세요";
    } else if (selectedLabels.length === 1) {
      return selectedLabels[0];
    } else if (selectedLabels.length === 2) {
      return selectedLabels.join(", ");
    } else {
      return `${selectedLabels[0]} 외 ${selectedLabels.length - 1}개`;
    }
  }, []);

  return { getAllTimeOptions, getSelectedAgeDisplay };
};

// 계산 관련 훅
export const useCalculations = () => {
  const calculateTotalCost = useCallback((sendPolicy: "realtime" | "batch", maxRecipients: string, adRecipientCount: number) => {
    
    // 발송 정책에 따라 다른 수신자 수 사용
    const actualRecipients = sendPolicy === "batch" 
      ? adRecipientCount  // 일괄 발송: 광고 수신자 수 사용
      : parseInt(maxRecipients) || 0;  // 실시간 발송: 최대 수신자 수 사용
    
    return CAMPAIGN_CONSTANTS.COST_PER_ITEM * actualRecipients;
  }, []);

  const calculateRequiredCredits = useCallback((totalCost: number, userCredits: number) => {
    const shortage = totalCost - userCredits;
    return shortage > 0 ? shortage : 0;
  }, []);

  return { calculateTotalCost, calculateRequiredCredits };
};
