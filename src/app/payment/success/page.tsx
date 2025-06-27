"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useBalance } from "@/contexts/BalanceContext";

interface CreditInfo {
  userId: number;
  totalCredits: number;
  newBalance: number;
  packageName: string;
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshTransactions } = useBalance();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        const paymentKey = searchParams.get("paymentKey");
        const orderId = searchParams.get("orderId");
        const amount = searchParams.get("amount");

        if (!paymentKey || !orderId || !amount) {
          throw new Error("결제 정보가 누락되었습니다.");
        }

        // 결제 승인 API 호출
        const requestBody = {
          paymentKey,
          orderId,
          amount: Number(amount),
        };

        const response = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        let responseData;
        try {
          responseData = await response.json();
        } catch {
          // 200 응답이면 성공으로 간주
          if (response.status === 200) {
            responseData = {
              success: true,
              message: "결제가 성공적으로 처리되었습니다.",
            };
          } else {
            throw new Error("결제 승인 응답을 처리할 수 없습니다.");
          }
        }

        if (!response.ok) {
          // S008 에러 (중복 요청)는 성공으로 처리
          if (
            responseData.code === "S008" ||
            (responseData.message &&
              responseData.message.includes("기존 요청을 처리중"))
          ) {
            // 성공 플로우로 진행하기 위해 responseData를 성공 형태로 변경
            responseData = {
              success: true,
              message: "결제가 성공적으로 처리되었습니다.",
            };
          } else {
            throw new Error(
              responseData.message || "결제 승인에 실패했습니다."
            );
          }
        }

        const result = responseData;

        // 크레딧 정보가 있으면 저장
        if (result.creditInfo) {
          setCreditInfo(result.creditInfo);
        }

        // 결제 완료 후 BalanceContext 새로고침
        try {
          await refreshTransactions();
          console.log("💰 결제 완료 후 잔액 정보 업데이트됨");
        } catch (refreshError) {
          console.error("잔액 정보 업데이트 실패:", refreshError);
        }

        // 결제 완료 플래그를 로컬 스토리지에 저장
        localStorage.setItem("payment_completed", "true");
        localStorage.setItem(
          "payment_completed_timestamp",
          Date.now().toString()
        );

        // 5초 후 크레딧 관리 페이지로 이동
        setTimeout(() => {
          router.push("/credit-management");
        }, 5000);
      } catch (error) {
        console.error("🔍 [DEBUG] 결제 승인 실패:", error);
        console.error("🔍 [DEBUG] 에러 타입:", typeof error);
        console.error(
          "🔍 [DEBUG] 에러 메시지:",
          error instanceof Error ? error.message : String(error)
        );
        setError(
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [searchParams, router, refreshTransactions]);

  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            결제를 확인하는 중...
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  if (error) {
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
            결제 처리 실패
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/credit-management")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            크레딧 관리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          결제가 완료되었습니다!
        </h2>
        <p className="text-gray-600 mb-4">
          크레딧이 성공적으로 충전되었습니다.
        </p>

        {creditInfo && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">
              {creditInfo.packageName}
            </h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between font-semibold">
                <span className="text-gray-900">충전된 크레딧:</span>
                <span className="text-blue-600">
                  +{creditInfo.totalCredits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">현재 잔액:</span>
                <span className="font-medium text-gray-900">
                  {creditInfo.newBalance.toLocaleString()} 크레딧
                </span>
              </div>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-500">
          5초 후 자동으로 크레딧 관리 페이지로 이동합니다...
        </p>
      </div>
    </div>
  );
}
