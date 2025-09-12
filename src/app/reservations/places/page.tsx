"use client";

import React from "react";
import RoleGuard from "@/components/RoleGuard";
import { useRouter } from "next/navigation";

export default function ReservationPlacesPage() {
  const router = useRouter();

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            내 공간
          </h1>
        </div>

        {/* Description */}
        <div className="mb-8">
          <div className="flex items-start mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p className="text-gray-600">
              오프라인에서 보유 및 운영 중인 공간을 추가하세요.
            </p>
          </div>
        </div>

        {/* Total spaces count */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            전체 공간 <span className="text-blue-600">1</span>
          </h2>
        </div>

        {/* Space item */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-semibold mr-4">
              내공
            </div>
            <div>
              <span className="text-gray-900 font-medium">내공간</span>
            </div>
          </div>
        </div>

        {/* Add space button */}
        <button 
          onClick={() => router.push('/reservations/places/add')}
          className="w-full border-2 border-blue-300 border-dashed rounded-lg py-4 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
        >
          공간 추가하기 +
        </button>
      </div>
    </RoleGuard>
  );
}