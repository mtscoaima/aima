import React, { useState, useEffect } from "react";

// KG이니시스 타입 정의
declare global {
  interface Window {
    INIStdPay?: {
      pay: (formId: string) => void;
    };
  }
}

// Simple icon components
const XIcon = () => (
  <svg
    className="h-5 w-5"
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
);

const CheckIcon = () => (
  <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const CreditCardIcon = () => (
  <svg
    className="h-6 w-6 text-blue-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);

interface UserInfo {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface ChargeInfo {
  id: string;
  name: string;
  amount: number;
  price: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  chargeInfo: ChargeInfo | null;
  redirectUrl?: string;
  requiredAmount?: number;
  allowEdit?: boolean;
}

interface InicisPaymentData {
  mid: string;
  oid: string;
  price: string;
  timestamp: string;
  mKey: string;
  signature: string;
  verification: string;
  goodname: string;
  buyername: string;
  buyertel: string;
  buyeremail: string;
  returnUrl: string;
  closeUrl: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  chargeInfo,
  redirectUrl,
  requiredAmount,
  allowEdit = false,
}: PaymentModalProps) {
  const [step, setStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("inicis");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [paymentForm, setPaymentForm] = useState<InicisPaymentData | null>(
    null
  );
  
  // 직접 입력 관련 상태
  const [inputAmount, setInputAmount] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");
  
  const MIN_AMOUNT = 10000;
  const MAX_AMOUNT = 1000000;

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();

          // API가 직접 사용자 정보를 반환하므로 data를 바로 사용
          // phoneNumber -> phone 매핑
          const mappedUserInfo = {
            id: data.id,
            name: data.name,
            email: data.email,
            phone: data.phoneNumber, // phoneNumber -> phone 매핑
          };

          setUserInfo(mappedUserInfo);
        } else {
          console.error(
            "API 응답 실패:",
            response.status,
            await response.text()
          );
        }
      } catch (error) {
        console.error("사용자 정보 조회 실패:", error);
      }
    };

    if (isOpen) {
      fetchUserInfo();
    }
  }, [isOpen]);

  // 결제 단계 리셋 및 기본값 설정
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setIsProcessingPayment(false);
      setPaymentForm(null);
      
      // 직접 입력 모드일 때 기본값 설정
      if (allowEdit && requiredAmount) {
        const defaultAmount = Math.ceil(requiredAmount / 10000) * 10000;
        setInputAmount(defaultAmount.toLocaleString());
        setAmountError("");
      } else if (chargeInfo) {
        setInputAmount(chargeInfo.amount.toLocaleString());
        setAmountError("");
      }
    }
  }, [isOpen, allowEdit, requiredAmount, chargeInfo]);

  const generateOrderId = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const userId = userInfo?.id || "unknown";
    return `credit_${timestamp}_${userId}_${randomString}`;
  };
  
  // 숫자 포맷팅 (ChargeInput과 동일)
  const formatNumber = (value: string) => {
    const number = value.replace(/[^\d]/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  // 금액 입력 처리
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/[^\d]/g, "");
    const numberValue = parseInt(numericValue) || 0;

    setInputAmount(formatNumber(numericValue));

    // 실시간 검증
    if (numericValue === "") {
      setAmountError("");
    } else if (numberValue < MIN_AMOUNT) {
      setAmountError("");
    } else if (numberValue > MAX_AMOUNT) {
      setAmountError(`최대 충전 금액은 ${MAX_AMOUNT.toLocaleString()}원입니다.`);
    } else {
      setAmountError("");
    }
  };
  
  // 빠른 금액 선택
  const handleQuickAmount = (quickAmount: number) => {
    setInputAmount(quickAmount.toLocaleString());
    setAmountError("");
  };
  
  // 현재 입력된 금액 가져오기
  const getCurrentAmount = () => {
    if (allowEdit) {
      return parseInt(inputAmount.replace(/,/g, "")) || 0;
    }
    return chargeInfo?.amount || 0;
  };
  
  // 현재 충전 정보 가져오기
  const getCurrentChargeInfo = () => {
    if (allowEdit) {
      const amount = getCurrentAmount();
      return {
        id: `charge_${Date.now()}`,
        name: `광고머니 ${amount.toLocaleString()}원 충전`,
        amount: amount,
        price: amount,
      };
    }
    return chargeInfo;
  };

  if (!isOpen || (!chargeInfo && !allowEdit)) return null;

  const paymentMethods = [
    {
      id: "inicis",
      name: "KG이니시스",
      icon: CreditCardIcon,
      description: "카드, 간편결제, 계좌이체 등",
    },
  ];

  const handleInicisPayment = async () => {
    if (isProcessingPayment) {
      return;
    }

    // 사용자 정보가 로드되지 않았으면 대기
    if (!userInfo) {
      alert("사용자 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      setIsProcessingPayment(true);
      setStep(4);

      const orderId = generateOrderId();
      const chargeInfoForPayment = getCurrentChargeInfo();
      const orderName = chargeInfoForPayment?.name || "광고머니 충전";

      // 전화번호 형식 검증 및 정리
      const formatPhoneNumber = (phone?: string) => {
        if (!phone) return "01000000000";
        const cleaned = phone.replace(/\D/g, "");
        if (cleaned.length === 11 && /^01[0-9]/.test(cleaned)) {
          return cleaned;
        }
        return "01000000000";
      };

      // 이메일 형식 검증
      const formatEmail = (email?: string) => {
        if (!email || !email.includes("@")) {
          return "customer@example.com";
        }
        return email;
      };

      const formattedPhone = formatPhoneNumber(userInfo?.phone);
      const formattedEmail = formatEmail(userInfo?.email);

      // redirectUrl을 localStorage에 저장 (success 페이지에서 사용)
      if (redirectUrl) {
        localStorage.setItem("payment_redirect_url", redirectUrl);
      } else {
        localStorage.removeItem("payment_redirect_url");
      }

      // KG이니시스 결제 요청 데이터 생성
      const paymentData = {
        price: chargeInfoForPayment?.price.toString() || "0",
        goodname: chargeInfoForPayment?.name || orderName,
        buyername: userInfo?.name || "고객",
        buyertel: formattedPhone,
        buyeremail: formattedEmail,
        oid: orderId,
        redirectUrl: redirectUrl,
      };

      // 결제 요청 API 호출하여 결제 폼 데이터 받기
      const response = await fetch("/api/payment/inicis/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error("결제 요청에 실패했습니다.");
      }

      const result = await response.json();
      setPaymentForm(result.paymentForm);
      setStep(3); // 결제창 단계로 이동
    } catch (error) {
      console.error(error);
      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";
      alert(`결제에 실패했습니다: ${errorMessage}`);
      setStep(2);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // KG이니시스 결제창 열기 (JavaScript SDK 방식)
  const openPaymentWindow = () => {
    if (!paymentForm) return;

    // KG이니시스 JavaScript SDK 로드
    const loadInicisScript = () => {
      return new Promise<void>((resolve, reject) => {
        // 이미 로드된 경우
        if (window.INIStdPay) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://stgstdpay.inicis.com/stdjs/INIStdPay.js";
        script.charset = "UTF-8";
        script.onload = () => resolve();
        script.onerror = () =>
          reject(new Error("KG이니시스 스크립트 로드 실패"));
        document.head.appendChild(script);
      });
    };

    // 결제 폼 생성
    const createPaymentForm = () => {
      // 기존 폼이 있으면 제거
      const existingForm = document.getElementById("inicis-payment-form");
      if (existingForm) {
        existingForm.remove();
      }

      const form = document.createElement("form");
      form.id = "inicis-payment-form";
      form.method = "POST";
      form.style.display = "none";

      // 결제 폼 데이터 추가
      Object.entries(paymentForm).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      // 추가 필드
      const additionalFields = {
        version: "1.0",
        gopaymethod: "Card:DirectBank:VBank:HPP",
        currency: "WON",
        acceptmethod: "HPP(1):va_receipt:below1000:centerCd(Y)",
      };

      Object.entries(additionalFields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      return form;
    };

    // 결제 실행
    const executePayment = async () => {
      try {
        await loadInicisScript();

        createPaymentForm();

        // INIStdPay.pay() 호출
        if (window.INIStdPay) {
          window.INIStdPay.pay("inicis-payment-form");
          // 결제창이 열렸으므로 모달 닫기
          onClose();
        } else {
          throw new Error("KG이니시스 결제 시스템을 로드할 수 없습니다.");
        }
      } catch (error) {
        console.error("결제 실행 오류:", error);
        alert(
          "결제창을 열 수 없습니다. 브라우저 팝업 차단을 해제하고 다시 시도해주세요."
        );
        setStep(2);
      }
    };

    executePayment();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        const currentChargeInfo = getCurrentChargeInfo();
        const currentAmount = getCurrentAmount();
        const isValidAmount = currentAmount >= MIN_AMOUNT && currentAmount <= MAX_AMOUNT;
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {allowEdit ? "충전 금액 입력" : "충전 금액 확인"}
              </h3>
              <p className="text-gray-600">
                {allowEdit ? "충전하실 금액을 입력해주세요." : "입력하신 충전 금액을 확인해주세요."}
              </p>
              {requiredAmount && allowEdit && (
                <p className="text-sm text-blue-600 mt-1">
                  권장 충전 금액: {Math.ceil(requiredAmount / 10000) * 10000}원 (부족 금액 기준)
                </p>
              )}
            </div>

            {allowEdit ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor="modal-charge-amount" className="block text-sm font-medium text-gray-700 mb-3">
                    충전 금액 입력
                  </label>
                  
                  <div className="relative">
                    <input
                      type="text"
                      id="modal-charge-amount"
                      value={inputAmount}
                      onChange={handleAmountChange}
                      className="w-full px-4 py-4 text-2xl font-bold text-right border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className={`mt-2 px-3 py-2 text-sm rounded ${
                    currentAmount < MIN_AMOUNT 
                      ? "bg-yellow-100 text-yellow-800" 
                      : amountError 
                        ? "bg-red-100 text-red-800"
                        : "bg-transparent"
                  }`}>
                    {currentAmount < MIN_AMOUNT 
                      ? `결제 금액은 최소 ${MIN_AMOUNT.toLocaleString()}원 이상 부터 가능합니다`
                      : amountError
                        ? amountError
                        : ""
                    }
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: "1만", amount: 10000 },
                    { label: "5만", amount: 50000 },
                    { label: "10만", amount: 100000 },
                    { label: "50만", amount: 500000 }
                  ].map((option) => (
                    <button
                      key={option.amount}
                      onClick={() => handleQuickAmount(option.amount)}
                      className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 mb-2">
                    {currentChargeInfo?.name}
                  </div>
                  <div className="text-lg text-blue-800">
                    <strong>충전 금액:</strong> ₩
                    {currentChargeInfo?.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={allowEdit && !isValidAmount}
                className={`flex-1 px-4 py-2 rounded-md ${
                  allowEdit && !isValidAmount
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                다음
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                결제 방법 선택
              </h3>
              <p className="text-gray-600">
                KG이니시스를 통해 안전하게 결제하세요.
              </p>
            </div>

            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPaymentMethod === method.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <method.icon />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {method.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {method.description}
                      </div>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <div className="h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckIcon />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>충전 금액:</strong> ₩
                {getCurrentAmount().toLocaleString()}
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <strong>주의사항:</strong> 팝업 차단이 해제되어 있어야 결제창이
                정상적으로 열립니다. 브라우저 주소창 우측의 팝업 차단 아이콘을
                클릭하여 허용해주세요.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={handleInicisPayment}
                disabled={!selectedPaymentMethod || isProcessingPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isProcessingPayment ? "결제 준비 중..." : "결제하기"}
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                결제 준비 완료
              </h3>
              <p className="text-gray-600">
                결제창을 열어 결제를 진행해주세요.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>충전 금액:</strong> ₩
                {getCurrentAmount().toLocaleString()}
                <br />
                <strong>결제 방법:</strong> KG이니시스
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-800">
                <strong>결제 준비 완료!</strong>
                <br />
                아래 버튼을 클릭하면 KG이니시스 결제창이 새 창에서 열립니다.
                결제 완료 후 자동으로 광고머니가 충전됩니다.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={openPaymentWindow}
                disabled={!paymentForm}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-lg font-semibold"
              >
                🚀 결제창 열기
              </button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                결제 준비 중
              </h3>
              <p className="text-gray-600">
                KG이니시스 결제 정보를 준비하고 있습니다...
              </p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">광고머니 충전</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XIcon />
          </button>
        </div>
        {renderStep()}
      </div>
    </div>
  );
}
