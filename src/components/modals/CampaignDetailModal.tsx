"use client";

import React, { useState } from "react";
import Image from "next/image";
import { DynamicButton } from "@/types/targetMarketing";

// RealCampaign 인터페이스 (CampaignManagementTab.tsx와 동일)
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
  rejection_reason?: string; // 추가된 속성
  buttons?: DynamicButton[]; // 추가된 속성
  ad_medium?: "naver_talktalk" | "sms"; // 광고매체
  desired_recipients?: string | null; // 희망 수신자
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
    dailyMaxCount?: number;
    [key: string]: unknown;
  };
  message_templates?: {
    name: string;
    content: string;
    image_url: string;
    category?: string;
  };
}

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: RealCampaign | null;
  onUpdateCampaignName?: (campaignId: number, newName: string) => Promise<void>;
  campaigns?: RealCampaign[];
  currentIndex?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

const CampaignDetailModal: React.FC<CampaignDetailModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onUpdateCampaignName,
  campaigns = [],
  currentIndex = 0,
  onNavigate
}) => {
  const [editedName, setEditedName] = useState("");

  // campaign이 변경될 때마다 editedName 업데이트
  React.useEffect(() => {
    if (campaign?.name) {
      setEditedName(campaign.name);
    }
  }, [campaign?.name]);

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
    } else if (button.linkType === 'app') {
      // 앱링크의 경우 사용자 에이전트에 따라 적절한 링크 열기
      const userAgent = navigator.userAgent;
      if (/iPad|iPhone|iPod/.test(userAgent) && button.iosUrl) {
        window.open(button.iosUrl, '_blank');
      } else if (/Android/.test(userAgent) && button.androidUrl) {
        window.open(button.androidUrl, '_blank');
      } else {
        // iOS/Android 링크 중 가장 먼저 설정된 것 사용
        const linkToOpen = button.iosUrl || button.androidUrl;
        if (linkToOpen) {
          window.open(linkToOpen, '_blank');
        }
      }
    }
  };

  // 캠페인 이름 수정 저장
  const handleSaveName = async () => {
    if (editedName.trim() && onUpdateCampaignName && editedName.trim() !== campaign.name) {
      await onUpdateCampaignName(campaign.id, editedName.trim());
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
      second: '2-digit'
    });
  };

  // 타겟 기준 정보 포맷팅
  const formatTargetCriteria = () => {
    const criteria = campaign.target_criteria || {};
    
    // 성별 변환
    const formatGender = (gender: string | string[]) => {
      if (Array.isArray(gender)) {
        return gender.map(g => {
          if (g === 'male' || g === '남성') return '남성';
          if (g === 'female' || g === '여성') return '여성';
          if (g === 'all' || g === '전체') return '전체';
          return g;
        }).join(', ');
      } else {
        if (gender === 'male' || gender === '남성') return '남성';
        if (gender === 'female' || gender === '여성') return '여성';
        if (gender === 'all' || gender === '전체') return '전체';
        return gender;
      }
    };
    
    // 연령대 변환
    const formatAgeGroup = (ageGroup: string | string[]) => {
      const convertAge = (age: string) => {
        if (age === 'all' || age === '전체') return '전체';
        if (age === 'teens') return '10대';
        if (age === 'twenties') return '20대';
        if (age === 'thirties') return '30대';
        if (age === 'forties') return '40대';
        if (age === 'fifties') return '50대';
        if (age === 'sixties') return '60대';
        return age;
      };
      
      if (Array.isArray(ageGroup)) {
        return ageGroup.map(a => convertAge(a)).join(', ');
      } else {
        return convertAge(ageGroup);
      }
    };
    
    // 지역 변환
    const formatLocation = (location: { city?: string; district?: string; } | undefined) => {
      if (!location) return '';
      
      const convertLocationName = (name: string) => {
        const locationMap: { [key: string]: string } = {
          'seoul': '서울',
          'busan': '부산',
          'daegu': '대구',
          'incheon': '인천',
          'gwangju': '광주',
          'daejeon': '대전',
          'ulsan': '울산',
          'sejong': '세종',
          'gyeonggi': '경기',
          'gangwon': '강원',
          'chungbuk': '충북',
          'chungnam': '충남',
          'jeonbuk': '전북',
          'jeonnam': '전남',
          'gyeongbuk': '경북',
          'gyeongnam': '경남',
          'jeju': '제주',
          'all': '전체'
        };
        
        return locationMap[name.toLowerCase()] || name;
      };
      
      const city = location.city ? convertLocationName(location.city) : '';
      const district = location.district ? convertLocationName(location.district) : '';
      
      return `${city} ${district}`.trim();
    };
    
    // 업종 변환
    const formatIndustry = (industry: string | undefined) => {
      if (!industry || industry === 'all') return '전체';
      
      const industryMap: { [key: string]: string } = {
        'retail': '소매업',
        'restaurant': '음식점',
        'cafe': '카페',
        'beauty': '미용업',
        'fashion': '패션',
        'healthcare': '의료',
        'education': '교육',
        'entertainment': '엔터테인먼트',
        'automotive': '자동차',
        'finance': '금융',
        'technology': '기술',
        'manufacturing': '제조업',
        'construction': '건설업',
        'agriculture': '농업',
        'transportation': '운송업',
        'hotel': '호텔',
        'travel': '여행',
        'sports': '스포츠',
        'fitness': '피트니스',
        'all': '전체'
      };
      
      return industryMap[industry.toLowerCase()] || industry;
    };
    
    const gender = criteria.gender ? formatGender(criteria.gender) : '';
    const ageGroup = criteria.ageGroup ? formatAgeGroup(criteria.ageGroup) : '';
    const location = formatLocation(criteria.location);
    const cardAmount = criteria.cardAmount || '';
    const cardTime = criteria.cardTime ? 
      `${criteria.cardTime.startTime || ''} ~ ${criteria.cardTime.endTime || ''}` : '';
    const cardUsageIndustry = formatIndustry(criteria.cardUsageIndustry);

    return {
      gender,
      ageGroup,
      location,
      cardAmount,
      cardTime,
      cardUsageIndustry
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
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 본문 */}
          <div className="px-6 py-4">
            <div className="flex gap-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
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
                      
                      <div className="bg-white rounded-2xl p-4 w-64 min-h-[400px] relative">
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
                        
                        {/* 제목 */}
                        <div className="text-sm font-semibold text-gray-900 mb-2">
                          {campaign.message_templates?.name || campaign.name}
                        </div>
                        
                        {/* 설명 */}
                        {campaign.message_templates?.content && (
                          <div className="text-xs text-gray-700 mb-4 leading-relaxed overflow-hidden" style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical' as const
                          }}>
                            {campaign.message_templates.content}
                          </div>
                        )}
                        
                        {/* 동적 버튼들 - 버튼이 있는 경우에만 표시 */}
                        {campaign.buttons && campaign.buttons.length > 0 && (
                          <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex gap-2 justify-center">
                              {campaign.buttons.map((button: DynamicButton, index: number) => (
                                <button
                                  key={button.id || index}
                                  className="bg-blue-500 text-white text-xs px-4 py-2 rounded-lg flex-1 text-center hover:bg-blue-600 transition-colors cursor-pointer"
                                  onClick={() => handleButtonClick(button)}
                                >
                                  {button.text || `버튼${index + 1}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
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
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleSaveName();
                            }}
                          />
                          <button
                            onClick={handleSaveName}
                            className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors duration-200"
                          >
                            수정
                          </button>
                        </div>
                      </div>

                      {/* 생성일 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">생성일</span>
                        <span className="text-sm text-gray-900">{formatDate(campaign.created_at)}</span>
                      </div>

                                             {/* 광고매체 */}
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">광고매체</span>
                         <span className="text-sm text-gray-900">
                           {(() => {
                             const adMedium = campaign.ad_medium;
                             if (adMedium === 'naver_talktalk') return '네이버톡톡';
                             if (adMedium === 'sms') return '문자메시지';
                             return '네이버톡톡'; // 기본값
                           })()}
                         </span>
                       </div>

                                             {/* 성별 */}
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">성별</span>
                         <span className="text-sm text-gray-900">
                           {targetInfo.gender || '-'}
                         </span>
                       </div>

                       {/* 연령 */}
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">연령</span>
                         <span className="text-sm text-gray-900">
                           {targetInfo.ageGroup || '-'}
                         </span>
                       </div>

                      {/* 카드 사용 위치 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">카드 사용 위치</span>
                        <span className="text-sm text-gray-900">{targetInfo.location || '-'}</span>
                      </div>

                      {/* 카드 사용 업종 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">카드 사용 업종</span>
                        <span className="text-sm text-gray-900">{targetInfo.cardUsageIndustry || '-'}</span>
                      </div>

                      {/* 카드 승인 금액 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">카드 승인 금액</span>
                        <span className="text-sm text-gray-900">{targetInfo.cardAmount || '-'}</span>
                      </div>

                      {/* 카드 승인 시간 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">카드 승인 시간</span>
                        <span className="text-sm text-gray-900">{targetInfo.cardTime || '-'}</span>
                      </div>

                                             {/* 희망 수신자 */}
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">희망 수신자</span>
                         <span className="text-sm text-gray-900">
                           {(() => {
                             if (campaign.desired_recipients && campaign.desired_recipients.trim() !== '') {
                               return `${parseInt(campaign.desired_recipients).toLocaleString()}명`;
                             }
                             return '없음';
                           })()}
                         </span>
                       </div>

                      {/* 유효기간 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">유효기간</span>
                        <span className="text-sm text-gray-900">
                          {campaign.schedule_start_date && campaign.schedule_end_date
                            ? `${new Date(campaign.schedule_start_date).toLocaleDateString('ko-KR')} ~ ${new Date(campaign.schedule_end_date).toLocaleDateString('ko-KR')}`
                            : '-'
                          }
                        </span>
                      </div>

                                             {/* 일 최대 건수 */}
                       <div className="flex items-center justify-between">
                         <span className="text-sm font-medium text-gray-700">일 최대 건수</span>
                         <span className="text-sm text-gray-900">{campaign.total_recipients?.toLocaleString() || '-'}건</span>
                       </div>

                      {/* 캠페인 단가 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">캠페인 단가</span>
                        <span className="text-sm text-gray-900">{campaign.target_criteria?.costPerItem || 100}원</span>
                      </div>

                      {/* 합계 */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <span className="text-sm font-semibold text-gray-700">합계</span>
                        <span className="text-sm font-semibold text-gray-900">{(Number(campaign.budget) || 0).toLocaleString()}원</span>
                      </div>
                    </div>
                    
                  
                  </div>
                </div>
                
              </div>
              {/* 목록 버튼 */}
               <div className="flex justify-end mt-auto">
                 <button
                   onClick={onClose}
                   className="px-6 py-2 bg-white border-2 border-gray-300 hover:bg-gray-100 text-gray-900 text-sm whitespace-nowrap transition-colors duration-200"
                 >
                   목록
                 </button>
               </div>
            </div>

            {/* 전문가 검토 의견 */}
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
          </div>


        </div>
      </div>
    </div>
  );
};

export default CampaignDetailModal;
