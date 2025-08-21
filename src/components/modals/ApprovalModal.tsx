import React from "react";
import { X } from "lucide-react";
import {
  batchSendDateOptions,
  generateBatchTimeOptions,
} from "@/lib/targetOptions";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  
  // 발송 정책 관련
  sendPolicy: "realtime" | "batch";
  setSendPolicy: (policy: "realtime" | "batch") => void;
  
  // 실시간 발송 관련
  validityStartDate: string;
  validityEndDate: string;
  setValidityEndDate: (date: string) => void;
  selectedPeriod: "week" | "month" | "year";
  setPeriod: (period: "week" | "month" | "year") => void;
  maxRecipients: string;
  setMaxRecipients: (recipients: string) => void;
  
  // 일괄 발송 관련
  batchSendDate: string;
  setBatchSendDate: (date: string) => void;
  batchSendTime: string;
  setBatchSendTime: (time: string) => void;
  targetCount: number;
  setTargetCount: (count: number) => void;
  adRecipientCount: number;
  setAdRecipientCount: (count: number) => void;
  
  // 비용 관련
  calculateTotalCost: (sendPolicy: "realtime" | "batch", maxRecipients: string, adRecipientCount: number) => number;
  calculateRequiredCredits: (totalCost: number, userCredits: number) => number;
  userCredits: number;
  isLoadingCredits: boolean;
  
  // 충전 관련
  openCreditModal: () => void;
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  sendPolicy,
  setSendPolicy,
  validityStartDate,
  validityEndDate,
  setValidityEndDate,
  selectedPeriod,
  setPeriod,
  maxRecipients,
  setMaxRecipients,
  batchSendDate,
  setBatchSendDate,
  batchSendTime,
  setBatchSendTime,
  targetCount,
  setTargetCount,
  adRecipientCount,
  setAdRecipientCount,
  calculateTotalCost,
  calculateRequiredCredits,
  userCredits,
  isLoadingCredits,
  openCreditModal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">발송 정책 선택</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800 mb-2">
              ※ 실시간 발송이란? 유효 기간 동안 카드 승인 시간에 고객에게
              문자 메시지를 즉시 발송하는 방식입니다.
            </p>
            <p className="text-sm text-blue-800">
              ※ 일괄 발송이란? 수집된 고객 데이터를 기반으로, AI가 가장 반응
              가능성이 높은 깃을 선별하여 한 번에 문자 메시지를 발송하는
              방식입니다.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={sendPolicy === "realtime"}
                onChange={() => setSendPolicy("realtime")}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">실시간 발송</span>
            </label>
            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={sendPolicy === "batch"}
                onChange={() => {
                  setSendPolicy("batch");
                  // 일괄 발송으로 변경할 때 광고 수신자 수가 타겟 대상자 수를 초과하면 조정
                  if (adRecipientCount > targetCount) {
                    setAdRecipientCount(targetCount);
                  }
                }}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">일괄 발송</span>
            </label>
          </div>

          {sendPolicy === "realtime" && (
            <>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">유효 기간</label>
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="date"
                    value={validityStartDate}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    readOnly
                  />
                  <span className="text-gray-500">~</span>
                  <input
                    type="date"
                    value={validityEndDate}
                    onChange={(e) => setValidityEndDate(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className={`px-4 py-2 text-sm border rounded transition-colors ${
                      selectedPeriod === "week" 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                    }`}
                    onClick={() => setPeriod("week")}
                  >
                    일주일
                  </button>
                  <button
                    className={`px-4 py-2 text-sm border rounded transition-colors ${
                      selectedPeriod === "month" 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                    }`}
                    onClick={() => setPeriod("month")}
                  >
                    한달
                  </button>
                  <button
                    className={`px-4 py-2 text-sm border rounded transition-colors ${
                      selectedPeriod === "year" 
                        ? "bg-blue-600 text-white border-blue-600" 
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:text-blue-600"
                    }`}
                    onClick={() => setPeriod("year")}
                  >
                    1년
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">일 최대 건수</label>
                <input
                  type="text"
                  value={maxRecipients + "건"}
                  onChange={(e) =>
                    setMaxRecipients(e.target.value.replace("건", ""))
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}

          {sendPolicy === "batch" && (
            <>
              <div className="mb-6">
                <div className="mb-3">
                  <span className="block text-sm font-medium text-gray-700 mb-1">발송 일·시간</span>
                  <p className="text-sm text-gray-600">
                    ※ 발송 일·시는 승인 이후에 가능합니다. (승인은 2일 정도
                    소요)
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
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

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">타깃 대상자 수</span>
                    <input
                      type="number"
                      value={targetCount}
                      onChange={(e) => {
                        const newTargetCount = parseInt(e.target.value) || 500;
                        setTargetCount(newTargetCount);
                        
                        // 타겟 대상자 수가 줄어들면 광고 수신자 수도 조정
                        if (adRecipientCount > newTargetCount) {
                          setAdRecipientCount(newTargetCount);
                        }
                      }}
                      className={`px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 ${
                        sendPolicy === "batch" ? "bg-gray-100 cursor-not-allowed text-gray-600" : "bg-white"
                      }`}
                      disabled={sendPolicy === "batch"}
                    />
                    <span className="text-sm text-gray-600">명</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">광고 수신자 수</span>
                    <input
                      type="number"
                      value={adRecipientCount}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        // 타겟 대상자 수를 넘지 않도록 제한
                        const limitedValue = Math.min(newValue, targetCount);
                        setAdRecipientCount(limitedValue);
                      }}
                      className="px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                      max={targetCount}
                      min={1}
                    />
                    <span className="text-sm text-gray-600">명</span>
                  </div>

                  <p className="text-sm text-gray-600 mt-2">
                    ※ 광고 수신자 수는 타깃 대상자 수를 초과할 수 없습니다.
                    {sendPolicy === "batch" && (
                      <>
                        <br />※ 일괄 발송 시 타깃 대상자 수는 수정할 수 없습니다.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </>
          )}

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">예상금액</span>
              <span className="text-sm text-gray-600">캠페인</span>
              <span className="text-sm font-semibold text-gray-900">100크레딧/건</span>
            </div>
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span></span>
              <span className="text-base font-semibold text-gray-900">합계</span>
              <span className="text-base font-semibold text-blue-600">{calculateTotalCost(sendPolicy, maxRecipients, adRecipientCount).toLocaleString()}크레딧</span>
            </div>
            <div className="flex justify-between items-center">
              <span></span>
              <span className="text-sm text-gray-700">충전 잔액</span>
              <span className="text-sm">
                {isLoadingCredits ? (
                  <span className="text-gray-500">로딩 중...</span>
                ) : (
                  <>
                    <span className="font-semibold text-gray-900">
                      {userCredits.toLocaleString()}
                    </span>
                    <span className="text-gray-600 ml-1">크레딧</span>
                  </>
                )}
              </span>
            </div>
            {calculateRequiredCredits(calculateTotalCost(sendPolicy, maxRecipients, adRecipientCount), userCredits) > 0 && (
              <div className="flex justify-between items-center bg-orange-50 p-3 rounded border border-orange-200">
                <span></span>
                <span className="text-sm font-medium text-orange-700">
                  ⚠ 크레딧을 충전해주세요.
                </span>
                <span>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white border-none rounded-lg text-sm font-medium cursor-pointer transition-colors hover:bg-blue-700"
                    onClick={openCreditModal}
                  >
                    + 충전하기
                  </button>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            닫기
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-2 bg-blue-600 text-white border-none rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                승인 신청 중...
              </>
            ) : (
              "승인 신청"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApprovalModal;
