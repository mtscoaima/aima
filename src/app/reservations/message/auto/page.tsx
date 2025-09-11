"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function MessageAutoPage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  const handleCreateAutoRule = () => {
    router.push('/reservations/message/auto/create');
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
              자동 메시지 설정
            </h1>
          </div>

          <div className="space-y-6">
            {/* 안내 메시지 */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    SMS 메시지를 발송 규칙에 따라 자동으로 보낼 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 등록된 발송 규칙 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                등록된 발송 규칙 <span className="text-blue-500">0</span>
              </h2>

              {/* 발송 규칙 만들기 버튼 */}
              <button
                onClick={handleCreateAutoRule}
                className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">발송 규칙 만들기</span>
              </button>
            </div>

            {/* 안내사항 */}
            <div className="space-y-3 text-sm text-gray-600">
              <h3 className="font-medium text-gray-900">안내사항</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>자동 메시지는 예약 정보와 연동됩니다. 예약 정보의 수정 사항이 자동 메시지에 반영됩니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>발송 규칙당 1회만 발송됩니다. 예약 시간이 변경되더라도 이미 발송된 규칙에 대해서는 더 이상 발송되지 않습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>발송 예정 15분 이내로 입력한 시점에는 발송을 취소하거나 수정할 수 없습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>자동 발송 시점이 이미 지난 경우, 발송되지 않습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>발송 규칙을 수정했을 경우, 발송 예정 메시지들이 일괄 적용됩니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}