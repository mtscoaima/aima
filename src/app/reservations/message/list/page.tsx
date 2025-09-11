"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function MessageListPage() {
  const { user } = useAuth();
  const router = useRouter();

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
              보낸 메시지
            </h1>
          </div>

          {/* 빈 상태 */}
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <p className="text-gray-500 text-lg">
              보낸 메시지가 없습니다.
            </p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}