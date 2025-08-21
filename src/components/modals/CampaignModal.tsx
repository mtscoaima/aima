import React from "react";
import { Campaign } from "@/types/targetMarketing";

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
                        const targetCriteria = campaign.target_criteria || campaign.targetCriteria;
                        return (
                          <tr key={campaign.id}>
                            <td className="py-3 px-4" style={{ width: '60px' }}>
                              <input
                                type="radio"
                                name="campaign"
                                value={campaign.id}
                                checked={selectedCampaignId === campaign.id || selectedCampaignId?.toString() === campaign.id?.toString()}
                                onChange={(e) => {
                                  setSelectedCampaignId(e.target.value);
                                }}
                              />
                            </td>
                            <td className="py-3 px-4 truncate" style={{ width: '200px' }}>{campaign.name || '이름 없음'}</td>
                            <td className="py-3 px-4 truncate" style={{ width: '180px' }}>
                              {targetCriteria ? 
                                `${targetCriteria.gender || '전체'}/${targetCriteria.age?.join(',') || '전체'}/${targetCriteria.city || '전체'}/${targetCriteria.district || '전체'}` 
                                : '전체/전체/전체/전체'
                              }
                            </td>
                            <td className="py-3 px-4 truncate" style={{ width: '120px' }}>
                              {/* 카드 사용 업종 정보 */}
                              {targetCriteria?.industry?.topLevel || '전체'}
                            </td>
                            <td className="py-3 px-4 truncate" style={{ width: '120px' }}>
                              {/* 카드 승인 금액 - NaN 방지 강화 처리 */}
                              {(() => {
                                const cardAmountValue = targetCriteria?.cardAmount;
                                
                                // 값이 없거나 빈 문자열인 경우
                                if (!cardAmountValue || cardAmountValue === '' || cardAmountValue === 'undefined' || cardAmountValue === 'null') {
                                  return '미설정';
                                }
                                
                                // 문자열 처리
                                let numericValue;
                                if (typeof cardAmountValue === 'string') {
                                  // 'all' 또는 '전체' 같은 문자열 처리
                                  if (cardAmountValue.toLowerCase() === 'all' || cardAmountValue === '전체') {
                                    return '전체';
                                  }
                                  // 'custom' 같은 특수값 처리
                                  if (cardAmountValue.toLowerCase() === 'custom') {
                                    return '사용자 설정';
                                  }
                                  // 숫자가 아닌 문자가 포함된 경우 제거 후 변환
                                  const cleanedValue = cardAmountValue.replace(/[^0-9]/g, '');
                                  if (cleanedValue === '') return '미설정';
                                  numericValue = parseInt(cleanedValue);
                                } else {
                                  numericValue = parseInt(cardAmountValue);
                                }
                                
                                // NaN 체크
                                if (isNaN(numericValue) || numericValue < 0) {
                                  return '미설정';
                                }
                                
                                // 0인 경우
                                if (numericValue === 0) {
                                  return '전체';
                                }
                                
                                // 정상적인 금액 표시
                                return `₩${(numericValue / 10000).toLocaleString()}만원`;
                              })()}
                            </td>
                            <td className="py-3 px-4 truncate" style={{ width: '140px' }}>
                              {targetCriteria?.cardTime && targetCriteria.cardTime.startTime && targetCriteria.cardTime.endTime ? 
                                `${targetCriteria.cardTime.startTime}~${targetCriteria.cardTime.endTime}` 
                                : '전체시간'
                              }
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap" style={{ width: '100px' }}>
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 whitespace-nowrap">
                                {(campaign.status === 'approved' || campaign.status === 'APPROVED' || 
                                  campaign.approval_status === 'approved' || campaign.approval_status === 'APPROVED') 
                                  ? '승인완료' 
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