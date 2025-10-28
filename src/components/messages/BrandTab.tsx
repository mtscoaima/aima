"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Send } from "lucide-react";
import { fetchSenderProfiles, sendBrandMessage, type SenderProfile } from "@/utils/kakaoApi";

interface BrandTabProps {
  recipients: string[];
  callbackNumber: string;
}

const BrandTab: React.FC<BrandTabProps> = ({ recipients, callbackNumber }) => {
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [selectedSenderKey, setSelectedSenderKey] = useState("");
  const [templateCode, setTemplateCode] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'PREMIUM_VIDEO'>('TEXT');
  const [tranType, setTranType] = useState<'N' | 'S' | 'L' | 'M'>('N');
  const [tranMessage, setTranMessage] = useState("");
  const [subject, setSubject] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  // 발신 프로필 로드
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setIsLoading(true);
        setError("");
        const profiles = await fetchSenderProfiles();
        setSenderProfiles(profiles);

        // 첫 번째 프로필 자동 선택
        if (profiles.length > 0) {
          setSelectedSenderKey(profiles[0].sender_key);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "발신 프로필 조회 실패");
        console.error("발신 프로필 로드 오류:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfiles();
  }, []);

  // 발송 버튼 핸들러
  const handleSend = async () => {
    // 유효성 검사
    if (!selectedSenderKey) {
      alert("발신 프로필을 선택해주세요.");
      return;
    }

    if (!templateCode.trim()) {
      alert("템플릿 코드를 입력해주세요.");
      return;
    }

    if (!message.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    if (recipients.length === 0) {
      alert("수신자를 추가해주세요.");
      return;
    }

    if (!callbackNumber) {
      alert("발신번호를 선택해주세요.");
      return;
    }

    // 전환 발송 메시지 검증
    if (tranType !== 'N' && !tranMessage.trim()) {
      alert("전환 발송 메시지를 입력해주세요.");
      return;
    }

    // LMS/MMS 전환 시 제목 검증
    if ((tranType === 'L' || tranType === 'M') && !subject.trim()) {
      alert("LMS/MMS 전환 시 제목을 입력해주세요.");
      return;
    }

    try {
      setIsSending(true);
      setError("");

      const result = await sendBrandMessage({
        senderKey: selectedSenderKey,
        templateCode: templateCode.trim(),
        recipients,
        message: message.trim(),
        callbackNumber,
        messageType,
        tranType,
        tranMessage: tranMessage.trim() || undefined,
        subject: subject.trim() || undefined,
      });

      if (result.success) {
        alert(`브랜드 메시지 발송 완료!\n성공: ${result.results.filter((r: { success: boolean }) => r.success).length}건\n실패: ${result.results.filter((r: { success: boolean }) => !r.success).length}건`);

        // 폼 초기화
        setTemplateCode("");
        setMessage("");
        setTranMessage("");
        setSubject("");
        setTranType('N');
      } else {
        throw new Error(result.error || "브랜드 메시지 발송 실패");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "브랜드 메시지 발송 중 오류가 발생했습니다.";
      setError(errorMessage);
      alert(errorMessage);
      console.error("브랜드 메시지 발송 오류:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">발신 프로필 로딩 중...</span>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 발신 프로필 선택 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          발신 프로필 <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedSenderKey}
          onChange={(e) => setSelectedSenderKey(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading || senderProfiles.length === 0}
        >
          <option value="">발신 프로필 선택</option>
          {senderProfiles.map((profile) => (
            <option key={profile.sender_key} value={profile.sender_key}>
              {profile.channel_name} ({profile.status})
            </option>
          ))}
        </select>
      </div>

      {/* 템플릿 코드 입력 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          템플릿 코드 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={templateCode}
          onChange={(e) => setTemplateCode(e.target.value)}
          placeholder="템플릿 코드를 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-500">
          MTS 관리자 페이지에서 등록한 템플릿 코드를 입력하세요.
        </p>
      </div>

      {/* 메시지 타입 선택 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메시지 타입 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['TEXT', 'IMAGE', 'WIDE', 'WIDE_ITEM_LIST', 'CAROUSEL_FEED'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMessageType(type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                messageType === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 메시지 내용 입력 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메시지 내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="메시지 내용을 입력하세요 (최대 1,000자)"
          rows={6}
          maxLength={1000}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-500">템플릿과 동일한 내용을 입력하세요.</p>
          <p className="text-xs text-gray-500">{message.length} / 1,000자</p>
        </div>
      </div>

      {/* 전환 발송 설정 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          전환 발송 설정 (실패 시 SMS/LMS/MMS로 전환)
        </label>
        <div className="space-y-3">
          <div className="flex gap-2">
            {(['N', 'S', 'L', 'M'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTranType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tranType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type === 'N' ? '전환안함' : type === 'S' ? 'SMS' : type === 'L' ? 'LMS' : 'MMS'}
              </button>
            ))}
          </div>

          {tranType !== 'N' && (
            <>
              {(tranType === 'L' || tranType === 'M') && (
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="LMS/MMS 제목"
                  maxLength={40}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
              <textarea
                value={tranMessage}
                onChange={(e) => setTranMessage(e.target.value)}
                placeholder="전환 발송 시 사용할 메시지"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </>
          )}
        </div>
      </div>

      {/* 수신자 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <span className="font-medium">수신자: </span>
          {recipients.length > 0 ? `${recipients.length}명` : "수신자를 추가해주세요."}
        </p>
        <p className="text-sm text-blue-800 mt-1">
          <span className="font-medium">예상 비용: </span>
          {recipients.length * 15}원 (브랜드 메시지: 15원/건)
        </p>
      </div>

      {/* 발송 버튼 */}
      <button
        onClick={handleSend}
        disabled={isSending || !selectedSenderKey || !templateCode || !message || recipients.length === 0}
        className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            발송 중...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            브랜드 메시지 발송
          </>
        )}
      </button>
    </div>
  );
};

export default BrandTab;
