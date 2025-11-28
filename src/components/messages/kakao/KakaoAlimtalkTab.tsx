"use client";

import React, { useState, useEffect } from "react";
import { Info, RefreshCw, Plus, Trash2 } from "lucide-react";
import {
  fetchSenderProfiles,
  fetchAlimtalkTemplates,
  type SenderProfile,
  type AlimtalkTemplate,
} from "@/utils/kakaoApi";
import ChannelRegistrationModal from "../../kakao/ChannelRegistrationModal";
import TemplateCreateModal from "../../kakao/TemplateCreateModal";

const KakaoAlimtalkTab = () => {
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

  // 채널 및 템플릿 상태
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [alimtalkTemplates, setAlimtalkTemplates] = useState<AlimtalkTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AlimtalkTemplate | null>(null);

  // 로딩 상태
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 기타 상태
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
  const loadTemplates = async (senderKey: string, forceSync = false) => {
    setIsLoadingTemplates(true);
    setErrorMessage("");
    try {
      const templates = await fetchAlimtalkTemplates(senderKey, forceSync);
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

  // 템플릿 삭제 핸들러
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    const confirmed = window.confirm(
      `"${selectedTemplate.template_name}" 템플릿을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/messages/kakao/alimtalk/templates?id=${selectedTemplate.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "템플릿 삭제 실패");
      }

      // 삭제 성공 시 템플릿 목록 새로고침
      setSelectedTemplate(null);
      if (selectedProfile) {
        await loadTemplates(selectedProfile);
      }
    } catch (error) {
      console.error("템플릿 삭제 실패:", error);
      setErrorMessage(error instanceof Error ? error.message : "템플릿 삭제 실패");
    } finally {
      setIsDeleting(false);
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadTemplates(selectedProfile, true)}
                      disabled={isLoadingTemplates}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="템플릿 상태 새로고침"
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingTemplates ? 'animate-spin' : ''}`} />
                      새로고침
                    </button>
                    <button
                      onClick={handleDeleteTemplate}
                      disabled={!selectedTemplate || isDeleting}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="선택한 템플릿 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                      삭제
                    </button>
                    <button
                      onClick={() => setIsTemplateModalOpen(true)}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4" />
                      템플릿 추가
                    </button>
                  </div>
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

      {/* 템플릿 내용 미리보기 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium text-gray-700 mb-3">템플릿 내용 미리보기</h3>
        {selectedTemplate ? (
          <>
            <div className="mb-2">
              <span className="text-sm text-gray-600">템플릿 코드: </span>
              <span className="text-sm font-medium text-gray-800">{selectedTemplate.template_code}</span>
            </div>
            <div className="mb-2">
              <span className="text-sm text-gray-600">상태: </span>
              <span className="text-sm font-medium text-gray-800">{getTemplateStatusLabel(selectedTemplate)}</span>
            </div>
            <textarea
              className="w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[200px] bg-gray-50"
              value={selectedTemplate.template_content}
              readOnly
            />
          </>
        ) : (
          <div className="text-center py-8 text-gray-500 text-sm">
            템플릿을 선택하면 미리보기가 표시됩니다.
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">이 페이지는 템플릿 관리 전용입니다</p>
            <p>실제 알림톡 발송은 <strong>&quot;메시지 보내기&quot;</strong> 탭에서 진행해주세요.</p>
          </div>
        </div>
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
