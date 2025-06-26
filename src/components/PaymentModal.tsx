import { useState } from "react";

// Simple icon components to replace lucide-react
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

const CreditCardIcon = () => (
  <svg
    className="h-6 w-6"
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

const BuildingIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
    />
  </svg>
);

const SmartphoneIcon = () => (
  <svg
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 18h.01M8 21h8a1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v16a1 1 0 001 1z"
    />
  </svg>
);

const CheckIcon = () => (
  <svg
    className="h-4 w-4"
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
);

interface Package {
  id: number;
  credits: number;
  price: number;
  bonus: number;
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageInfo: Package | null;
  onPaymentComplete: (packageInfo: Package) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  packageInfo,
  onPaymentComplete,
}: PaymentModalProps) {
  const [step, setStep] = useState(1); // 1: 패키지 확인, 2: 결제 방법, 3: 결제 정보, 4: 처리중, 5: 완료
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardHolder: "",
    bankAccount: "",
    phoneNumber: "",
  });

  if (!isOpen || !packageInfo) return null;

  const paymentMethods = [
    {
      id: "card",
      name: "신용카드",
      icon: CreditCardIcon,
      description: "Visa, MasterCard, 국내카드",
    },
    {
      id: "bank",
      name: "계좌이체",
      icon: BuildingIcon,
      description: "실시간 계좌이체",
    },
    {
      id: "phone",
      name: "휴대폰 결제",
      icon: SmartphoneIcon,
      description: "통신사 소액결제",
    },
  ];

  const handlePayment = async () => {
    setStep(4);

    // 결제 처리 시뮬레이션
    setTimeout(() => {
      setStep(5);

      // 결제 완료 후 콜백 호출
      setTimeout(() => {
        onPaymentComplete(packageInfo);
        onClose();
        resetModal();
      }, 2000);
    }, 3000);
  };

  const resetModal = () => {
    setStep(1);
    setSelectedPaymentMethod("");
    setPaymentInfo({
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardHolder: "",
      bankAccount: "",
      phoneNumber: "",
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                패키지 선택 확인
              </h3>
              <p className="text-gray-600">
                선택하신 패키지가 맞는지 확인해주세요.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {packageInfo.credits.toLocaleString()}
                </div>
                <div className="text-gray-600 mb-4">크레딧</div>
                {packageInfo.bonus > 0 && (
                  <div className="text-green-600 mb-4">
                    +{packageInfo.bonus} 보너스 크레딧
                  </div>
                )}
                <div className="text-2xl font-bold text-gray-900">
                  ₩{packageInfo.price.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
                원하시는 결제 방법을 선택해주세요.
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

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedPaymentMethod}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                결제 정보 입력
              </h3>
              <p className="text-gray-600">결제 정보를 입력해주세요.</p>
            </div>

            {selectedPaymentMethod === "card" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카드번호
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.cardNumber}
                    onChange={(e) =>
                      setPaymentInfo({
                        ...paymentInfo,
                        cardNumber: e.target.value,
                      })
                    }
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      유효기간
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.expiryDate}
                      onChange={(e) =>
                        setPaymentInfo({
                          ...paymentInfo,
                          expiryDate: e.target.value,
                        })
                      }
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV
                    </label>
                    <input
                      type="text"
                      value={paymentInfo.cvv}
                      onChange={(e) =>
                        setPaymentInfo({ ...paymentInfo, cvv: e.target.value })
                      }
                      placeholder="123"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카드소유자명
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.cardHolder}
                    onChange={(e) =>
                      setPaymentInfo({
                        ...paymentInfo,
                        cardHolder: e.target.value,
                      })
                    }
                    placeholder="홍길동"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {selectedPaymentMethod === "bank" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={paymentInfo.bankAccount}
                  onChange={(e) =>
                    setPaymentInfo({
                      ...paymentInfo,
                      bankAccount: e.target.value,
                    })
                  }
                  placeholder="123-456-789012"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {selectedPaymentMethod === "phone" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  휴대폰번호
                </label>
                <input
                  type="text"
                  value={paymentInfo.phoneNumber}
                  onChange={(e) =>
                    setPaymentInfo({
                      ...paymentInfo,
                      phoneNumber: e.target.value,
                    })
                  }
                  placeholder="010-1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                이전
              </button>
              <button
                onClick={handlePayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                결제하기
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
                결제 처리 중
              </h3>
              <p className="text-gray-600">잠시만 기다려주세요...</p>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckIcon />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                결제 완료!
              </h3>
              <p className="text-gray-600">
                크레딧이 성공적으로 충전되었습니다.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-800">
                +{(packageInfo.credits + packageInfo.bonus).toLocaleString()}{" "}
                크레딧이 충전되었습니다.
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((stepNumber) => (
              <div
                key={stepNumber}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step >= stepNumber
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step > stepNumber ? <CheckIcon /> : stepNumber}
              </div>
            ))}
          </div>
          {step < 4 && (
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <XIcon />
            </button>
          )}
        </div>

        {renderStep()}
      </div>
    </div>
  );
}
