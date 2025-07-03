import React, { useState, useEffect } from "react";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";

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

interface UserInfo {
  id: string;
  email: string;
  name: string;
  phone?: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  packageInfo,
}: PaymentModalProps) {
  const [step, setStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [widgets, setWidgets] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // 로컬 스토리지에서 토큰 가져오기
        const token = localStorage.getItem("accessToken");

        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        // 토큰이 있으면 Authorization 헤더에 추가
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch("/api/users/me", {
          headers,
        });

        if (response.ok) {
          const data = await response.json();

          // API 응답 구조 확인 후 매핑
          let userData;
          if (data.user) {
            // data.user가 있는 경우
            userData = data.user;
          } else if (data.id) {
            // data에 직접 사용자 정보가 있는 경우
            userData = data;
          } else {
            console.error(data);
            return;
          }

          const mappedUserInfo = {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            phone: userData.phone_number || userData.phone, // phone_number 또는 phone
          };
          setUserInfo(mappedUserInfo);
        } else if (response.status === 401) {
          // 인증 실패 시 기본값 사용 (로그인하지 않은 사용자도 결제 가능)
          await response.text();
        } else {
          await response.text();
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (isOpen) {
      fetchUserInfo();
    }
  }, [isOpen]);

  // 토스페이먼츠 SDK 초기화
  useEffect(() => {
    if (!isOpen || !packageInfo) {
      return;
    }

    const initializeTossPayments = async () => {
      try {
        // 토스페이먼츠 클라이언트 키 (환경변수에서 가져오기)
        const envClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
        const fallbackClientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
        const clientKey = envClientKey || fallbackClientKey;

        if (!clientKey) {
          throw new Error("토스페이먼츠 클라이언트 키가 설정되지 않았습니다.");
        }

        // 사용자 ID가 있으면 사용, 없으면 임시 키 생성
        const customerKey = userInfo?.id
          ? `customer_${userInfo.id}_${Date.now()}`
          : `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const tossPayments = await loadTossPayments(clientKey);

        const widgetsInstance = tossPayments.widgets({ customerKey });

        await widgetsInstance.setAmount({
          currency: "KRW",
          value: packageInfo.price,
        });

        setWidgets(widgetsInstance);
      } catch {
        // 사용자에게 에러 표시
        alert("결제 시스템 초기화에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    };

    initializeTossPayments();
  }, [isOpen, packageInfo, userInfo]);

  // 3단계에서 결제 위젯 렌더링
  useEffect(() => {
    if (step === 3 && widgets) {
      const renderPaymentWidget = async () => {
        try {
          await widgets.renderPaymentMethods({
            selector: "#payment-method",
            variantKey: "DEFAULT",
          });
        } catch (error) {
          console.error(error);
        }
      };
      renderPaymentWidget();
    }
  }, [step, widgets]);

  const generateOrderId = () => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substr(2, 9);
    const userId = userInfo?.id || "unknown";
    return `credit_${timestamp}_${userId}_${randomString}`;
  };

  if (!isOpen || !packageInfo) return null;

  const paymentMethods = [
    {
      id: "toss",
      name: "토스페이먼츠",
      icon: CreditCardIcon,
      description: "카드, 간편결제, 계좌이체 등",
    },
  ];

  const handleTossPayment = async () => {
    if (isProcessingPayment) {
      return;
    }

    if (!widgets) {
      alert("결제 시스템을 초기화하는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      setIsProcessingPayment(true);
      setStep(4);

      const orderId = generateOrderId();
      const orderName = `크레딧 ${packageInfo.credits.toLocaleString()}개 충전`;

      // 모든 결제를 payment/success 페이지로 통일하여 결제 승인 API 호출 보장
      const successUrl = `${window.location.origin}/payment/success`;
      const failUrl = `${window.location.origin}/payment/fail`;

      // 전화번호 형식 검증 및 정리
      const formatPhoneNumber = (phone?: string) => {
        if (!phone) return "01000000000"; // 기본 전화번호

        // 숫자만 추출
        const cleaned = phone.replace(/\D/g, "");

        // 한국 휴대폰 번호 형식 검증 (010, 011, 016, 017, 018, 019로 시작하는 11자리)
        if (cleaned.length === 11 && /^01[0-9]/.test(cleaned)) {
          return cleaned;
        }

        // 형식이 맞지 않으면 기본값 반환
        return "01000000000";
      };

      const formattedPhone = formatPhoneNumber(userInfo?.phone);

      // 이메일 형식 검증
      const formatEmail = (email?: string) => {
        if (!email || !email.includes("@")) {
          return "customer@example.com";
        }
        return email;
      };

      const formattedEmail = formatEmail(userInfo?.email);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const paymentData: any = {
        orderId,
        orderName,
        successUrl,
        failUrl,
        customerEmail: formattedEmail,
        customerName: userInfo?.name || "고객",
      };

      // 전화번호가 유효한 경우에만 추가
      if (userInfo?.phone && userInfo.phone.trim()) {
        paymentData.customerMobilePhone = formattedPhone;
      }

      await widgets.requestPayment(paymentData);

      // Promise 방식에서는 결과가 바로 반환되지 않으므로
      // successUrl로 리다이렉트됩니다.
    } catch (error) {
      console.error(error);

      const errorMessage =
        error instanceof Error ? error.message : "알 수 없는 오류";

      // S008 에러 (중복 요청)는 무시하고 성공으로 처리
      if (
        errorMessage.includes("S008") ||
        errorMessage.includes("기존 요청을 처리중")
      ) {
        // 결제 성공 페이지로 리다이렉트하지 않고 모달만 닫기
        alert("결제가 처리되었습니다. 결제 결과를 확인해주세요.");
        onClose();
        return;
      }

      alert(`결제에 실패했습니다: ${errorMessage}`);
      setStep(2);
    } finally {
      setIsProcessingPayment(false);
    }
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
                토스페이먼츠를 통해 안전하게 결제하세요.
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <strong>안전한 결제:</strong> 토스페이먼츠는 PCI-DSS 인증을 받은
                안전한 결제 시스템입니다. 카드정보는 암호화되어 전송되며,
                당사에서는 카드정보를 저장하지 않습니다.
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>테스트 모드:</strong> 현재 테스트 환경에서 실행
                중입니다. 실제 결제는 이루어지지 않으며, 테스트용 카드번호를
                사용할 수 있습니다.
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
                onClick={() => setStep(3)}
                disabled={!selectedPaymentMethod || !widgets}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {widgets ? "다음" : "결제 시스템 준비중..."}
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
              <p className="text-gray-600">
                결제 방법을 선택하고 정보를 입력해주세요.
              </p>
            </div>

            {/* 토스페이먼츠 결제 위젯이 렌더링될 영역 */}
            <div id="payment-method" className="min-h-[200px]"></div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>결제 금액:</strong> ₩
                {packageInfo.price.toLocaleString()}
                <br />
                <strong>충전 크레딧:</strong>{" "}
                {packageInfo.credits.toLocaleString()}개
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
                onClick={handleTossPayment}
                disabled={!widgets || isProcessingPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isProcessingPayment
                  ? "결제 처리 중..."
                  : widgets
                  ? "결제하기"
                  : "결제 시스템 준비중..."}
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
              <p className="text-gray-600">
                토스페이먼츠에서 결제를 처리하고 있습니다...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                잠시만 기다려주세요. 결제창으로 이동합니다.
              </p>
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
          <h2 className="text-2xl font-bold text-gray-900">크레딧 충전</h2>
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
