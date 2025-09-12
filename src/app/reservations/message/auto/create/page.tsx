"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import RoleGuard from "@/components/RoleGuard";

export default function CreateAutoRulePage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    ruleName: "",
    target: "공간을 선택하세요",
    sendTime: "입실 (이용 시작)",
    timeType: "상대적 시점",
    timeValue: "2시간",
    timeUnit: "전",
    template: "템플릿을 선택하세요"
  });
  const [showSenderInfo, setShowSenderInfo] = useState(true);

  const handleBackClick = () => {
    router.back();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSenderInfo = () => {
    setShowSenderInfo(!showSenderInfo);
  };

  const handleCreateRule = () => {
    // 만들기 기능 (UI만 구현)
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
              발송 규칙 만들기
            </h1>
          </div>

          <div className="space-y-6">
            {/* 발송 규칙 제목 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                발송 규칙 제목<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ruleName}
                onChange={(e) => handleInputChange("ruleName", e.target.value)}
                placeholder="제목을 입력하세요."
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">고객에게 표시되지 않습니다.</p>
            </div>

            {/* 대상 공간 선택 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                대상 공간 선택<span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                이 공간에 대한 모든 예약에 대해 발송 규칙이 적용됩니다. 특정 예약이나 메시지에 대해 개별적으로 발송을 취소할 수도 있습니다.
              </p>
              <div className="relative">
                <select
                  value={formData.target}
                  onChange={(e) => handleInputChange("target", e.target.value)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="공간을 선택하세요">공간을 선택하세요</option>
                  <option value="공간1">공간 1</option>
                  <option value="공간2">공간 2</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 보낼 시점 선택 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                보낼 시점 선택<span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">언제 메시지를 보낼지 선택하세요.</p>
              
              <div className="space-y-4">
                {/* 기준 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">기준</label>
                  <div className="relative">
                    <select
                      value={formData.sendTime}
                      onChange={(e) => handleInputChange("sendTime", e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="입실 (이용 시작)">입실 (이용 시작)</option>
                      <option value="퇴실 (이용 종료)">퇴실 (이용 종료)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 유형 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">유형</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleInputChange("timeType", "시간 지정")}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                        formData.timeType === "시간 지정"
                          ? "bg-gray-200 border-gray-300 text-gray-900"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      시간 지정
                    </button>
                    <button
                      onClick={() => handleInputChange("timeType", "상대적 시점")}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                        formData.timeType === "상대적 시점"
                          ? "bg-gray-200 border-gray-300 text-gray-900"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      상대적 시점
                    </button>
                  </div>
                </div>

                {/* 시간 설정 */}
                {formData.timeType === "상대적 시점" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시간</label>
                    <div className="flex space-x-2">
                      <select
                        value={formData.timeValue}
                        onChange={(e) => handleInputChange("timeValue", e.target.value)}
                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="30분">30분</option>
                        <option value="1시간">1시간</option>
                        <option value="2시간">2시간</option>
                        <option value="3시간">3시간</option>
                        <option value="6시간">6시간</option>
                        <option value="12시간">12시간</option>
                        <option value="1일">1일</option>
                        <option value="2일">2일</option>
                        <option value="3일">3일</option>
                      </select>
                      <select
                        value={formData.timeUnit}
                        onChange={(e) => handleInputChange("timeUnit", e.target.value)}
                        className="w-20 p-2 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="전">전</option>
                        <option value="후">후</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시간</label>
                    <div className="flex space-x-2">
                      <select
                        value={formData.timeValue}
                        onChange={(e) => handleInputChange("timeValue", e.target.value)}
                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="1일 전">1일 전</option>
                        <option value="2일 전">2일 전</option>
                        <option value="3일 전">3일 전</option>
                      </select>
                      <input
                        type="time"
                        className="w-32 p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        defaultValue="09:00"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 보낼 메시지 템플릿 선택 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                보낼 메시지 템플릿 선택<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.template}
                  onChange={(e) => handleInputChange("template", e.target.value)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="템플릿을 선택하세요">템플릿을 선택하세요</option>
                  <option value="입실 안내 템플릿">입실 안내 템플릿</option>
                  <option value="확인 템플릿">확인 템플릿</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 발신자 정보 */}
            <div>
              <div className="bg-white border border-gray-200 rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={handleSenderInfo}
                >
                  <span className="text-gray-900 font-medium">발신자 정보</span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${showSenderInfo ? 'rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                {showSenderInfo && (
                  <div className="px-4 pb-4 border-t border-gray-100 space-y-3">
                    {/* 보내는 번호 */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-gray-900 font-medium">보내는 번호</div>
                        <div className="text-gray-500 text-sm">발신전용 번호 (02-2138-8050)</div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* 호스트 연락처 */}
                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                      <div>
                        <div className="text-gray-900 font-medium">호스트 연락처</div>
                        <div className="text-gray-500 text-sm">예약 공간에 따라 입력됩니다.</div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 만들기 버튼 */}
            <div className="pt-4">
              <button
                onClick={handleCreateRule}
                className="w-full py-3 px-4 bg-gray-400 text-white rounded-lg font-medium"
                disabled
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}