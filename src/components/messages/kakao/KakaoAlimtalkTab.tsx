"use client";

import React, { useState, useEffect } from "react";
import { Info, HelpCircle, RefreshCw, Send, Plus } from "lucide-react";
import {
  fetchSenderProfiles,
  fetchAlimtalkTemplates,
  sendAlimtalk,
  type SenderProfile,
  type AlimtalkTemplate,
} from "@/utils/kakaoApi";
import ChannelRegistrationModal from "../../kakao/ChannelRegistrationModal";
import TemplateCreateModal from "../../kakao/TemplateCreateModal";

const KakaoAlimtalkTab = () => {
  // 수신자 및 발신번호 상태
  const [recipients, setRecipients] = useState<string[]>([]);
  const [recipientInput, setRecipientInput] = useState("");
  const [callbackNumber, setCallbackNumber] = useState("");

  // 템플릿 상태 레이블 변환 함수
  const getTemplateStatusLabel = (template: AlimtalkTemplate) => {
    const statusMap: Record<string, string> = {
      'R': '대기',
      'A': '정상',
      'S': '중지'
    };
    const inspectionMap: Record<string, string> = {
      'REG': '등록됨',
      'REQ': '검수중',
      'APR': '승인됨',
      'REJ': '반려됨'
    };

    const statusLabel = statusMap[template.status] || template.status;
    const inspectionLabel = template.inspection_status
      ? inspectionMap[template.inspection_status]
      : '';

    return inspectionLabel
      ? `${statusLabel} · ${inspectionLabel}`
      : statusLabel;
  };

  // 채널 및 템플릿 상태
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [alimtalkTemplates, setAlimtalkTemplates] = useState<AlimtalkTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AlimtalkTemplate | null>(null);

  // 로딩 상태
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 기타 상태
  const [enableSmsBackup, setEnableSmsBackup] = useState(false);
  const [smsBackupMessage, setSmsBackupMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // 컴포넌트 마운트 시 발신 프로필 조회
  useEffect(() => {
    loadSenderProfiles();
  }, []);

  // 발신 프로필 선택 시 템플릿 조회
  useEffect(() => {
    if (selectedProfile) {
      loadTemplates(selectedProfile);
    } else {
      setAlimtalkTemplates([]);
      setSelectedTemplate(null);
    }
  }, [selectedProfile]);

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

  // 템플릿 목록 조회
  const loadTemplates = async (senderKey: string) => {
    setIsLoadingTemplates(true);
    setErrorMessage("");
    try {
      const templates = await fetchAlimtalkTemplates(senderKey);
      setAlimtalkTemplates(templates);
    } catch (error) {
      console.error("템플릿 조회 실패:", error);
      setErrorMessage(error instanceof Error ? error.message : "템플릿 조회 실패");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // 수신자 추가
  const handleAddRecipient = () => {
    const trimmed = recipientInput.trim();
    if (trimmed && !recipients.includes(trimmed)) {
      setRecipients([...recipients, trimmed]);
      setRecipientInput("");
    }
  };

  // 수신자 제거
  const handleRemoveRecipient = (recipient: string) => {
    setRecipients(recipients.filter(r => r !== recipient));
  };

  // Enter 키로 수신자 추가
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddRecipient();
    }
  };

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template: AlimtalkTemplate) => {
    setSelectedTemplate(template);
  };

  // 알림톡 발송
  const handleSendAlimtalk = async () => {
    // 유효성 검사
    if (!selectedProfile) {
      alert("발신 프로필을 선택해주세요.");
      return;
    }

    if (!selectedTemplate) {
      alert("템플릿을 선택해주세요.");
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

    // 발송 확인
    const confirmed = window.confirm(
      `${recipients.length}명에게 알림톡을 발송하시겠습니까?`
    );
    if (!confirmed) return;

    setIsSending(true);
    setErrorMessage("");

    try {
      const result = await sendAlimtalk({
        senderKey: selectedProfile,
        templateCode: selectedTemplate.template_code,
        recipients: recipients,
        message: selectedTemplate.template_content,
        callbackNumber: callbackNumber,
        buttons: selectedTemplate.buttons,
        tranType: enableSmsBackup ? "SMS" : undefined,
        tranMessage: enableSmsBackup ? smsBackupMessage : undefined,
      });

      alert(
        `알림톡 발송 완료\n성공: ${result.successCount}건\n실패: ${result.failCount}건`
      );

      // 발송 성공 시 수신자 목록 초기화
      setRecipients([]);
      setRecipientInput("");
    } catch (error) {
      console.error("알림톡 발송 실패:", error);
      alert(
        error instanceof Error ? error.message : "알림톡 발송 중 오류가 발생했습니다."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* 에러 메시지 */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 수신자 입력 영역 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-gray-700 mb-3">수신자 정보</h3>

        {/* 수신번호 입력 */}
        <div className="mb-3">
          <label className="block text-sm text-gray-600 mb-2">수신번호</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="010-XXXX-XXXX"
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleAddRecipient}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              추가
            </button>
          </div>
        </div>

        {/* 수신자 목록 */}
        {recipients.length > 0 && (
          <div className="mb-3">
            <label className="block text-sm text-gray-600 mb-2">
              수신자 목록 ({recipients.length}명)
            </label>
            <div className="flex flex-wrap gap-2">
              {recipients.map((recipient, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                >
                  <span>{recipient}</span>
                  <button
                    onClick={() => handleRemoveRecipient(recipient)}
                    className="text-gray-500 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 발신번호 입력 */}
        <div>
          <label className="block text-sm text-gray-600 mb-2">발신번호</label>
          <input
            type="text"
            value={callbackNumber}
            onChange={(e) => setCallbackNumber(e.target.value)}
            placeholder="010-XXXX-XXXX"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 카카오 채널 & 알림톡 템플릿 */}
      <div className="mb-4">
        <div className="flex gap-6">
          {/* 좌측: 카카오 채널 (발신 프로필) */}
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">카카오 채널</h3>
                <button
                  onClick={loadSenderProfiles}
                  disabled={isLoadingProfiles}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  title="새로고침"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoadingProfiles ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {isLoadingProfiles ? (
                <div className="text-sm text-gray-500">로딩 중...</div>
              ) : senderProfiles.length > 0 ? (
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">채널을 선택하세요</option>
                  {senderProfiles.map((profile) => (
                    <option key={profile.sender_key} value={profile.sender_key}>
                      {profile.channel_name} ({profile.status})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm mb-3">연동된 채널이 없습니다.</p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    채널 연동하기
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 알림톡 템플릿 */}
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">알림톡 템플릿</h3>
                {selectedProfile && (
                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                    템플릿 추가
                  </button>
                )}
              </div>

              {!selectedProfile ? (
                <div className="text-center py-2 text-gray-500 text-sm">
                  먼저 카카오 채널을 선택해주세요.
                </div>
              ) : isLoadingTemplates ? (
                <div className="text-sm text-gray-500">로딩 중...</div>
              ) : alimtalkTemplates.length > 0 ? (
                <select
                  value={selectedTemplate?.template_code || ""}
                  onChange={(e) => {
                    const template = alimtalkTemplates.find(
                      (t) => t.template_code === e.target.value
                    );
                    if (template) handleTemplateSelect(template);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">템플릿을 선택하세요</option>
                  {alimtalkTemplates.map((template) => (
                    <option key={template.template_code} value={template.template_code}>
                      {template.template_name} ({getTemplateStatusLabel(template)})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm mb-3">사용 가능한 템플릿이 없습니다.</p>
                  <button
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    첫 템플릿 추가하기
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 템플릿 내용 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-gray-700 mb-3">템플릿 내용</h3>
        <textarea
          placeholder="사용할 템플릿을 선택하면, 이곳에 템플릿 내용이 표시됩니다. (내용수정불가)"
          className="w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[200px] bg-gray-50"
          value={selectedTemplate?.template_content || ""}
          readOnly
        />
      </div>

      {/* 문구 치환 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-gray-700">문구 치환</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">
            {selectedTemplate
              ? "템플릿에 변수가 있는 경우 여기서 입력할 수 있습니다."
              : "템플릿을 선택해주세요."}
          </span>
        </div>
      </div>

      {/* 발송실패 시 문자대체발송 여부 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <input
            type="checkbox"
            id="smsBackup"
            className="rounded"
            checked={enableSmsBackup}
            onChange={(e) => setEnableSmsBackup(e.target.checked)}
          />
          <label htmlFor="smsBackup" className="text-sm text-gray-700">
            발송실패 시 문자대체발송 여부
          </label>
          <HelpCircle className="w-4 h-4 text-gray-400" />
        </div>

        {enableSmsBackup && (
          <textarea
            placeholder="알림톡 발송 실패 시 전송할 문자 메시지를 입력하세요."
            className="w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[100px]"
            value={smsBackupMessage}
            onChange={(e) => setSmsBackupMessage(e.target.value)}
          />
        )}
      </div>

      {/* 발송 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleSendAlimtalk}
          disabled={
            isSending ||
            !selectedProfile ||
            !selectedTemplate ||
            recipients.length === 0
          }
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
          style={{ backgroundColor: "#795548" }}
        >
          {isSending ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              발송 중...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              알림톡 발송
            </>
          )}
        </button>
      </div>

      {/* 채널 연동 모달 */}
      <ChannelRegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadSenderProfiles();
        }}
      />

      {/* 템플릿 추가 모달 */}
      {selectedProfile && (
        <TemplateCreateModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          senderKey={selectedProfile}
          onSuccess={() => {
            setIsTemplateModalOpen(false);
            loadTemplates(selectedProfile);
          }}
        />
      )}
    </div>
  );
};

export default KakaoAlimtalkTab;
