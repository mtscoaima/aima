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

    if (!currentContent.content.trim()) {
      alert("저장할 메시지 내용이 없습니다.");
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

          {/* 내용 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">내용</label>
            <textarea
              value={currentContent.content}
              readOnly
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 resize-none"
            />
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