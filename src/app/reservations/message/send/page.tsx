"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function MessageSendPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [sendType, setSendType] = useState("immediate"); // "immediate" or "scheduled"
  const [message, setMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState("2025.09.12 (금)");
  const [selectedHour, setSelectedHour] = useState("00");
  const [selectedMinute, setSelectedMinute] = useState("00");

  const handleBackClick = () => {
    router.back();
  };

  const handlePreview = () => {
    // 미리보기 기능 (UI만 구현)
  };

  const handleSend = () => {
    // 보내기 기능 (UI만 구현)
  };

  const handleScheduledSend = () => {
    // 예약 보내기 기능 (UI만 구현)
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center mb-8">
            <button 
              onClick={handleBackClick}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              메시지 보내기
            </h1>
          </div>

          <div className="space-y-6">
            {/* 받는 사람 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-900 font-medium">
                  받는 사람<span className="text-red-500">*</span>
                </label>
                <button className="text-blue-500 text-sm flex items-center">
                  예약 리스트에서 선택하기
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 발신자 정보 */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-gray-900 font-medium">발신자 정보</label>
                <button className="text-blue-500 text-sm flex items-center">
                  내용 보기
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 메시지 입력 */}
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="내용을 입력하세요."
                className="w-full h-64 p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                <div className="space-y-1">
                  <p>* 이모지는 발송 과정에서 깨질 수 있습니다.</p>
                  <div className="flex items-center">
                    <span>* 사용 가능한 주요 특수문자</span>
                    <button className="ml-1 text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <span className="text-blue-500">137/2000 바이트</span>
              </div>
            </div>

            {/* 링크 버튼들 */}
            <div className="flex space-x-4">
              <button className="text-blue-500 text-sm font-medium">+ 자동 문구 넣기</button>
              <button className="text-blue-500 text-sm font-medium">내 템플릿에서 불러오기</button>
            </div>

            {/* 보내기 방식 */}
            <div>
              <h3 className="text-gray-900 font-medium mb-4">보내기 방식</h3>
              <div className="space-y-3">
                {/* 즉시 발송 */}
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="sendType"
                      value="immediate"
                      checked={sendType === "immediate"}
                      onChange={(e) => setSendType(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded-full ${
                      sendType === "immediate" 
                        ? "border-blue-500 bg-blue-500" 
                        : "border-gray-300"
                    }`}>
                      {sendType === "immediate" && (
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-gray-900">즉시 발송</span>
                </label>

                {/* 예약 발송 */}
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="radio"
                      name="sendType"
                      value="scheduled"
                      checked={sendType === "scheduled"}
                      onChange={(e) => setSendType(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded-full ${
                      sendType === "scheduled" 
                        ? "border-blue-500 bg-blue-500" 
                        : "border-gray-300"
                    }`}>
                      {sendType === "scheduled" && (
                        <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                      )}
                    </div>
                  </div>
                  <span className="ml-3 text-gray-900">예약 발송</span>
                </label>
              </div>

              {/* 예약 발송 시간 선택 */}
              {sendType === "scheduled" && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    {/* 날짜 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                      <select 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="2025.09.12 (금)">2025.09.12 (금)</option>
                      </select>
                    </div>
                    {/* 시간 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">시간</label>
                      <div className="flex space-x-2">
                        <select 
                          value={selectedHour}
                          onChange={(e) => setSelectedHour(e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}시
                            </option>
                          ))}
                        </select>
                        <select 
                          value={selectedMinute}
                          onChange={(e) => setSelectedMinute(e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i.toString().padStart(2, '0')}>
                              {i.toString().padStart(2, '0')}분
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 버튼들 */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handlePreview}
                className="flex-1 py-3 px-4 border-2 border-blue-500 text-blue-500 rounded-lg font-medium hover:bg-blue-50 transition-colors duration-200"
              >
                미리보기
              </button>
              <button
                onClick={sendType === "immediate" ? handleSend : handleScheduledSend}
                className="flex-1 py-3 px-4 bg-gray-400 text-white rounded-lg font-medium"
              >
                {sendType === "immediate" ? "보내기" : "보내기 예약"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}