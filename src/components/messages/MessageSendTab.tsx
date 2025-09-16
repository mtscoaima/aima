"use client";

import React, { useState } from "react";
import {
  Phone,
  Users,
  HelpCircle,
  ChevronDown,
  FileText,
  Upload,
  Plus,
  Edit,
  Download
} from "lucide-react";
import SmsMessageContent from "./SmsMessageContent";
import KakaoMessageContent from "./KakaoMessageContent";
import RcsMessageContent from "./RcsMessageContent";
import NaverTalkContent from "./NaverTalkContent";
import SenderNumberSelectModal from "../modals/SenderNumberSelectModal";
import SenderNumberManageModal from "../modals/SenderNumberManageModal";
import SaveContentModal from "../modals/SaveContentModal";
import LoadContentModal from "../modals/LoadContentModal";

const MessageSendTab = () => {
  const [activeMessageTab, setActiveMessageTab] = useState("sms");
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  // 탭별 테마색 정의
  const getThemeColor = (tab: string) => {
    switch (tab) {
      case "sms": return "#6a1b9a";
      case "kakao": return "#795548";
      case "rcs": return "#2c398a";
      case "naver": return "#00a732";
      default: return "#6a1b9a";
    }
  };

  // 모달 핸들러
  const handleSelectModalOpen = () => setIsSelectModalOpen(true);
  const handleSelectModalClose = () => setIsSelectModalOpen(false);
  const handleManageModalOpen = () => {
    setIsSelectModalOpen(false);
    setIsManageModalOpen(true);
  };
  const handleManageModalClose = () => setIsManageModalOpen(false);

  const renderMessageContent = () => {
    switch (activeMessageTab) {
      case "sms":
        return <SmsMessageContent />;
      case "kakao":
        return <KakaoMessageContent />;
      case "rcs":
        return <RcsMessageContent />;
      case "naver":
        return <NaverTalkContent />;
      default:
        return <SmsMessageContent />;
    }
  };

  return (
    <div className="flex h-full gap-6">
      {/* 좌측 섹션 */}
      <div className="w-90 flex flex-col space-y-6">
        {/* 메시지 발신번호 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700">메시지 발신번호</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500 text-sm">선택된 발신번호 없음</span>
            <button
              className="text-white px-4 py-2 rounded text-sm hover:opacity-90"
              style={{ backgroundColor: getThemeColor(activeMessageTab) }}
              onClick={handleSelectModalOpen}
            >
              선택
            </button>
          </div>
        </div>

        {/* 메시지 수신번호 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-700">메시지 수신번호</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="01022224444"
                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
              />
              <HelpCircle className="w-4 h-4 text-gray-400" />
              <button className="bg-gray-500 text-white px-3 py-2 rounded text-sm hover:bg-gray-600">
                추가
              </button>
            </div>
            <div className="w-full justify-between flex gap-2">
              <button className="flex items-center gap-1 w-full justify-center py-2 border border-orange-500 text-orange-500 rounded text-sm hover:bg-orange-50">
                <FileText className="w-4 h-4" />
                주소록
              </button>
              <button className="flex items-center gap-1 w-full justify-center py-2 border border-green-500 text-green-500 rounded text-sm hover:bg-green-50">
                <Upload className="w-4 h-4" />
                엑셀
              </button>
              <button className="flex items-center gap-1 w-full justify-center py-2 border border-gray-500 text-gray-500 rounded text-sm hover:bg-gray-50">
                <FileText className="w-4 h-4" />
                텍스트
              </button>
            </div>
          </div>
        </div>

        {/* 주가한 수신번호 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-700">주가한 수신번호</span>
              <span className="text-gray-500 text-sm">(총 0개)</span>
            </div>
            <button className="text-gray-400 text-sm hover:text-gray-600">
              비우기
            </button>
          </div>
          <div className="text-center py-8 text-gray-500 text-sm">
            수신자명단이 비어있습니다.
          </div>
        </div>

        {/* 저장 섹션 */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            onClick={() => setIsSaveDropdownOpen(!isSaveDropdownOpen)}
          >
            <span className="text-red-500 font-medium">저장</span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isSaveDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isSaveDropdownOpen && (
            <div className="p-3">
              <div className="flex gap-2">
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-green-500 text-green-500 rounded text-sm hover:bg-green-50"
                  onClick={() => setIsSaveModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  새로 저장
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 text-gray-400 rounded text-sm cursor-not-allowed"
                  disabled
                >
                  <Edit className="w-4 h-4" />
                  덮어 쓰기
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-blue-500 text-blue-500 rounded text-sm hover:bg-blue-50"
                  onClick={() => setIsLoadModalOpen(true)}
                >
                  <Download className="w-4 h-4" />
                  불러오기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 우측 섹션 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 탭 버튼들 */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "sms"
                ? "border border-[#6a1b9a]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={activeMessageTab === "sms" ? { backgroundColor: "#6a1b9a20", color: "#6a1b9a" } : {}}
            onClick={() => setActiveMessageTab("sms")}
          >
            📱 문자메시지
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "kakao"
                ? "border border-[#795548]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={activeMessageTab === "kakao" ? { backgroundColor: "#79554820", color: "#795548" } : {}}
            onClick={() => setActiveMessageTab("kakao")}
          >
            💬 카카오톡
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "rcs"
                ? "border border-[#2c398a]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={activeMessageTab === "rcs" ? { backgroundColor: "#2c398a20", color: "#2c398a" } : {}}
            onClick={() => setActiveMessageTab("rcs")}
          >
            🔵 RCS 문자
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "naver"
                ? "border border-[#00a732]"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={activeMessageTab === "naver" ? { backgroundColor: "#00a73220", color: "#00a732" } : {}}
            onClick={() => setActiveMessageTab("naver")}
          >
            🟢 네이버 톡톡
          </button>
        </div>

        {/* 메시지 작성 영역 */}
        <div className="flex-1 flex flex-col">
          {renderMessageContent()}
        </div>

        {/* 전송/예약 준비 버튼 */}
        <div className="mt-6">
          <button
            className="w-full text-white py-2 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
            style={{ backgroundColor: getThemeColor(activeMessageTab) }}
          >
            전송/예약 준비
          </button>
          <div className="text-center font-semibold mt-2 text-sm text-gray-600">
            &quot;전송 준비&quot;는 잔액이 차감되지 않습니다.
          </div>
          <div className="text-center text-sm text-gray-600">
            예상 차감 단가의 실 발송 내용을 확인하세요!
          </div>
        </div>
      </div>

      {/* 모달들 */}
      <SenderNumberSelectModal
        isOpen={isSelectModalOpen}
        onClose={handleSelectModalClose}
        onManageClick={handleManageModalOpen}
      />
      <SenderNumberManageModal
        isOpen={isManageModalOpen}
        onClose={handleManageModalClose}
      />
      <SaveContentModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
      />
      <LoadContentModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
      />
    </div>
  );
};

export default MessageSendTab;