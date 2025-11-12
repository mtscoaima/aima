"use client";

import React, { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import { Info, RefreshCw, Send, Image as ImageIcon, FileText, Upload, Save, X } from "lucide-react";
import {
  fetchSenderProfiles,
  sendFriendtalk,
  type SenderProfile,
} from "@/utils/kakaoApi";
import { replaceVariables as replaceStandardVariables, countReplaceableVariables } from '@/utils/messageVariables';
import SimpleContentSaveModal from "@/components/modals/SimpleContentSaveModal";
import LoadContentModal from "@/components/modals/LoadContentModal";
import FriendtalkButtonModal from "@/components/modals/FriendtalkButtonModal";

interface Recipient {
  phone_number: string;
  name?: string;
  group_name?: string; // 추가
  variables?: Record<string, string>;
}

interface FriendtalkTabProps {
  recipients?: Recipient[]; // 상위 컴포넌트에서 전달받는 수신자 목록 (전화번호 + 이름)
  callbackNumber?: string; // 발신번호
  onSendComplete?: (result: unknown) => void; // 발송 완료 콜백
}

interface UploadedImage {
  fileId: string;
  fileName: string;
  fileSize: number;
  preview: string;
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
  const [adFlag, setAdFlag] = useState<'Y' | 'N'>('N');
  const [message, setMessage] = useState("");
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [enableSmsBackup, setEnableSmsBackup] = useState(false);
  const [smsBackupMessage, setSmsBackupMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // UI 관련 state
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [imageLink, setImageLink] = useState("");
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 버튼 및 모달 관련 state
  const [buttons, setButtons] = useState<Array<{ name: string; type: string; url_mobile?: string; url_pc?: string }>>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [loadModalActiveTab, setLoadModalActiveTab] = useState<"saved" | "recent">("saved");
  const [isButtonModalOpen, setIsButtonModalOpen] = useState(false);

  // 사용자 정보 (변수 치환용)
  const [userInfo, setUserInfo] = useState({
    phone: '',
    name: '',
    companyName: '',
  });

  // 치환 가능한 변수 개수 계산
  const replaceableVariableCount = countReplaceableVariables(message);

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

  // 치환문구 추가
  const addReplaceText = () => {
    const textarea = messageInputRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = message.substring(0, start) + "#{변수명}" + message.substring(end);
    setMessage(newText);

    // 커서 위치 조정
    setTimeout(() => {
      textarea.selectionStart = start + 2;
      textarea.selectionEnd = start + 6;
      textarea.focus();
    }, 0);
  };

  // 저장내용 모달 열기
  const handleSavedContentClick = () => {
    setLoadModalActiveTab("saved");
    setIsLoadModalOpen(true);
  };

  // 최근발송 모달 열기
  const handleRecentSentClick = () => {
    setLoadModalActiveTab("recent");
    setIsLoadModalOpen(true);
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검증 (클라이언트측 5MB, 백엔드에서 자동 최적화)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert(`이미지 크기는 5MB 이하여야 합니다.\n현재 크기: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      event.target.value = "";
      return;
    }

    // 파일 형식 검증
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      alert("JPG, JPEG, PNG 형식만 지원됩니다.");
      event.target.value = "";
      return;
    }

    // 최대 1개 제한 (친구톡은 1개만 가능)
    if (uploadedImages.length >= 1) {
      alert("친구톡 이미지는 1개만 첨부할 수 있습니다.");
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setErrorMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      // senderKey 확인
      if (!selectedProfile) {
        throw new Error("발신 프로필을 먼저 선택해주세요");
      }

      // FormData 생성
      const formData = new FormData();
      formData.append("file", file);
      formData.append("senderKey", selectedProfile); // Kakao 업로드 API는 senderKey 필수


      // Kakao 전용 이미지 업로드 API 호출
      // MTS 서버 이미지는 Kakao에서 접근 불가하므로 Kakao 서버에 업로드
      const response = await fetch("/api/messages/kakao/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "이미지 업로드 실패");
      }

      const data = await response.json();

      if (!data.success || !data.imageUrl) {
        throw new Error('이미지 URL을 받지 못했습니다');
      }

      // 미리보기 URL 생성
      const previewUrl = URL.createObjectURL(file);

      // 업로드된 이미지 추가
      setUploadedImages([
        {
          fileId: data.imageUrl, // Kakao 서버 이미지 URL (https://mud-kage.kakao.com/...)
          fileName: file.name,
          fileSize: data.fileSize,
          preview: previewUrl,
        },
      ]);

    } catch (error) {
      console.error('[친구톡 이미지 업로드 실패]', error);
      setErrorMessage(error instanceof Error ? error.message : '이미지 업로드 실패');
      alert(error instanceof Error ? error.message : '이미지 업로드 실패');
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  // 이미지 삭제 핸들러
  const handleRemoveImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);

    // 미리보기 URL 해제
    if (uploadedImages[index].preview) {
      URL.revokeObjectURL(uploadedImages[index].preview);
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
      // 업로드된 이미지의 fileId 배열 생성
      const imageFileIds = uploadedImages.map(img => img.fileId);

      // 메시지 타입 자동 감지: 이미지가 있으면 FI, 없으면 FT
      const autoDetectedType = imageFileIds.length > 0 ? 'FI' : 'FT';

      // 각 수신자별로 변수 치환된 메시지 생성
      const processedRecipients = recipients.map(recipient => {
        // Step 1: 자동 변수 치환 (messageVariables.ts의 replaceStandardVariables 함수)
        let replacedMessage = replaceStandardVariables(
          message,
          {
            name: recipient.name,
            phone: recipient.phone_number,
            groupName: recipient.group_name || recipient.variables?.['그룹명'],
          },
          userInfo
        );

        // Step 2: 커스텀 변수 추가 치환 (SMS 발송과 동일한 로직)
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
          phone_number: recipient.phone_number,
          name: recipient.name,
          replacedMessage: replacedMessage,
        };
      });

      // 각 수신자에게 개별 발송 (변수 치환된 메시지로)
      let successCount = 0;
      let failCount = 0;

      for (const recipient of processedRecipients) {
        try {
          const result = await sendFriendtalk({
            senderKey: selectedProfile,
            recipients: [{ phone_number: recipient.phone_number, name: recipient.name }],
            message: recipient.replacedMessage, // 치환된 메시지 사용
            callbackNumber: callbackNumber,
            messageType: autoDetectedType,
            adFlag: adFlag,
            imageUrls: imageFileIds.length > 0 ? imageFileIds : undefined,
            imageLink: imageLink.trim() || undefined,
            buttons: buttons.length > 0 ? buttons : undefined, // 버튼 추가
            tranType: enableSmsBackup ? "SMS" : undefined,
            tranMessage: enableSmsBackup ? smsBackupMessage : undefined,
          });

          if (result.successCount > 0) successCount++;
          else failCount++;
        } catch (error) {
          failCount++;
          console.error(`발송 실패 (${recipient.phone_number}):`, error);
        }
      }

      alert(
        `친구톡 발송 완료\n성공: ${successCount}건\n실패: ${failCount}건`
      );

      if (onSendComplete) {
        onSendComplete({ successCount, failCount });
      }

      // 발송 후 메시지 초기화
      setMessage("");
      setUploadedImages([]);
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

      {/* 메시지 타입 자동 감지 안내 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">메시지 타입 자동 감지</p>
            <p className="text-blue-700">
              이미지가 첨부되면 <strong>이미지형(FI)</strong>으로, 첨부되지 않으면 <strong>텍스트형(FT)</strong>으로 자동 선택됩니다.
            </p>
            <p className="text-blue-600 text-xs mt-2">
              ※ 와이드 이미지(FW), 와이드 리스트(FL), 캐러셀(FC) 타입이 필요한 경우 별도로 문의해주세요.
            </p>
          </div>
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
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          메시지 내용
        </label>
        <div className="flex flex-col">
          <textarea
            ref={messageInputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="이곳에 문자 내용을 입력합니다&#10;치환문구 예시) #{이름}님 #{날짜} 방문 예약입니다."
            className="w-full p-3 border border-gray-300 rounded text-sm resize-none min-h-[300px]"
            maxLength={1000}
          />

          {/* 하단 도구바 */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-3">
              {/* 아이콘 버튼들 */}
              <button
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={addReplaceText}
                title="치환문구 추가"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setShowImageUpload(!showImageUpload)}
                title="이미지 첨부"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              <button
                className="p-2 text-gray-500 hover:text-gray-700"
                onClick={() => setIsSaveModalOpen(true)}
                title="템플릿 저장하기"
              >
                <Save className="w-4 h-4" />
              </button>

              {/* 텍스트 버튼들 */}
              <button
                className="text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
                onClick={handleSavedContentClick}
              >
                저장내용
              </button>
              <button
                className="text-xs text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
                onClick={handleRecentSentClick}
              >
                최근발송
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{message.length} / 1,000 자</span>
              <Info className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>


      {/* 이미지 업로드 (토글) */}
      {showImageUpload && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>이미지 첨부</span>
              </div>
            </label>
            {uploadedImages.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "업로드 중..." : "이미지 선택"}
              </button>
            )}
          </div>

          {/* 카카오 친구톡 이미지 규격 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-blue-800 space-y-1">
                <p className="font-medium">카카오 친구톡 이미지 안내</p>
                <ul className="list-disc list-inside text-xs space-y-1 text-blue-700">
                  <li>권장 비율: <strong>2:1 (가로:세로)</strong> - 예: 1000x500px, 800x400px</li>
                  <li>최소 크기: 가로 500px 이상</li>
                  <li>파일 형식: JPG, PNG</li>
                  <li>최대 용량: 500KB (자동 최적화)</li>
                  <li className="text-amber-700 font-medium">⚠️ 2:1 비율이 아닌 이미지는 자동으로 중앙 기준 잘립니다</li>
                </ul>
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleImageUpload}
            className="hidden"
          />

          {/* 업로드된 이미지 미리보기 */}
          {uploadedImages.length > 0 && (
            <div className="border border-gray-200 rounded-lg p-3">
              {uploadedImages.map((image, index) => (
                <div key={index} className="flex items-center gap-3">
                  <NextImage
                    src={image.preview}
                    alt={image.fileName}
                    width={64}
                    height={64}
                    className="object-cover rounded border border-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {image.fileName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(image.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-xs text-gray-700 space-y-1">
              <p>• 최대 1개, 5MB 이하, JPG/PNG 형식만 가능 (자동 최적화: 300KB 이하)</p>
              <p>• 이미지를 첨부하면 자동으로 <strong>이미지형(FI)</strong>으로 발송됩니다</p>
            </div>
          </div>
        </div>
      )}

      {/* 카카오톡 버튼 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-medium text-gray-700">카카오톡 버튼</span>
          <span className="text-xs text-gray-500">(최대 5개, WL 타입만 지원)</span>
        </div>

        {buttons.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-gray-300 rounded">
            <button
              className="text-blue-600 text-sm hover:text-blue-700"
              onClick={() => setIsButtonModalOpen(true)}
            >
              + 버튼 추가
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {buttons.map((button, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium text-sm">{button.name}</span>
                  <span className="text-xs text-gray-500 ml-2">({button.type})</span>
                </div>
                <button
                  onClick={() => {
                    setButtons(buttons.filter((_, i) => i !== index));
                  }}
                  className="text-red-600 hover:text-red-700 text-xs px-2 py-1"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              onClick={() => setIsButtonModalOpen(true)}
              disabled={buttons.length >= 5}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              + 버튼 추가 ({buttons.length}/5)
            </button>
          </div>
        )}
      </div>

      {/* 문구 치환 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">문구 치환</span>
        </div>
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <span className="text-sm text-gray-600">
            {replaceableVariableCount === 0
              ? "내용에 치환 가능한 변수가 없습니다."
              : `${replaceableVariableCount}개의 변수가 자동으로 치환됩니다.`
            }
          </span>
        </div>
      </div>

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
        disabled={isSending || isUploading || !selectedProfile || !message.trim()}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>이미지 업로드 중...</span>
          </>
        ) : isSending ? (
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

      {/* 템플릿 저장 모달 */}
      <SimpleContentSaveModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        currentContent={{
          content: message,
          messageType: 'FRIENDTALK',
          buttons: buttons.length > 0 ? buttons : undefined,
          imageUrl: uploadedImages.length > 0 ? uploadedImages[0].fileId : undefined,
          imageLink: imageLink.trim() || undefined,
        }}
        onSaveSuccess={() => {
          setIsSaveModalOpen(false);
          alert("템플릿이 저장되었습니다.");
        }}
      />

      {/* 템플릿/최근발송 불러오기 모달 */}
      <LoadContentModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        initialActiveTab={loadModalActiveTab}
        messageTypeFilter="FRIENDTALK"
        onSelect={(content) => {
          setMessage(content.content);
          if (content.buttons) setButtons(content.buttons);
          if (content.imageUrl) {
            // 이미지 복원
            setUploadedImages([{
              fileId: content.imageUrl,
              fileName: '불러온 이미지',
              fileSize: 0,
              preview: content.imageUrl,
            }]);
          }
          if (content.imageLink) setImageLink(content.imageLink);
          setIsLoadModalOpen(false);
        }}
      />

      {/* 버튼 추가/수정 모달 */}
      <FriendtalkButtonModal
        isOpen={isButtonModalOpen}
        onClose={() => setIsButtonModalOpen(false)}
        buttons={buttons as Array<{ name: string; type: 'WL'; url_mobile: string; url_pc?: string }>}
        onSave={(newButtons) => {
          setButtons(newButtons as Array<{ name: string; type: string; url_mobile?: string; url_pc?: string }>);
          setIsButtonModalOpen(false);
        }}
      />
    </div>
  );
};

export default FriendtalkTab;
