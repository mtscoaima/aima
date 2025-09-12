"use client";

import React, { useState } from "react";

import RoleGuard from "@/components/RoleGuard";
import { useRouter } from "next/navigation";

export default function ReservationListPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("registration"); // "registration" or "imminent"

  // Mock reservation data
  const reservations = [
    {
      id: 1,
      place: "내공",
      placeName: "김예약",
      phone: "전화",
      date: "2025.09.11 (목) 17:00 ~ 19:00",
      status: "샘플",
      registeredAt: "2025.9.11 (목) 오후 4:22"
    }
  ];

  const getFilteredReservations = () => {
    // For now, return all reservations regardless of tab
    // In a real app, you would filter based on activeTab
    return reservations;
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => router.back()}
              className="mr-4 p-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              예약 리스트
            </h1>
          </div>
          
          {/* Calendar Icon */}
          <button className="p-2 text-blue-500">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveTab("registration")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "registration"
                ? "bg-blue-100 text-blue-600 border-2 border-blue-300"
                : "bg-gray-100 text-gray-600 border-2 border-transparent"
            }`}
          >
            등록순
          </button>
          <button
            onClick={() => setActiveTab("imminent")}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              activeTab === "imminent"
                ? "bg-blue-100 text-blue-600 border-2 border-blue-300"
                : "bg-gray-100 text-gray-600 border-2 border-transparent"
            }`}
          >
            이용 임박순
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === "registration" && getFilteredReservations().length > 0 ? (
            // Reservation Items
            getFilteredReservations().map((reservation) => (
              <div key={reservation.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start space-x-4">
                  {/* Place Icon */}
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {reservation.place}
                  </div>
                  
                  {/* Reservation Details */}
                  <div className="flex-1">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {reservation.date}
                    </div>
                    <div className="text-gray-600 mb-2">
                      [{reservation.status}] {reservation.placeName} {reservation.phone}
                    </div>
                    <div className="text-sm text-gray-500">
                      등록일시 {reservation.registeredAt}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : activeTab === "imminent" ? (
            // Empty state for imminent tab
            <div className="text-center py-16">
              <p className="text-gray-500">
                이용 예정인 예약이 없습니다.
              </p>
            </div>
          ) : (
            // Empty state for registration tab when no data
            <div className="text-center py-16">
              <p className="text-gray-500">
                등록된 예약이 없습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}