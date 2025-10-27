"use client";

import React, { useState } from "react";
import RoleGuard from "@/components/RoleGuard";

export default function ReservationPaymentListPage() {
  const [activeTab, setActiveTab] = useState("전체");

  const tabs = [
    "전체", 
    "결제 대기 중", 
    "결제 완료", 
    "부분 취소 완료", 
    "취소 완료"
  ];

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
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