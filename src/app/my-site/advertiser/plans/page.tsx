"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdvertiserLoginRequiredGuard } from "@/components/RoleGuard";
import { useBalance } from "@/contexts/BalanceContext";

// 요금제 타입
type PlanType = "prepaid" | "postpaid";

// 충전 수단 타입
type PaymentMethod = "card" | "bank" | "virtual" | "phone";

// 결제 상태 타입
type PaymentStatus = "completed" | "pending" | "failed";

// 선불 요금제 데이터 타입
interface PrepaidPlanData {
  balance: number;
  pointBalance: number;
  lastChargeDate: string;
  lastChargeAmount: number;
  paymentMethod: PaymentMethod;
  chargeHistory: {
    date: string;
    amount: number;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    receiptUrl: string;
  }[];
  bonusHistory: {
    date: string;
    amount: number;
    reason: string;
    expiryDate: string;
  }[];
  usageHistory: {
    date: string;
    amount: number;
    service: string;
    description: string;
  }[];
}

// 후불 요금제 데이터 타입
interface PostpaidPlanData {
  companyInfo: {
    companyName: string;
    businessNumber: string;
    representativeName: string;
    address: string;
  };
  paymentInfo: {
    paymentMethod: PaymentMethod;
    cardInfo?: {
      cardCompany: string;
      lastFourDigits: string;
      expiryDate: string;
    };
    bankInfo?: {
      bankName: string;
      accountNumber: string;
      accountHolder: string;
    };
  };
  invoiceInfo: {
    email: string;
    managerName: string;
    contactNumber: string;
    address: string;
  };
  billingHistory: {
    date: string;
    amount: number;
    status: PaymentStatus;
    dueDate: string;
    invoiceUrl: string;
  }[];
}

// 요금제 페이지 컴포넌트
export default function PlansPage() {
  const { balanceData, setBalanceData, formatCurrency } = useBalance();

  // 현재 요금제 타입 상태 (실제 앱에서는 API로부터 가져옴)
  const [currentPlan, setCurrentPlan] = useState<PlanType>("prepaid");

  // 요금제 변경 모달 표시 상태
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);

  // 충전 모달 표시 상태
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<string>("");

  // 선불 요금제 데이터 (샘플) - 이제 balanceData에서 가져옴
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prepaidData, setPrepaidData] = useState<PrepaidPlanData>({
    balance: balanceData.balance,
    pointBalance: balanceData.pointBalance,
    lastChargeDate: balanceData.lastChargeDate,
    lastChargeAmount: balanceData.lastChargeAmount,
    paymentMethod: balanceData.paymentMethod as PaymentMethod,
    chargeHistory: [
      {
        date: "2025-05-10 15:32:45",
        amount: 300000,
        paymentMethod: "card",
        status: "completed",
        receiptUrl: "#",
      },
      {
        date: "2025-04-05 11:21:33",
        amount: 200000,
        paymentMethod: "bank",
        status: "completed",
        receiptUrl: "#",
      },
    ],
    bonusHistory: [
      {
        date: "2025-05-10 15:32:45",
        amount: 15000,
        reason: "충전 금액의 5% 적립",
        expiryDate: "2025-08-10",
      },
      {
        date: "2025-04-05 11:21:33",
        amount: 10000,
        reason: "충전 금액의 5% 적립",
        expiryDate: "2025-07-05",
      },
    ],
    usageHistory: [
      {
        date: "2025-05-15 10:12:23",
        amount: 5000,
        service: "문자메시지 발송",
        description: "SMS 50건 발송",
      },
      {
        date: "2025-05-12 14:25:33",
        amount: 20000,
        service: "타겟마케팅",
        description: "캠페인 ID: 1234 실행",
      },
    ],
  });

  // 후불 요금제 데이터 (샘플)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [postpaidData, setPostpaidData] = useState<PostpaidPlanData>({
    companyInfo: {
      companyName: "솔라피 테크놀로지",
      businessNumber: "123-45-67890",
      representativeName: "김솔라",
      address: "서울특별시 강남구 테헤란로 123, 7층 701호",
    },
    paymentInfo: {
      paymentMethod: "card",
      cardInfo: {
        cardCompany: "신한카드",
        lastFourDigits: "4567",
        expiryDate: "03/28",
      },
    },
    invoiceInfo: {
      email: "tax@solarpi.com",
      managerName: "정재무",
      contactNumber: "010-9876-5432",
      address: "서울특별시 강남구 테헤란로 123, 7층 701호",
    },
    billingHistory: [
      {
        date: "2025-05-01",
        amount: 450000,
        status: "completed",
        dueDate: "2025-05-15",
        invoiceUrl: "#",
      },
      {
        date: "2025-04-01",
        amount: 320000,
        status: "completed",
        dueDate: "2025-04-15",
        invoiceUrl: "#",
      },
    ],
  });

  // 결제 방식을 한글로 표시
  const getPaymentMethodText = (method: PaymentMethod) => {
    switch (method) {
      case "card":
        return "신용카드";
      case "bank":
        return "계좌이체";
      case "virtual":
        return "가상계좌";
      case "phone":
        return "휴대폰결제";
      default:
        return "알 수 없음";
    }
  };

  // 결제 상태를 한글로 표시
  const getPaymentStatusText = (status: PaymentStatus) => {
    switch (status) {
      case "completed":
        return "완료";
      case "pending":
        return "처리중";
      case "failed":
        return "실패";
      default:
        return "알 수 없음";
    }
  };

  // 결제 상태에 따른 배지 스타일
  const getStatusBadgeStyle = (status: PaymentStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // 요금제 타입을 한글로 표시
  const getPlanTypeText = (planType: PlanType) => {
    switch (planType) {
      case "prepaid":
        return "선불 요금제";
      case "postpaid":
        return "후불 요금제";
      default:
        return "알 수 없음";
    }
  };

  // 요금제 변경 버튼 클릭 핸들러
  const handleChangePlanClick = () => {
    setShowChangePlanModal(true);
  };

  // 모달에서 요금제 변경 핸들러
  const handleChangePlan = (planType: PlanType) => {
    // 실제 구현에서는 서버에 요금제 변경 요청을 보냄
    setCurrentPlan(planType);
    setShowChangePlanModal(false);
  };

  // 충전하기 핸들러
  const handleCharge = () => {
    setShowChargeModal(true);
  };

  // 충전 확인 핸들러
  const handleConfirmCharge = () => {
    const amount = parseInt(chargeAmount);
    if (amount > 0) {
      const newBalance = balanceData.balance + amount;
      const bonusAmount = Math.floor(amount * 0.05); // 5% 보너스
      const newPointBalance = balanceData.pointBalance + bonusAmount;

      setBalanceData({
        ...balanceData,
        balance: newBalance,
        pointBalance: newPointBalance,
        lastChargeDate: new Date()
          .toISOString()
          .replace("T", " ")
          .substring(0, 19),
        lastChargeAmount: amount,
      });

      setShowChargeModal(false);
      setChargeAmount("");
      alert(
        `${formatCurrency(
          amount
        )} 충전이 완료되었습니다!\n보너스 ${formatCurrency(
          bonusAmount
        )}이 적립되었습니다.`
      );
    }
  };

  // 환불신청 핸들러
  const handleRefund = () => {
    alert("환불신청 페이지로 이동합니다.");
    // 실제 구현에서는 환불신청 페이지로 이동합니다
  };

  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setShowChangePlanModal(false);
  };

  return (
    <AdvertiserLoginRequiredGuard>
      <div className="pt-20 p-4 max-w-5xl mx-auto">
        <div className="mb-20"></div>

        {/* 현재 요금제 정보 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-blue-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-medium">현재 요금제</h2>
              <div className="mt-1 flex items-center">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {getPlanTypeText(currentPlan)}
                </span>
                {currentPlan === "prepaid" && (
                  <span className="ml-4 text-gray-700">
                    잔액:{" "}
                    <span className="font-medium text-blue-600">
                      {formatCurrency(balanceData.balance)}
                    </span>
                  </span>
                )}
              </div>
            </div>
            <button
              className="mt-3 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleChangePlanClick}
            >
              요금제 변경
            </button>
          </div>
        </div>

        {/* 선불 요금제 컨텐츠 */}
        {currentPlan === "prepaid" && (
          <>
            {/* 잔액 정보 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-green-500">
              <h2 className="text-lg font-semibold mb-4">잔액 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">현재 잔액</p>
                  <p className="font-medium text-xl text-blue-600">
                    {formatCurrency(balanceData.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">포인트 잔액</p>
                  <p className="font-medium text-xl text-green-600">
                    {formatCurrency(balanceData.pointBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">최근 충전일</p>
                  <p className="font-medium">{balanceData.lastChargeDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">최근 충전 금액</p>
                  <p className="font-medium">
                    {formatCurrency(balanceData.lastChargeAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <button
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleCharge}
                >
                  충전하기
                </button>
                <button
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={handleRefund}
                >
                  환불신청
                </button>
              </div>
            </div>

            {/* 충전 내역 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">충전 내역</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        충전일시
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        금액
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        결제수단
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        상태
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        영수증
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prepaidData.chargeHistory.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getPaymentMethodText(item.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(
                              item.status
                            )}`}
                          >
                            {getPaymentStatusText(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <a
                            href={item.receiptUrl}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            보기
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 증정 내역 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">포인트 증정 내역</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        증정일시
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        금액
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        사유
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        만료일
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prepaidData.bonusHistory.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.expiryDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 사용 내역 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">사용 내역</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        사용일시
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        금액
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        서비스
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        설명
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prepaidData.usageHistory.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.service}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* 후불 요금제 컨텐츠 */}
        {currentPlan === "postpaid" && (
          <>
            {/* 기업 정보 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-green-500">
              <h2 className="text-lg font-semibold mb-4">기업 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">기업명</p>
                  <p className="font-medium">
                    {postpaidData.companyInfo.companyName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">사업자등록번호</p>
                  <p className="font-medium">
                    {postpaidData.companyInfo.businessNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">대표자명</p>
                  <p className="font-medium">
                    {postpaidData.companyInfo.representativeName}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">주소</p>
                  <p className="font-medium">
                    {postpaidData.companyInfo.address}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  기업 정보 수정
                </button>
              </div>
            </div>

            {/* 결제 정보 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">결제 정보</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">결제 수단</p>
                  <p className="font-medium">
                    {getPaymentMethodText(
                      postpaidData.paymentInfo.paymentMethod
                    )}
                  </p>
                </div>

                {postpaidData.paymentInfo.paymentMethod === "card" &&
                  postpaidData.paymentInfo.cardInfo && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">카드사</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.cardInfo.cardCompany}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">카드번호</p>
                        <p className="font-medium">
                          **** **** ****{" "}
                          {postpaidData.paymentInfo.cardInfo.lastFourDigits}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">유효기간</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.cardInfo.expiryDate}
                        </p>
                      </div>
                    </>
                  )}

                {postpaidData.paymentInfo.paymentMethod === "bank" &&
                  postpaidData.paymentInfo.bankInfo && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">은행명</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.bankInfo.bankName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">계좌번호</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.bankInfo.accountNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">예금주</p>
                        <p className="font-medium">
                          {postpaidData.paymentInfo.bankInfo.accountHolder}
                        </p>
                      </div>
                    </>
                  )}
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  결제 정보 수정
                </button>
              </div>
            </div>

            {/* 세금계산서 수령자 정보 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">
                세금계산서 수령자 정보
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">수신 이메일</p>
                  <p className="font-medium">
                    {postpaidData.invoiceInfo.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">담당자명</p>
                  <p className="font-medium">
                    {postpaidData.invoiceInfo.managerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">연락처</p>
                  <p className="font-medium">
                    {postpaidData.invoiceInfo.contactNumber}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600">주소</p>
                  <p className="font-medium">
                    {postpaidData.invoiceInfo.address}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  세금계산서 수령자 정보 수정
                </button>
              </div>
            </div>

            {/* 청구 내역 */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h2 className="text-lg font-semibold mb-4">청구 내역</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        청구일
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        금액
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        상태
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        납부일
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        세금계산서
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {postpaidData.billingHistory.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeStyle(
                              item.status
                            )}`}
                          >
                            {getPaymentStatusText(item.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.dueDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <a
                            href={item.invoiceUrl}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            보기
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* 요금제 변경 안내 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">요금제 이용 안내</h2>
          <div className="p-4 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-600 mb-2">
              선불 요금제와 후불 요금제 간 변경을 원하시면 고객센터로
              문의해주세요.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              - 후불 요금제로 변경 시 회사 신용 평가 절차가 필요할 수 있습니다.
            </p>
            <p className="text-sm text-gray-600 mb-2">
              - 선불 요금제로 변경 시 미납 금액을 정산한 후 변경됩니다.
            </p>
            <div className="mt-4">
              <Link
                href="/customer-service/inquiry"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                고객센터 문의하기
              </Link>
            </div>
          </div>
        </div>

        {/* 충전 모달 */}
        {showChargeModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  잔액 충전
                </h3>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    충전 금액 (원)
                  </label>
                  <input
                    type="number"
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="충전할 금액을 입력하세요"
                    min="1000"
                    step="1000"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    최소 충전 금액: 1,000원 (5% 보너스 포인트 적립)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleConfirmCharge}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    충전하기
                  </button>
                  <button
                    onClick={() => setShowChargeModal(false)}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 요금제 변경 모달 */}
        {showChangePlanModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  요금제 변경
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleChangePlan("prepaid")}
                    className={`w-full p-3 text-left border rounded-lg ${
                      currentPlan === "prepaid"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">선불 요금제</div>
                    <div className="text-sm text-gray-600">
                      미리 충전하여 사용하는 방식
                    </div>
                  </button>
                  <button
                    onClick={() => handleChangePlan("postpaid")}
                    className={`w-full p-3 text-left border rounded-lg ${
                      currentPlan === "postpaid"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">후불 요금제</div>
                    <div className="text-sm text-gray-600">
                      사용 후 정기 결제하는 방식
                    </div>
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvertiserLoginRequiredGuard>
  );
}
