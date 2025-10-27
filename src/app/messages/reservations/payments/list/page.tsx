"use client";

import React, { useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import { useRouter } from 'next/navigation';

export default function ReservationPaymentListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("전체");

  const tabs = [
    "전체", 
    "결제 대기 중", 
    "결제 완료", 
    "부분 취소 완료", 
    "취소 완료"
  ];

  const handleBack = () => {
    router.back();
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={handleBack}
            className="mr-4 p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            결제 리스트
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "bg-blue-100 text-blue-600 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-600 border-2 border-transparent"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="text-center py-16">
          <p className="text-gray-500">
            결제 내역이 없습니다.
          </p>
        </div>
      </div>
    </RoleGuard>
  );
}