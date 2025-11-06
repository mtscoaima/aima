"use client";

import React, { useState, useEffect } from "react";
import { Info, RefreshCw, Send, HelpCircle } from "lucide-react";
import Image from "next/image";
import {
  fetchSenderProfiles,
  fetchBrandTemplates,
  sendBrandMessage,
  type SenderProfile,
  type BrandTemplate,
  type Recipient,
} from "@/utils/kakaoApi";
import { replaceVariables as replaceStandardVariables, countReplaceableVariables } from '@/utils/messageVariables';
import ChannelRegistrationModal from "../kakao/ChannelRegistrationModal";
import BrandTemplateModal from "../modals/BrandTemplateModal";

interface BrandTabProps {
  recipients: Recipient[];
  callbackNumber: string;
}

// 템플릿 타입 정보
const templateTypes: Record<string, { title: string; description: string; imagePath: string }> = {
  TEXT: {
    title: "텍스트형",
    description: "일반 텍스트형 메시지를 발송합니다.",
    imagePath: "/images/kakao_brand_message/텍스트형.png"
  },
  IMAGE: {
    title: "이미지형",
    description: "이미지를 포함한 메시지를 발송합니다.",
    imagePath: "/images/kakao_brand_message/이미지형.png"
  },
  WIDE: {
    title: "와이드형",
    description: "대화방에 이미지가 더 넓게 보여집니다.",
    imagePath: "/images/kakao_brand_message/와이드형.png"
  },
  WIDE_ITEM_LIST: {
    title: "와이드리스트형",
    description: "(친구 전용) 넓은 이미지와 함께 목록을 표기합니다.",
    imagePath: "/images/kakao_brand_message/와이드리스트형.png"
  },
  CAROUSEL_FEED: {
    title: "캐러셀피드형",
    description: "슬라이드 형식으로 메시지를 조회할 수 있습니다.",
    imagePath: "/images/kakao_brand_message/캐러셀피드형.png"
  },
  COMMERCE: {
    title: "커머스형",
    description: "(친구 전용) 상품 정보를 포함한 카카오톡 메시지입니다.",
    imagePath: "/images/kakao_brand_message/커머스형.png"
  },
  CAROUSEL_COMMERCE: {
    title: "캐러셀커머스형",
    description: "(친구 전용) 슬라이드 형식으로 상품 정보를 조회할 수 있습니다.",
    imagePath: "/images/kakao_brand_message/캐러셀커머스형.png"
  },
  PREMIUM_VIDEO: {
    title: "프리미엄동영상",
    description: "동영상이 포함된 프리미엄 메시지입니다.",
    imagePath: "/images/kakao_brand_message/video.jpg"
  }
};

const BrandTab: React.FC<BrandTabProps> = ({ recipients, callbackNumber }) => {
  // 상태 관리
  const [senderProfiles, setSenderProfiles] = useState<SenderProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string>("");
  const [brandTemplates, setBrandTemplates] = useState<BrandTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<BrandTemplate | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedFormatType, setSelectedFormatType] = useState<keyof typeof templateTypes>("WIDE");

  // 수신 대상 선택 (targeting)
  const [targetingType, setTargetingType] = useState<'M' | 'N' | 'I'>('I');

  // SMS 백업 설정
  const [enableSmsBackup, setEnableSmsBackup] = useState(false);
  const [smsBackupMessage, setSmsBackupMessage] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // 사용자 정보 (변수 치환용)
  const [userInfo, setUserInfo] = useState({
    phone: '',
    name: '',
    companyName: '',
  });

  // 컴포넌트 마운트 시 발신 프로필 조회
  useEffect(() => {
    loadSenderProfiles();
  }, []);

  // 사용자 정보 조회 (변수 치환용)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        const response = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        setUserInfo({
          phone: data.phoneNumber || '',
          name: data.name || '',
          companyName: data.companyInfo?.companyName || '',
        });
      } catch (error) {
        console.error('사용자 정보 조회 오류:', error);
      }
    };

    fetchUserInfo();
  }, []);

  // 발신 프로필 선택 시 브랜드 템플릿 조회
  useEffect(() => {
    if (selectedProfile) {
      loadBrandTemplates(selectedProfile);
    } else {
      setBrandTemplates([]);
      setSelectedTemplate(null);
    }
  }, [selectedProfile]);

  // 템플릿 선택 시 포맷 타입 자동 설정
  useEffect(() => {
    if (selectedTemplate) {
      setSelectedFormatType(selectedTemplate.message_type as keyof typeof templateTypes);
    }
  }, [selectedTemplate]);

  // 발신 프로필 조회
  const loadSenderProfiles = async () => {
    setIsLoadingProfiles(true);
    setErrorMessage("");
    try {
      const profiles = await fetchSenderProfiles();
      setSenderProfiles(profiles);

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

  // 브랜드 템플릿 조회
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

  // 템플릿 검수 상태 라벨 생성
  const getTemplateStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'A': '승인됨 ✅',
      'S': '중지됨 ⛔',
      'D': '삭제됨 ❌',
    };
    return statusMap[status] || status;
  };

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template: BrandTemplate) => {
    setSelectedTemplate(template);
  };

  // 브랜드 메시지 발송
  const handleSendBrandMessage = async () => {
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
      alert("수신자를 추가해주세요.");
      return;
    }

    if (!callbackNumber) {
      alert("발신번호를 선택해주세요.");
      return;
    }

    // 전환 발송 메시지 검증
    if (enableSmsBackup && !smsBackupMessage.trim()) {
      alert("문자대체발송 메시지를 입력해주세요.");
      return;
    }

    // 발송 확인
    const confirmed = window.confirm(
      `${recipients.length}명에게 브랜드 메시지를 발송하시겠습니까?`
    );
    if (!confirmed) return;

    setIsSending(true);
    setErrorMessage("");

    try {
      // 각 수신자별로 변수 치환된 메시지 생성
      const processedRecipients = recipients.map(recipient => {
        // Step 1: 표준 변수 치환 (messageVariables.ts의 replaceStandardVariables 함수)
        let replacedMessage = replaceStandardVariables(
          selectedTemplate.content,
          {
            name: recipient.name,
            phone: recipient.phone_number,
            groupName: recipient.group_name || recipient.variables?.['그룹명'],
          },
          userInfo
        );

        // Step 2: 커스텀 변수 추가 치환
        if (recipient.variables) {
          for (const [key, value] of Object.entries(recipient.variables)) {
            // 기본 변수가 아닌 커스텀 변수만 치환
            if (!['이름', '전화번호', '그룹명', '오늘날짜', '현재시간', '요일', '발신번호', '회사명', '담당자명'].includes(key)) {
              const pattern = new RegExp(`#{${key}}`, 'g');
              replacedMessage = replacedMessage.replace(pattern, value);
            }
          }
        }

        return {
          ...recipient,
          replacedMessage: replacedMessage,
        };
      });

      // 자동 타입 결정 로직
      let tranType: 'N' | 'S' | 'L' | 'M' = 'N';
      let subject = '';

      if (enableSmsBackup && smsBackupMessage) {
        const messageLength = smsBackupMessage.length;

        // 90바이트(한글 45자) 이하 → SMS
        if (messageLength <= 45) {
          tranType = 'S';
        }
        // 2000바이트(한글 1000자) 이하 → LMS
        else if (messageLength <= 1000) {
          tranType = 'L';
          subject = selectedTemplate.template_name; // LMS는 제목 사용
        }
        // 2000바이트 초과 → MMS
        else {
          tranType = 'M';
          subject = selectedTemplate.template_name; // MMS는 제목 사용
        }
      }

      const result = await sendBrandMessage({
        senderKey: selectedProfile,
        templateCode: selectedTemplate.template_code,
        recipients: processedRecipients,
        message: selectedTemplate.content, // 원본 템플릿 (백업용)
        callbackNumber: callbackNumber,
        messageType: selectedTemplate.message_type as 'TEXT' | 'IMAGE' | 'WIDE' | 'WIDE_ITEM_LIST' | 'CAROUSEL_FEED' | 'PREMIUM_VIDEO',
        // 버튼이 실제로 존재할 때만 attachment 생성
        attachment: selectedTemplate.buttons && selectedTemplate.buttons.length > 0 ? {
          button: selectedTemplate.buttons.map(btn => ({
            type: btn.type as 'WL' | 'AL' | 'BK' | 'MD' | 'AC',
            url_mobile: btn.url_mobile,
            url_pc: btn.url_pc,
          }))
        } : undefined,
        targeting: targetingType, // 수신 대상 선택 (M/N/I)
        tranType: tranType,
        tranMessage: tranType !== 'N' ? smsBackupMessage : undefined,
        subject: subject || undefined,
      });

      if (result.success) {
        alert(
          `브랜드 메시지 발송 완료\n성공: ${result.results.filter((r: { success: boolean }) => r.success).length}건\n실패: ${result.results.filter((r: { success: boolean }) => !r.success).length}건`
        );

        // 폼 초기화
        setEnableSmsBackup(false);
        setSmsBackupMessage("");
      } else {
        throw new Error(result.error || "브랜드 메시지 발송 실패");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "브랜드 메시지 발송 중 오류가 발생했습니다.";
      setErrorMessage(errorMessage);
      alert(errorMessage);
      console.error("브랜드 메시지 발송 오류:", error);
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

      {/* 상단 섹션: 카카오 채널 + 브랜드 템플릿 */}
      <div className="mb-4">
        <div className="flex gap-6">
          {/* 좌측: 카카오 채널 */}
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
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 text-sm">
                    연동된 채널이 없습니다.
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 rounded text-sm font-medium text-white hover:opacity-90"
                    style={{ backgroundColor: "#795548" }}
                  >
                    채널 연동하기 ＞
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 우측: 브랜드 템플릿 */}
          <div className="flex-1">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-700">브랜드 템플릿</h3>
                {selectedProfile && (
                  <button
                    onClick={() => loadBrandTemplates(selectedProfile, true)}
                    disabled={isLoadingTemplates}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    title="템플릿 동기화"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isLoadingTemplates ? "animate-spin" : ""}`}
                    />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between">
                {!selectedProfile ? (
                  <div className="text-center py-3.5 text-gray-500 text-sm">
                    먼저 카카오 채널을 선택해주세요.
                  </div>
                ) : isLoadingTemplates ? (
                  <div className="text-sm text-gray-500">로딩 중...</div>
                ) : brandTemplates.length > 0 ? (
                  <select
                    value={selectedTemplate?.template_code || ""}
                    onChange={(e) => {
                      const template = brandTemplates.find(
                        (t) => t.template_code === e.target.value
                      );
                      if (template) handleTemplateSelect(template);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">템플릿을 선택하세요</option>
                    {brandTemplates.map((template) => (
                      <option key={template.template_code} value={template.template_code}>
                        {template.template_name} ({getTemplateStatusLabel(template.status)})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center py-3.5 text-gray-500 text-sm">
                    사용 가능한 템플릿이 없습니다.
                  </div>
                )}
                <button className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm hover:bg-gray-200 ml-2">
                  선택
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 템플릿 미리보기 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="mb-3">
          <h3 className="font-medium text-gray-700">템플릿 미리보기</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {selectedTemplate ? `${selectedTemplate.template_name} 템플릿이 선택되었습니다.` : "아직 템플릿을 선택하지 않았습니다."}
        </p>

        {/* 템플릿 카테고리 버튼들 */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
              selectedFormatType === "TEXT"
                ? "border-[#795548]"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            style={selectedFormatType === "TEXT" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
            onClick={() => setSelectedFormatType("TEXT")}
          >
            📄 텍스트형
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
              selectedFormatType === "IMAGE"
                ? "border-[#795548]"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            style={selectedFormatType === "IMAGE" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
            onClick={() => setSelectedFormatType("IMAGE")}
          >
            🖼️ 이미지형
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
              selectedFormatType === "WIDE"
                ? "border-[#795548]"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            style={selectedFormatType === "WIDE" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
            onClick={() => setSelectedFormatType("WIDE")}
          >
            📊 와이드형
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
              selectedFormatType === "WIDE_ITEM_LIST"
                ? "border-[#795548]"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            style={selectedFormatType === "WIDE_ITEM_LIST" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
            onClick={() => setSelectedFormatType("WIDE_ITEM_LIST")}
          >
            📱 와이드리스트형
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
              selectedFormatType === "CAROUSEL_FEED"
                ? "border-[#795548]"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            style={selectedFormatType === "CAROUSEL_FEED" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
            onClick={() => setSelectedFormatType("CAROUSEL_FEED")}
          >
            🔍 캐러셀피드형
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
              selectedFormatType === "COMMERCE"
                ? "border-[#795548]"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            style={selectedFormatType === "COMMERCE" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
            onClick={() => setSelectedFormatType("COMMERCE")}
          >
            💬 커머스형
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 border rounded text-sm ${
              selectedFormatType === "CAROUSEL_COMMERCE"
                ? "border-[#795548]"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
            style={selectedFormatType === "CAROUSEL_COMMERCE" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
            onClick={() => setSelectedFormatType("CAROUSEL_COMMERCE")}
          >
            📅 캐러셀커머스형
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded text-sm text-gray-400 cursor-not-allowed bg-gray-50"
            disabled
          >
            🎨 프리미엄동영상
          </button>
        </div>
      </div>

      {/* 템플릿 정보 + 예시 이미지 */}
      <div className="flex gap-6 mb-4">
        {/* 좌측: 템플릿 정보 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="font-medium text-gray-700">{templateTypes[selectedFormatType]?.title}</span>
            </div>
            <p className="text-sm text-gray-600">
              {templateTypes[selectedFormatType]?.description}
            </p>
          </div>
        </div>

        {/* 우측: 템플릿 예시 이미지 */}
        <div className="w-80">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-700 mb-4">템플릿 예시</h4>

            <div className="w-full h-96 border border-gray-300 rounded bg-gray-50 flex items-center justify-center overflow-hidden">
              <Image
                src={templateTypes[selectedFormatType]?.imagePath || ''}
                alt={`${templateTypes[selectedFormatType]?.title} 예시`}
                width={320}
                height={384}
                className="max-w-full max-h-full object-contain"
                unoptimized={true}
              />
            </div>

            <div className="text-xs text-gray-500 mt-4">
              <p className="font-medium text-gray-700 mb-1">{templateTypes[selectedFormatType]?.title} 특징</p>
              <p>• 카카오 비즈니스 메시지 템플릿</p>
              <p>• 승인 후 발송 가능</p>
              <p>• 높은 도달률과 가독성</p>
            </div>
          </div>
        </div>
      </div>

      {/* 전체수신번호 + 수신대상 정보 */}
      <div className="flex gap-6 mb-4">
        {/* 좌측: 전체수신번호 */}
        <div className="w-1/3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm text-gray-400 mb-4">전체수신번호</h4>

            {/* 겹치는 원형 차트 */}
            <div className="relative w-full h-32 mx-auto mb-4 overflow-hidden">
              {/* 앞쪽 원 (마케팅 수신 동의자) */}
              <div className="absolute w-32 h-32 left-0">
                <div className="w-full h-full border-4 border-gray-200 rounded-full opacity-50"></div>
                {/* 앞쪽 원 텍스트 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm text-gray-400">마케팅수신동의자</div>
                  </div>
                </div>
              </div>

              {/* 뒤쪽 원 (채널친구) */}
              <div className="absolute w-32 h-32 right-0">
                <div className="w-full h-full bg-yellow-400/60 rounded-full"></div>
                {/* 뒤쪽 원 텍스트 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-bold opacity-60">채널친구</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 수신대상 정보 */}
        <div className="w-2/3">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex gap-0 border-b border-gray-300 mb-4">
              <button
                onClick={() => setTargetingType('I')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  targetingType === 'I'
                    ? 'text-blue-600 bg-white border-blue-600'
                    : 'text-gray-600 bg-gray-50 border-transparent hover:bg-gray-100'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setTargetingType('M')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  targetingType === 'M'
                    ? 'text-blue-600 bg-white border-blue-600'
                    : 'text-gray-600 bg-gray-50 border-transparent hover:bg-gray-100'
                }`}
              >
                수신동의자만
              </button>
              <button
                onClick={() => setTargetingType('N')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  targetingType === 'N'
                    ? 'text-blue-600 bg-white border-blue-600'
                    : 'text-gray-600 bg-gray-50 border-transparent hover:bg-gray-100'
                }`}
              >
                채널친구만
              </button>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">
                  수신대상 : {targetingType === 'I' ? '전체' : targetingType === 'M' ? '수신동의자만' : '채널친구만'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {targetingType === 'I' && '현재 수신번호 내에서 카카오 채널 친구추가한 사용자에게 발송합니다.'}
                {targetingType === 'M' && '현재 수신번호 내에서 카카오톡 수신 동의한 사용자에게 발송합니다.'}
                {targetingType === 'N' && '현재 수신번호 내에서 카카오톡 수신 동의 + 채널 친구인 사용자에게 발송합니다.'}
              </p>
            </div>
          </div>
        </div>
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
                  const replaceableCount = countReplaceableVariables(selectedTemplate.content);
                  return replaceableCount === 0
                    ? "내용에 치환 가능한 변수가 없습니다."
                    : `${replaceableCount}개의 변수가 자동으로 치환됩니다.`;
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
            placeholder="브랜드 메시지 발송 실패 시 전송할 문자 메시지를 입력하세요."
            className="w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[100px]"
            value={smsBackupMessage}
            onChange={(e) => setSmsBackupMessage(e.target.value)}
          />
        )}
      </div>

      {/* 수신자 정보 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
      <div className="flex justify-end">
        <button
          onClick={handleSendBrandMessage}
          disabled={isSending || !selectedProfile || !selectedTemplate || recipients.length === 0}
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
              브랜드 메시지 발송
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
    </>
  );
};

export default BrandTab;
