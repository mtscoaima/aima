import { useCallback } from "react";
import { DynamicButton } from "@/types/targetMarketing";
import { targetOptions } from "@/lib/targetOptions";
import { 
  CAMPAIGN_CONSTANTS, 
  ERROR_MESSAGES,
  TIME_CONSTANTS,
  BUTTON_CONSTRAINTS,
  PRICING_STEPS
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
// URL 유효성 검사 함수
const validateUrl = (url: string, type: 'web' | 'ios' | 'android'): { isValid: boolean; errorMessage?: string } => {
  if (!url || !url.trim()) {
    return { isValid: false, errorMessage: `${type} URL을 입력해주세요.` };
  }

  const trimmedUrl = url.trim();

  if (type === 'web') {
    // 웹 URL 검증
    try {
      let validUrl = trimmedUrl;
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      
      const urlObj = new URL(validUrl);
      
      // 도메인이 www.만 있거나 빈 경우 체크
      if (!urlObj.hostname || urlObj.hostname === 'www' || urlObj.hostname === 'www.') {
        return { isValid: false, errorMessage: '올바른 도메인을 입력해주세요. (예: https://example.com)' };
      }
      
      // 도메인에 적어도 하나의 점(.)이 있어야 함
      if (!urlObj.hostname.includes('.') || urlObj.hostname.split('.').filter(part => part.length > 0).length < 2) {
        return { isValid: false, errorMessage: '올바른 도메인 형식이 아닙니다. (예: https://example.com)' };
      }
      
      return { isValid: true };
    } catch {
      return { isValid: false, errorMessage: '올바른 웹 URL 형식이 아닙니다. (예: https://example.com)' };
    }
  } else if (type === 'ios') {
    // iOS 앱스토어/딥링크 URL 검증
    const iosPatterns = [
      /^https:\/\/apps\.apple\.com\/.*$/i,  // 앱스토어 링크
      /^https:\/\/itunes\.apple\.com\/.*$/i, // iTunes 링크
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.*$/,  // 커스텀 스킴 (딥링크)
    ];
    
    const isValidIos = iosPatterns.some(pattern => pattern.test(trimmedUrl));
    if (!isValidIos) {
      return { 
        isValid: false, 
        errorMessage: 'iOS URL은 앱스토어 링크 또는 앱 딥링크여야 합니다.\n(예: https://apps.apple.com/... 또는 myapp://...)' 
      };
    }
    return { isValid: true };
  } else if (type === 'android') {
    // Android 플레이스토어/딥링크 URL 검증
    const androidPatterns = [
      /^https:\/\/play\.google\.com\/store\/apps\/.*$/i, // 플레이스토어 링크
      /^market:\/\/details\?id=.*$/i,  // Market 링크
      /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/.*$/, // 커스텀 스킴 (딥링크)
    ];
    
    const isValidAndroid = androidPatterns.some(pattern => pattern.test(trimmedUrl));
    if (!isValidAndroid) {
      return { 
        isValid: false, 
        errorMessage: 'Android URL은 플레이스토어 링크 또는 앱 딥링크여야 합니다.\n(예: https://play.google.com/store/apps/... 또는 myapp://...)' 
      };
    }
    return { isValid: true };
  }

  return { isValid: false, errorMessage: '알 수 없는 URL 타입입니다.' };
};

// 모든 버튼 URL 유효성 검사
const validateAllButtonUrls = (dynamicButtons: DynamicButton[]): { isValid: boolean; errorMessage?: string } => {
  for (let i = 0; i < dynamicButtons.length; i++) {
    const button = dynamicButtons[i];
    const buttonIndex = i + 1;

    if (button.linkType === 'web') {
      const validation = validateUrl(button.url || '', 'web');
      if (!validation.isValid) {
        return { 
          isValid: false, 
          errorMessage: `버튼 ${buttonIndex}: ${validation.errorMessage}` 
        };
      }
    } else if (button.linkType === 'app') {
      // iOS URL 검증
      if (button.iosUrl && button.iosUrl.trim()) {
        const iosValidation = validateUrl(button.iosUrl, 'ios');
        if (!iosValidation.isValid) {
          return { 
            isValid: false, 
            errorMessage: `버튼 ${buttonIndex} (iOS): ${iosValidation.errorMessage}` 
          };
        }
      }

      // Android URL 검증
      if (button.androidUrl && button.androidUrl.trim()) {
        const androidValidation = validateUrl(button.androidUrl, 'android');
        if (!androidValidation.isValid) {
          return { 
            isValid: false, 
            errorMessage: `버튼 ${buttonIndex} (Android): ${androidValidation.errorMessage}` 
          };
        }
      }

      // 앱 링크는 iOS 또는 Android 중 하나는 반드시 있어야 함
      if (!button.iosUrl?.trim() && !button.androidUrl?.trim()) {
        return { 
          isValid: false, 
          errorMessage: `버튼 ${buttonIndex}: iOS 또는 Android URL 중 하나는 반드시 입력해야 합니다.` 
        };
      }
    }
  }
  return { isValid: true };
};

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

  return { addDynamicButton, removeDynamicButton, updateDynamicButton, handleLinkCheck, validateAllButtonUrls };
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
  // 단가 계산: 선택된 타겟 조건에 따라 차등가 적용
  const calculateUnitCost = useCallback((params: {
    adMedium: "naver_talktalk" | "sms";
    gender: string; // 'all' | 'male' | 'female'
    ages: string[]; // 포함 시 50원
    hasLocationFilter: boolean; // true면 위치 차등가 적용
    hasIndustryFilter: boolean; // true면 업종 차등가 적용
    hasAmountFilter: boolean; // true면 승인금액 차등가 적용
    carouselFirst?: boolean; // RCS 첫번째 노출
  }) => {
    let unit = PRICING_STEPS.base;

    if (params.hasLocationFilter) unit += PRICING_STEPS.increments.location;
    if (params.gender && params.gender !== "all") unit += PRICING_STEPS.increments.gender;
    if (Array.isArray(params.ages) && params.ages.length > 0 && !(params.ages.length === 1 && params.ages[0] === "all")) {
      unit += PRICING_STEPS.increments.age;
    }
    if (params.hasAmountFilter) unit += PRICING_STEPS.increments.amount;
    if (params.hasIndustryFilter) unit += PRICING_STEPS.increments.industry;
    if (params.adMedium === "naver_talktalk" && params.carouselFirst) unit += PRICING_STEPS.increments.carouselFirst;

    return unit;
  }, []);

  const calculateTotalCost = useCallback((sendPolicy: "realtime" | "batch", maxRecipients: string, adRecipientCount: number, unitCost?: number) => {
    // 발송 정책에 따라 다른 수신자 수 사용
    const actualRecipients = sendPolicy === "batch" 
      ? adRecipientCount  // 일괄 발송: 광고 수신자 수 사용
      : parseInt(maxRecipients) || 0;  // 실시간 발송: 최대 수신자 수 사용
    
    const perItem = unitCost ?? CAMPAIGN_CONSTANTS.COST_PER_ITEM;
    return perItem * actualRecipients;
  }, []);

  const calculateRequiredCredits = useCallback((totalCost: number, userCredits: number) => {
    const shortage = totalCost - userCredits;
    return shortage > 0 ? shortage : 0;
  }, []);

  return { calculateUnitCost, calculateTotalCost, calculateRequiredCredits };
};
