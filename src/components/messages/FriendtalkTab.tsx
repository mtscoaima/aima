"use client";

import React, { useState, useEffect } from "react";
import { Info, HelpCircle, RefreshCw, Send, Image as ImageIcon } from "lucide-react";
import {
  fetchSenderProfiles,
  sendFriendtalk,
  type SenderProfile,
} from "@/utils/kakaoApi";

interface FriendtalkTabProps {
  recipients?: string[]; // 상위 컴포넌트에서 전달받는 수신자 목록
  callbackNumber?: string; // 발신번호
  onSendComplete?: (result: unknown) => void; // 발송 완료 콜백
}

const FriendtalkTab: React.FC<FriendtalkTabProps> = ({
  recipients = [],
  callbackNumber = "",
  onSendComplete,
}) => {
  // 상태 관리
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageType, setMessageType] = useState<'FT' | 'FI' | 'FW' | 'FL' | 'FC'>('FT');
  const [adFlag, setAdFlag] = useState<'Y' | 'N'>('N');
  const [message, setMessage] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [enableSmsBackup, setEnableSmsBackup] = useState(false);
  const [smsBackupMessage, setSmsBackupMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 컴포넌트 마운트 시 발신 프로필 조회
  useEffect(() => {
    loadSenderProfiles();
  }, []);

  // 발신 프로필 조회
  const loadSenderProfiles = async () => {
    setIsLoadingProfiles(true);
    setErrorMessage("");
    try {
      const profiles = await fetchSenderProfiles();
      setSenderProfiles(profiles);

      // 첫 번째 프로필 자동 선택
      if (profiles.length > 0 && profiles[0].sender_key) {
        setSelectedProfile(profiles[0].sender_key);
      }
    } catch (error) {
      console.error("발신 프로필 조회 실패:", error);
      setErrorMessage(error instanceof Error ? error.message : "발신 프로필 조회 실패");
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  // 친구톡 발송
  const handleSendFriendtalk = async () => {
    // 유효성 검사
    if (!selectedProfile) {
      alert("발신 프로필을 선택해주세요.");
      return;
    }

    if (!message.trim()) {
      alert("메시지 내용을 입력해주세요.");
      return;
    }

    if (recipients.length === 0) {
      alert("수신자를 입력해주세요.");
      return;
    }

    if (!callbackNumber) {
      alert("발신번호를 입력해주세요.");
      return;
    }

    // 광고성 메시지 시간 체크 (08시~20시)
    if (adFlag === 'Y') {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 8 || hour >= 20) {
        alert("광고성 메시지는 08시~20시 사이에만 발송 가능합니다.");
        return;
      }
    }

    // 발송 확인
    const confirmed = window.confirm(
      `${recipients.length}명에게 친구톡을 발송하시겠습니까?`
    );
    if (!confirmed) return;

    setIsSending(true);
    setErrorMessage("");

    try {
      const result = await sendFriendtalk({
        senderKey: selectedProfile,
        recipients: recipients,
        message: message,
        callbackNumber: callbackNumber,
        messageType: messageType,
        adFlag: adFlag,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        tranType: enableSmsBackup ? "SMS" : undefined,
        tranMessage: enableSmsBackup ? smsBackupMessage : undefined,
      });

      alert(
        `친구톡 발송 완료\n성공: ${result.successCount}건\n실패: ${result.failCount}건`
      );

      if (onSendComplete) {
        onSendComplete(result);
      }

      // 발송 후 메시지 초기화
      setMessage("");
      setImageUrls([]);
    } catch (error) {
      console.error("친구톡 발송 실패:", error);
      alert(
        error instanceof Error ? error.message : "친구톡 발송 중 오류가 발생했습니다."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">
              카카오 친구톡 V2
            </h3>
            <p className="text-sm text-blue-700">
              친구톡은 템플릿 없이 자유롭게 메시지를 작성할 수 있습니다.
              <br />
              광고성 메시지는 08시~20시 사이에만 발송 가능합니다.
            </p>
          </div>
        </div>
      </div>

      {/* 에러 메시지 */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {errorMessage}
        </div>
      )}

      {/* 발신 프로필 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <span>발신 프로필</span>
            <button
              onClick={loadSenderProfiles}
              className="text-blue-600 hover:text-blue-700"
              disabled={isLoadingProfiles}
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingProfiles ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </label>

        <select
          value={selectedProfile}
          onChange={(e) => setSelectedProfile(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={isLoadingProfiles}
        >
          <option value="">발신 프로필 선택</option>
          {senderProfiles.map((profile) => (
            <option key={profile.sender_key} value={profile.sender_key}>
              {profile.channel_name} ({profile.status})
            </option>
          ))}
        </select>
      </div>

      {/* 메시지 타입 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2">
            <span>메시지 타입</span>
            <div className="group relative inline-block">
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <div className="hidden group-hover:block absolute z-10 w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-2">
                FT: 텍스트형 (기본) / FI: 이미지형 / FW: 와이드 이미지형 / FL: 와이드 리스트형 / FC: 캐러셀형
              </div>
            </div>
          </div>
        </label>

        <div className="flex gap-2">
          {[
            { value: 'FT', label: '텍스트형' },
            { value: 'FI', label: '이미지형' },
            { value: 'FW', label: '와이드 이미지' },
            { value: 'FL', label: '와이드 리스트' },
            { value: 'FC', label: '캐러셀형' },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setMessageType(type.value as 'FT' | 'FI' | 'FW' | 'FL' | 'FC')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                messageType === type.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* 광고 여부 */}
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={adFlag === 'Y'}
            onChange={(e) => setAdFlag(e.target.checked ? 'Y' : 'N')}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            광고성 메시지 (08:00~20:00만 발송 가능)
          </span>
        </label>
      </div>

      {/* 메시지 내용 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          메시지 내용
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="친구톡 메시지 내용을 입력하세요."
          className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <p className="text-sm text-gray-500">
          {message.length}자 / 최대 1000자
        </p>
      </div>

      {/* 이미지 URL (이미지형만) */}
      {['FI', 'FW', 'FL', 'FC'].includes(messageType) && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span>이미지 URL</span>
            </div>
          </label>
          <input
            type="text"
            value={imageUrls[0] || ''}
            onChange={(e) => setImageUrls(e.target.value ? [e.target.value] : [])}
            placeholder="/2025/01/28/image.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500">
            MTS API를 통해 업로드한 이미지 경로를 입력하세요.
          </p>
        </div>
      )}

      {/* SMS 백업 옵션 */}
      <div className="space-y-3 border-t pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableSmsBackup}
            onChange={(e) => setEnableSmsBackup(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">
            전환 전송 사용 (친구톡 실패 시 SMS로 자동 전환)
          </span>
        </label>

        {enableSmsBackup && (
          <div className="ml-6 space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              전환 발송 메시지 (SMS)
            </label>
            <textarea
              value={smsBackupMessage}
              onChange={(e) => setSmsBackupMessage(e.target.value)}
              placeholder="친구톡 발송 실패 시 보낼 SMS 메시지"
              className="w-full h-24 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        )}
      </div>

      {/* 발송 버튼 */}
      <button
        onClick={handleSendFriendtalk}
        disabled={isSending || !selectedProfile || !message.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isSending ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>발송 중...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>친구톡 발송</span>
          </>
        )}
      </button>
    </div>
  );
};

export default FriendtalkTab;
