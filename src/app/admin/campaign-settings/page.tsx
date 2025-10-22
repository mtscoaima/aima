"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import PricingSettings from "@/components/admin/campaign-settings/PricingSettings";
import BudgetSettings from "@/components/admin/campaign-settings/BudgetSettings";
import CommissionSettings from "@/components/admin/campaign-settings/CommissionSettings";
import "./styles.css";

export default function CampaignSettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pricing" | "budget" | "commission">("pricing");

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="admin-layout">
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="campaigns-page">
        <div className="campaigns-main-container">
          <AdminGuard>
            <div className="campaigns-header">
              <h1>캠페인 예산 설정</h1>
            </div>

            {/* 탭 네비게이션 */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("pricing")}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "pricing"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  차등 단가 설정
                </button>
                <button
                  onClick={() => setActiveTab("budget")}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "budget"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  캠페인 예산 설정
                </button>
                <button
                  onClick={() => setActiveTab("commission")}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "commission"
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  수수료 비율 설정
                </button>
              </nav>
            </div>

            {/* 탭 컨텐츠 */}
            {activeTab === "pricing" && <PricingSettings />}
            {activeTab === "budget" && <BudgetSettings />}
            {activeTab === "commission" && <CommissionSettings />}
          </AdminGuard>
        </div>
      </div>
    </div>
  );
}
