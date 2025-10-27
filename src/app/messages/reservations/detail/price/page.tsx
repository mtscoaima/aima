"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

interface Reservation {
  id: number;
  space_name: string;
  customer_name: string;
  total_amount?: number;
  amount?: number;
}

export default function ReservationPriceEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken } = useAuth();
  
  const reservationId = searchParams.get('reservationId');
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 예약 정보 가져오기
  useEffect(() => {
    const fetchReservation = async () => {
      if (!reservationId) {
        router.back();
        return;
      }

      try {
        const token = await getAccessToken();
        if (!token) return;

        const response = await fetch(`/api/reservations/${reservationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setReservation(data.reservation);
          setAmount((data.reservation.total_amount || data.reservation.amount || 0).toString());
        }
      } catch (error) {
        console.error('Error fetching reservation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId, getAccessToken, router]);

  const handleBackClick = () => {
    router.back();
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 허용
    setAmount(value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const formatAmount = (value: string) => {
    if (!value) return '';
    return parseInt(value).toLocaleString();
  };

  const handleComplete = async () => {
    if (!reservation || !amount) {
      alert('금액을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          total_amount: parseInt(amount),
          special_requirements: notes || undefined
        }),
      });

      if (response.ok) {
        alert('금액이 변경되었습니다.');
        router.back();
      } else {
        alert('금액 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating amount:', error);
      alert('금액 변경에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["USER"]}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">예약 정보를 불러오는 중...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (!reservation) {
    return (
      <RoleGuard allowedRoles={["USER"]}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">예약을 찾을 수 없습니다.</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={handleBackClick}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              금액 변경
            </h1>
          </div>
        </div>

        <div className="space-y-8">
          {/* 예약 정보 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-sm font-medium text-gray-700 mb-2">예약 정보</h2>
            <p className="text-lg font-semibold text-gray-900">{reservation.space_name}</p>
            <p className="text-gray-600">{reservation.customer_name}</p>
          </div>

          {/* 금액 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              금액 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-lg"
              />
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">원</span>
            </div>
            {amount && (
              <p className="mt-2 text-sm text-gray-600">
                {formatAmount(amount)}원
              </p>
            )}
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모 (선택사항)
            </label>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="금액 변경 관련 메모를 입력하세요"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 완료 버튼 */}
          <div className="pt-4">
            <button
              onClick={handleComplete}
              disabled={!amount || saving}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? '저장 중...' : '완료'}
            </button>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}