"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";
import { useRouter } from "next/navigation";

interface Space {
  id: number;
  name: string;
  icon_text: string;
  icon_color: string;
}

interface Reservation {
  id: number;
  user_id: number;
  space_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  start_datetime: string;
  end_datetime: string;
  guest_count: number;
  total_amount: number;
  deposit_amount: number;
  special_requirements?: string;
  booking_type: string;
  status: string;
  payment_status: string;
  booking_channel: string;
  created_at: string;
  updated_at: string;
  spaces?: Space;
}

export default function ReservationListPage() {
  const { getAccessToken } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("registration");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 예약 목록 가져오기
  const fetchReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAccessToken();
      if (!token) {
        setError('인증이 필요합니다.');
        return;
      }

      const response = await fetch('/api/reservations/bookings', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('예약 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (err) {
      console.error('Error fetching reservations:', err);
      setError(err instanceof Error ? err.message : '예약 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    return {
      date: `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')} (${dayOfWeek})`,
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    };
  };

  // 예약 상태별 필터링 및 정렬
  const getFilteredReservations = () => {
    const now = new Date();
    
    if (activeTab === 'imminent') {
      // 이용 임박순: 오늘 이후 예약만 표시하고 시작 시간이 가까운 순으로 정렬
      return reservations
        .filter(reservation => {
          const startDate = new Date(reservation.start_datetime);
          return startDate >= now && reservation.status === 'confirmed';
        })
        .sort((a, b) => {
          // 시작 시간이 가까운 순으로 정렬 (오름차순)
          return new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime();
        });
    } else {
      // 등록순: 모든 예약을 등록일 기준으로 오래된 순부터 정렬
      return reservations
        .slice() // 원본 배열 복사
        .sort((a, b) => {
          // 등록일(created_at) 기준으로 오래된 순 정렬 (오름차순)
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
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

        {/* Tab Navigation with Calendar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
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
          
          {/* Calendar Icon */}
          <button 
            onClick={() => router.push('/reservations/calendar')}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="캘린더 보기"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">예약 목록을 불러오는 중...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Reservation Items */}
          {!loading && !error && (
            <>
              {getFilteredReservations().length > 0 ? (
                getFilteredReservations().map((reservation) => {
                  const startDate = formatDate(reservation.start_datetime);
                  const endDate = formatDate(reservation.end_datetime);
                  const createdDate = formatDate(reservation.created_at);
                  
                  return (
                    <div 
                      key={reservation.id} 
                      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => router.push(`/reservations/detail?id=${reservation.id}`)}
                    >
                      <div className="flex items-start space-x-4">
                        {/* Place Icon */}
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
                          style={{ backgroundColor: reservation.spaces?.icon_color || '#8BC34A' }}
                        >
                          {reservation.spaces?.icon_text || reservation.spaces?.name?.substring(0, 2) || '공간'}
                        </div>
                        
                        {/* Reservation Details */}
                        <div className="flex-1">
                          <div className="text-lg font-semibold text-gray-900 mb-1">
                            {startDate.date} {startDate.time} ~ {endDate.time}
                          </div>
                          <div className="text-gray-600 mb-2">
                            [{reservation.status === 'confirmed' ? '확정' : reservation.status === 'completed' ? '완료' : reservation.status === 'cancelled' ? '취소' : '대기'}] {reservation.customer_name} {reservation.customer_phone}
                          </div>
                          <div className="text-sm text-gray-500 mb-2">
                            {reservation.spaces?.name} · {reservation.guest_count}명
                            {reservation.total_amount > 0 && ` · ${reservation.total_amount.toLocaleString()}원`}
                          </div>
                          <div className="text-sm text-gray-500">
                            등록일시 {createdDate.date} {createdDate.time}
                          </div>
                          {reservation.special_requirements && (
                            <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                              메모: {reservation.special_requirements}
                            </div>
                          )}
                        </div>
                        
                        {/* Status Badge */}
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reservation.status === 'confirmed' ? '확정' : 
                           reservation.status === 'completed' ? '완료' : 
                           reservation.status === 'cancelled' ? '취소' : '대기'}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Empty state
                <div className="text-center py-16">
                  <div className="text-gray-400 mb-4">
                    <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1M8 7v13a2 2 0 002 2h4a2 2 0 002-2V7M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h1m10-6V7a2 2 0 00-2-2H9a2 2 0 00-2 2v6" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {activeTab === 'imminent' ? '이용 예정인 예약이 없습니다' : '등록된 예약이 없습니다'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {activeTab === 'imminent' ? '7일 이내 예약이 없습니다.' : '첫 번째 예약을 추가해보세요!'}
                  </p>
                  {activeTab === 'registration' && (
                    <button
                      onClick={() => router.push('/reservations/create')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      예약 추가하기
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}