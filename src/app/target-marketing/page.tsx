"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import TargetMarketingDetail from "@/components/TargetMarketingDetail";
import NaverTalkTalkTab from "@/components/NaverTalkTalkTab";
import { AdvertiserGuardWithDisabled } from "@/components/RoleGuard";

import { useAuth } from "@/contexts/AuthContext";
import { useBalance } from "@/contexts/BalanceContext";
import { targetOptions, getDistrictsByCity } from "@/lib/targetOptions";
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

// 템플릿 데이터 인터페이스
interface Template {
  id: number;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
  status?: string;
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
  const { refreshTransactions } = useBalance();



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

  // 템플릿 관리 탭 상태
  const [templateFilter, setTemplateFilter] = useState({
    period: "전체기간",
    searchKeyword: ""
  });
  const [selectedTemplates, setSelectedTemplates] = useState<number[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");

  // 템플릿 수정 모달 상태
  const [isTemplateEditModalOpen, setIsTemplateEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editTemplateTitle, setEditTemplateTitle] = useState("");
  const [editTemplateContent, setEditTemplateContent] = useState("");
  const [editTemplateImage, setEditTemplateImage] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  const [isImageUploading, setIsImageUploading] = useState(false);
  const [dynamicButtons, setDynamicButtons] = useState<Array<{
    id: string;
    text: string;
    linkType: 'web' | 'app';
    url?: string;
    iosUrl?: string;
    androidUrl?: string;
  }>>([]);
  
  // 캠페인 이름 수정 관련 상태
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [editingCampaignName, setEditingCampaignName] = useState("");

  // 캠페인 수정 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<RealCampaign | null>(null);
  const [editModalEntrySource, setEditModalEntrySource] = useState<"direct" | "from_rejection">("direct");
  const [editFormData, setEditFormData] = useState({
    gender: "",
    age: "",
    location_city: "",
    location_district: "",
    business_type: "",
    min_amount: "",
    max_amount: "",
    amount_period: "1만원 미만",
    start_time: "8:00",
    end_time: "12:00",
    time_period: "오전"
  });

  // 반려사유 모달 상태
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionData, setRejectionData] = useState<{
    rejection_reason: string;
    rejection_details: string;
    suggested_modifications: {
      items: string[];
      message: string;
    };
    admin_user: {
      name: string;
      email: string;
    };
    created_at: string;
  } | null>(null);

  // 디버깅: editFormData 변경사항 추적
  useEffect(() => {
    if (isEditModalOpen) {      
      // 데이터 무결성 검증
      const validationErrors = [];
      
      if (!editFormData.gender) validationErrors.push("성별 미선택");
      if (!editFormData.age) validationErrors.push("연령대 미선택");
      if (!editFormData.business_type) validationErrors.push("업종 미선택");
      if (!editFormData.amount_period) validationErrors.push("금액 기간 미선택");
      if (!editFormData.time_period) validationErrors.push("시간대 미선택");
      
      if (validationErrors.length > 0) {
        console.warn("데이터 검증 경고:", validationErrors);
      }
    }
  }, [editFormData, isEditModalOpen]);

  // 시간 변경 시 자동으로 time_period 업데이트
  useEffect(() => {
    if (isEditModalOpen && editFormData.start_time && editFormData.end_time) {
      const start = parseInt(editFormData.start_time.split(':')[0]);
      const end = parseInt(editFormData.end_time.split(':')[0]);
      
      let detectedPeriod = "전체";
      
      // 오전: 08:00-12:00
      if (start === 8 && end === 12) {
        detectedPeriod = "오전";
      }
      // 오후: 12:00-18:00
      else if (start === 12 && end === 18) {
        detectedPeriod = "오후";
      }
      // 전체: 00:00-23:00
      else if (start === 0 && end === 23) {
        detectedPeriod = "전체";
      }
      
      // time_period가 변경되었을 때만 업데이트 (무한 루프 방지)
      if (editFormData.time_period !== detectedPeriod) {
        setEditFormData(prev => ({...prev, time_period: detectedPeriod}));
      }
    }
  }, [editFormData.start_time, editFormData.end_time, isEditModalOpen, editFormData.time_period]);

  // 금액 변경 시 자동으로 amount_period 업데이트
  useEffect(() => {
    if (isEditModalOpen) {
      let detectedPeriod = "전체";
      
      if (editFormData.max_amount && editFormData.max_amount !== "") {
        const maxAmount = parseInt(editFormData.max_amount);
        
        if (maxAmount === 10000) {
          detectedPeriod = "1만원 미만";
        } else if (maxAmount === 50000) {
          detectedPeriod = "5만원 미만";
        } else if (maxAmount === 100000) {
          detectedPeriod = "10만원 미만";
        }
      }
      
      // amount_period가 변경되었을 때만 업데이트 (무한 루프 방지)
      if (editFormData.amount_period !== detectedPeriod) {
        setEditFormData(prev => ({...prev, amount_period: detectedPeriod}));
      }
    }
  }, [editFormData.max_amount, isEditModalOpen, editFormData.amount_period]);

  // 선택된 도시에 따른 구/군 옵션
  const getDistrictOptions = () => {
    if (!editFormData.location_city || editFormData.location_city === "") {
      return [{ value: "", label: "구/군" }];
    }
    
    const districts = getDistrictsByCity(editFormData.location_city);
    return [{ value: "", label: "구/군" }, ...districts];
  };

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

      // 캠페인 삭제 성공 시 크레딧 잔액 새로고침 (예약금 해제로 인한 잔액 변동 반영)
      if (succeededDeletes.length > 0) {
        try {
          await refreshTransactions();
        } catch (error) {
          console.error("크레딧 잔액 새로고침 오류:", error);
          // 잔액 새로고침 실패는 사용자에게 알리지 않음 (삭제는 성공했으므로)
        }
      }

    } catch (error) {
      console.error("캠페인 삭제 오류:", error);
      alert("캠페인 삭제 중 오류가 발생했습니다.");
    }
  };

  // 승인 요청 함수
  const handleRequestApproval = async (campaignId: number) => {
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
          requestApproval: true
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, status: "PENDING_APPROVAL" }
              : campaign
          )
        );
        alert("승인 요청이 성공적으로 처리되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "승인 요청에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 요청 오류:", error);
      alert("승인 요청 중 오류가 발생했습니다.");
    }
  };

  // 데이터 타입 안전성을 위한 유틸리티 함수들
  const extractStringValue = (obj: Record<string, unknown>, keys: string[]): string => {
    for (const key of keys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = key.includes('.') ? key.split('.').reduce((o, k) => (o as any)?.[k], obj) : obj[key];
      if (value && typeof value === 'string') return value;
    }
    return "";
  };

  const extractNumberValue = (obj: Record<string, unknown>, keys: string[]): number => {
    for (const key of keys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = key.includes('.') ? key.split('.').reduce((o, k) => (o as any)?.[k], obj) : obj[key];
      if (value !== undefined && value !== null && value !== "") {
        const num = typeof value === 'number' ? value : parseInt(value.toString());
        if (!isNaN(num)) return num;
      }
    }
    return 0;
  };

  const extractArrayValue = (obj: Record<string, unknown>, keys: string[]): string[] => {
    for (const key of keys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const value = key.includes('.') ? key.split('.').reduce((o, k) => (o as any)?.[k], obj) : obj[key];
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'string') return [value];
    }
    return [];
  };

  // 캠페인 수정 모달 열기
  const openEditModal = (campaign: RealCampaign, entrySource: "direct" | "from_rejection" = "direct") => {
    setEditingCampaign(campaign);
    setEditModalEntrySource(entrySource);
    
    // 기존 캠페인 데이터로 폼 초기화
    const criteria = campaign.target_criteria || {};

    
    // 빈 객체 또는 null 체크
    if (!criteria || Object.keys(criteria).length === 0) {
      console.warn("⚠️ target_criteria가 비어있거나 존재하지 않습니다!");
      console.warn("기본값으로 초기화됩니다.");
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const criteriaAny = criteria as any;
    
    // === 1. 업종 정보 추출 ===
    const businessTypeKeys = [
      'industry.topLevel', 'business_type', 'topLevelIndustry', 'targetTopLevelIndustry',
      'cardUsageIndustry', 'industry_topLevel', 'industryTopLevel'
    ];
    let businessType = extractStringValue(criteriaAny, businessTypeKeys);
    
    // 특수값 처리
    if (!businessType || businessType === "all" || businessType === "전체" || businessType === "0") {
      businessType = "";
    }

    // === 2. 성별 정보 추출 ===
    const genderKeys = ['gender', 'targetGender'];
    let genderValue = extractStringValue(criteriaAny, genderKeys);
    
    // 성별 매핑
    const genderMapping: { [key: string]: string } = {
      "여성": "female", "woman": "female", "female": "female",
      "남성": "male", "man": "male", "male": "male",
      "전체": "all", "all": "all", "both": "all"
    };
    genderValue = genderMapping[genderValue] || genderValue || "all";

    // === 3. 연령 정보 추출 ===
    const ageKeys = ['ageGroup', 'age', 'targetAge', 'ageGroups'];
    const ageArray = extractArrayValue(criteriaAny, ageKeys);
    let ageValue = ageArray.length > 0 ? ageArray[0] : "";
    
    // 연령 매핑 (한글 → 영어)
    const ageMapping: { [key: string]: string } = {
      "10대": "teens", "teens": "teens",
      "20대": "twenties", "twenties": "twenties", 
      "30대": "thirties", "thirties": "thirties",
      "40대": "forties", "forties": "forties",
      "50대+": "fifties", "fifties": "fifties", "50대": "fifties",
      "전체": "all", "all": "all"
    };
    ageValue = ageMapping[ageValue] || ageValue || "all";

    // === 4. 지역 정보 추출 ===
    const cityKeys = ['location.city', 'city', 'targetCity'];
    const districtKeys = ['location.district', 'district', 'targetDistrict'];
    
    let cityValue = extractStringValue(criteriaAny, cityKeys);
    const districtValue = extractStringValue(criteriaAny, districtKeys);
    
    // 도시 매핑 (한글 → 영어)
    const cityMapping: { [key: string]: string } = {
      "서울특별시": "seoul", "서울": "seoul", "seoul": "seoul",
      "부산광역시": "busan", "부산": "busan", "busan": "busan",
      "대구광역시": "daegu", "대구": "daegu", "daegu": "daegu",
      "인천광역시": "incheon", "인천": "incheon", "incheon": "incheon",
      "광주광역시": "gwangju", "광주": "gwangju", "gwangju": "gwangju",
      "대전광역시": "daejeon", "대전": "daejeon", "daejeon": "daejeon",
      "울산광역시": "ulsan", "울산": "ulsan", "ulsan": "ulsan",
      "세종특별자치시": "sejong", "세종": "sejong", "sejong": "sejong",
      "경기도": "gyeonggi", "경기": "gyeonggi", "gyeonggi": "gyeonggi",
      "강원특별자치도": "gangwon", "강원도": "gangwon", "강원": "gangwon", "gangwon": "gangwon",
      "충청북도": "chungbuk", "충북": "chungbuk", "chungbuk": "chungbuk",
      "충청남도": "chungnam", "충남": "chungnam", "chungnam": "chungnam",
      "전라북도": "jeonbuk", "전북": "jeonbuk", "jeonbuk": "jeonbuk",
      "전라남도": "jeonnam", "전남": "jeonnam", "jeonnam": "jeonnam",
      "경상북도": "gyeongbuk", "경북": "gyeongbuk", "gyeongbuk": "gyeongbuk",
      "경상남도": "gyeongnam", "경남": "gyeongnam", "gyeongnam": "gyeongnam",
      "제주특별자치도": "jeju", "제주도": "jeju", "제주": "jeju", "jeju": "jeju"
    };
    
    cityValue = cityMapping[cityValue] || cityValue || "";

    // === 5. 금액 정보 추출 ===
    const maxAmountKeys = ['max_amount', 'maxAmount', 'cardAmount.max', 'amount.max'];
    const amountPeriodKeys = ['amount_period', 'amountPeriod', 'cardAmountPeriod', 'period'];
    
    const maxAmount = extractNumberValue(criteriaAny, maxAmountKeys);
    let amountPeriod = extractStringValue(criteriaAny, amountPeriodKeys);
    
    // 금액 기간 매핑 (일자 기반 → 금액 기반)
    const periodMapping: { [key: string]: string } = {
      "1일": "1만원 미만", "1일 이내": "1만원 미만",
      "5일": "5만원 미만", "5일 이내": "5만원 미만", 
      "10일": "10만원 미만", "10일 이내": "10만원 미만",
      "전체": "전체", "all": "전체"
    };
    
    // 금액값으로부터 자동 감지
    if (!amountPeriod && maxAmount > 0) {
      if (maxAmount <= 10000) amountPeriod = "1만원 미만";
      else if (maxAmount <= 50000) amountPeriod = "5만원 미만";
      else if (maxAmount <= 100000) amountPeriod = "10만원 미만";
      else amountPeriod = "전체";
    }
    
    amountPeriod = periodMapping[amountPeriod] || amountPeriod || "1만원 미만";

    // === 6. 시간 정보 추출 ===
    const startTimeKeys = ['cardTime.startTime', 'start_time', 'startTime', 'timeStart'];
    const endTimeKeys = ['cardTime.endTime', 'end_time', 'endTime', 'timeEnd'];
    const timePeriodKeys = ['time_period', 'timePeriod', 'cardTime.period', 'period'];
    
    let startTime = extractStringValue(criteriaAny, startTimeKeys) || "08:00";
    let endTime = extractStringValue(criteriaAny, endTimeKeys) || "12:00";
    let timePeriod = extractStringValue(criteriaAny, timePeriodKeys);
    
    // 시간 형식 정규화 (HH:MM)
    const normalizeTime = (time: string): string => {
      if (!time) return "08:00";
      if (time.includes(':')) return time;
      if (time.length === 1 || time.length === 2) return `${time.padStart(2, '0')}:00`;
      return "08:00";
    };
    
    startTime = normalizeTime(startTime);
    endTime = normalizeTime(endTime);
    
    // 시간대 자동 감지
    if (!timePeriod) {
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      
      if (startHour === 8 && endHour === 12) timePeriod = "오전";
      else if (startHour === 12 && endHour === 18) timePeriod = "오후";
      else if (startHour === 0 && endHour === 23) timePeriod = "전체";
      else timePeriod = "오전";
    }
    

    // === 최종 폼 데이터 설정 ===
    const finalFormData = {
      gender: genderValue,
      age: ageValue,
      location_city: cityValue,
      location_district: districtValue,
      business_type: businessType,
      min_amount: "0", // UI에서 입력 불가하므로 항상 "0"
      max_amount: maxAmount > 0 ? maxAmount.toString() : "",
      amount_period: amountPeriod,
      start_time: startTime,
      end_time: endTime,
      time_period: timePeriod
    };
    
   
    
    setEditFormData(finalFormData);
    setIsEditModalOpen(true);
  };

  // 캠페인 수정 모달 닫기
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCampaign(null);
    setEditModalEntrySource("direct");
    setEditFormData({
      gender: "",
      age: "",
      location_city: "",
      location_district: "",
      business_type: "",
      min_amount: "0", // UI에서 입력 불가하므로 항상 "0"
      max_amount: "",
      amount_period: "1만원 미만",
      start_time: "8:00",
      end_time: "12:00",
      time_period: "오전"
    });
  };

  // 반려사유 조회
  const handleViewRejection = async (campaign: RealCampaign) => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/rejection`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRejectionData(data.rejection);
        setIsRejectionModalOpen(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "반려사유 조회에 실패했습니다.");
      }
    } catch (error) {
      console.error("반려사유 조회 오류:", error);
      alert("반려사유 조회 중 오류가 발생했습니다.");
    }
  };

  // 반려사유 모달 닫기
  const closeRejectionModal = () => {
    setIsRejectionModalOpen(false);
    setRejectionData(null);
  };

  // 반려사유 모달에서 수정 버튼 클릭
  const handleEditFromRejection = () => {
    if (rejectionData && editingCampaign) {
      closeRejectionModal();
      openEditModal(editingCampaign, "from_rejection");
    }
  };

  // 캠페인 수정 저장
  const handleSaveEdit = async (requestApprovalAfterEdit = false) => {
    if (!editingCampaign) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 호환성을 고려한 완전한 데이터 구조 생성
      const newTargetCriteria = {
        // === 성별 정보 ===
        gender: editFormData.gender,
        
        // === 연령 정보 (다양한 형태로 저장) ===
        ageGroup: editFormData.age ? [editFormData.age] : ["all"],
        age: editFormData.age || "all",
        
        // === 지역 정보 (중첩 및 플랫 구조 모두 지원) ===
        location: {
          city: editFormData.location_city,
          district: editFormData.location_district
        },
        city: editFormData.location_city,
        district: editFormData.location_district,
        
        // === 업종 정보 (다양한 형태로 저장) ===
        industry: {
          topLevel: editFormData.business_type || "all",
          specific: "all"
        },
        business_type: editFormData.business_type || "all",
        topLevelIndustry: editFormData.business_type || "all",
        
        // === 금액 정보 ===
        min_amount: 0, // 항상 0으로 설정 (UI에서 입력 불가)
        max_amount: parseInt(editFormData.max_amount) || 0,
        amount_period: editFormData.amount_period,
        
        // === 시간 정보 (중첩 및 플랫 구조 모두 지원) ===
        cardTime: {
          startTime: editFormData.start_time,
          endTime: editFormData.end_time,
          period: editFormData.time_period
        },
        start_time: editFormData.start_time,
        end_time: editFormData.end_time,
        time_period: editFormData.time_period,
        
        // === 메타데이터 ===
        updated_at: new Date().toISOString(),
        data_version: "2.0" // 데이터 구조 버전
      };
      
    
      const response = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          updateTargetCriteria: true,
          target_criteria: newTargetCriteria
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === editingCampaign.id
              ? {
                  ...campaign,
                  target_criteria: newTargetCriteria
                }
              : campaign
          )
        );
        
        // 수정 후 승인요청 처리
        if (requestApprovalAfterEdit) {
          try {
           
            
            const approvalResponse = await fetch(`/api/campaigns/${editingCampaign.id}`, {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                requestApproval: true
              }),
            });

           
            
            if (approvalResponse.ok) {
              await approvalResponse.json();
      
              
              // 상태를 PENDING_APPROVAL로 업데이트
              setCampaigns(prev =>
                prev.map(campaign =>
                  campaign.id === editingCampaign.id
                    ? {
                        ...campaign,
                        status: "PENDING_APPROVAL" as const,
                        rejection_reason: undefined // 반려 사유 제거
                      }
                    : campaign
                )
              );
              alert("캠페인이 수정되고 승인 요청이 완료되었습니다.");
            } else {
              const errorData = await approvalResponse.json().catch(() => ({}));
              console.error("승인 요청 실패:", errorData);
              alert("캠페인은 수정되었지만 승인 요청에 실패했습니다: " + (errorData.message || "알 수 없는 오류"));
            }
          } catch (approvalError) {
            console.error("승인 요청 오류:", approvalError);
            alert("캠페인은 수정되었지만 승인 요청 중 오류가 발생했습니다.");
          }
        } else {
          alert("캠페인이 성공적으로 수정되었습니다.");
        }
        
        closeEditModal();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "캠페인 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("캠페인 수정 오류:", error);
      alert("캠페인 수정 중 오류가 발생했습니다.");
    }
  };

  // 승인 요청 취소 함수
  const handleCancelApprovalRequest = async (campaignId: number) => {
    const confirmCancel = window.confirm("승인 요청을 취소하시겠습니까?");
    if (!confirmCancel) return;

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
          cancelApprovalRequest: true
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setCampaigns(prev =>
          prev.map(campaign =>
            campaign.id === campaignId
              ? { ...campaign, status: "DRAFT" }
              : campaign
          )
        );
        alert("승인 요청이 성공적으로 취소되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.message || "승인 요청 취소에 실패했습니다.");
      }
    } catch (error) {
      console.error("승인 요청 취소 오류:", error);
      alert("승인 요청 취소 중 오류가 발생했습니다.");
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
      case "draft":
      case "임시저장":
        return "등록";
      case "pending_approval":
      case "승인대기":
        return "승인중";
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
            <button className="mgmt-btn edit-btn" onClick={() => openEditModal(campaign)}>
              수정
            </button>
            <button className="mgmt-btn request-btn" onClick={() => handleRequestApproval(campaign.id)}>
              승인요청
            </button>
          </>
        );
      case "승인중":
        return (
          <>
            <button className="mgmt-btn cancel-btn" onClick={() => handleCancelApprovalRequest(campaign.id)}>
              승인 요청 취소
            </button>
            <button className="mgmt-btn edit-btn" onClick={() => openEditModal(campaign)}>
              수정
            </button>
          </>
        );
      case "반려":
        return (
          <button
            className="mgmt-btn result-btn"
            onClick={() => {
              setEditingCampaign(campaign);
              handleViewRejection(campaign);
            }}
          >
            반려 결과 보기
          </button>
        );
      case "승인완료":
        return null; // 버튼 없음
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
                                    저장
                            </button>
                            <button
                                    onClick={cancelEditingCampaignName}
                                    className="cancel-btn"
                                    title="취소"
                                  >
                                    취소
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
                                  수정
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

    // 템플릿 관리 함수들
  const loadTemplates = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingTemplates(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("토큰이 없습니다.");
        return;
      }

      // 사용자의 템플릿 데이터 로드 (커스텀 카테고리)
      const response = await fetch("/api/templates?category=커스텀", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        // API 응답을 Template 인터페이스에 맞게 변환
        const formattedTemplates = (data.templates || []).map((template: {
          id: number;
          name: string;
          category?: string;
          created_at: string;
          updated_at: string;
          is_active?: boolean;
        }) => ({
          id: template.id,
          name: template.name,
          code: template.category || "결합메시지-1",  // API에서 category를 code로 사용
          created_at: template.created_at,
          updated_at: template.updated_at,
          status: template.is_active ? "활성" : "비활성"
        }));
        setTemplates(formattedTemplates);
      } else {
        console.error("템플릿 데이터 로드 실패:", response.statusText);
        // 빈 배열로 설정 (사용자 템플릿이 없을 수 있음)
        setTemplates([]);
      }
    } catch (error) {
      console.error("템플릿 데이터 로드 오류:", error);
      // 오류 발생 시 빈 배열로 설정
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, [user]);

  // 템플릿 필터링 함수
  const getFilteredTemplates = () => {
    return templates.filter(template => {
      // 기간 필터
      if (templateFilter.period !== "전체기간") {
        const now = new Date();
        const createdDate = new Date(template.created_at);
        
        switch (templateFilter.period) {
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
      if (templateFilter.searchKeyword && templateFilter.searchKeyword.trim()) {
        const keyword = templateFilter.searchKeyword.toLowerCase().trim();
        
        return template.name.toLowerCase().includes(keyword) ||
               template.id.toString().includes(keyword);
      }
      
      return true;
    });
  };

  // 템플릿 선택 관련 함수들
  const handleSelectAllTemplates = (checked: boolean) => {
    if (checked) {
      setSelectedTemplates(templates.map(template => template.id));
    } else {
      setSelectedTemplates([]);
    }
  };

  const handleSelectTemplate = (templateId: number, checked: boolean) => {
    if (checked) {
      setSelectedTemplates(prev => [...prev, templateId]);
    } else {
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    }
  };

  // 템플릿 삭제 함수
  const handleDeleteTemplates = async () => {
    if (selectedTemplates.length === 0) return;
    
    const confirmDelete = window.confirm(
      `선택한 ${selectedTemplates.length}개의 템플릿을 삭제하시겠습니까?`
    );
    
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 선택된 각 템플릿에 대해 삭제 요청
      const deletePromises = selectedTemplates.map(templateId =>
        fetch(`/api/templates/${templateId}`, {
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
        alert(`${failedDeletes.length}개의 템플릿 삭제에 실패했습니다.`);
      } else {
        alert("선택한 템플릿이 모두 삭제되었습니다.");
      }

      // 성공한 삭제들을 로컬 상태에서 제거
      const succeededDeletes = responses
        .map((response, index) => ({ response, id: selectedTemplates[index] }))
        .filter(({ response }) => response.ok)
        .map(({ id }) => id);

      setTemplates(prev => 
        prev.filter(template => !succeededDeletes.includes(template.id))
      );
      setSelectedTemplates([]);
    } catch (error) {
      console.error("템플릿 삭제 오류:", error);
      alert("템플릿 삭제 중 오류가 발생했습니다.");
    }
  };

  // 템플릿 이름 수정 함수들
  const startEditingTemplateName = (templateId: number, currentName: string) => {
    setEditingTemplateId(templateId);
    setEditingTemplateName(currentName);
  };

  const cancelEditingTemplateName = () => {
    setEditingTemplateId(null);
    setEditingTemplateName("");
  };

  const saveEditingTemplateName = async (templateId: number) => {
    if (!editingTemplateName.trim()) {
      alert("템플릿 이름을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editingTemplateName.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // 로컬 상태 업데이트
        setTemplates(prev =>
          prev.map(template =>
            template.id === templateId
              ? { ...template, name: editingTemplateName.trim(), updated_at: data.template.updated_at }
              : template
          )
        );
        setEditingTemplateId(null);
        setEditingTemplateName("");
        alert("템플릿 이름이 수정되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "템플릿 이름 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("템플릿 이름 수정 오류:", error);
      alert("템플릿 이름 수정 중 오류가 발생했습니다.");
    }
  };

  // 템플릿 관리 탭이 활성화될 때 데이터 로드
  useEffect(() => {
    if (activeTab === "template-management" && user) {
      loadTemplates();
    }
  }, [activeTab, user, loadTemplates]);

  // 템플릿 수정 모달 관련 함수들
  const openTemplateEditModal = async (template: Template) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      // 템플릿 상세 정보 가져오기
      const response = await fetch(`/api/templates/${template.id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEditingTemplate(template);
        setEditTemplateTitle(data.template.name || "");
        setEditTemplateContent(data.template.content || "");
        setEditTemplateImage(data.template.image_url || null);
        setUploadedImage(null);
        setUploadedImagePreview(null);
        
        // 기존 버튼 데이터 로드 (있는 경우)
        if (data.template.buttons && Array.isArray(data.template.buttons)) {
          setDynamicButtons(data.template.buttons);
        } else {
          setDynamicButtons([]);
        }
        
        setIsTemplateEditModalOpen(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "템플릿 정보를 불러오는데 실패했습니다.");
      }
    } catch (error) {
      console.error("템플릿 정보 로드 오류:", error);
      alert("템플릿 정보를 불러오는 중 오류가 발생했습니다.");
    }
  };

  const closeTemplateEditModal = () => {
    setIsTemplateEditModalOpen(false);
    setEditingTemplate(null);
    setEditTemplateTitle("");
    setEditTemplateContent("");
    setEditTemplateImage(null);
    setUploadedImage(null);
    setUploadedImagePreview(null);
    setDynamicButtons([]);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기는 5MB 이하로 선택해주세요.");
      return;
    }

    // 이미지 파일 타입 확인
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setUploadedImage(file);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 업로드된 이미지 제거
  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImagePreview(null);
  };

  // 동적 버튼 관리
  const addDynamicButton = () => {
    if (dynamicButtons.length < 2) {
      setDynamicButtons([...dynamicButtons, { 
        id: Date.now().toString(),
        text: "",
        linkType: "web",
        url: "",
        iosUrl: "",
        androidUrl: ""
      }]);
    }
  };

  const updateDynamicButton = (id: string, field: keyof typeof dynamicButtons[0], value: string | 'web' | 'app') => {
    setDynamicButtons(prev => prev.map(button => {
      if (button.id === id) {
        return {
          ...button,
          [field]: value
        };
      }
      return button;
    }));
  };

  const removeDynamicButton = (id: string) => {
    setDynamicButtons(dynamicButtons.filter(button => button.id !== id));
  };

  // 링크 확인 함수
  const handleLinkCheck = (button: typeof dynamicButtons[0]) => {
    if (button.linkType === 'web') {
      if (!button.url?.trim()) {
        alert('웹링크 주소를 입력해주세요.');
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
        alert('유효하지 않은 URL입니다.');
      }
    } else if (button.linkType === 'app') {
      if (!button.iosUrl?.trim() && !button.androidUrl?.trim()) {
        alert('iOS 또는 Android 링크 중 하나는 입력해주세요.');
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
  };

  // 템플릿 수정 저장
  const handleSaveTemplateEdit = async () => {
    if (!editingTemplate) return;

    if (!editTemplateTitle.trim()) {
      alert("템플릿 제목을 입력해주세요.");
      return;
    }

    if (!editTemplateContent.trim()) {
      alert("템플릿 내용을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      let imageUrl = editTemplateImage;

      // 새 이미지 업로드가 있는 경우
      if (uploadedImage) {
        setIsImageUploading(true);
        const formData = new FormData();
        formData.append("file", uploadedImage); // "image" -> "file"로 수정
        formData.append("templateId", editingTemplate.id.toString()); // templateId 추가

        const uploadResponse = await fetch("/api/templates/upload-image", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.fileUrl; // "imageUrl" -> "fileUrl"로 수정
        } else {
          const errorData = await uploadResponse.json().catch(() => ({}));
          console.error("이미지 업로드 실패:", errorData);
          alert(`이미지 업로드에 실패했습니다. ${errorData.error || ""}`);
          setIsImageUploading(false);
          return;
        }
        setIsImageUploading(false);
      }

      // 템플릿 업데이트
      const response = await fetch(`/api/templates/${editingTemplate.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editTemplateTitle.trim(),
          content: editTemplateContent.trim(),
          image_url: imageUrl,
          category: editingTemplate.code, // 기존 카테고리 유지
          buttons: dynamicButtons, // 버튼 데이터 추가
        }),
      });

      if (response.ok) {
        // 로컬 상태 업데이트
        setTemplates(prev =>
          prev.map(template =>
            template.id === editingTemplate.id
              ? { ...template, name: editTemplateTitle.trim(), updated_at: new Date().toISOString() }
              : template
          )
        );
        closeTemplateEditModal();
        alert("템플릿이 수정되었습니다.");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "템플릿 수정에 실패했습니다.");
      }
    } catch (error) {
      console.error("템플릿 수정 오류:", error);
      alert("템플릿 수정 중 오류가 발생했습니다.");
    }
  };

  // 템플릿 관리 탭 콘텐츠
  const renderTemplateManagementTab = () => {
    const filteredTemplates = getFilteredTemplates();

    return (
      <div className="campaign-management-container">
        {/* 필터 섹션 */}
        <div className="campaign-filters">
          {/* 기간 */}
          <div className="filter-group">
            <select 
              value={templateFilter.period}
              onChange={(e) => setTemplateFilter(prev => ({ ...prev, period: e.target.value }))}
              className="filter-select"
            >
              <option value="전체기간">전체기간</option>
              <option value="최근 1주일">최근 1주일</option>
              <option value="최근 1개월">최근 1개월</option>
              <option value="최근 3개월">최근 3개월</option>
            </select>
          </div>

          {/* 검색창 */}
          <div className="filter-group search-group">
            <input
              type="text"
              placeholder="템플릿 이름 또는 ID"
              value={templateFilter.searchKeyword}
              onChange={(e) => setTemplateFilter(prev => ({ ...prev, searchKeyword: e.target.value }))}
              className="search-input"
            />
            <button className="search-button">
              🔍
            </button>
          </div>

          {/* 템플릿 만들기 버튼 */}
          <div className="filter-group">
            <button 
              className="create-campaign-btn"
              onClick={() => handleTabChange("naver-talktalk")}
            >
              템플릿 만들기
            </button>
          </div>

          {/* 템플릿 삭제 버튼 */}
          <div className="filter-group">
            <button 
              className="delete-campaign-btn"
              disabled={selectedTemplates.length === 0}
              onClick={handleDeleteTemplates}
            >
              템플릿 삭제
            </button>
          </div>
        </div>

        {/* 템플릿 테이블 */}
        <div className="campaign-table-container">
          <table className="campaign-table management-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedTemplates.length === filteredTemplates.length && filteredTemplates.length > 0}
                    onChange={(e) => handleSelectAllTemplates(e.target.checked)}
                  />
                </th>
                <th>템플릿 이름</th>
                <th>템플릿 ID</th>
                <th>생성일</th>
                <th>수정일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTemplates ? (
                <tr>
                  <td colSpan={6} className="loading-cell">
                    <div className="loading-spinner"></div>
                    템플릿 데이터를 불러오는 중...
                  </td>
                </tr>
              ) : (
                filteredTemplates.map(template => (
                  <tr key={template.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTemplates.includes(template.id)}
                        onChange={(e) => handleSelectTemplate(template.id, e.target.checked)}
                      />
                    </td>
                    <td className="campaign-name">
                      {editingTemplateId === template.id ? (
                        <div className="campaign-name-edit">
                          <input
                            type="text"
                            value={editingTemplateName}
                            onChange={(e) => setEditingTemplateName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                saveEditingTemplateName(template.id);
                              } else if (e.key === "Escape") {
                                cancelEditingTemplateName();
                              }
                            }}
                            className="campaign-name-input"
                            autoFocus
                          />
                          <div className="campaign-name-actions">
                            <button
                              onClick={() => saveEditingTemplateName(template.id)}
                              className="save-btn"
                              title="저장"
                            >
                              저장
                            </button>
                            <button
                              onClick={cancelEditingTemplateName}
                              className="cancel-btn"
                              title="취소"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="campaign-name-display">
                          <span>{template.name}</span>
                          <button
                            onClick={() => startEditingTemplateName(template.id, template.name)}
                            className="edit-name-btn"
                            title="이름 수정"
                          >
                            수정
                          </button>
                        </div>
                      )}
                    </td>
                    <td>{template.id}</td>
                    <td>{new Date(template.created_at).toLocaleDateString("ko-KR")}</td>
                    <td>{new Date(template.updated_at).toLocaleDateString("ko-KR")}</td>
                    <td>
                      <div className="mgmt-buttons">
                        <button 
                          className="mgmt-btn edit-btn" 
                          onClick={() => openTemplateEditModal(template)}
                        >
                          수정
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!isLoadingTemplates && filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan={6} className="no-campaigns">
                    조건에 맞는 템플릿이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
              </div>
    </div>
  );
  };

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

        {/* 캠페인 수정 모달 */}
        {isEditModalOpen && (
          <div className="modal-overlay" onClick={closeEditModal}>
            <div className="edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>캠페인 수정</h2>
                <button className="close-btn" onClick={closeEditModal}>X</button>
              </div>
              
              <div className="modal-content">
                <div className="section">
                  <h3>AI 타깃 추천 결과</h3>
                  
                                      <div className="form-group">
                      <label>타깃 설정</label>
                      <div className="form-row">
                        <select 
                          value={editFormData.gender}
                          onChange={(e) => setEditFormData(prev => ({...prev, gender: e.target.value}))}
                        >
                          <option value="">성별</option>
                          {targetOptions.gender.slice(1).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <select 
                          value={editFormData.age}
                          onChange={(e) => setEditFormData(prev => ({...prev, age: e.target.value}))}
                        >
                          <option value="">연령대</option>
                          {targetOptions.age.slice(1).map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                  <div className="form-group">
                    <label>카드 사용 위치</label>
                    <div className="form-row">
                      <select 
                        value={editFormData.location_city}
                        onChange={(e) => {
                          setEditFormData(prev => ({
                            ...prev, 
                            location_city: e.target.value,
                            location_district: "" // 도시 변경 시 구/군 초기화
                          }));
                        }}
                      >
                        <option value="">시/도</option>
                        {targetOptions.cities.slice(1).map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select 
                        value={editFormData.location_district}
                        onChange={(e) => setEditFormData(prev => ({...prev, location_district: e.target.value}))}
                      >
                        {getDistrictOptions().map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>카드 사용 업종</label>
                    <div className="form-row">
                      <select 
                        value={editFormData.business_type}
                        onChange={(e) => setEditFormData(prev => ({...prev, business_type: e.target.value}))}
                      >
                        <option value="">업종 선택</option>
                        {targetOptions.topLevelIndustries.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>카드 승인 금액</label>
                    <div className="amount-container">
                      <div className="amount-input">
                        <input 
                          type="number"
                          value={editFormData.max_amount}
                          onChange={(e) => setEditFormData(prev => ({...prev, max_amount: e.target.value}))}
                          placeholder="제한없음"
                        />
                        <span>원</span>
                        <span>미만</span>
                      </div>
                      <div className="period-buttons">
                        {[
                          { label: "1만원 미만", value: "1만원 미만", max_amount: "10000" },
                          { label: "5만원 미만", value: "5만원 미만", max_amount: "50000" },
                          { label: "10만원 미만", value: "10만원 미만", max_amount: "100000" },
                          { label: "전체", value: "전체", max_amount: "" }
                        ].map(period => (
                          <button 
                            key={period.value}
                            type="button"
                            className={`period-btn ${editFormData.amount_period === period.value ? 'active' : ''}`}
                            onClick={() => {
                              setEditFormData(prev => ({
                                ...prev, 
                                amount_period: period.value,
                                max_amount: period.max_amount
                              }));
                            }}
                          >
                            {period.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>카드 승인 시간</label>
                    <div className="time-container">
                      <div className="time-inputs">
                        <select 
                          value={editFormData.start_time}
                          onChange={(e) => setEditFormData(prev => ({...prev, start_time: e.target.value}))}
                        >
                          {Array.from({length: 24}, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return <option key={hour} value={`${hour}:00`}>{hour}:00</option>;
                          })}
                        </select>
                        <span>~</span>
                        <select 
                          value={editFormData.end_time}
                          onChange={(e) => setEditFormData(prev => ({...prev, end_time: e.target.value}))}
                        >
                          {Array.from({length: 24}, (_, i) => {
                            const hour = i.toString().padStart(2, '0');
                            return <option key={hour} value={`${hour}:00`}>{hour}:00</option>;
                          })}
                        </select>
                      </div>
                      <div className="time-period-buttons">
                        {[
                          { label: "오전", value: "오전", start_time: "08:00", end_time: "12:00" },
                          { label: "오후", value: "오후", start_time: "12:00", end_time: "18:00" },
                          { label: "전체", value: "전체", start_time: "00:00", end_time: "23:00" }
                        ].map(period => (
                          <button 
                            key={period.value}
                            type="button"
                            className={`time-period-btn ${editFormData.time_period === period.value ? 'active' : ''}`}
                            onClick={() => {
                              setEditFormData(prev => ({
                                ...prev, 
                                time_period: period.value,
                                start_time: period.start_time,
                                end_time: period.end_time
                              }));
                            }}
                          >
                            {period.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="estimated-cost">
                    <span className="cost-label">예상금액</span>
                    <span className="cost-value">100원/건</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeEditModal}>취소</button>
                {editModalEntrySource === "from_rejection" ? (
                  <button className="approval-request-btn" onClick={() => handleSaveEdit(true)}>
                    수정 후 승인 재요청
                  </button>
                ) : (
                  <button className="save-btn" onClick={() => handleSaveEdit(false)}>수정</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 반려사유 모달 */}
        {isRejectionModalOpen && rejectionData && (
          <div className="modal-overlay">
            <div className="rejection-modal">
              <div className="modal-header">
                <h2>반려사유</h2>
                <button className="close-btn" onClick={closeRejectionModal}>
                  X
                </button>
              </div>
              
              <div className="modal-content">
                <div className="rejection-info">
                  <div className="rejection-header">
                    <span className="reviewer">검수자</span>
                    <span className="review-date">
                      {new Date(rejectionData.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="rejection-message">
                    안녕하세요. 에이마 캠페인 검수 담당자입니다.<br/>
                    신청하신 캠페인 설정 항목에 오류가 있어<br/>
                    아래와 같이 수정 부탁드립니다.
                  </div>
                  
                  {rejectionData.suggested_modifications?.items && (
                    <div className="modification-items">
                      <ul>
                        {rejectionData.suggested_modifications.items.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="rejection-footer">
                    감사합니다.
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button 
                  className="edit-request-btn"
                  onClick={handleEditFromRejection}
                >
                  캠페인 수정 후 승인 재요청
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 템플릿 수정 모달 */}
        {isTemplateEditModalOpen && editingTemplate && (
          <div className="modal-overlay" onClick={closeTemplateEditModal}>
            <div className="template-edit-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>템플릿 수정</h2>
                <button className="close-btn" onClick={closeTemplateEditModal}>X</button>
              </div>
              
              <div className="template-edit-content">
                <div className="template-edit-left">
                  {/* 이미지 섹션 */}
                  <div className="template-form-row">
                    <div className="form-label">이미지</div>
                    <div className="form-content image-content-row">
                      <div className="current-image-display">
                        {(uploadedImagePreview || editTemplateImage) ? (
                          <div className="image-preview-container">
                            <Image 
                              src={uploadedImagePreview || editTemplateImage || ""} 
                              alt="템플릿 이미지" 
                              className="template-display-image"
                              width={200}
                              height={120}
                              style={{ objectFit: 'cover' }}
                            />
                            {uploadedImagePreview && (
                              <button 
                                className="remove-image-btn"
                                onClick={removeUploadedImage}
                              >
                                제거
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="no-image-placeholder">
                            <span>이미지 없음</span>
                          </div>
                        )}
                      </div>
                      <div className="upload-button-container">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          style={{ display: "none" }}
                          id="template-image-upload"
                        />
                        <label htmlFor="template-image-upload" className="upload-label">
                          <span>업로드</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* 제목 입력 */}
                  <div className="template-form-row">
                    <div className="form-label">제목</div>
                    <div className="form-content">
                      <div className="input-with-count">
                        <input
                          type="text"
                          value={editTemplateTitle}
                          onChange={(e) => setEditTemplateTitle(e.target.value)}
                          className="template-title-input"
                          maxLength={20}
                          placeholder="템플릿 제목을 입력하세요"
                        />
                        <span className="char-count">{editTemplateTitle.length}/20</span>
                      </div>
                    </div>
                  </div>

                  {/* 내용 입력 */}
                  <div className="template-form-row">
                    <div className="form-label">내용</div>
                    <div className="form-content">
                      <div className="input-with-count">
                        <textarea
                          value={editTemplateContent}
                          onChange={(e) => setEditTemplateContent(e.target.value)}
                          className="template-content-textarea"
                          maxLength={100}
                          placeholder="템플릿 내용을 입력하세요"
                          rows={4}
                        />
                        <span className="char-count">{editTemplateContent.length}/100</span>
                      </div>
                    </div>
                  </div>

                  {/* 버튼 관리 */}
                  <div className="template-form-row">
                    <div className="form-label">버튼</div>
                    <div className="form-content">
                      <div className="dynamic-buttons-list">
                        {dynamicButtons.map((button, index) => (
                          <div key={button.id} className="dynamic-button-item">
                            <div className="button-inputs-row">
                              <div className="button-text-input-wrapper">
                                <input
                                  type="text"
                                  placeholder="버튼명"
                                  value={button.text}
                                  onChange={(e) => updateDynamicButton(button.id, 'text', e.target.value)}
                                  className="button-text-input"
                                  maxLength={8}
                                />
                                <span className="button-text-char-count">
                                  {button.text.length} / 8
                                </span>
                              </div>
                              
                              {/* 링크 타입 선택 */}
                              <div className="link-type-section">
                                <div className="link-type-options">
                                  <label className="radio-label">
                                    <input
                                      type="radio"
                                      name={`linkType-${button.id}`}
                                      value="web"
                                      checked={button.linkType === 'web'}
                                      onChange={(e) => updateDynamicButton(button.id, 'linkType', e.target.value as 'web' | 'app')}
                                      className="radio-input"
                                    />
                                    웹링크
                                  </label>
                                  <label className="radio-label">
                                    <input
                                      type="radio"
                                      name={`linkType-${button.id}`}
                                      value="app"
                                      checked={button.linkType === 'app'}
                                      onChange={(e) => updateDynamicButton(button.id, 'linkType', e.target.value as 'web' | 'app')}
                                      className="radio-input"
                                    />
                                    앱링크
                                  </label>
                                </div>
                              </div>

                              {/* 링크 입력창 */}
                              <div className="link-input-section">
                                {button.linkType === 'web' ? (
                                  <input
                                    type="text"
                                    placeholder="웹링크 주소"
                                    value={button.url || ''}
                                    onChange={(e) => updateDynamicButton(button.id, 'url', e.target.value)}
                                    className="button-url-input"
                                  />
                                ) : (
                                  <div className="app-link-inputs">
                                    <input
                                      type="text"
                                      placeholder="iOS 앱 링크"
                                      value={button.iosUrl || ''}
                                      onChange={(e) => updateDynamicButton(button.id, 'iosUrl', e.target.value)}
                                      className="button-url-input"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Android 앱 링크"
                                      value={button.androidUrl || ''}
                                      onChange={(e) => updateDynamicButton(button.id, 'androidUrl', e.target.value)}
                                      className="button-url-input"
                                    />
                                  </div>
                                )}
                              </div>

                              <div className="link-actions-column">
                                <button
                                  className="link-check-btn"
                                  title="링크 확인"
                                  onClick={() => handleLinkCheck(button)}
                                >
                                  링크확인
                                </button>
                                {index === dynamicButtons.length - 1 && (
                                  <button
                                    onClick={() => removeDynamicButton(button.id)}
                                    className="remove-button-btn"
                                  >
                                    🗑️ 삭제
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {dynamicButtons.length < 2 && (
                        <button 
                          className="add-button-btn"
                          onClick={addDynamicButton}
                        >
                          버튼 추가 ({dynamicButtons.length}/2)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 미리보기 섹션 */}
                <div className="template-edit-right">
                  <h3>미리보기</h3>
                  <div className="phone-preview">
                    <div className="phone-frame">
                      <div className="phone-screen">
                        {(uploadedImagePreview || editTemplateImage) && (
                          <div className="preview-image">
                            <Image 
                              src={uploadedImagePreview || editTemplateImage || ""} 
                              alt="미리보기" 
                              width={250}
                              height={150}
                              style={{ objectFit: 'cover', width: '100%', height: 'auto' }}
                            />
                          </div>
                        )}
                        
                        {editTemplateTitle && (
                          <div className="preview-title">
                            {editTemplateTitle}
                          </div>
                        )}
                        
                        {editTemplateContent && (
                          <div className="preview-content">
                            {editTemplateContent}
                          </div>
                        )}
                        
                        {dynamicButtons.length > 0 && (
                          <div className="preview-buttons">
                            {dynamicButtons.map((button) => (
                              button.text && (
                                <button 
                                  key={button.id} 
                                  className="preview-button"
                                  onClick={() => {
                                    if (button.linkType === 'web' && button.url) {
                                      let validUrl = button.url.trim();
                                      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
                                        validUrl = 'https://' + validUrl;
                                      }
                                      window.open(validUrl, '_blank');
                                    } else if (button.linkType === 'app') {
                                      const userAgent = navigator.userAgent;
                                      if (/iPad|iPhone|iPod/.test(userAgent) && button.iosUrl) {
                                        window.open(button.iosUrl, '_blank');
                                      } else if (/Android/.test(userAgent) && button.androidUrl) {
                                        window.open(button.androidUrl, '_blank');
                                      } else {
                                        const linkToOpen = button.iosUrl || button.androidUrl;
                                        if (linkToOpen) {
                                          window.open(linkToOpen, '_blank');
                                        }
                                      }
                                    }
                                  }}
                                >
                                  {button.text}
                                </button>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="cancel-btn" onClick={closeTemplateEditModal}>
                  취소
                </button>
                <button 
                  className="save-btn" 
                  onClick={handleSaveTemplateEdit}
                  disabled={isImageUploading}
                >
                  {isImageUploading ? "업로드 중..." : "수정"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
        </div>
  );
}

export default function TargetMarketingPage() {
  return (
    <AdvertiserGuardWithDisabled>
      <Suspense fallback={<div>Loading...</div>}>
        <TargetMarketingPageContent />
      </Suspense>
    </AdvertiserGuardWithDisabled>
  );
}
