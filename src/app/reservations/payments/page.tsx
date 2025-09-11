"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

export default function ReservationPaymentsPage() {
  const { user } = useAuth();

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">
            결제 리스트
          </h1>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center py-16">
              <div className="text-gray-400 text-6xl mb-4">💳</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                결제 리스트 기능
              </h2>
              <p className="text-gray-600 mb-4">
                결제 내역과 크레딧 사용 내역을 확인할 수 있습니다.
              </p>
              <p className="text-sm text-gray-500">
                기능 구현이 필요합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}