"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

export default function ReservationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // 메인 페이지(/messages/reservations)는 백버튼 표시하지 않음
  const isMainPage = pathname === "/messages/reservations";

  const handleBackToMenu = () => {
    // 히스토리가 있으면 뒤로, 없으면 예약관리 메인으로
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push("/messages/reservations");
    }
  };

  return (
    <div className="min-h-screen">
      {!isMainPage && (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="container mx-auto px-4 py-3 max-w-6xl">
            <button
              onClick={handleBackToMenu}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="text-sm font-medium">뒤로</span>
            </button>
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
