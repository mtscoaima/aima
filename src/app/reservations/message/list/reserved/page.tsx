"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function MessageReservedListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("scheduled"); // "scheduled" or "sent"

  const handleBackClick = () => {
    router.back();
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
              발송 예정 메시지
            </h1>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  새로 등록된 발송 예정 메시지가 목록에 표시되는 데에는 약간의 시간이 소요될 수 있습니다. (1분 이내)
                </p>
              </div>
            </div>
          </div>

          {/* 탭 버튼 */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab("scheduled")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "scheduled"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              발송 일정 순
            </button>
            <button
              onClick={() => setActiveTab("sent")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "sent"
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              등록 순
            </button>
          </div>

          {/* 발송예정 카운트 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              발송예정 <span className="text-blue-500">0</span>
            </h2>
          </div>

          {/* 빈 상태 */}
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-gray-500 text-lg">
              발송 예정 메시지가 없습니다.
            </p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}