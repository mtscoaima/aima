"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { useAuth } from "@/contexts/AuthContext";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  chargeAmount: number;
  onSuccess?: () => void; // 결제 성공 시 호출되는 콜백 (옵셔널)
}

// Nice Payments 전역 객체 타입 정의
declare global {
  interface Window {
    AUTHNICE?: {
      requestPay: (params: NicePayRequestParams) => void;
    };
  }
}

interface NicePayRequestParams {
  clientId: string;
  method: string;
  orderId: string;
  amount: number;
  goodsName: string;
  returnUrl: string;
  fnError?: (error: { errorMsg: string; errorCode: string }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  chargeAmount,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // 모달이 열릴 때 에러 초기화
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  // Nice Payments JS SDK 로드 확인
  const handleScriptLoad = () => {
    console.log("✅ Nice Payments JS SDK 로드 완료");
    setSdkLoaded(true);
  };

  const handleScriptError = () => {
    console.error("❌ Nice Payments JS SDK 로드 실패");
    setError("결제 시스템 로드에 실패했습니다. 페이지를 새로고침해주세요.");
  };

  // 결제 처리 함수
  const handlePayment = async () => {
    if (!sdkLoaded) {
      setError("결제 시스템이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (!window.AUTHNICE) {
      setError("결제 시스템을 찾을 수 없습니다. 페이지를 새로고침해주세요.");
      return;
    }

    // 사용자 정보 확인
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 서버에서 결제 정보 요청
      const response = await fetch("/api/payment/nicepay/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: chargeAmount,
          goodsName: `광고머니 ${chargeAmount.toLocaleString()}개 충전`,
          buyerName: user.name || "사용자",
          buyerEmail: user.email || "user@example.com",
          buyerTel: user.phoneNumber || "010-0000-0000",
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "결제 요청에 실패했습니다.");
      }

      const paymentData = result.data;

      console.log("📦 결제 요청 데이터:", paymentData);

      // 2. Nice Payments 결제창 호출
      window.AUTHNICE.requestPay({
        clientId: paymentData.clientId,
        method: "card", // 카드 결제
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        goodsName: paymentData.goodsName,
        returnUrl: paymentData.returnUrl,
        fnError: (error) => {
          console.error("❌ Nice Payments 결제 오류:", error);
          setError(error.errorMsg || "결제 처리 중 오류가 발생했습니다.");
          setIsLoading(false);
        },
      });

      // 결제창이 열리면 로딩 해제
      setIsLoading(false);
    } catch (err) {
      console.error("❌ 결제 요청 오류:", err);
      setError(
        err instanceof Error
          ? err.message
          : "결제 요청 중 오류가 발생했습니다."
      );
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Nice Payments JS SDK 로드 */}
      <Script
        src={process.env.NEXT_PUBLIC_NICEPAY_JS_SDK_URL || "https://sandbox-pay.nicepay.co.kr/v1/js/"}
        onLoad={handleScriptLoad}
        onError={handleScriptError}
        strategy="lazyOnload"
      />

      {/* 모달 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]"
        onClick={onClose}
      >
        {/* 모달 컨텐츠 */}
        <div
          className="bg-white rounded-xl shadow-2xl max-w-[500px] w-[90%] max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 헤더 */}
          <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 m-0">
              광고머니 충전
            </h3>
            <button
              className="bg-transparent border-none text-2xl text-gray-500 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 hover:bg-gray-100 hover:text-gray-800"
              onClick={onClose}
            >
              ×
            </button>
          </div>

          {/* 모달 바디 */}
          <div className="p-6">
            {/* 결제 정보 */}
            <div className="bg-gray-50 rounded-lg p-5 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="font-medium text-gray-600 text-sm">
                  충전 금액
                </span>
                <span className="font-semibold text-gray-800 text-base">
                  {chargeAmount.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600 text-sm">
                  충전 광고머니
                </span>
                <span className="font-semibold text-blue-600 text-lg">
                  {chargeAmount.toLocaleString()}개
                </span>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm mt-4">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="flex-shrink-0"
                >
                  <path
                    d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"
                    fill="currentColor"
                  />
                </svg>
                {error}
              </div>
            )}

            {/* 로딩 메시지 */}
            {!sdkLoaded && !error && (
              <div className="text-center py-3 text-gray-600 text-sm">
                결제 시스템을 준비하고 있습니다...
              </div>
            )}
          </div>

          {/* 모달 푸터 */}
          <div className="flex justify-end gap-3 px-6 py-5 border-t border-gray-200">
            <button
              className="bg-gray-100 text-gray-800 border-none px-6 py-3 rounded-md font-medium text-sm cursor-pointer transition-all duration-200 min-w-[100px] hover:bg-gray-200"
              onClick={onClose}
            >
              취소
            </button>
            <button
              className="bg-blue-600 text-white border-none px-6 py-3 rounded-md font-medium text-sm cursor-pointer transition-all duration-200 min-w-[100px] hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-600/30 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              onClick={handlePayment}
              disabled={isLoading || !sdkLoaded}
            >
              {isLoading ? "처리 중..." : "결제하기"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default PaymentModal;