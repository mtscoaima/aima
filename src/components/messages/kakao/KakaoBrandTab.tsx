"use client";

import React, { useState, useEffect } from "react";
import { Info, RefreshCw, Plus } from "lucide-react";
import {
  fetchSenderProfiles,
  fetchBrandTemplates,
  type SenderProfile,
  type BrandTemplate,
} from "@/utils/kakaoApi";
import ChannelRegistrationModal from "../../kakao/ChannelRegistrationModal";
import BrandTemplateModal from "../../modals/BrandTemplateModal";

const KakaoBrandTab = () => {
  // 템플릿 타입 아이콘 맵핑
  const getTemplateTypeIcon = (messageType: string) => {
    const iconMap: Record<string, string> = {
      'TEXT': '📄',
      'IMAGE': '🖼️',
      'WIDE': '📱',
      'WIDE_ITEM_LIST': '📋',
      'CAROUSEL_FEED': '🎠',
      'COMMERCE': '🛍️',
      'CAROUSEL_COMMERCE': '🛒',
      'PREMIUM_VIDEO': '🎬',
    };
    return iconMap[messageType] || '📄';
  };

  // 템플릿 상태 레이블 변환 함수
  const getTemplateStatusLabel = (status: string) => {
    // 브랜드 메시지는 status 필드만 사용 (inspection_status 없음)
    const statusMap: Record<string, string> = {
      'A': '승인됨 ✅',
      'S': '중지됨 ⛔',
      'D': '삭제됨 ❌',
    };
    return statusMap[status] || status;
  };

  // 채널 및 템플릿 상태
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [brandTemplates, setBrandTemplates] = useState<BrandTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BrandTemplate | null>(null);

  // 로딩 상태
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // 기타 상태
  const [searchQuery, setSearchQuery] = useState("");
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
      loadBrandTemplates(selectedProfile);
    } else {
      setBrandTemplates([]);
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

  // 브랜드 템플릿 목록 조회
  const loadBrandTemplates = async (senderKey: string, forceSync = false) => {
    setIsLoadingTemplates(true);
    setErrorMessage("");
    try {
      const templates = await fetchBrandTemplates(senderKey, forceSync);
      setBrandTemplates(templates);
    } catch (error) {
      console.error("브랜드 템플릿 조회 실패:", error);
      setErrorMessage(error instanceof Error ? error.message : "브랜드 템플릿 조회 실패");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template: BrandTemplate) => {
    setSelectedTemplate(template);
  };

  // 검색 필터링된 템플릿 목록
  const filteredTemplates = brandTemplates.filter(template => {
    const query = searchQuery.toLowerCase();
    return (
      template.template_name.toLowerCase().includes(query) ||
      template.template_code.toLowerCase().includes(query)
    );
  });

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

      {/* 좌우 영역 구분 */}
      <div className="flex-1 flex gap-6">
        {/* 좌측: 브랜드 템플릿 관리 */}
        <div className="flex-1">
          {/* 카카오 채널 (발신 프로필) */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
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

          {/* 브랜드 템플릿 */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-700">브랜드 템플릿</h3>
              {selectedProfile && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadBrandTemplates(selectedProfile, true)}
                    disabled={isLoadingTemplates}
                    className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="MTS API와 동기화"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingTemplates ? 'animate-spin' : ''}`} />
                    동기화
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

            {/* 검색 */}
            {selectedProfile && (
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="템플릿 이름, 코드 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                />
              </div>
            )}

            {/* 템플릿 목록 */}
            {!selectedProfile ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                채널을 선택하세요
              </div>
            ) : isLoadingTemplates ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                로딩 중...
              </div>
            ) : filteredTemplates.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.template_code}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 border rounded cursor-pointer transition-colors ${
                      selectedTemplate?.template_code === template.template_code
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getTemplateTypeIcon(template.message_type)}</span>
                        <span className="font-medium text-sm">{template.template_name}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {getTemplateStatusLabel(template.status)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      코드: {template.template_code}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? "검색 결과가 없습니다." : "브랜드 템플릿이 없습니다."}
              </div>
            )}
          </div>
        </div>

        {/* 우측: 템플릿 미리보기 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-4">템플릿 미리보기</h3>

            {selectedTemplate ? (
              <div className="space-y-4">
                {/* 템플릿 정보 */}
                <div className="border-b border-gray-200 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getTemplateTypeIcon(selectedTemplate.message_type)}</span>
                    <div>
                      <div className="font-medium">{selectedTemplate.template_name}</div>
                      <div className="text-xs text-gray-500">
                        {selectedTemplate.template_code}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">상태:</span>
                    <span>{getTemplateStatusLabel(selectedTemplate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="text-gray-600">타입:</span>
                    <span>{selectedTemplate.message_type}</span>
                  </div>
                </div>

                {/* 메시지 내용 */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">메시지 내용</div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200 whitespace-pre-wrap text-sm">
                    {selectedTemplate.content}
                  </div>
                </div>

                {/* 버튼 정보 */}
                {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">버튼</div>
                    <div className="space-y-2">
                      {selectedTemplate.buttons.map((button, index) => (
                        <div key={index} className="bg-gray-50 p-2 rounded border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{button.name}</span>
                            <span className="text-xs text-gray-500">{button.type}</span>
                          </div>
                          {(button.url_mobile || button.url_pc) && (
                            <div className="text-xs text-gray-600 mt-1 truncate">
                              {button.url_mobile || button.url_pc}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-400">
                템플릿을 선택하면 미리보기가 표시됩니다.
              </div>
            )}
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

      {/* 브랜드 템플릿 등록 모달 */}
      <BrandTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSuccess={() => {
          setIsTemplateModalOpen(false);
          loadBrandTemplates(selectedProfile);
        }}
        senderKey={selectedProfile}
      />
    </div>
  );
};

export default KakaoBrandTab;
