"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  DynamicButton,
  LocationDetailCompatible,
  SimpleLocation,
  isNewLocationStructure,
  isOldLocationStructure,
  isSimpleLocationStructure
} from "@/types/targetMarketing";
import IndustrySelectModal from "@/components/modals/IndustrySelectModal";
// formatLocations 대신 간단한 함수 사용
import { BUTTON_CONSTRAINTS } from "@/constants/targetMarketing";

// RealCampaign 인터페이스 (새로운 컬럼들 사용)
interface RealCampaign {
  id: number;
  name: string;
  description?: string;
  status: string;
  template_id?: number | null;
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
  rejection_reason?: string;
  buttons?: DynamicButton[];
  desired_recipients?: string | null;
  // 새로운 개별 컬럼들
  target_age_groups?: string[];
  target_locations_detailed?: LocationDetailCompatible[];
  card_amount_max?: number;
  card_time_start?: string;
  card_time_end?: string;
  target_industry_top_level?: string;
  target_industry_specific?: string;
  unit_cost?: number;
  estimated_total_cost?: number;
  expert_review_requested?: boolean;
  expert_review_notes?: string;
  gender_ratio?: {
    female: number;
    male: number;
  };
  message_templates?: {
    name?: string;
    content?: string;
    image_url?: string;
    category?: string;
    buttons?: DynamicButton[];
  };
}

// 편집 가능한 캠페인 데이터 타입 (RealCampaign의 일부 필드들)
interface EditableCampaignData {
  name?: string;
  budget?: number;
  total_recipients?: number;
  schedule_start_date?: string;
  schedule_end_date?: string;
  desired_recipients?: string;
  target_age_groups?: string[];
  target_locations_detailed?: LocationDetailCompatible[];
  gender_ratio?: {
    female: number;
    male: number;
  };
  card_amount_max?: number | null;
  card_time_start?: string;
  card_time_end?: string;
  target_industry_top_level?: string;
  target_industry_specific?: string;
  buttons?: DynamicButton[];
  message_templates?: {
    name?: string;
    content?: string;
    image_url?: string;
    category?: string;
  };
  template_id?: number | null;
}

// 업종 이름 상태 타입
interface IndustryNames {
  topLevel: string;
  specific: string;
}

// 타겟 기준 정보 타입
interface TargetCriteria {
  gender: string;
  ageGroup: string;
  location: string;
  cardAmount: string;
  cardTime: string;
  cardUsageIndustry: string;
}

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: RealCampaign | null;
  onUpdateCampaignName?: (campaignId: number, newName: string) => Promise<void>;
  campaigns?: RealCampaign[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
  isAdminView?: boolean;
}

const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  isOpen,
  onClose,
  campaign,
  campaigns = [],
  currentIndex = 0,
  onNavigate,
  isAdminView = false
}) => {
  // 편집 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 편집 가능한 필드들의 상태
  const [editedData, setEditedData] = useState<EditableCampaignData>({});
  const [,setEditedName] = useState("");
  const [industryNames, setIndustryNames] = useState<IndustryNames>({topLevel: '', specific: ''});
  const [isIndustryModalOpen, setIsIndustryModalOpen] = useState(false);

  // 업종 선택 핸들러
  const handleIndustrySelect = (industry: { topLevel: string; specific: string; code: string; name: string }) => {
    setIndustryNames({ topLevel: industry.topLevel, specific: industry.specific });
    setEditedData({
      ...editedData,
      target_industry_top_level: industry.topLevel,
      target_industry_specific: industry.specific
    });
  };

  // 드롭다운 및 업로드 관련 상태
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isGenderDropdownOpen, setIsGenderDropdownOpen] = useState(false);
  const [isAgeDropdownOpen, setIsAgeDropdownOpen] = useState(false);
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 위치 선택 관련 상태
  const [targetCity, setTargetCity] = useState('all');
  const [targetDistrict, setTargetDistrict] = useState('all');
  const [targetDong, setTargetDong] = useState('all');
  const [availableCities, setAvailableCities] = useState<Array<{name: string, code: string}>>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableDongs, setAvailableDongs] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingDongs, setIsLoadingDongs] = useState(false);

  // campaign이 변경될 때마다 편집 데이터 초기화
  React.useEffect(() => {
    if (campaign) {
      setEditedName(campaign.name);

      // 기본 유효기간 설정 (오늘부터 30일)
      const today = new Date();
      const defaultEndDate = new Date(today);
      defaultEndDate.setDate(today.getDate() + 30);

      const defaultStartDate = today.toISOString().split('T')[0];
      const defaultEndDateStr = defaultEndDate.toISOString().split('T')[0];

      setEditedData({
        name: campaign.name,
        budget: campaign.budget || 0,
        total_recipients: campaign.total_recipients || 0,
        schedule_start_date: campaign.schedule_start_date || defaultStartDate,
        schedule_end_date: campaign.schedule_end_date || defaultEndDateStr,
        desired_recipients: campaign.desired_recipients || '',
        target_age_groups: campaign.target_age_groups || [],
        target_locations_detailed: campaign.target_locations_detailed || [],
        gender_ratio: campaign.gender_ratio || { male: 50, female: 50 },
        card_amount_max: campaign.card_amount_max || null,
        card_time_start: campaign.card_time_start || '',
        card_time_end: campaign.card_time_end || '',
        target_industry_top_level: campaign.target_industry_top_level || '',
        target_industry_specific: campaign.target_industry_specific || '',
        buttons: campaign.message_templates?.buttons || [],
        message_templates: campaign.message_templates || {},
        template_id: campaign.template_id || null
      });
      setIsEditMode(false);
    }
  }, [campaign]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      // 드롭다운 내부를 클릭한 경우 무시
      if (target.closest('.dropdown-container')) {
        return;
      }

      // 외부 클릭 시 모든 드롭다운 닫기
      setIsAgeDropdownOpen(false);
      setIsLocationDropdownOpen(false);
      setIsGenderDropdownOpen(false);
      setIsIndustryDropdownOpen(false);
    };

    if (isAgeDropdownOpen || isLocationDropdownOpen || isGenderDropdownOpen || isIndustryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isAgeDropdownOpen, isLocationDropdownOpen, isGenderDropdownOpen, isIndustryDropdownOpen]);

  // 업종 이름 가져오기
  useEffect(() => {
    const fetchIndustryNames = async () => {
      if (campaign && (campaign.target_industry_top_level || campaign.target_industry_specific)) {
        try {
          let topLevelName = '';
          let specificName = '';

          // 대분류 이름 가져오기
          if (campaign.target_industry_top_level) {
            const topLevelResponse = await fetch('/api/industries');
            if (topLevelResponse.ok) {
              const responseData = await topLevelResponse.json();
              
              // API 응답에서 rawData 사용 (code, name 직접 매칭)
              const topLevelData = responseData.rawData || [];
              
              // code로 매칭
              const topLevelIndustry = topLevelData.find((industry: { code: string; name: string }) => 
                industry.code === campaign.target_industry_top_level || 
                industry.code === String(campaign.target_industry_top_level)
              );
              
              topLevelName = topLevelIndustry?.name || campaign.target_industry_top_level;
            }
          }

          // 세부업종 이름 가져오기
          if (campaign.target_industry_specific && campaign.target_industry_top_level) {
            const specificResponse = await fetch(`/api/industries?top_level_code=${campaign.target_industry_top_level}`);
            if (specificResponse.ok) {
              const responseData = await specificResponse.json();
              
              // API 응답에서 rawData 사용 (code, name 직접 매칭)
              const specificData = responseData.rawData || [];
              
              // code로 매칭
              const specificIndustry = specificData.find((industry: { code: string; name: string }) => 
                industry.code === campaign.target_industry_specific ||
                industry.code === String(campaign.target_industry_specific)
              );
              
              specificName = specificIndustry?.name || campaign.target_industry_specific;
            }
          }

          setIndustryNames({ topLevel: topLevelName, specific: specificName });
        } catch (error) {
          console.error('Failed to fetch industry names:', error);
          // 에러 시 원래 값 사용
          setIndustryNames({
            topLevel: campaign.target_industry_top_level || '',
            specific: campaign.target_industry_specific || ''
          });
        }
      } else {
        // campaign이나 industry 정보가 없으면 초기화
        setIndustryNames({ topLevel: '', specific: '' });
      }
    };

    fetchIndustryNames();
  }, [campaign?.target_industry_top_level, campaign?.target_industry_specific, campaign]);

  // 시/도 목록 로드
  useEffect(() => {
    const fetchCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await fetch('/api/locations/cities');
        if (response.ok) {
          const data = await response.json();
          setAvailableCities([{name: '전체', code: 'all'}, ...data.cities]);
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
        setAvailableDistricts([]);
        return;
      }

      setIsLoadingDistricts(true);
      try {
        const response = await fetch(`/api/locations/districts?city=${encodeURIComponent(targetCity)}`);
        if (response.ok) {
          const data = await response.json();
          setAvailableDistricts(['all', ...data.districts]);
        } else {
          setAvailableDistricts([]);
        }
      } catch (error) {
        console.error('시/군/구 목록 조회 실패:', error);
        setAvailableDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    fetchDistricts();
  }, [targetCity]);

  // 동 정보 가져오기 함수
  const fetchDongs = React.useCallback(async (city: string, district: string) => {
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

  // 구 선택 시 동 정보 로드
  useEffect(() => {
    if (targetDistrict && targetDistrict !== 'all') {
      fetchDongs(targetCity, targetDistrict);
    } else {
      setAvailableDongs([]);
      setTargetDong('all');
    }
  }, [targetCity, targetDistrict, fetchDongs]);

  // 수정 권한 체크
  const canEdit = isAdminView || campaign?.status !== "APPROVED";

  // 편집 모드 토글
  const handleEditToggle = () => {
    if (isEditMode) {
      // 편집 모드 종료 시 원래 데이터로 복원
      if (campaign) {
        // 기본 유효기간 설정 (오늘부터 30일)
        const today = new Date();
        const defaultEndDate = new Date(today);
        defaultEndDate.setDate(today.getDate() + 30);

        const defaultStartDate = today.toISOString().split('T')[0];
        const defaultEndDateStr = defaultEndDate.toISOString().split('T')[0];

      setEditedData({
          name: campaign.name,
          budget: campaign.budget || 0,
          total_recipients: campaign.total_recipients || 0,
          schedule_start_date: campaign.schedule_start_date || defaultStartDate,
          schedule_end_date: campaign.schedule_end_date || defaultEndDateStr,
          desired_recipients: campaign.desired_recipients || '',
          target_age_groups: campaign.target_age_groups || [],
          target_locations_detailed: campaign.target_locations_detailed || [],
          gender_ratio: campaign.gender_ratio || { male: 50, female: 50 },
          card_amount_max: campaign.card_amount_max || null,
          card_time_start: campaign.card_time_start || '',
          card_time_end: campaign.card_time_end || '',
          target_industry_top_level: campaign.target_industry_top_level || '',
          target_industry_specific: campaign.target_industry_specific || '',
          buttons: campaign.message_templates?.buttons || [],
          message_templates: campaign.message_templates || {},
          template_id: campaign.template_id || null
        });
      }
    }
    setIsEditMode(!isEditMode);
  };

  // 저장 함수
  const handleSave = async () => {
    if (!campaign) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      // 템플릿 필드가 수정되었는지 확인
      const originalTemplate = campaign.message_templates || {};
      const editedTemplate = editedData.message_templates || {};

      // 현재 값과 원본 값 비교 (undefined/null/empty 처리)
      const originalImageUrl = originalTemplate.image_url || '';
      const originalName = originalTemplate.name || '';
      const originalContent = originalTemplate.content || '';
      const originalButtons = campaign.message_templates?.buttons || [];

      const editedImageUrl = editedTemplate.image_url || '';
      const editedName = editedTemplate.name || '';
      const editedContent = editedTemplate.content || '';
      const editedButtons = editedData.buttons || [];

      // 변경 여부 확인
      const isImageChanged = editedImageUrl !== originalImageUrl;
      const isNameChanged = editedName !== originalName;
      const isContentChanged = editedContent !== originalContent;
      const isButtonsChanged = JSON.stringify(originalButtons) !== JSON.stringify(editedButtons);

      const isTemplateModified = isImageChanged || isNameChanged || isContentChanged || isButtonsChanged;

      console.log('템플릿 변경 감지:', {
        isImageChanged,
        isNameChanged,
        isContentChanged,
        isButtonsChanged,
        isTemplateModified,
        originalImageUrl,
        editedImageUrl,
        originalName,
        editedName,
        originalContent: originalContent.substring(0, 50) + '...',
        editedContent: editedContent.substring(0, 50) + '...',
        originalButtons: originalButtons.length,
        editedButtons: editedButtons.length,
        hasTemplateId: !!campaign.template_id
      });

      const finalEditedData = { ...editedData };

      // 템플릿 필드가 수정된 경우 새 템플릿 생성
      if (isTemplateModified) {
        try {
          console.log('새 템플릿 생성 시도...');

          // 새 템플릿 생성
          const templateResponse = await fetch('/api/templates', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: editedName || originalName || campaign.name,
              content: editedContent || originalContent || '',
              image_url: editedImageUrl || originalImageUrl || null,
              category: originalTemplate.category || '커스텀',
              is_private: true,
              buttons: editedData.buttons || campaign.message_templates?.buttons || []
            })
          });

          if (!templateResponse.ok) {
            const errorText = await templateResponse.text();
            console.error('템플릿 생성 API 오류:', errorText);
            throw new Error('템플릿 생성에 실패했습니다.');
          }

          const templateResult = await templateResponse.json();
          console.log('새 템플릿 생성 성공:', templateResult);

          // 새 템플릿 ID로 업데이트
          finalEditedData.template_id = templateResult.template.id;
          console.log('템플릿 ID 업데이트:', campaign.template_id, '->', templateResult.template.id);

          // message_templates 필드는 제거 (캠페인 테이블에 직접 저장하지 않음)
          delete finalEditedData.message_templates;

        } catch (templateError) {
          console.error('템플릿 생성 실패:', templateError);
          alert('템플릿 생성에 실패했습니다. 다시 시도해주세요.');
          return;
        }
      } else {
        console.log('템플릿 변경 없음, 기존 template_id 유지');
        // 템플릿 필드가 수정되지 않은 경우 기존 template_id 유지
        if (campaign.template_id) {
          finalEditedData.template_id = campaign.template_id;
        }
        delete finalEditedData.message_templates;
      }

      // buttons는 campaigns 테이블에 저장하지 않음 (message_templates에만 저장)
      delete finalEditedData.buttons;

      const apiUrl = isAdminView
        ? `/api/admin/campaigns/${campaign.id}`
        : `/api/campaigns/${campaign.id}`;

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalEditedData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '캠페인 수정에 실패했습니다.');
      }

      await response.json();

      // 성공 시 편집 모드 종료
      setIsEditMode(false);
      alert('캠페인이 성공적으로 수정되었습니다.');

      // 부모 컴포넌트에서 캠페인 목록 새로고침이 필요할 수 있음
      // 여기서는 단순히 모달을 닫거나 페이지 새로고침을 권장
      window.location.reload();

    } catch (error) {
      console.error('캠페인 수정 실패:', error);
      alert(error instanceof Error ? error.message : '캠페인 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !campaign) return null;

  // 네비게이션 관련
  const isFirstCampaign = currentIndex === 0;
  const isLastCampaign = currentIndex === campaigns.length - 1;

  const handlePrevious = () => {
    if (!isFirstCampaign && onNavigate) {
      onNavigate('prev');
    }
  };

  const handleNext = () => {
    if (!isLastCampaign && onNavigate) {
      onNavigate('next');
    }
  };

  // 버튼 클릭 핸들러
  const handleButtonClick = (button: DynamicButton) => {
    if (button.linkType === 'web' && button.url) {
      let validUrl = button.url.trim();
      if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
        validUrl = 'https://' + validUrl;
      }
      window.open(validUrl, '_blank');
    }
  };


  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'numeric', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };



  // 위치 추가/삭제 핸들러 (동 기준)
  const MAX_LOCATIONS = 5; // 최대 5곳까지 선택 가능 (동 기준)
  const handleAddLocation = () => {
    if (!targetCity || !targetDistrict || !targetDong) return;

    const currentLocations = editedData.target_locations_detailed || [];

    // 전체 선택 시 전역 전체로 대체
    if (targetCity === "all") {
      setEditedData({
        ...editedData,
        target_locations_detailed: [{ city: "all", district: "all", dong: "all" }]
      });
      return;
    }

    // 최대 개수 제한
    if (currentLocations.length >= MAX_LOCATIONS) return;

    // 중복 확인 - SimpleLocation 구조로
    const exists = currentLocations.some(loc => {
      if (isSimpleLocationStructure(loc)) {
        return loc.city === targetCity &&
               loc.district === targetDistrict &&
               loc.dong === targetDong;
      }
      return false;
    });

    if (exists) return;

    // 새 위치 추가 - SimpleLocation 구조로
    const newLocation: SimpleLocation = {
      city: targetCity,
      district: targetDistrict,
      dong: targetDong
    };

    setEditedData({
      ...editedData,
      target_locations_detailed: [...currentLocations, newLocation]
    });
  };

  // 오버로딩된 handleRemoveLocation 함수
  const handleRemoveLocation = (city: string, district: string, dong?: string) => {
    const currentLocations = editedData.target_locations_detailed || [];

    if (dong !== undefined) {
      // SimpleLocation 구조 제거 (3개 파라미터)
      const filteredLocations = currentLocations.filter(loc => {
        if (isSimpleLocationStructure(loc)) {
          return !(loc.city === city && loc.district === district && loc.dong === dong);
        }
        return true; // 다른 구조는 일단 유지
      });

      setEditedData({
        ...editedData,
        target_locations_detailed: filteredLocations
      });
    } else {
      // 기존 복잡한 구조 제거 (2개 파라미터)
      const cityIndex = currentLocations.findIndex((loc: LocationDetailCompatible) =>
        typeof loc === 'object' && loc.city === city
      );

      if (cityIndex < 0) return;

      const newLocations = [...currentLocations];
      const entry = newLocations[cityIndex];

      // 전체 제거 시 해당 도시 엔트리 삭제
      if (district === "all") {
        newLocations.splice(cityIndex, 1);
      } else {
        const currentDistricts = typeof entry === 'object' && 'districts' in entry
          ? (entry.districts as string[]) || []
          : [];
        const districts = currentDistricts.filter((d: string) => d !== district);
        if (districts.length === 0) {
          newLocations.splice(cityIndex, 1);
        } else {
          newLocations[cityIndex] = { city, districts };
        }
      }

      setEditedData({
        ...editedData,
        target_locations_detailed: newLocations
      });
    }

    // 선택 초기화
    setTargetDong('all');
  };

  // 도시/구 라벨 가져오기 헬퍼 함수
  const getCityLabel = (value: string) => {
    const city = availableCities.find(c => c.code === value);
    if (!city) return value;

    // 시 제거 (특별시, 광역시, 특별자치시, 특별자치도만 제거, 도는 유지)
    return city.name
      .replace(/특별시$/, '')
      .replace(/광역시$/, '')
      .replace(/특별자치시$/, '')
      .replace(/특별자치도$/, '');
  };

  const getDistrictLabel = (city: string, district: string) => {
    return district === 'all' ? '전체' : district;
  };

  // 타겟 기준 정보 포맷팅
  const formatTargetCriteria = (): TargetCriteria => {
    // 성별 변환 - gender_ratio 사용
    const formatGender = () => {
      if (campaign.gender_ratio) {
        const { female, male } = campaign.gender_ratio;
        return `남성 ${male}% : 여성 ${female}%`;
      }
      return '전체';
    };

    // 연령대 변환 - target_age_groups 사용
    const formatAgeGroup = () => {
      if (campaign.target_age_groups && campaign.target_age_groups.length > 0) {
        if (campaign.target_age_groups.includes('all')) return '전체';
        return campaign.target_age_groups.map(age => {
          if (age === 'all' || age === '전체') return '전체';
          if (age === 'teens') return '10대';
          if (age === 'twenties') return '20대';
          if (age === 'thirties') return '30대';
          if (age === 'forties') return '40대';
          if (age === 'fifties') return '50대';
          if (age === 'sixties') return '60대';
          return age.includes('대') ? age : `${age}대`;
        }).join(', ');
      }
      return '전체';
    };

    // 위치 변환 - target_locations_detailed 사용
    const formatLocation = () => {
      const locations = campaign.target_locations_detailed || [];
      if (!locations || locations.length === 0) return '전국';

      return locations.map((loc) => {
        if (typeof loc === 'string') {
          return loc === 'all' ? '전국' : loc;
        }
        if (isSimpleLocationStructure(loc)) {
          // 도/시 접미사 제거 함수
          const cleanCityName = (cityName: string) => {
            return cityName
              .replace(/특별시$/, '')
              .replace(/광역시$/, '')
              .replace(/특별자치시$/, '')
              .replace(/특별자치도$/, '');
          };

          const city = cleanCityName(loc.city);
          const district = loc.district === 'all' ? '전체' : loc.district;
          const dong = loc.dong === 'all' ? '전체' : loc.dong;

          if (dong === '전체') {
            return `${city}/${district}`;
          }
          return `${city}/${district}/${dong}`;
        }
        // 레거시 구조 처리
        return `${loc.city || ''} ${loc.districts?.[0] || ''}`.trim() || '전국';
      }).join(', ');
    };

    // 업종 변환 - target_industry_top_level과 target_industry_specific 사용
    const formatIndustry = () => {
      const topLevel = industryNames.topLevel;
      const specific = industryNames.specific;
            
      if (topLevel && specific) {
        return `${topLevel}, ${specific}`;
      } else if (topLevel) {
        return topLevel;
      } else if (specific) {
        return specific;
      }
      
      // 백업: 원래 값들 사용
      const originalTopLevel = campaign.target_industry_top_level;
      const originalSpecific = campaign.target_industry_specific;
      
      if (originalTopLevel && originalSpecific) {
        return `${originalTopLevel} > ${originalSpecific}`;
      }
      return originalTopLevel || originalSpecific || '전체';
    };

    // 카드 승인 금액 - card_amount_max 사용
    const formatCardAmount = () => {
      const max = campaign.card_amount_max;
      
      if (max !== null) {
        return `${max?.toLocaleString()}원 미만`;
      }
      return '전체';
    };

    // 카드 승인 시간 - card_time_start, card_time_end 사용 (24시간 형식, 초 단위 제거)
    const formatCardTime = () => {
      const startTime = campaign.card_time_start;
      const endTime = campaign.card_time_end;
      
      // HH:MM:SS 형태를 HH:MM 형태로 변환하는 함수
      const removeSeconds = (timeString: string) => {
        if (!timeString) return timeString;
        const parts = timeString.split(':');
        if (parts.length >= 2) {
          return `${parts[0]}:${parts[1]}`;
        }
        return timeString;
      };
      
      if (startTime && endTime) {
        return `${removeSeconds(startTime)} ~ ${removeSeconds(endTime)}`;
      } else if (startTime) {
        return `${removeSeconds(startTime)}부터`;
      } else if (endTime) {
        return `${removeSeconds(endTime)}까지`;
      }
      return '전체';
    };

    return {
      gender: formatGender(),
      ageGroup: formatAgeGroup(),
      location: formatLocation(),
      cardAmount: formatCardAmount(),
      cardTime: formatCardTime(),
      cardUsageIndustry: formatIndustry()
    };
  };

  const targetInfo = formatTargetCriteria();

  return (
    <div className="fixed inset-0 z-[10000] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 transition-opacity"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.25)" }}
          onClick={onClose}
        />
        
        {/* 모달 컨테이너 */}
        <div className="relative bg-white rounded-lg shadow-xl transform transition-all w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              캠페인 상세보기
            </h2>
            <div className="flex items-center space-x-3">
              {/* 편집/저장 버튼 */}
              {canEdit && (
                <>
                  {isEditMode ? (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isLoading ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={handleEditToggle}
                        disabled={isLoading}
                        className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleEditToggle}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      편집
                    </button>
                  )}
                </>
              )}
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* 본문 */}
          <div className="px-6 py-4">
            <div className="flex gap-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                
                {/* 왼쪽 - 템플릿 이미지 영역 */}
                <div className="space-y-4">
                  {/* 휴대폰 프레임 스타일 미리보기 with 네비게이션 */}
                  <div className="flex items-center justify-center space-x-4">
                    {/* 이전 버튼 */}
                    <button
                      onClick={handlePrevious}
                      disabled={isFirstCampaign}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isFirstCampaign 
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                          : 'border-gray-400 text-gray-600 hover:border-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    {/* 휴대폰 프레임 */}
                    <div className="bg-gray-200 rounded-3xl p-3 shadow-2xl relative">
                      {/* 카메라 노치 */}
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-6 bg-gray-300 rounded-b-xl"></div>
                      
                      <div className="bg-white rounded-2xl p-4 w-64 min-h-[400px] relative pb-20">
                        {isEditMode ? (
                          <div className="relative mb-3">
                            {editedData.message_templates?.image_url || campaign.message_templates?.image_url ? (
                              <div className="relative">
                                <Image
                                  src={editedData.message_templates?.image_url || campaign.message_templates?.image_url || ''}
                                  alt="캠페인 템플릿"
                                  width={256}
                                  height={200}
                                  className="w-full rounded-lg"
                                  unoptimized
                                />
                                <button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="absolute top-2 right-2 p-1 bg-black bg-opacity-50 text-white rounded"
                                  disabled={isImageUploading}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isImageUploading}
                                className="w-full text-gray-400 text-center py-12 mb-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                              >
                                {isImageUploading ? (
                                  <div className="flex flex-col items-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-2"></div>
                                    <p className="text-sm">업로드 중...</p>
                                  </div>
                                ) : (
                                  <>
                                    <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm">이미지 업로드</p>
                                  </>
                                )}
                              </button>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setIsImageUploading(true);
                                  try {
                                    // 이미지 업로드 로직 (간단한 예시)
                                    const formData = new FormData();
                                    formData.append('file', file);

                                    const response = await fetch('/api/upload/image', {
                                      method: 'POST',
                                      body: formData
                                    });

                                    if (response.ok) {
                                      const result = await response.json();
                                      setEditedData({
                                        ...editedData,
                                        message_templates: {
                                          ...editedData.message_templates,
                                          image_url: result.url
                                        }
                                      });
                                    }
                                  } catch (error) {
                                    console.error('이미지 업로드 실패:', error);
                                    alert('이미지 업로드에 실패했습니다.');
                                  } finally {
                                    setIsImageUploading(false);
                                  }
                                }
                              }}
                              className="hidden"
                            />
                          </div>
                        ) : (
                          <>
                            {campaign.message_templates?.image_url ? (
                              <div className="relative mb-3">
                                <Image
                                  src={campaign.message_templates.image_url}
                                  alt="캠페인 템플릿"
                                  width={256}
                                  height={200}
                                  className="w-full rounded-lg"
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className="text-gray-400 text-center py-12 mb-3">
                                <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <p className="text-sm">이미지 없음</p>
                              </div>
                            )}
                          </>
                        )}
                        
                        {/* 제목 */}
                        {isEditMode ? (
                          <input
                            type="text"
                            value={editedData.message_templates?.name || ''}
                            onChange={(e) => setEditedData({
                              ...editedData,
                              message_templates: {
                                ...editedData.message_templates,
                                name: e.target.value
                              }
                            })}
                            className="w-full text-sm font-semibold text-gray-900 mb-2 p-1 border border-gray-300 rounded"
                            placeholder="템플릿 제목을 입력하세요"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-gray-900 mb-2">
                            {campaign.message_templates?.name || campaign.name}
                          </div>
                        )}

                        {/* 설명 */}
                        {isEditMode ? (
                          <textarea
                            value={editedData.message_templates?.content || ''}
                            onChange={(e) => setEditedData({
                              ...editedData,
                              message_templates: {
                                ...editedData.message_templates,
                                content: e.target.value
                              }
                            })}
                            className="w-full text-xs text-gray-700 mb-4 p-2 border border-gray-300 rounded resize-none"
                            rows={4}
                            placeholder="템플릿 내용을 입력하세요"
                          />
                        ) : (
                          campaign.message_templates?.content && (
                            <div className="text-xs text-gray-700 mb-4 leading-relaxed overflow-hidden" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: 4,
                              WebkitBoxOrient: 'vertical' as const
                            }}>
                              {campaign.message_templates.content}
                            </div>
                          )
                        )}
                        
                        {/* 동적 버튼들 */}
                        <div className="">
                          {isEditMode ? (
                            <div className="space-y-2">
                              {(editedData.buttons || []).map((button: DynamicButton, index: number) => (
                                <div key={button.id || index} className="flex gap-2 flex-col">
                                  <input
                                    type="text"
                                    value={button.text || ''}
                                    onChange={(e) => {
                                      const newButtons = [...(editedData.buttons || [])];
                                      newButtons[index] = { ...button, text: e.target.value };
                                      setEditedData({
                                        ...editedData,
                                        buttons: newButtons
                                      });
                                    }}
                                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                                    placeholder="버튼 텍스트"
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={button.url || ''}
                                      onChange={(e) => {
                                        const newButtons = [...(editedData.buttons || [])];
                                        newButtons[index] = { ...button, url: e.target.value };
                                        setEditedData({
                                          ...editedData,
                                          buttons: newButtons
                                        });
                                      }}
                                      className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                                      placeholder="버튼 URL"
                                    />
                                    <button
                                      onClick={() => {
                                        const newButtons = (editedData.buttons || []).filter((_: DynamicButton, i: number) => i !== index);
                                        setEditedData({
                                          ...editedData,
                                          buttons: newButtons
                                        });
                                      }}
                                      className="text-red-500 hover:text-red-700 px-2"
                                    >
                                      ×
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {(editedData.buttons || []).length < BUTTON_CONSTRAINTS.MAX_BUTTONS && (
                                <button
                                  onClick={() => {
                                    const newButtons = [...(editedData.buttons || []), {
                                      id: Date.now().toString(),
                                      text: '',
                                      url: '',
                                      linkType: 'web' as const
                                    }];
                                    setEditedData({
                                      ...editedData,
                                      buttons: newButtons
                                    });
                                  }}
                                  className="w-full text-xs px-2 py-1 border-2 border-dashed border-gray-300 rounded text-gray-500 hover:border-gray-400"
                                >
                                  + 버튼 추가 ({(editedData.buttons || []).length}/{BUTTON_CONSTRAINTS.MAX_BUTTONS})
                                </button>
                              )}
                            </div>
                          ) : (
                            campaign.message_templates?.buttons && campaign.message_templates.buttons.length > 0 && (
                              <div className="flex gap-2 justify-center">
                                {campaign.message_templates.buttons.map((button: DynamicButton, index: number) => (
                                  <button
                                    key={button.id || index}
                                    className="bg-blue-500 text-white text-xs px-4 py-2 rounded-lg flex-1 text-center hover:bg-blue-600 transition-colors cursor-pointer"
                                    onClick={() => handleButtonClick(button)}
                                  >
                                    {button.text || `버튼${index + 1}`}
                                  </button>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 다음 버튼 */}
                    <button
                      onClick={handleNext}
                      disabled={isLastCampaign}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        isLastCampaign 
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed' 
                          : 'border-gray-400 text-gray-600 hover:border-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 오른쪽 - 캠페인 정보 영역 */}
                <div className="space-y-4">
                  <div className="bg-white">
                    <h3 className="text-lg font-semibold mb-4">캠페인 정보</h3>
                    
                    <div className="space-y-3">
                      {/* 캠페인 이름 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">캠페인 이름</span>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={editedData.name || ''}
                            onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                            placeholder="캠페인 이름을 입력하세요"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{campaign.name}</span>
                        )}
                      </div>

                      {/* 생성일 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">생성일</span>
                        <span className="text-sm text-gray-900">{formatDate(campaign.created_at)}</span>
                      </div>

                       {/* 성별 */}
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">성별</span>
                         {isEditMode ? (
                           <div className="flex items-center space-x-2">
                             <input
                               type="number"
                               min="0"
                               max="100"
                               value={editedData.gender_ratio?.male || 50}
                               onChange={(e) => setEditedData({
                                 ...editedData,
                                 gender_ratio: {
                                   ...editedData.gender_ratio,
                                   male: parseInt(e.target.value) || 0,
                                   female: 100 - (parseInt(e.target.value) || 0)
                                 }
                               })}
                               className="w-16 px-1 py-1 text-xs border border-gray-300 rounded"
                             />
                             <span className="text-xs text-gray-600">% 남성</span>
                             <span className="text-xs text-gray-600">/</span>
                             <span className="text-xs text-gray-600">{100 - (editedData.gender_ratio?.male || 50)}% 여성</span>
                           </div>
                         ) : (
                           <span className="text-sm text-gray-900">
                             {targetInfo.gender || '-'}
                           </span>
                         )}
                       </div>

                       {/* 연령 */}
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">연령</span>
                         {isEditMode ? (
                           <div className="relative dropdown-container">
                             <button
                               type="button"
                               onClick={() => setIsAgeDropdownOpen(!isAgeDropdownOpen)}
                               className="w-48 px-2 py-1 text-sm text-left border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                             >
                               {editedData.target_age_groups?.length ? (
                                 editedData.target_age_groups.includes('all') ? '전체' :
                                 editedData.target_age_groups.map((age: string) => {
                                   if (age === 'teens') return '10대';
                                   if (age === 'twenties') return '20대';
                                   if (age === 'thirties') return '30대';
                                   if (age === 'forties') return '40대';
                                   if (age === 'fifties') return '50대';
                                   if (age === 'sixties') return '60대';
                                   return age.includes('대') ? age : `${age}대`;
                                 }).join(', ')
                               ) : '연령대 선택'}
                               <svg className="w-4 h-4 float-right mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                               </svg>
                             </button>
                             {isAgeDropdownOpen && (
                               <div className="absolute z-10 w-48 mt-1 bg-white border border-gray-300 rounded shadow-lg" onClick={(e) => e.stopPropagation()}>
                                 {['all', 'teens', 'twenties', 'thirties', 'forties', 'fifties', 'sixties'].map((age) => (
                                   <label key={age} className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
                                     <input
                                       type="checkbox"
                                       checked={editedData.target_age_groups?.includes(age) || false}
                                       onChange={(e) => {
                                         e.stopPropagation();
                                         const currentAges = editedData.target_age_groups || [];
                                         if (age === 'all') {
                                           setEditedData({
                                             ...editedData,
                                             target_age_groups: e.target.checked ? ['all'] : []
                                           });
                                         } else {
                                           const newAges = e.target.checked
                                             ? [...currentAges.filter((a: string) => a !== 'all'), age]
                                             : currentAges.filter((a: string) => a !== age);
                                           setEditedData({
                                             ...editedData,
                                             target_age_groups: newAges
                                           });
                                         }
                                       }}
                                       className="mr-2"
                                     />
                                     <span className="text-sm">
                                       {age === 'all' ? '전체' :
                                        age === 'teens' ? '10대' :
                                        age === 'twenties' ? '20대' :
                                        age === 'thirties' ? '30대' :
                                        age === 'forties' ? '40대' :
                                        age === 'fifties' ? '50대' :
                                        age === 'sixties' ? '60대' : age}
                                     </span>
                                   </label>
                                 ))}
                               </div>
                             )}
                           </div>
                         ) : (
                           <span className="text-sm text-gray-900">
                             {targetInfo.ageGroup || '-'}
                           </span>
                         )}
                       </div>

                      {/* 결제 위치 */}
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-medium text-gray-700 whitespace-nowrap">결제 위치</span>
                        {isEditMode ? (
                          <div className="w-full">
                            {/* 시/구/동 선택 드롭다운 */}
                            <div className="flex gap-2 items-center mb-2">
                              <div className="flex-1">
                                <select
                                  value={targetCity}
                                  onChange={(e) => {
                                    setTargetCity(e.target.value);
                                    setTargetDistrict('all');
                                    setTargetDong('all');
                                  }}
                                  disabled={isLoadingCities}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-100"
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
                                  value={targetDistrict}
                                  onChange={(e) => {
                                    setTargetDistrict(e.target.value);
                                    setTargetDong('all');
                                  }}
                                  disabled={isLoadingCities || isLoadingDistricts}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-100"
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
                                    value={targetDong}
                                    onChange={(e) => setTargetDong(e.target.value)}
                                    disabled={isLoadingDongs}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white disabled:bg-gray-100"
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
                                disabled={!targetCity || !targetDistrict || !targetDong || (editedData.target_locations_detailed?.length || 0) >= MAX_LOCATIONS}
                                onClick={handleAddLocation}
                                className="px-3 py-2 rounded-md bg-white text-blue-600 border border-blue-600 text-sm font-medium cursor-pointer hover:bg-blue-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-300 disabled:cursor-not-allowed"
                              >
                                + 추가
                              </button>
                            </div>

                            {/* 선택된 위치 태그들 */}
                            {(editedData.target_locations_detailed || []).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {(editedData.target_locations_detailed || []).map((location, locIndex: number) => {
                                  if (typeof location === 'string') return null;

                                  // SimpleLocation 구조 지원
                                  if (isSimpleLocationStructure(location)) {
                                    return (
                                      <span
                                        key={`${location.city}-${location.district}-${location.dong}-${locIndex}`}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200 whitespace-nowrap"
                                      >
                                        {getCityLabel(location.city)}/{getDistrictLabel(location.city, location.district)}/{location.dong === 'all' ? '전체' : location.dong}
                                        <button
                                          type="button"
                                          className="ml-1 text-green-600 hover:text-green-800"
                                          onClick={() => handleRemoveLocation(location.city, location.district, location.dong)}
                                          aria-label={`${getCityLabel(location.city)} ${getDistrictLabel(location.city, location.district)} ${location.dong === 'all' ? '전체' : location.dong} 제거`}
                                        >
                                          ×
                                        </button>
                                      </span>
                                    );
                                  }

                                  // 새로운 구조 지원 (복잡한 구조)
                                  if (isNewLocationStructure(location)) {
                                    return (
                                      <div key={locIndex} className="flex items-center gap-1">
                                        {location.districts.map((districtObj, districtIndex) => (
                                          <div key={`${location.city}-${districtObj.district}-${districtIndex}`} className="flex flex-wrap gap-1">
                                            {districtObj.dongs.includes('all') ? (
                                              // 전체 동 선택된 경우
                                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
                                                {getCityLabel(location.city)} / {getDistrictLabel(location.city, districtObj.district)}
                                                <button
                                                  type="button"
                                                  onClick={() => handleRemoveLocation(location.city, districtObj.district)}
                                                  className="text-green-600 hover:text-green-800"
                                                >
                                                  ×
                                                </button>
                                              </span>
                                            ) : (
                                              // 특정 동들이 선택된 경우
                                              districtObj.dongs.map((dong, dongIndex) => (
                                                <span
                                                  key={`${location.city}-${districtObj.district}-${dong}-${dongIndex}`}
                                                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200"
                                                >
                                                  {getCityLabel(location.city)} / {getDistrictLabel(location.city, districtObj.district)} / {dong}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleRemoveLocation(location.city, `${districtObj.district}-${dong}`)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                  >
                                                    ×
                                                  </button>
                                                </span>
                                              ))
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    );
                                  }

                                  // 기존 구조 지원
                                  if (isOldLocationStructure(location)) {
                                    return (
                                      <div key={locIndex} className="flex items-center gap-1">
                                        {location.districts.map((district: string) => (
                                          <span
                                            key={`${location.city}-${district}`}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200"
                                          >
                                            {getCityLabel(location.city)} / {getDistrictLabel(location.city, district)}
                                            <button
                                              type="button"
                                              onClick={() => handleRemoveLocation(location.city, district)}
                                              className="text-green-600 hover:text-green-800"
                                            >
                                              ×
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    );
                                  }

                                  return null;
                                })}
                              </div>
                            )}
                            <div className="mt-1 text-xs text-gray-500">위치는 동 기준으로 최대 5곳까지 추가 가능. 시=전체 선택 시 전국 적용</div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900 text-right max-w-xs">
                            {targetInfo.location ? (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {targetInfo.location.split(', ').map((loc, index) => (
                                  <span key={index} className="whitespace-nowrap">
                                    {loc}{index < targetInfo.location.split(', ').length - 1 ? ',' : ''}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              '-'
                            )}
                          </div>
                        )}
                      </div>

                      {/* 결제 업종 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">결제 업종</span>
                        {isEditMode ? (
                          <div className="flex flex-col gap-2 max-w-xs">
                            {/* 선택된 업종 표시 */}
                            {(industryNames.topLevel || industryNames.specific) && (
                              <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                <div className="flex items-center justify-between">
                                  <span className="text-blue-900">
                                    {industryNames.topLevel}
                                    {industryNames.topLevel && industryNames.specific && ' > '}
                                    {industryNames.specific}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setIndustryNames({ topLevel: '', specific: '' });
                                      setEditedData({
                                        ...editedData,
                                        target_industry_top_level: '',
                                        target_industry_specific: ''
                                      });
                                    }}
                                    className="text-blue-600 hover:text-blue-800 ml-2"
                                  >
                                    ×
                                  </button>
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => setIsIndustryModalOpen(true)}
                              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-nowrap"
                            >
                              {industryNames.topLevel || industryNames.specific ? '업종 변경' : '업종 선택'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">{targetInfo.cardUsageIndustry || '-'}</span>
                        )}
                      </div>

                      {/* 결제 승인 금액 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">결제 승인 금액</span>
                        {isEditMode ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              min="0"
                              value={editedData.card_amount_max || ''}
                              onChange={(e) => setEditedData({
                                ...editedData,
                                card_amount_max: parseInt(e.target.value) || null
                              })}
                              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="금액"
                            />
                            <span className="text-xs text-gray-600">원 미만</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">{targetInfo.cardAmount || '-'}</span>
                        )}
                      </div>

                      {/* 결제 승인 시간 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">결제 승인 시간</span>
                        {isEditMode ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="time"
                              value={editedData.card_time_start || ''}
                              onChange={(e) => setEditedData({
                                ...editedData,
                                card_time_start: e.target.value
                              })}
                              className="w-20 px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                            <span className="text-xs text-gray-600">~</span>
                            <input
                              type="time"
                              value={editedData.card_time_end || ''}
                              onChange={(e) => setEditedData({
                                ...editedData,
                                card_time_end: e.target.value
                              })}
                              className="w-20 px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">{targetInfo.cardTime || '-'}</span>
                        )}
                      </div>

                                             {/* 희망 수신자 */}
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">희망 수신자</span>
                         {isEditMode ? (
                           <input
                             type="text"
                             value={editedData.desired_recipients || ''}
                             onChange={(e) => setEditedData({...editedData, desired_recipients: e.target.value})}
                             className="w-48 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="희망 수신자를 입력하세요"
                           />
                         ) : (
                           <span className="text-sm text-gray-900">
                             {campaign.desired_recipients && campaign.desired_recipients.trim() !== '' ? campaign.desired_recipients : '없음'}
                           </span>
                         )}
                       </div>

                      {/* 유효기간 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">유효기간</span>
                        {isEditMode ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="date"
                              value={editedData.schedule_start_date || ''}
                              onChange={(e) => setEditedData({...editedData, schedule_start_date: e.target.value})}
                              className="w-24 px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                            <span className="text-xs text-gray-600">~</span>
                            <input
                              type="date"
                              value={editedData.schedule_end_date || ''}
                              onChange={(e) => setEditedData({...editedData, schedule_end_date: e.target.value})}
                              className="w-24 px-1 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        ) : (
                          <span className="text-sm text-gray-900">
                            {campaign.schedule_start_date && campaign.schedule_end_date
                              ? `${new Date(campaign.schedule_start_date).toLocaleDateString('ko-KR')} ~ ${new Date(campaign.schedule_end_date).toLocaleDateString('ko-KR')}`
                              : '-'
                            }
                          </span>
                        )}
                      </div>

                                             {/* 일 최대 건수 */}
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">일 최대 건수</span>
                         {isEditMode ? (
                           <input
                             type="number"
                             min="1"
                             value={editedData.total_recipients || ''}
                             onChange={(e) => setEditedData({...editedData, total_recipients: parseInt(e.target.value) || 0})}
                             className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="건수"
                           />
                         ) : (
                           <span className="text-sm text-gray-900">{campaign.total_recipients?.toLocaleString() || '-'}건</span>
                         )}
                       </div>

                      {/* 캠페인 단가 (자동 계산) */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">캠페인 단가</span>
                        <span className="text-sm text-gray-900">
                          {isEditMode && editedData.budget && editedData.total_recipients
                            ? `${Math.ceil(editedData.budget / editedData.total_recipients).toLocaleString()}원`
                            : campaign.unit_cost ? `${campaign.unit_cost.toLocaleString()}원` : '100원'
                          }
                        </span>
                      </div>

                      {/* 광고 금액 */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">광고 금액</span>
                        {isEditMode ? (
                          <input
                            type="number"
                            min="1"
                            value={editedData.budget || ''}
                            onChange={(e) => setEditedData({...editedData, budget: parseInt(e.target.value) || 0})}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                            placeholder="금액"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">{(Number(campaign.budget) || 0).toLocaleString()}원</span>
                        )}
                      </div>
                    </div>


                  </div>
                </div>

              </div>

               {/* 관리자 뷰일 때 하단 여백 추가 */}
               {isAdminView && <div className="mb-8"></div>}
            </div>

            {/* 목록 버튼을 캠페인 정보 하단으로 이동 - 관리자 뷰에서는 숨김 */}
            {!isAdminView && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-white border-2 border-gray-300 hover:bg-gray-100 text-gray-900 text-sm whitespace-nowrap transition-colors duration-200 rounded"
                >
                  목록
                </button>
              </div>
            )}

            {/* 전문가 검토 의견 - 관리자 뷰에서는 숨김 */}
            {!isAdminView && (
              <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <h4 className="text-base font-semibold text-gray-900">전문가 검토 의견</h4>
                    <span className="text-xs text-gray-500">{formatDate(new Date().toISOString())}</span>
                  </div>
                  
                  {/* 추가 문의 버튼 */}
                  <button
                    onClick={() => {
                      // 1:1 문의하기 페이지로 이동
                      window.location.href = '/support';
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors duration-200"
                  >
                    추가 문의
                  </button>
                </div>
                
                <div className="bg-white border border-gray-200 rounded p-4 min-h-[100px] flex items-center justify-center">
                  <p className="text-gray-500 text-sm">준비중입니다.</p>
                </div>

                {/* 첨부파일 다운로드 (준비중) */}
                <div className="mt-4 text-sm text-gray-500 text-right">
                  <span>첨부파일: </span>
                  <button 
                    className="text-blue-500 hover:text-blue-600 underline"
                    onClick={() => alert('첨부파일 다운로드 기능은 준비중입니다.')}
                  >
                    전문가의견.jpg (준비중)
                  </button>
                </div>
              </div>
            )}
          </div>


        </div>
      </div>

      {/* 업종 선택 모달 */}
      <IndustrySelectModal
        isOpen={isIndustryModalOpen}
        onClose={() => setIsIndustryModalOpen(false)}
        onSelect={handleIndustrySelect}
        title="결제 업종 선택"
      />
    </div>
  );
};

export default CampaignDetailModal;
