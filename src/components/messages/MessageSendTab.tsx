"use client";

import React, { useState } from "react";
import {
  Phone,
  Users,
  HelpCircle,
  ChevronDown,
  FileText,
  Upload
} from "lucide-react";
import SmsMessageContent from "./SmsMessageContent";
import KakaoMessageContent from "./KakaoMessageContent";
import RcsMessageContent from "./RcsMessageContent";
import NaverTalkContent from "./NaverTalkContent";

const MessageSendTab = () => {
  const [activeMessageTab, setActiveMessageTab] = useState("sms");

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
            <button className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700">
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
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-2 border border-orange-500 text-orange-500 rounded text-sm hover:bg-orange-50">
                <FileText className="w-4 h-4" />
                주소록
              </button>
              <button className="flex items-center gap-1 px-3 py-2 border border-green-500 text-green-500 rounded text-sm hover:bg-green-50">
                <Upload className="w-4 h-4" />
                엑셀
              </button>
              <button className="flex items-center gap-1 px-3 py-2 border border-gray-500 text-gray-500 rounded text-sm hover:bg-gray-50">
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

        {/* 자장 드롭다운 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-red-500 font-medium">저장</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* 우측 섹션 */}
      <div className="flex-1 flex flex-col">
        {/* 상단 탭 버튼들 */}
        <div className="flex gap-2 mb-6">
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "sms"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setActiveMessageTab("sms")}
          >
            📱 문자메시지
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "kakao"
                ? "bg-yellow-100 text-yellow-700 border border-yellow-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setActiveMessageTab("kakao")}
          >
            💬 카카오톡
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "rcs"
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            onClick={() => setActiveMessageTab("rcs")}
          >
            🔵 RCS 문자
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeMessageTab === "naver"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
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
          <button className="w-full bg-purple-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 transition-colors">
            전송/예약 준비
          </button>
          <div className="text-center mt-2 text-sm text-gray-600">
            &quot;전송 준비&quot;는 잔액이 차감되지 않습니다.
          </div>
          <div className="text-center text-sm text-gray-600">
            예상 차감 단가의 실 발송 내용을 확인하세요!
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageSendTab;