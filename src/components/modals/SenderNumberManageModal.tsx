"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Search, Phone, Settings, Headset } from "lucide-react";
import SenderNumberRegistrationModal from "./SenderNumberRegistrationModal";
import LimitRemovalModal from "./LimitRemovalModal";

interface SenderNumberManageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SenderNumberManageModal: React.FC<SenderNumberManageModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("register");
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [isLimitRemovalModalOpen, setIsLimitRemovalModalOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">발신번호 관리</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 상단 버튼과 검색 영역 */}
        <div className="flex items-center gap-4 p-4 border-b">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
              activeTab === "register"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100 border border-gray-300"
            }`}
            onClick={() => {
              setActiveTab("register");
              setIsRegistrationModalOpen(true);
            }}
          >
            <Phone className="w-4 h-4" />
            새 발신번호 등록
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium ${
              activeTab === "manage"
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-gray-100 border border-gray-300"
            }`}
            onClick={() => {
              setActiveTab("manage");
              setIsLimitRemovalModalOpen(true);
            }}
          >
            <Settings className="w-4 h-4" />
            개수 제한 해제
          </button>
          <div className="text-xs text-gray-500 whitespace-nowrap">
            현재 0개 / 최대 5개
          </div>
          <div className="flex-1"></div>
          <div className="relative w-64">
            <input
              type="text"
              placeholder="발신번호 / 별칭 검색"
              className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {/* 테이블 헤더 */}
          <div className="bg-gray-50 px-4 py-3 border-b">
            <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
              <span>발신번호</span>
              <span>상태</span>
              <span>변호인증</span>
              <span>만료일</span>
              <span>최근 이력</span>
            </div>
          </div>

          {/* 발신번호 목록 */}
          <div className="flex-1 p-4">
            <div className="text-center py-20 text-gray-500">
              <p className="text-lg mb-2">등록된 발신번호가 없습니다.</p>
              <p className="text-sm">메시지 발송을 위해 등록해주세요.</p>
            </div>
          </div>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-end p-4 border-t bg-gray-50">
            <button
              onClick={() => router.push("/support?tab=contact")}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              문의
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 flex gap-2 items-center text-gray-600 hover:text-gray-800"
            >
              닫기
              <span className="text-xs text-gray-400">ESC</span>
            </button>
          </div>
        </div>
      </div>

      {/* 하위 모달들 */}
      <SenderNumberRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
      />
      <LimitRemovalModal
        isOpen={isLimitRemovalModalOpen}
        onClose={() => setIsLimitRemovalModalOpen(false)}
      />
    </div>
  );
};

export default SenderNumberManageModal;