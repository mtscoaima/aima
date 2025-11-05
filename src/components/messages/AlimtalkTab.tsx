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
import ChannelRegistrationModal from "../kakao/ChannelRegistrationModal";

interface Recipient {
  phone_number: string;
  name?: string;
}

interface AlimtalkTabProps {
  recipients?: Recipient[]; // 상위 컴포넌트에서 전달받는 수신자 목록 (전화번호 + 이름)
  callbackNumber?: string; // 발신번호
  onSendComplete?: (result: unknown) => void; // 발송 완료 콜백
}

const AlimtalkTab: React.FC<AlimtalkTabProps> = ({
  recipients = [],
  callbackNumber = "",
  onSendComplete,
}) => {
  // 상태 관리
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [alimtalkTemplates, setAlimtalkTemplates] = useState<AlimtalkTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AlimtalkTemplate | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [enableSmsBackup, setEnableSmsBackup] = useState(false);
  const [smsBackupMessage, setSmsBackupMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 템플릿 상태 레이블 변환 함수
  const getTemplateStatusLabel = (template: AlimtalkTemplate) => {
    // 중지 상태 우선 체크
    if (template.status === 'S') {
      return '중지됨 ⛔';
    }

    // 검수 상태 맵핑
    const inspectionMap: Record<string, string> = {
      'APR': '승인됨 ✅',
      'REG': '등록됨',
      'REQ': '검수중 ⏳',
      'REJ': '반려됨 ❌'
    };

    // inspection_status 우선 표시
    if (template.inspection_status) {
      return inspectionMap[template.inspection_status] || template.inspection_status;
    }

    // fallback: status 표시
    const statusMap: Record<string, string> = {
      'R': '대기',
      'A': '정상',
      'S': '중지'
    };
    return statusMap[template.status] || template.status;
  };

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

      if (onSendComplete) {
        onSendComplete(result);
      }
    } catch (error) {
      alert(
        error instanceof Error ? error.message : "알림톡 발송 중 오류가 발생했습니다."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* 에러 메시지 */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700">{errorMessage}</span>
          </div>
        </div>
      )}

      {/* 상단 섹션: 카카오 채널 & 알림톡 템플릿 */}
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
              <h3 className="font-medium text-gray-700 mb-3">알림톡 템플릿</h3>

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
                <div className="text-center py-2 text-gray-500 text-sm">
                  사용 가능한 템플릿이 없습니다.
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
              ? (() => {
                  const variableCount = (selectedTemplate.template_content.match(/#{[^}]+}/g) || []).length;
                  return variableCount === 0
                    ? "내용에 변수가 없습니다."
                    : `${variableCount}개의 변수가 존재합니다. 수신번호를 추가해주세요`;
                })()
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
    </>
  );
};

export default AlimtalkTab;
