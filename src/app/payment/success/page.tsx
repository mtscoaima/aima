"use client";

import { useEffect, useState, useCallback } from "react";
import { useBalance } from "@/contexts/BalanceContext";
import dynamicImport from "next/dynamic";

// Next.js에게 이 페이지를 완전히 동적으로 처리하도록 강제
export const dynamic = "force-dynamic";

interface CreditInfo {
  userId: number;
  totalCredits: number;
  newBalance: number;
  packageName: string;
}

interface PaymentParams {
  paymentKey: string;
  orderId: string;
  amount: string;
}

// 서버 사이드 렌더링 방지를 위한 컴포넌트
function PaymentSuccessContent() {
  const { refreshTransactions } = useBalance();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [params, setParams] = useState<PaymentParams | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isParamsReady, setIsParamsReady] = useState(false); // 파싱 완료 상태 추가

  // 안전한 페이지 이동 함수 - useCallback으로 메모이제이션
  const safeNavigate = useCallback((url?: string) => {
    try {
      // 클라이언트에서만 실행
      if (typeof window === "undefined") {
        console.warn("서버에서 safeNavigate 호출 시도");
        return;
      }

      const isValidRelative = url && url.startsWith("/");
      const isValidAbsolute = url && /^https?:\/\//.test(url);

      // URL 안전성 확보
      const finalUrl =
        isValidRelative || isValidAbsolute ? url : "/credit-management";

      console.log("페이지 이동:", finalUrl);
      window.location.href = finalUrl;
    } catch (error) {
      console.error("페이지 이동 오류:", error);
      if (typeof window !== "undefined") {
        window.location.href = "/credit-management";
      }
    }
  }, []);

  // 컴포넌트 마운트 상태 추적
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // URL 파라미터 안전 파싱 - 완전한 클라이언트 전용 처리
  useEffect(() => {
    if (!isMounted) return;

    const parseParams = () => {
      try {
        // 클라이언트 측에서만 실행 - 철저한 체크
        if (typeof window === "undefined") {
          console.warn("서버 사이드에서 window 접근 시도");
          return;
        }

        // window.location이 유효한지 확인
        if (!window.location || !window.location.search) {
          console.warn("window.location.search가 유효하지 않음");
          setError("URL 정보를 읽을 수 없습니다.");
          setIsProcessing(false);
          return;
        }

        // URLSearchParams를 사용한 안전한 파싱
        const searchParams = new URLSearchParams(window.location.search);
        const paymentKey = searchParams.get("paymentKey");
        const orderId = searchParams.get("orderId");
        const amount = searchParams.get("amount");

        // 파라미터 유효성 검증 - 더 엄격한 체크
        if (!paymentKey || paymentKey === "null" || paymentKey.trim() === "") {
          throw new Error("paymentKey가 유효하지 않습니다.");
        }

        if (!orderId || orderId === "null" || orderId.trim() === "") {
          throw new Error("orderId가 유효하지 않습니다.");
        }

        if (
          !amount ||
          amount === "null" ||
          isNaN(Number(amount)) ||
          Number(amount) <= 0
        ) {
          throw new Error("amount가 유효하지 않습니다.");
        }

        // 추가 형식 검증
        if (!/^[a-zA-Z0-9_]+$/.test(paymentKey)) {
          throw new Error("paymentKey 형식이 올바르지 않습니다.");
        }

        if (!/^credit_\d+_\d+_[a-zA-Z0-9]+$/.test(orderId)) {
          throw new Error("orderId 형식이 올바르지 않습니다.");
        }

        setParams({ paymentKey, orderId, amount });
        setIsParamsReady(true); // 파싱 완료 상태 설정
        setError(null);
      } catch (error) {
        console.error("파라미터 파싱 오류:", error);
        setError(
          error instanceof Error
            ? `결제 정보 오류: ${error.message}`
            : "결제 정보를 읽을 수 없습니다."
        );
        setIsProcessing(false);
        setIsParamsReady(false);
      }
    };

    // requestAnimationFrame을 사용하여 렌더 프레임 완료 후 실행
    const frame = requestAnimationFrame(parseParams);
    return () => cancelAnimationFrame(frame);
  }, [isMounted]);

  // 카운트다운 시작 - useCallback으로 메모이제이션
  const startCountdown = useCallback(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          safeNavigate("/credit-management"); // 명시적으로 경로 지정
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [safeNavigate]);

  // 결제 확인 처리 - 명확한 조건 체크
  useEffect(() => {
    // 모든 조건이 명확히 충족되었을 때만 실행
    if (!isParamsReady || !params || !isMounted) {
      return;
    }

    const confirmPayment = async () => {
      try {
        const { paymentKey, orderId, amount } = params;

        // 중복 처리 방지
        const processedKey = `payment_processed_${paymentKey}`;
        const alreadyProcessed = localStorage.getItem(processedKey);

        if (alreadyProcessed) {
          setIsProcessing(false);
          await refreshTransactions().catch(console.error);
          startCountdown();
          return;
        }

        // fetch URL 안전성 확보
        const confirmUrl = "/api/payment/confirm";
        const response = await fetch(confirmUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: Number(amount),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API 오류: ${response.status}`);
        }

        const result = await response.json();

        // 처리 완료 표시
        localStorage.setItem(processedKey, "true");

        if (result.creditInfo) {
          setCreditInfo(result.creditInfo);
        }

        // 잔액 새로고침
        await refreshTransactions().catch(console.error);

        setIsProcessing(false);
        startCountdown();
      } catch (error) {
        console.error("결제 확인 오류:", error);
        setError(
          error instanceof Error ? error.message : "결제 확인에 실패했습니다."
        );
        setIsProcessing(false);
      }
    };

    confirmPayment();
  }, [isParamsReady, params, isMounted, refreshTransactions, startCountdown]); // 의존성 명확히 정리

  // 서버 사이드 렌더링 중에는 로딩 표시
  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            페이지를 로드하는 중...
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            결제를 확인하는 중...
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  // 에러 상태
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
            onClick={() => safeNavigate("/credit-management")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            크레딧 관리로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 성공 상태
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

        <div className="space-y-3">
          <button
            onClick={() => safeNavigate("/credit-management")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            크레딧 관리로 이동
          </button>

          {countdown > 0 && (
            <p className="text-sm text-gray-500">
              {countdown}초 후 자동으로 크레딧 관리 페이지로 이동합니다...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// 동적 import로 클라이언트에서만 렌더링되도록 강제
const PaymentSuccessPage = dynamicImport(
  () => Promise.resolve(PaymentSuccessContent),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            페이지를 로드하는 중...
          </h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    ),
  }
);

export default PaymentSuccessPage;
