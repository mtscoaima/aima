"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function PaymentFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");
  const orderId = searchParams.get("orderId");

  // 결제 실패 시 결제 완료 플래그 제거
  useEffect(() => {
    localStorage.removeItem("payment_completed");
    localStorage.removeItem("payment_completed_timestamp");
  }, []);

  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case "PAY_PROCESS_CANCELED":
        return "결제가 취소되었습니다.";
      case "PAY_PROCESS_ABORTED":
        return "결제가 중단되었습니다. 잠시 후 다시 시도해주세요.";
      case "REJECT_CARD_COMPANY":
        return "카드사에서 결제를 거절했습니다. 카드 정보를 확인해주세요.";
      default:
        return errorMessage || "알 수 없는 오류가 발생했습니다.";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          결제에 실패했습니다
        </h2>

        <p className="text-gray-600 mb-4">{getErrorDescription(errorCode)}</p>

        {errorCode && (
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <p className="text-sm text-gray-500">
              <strong>오류 코드:</strong> {errorCode}
            </p>
            {orderId && (
              <p className="text-sm text-gray-500">
                <strong>주문번호:</strong> {orderId}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <button
            onClick={() => router.push("/credit-management")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            다시 시도하기
          </button>

          <button
            onClick={() => router.push("/")}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            홈으로 돌아가기
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>문제가 지속되면 고객센터로 문의해주세요.</p>
        </div>
      </div>
    </div>
  );
}
