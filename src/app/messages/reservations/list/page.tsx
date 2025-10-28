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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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
    let filtered = reservations;

    // 검색 필터
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.customer_name?.toLowerCase().includes(query) ||
          r.customer_phone?.toLowerCase().includes(query) ||
          r.spaces?.name?.toLowerCase().includes(query) ||
          r.customer_email?.toLowerCase().includes(query)
      );
    }

    if (activeTab === 'imminent') {
      // 이용 임박순: 오늘 이후 예약만 표시하고 시작 시간이 가까운 순으로 정렬
      return filtered
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
      return filtered
        .slice() // 원본 배열 복사
        .sort((a, b) => {
          // 등록일(created_at) 기준으로 오래된 순 정렬 (오름차순)
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    }
  };

  // 페이지네이션 적용
  const getPaginatedReservations = () => {
    const filtered = getFilteredReservations();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  // 전체 페이지 수 계산
  const getTotalPages = () => {
    const filtered = getFilteredReservations();
    return Math.ceil(filtered.length / itemsPerPage);
  };

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900">
            예약 리스트
          </h1>
        </div>

        {/* Tab Navigation with Calendar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setActiveTab("registration");
                setCurrentPage(1);
              }}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                activeTab === "registration"
                  ? "bg-blue-100 text-blue-600 border-2 border-blue-300"
                  : "bg-gray-100 text-gray-600 border-2 border-transparent"
              }`}
            >
              등록순
            </button>
            <button
              onClick={() => {
                setActiveTab("imminent");
                setCurrentPage(1);
              }}
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
            onClick={() => router.push('/messages/reservations/calendar')}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="캘린더 보기"
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="고객명, 전화번호, 공간명으로 검색 가능합니다."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
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
                <>
                {getPaginatedReservations().map((reservation) => {
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
                })}

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-between border-t pt-6">
                  <div className="text-sm text-gray-600">
                    전체 {getFilteredReservations().length}건 중 {((currentPage - 1) * itemsPerPage) + 1}-
                    {Math.min(currentPage * itemsPerPage, getFilteredReservations().length)}건
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      이전
                    </button>
                    <span className="text-sm text-gray-600 px-4">
                      {currentPage} / {getTotalPages()}
                    </span>
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(getTotalPages(), prev + 1))}
                      disabled={currentPage === getTotalPages()}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      다음
                    </button>
                  </div>
                </div>
                </>
              ) : (
                // Empty state
                <div className="text-center py-16">
                  {activeTab === 'registration' && !searchQuery && (
                    <button
                      onClick={() => router.push('/messages/reservations/create')}
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