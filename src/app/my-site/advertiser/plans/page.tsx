"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdvertiserGuard } from "@/components/RoleGuard";

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
  // 현재 요금제 타입 상태 (실제 앱에서는 API로부터 가져옴)
  const [currentPlan, setCurrentPlan] = useState<PlanType>("prepaid");

  // 요금제 변경 모달 표시 상태
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);

  // 선불 요금제 데이터 (샘플)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prepaidData, setPrepaidData] = useState<PrepaidPlanData>({
    balance: 500000,
    pointBalance: 25000,
    lastChargeDate: "2025-05-10 15:32:45",
    lastChargeAmount: 300000,
    paymentMethod: "card",
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

  // 금액 형식 변환 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
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
    alert("충전 페이지로 이동합니다.");
    // 실제 구현에서는 충전 페이지로 이동합니다
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
    <AdvertiserGuard>
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">요금제 관리</h1>
        </div>

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
                      {formatCurrency(prepaidData.balance)}
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
                    {formatCurrency(prepaidData.balance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">포인트 잔액</p>
                  <p className="font-medium text-xl text-green-600">
                    {formatCurrency(prepaidData.pointBalance)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">최근 충전일</p>
                  <p className="font-medium">{prepaidData.lastChargeDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">최근 충전 금액</p>
                  <p className="font-medium">
                    {formatCurrency(prepaidData.lastChargeAmount)}
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

        {/* 요금제 변경 모달 */}
        {showChangePlanModal && (
          <div
            className="fixed inset-0 overflow-y-auto"
            style={{ zIndex: 1001 }}
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={handleCloseModal}
              ></div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-900"
                        id="modal-title"
                      >
                        요금제 변경
                      </h3>
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-4">
                          변경하실 요금제를 선택해주세요. 요금제 변경에는 관리자
                          승인이 필요할 수 있습니다.
                        </p>

                        <div className="mt-4 space-y-3">
                          <div
                            className={`p-4 border rounded-lg ${
                              currentPlan === "prepaid"
                                ? "bg-blue-50 border-blue-300"
                                : "hover:bg-gray-50 cursor-pointer"
                            }`}
                            onClick={() => handleChangePlan("prepaid")}
                          >
                            <div className="flex items-center">
                              <div
                                className={`h-5 w-5 rounded-full ${
                                  currentPlan === "prepaid"
                                    ? "bg-blue-600"
                                    : "bg-gray-200"
                                } flex items-center justify-center mr-3`}
                              >
                                {currentPlan === "prepaid" && (
                                  <span className="text-white text-xs">✓</span>
                                )}
                              </div>
                              <h4 className="text-md font-medium">
                                선불 요금제
                              </h4>
                            </div>
                            <p className="mt-1 ml-8 text-sm text-gray-600">
                              미리 충전 후 사용하는 방식입니다. 충전 금액의 5%가
                              포인트로 적립됩니다.
                            </p>
                          </div>

                          <div
                            className={`p-4 border rounded-lg ${
                              currentPlan === "postpaid"
                                ? "bg-blue-50 border-blue-300"
                                : "hover:bg-gray-50 cursor-pointer"
                            }`}
                            onClick={() => handleChangePlan("postpaid")}
                          >
                            <div className="flex items-center">
                              <div
                                className={`h-5 w-5 rounded-full ${
                                  currentPlan === "postpaid"
                                    ? "bg-blue-600"
                                    : "bg-gray-200"
                                } flex items-center justify-center mr-3`}
                              >
                                {currentPlan === "postpaid" && (
                                  <span className="text-white text-xs">✓</span>
                                )}
                              </div>
                              <h4 className="text-md font-medium">
                                후불 요금제
                              </h4>
                            </div>
                            <p className="mt-1 ml-8 text-sm text-gray-600">
                              이용한 만큼 월별로 청구됩니다. 기업 신용 평가가
                              필요합니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() =>
                      alert(
                        "요금제 변경 요청이 접수되었습니다. 관리자 검토 후 진행됩니다."
                      )
                    }
                  >
                    변경 요청
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleCloseModal}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvertiserGuard>
  );
}
