"use client";

import { Suspense } from "react";

export default function PaymentSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              결제 결과를 확인하는 중...
            </h2>
            <p className="text-gray-600">잠시만 기다려주세요.</p>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
