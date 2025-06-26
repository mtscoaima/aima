"use client";

import React, { useState } from "react";
import RoleGuard from "@/components/RoleGuard";
import "./styles.css";

import { CreditBalance } from "@/components/CreditBalance";
import { CreditPackages } from "@/components/CreditPackages";
import { CreditHistory } from "@/components/CreditHistory";
import { UsageHistoryPage } from "@/components/UsageHistoryPage";
import { ChargeHistoryPage } from "@/components/ChargeHistoryPage";
import { PaymentModal } from "@/components/PaymentModal";

interface Package {
  id: number;
  credits: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

const CreditManagementPage = () => {
  const [activeTab, setActiveTab] = useState("charge");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // refreshKey 상태는 실제 API 연동 시 useSWR 이나 react-query의 re-fetch 로직으로 대체될 수 있습니다.
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCharge = (packageInfo: Package) => {
    setSelectedPackage(packageInfo);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentComplete = (packageInfo: Package) => {
    setRefreshKey((prev) => prev + 1);
    alert(
      `${(
        packageInfo.credits + (packageInfo.bonus || 0)
      ).toLocaleString()} 크레딧이 충전되었습니다!`
    );
  };

  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setSelectedPackage(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "charge":
        return (
          <div className="space-y-6" key={`charge-${refreshKey}`}>
            <CreditBalance />
            <CreditPackages onCharge={handleCharge} />
            <CreditHistory />
          </div>
        );
      case "usage":
        return <UsageHistoryPage />;
      case "history":
        // 충전 내역 탭은 refreshKey를 key로 전달하여 충전 후 재 렌더링되도록 합니다.
        return <ChargeHistoryPage key={`history-${refreshKey}`} />;
      default:
        return null;
    }
  };

  const allowedRoles = ["USER", "ADMIN"];

  return (
    <RoleGuard allowedRoles={allowedRoles}>
      <div className="credit-management-container">
        <header className="cm-header">
          <h1>크레딧 충전 관리</h1>
          <p>크레딧 충전 및 사용 내역을 관리할 수 있습니다.</p>
        </header>

        <div className="cm-tabs">
          <button
            className={`cm-tab-btn ${activeTab === "charge" ? "active" : ""}`}
            onClick={() => setActiveTab("charge")}
          >
            크레딧 충전
          </button>
          <button
            className={`cm-tab-btn ${activeTab === "usage" ? "active" : ""}`}
            onClick={() => setActiveTab("usage")}
          >
            사용 내역
          </button>
          <button
            className={`cm-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            충전 내역
          </button>
        </div>

        <div className="cm-content">{renderTabContent()}</div>

        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handleClosePaymentModal}
          packageInfo={selectedPackage}
          onPaymentComplete={handlePaymentComplete}
        />
      </div>
    </RoleGuard>
  );
};

export default CreditManagementPage;
