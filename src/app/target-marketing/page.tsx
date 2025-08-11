"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TargetMarketingDetail from "@/components/TargetMarketingDetail";
import NaverTalkTalkTab from "@/components/NaverTalkTalkTab";

import { useAuth } from "@/contexts/AuthContext";
import "./styles.css";

interface DetailProps {
  templateId?: number | null;
  useTemplate?: boolean;
  initialMessage?: string;
  initialImage?: string | null;
}

// 실제 캠페인 데이터 인터페이스
interface RealCampaign {
  id: number;
  name: string;
  description?: string;
  status: string;
  approval_status?: string;
  schedule_start_date?: string;
  schedule_end_date?: string;
  budget?: number;
  actual_cost?: number;
  total_recipients?: number;
  sent_count: number;
  success_count: number;
  failed_count: number;
  created_at: string;
  updated_at?: string;
  target_criteria: {
    gender?: string | string[];
    ageGroup?: string | string[];
    location?: {
      city?: string;
      district?: string;
    };
    cardAmount?: string;
    cardTime?: {
      startTime?: string;
      endTime?: string;
      period?: string;
    };
    sendPolicy?: string;
    cardUsageIndustry?: string;
    costPerItem?: number;
    [key: string]: unknown; // 추가 필드들을 위한 인덱스 시그니처
  };
  message_templates?: {
    name: string;
    content: string;
    image_url: string;
    category?: string;
  };
}

const tabs = [
  { id: "naver-talktalk", label: "네이버 톡톡" },
  { id: "campaign-management", label: "캠페인 관리" },
  { id: "template-management", label: "템플릿 관리" },
];

function TargetMarketingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();



  const [activeTab, setActiveTab] = useState("naver-talktalk");

  // 뷰 상태 관리
  const [currentView, setCurrentView] = useState<"main" | "detail">("main");
  const [detailProps, setDetailProps] = useState<DetailProps>({});

  // 캠페인 관리 탭 상태
  const [campaignManagementTab, setCampaignManagementTab] = useState<"overview" | "management">("overview");
  const [campaignFilter, setCampaignFilter] = useState({
    isActive: "all", // "all", "on", "off"
    period: "전체기간",
    searchType: "전체",
    searchKeyword: ""
  });
  const [campaigns, setCampaigns] = useState<RealCampaign[]>([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);

  // 캠페인 관리 탭 전용 상태
  const [managementFilter, setManagementFilter] = useState({
    approvalStatus: "all", // "all", "pending", "approved", "rejected", "reviewing", "registered"
    searchType: "전체",
    searchKeyword: ""
  });
  const [selectedCampaigns, setSelectedCampaigns] = useState<number[]>([]);
  
  // 캠페인 이름 수정 관련 상태
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState("");

  // URL 쿼리 파라미터에서 tab 값 읽기
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && tabs.some(tab => tab.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // 탭 변경 시 뷰 초기화
  useEffect(() => {
    if (activeTab !== "naver-talktalk" && currentView === "detail") {
      setCurrentView("main");
    }
  }, [activeTab, currentView]);

  // 캠페인 데이터 로드
  const loadRealCampaigns = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingCampaigns(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("토큰이 없습니다.");
        return;
      }

      const response = await fetch("/api/campaigns", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
    } else {
        console.error("캠페인 데이터 로드 실패:", response.statusText);
      }
    } catch (error) {
      console.error("캠페인 데이터 로드 오류:", error);
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [user]);

  // 캠페인 관리 탭 활성화 시 데이터 로드
  useEffect(() => {
    if (activeTab === "campaign-management" && user) {
      loadRealCampaigns();
    }
  }, [activeTab, user, loadRealCampaigns]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`?tab=${tabId}`, { scroll: false });
  };

  const handleNavigateToDetail = (templateId?: number, useTemplate?: boolean) => {
    setDetailProps({ templateId, useTemplate });
    setCurrentView("detail");
  };

  // 캠페인 상태에 따른 ON/OFF 판단
  const isCampaignActive = (status: RealCampaign["status"]) => {
    return status === "ACTIVE" || status === "APPROVED";
  };

  // 발송 정책 판단 및 한글 변환
  const getSendPolicy = (campaign: RealCampaign) => {
    const criteria = campaign.target_criteria as { sendPolicy?: string };
    const policy = criteria?.sendPolicy || "realtime";
    
    switch (policy.toLowerCase()) {
      case "batch":
        return "일괄 발송";
      case "realtime":
      case "real-time":
      case "실시간":
        return "실시간 발송";
      default:
        return "실시간 발송";
    }
  };

  // 유효기간 생성
  const getValidPeriod = (campaign: RealCampaign) => {
    if (campaign.schedule_start_date && campaign.schedule_end_date) {
      const startDate = new Date(campaign.schedule_start_date).toLocaleDateString("ko-KR").replace(/\. /g, "-").replace(".", "");
      const endDate = new Date(campaign.schedule_end_date).toLocaleDateString("ko-KR").replace(/\. /g, "-").replace(".", "");
      return `${startDate}~${endDate}`;
    }
    return null;
  };

  // 캠페인 필터링 함수 (현황 탭용)
  const getFilteredCampaigns = () => {
    return campaigns.filter(campaign => {
      // 사용여부 필터
      const isActive = isCampaignActive(campaign.status);
      if (campaignFilter.isActive === "on" && !isActive) return false;
      if (campaignFilter.isActive === "off" && isActive) return false;
      
      // 기간 필터 (생성일 기준)
      if (campaignFilter.period !== "전체기간") {
        const now = new Date();
        const createdDate = new Date(campaign.created_at);
        
        switch (campaignFilter.period) {
          case "최근 1주일":
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (createdDate < oneWeekAgo) return false;
            break;
          case "최근 1개월":
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            if (createdDate < oneMonthAgo) return false;
            break;
          case "최근 3개월":
            const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            if (createdDate < threeMonthsAgo) return false;
            break;
        }
      }
      
      // 검색 필터
      if (campaignFilter.searchKeyword && campaignFilter.searchKeyword.trim()) {
        const keyword = campaignFilter.searchKeyword.toLowerCase().trim();
        
        switch (campaignFilter.searchType) {
          case "캠페인 이름":
            return campaign.name.toLowerCase().includes(keyword);
          case "발송정책":
            const sendPolicy = getSendPolicy(campaign);
            return sendPolicy.toLowerCase().includes(keyword) ||
                   (keyword.includes("실시간") && sendPolicy.includes("실시간")) ||
                   (keyword.includes("일괄") && sendPolicy.includes("일괄"));
          case "전체":
          default:
            const sendPolicyForSearch = getSendPolicy(campaign);
            return campaign.name.toLowerCase().includes(keyword) ||
                   (campaign.description && campaign.description.toLowerCase().includes(keyword)) ||
                   sendPolicyForSearch.toLowerCase().includes(keyword) ||
                   (keyword.includes("실시간") && sendPolicyForSearch.includes("실시간")) ||
                   (keyword.includes("일괄") && sendPolicyForSearch.includes("일괄"));
        }
      }
      
      return true;
    });
  };

  // 영어 연령대를 한글로 변환하는 매핑
  const ageMapping: { [key: string]: string } = {
    // 기본 연령대
    "teens": "10대",
    "twenties": "20대", 
    "thirties": "30대",
    "forties": "40대",
    "fifties": "50대",
    "sixties": "60대",
    "seventies": "70대",
    "eighties": "80대",
    "nineties": "90대",
    
    // 세부 연령대
    "early-twenties": "20대 초반",
    "mid-twenties": "20대 중반", 
    "late-twenties": "20대 후반",
    "early-thirties": "30대 초반",
    "mid-thirties": "30대 중반",
    "late-thirties": "30대 후반",
    "early-forties": "40대 초반",
    "mid-forties": "40대 중반",
    "late-forties": "40대 후반",
    "early-fifties": "50대 초반",
    "mid-fifties": "50대 중반",
    "late-fifties": "50대 후반",
    
    // 범위형 연령대  
    "18-29": "20대",
    "30-39": "30대",
    "40-49": "40대", 
    "50-59": "50대",
    "60-69": "60대",
    "20-29": "20대",
    "25-34": "20대 후반~30대 초반",
    "35-44": "30대 후반~40대 초반",
    "45-54": "40대 후반~50대 초반",
    
    // 기타
    "young": "젊은층",
    "middle": "중년층", 
    "senior": "시니어",
    "elderly": "고령층",
    "adult": "성인",
    "all": "전체",
    "": "전체"
  };

  // 영어 연령대를 한글로 변환하는 함수
  const convertAgeToKorean = (age: string): string => {
    if (!age || age === "all") {
      return "전체";
    }
    
    // 소문자로 변환하여 매핑 확인
    const lowerAge = age.toLowerCase();
    
    // 정확히 매칭되는 경우
    if (ageMapping[lowerAge]) {
      return ageMapping[lowerAge];
    }
    
    // 숫자 범위 패턴 매칭 (예: "25-44" → "20대 후반~40대 초반")
    const rangeMatch = lowerAge.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const startAge = parseInt(rangeMatch[1]);
      const endAge = parseInt(rangeMatch[2]);
      
      const startDecade = Math.floor(startAge / 10) * 10;
      const endDecade = Math.floor(endAge / 10) * 10;
      
      if (startDecade === endDecade) {
        return `${startDecade}대`;
        } else {
        return `${startDecade}대~${endDecade}대`;
      }
    }
    
    // 단일 숫자 패턴 (예: "30" → "30대")
    const singleNumberMatch = lowerAge.match(/^(\d+)$/);
    if (singleNumberMatch) {
      const ageNum = parseInt(singleNumberMatch[1]);
      const decade = Math.floor(ageNum / 10) * 10;
      return `${decade}대`;
    }
    
    // 부분 매칭 시도
    for (const [key, value] of Object.entries(ageMapping)) {
      if (lowerAge.includes(key) && key.length > 2) {
        return value;
      }
    }
    
    // 매칭되지 않는 경우 원본 반환
    return age;
  };

  // 영어 지역명을 한글로 변환하는 매핑
  const locationMapping: { [key: string]: string } = {
    // 특별시/광역시
    "seoul": "서울시",
    "busan": "부산시", 
    "daegu": "대구시",
    "incheon": "인천시",
    "gwangju-metro": "광주시", // 광역시
    "daejeon": "대전시",
    "ulsan": "울산시",
    "sejong": "세종시",
    
    // 도 단위
    "gyeonggi": "경기도",
    "gangwon": "강원도",
    "chungbuk": "충청북도",
    "chungnam": "충청남도", 
    "jeonbuk": "전라북도",
    "jeonnam": "전라남도",
    "gyeongbuk": "경상북도",
    "gyeongnam": "경상남도",
    "jeju": "제주도",
    
    // 자주 사용되는 구/군 (서울)
    "gangnam": "강남구",
    "gangdong": "강동구",
    "gangbuk": "강북구",
    "gangseo": "강서구",
    "gwanak": "관악구",
    "gwangjin": "광진구",
    "guro": "구로구",
    "geumcheon": "금천구",
    "nowon": "노원구",
    "dobong": "도봉구",
    "dongdaemun": "동대문구",
    "dongjak": "동작구",
    "mapo": "마포구",
    "seodaemun": "서대문구",
    "seocho": "서초구",
    "seongdong": "성동구",
    "seongbuk": "성북구",
    "songpa": "송파구",
    "yangcheon": "양천구",
    "yeongdeungpo": "영등포구",
    "yongsan": "용산구",
    "eunpyeong": "은평구",
    "jongno": "종로구",
    "jung": "중구",
    "jungnang": "중랑구",
    
    // 경기도 주요 지역
    "suwon": "수원시",
    "yongin": "용인시",
    "seongnam": "성남시",
    "bucheon": "부천시",
    "ansan": "안산시",
    "anyang": "안양시",
    "namyangju": "남양주시",
    "hwaseong": "화성시",
    "pyeongtaek": "평택시",
    "uijeongbu": "의정부시",
    "siheung": "시흥시",
    "gimpo": "김포시",
    "gwangju-si": "광주시", // 경기도 광주시
    "gunpo": "군포시",
    "osan": "오산시",
    "hanam": "하남시",
    "icheon": "이천시",
    "yangju": "양주시",
    
    // 기타 주요 도시들
    "changwon": "창원시",
    "jeonju": "전주시",
    "cheonan": "천안시",
    "pohang": "포항시",
    "mokpo": "목포시",
    "jeju-si": "제주시",
    "seogwipo": "서귀포시",
    
    // 기본값
    "all": "전국",
    "": "전국"
  };

  // 영어 지역명을 한글로 변환하는 함수
  const convertLocationToKorean = (location: string): string => {
    if (!location || location === "all") {
      return "전국";
    }
    
    // 소문자로 변환하여 매핑 확인
    const lowerLocation = location.toLowerCase();
    
    // 정확히 매칭되는 경우
    if (locationMapping[lowerLocation]) {
      return locationMapping[lowerLocation];
    }
    
    // 부분 매칭 시도 (gyeonggi-do → gyeonggi)
    const baseLocation = lowerLocation.replace(/-?(do|si|gun|gu)$/, '');
    if (locationMapping[baseLocation]) {
      return locationMapping[baseLocation];
    }
    
    // 더 유연한 부분 매칭 시도
    for (const [key, value] of Object.entries(locationMapping)) {
      // 입력값이 매핑 키로 시작하는 경우 (예: "gyeonggi-..." → "gyeonggi")
      if (lowerLocation.startsWith(key) && key.length > 2) {
        return value;
      }
      // 매핑 키가 입력값으로 시작하는 경우 (예: "seoul" → "seoul-...")  
      if (key.startsWith(lowerLocation) && lowerLocation.length > 2) {
        return value;
      }
    }
    
    // 특별한 케이스들
    if (lowerLocation.includes("gyeong")) {
      if (lowerLocation.includes("gi")) return "경기도";
      if (lowerLocation.includes("buk")) return "경상북도";
      if (lowerLocation.includes("nam")) return "경상남도";
    }
    
    if (lowerLocation.includes("chung")) {
      if (lowerLocation.includes("buk")) return "충청북도";
      if (lowerLocation.includes("nam")) return "충청남도";
    }
    
    if (lowerLocation.includes("jeon")) {
      if (lowerLocation.includes("buk")) return "전라북도";
      if (lowerLocation.includes("nam")) return "전라남도";
    }
    
    // 광주 특별 처리 (단독으로 오는 경우 광역시로 처리)
    if (lowerLocation === "gwangju" || lowerLocation === "gwangju-city") {
      return "광주시"; // 기본적으로 광역시로 처리
    }
    
    // 제주 특별 처리 
    if (lowerLocation === "jeju" || lowerLocation === "jeju-city") {
      return "제주시"; // 기본적으로 제주시로 처리 (제주도보다는 제주시가 더 구체적)
    }
    
    // 매칭되지 않는 경우 원본 반환 (첫 글자 대문자)
    return location.charAt(0).toUpperCase() + location.slice(1);
  };

  // 타깃정보 생성 함수 (한글 형태)
  const generateTargetInfo = (campaign: RealCampaign) => {
    const criteria = campaign.target_criteria as {
      gender?: string | string[];
      ageGroup?: string | string[];
      location?: {
        city?: string;
        district?: string;
      };
    };

    // 성별 처리
    let gender = criteria?.gender;
    if (Array.isArray(gender)) {
      gender = gender[0];
    }
    if (!gender || gender === "all") {
      gender = "남성";
    }

    // 연령대 처리 (영어 → 한글 변환)
    let ageGroup = criteria?.ageGroup;
    if (Array.isArray(ageGroup)) {
      if (ageGroup.length === 1 && ageGroup[0] === "all") {
        ageGroup = "전체";
              } else {
        // 배열의 각 연령대를 한글로 변환
        const convertedAges = ageGroup
          .filter(age => age !== "all")
          .map(age => convertAgeToKorean(age));
        ageGroup = convertedAges.join(", ");
      }
    } else {
      // 단일 값인 경우 한글로 변환
      ageGroup = convertAgeToKorean(ageGroup || "all");
    }
    
    if (!ageGroup || ageGroup === "all") {
      ageGroup = "전체";
    }

    // 지역 처리 (영어 → 한글 변환)
    const rawCity = criteria?.location?.city || "all";
    const rawDistrict = criteria?.location?.district || "all";
    
    const city = convertLocationToKorean(rawCity);
    const district = convertLocationToKorean(rawDistrict);

    // 성별 한글화
    const genderText = gender === "male" ? "남성" : 
                      gender === "female" ? "여성" : 
                      gender === "all" ? "전체" : gender;

    // 연령대 텍스트 처리 (이미 한글로 변환된 경우 "세" 추가 안함)
    const ageText = ageGroup === "전체" ? "전체" : 
                   ageGroup.includes("대") || ageGroup.includes("층") || ageGroup.includes("인") ? 
                   ageGroup : `${ageGroup}세`;
    
    // 지역 표시 (전국이 아닌 경우에만 구/군 표시)
    const locationText = city === "전국" ? "전국" : 
                        district === "전국" || district === "전체" ? city : `${city} ${district}`;
    
    return `${genderText}, ${ageText}, ${locationText}`;
  };

  // 금액을 한글로 변환하는 함수
  const formatAmountToKorean = (amount: string | number) => {
    if (!amount) return "1만원";
    
    // 문자열에서 숫자만 추출
    const numStr = typeof amount === 'string' ? amount.replace(/[^\d]/g, '') : amount.toString();
    const num = parseInt(numStr);
    
    if (isNaN(num)) return "1만원";
    
    if (num >= 100000000) {
      const eok = Math.floor(num / 100000000);
      const man = Math.floor((num % 100000000) / 10000);
      if (man > 0) {
        return `${eok}억 ${man}만원`;
      }
      return `${eok}억원`;
    } else if (num >= 10000) {
      const man = Math.floor(num / 10000);
      const remainder = num % 10000;
      if (remainder > 0) {
        return `${man}만 ${remainder.toLocaleString()}원`;
      }
      return `${man}만원`;
    } else {
      return `${num.toLocaleString()}원`;
    }
  };

  // 캠페인 관리 필터링 함수
  const getFilteredManagementCampaigns = () => {
    return campaigns.filter(campaign => {
      // 승인상태 필터
      if (managementFilter.approvalStatus !== "all") {
        const status = getApprovalStatusText(campaign.status);
        const filterStatus = getApprovalStatusText(managementFilter.approvalStatus);
        if (status !== filterStatus) return false;
      }
      
      // 검색 필터
      if (managementFilter.searchKeyword && managementFilter.searchKeyword.trim()) {
        const keyword = managementFilter.searchKeyword.toLowerCase().trim();
        
        switch (managementFilter.searchType) {
          case "캠페인 이름":
            return campaign.name.toLowerCase().includes(keyword);
                     case "타깃정보":
             const targetInfo = generateTargetInfo(campaign);
             const criteria = campaign.target_criteria as {
               gender?: string | string[];
               ageGroup?: string | string[];
               location?: {
                 city?: string;
                 district?: string;
               };
             };
             
             // 타깃정보 전체 문자열과 개별 필드들 모두 검색
             // 쉼표와 "세" 제거한 버전도 검색하여 유연성 확보
             const normalizedTargetInfo = targetInfo.replace(/[,세]/g, "").replace(/\s+/g, " ");
             const normalizedKeyword = keyword.replace(/[,세]/g, "").replace(/\s+/g, " ");
             
             // 배열 처리를 위한 헬퍼 함수
             const stringifyField = (field: string | string[] | undefined) => {
               if (!field) return "";
               return Array.isArray(field) ? field.join(" ") : field;
             };
             
             // 지역 검색을 위한 헬퍼 함수 (한글↔영어 양방향 검색)
             const matchesLocation = (locationField: string, searchKeyword: string) => {
               if (!locationField) return false;
               
               // 영어 → 한글 변환된 값으로 검색
               const koreanLocation = convertLocationToKorean(locationField);
               
               // 영어 원본, 한글 변환값 모두 검색
               return locationField.toLowerCase().includes(searchKeyword) ||
                      koreanLocation.toLowerCase().includes(searchKeyword);
             };
             
             // 연령대 검색을 위한 헬퍼 함수 (한글↔영어 양방향 검색)
             const matchesAge = (ageField: string | string[] | undefined, searchKeyword: string) => {
               if (!ageField) return false;
               
               // 배열 처리
               const ageArray = Array.isArray(ageField) ? ageField : [ageField];
               
               return ageArray.some(age => {
                 if (!age) return false;
                 
                 // 영어 → 한글 변환된 값으로 검색
                 const koreanAge = convertAgeToKorean(age);
                 
                 // 영어 원본, 한글 변환값 모두 검색
                 return age.toLowerCase().includes(searchKeyword) ||
                        koreanAge.toLowerCase().includes(searchKeyword);
    });
  };

             return targetInfo.toLowerCase().includes(keyword) ||
                    normalizedTargetInfo.toLowerCase().includes(normalizedKeyword) ||
                    stringifyField(criteria?.gender).toLowerCase().includes(keyword) ||
                    matchesAge(criteria?.ageGroup, keyword) ||
                    matchesLocation(criteria?.location?.city || "", keyword) ||
                    matchesLocation(criteria?.location?.district || "", keyword);
          case "전체":
          default:
            const targetInfoForSearch = generateTargetInfo(campaign);
            const criteriaForSearch = campaign.target_criteria as {
              gender?: string | string[];
              ageGroup?: string | string[];
              location?: {
                city?: string;
                district?: string;
              };
            };
            
            // 타깃정보 정규화 버전도 검색
            const normalizedTargetInfoForSearch = targetInfoForSearch.replace(/[,세]/g, "").replace(/\s+/g, " ");
            const normalizedKeywordForSearch = keyword.replace(/[,세]/g, "").replace(/\s+/g, " ");
            
            // 배열 처리를 위한 헬퍼 함수
            const stringifyFieldForSearch = (field: string | string[] | undefined) => {
              if (!field) return "";
              return Array.isArray(field) ? field.join(" ") : field;
            };
            
            // 지역 검색을 위한 헬퍼 함수 (한글↔영어 양방향 검색)
            const matchesLocationForSearch = (locationField: string, searchKeyword: string) => {
              if (!locationField) return false;
              
              // 영어 → 한글 변환된 값으로 검색
              const koreanLocation = convertLocationToKorean(locationField);
              
              // 영어 원본, 한글 변환값 모두 검색
              return locationField.toLowerCase().includes(searchKeyword) ||
                     koreanLocation.toLowerCase().includes(searchKeyword);
            };
            
            // 연령대 검색을 위한 헬퍼 함수 (한글↔영어 양방향 검색)
            const matchesAgeForSearch = (ageField: string | string[] | undefined, searchKeyword: string) => {
              if (!ageField) return false;
              
              // 배열 처리
              const ageArray = Array.isArray(ageField) ? ageField : [ageField];
              
              return ageArray.some(age => {
                if (!age) return false;
                
                // 영어 → 한글 변환된 값으로 검색
                const koreanAge = convertAgeToKorean(age);
                
                // 영어 원본, 한글 변환값 모두 검색
                return age.toLowerCase().includes(searchKeyword) ||
                       koreanAge.toLowerCase().includes(searchKeyword);
              });
            };
            
            return campaign.name.toLowerCase().includes(keyword) ||
                   targetInfoForSearch.toLowerCase().includes(keyword) ||
                   normalizedTargetInfoForSearch.toLowerCase().includes(normalizedKeywordForSearch) ||
                   stringifyFieldForSearch(criteriaForSearch?.gender).toLowerCase().includes(keyword) ||
                   matchesAgeForSearch(criteriaForSearch?.ageGroup, keyword) ||
                   matchesLocationForSearch(criteriaForSearch?.location?.city || "", keyword) ||
                   matchesLocationForSearch(criteriaForSearch?.location?.district || "", keyword);
        }
      }
      
      return true;
    });
  };

  // 캠페인 토글 함수
  const toggleCampaignStatus = async (campaignId: number) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      const currentActive = isCampaignActive(campaign.status);
      const newStatus = currentActive ? "INACTIVE" : "ACTIVE";
      
      // 임시로 로컬 상태만 업데이트
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === campaignId 
            ? { ...campaign, status: newStatus }
            : campaign
        )
      );
    } catch (error) {
      console.error("캠페인 상태 변경 오류:", error);
    }
  };

  // 체크박스 관련 함수들
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(campaigns.map(campaign => campaign.id));
    } else {
      setSelectedCampaigns([]);
    }
  };

  const handleSelectCampaign = (campaignId: number, checked: boolean) => {
    if (checked) {
      setSelectedCampaigns(prev => [...prev, campaignId]);
    } else {
      setSelectedCampaigns(prev => prev.filter(id => id !== campaignId));
    }
  };

  // 캠페인 삭제 함수
  const handleDeleteCampaigns = async () => {
    if (selectedCampaigns.length === 0) return;
    
    const confirmDelete = window.confirm(
      `선택한 ${selectedCampaigns.length}개의 캠페인을 삭제하시겠습니까?`
    );
    
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 선택된 각 캠페인에 대해 삭제 요청
      const deletePromises = selectedCampaigns.map(campaignId =>
        fetch(`/api/campaigns/${campaignId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(deletePromises);
      const failedDeletes = responses.filter(response => !response.ok);

      if (failedDeletes.length > 0) {
        alert(`${failedDeletes.length}개의 캠페인 삭제에 실패했습니다.`);
        } else {
        alert("선택한 캠페인이 모두 삭제되었습니다.");
      }

      // 성공한 삭제들을 로컬 상태에서 제거
      const succeededDeletes = responses
        .map((response, index) => ({ response, id: selectedCampaigns[index] }))
        .filter(({ response }) => response.ok)
        .map(({ id }) => id);

      setCampaigns(prev => 
        prev.filter(campaign => !succeededDeletes.includes(campaign.id))
      );
      setSelectedCampaigns([]);

    } catch (error) {
      console.error("캠페인 삭제 오류:", error);
      alert("캠페인 삭제 중 오류가 발생했습니다.");
    }
  };

  // 캠페인 이름 수정 함수들
  const startEditingCampaignName = (campaignId: number, currentName: string) => {
    setEditingCampaignId(campaignId);
    setEditingCampaignName(currentName);
  };

  const cancelEditingCampaignName = () => {
    setEditingCampaignId(null);
    setEditingCampaignName("");
  };

  const saveEditingCampaignName = async (campaignId: number) => {
    if (!editingCampaignName.trim()) {
      alert("캠페인 이름을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingCampaignName.trim()
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, name: editingCampaignName.trim() }
              : campaign
          )
        );
        setEditingCampaignId(null);
        setEditingCampaignName("");
        alert("캠페인 이름이 수정되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "캠페인 이름 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("캠페인 이름 수정 오류:", error);
      alert("캠페인 이름 수정 중 오류가 발생했습니다.");
    }
  };

  // 승인 상태 텍스트 변환
  const getApprovalStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
      case "승인대기":
        return "승인대기";
      case "approved":
      case "승인완료":
        return "승인완료";
      case "rejected":
      case "반려":
        return "반려";
      case "reviewing":
      case "승인중":
        return "승인중";
      case "registered":
      case "등록":
        return "등록";
      default:
        return "등록";
    }
  };

  // 승인 상태별 관리 버튼 렌더링
  const renderManagementButtons = (campaign: RealCampaign) => {
    const status = getApprovalStatusText(campaign.status);
    
    switch (status) {
      case "등록":
        return (
          <>
            <button className="mgmt-btn edit-btn" onClick={() => console.log("수정", campaign.id)}>
              수정
            </button>
            <button className="mgmt-btn request-btn" onClick={() => console.log("승인요청", campaign.id)}>
              승인요청
            </button>
          </>
        );
      case "승인중":
        return (
          <button className="mgmt-btn cancel-btn" onClick={() => console.log("승인 요청 취소", campaign.id)}>
            승인 요청 취소
          </button>
        );
      case "반려":
        return (
          <button className="mgmt-btn result-btn" onClick={() => console.log("반려 결과보기", campaign.id)}>
            반려 결과보기
          </button>
        );
      case "승인대기":
        return (
          <button className="mgmt-btn estimate-btn" onClick={() => console.log("캠페인 추정", campaign.id)}>
            캠페인 추정
          </button>
        );
      default:
        return null;
    }
  };

  // 캠페인 관리 탭 콘텐츠
  const renderCampaignManagementTab = () => {
    const filteredCampaigns = getFilteredCampaigns();
    const filteredManagementCampaigns = getFilteredManagementCampaigns();

    return (
      <div className="campaign-management-container">
        {/* 캠페인현황/캠페인관리 탭 버튼 */}
        <div className="campaign-management-tabs">
          <button 
            className={`campaign-tab ${campaignManagementTab === "overview" ? "active" : ""}`}
            onClick={() => setCampaignManagementTab("overview")}
          >
            캠페인현황
          </button>
          <button 
            className={`campaign-tab ${campaignManagementTab === "management" ? "active" : ""}`}
            onClick={() => setCampaignManagementTab("management")}
          >
            캠페인관리
          </button>
      </div>

        {/* 캠페인현황 탭 */}
        {campaignManagementTab === "overview" && (
          <>
            {/* 필터 섹션 */}
            <div className="campaign-filters">
              {/* 캠페인사용여부 */}
              <div className="filter-group">
                <select 
                  value={campaignFilter.isActive}
                  onChange={(e) => setCampaignFilter(prev => ({ ...prev, isActive: e.target.value }))}
                  className="filter-select"
                >
                  <option value="all">캠페인사용여부</option>
                  <option value="on">ON</option>
                  <option value="off">OFF</option>
                </select>
      </div>

              {/* 기간 */}
              <div className="filter-group">
                <select 
                  value={campaignFilter.period}
                  onChange={(e) => setCampaignFilter(prev => ({ ...prev, period: e.target.value }))}
                  className="filter-select"
                >
                  <option value="전체기간">최근 기간</option>
                  <option value="최근 1주일">최근 1주일</option>
                  <option value="최근 1개월">최근 1개월</option>
                  <option value="최근 3개월">최근 3개월</option>
                </select>
          </div>

              {/* 검색항목 */}
              <div className="filter-group">
                <select 
                  value={campaignFilter.searchType}
                  onChange={(e) => setCampaignFilter(prev => ({ ...prev, searchType: e.target.value }))}
                  className="filter-select"
                >
                  <option value="전체">검색항목</option>
                  <option value="캠페인 이름">캠페인 이름</option>
                  <option value="발송정책">발송정책</option>
                </select>
              </div>

              {/* 검색창 */}
              <div className="filter-group search-group">
                <input
                  type="text"
                  placeholder="정보 검색"
                  value={campaignFilter.searchKeyword}
                  onChange={(e) => setCampaignFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
                  className="search-input"
                />
                <button className="search-button">
                  🔍
              </button>
              </div>
          </div>

            {/* 테이블 */}
            <div className="campaign-table-container">
              <table className="campaign-table">
                <thead>
                  <tr>
                    <th>사용여부</th>
                    <th>캠페인 이름</th>
                    <th>캠페인 비용(건)</th>
                    <th>발송정책</th>
                    <th>유효기간</th>
                    <th>일 최대 건수</th>
                    <th>광고 수신자 수</th>
                    <th>캠페인 총 비용</th>
                    <th>발송 성공 수</th>
                    <th>반응율</th>
                    <th>생성일</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCampaigns ? (
                    <tr>
                      <td colSpan={11} className="loading-cell">
                        <div className="loading-spinner"></div>
                        캠페인 데이터를 불러오는 중...
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map(campaign => {
                      const isActive = isCampaignActive(campaign.status);
                      const sendPolicy = getSendPolicy(campaign);
                      const validPeriod = getValidPeriod(campaign);
                      const criteria = campaign.target_criteria as {
                        costPerItem?: number;
                        dailyMaxCount?: number;
                      };

                      return (
                        <tr key={campaign.id}>
                          <td>
                            <button
                              className={`status-toggle ${isActive ? "on" : "off"}`}
                              onClick={() => toggleCampaignStatus(campaign.id)}
                            >
                            </button>
                          </td>
                                                     <td className="campaign-name">{campaign.name}</td>
                           <td>{formatAmountToKorean(criteria?.costPerItem || 100)}</td>
                           <td>{sendPolicy}</td>
                          <td>{validPeriod || "-"}</td>
                          <td>{criteria?.dailyMaxCount ? `${criteria.dailyMaxCount}건` : "-"}</td>
                          <td>{campaign.total_recipients ? `${campaign.total_recipients.toLocaleString()}명` : "-"}</td>
                          <td>{formatAmountToKorean(campaign.actual_cost || campaign.budget || 0)}</td>
                          <td>
                            {sendPolicy === "실시간 발송"
                              ? `${campaign.sent_count}건`
                              : `${campaign.sent_count}명`}
                          </td>
                          <td className="response-rate">
                            {campaign.success_count}성공 {campaign.failed_count}실패
                          </td>
                          <td>{new Date(campaign.created_at).toLocaleDateString("ko-KR")}</td>
                        </tr>
                      );
                    })
                  )}
                  {!isLoadingCampaigns && filteredCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={11} className="no-campaigns">
                        조건에 맞는 캠페인이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
              </>
            )}

        {/* 캠페인관리 탭 */}
        {campaignManagementTab === "management" && (
          <>
            {/* 관리 필터 섹션 */}
            <div className="campaign-filters">
              {/* 승인상태로 검색 */}
              <div className="filter-group">
                <select 
                  value={managementFilter.approvalStatus}
                  onChange={(e) => setManagementFilter(prev => ({ ...prev, approvalStatus: e.target.value }))}
                  className="filter-select"
                >
                  <option value="all">승인상태</option>
                  <option value="registered">등록</option>
                  <option value="reviewing">승인중</option>
                  <option value="pending">승인대기</option>
                  <option value="approved">승인완료</option>
                  <option value="rejected">반려</option>
                </select>
        </div>

              {/* 검색항목 */}
              <div className="filter-group">
                <select 
                  value={managementFilter.searchType}
                  onChange={(e) => setManagementFilter(prev => ({ ...prev, searchType: e.target.value }))}
                  className="filter-select"
                >
                  <option value="전체">검색항목</option>
                  <option value="캠페인 이름">캠페인 이름</option>
                  <option value="타깃정보">타깃정보</option>
                </select>
              </div>

              {/* 검색창 */}
              <div className="filter-group search-group">
                    <input
                      type="text"
                  placeholder="정보 검색"
                  value={managementFilter.searchKeyword}
                  onChange={(e) => setManagementFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
                  className="search-input"
                />
                <button className="search-button">
                  🔍
                </button>
                  </div>

                             {/* 캠페인 만들기 버튼 */}
               <div className="filter-group">
                 <button 
                   className="create-campaign-btn"
                   onClick={() => handleTabChange("naver-talktalk")}
                 >
                   캠페인 만들기
                 </button>
                  </div>

              {/* 캠페인 삭제 버튼 */}
              <div className="filter-group">
                <button 
                  className="delete-campaign-btn"
                  disabled={selectedCampaigns.length === 0}
                  onClick={handleDeleteCampaigns}
                >
                  캠페인 삭제
                </button>
              </div>
                  </div>

            {/* 관리 테이블 */}
            <div className="campaign-table-container">
              <table className="campaign-table management-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={selectedCampaigns.length === filteredManagementCampaigns.length && filteredManagementCampaigns.length > 0}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </th>
                    <th>캠페인 이름</th>
                    <th>타깃정보</th>
                    <th>카드사용업종</th>
                    <th>카드 승인 금액</th>
                    <th>카드 승인 시간</th>
                    <th>승인상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingCampaigns ? (
                    <tr>
                      <td colSpan={8} className="loading-cell">
                        <div className="loading-spinner"></div>
                        캠페인 데이터를 불러오는 중...
                      </td>
                    </tr>
                  ) : (
                    filteredManagementCampaigns.map(campaign => {
                      const approvalStatus = getApprovalStatusText(campaign.status);
                      const criteria = campaign.target_criteria as {
                        costPerItem?: number;
                        cardUsageIndustry?: string;
                        cardAmount?: string;
                        cardTime?: {
                          startTime?: string;
                          endTime?: string;
                          period?: string;
                        };
                      };

                      return (
                                                <tr key={campaign.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedCampaigns.includes(campaign.id)}
                              onChange={(e) => handleSelectCampaign(campaign.id, e.target.checked)}
                            />
                          </td>
                          <td className="campaign-name">
                            {editingCampaignId === campaign.id ? (
                              <div className="campaign-name-edit">
                                <input
                                  type="text"
                                  value={editingCampaignName}
                                  onChange={(e) => setEditingCampaignName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      saveEditingCampaignName(campaign.id);
                                    } else if (e.key === "Escape") {
                                      cancelEditingCampaignName();
                                    }
                                  }}
                                  className="campaign-name-input"
                                  autoFocus
                                />
                                <div className="campaign-name-actions">
                            <button
                                    onClick={() => saveEditingCampaignName(campaign.id)}
                                    className="save-btn"
                                    title="저장"
                                  >
                                    ✓
                            </button>
                            <button
                                    onClick={cancelEditingCampaignName}
                                    className="cancel-btn"
                                    title="취소"
                                  >
                                    ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                              <div className="campaign-name-display">
                                <span>{campaign.name}</span>
                          <button
                                  onClick={() => startEditingCampaignName(campaign.id, campaign.name)}
                                  className="edit-name-btn"
                                  title="이름 수정"
                                >
                                  ✏️
                          </button>
                        </div>
                      )}
                          </td>
                          <td>{generateTargetInfo(campaign)}</td>
                           <td>{criteria?.cardUsageIndustry || "여행"}</td>
                           <td>{formatAmountToKorean(criteria?.cardAmount || "10000")}</td>
                           <td>{criteria?.cardTime ? `${criteria.cardTime.startTime || "8:00"}~${criteria.cardTime.endTime || "12:00"}` : "8:00~12:00"}</td>
                          <td>
                            <span className={`approval-status status-${approvalStatus}`}>
                              {approvalStatus}
                            </span>
                          </td>
                          <td>
                            <div className="mgmt-buttons">
                              {renderManagementButtons(campaign)}
                    </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                  {!isLoadingCampaigns && filteredManagementCampaigns.length === 0 && (
                    <tr>
                      <td colSpan={8} className="no-campaigns">
                        조건에 맞는 캠페인이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
                  </div>
          </>
        )}
                </div>
  );
  };

  // 템플릿 관리 탭 콘텐츠
  const renderTemplateManagementTab = () => (
    <div className="tab-content-placeholder">
      <div className="placeholder-content">
        <h2>템플릿 관리</h2>
        <p>템플릿 관리 기능이 여기에 구현됩니다.</p>
              </div>
    </div>
  );

  return (
    <div className="target-marketing-page">
      <div className="page-header">
        <h1>AI 타깃 마케팅</h1>
          </div>

          <div className="tab-navigation">
            {tabs.map((tab) => (
                <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => handleTabChange(tab.id)}
                >
                {tab.label}
                </button>
            ))}
              </div>

          <div className="tab-content">
        {currentView === "detail" && activeTab === "naver-talktalk" ? (
              <TargetMarketingDetail {...detailProps} />
            ) : (
              <>
                {activeTab === "naver-talktalk" && (
                  <NaverTalkTalkTab
                    onNavigateToDetail={handleNavigateToDetail}
                  />
                )}
                {activeTab === "campaign-management" &&
                  renderCampaignManagementTab()}
                {activeTab === "template-management" &&
                  renderTemplateManagementTab()}
              </>
        )}
      </div>
        </div>
  );
}

export default function TargetMarketingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TargetMarketingPageContent />
    </Suspense>
  );
}
