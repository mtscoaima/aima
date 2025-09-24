import React, { useState, useEffect } from "react";
import { Campaign, LocationDetailCompatible } from "@/types/targetMarketing";

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadCampaign: () => void;
  isLoading: boolean;
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string | null) => void;
}

const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onLoadCampaign,
  isLoading,
  campaigns,
  selectedCampaignId,
  setSelectedCampaignId,
}) => {
  const [industryData, setIndustryData] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchIndustryData = async () => {
      try {
        // 상위 업종 데이터 가져오기
        const topLevelResponse = await fetch('/api/industries');
        const topLevelData = await topLevelResponse.json();
        const topLevelMap: { [key: string]: string } = {};
        
        if (topLevelData.rawData && Array.isArray(topLevelData.rawData)) {
          topLevelData.rawData.forEach((industry: { code: string; name: string }) => {
            topLevelMap[industry.code] = industry.name;
          });
        }

        // 세부 업종 데이터도 가져와야 함
        const specificMap: { [key: string]: string } = {};
        // 각 상위 업종에 대해 세부 업종 조회
        for (const topLevelCode of Object.keys(topLevelMap)) {
          const specificResponse = await fetch(`/api/industries?top_level_code=${topLevelCode}`);
          const specificData = await specificResponse.json();
          
          if (specificData.rawData && Array.isArray(specificData.rawData)) {
            specificData.rawData.forEach((industry: { code: string; name: string }) => {
              specificMap[industry.code] = industry.name;
            });
          }
        }

        // 두 맵을 합쳐서 전체 업종 데이터 생성
        setIndustryData({ ...topLevelMap, ...specificMap });
      } catch (error) {
        console.error('업종 데이터 로딩 실패:', error);
      }
    };

    if (isOpen) {
      fetchIndustryData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setSelectedCampaignId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">캠페인 불러오기</h2>
          <button
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <span className="text-gray-600">캠페인 목록을 불러오는 중...</span>
            </div>
          ) : (
            <div>
              <table className="w-full border-collapse">
                <thead className="border-b border-gray-200 bg-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '60px' }}></th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '200px' }}>캠페인 이름</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '180px' }}>타깃정보</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '120px' }}>카드 사용 업종</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '120px' }}>카드 승인금액</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '140px' }}>카드 승인시간</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700" style={{ width: '100px' }}>승인상태</th>
                  </tr>
                </thead>
              </table>
              <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                <table className="w-full border-collapse">
                  <tbody className="divide-y divide-gray-200">
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          승인 완료된 캠페인이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((campaign) => {
                        // 새로운 개별 컬럼들 사용 (target_criteria 대신)
                        return (
                          <tr key={campaign.id}>
                            <td className="py-3 px-4" style={{ width: '60px' }}>
                              <input
                                type="checkbox"
                                name="campaign"
                                value={campaign.id}
                                checked={selectedCampaignId === campaign.id || selectedCampaignId?.toString() === campaign.id?.toString()}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedCampaignId(e.target.value);
                                  } else {
                                    setSelectedCampaignId(null);
                                  }
                                }}
                              />
                            </td>
                            <td className="py-3 px-4 truncate" style={{ width: '200px' }}>{campaign.name || '이름 없음'}</td>
                            <td className="py-3 px-4 truncate" style={{ width: '180px' }}>
                              {(() => {
                                // 새로운 스키마 사용
                                const genderText = campaign.gender_ratio ? 
                                  (campaign.gender_ratio.male === 100 ? '남성' : 
                                   campaign.gender_ratio.female === 100 ? '여성' : 
                                   `남성${campaign.gender_ratio.male}%:여성${campaign.gender_ratio.female}%`) : '전체';
                                
                                const ageText = campaign.target_age_groups && campaign.target_age_groups.length > 0 ?
                                  (campaign.target_age_groups.includes('all') ? '전체' : 
                                   campaign.target_age_groups.map(age => {
                                     if (age === 'teens') return '10대';
                                     if (age === 'twenties') return '20대';
                                     if (age === 'thirties') return '30대';
                                     if (age === 'forties') return '40대';
                                     if (age === 'fifties') return '50대';
                                     if (age === 'sixties') return '60대';
                                     return age;
                                   }).join(',')) : '전체';
                                
                                const locationText = campaign.target_locations_detailed && campaign.target_locations_detailed.length > 0 ?
                                  campaign.target_locations_detailed.map((loc: LocationDetailCompatible) => {
                                    if (typeof loc === 'object' && loc.city) {
                                      return loc.city;
                                    }
                                    return loc;
                                  }).join(',') : '전국';
                                
                                return `${genderText}/${ageText}/${locationText}`;
                              })()}
                            </td>
                            <td className="py-3 px-4 truncate" style={{ width: '120px' }}>
                              {/* 카드 사용 업종 정보 - API 데이터 사용 */}
                              {(() => {
                                const topLevel = campaign.target_industry_top_level;
                                const specific = campaign.target_industry_specific;
                                
                                if (!topLevel && !specific) {
                                  return '전체';
                                }
                                
                                // API에서 가져온 업종명 사용
                                const topLevelName = topLevel ? industryData[topLevel] || topLevel : '';
                                const specificName = specific ? industryData[specific] || specific : '';
                                
                                if (topLevel && specific) {
                                  return `${topLevelName}>${specificName}`;
                                }
                                return topLevelName || specificName || '전체';
                              })()}
                            </td>
                            <td className="py-3 px-4 truncate" style={{ width: '120px' }}>
                              {/* 카드 승인 금액 - 새로운 스키마 사용 */}
                              {(() => {
                                const cardAmountMax = campaign.card_amount_max;
                                
                                if (!cardAmountMax && cardAmountMax !== 0) {
                                  return '미설정';
                                }
                                
                                if (cardAmountMax === 0) {
                                  return '전체';
                                }
                                
                                return `₩${cardAmountMax.toLocaleString()} 미만`;
                              })()}
                            </td>
                            <td className="py-3 px-4 truncate" style={{ width: '140px' }}>
                              {(() => {
                                const startTime = campaign.card_time_start;
                                const endTime = campaign.card_time_end;
                                
                                if (startTime && endTime) {
                                  const formatTime = (time: string) => {
                                    return time.substring(0, 5); // HH:MM 형식으로 초 제거
                                  };
                                  return `${formatTime(startTime)}~${formatTime(endTime)}`;
                                }
                                
                                return '전체시간';
                              })()}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap" style={{ width: '100px' }}>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                                {(campaign.status === 'APPROVED' || 
                                  campaign.approval_status === 'APPROVED') 
                                  ? '승인완료' 
                                  : campaign.status === 'PENDING_APPROVAL' 
                                    ? '승인대기'
                                    : campaign.status === 'REVIEWING' 
                                      ? '검토중'
                                      : campaign.status === 'REJECTED'
                                        ? '거부됨'
                                        : campaign.status || campaign.approval_status || '대기중'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            className="px-6 py-2 bg-blue-600 text-white border-none rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={onLoadCampaign}
            disabled={!selectedCampaignId || isLoading}
          >
            불러오기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CampaignModal;