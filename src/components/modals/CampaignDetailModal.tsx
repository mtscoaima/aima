"use client";

import React, { useState } from "react";
import { DynamicButton } from "@/types/targetMarketing";

interface CampaignDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: any;
  onUpdateCampaignName?: (campaignId: number, newName: string) => Promise<void>;
  campaigns?: any[];
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

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

  // 캠페인 이름 수정 시작
  const handleStartEditName = () => {
    setEditedName(campaign.name);
    setIsEditingName(true);
  };

  // 캠페인 이름 수정 저장
  const handleSaveName = async () => {
    if (editedName.trim() && onUpdateCampaignName) {
      await onUpdateCampaignName(campaign.id, editedName.trim());
      setIsEditingName(false);
    }
  };

  // 캠페인 이름 수정 취소
  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName("");
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
    
    const gender = criteria.gender ? 
      (Array.isArray(criteria.gender) ? criteria.gender.join(', ') : criteria.gender) : '';
    const ageGroup = criteria.ageGroup ? 
      (Array.isArray(criteria.ageGroup) ? criteria.ageGroup.join(', ') : criteria.ageGroup) : '';
    
    const location = criteria.location ? 
      `${criteria.location.city || ''} ${criteria.location.district || ''}`.trim() : '';
    
    const cardAmount = criteria.cardAmount || '';
    const cardTime = criteria.cardTime ? 
      `${criteria.cardTime.startTime || ''} ~ ${criteria.cardTime.endTime || ''}` : '';
    const cardUsageIndustry = criteria.cardUsageIndustry || '';

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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 text-center sm:p-0">
        {/* 배경 오버레이 */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
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
                          <img
                            src={campaign.message_templates.image_url}
                            alt="캠페인 템플릿"
                            className="w-full rounded-lg"
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
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4 text-center">캠페인 정보</h3>
                  
                  <div className="space-y-3">
                    {/* 캠페인 이름 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">캠페인 이름</span>
                      <div className="flex items-center space-x-2">
                        {isEditingName ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') handleSaveName();
                                if (e.key === 'Escape') handleCancelEditName();
                              }}
                              autoFocus
                            />
                            <button
                              onClick={handleSaveName}
                              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              저장
                            </button>
                            <button
                              onClick={handleCancelEditName}
                              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              취소
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">{campaign.name}</span>
                            <button
                              onClick={handleStartEditName}
                              className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors duration-200"
                            >
                              수정
                            </button>
                          </div>
                        )}
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
                      <span className="text-sm text-gray-900">{campaign.ad_medium === 'naver_talktalk' ? '네이버 톡톡' : campaign.ad_medium}</span>
                    </div>

                    {/* 성별/연령 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">성별/연령</span>
                      <span className="text-sm text-gray-900">
                        {targetInfo.gender} {targetInfo.ageGroup}
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
                      <span className="text-sm text-gray-900">{campaign.desired_recipients || '-'}</span>
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
                      <span className="text-sm text-gray-900">{campaign.target_criteria?.dailyMaxCount || '-'}건</span>
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

          {/* 푸터 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
            >
              목록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailModal;
