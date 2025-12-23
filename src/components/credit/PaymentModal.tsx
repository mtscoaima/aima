"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getCNSPayHtml, CARD_CODES } from "@/utils/cnspay";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  chargeAmount: number;
}

interface CNSPayMessage {
  type: "CNSPAY_READY" | "CNSPAY_SUCCESS" | "CNSPAY_CLOSE";
  trKey?: string;
  resultCd?: string;
  resultMsg?: string;
  error?: string;
  paymentData?: {
    txnId: string;
    mid: string;
    moid: string;
    ediDate: string;
    encryptData: string;
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  chargeAmount,
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState("06"); // 기본값: 신한카드
  const paymentWindowRef = useRef<Window | null>(null);
  const paymentDataRef = useRef<{
    txnId: string;
    mid: string;
    moid: string;
    ediDate: string;
    encryptData: string;
    goodsName: string;
    amount: number;
    buyerName: string;
    buyerTel: string;
    buyerEmail: string;
  } | null>(null);

  // 결제 승인 처리
  const processApproval = useCallback(
    async (trKey: string, paymentData: CNSPayMessage["paymentData"]) => {
      if (!paymentData || !user) return;

      setIsLoading(true);

      try {
        const response = await fetch("/api/payment/cnspay/approve", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            txnId: paymentData.txnId,
            trKey,
            moid: paymentData.moid,
            amount: chargeAmount,
            goodsName: `광고머니 ${chargeAmount.toLocaleString()}개 충전`,
            buyerName: user.name || "사용자",
            buyerEmail: user.email || "",
            buyerTel: user.phoneNumber || "",
            userId: user.id,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "결제 승인에 실패했습니다.");
        }

        // 결제 성공 - 페이지 새로고침
        window.location.href = `/credit-management?payment=success&amount=${chargeAmount}`;
      } catch (err) {
        console.error("❌ 결제 승인 오류:", err);
        setError(
          err instanceof Error ? err.message : "결제 승인 중 오류가 발생했습니다."
        );
        setIsLoading(false);
      }
    },
    [chargeAmount, user]
  );

  // 결제 창에서 오는 메시지 처리
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const data = event.data as CNSPayMessage;

      if (!data || !data.type) return;

      console.log("📥 결제 창 메시지:", data);

      switch (data.type) {
        case "CNSPAY_SUCCESS":
          // 인증 성공 - 승인 요청
          console.log("✅ 인증 성공, 승인 요청 시작");
          if (data.trKey) {
            const pd = data.paymentData || paymentDataRef.current;
            if (pd) {
              processApproval(data.trKey, pd);
            }
          }
          break;

        case "CNSPAY_CLOSE":
          // 결제 취소/실패
          setIsLoading(false);
          if (data.error) {
            setError(data.error);
          }
          paymentWindowRef.current = null;
          break;
      }
    },
    [processApproval]
  );

  // 메시지 리스너 설정
  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleMessage]);

  // 결제 처리 함수
  const handlePayment = async () => {
    // 사용자 정보 확인
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. 서버에서 거래초기화 요청
      const response = await fetch("/api/payment/cnspay/init", {
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
        throw new Error(result.error || "거래초기화에 실패했습니다.");
      }

      const data = result.data;

      // 결제 데이터 저장
      paymentDataRef.current = {
        txnId: data.txnId,
        mid: data.mid,
        moid: data.moid,
        ediDate: data.ediDate,
        encryptData: data.encryptData,
        goodsName: data.goodsName,
        amount: data.amount,
        buyerName: data.buyerName || "",
        buyerTel: data.buyerTel || "",
        buyerEmail: data.buyerEmail || "",
      };

      // 2. 결제 팝업 창 열기 (URL 파라미터로 데이터 전달)
      const width = 500;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      // about:blank 창을 먼저 열고 내용을 직접 씁니다. (document.write 문제 해결)
      const paymentWindow = window.open(
        "",
        "CNSPayPayment",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      if (!paymentWindow) {
        throw new Error("팝업 차단으로 결제창을 열 수 없습니다. 팝업 차단을 해제해주세요.");
      }

      // HTML 내용 생성 (값들은 getCNSPayHtml 내부에서 이스케이프 처리됨)
      const htmlContent = getCNSPayHtml({
        txnId: data.txnId,
        mid: data.mid,
        moid: data.moid,
        goodsName: data.goodsName,
        amount: data.amount,
        buyerName: data.buyerName || "",
        buyerTel: data.buyerTel || "",
        buyerEmail: data.buyerEmail || "",
        ediDate: data.ediDate,
        encryptData: data.encryptData,
        cardCd: selectedCard,
      }, window.location.origin);

      // 팝업 창에 HTML 쓰기
      paymentWindow.document.open();
      paymentWindow.document.write(htmlContent);
      paymentWindow.document.close();

      paymentWindowRef.current = paymentWindow;

      // 팝업 창 닫힘 감지
      const checkClosed = setInterval(() => {
        if (paymentWindow.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          paymentWindowRef.current = null;
        }
      }, 500);

    } catch (err) {
      console.error("❌ 결제 요청 오류:", err);
      setError(
        err instanceof Error ? err.message : "결제 요청 중 오류가 발생했습니다."
      );
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
                  {chargeAmount.toLocaleString()}원
                </span>
              </div>
            </div>

            {/* 결제 안내 */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800 m-0">
                💳 LG CNS CNSPay를 통한 안전한 신용카드 결제입니다.
              </p>
              <p className="text-xs text-blue-600 mt-2 m-0">
                ※ 팝업 차단을 해제해주세요. 결제창이 새 창에서 열립니다.
              </p>
            </div>

            {/* 카드사 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                결제 카드사 선택
              </label>
              <select
                value={selectedCard}
                onChange={(e) => setSelectedCard(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                {CARD_CODES.map((card) => (
                  <option key={card.code} value={card.code}>
                    {card.name}
                  </option>
                ))}
              </select>
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
              disabled={isLoading}
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
export { PaymentModal };
