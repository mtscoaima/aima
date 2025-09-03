"use client";

import React, { useState } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function PointChargeManagementPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="flex min-h-[calc(100vh-64px)] mt-16 bg-gray-50 text-gray-800 font-['Noto_Sans_KR','-apple-system','BlinkMacSystemFont','Segoe_UI','Roboto','sans-serif']">
        <div className="flex-1 ml-0 md:ml-[250px] p-4 md:p-6 bg-gray-50 transition-all duration-300 ease-in-out">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 md:gap-0">
            <h1 className="m-0 text-2xl md:text-3xl font-bold text-gray-800">포인트 충전 관리</h1>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-8 text-center">
              <p className="mb-4 text-gray-500 text-lg">포인트 충전 관리 페이지입니다.</p>
              <p className="text-gray-500 text-lg">추후 기능이 구현될 예정입니다.</p>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}