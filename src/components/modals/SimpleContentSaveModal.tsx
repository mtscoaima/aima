"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface SimpleContentSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: {
    subject?: string;
    content: string;
    isAd?: boolean;
    // 친구톡 지원 필드
    messageType?: string; // 'SMS' | 'FRIENDTALK' 등
    buttons?: Array<{ name: string; type: string; url_mobile?: string; url_pc?: string }>;
    imageUrl?: string;
    imageLink?: string;
    // FW/FL/FC 타입 전용 필드 (2025-11-13 추가)
    friendtalkMessageType?: string; // 'FT' | 'FI' | 'FW' | 'FL' | 'FC'
    headerText?: string; // FL 헤더
    listItems?: Array<{ title: string; image?: { fileId: string; fileName: string; fileSize: number; preview: string } }>; // FL 아이템
    carousels?: Array<{
      content: string;
      image?: { fileId: string; fileName: string; fileSize: number; preview: string };
      buttons: Array<{ name: string; type: string; url_mobile?: string; url_pc?: string }>
    }>; // FC 캐러셀
    moreLink?: string; // FC 더보기 링크
  };
  onSaveSuccess?: () => void;
}

const SimpleContentSaveModal: React.FC<SimpleContentSaveModalProps> = ({
  isOpen,
  onClose,
  currentContent,
  onSaveSuccess,
}) => {
  const router = useRouter();
  const [saveName, setSaveName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!saveName.trim()) {
      alert("저장 이름을 입력하세요.");
      return;
    }

    // FL/FC 타입은 content가 비어있어도 headerText나 listItems/carousels가 있으면 허용
    const isFLorFC = currentContent.friendtalkMessageType === 'FL' || currentContent.friendtalkMessageType === 'FC';
    const hasListData = currentContent.listItems && currentContent.listItems.length > 0;
    const hasCarouselData = currentContent.carousels && currentContent.carousels.length > 0;

    if (!isFLorFC && !currentContent.content.trim()) {
      alert("저장할 메시지 내용이 없습니다.");
      return;
    }

    if (isFLorFC && !hasListData && !hasCarouselData && !currentContent.headerText?.trim()) {
      alert("저장할 내용이 없습니다. 헤더, 아이템 또는 캐러셀을 입력하세요.");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch("/api/sms-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: saveName.trim(),
          content: currentContent.content.trim(),
          subject: currentContent.subject?.trim() || "",
          isPrivate: true,
          messageType: currentContent.messageType || 'SMS',
          buttons: currentContent.buttons || null,
          imageUrl: currentContent.imageUrl || null,
          imageLink: currentContent.imageLink || null,
          // FW/FL/FC 타입 전용 필드 (2025-11-13 추가)
          friendtalkMessageType: currentContent.friendtalkMessageType || null,
          headerText: currentContent.headerText || null,
          listItems: currentContent.listItems || null,
          carousels: currentContent.carousels || null,
          moreLink: currentContent.moreLink || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "템플릿 저장에 실패했습니다");
      }

      alert("템플릿이 저장되었습니다.");
      setSaveName("");
      onSaveSuccess?.();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류";
      alert(`저장 실패: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">내용 저장</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 저장명 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="저장명"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* 내용 - 타입별 미리보기 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>

            {/* FT/FI/FW 타입: 메시지 내용 표시 */}
            {(!currentContent.friendtalkMessageType ||
              currentContent.friendtalkMessageType === 'FT' ||
              currentContent.friendtalkMessageType === 'FI' ||
              currentContent.friendtalkMessageType === 'FW') && (
              <textarea
                value={currentContent.content}
                readOnly
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 resize-none mb-3"
              />
            )}

            {/* FL 타입: 헤더 + 아이템 목록 */}
            {currentContent.friendtalkMessageType === 'FL' && (
              <div className="space-y-2 mb-3">
                <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                  <span className="font-medium">📝 헤더:</span> {currentContent.headerText || '(없음)'}
                </div>
                <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                  <div className="font-medium mb-1">아이템 목록:</div>
                  {currentContent.listItems && currentContent.listItems.length > 0 ? (
                    <ul className="space-y-1 text-xs">
                      {currentContent.listItems.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="font-medium">#{idx + 1}</span>
                          <span>{item.title}</span>
                          {item.image && <span className="text-purple-600">📷</span>}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">(아이템 없음)</p>
                  )}
                </div>
              </div>
            )}

            {/* FC 타입: 캐러셀 목록 */}
            {currentContent.friendtalkMessageType === 'FC' && (
              <div className="space-y-2 mb-3">
                <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                  <div className="font-medium mb-1">캐러셀 카드:</div>
                  {currentContent.carousels && currentContent.carousels.length > 0 ? (
                    <ul className="space-y-2 text-xs">
                      {currentContent.carousels.map((carousel, idx) => (
                        <li key={idx} className="border-l-2 border-purple-400 pl-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">카드 {idx + 1}</span>
                            {carousel.image && <span className="text-purple-600">📷</span>}
                          </div>
                          <p className="text-gray-700">{carousel.content}</p>
                          {carousel.buttons && carousel.buttons.length > 0 && (
                            <p className="text-gray-500 mt-1">버튼 {carousel.buttons.length}개</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500">(캐러셀 없음)</p>
                  )}
                </div>
                {currentContent.moreLink && (
                  <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 truncate">
                    <span className="font-medium">➕ 더보기:</span> {currentContent.moreLink}
                  </div>
                )}
              </div>
            )}

            {/* 이미지 정보 (FT/FI/FW 공통) */}
            {currentContent.imageUrl && (
              <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm">
                <span className="text-purple-600">📷</span>
                <span className="text-gray-700">이미지 1개 포함</span>
              </div>
            )}

            {/* 이미지 링크 (FW 전용) */}
            {currentContent.friendtalkMessageType === 'FW' && currentContent.imageLink && (
              <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm mb-2 truncate">
                <span className="font-medium text-blue-700">🔗 클릭 시 이동:</span> {currentContent.imageLink}
              </div>
            )}

            {/* 버튼 목록 (모든 타입 공통) */}
            {currentContent.buttons && currentContent.buttons.length > 0 && (
              <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                <div className="font-medium text-green-700 mb-1">버튼 ({currentContent.buttons.length}개)</div>
                <ul className="space-y-1 text-xs">
                  {currentContent.buttons.map((btn, idx) => {
                    const typeLabel = btn.type === 'WL' ? '웹링크' :
                                     btn.type === 'AL' ? '앱링크' :
                                     btn.type === 'BK' ? '봇키워드' :
                                     btn.type === 'MD' ? '메시지전달' : btn.type;
                    return (
                      <li key={idx} className="flex items-center gap-2">
                        <span className="font-medium">[{typeLabel}]</span>
                        <span>{btn.name}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={isLoading || !saveName.trim()}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? "저장 중..." : "내용 저장하기"}
          </button>
        </div>

        {/* 하단 */}
        <div className="flex items-center justify-end p-4 border-t bg-gray-50">
          <button
            onClick={() => router.push("/support?tab=contact")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            문의
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            닫기
            <span className="text-xs text-gray-400 ml-2">ESC</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleContentSaveModal;