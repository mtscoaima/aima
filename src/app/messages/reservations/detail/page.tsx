"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

interface Reservation {
  id: number;
  space_id: number;
  space_name: string;
  space_icon_text: string;
  space_icon_color: string;
  customer_name: string;
  customer_phone: string;
  start_datetime: string;
  end_datetime: string;
  guest_count: number;
  total_amount?: number;
  amount?: number;
  payment_status: string;
  booking_channel: string;
  special_requirements?: string;
  memo?: string;
  created_at: string;
}

export default function ReservationDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken } = useAuth();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [spaces, setSpaces] = useState<Array<{ id: number; name: string; icon_text: string; icon_color: string }>>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [copying, setCopying] = useState(false);

  const reservationId = searchParams.get('id');

  useEffect(() => {
    const fetchReservation = async () => {
      if (!reservationId) {
        setError("예약 ID가 필요합니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getAccessToken();
        if (!token) {
          setError("인증이 필요합니다.");
          return;
        }

        const response = await fetch(`/api/reservations/${reservationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('예약 정보를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setReservation(data.reservation);
      } catch (err) {
        console.error('Error fetching reservation:', err);
        setError(err instanceof Error ? err.message : '예약 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchReservation();
  }, [reservationId, getAccessToken]);

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reservation) return;

    try {
      setDeleting(true);
      const token = await getAccessToken();
      if (!token) {
        alert('인증이 필요합니다.');
        return;
      }

      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('예약이 삭제되었습니다.');
        router.push('/messages/reservations/list');
      } else {
        const errorData = await response.json();
        alert(errorData.error || '예약 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('예약 삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  // 공간 목록 가져오기
  const fetchSpaces = async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch('/api/reservations/spaces', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSpaces(data.spaces || []);
      }
    } catch (error) {
      console.error('Error fetching spaces:', error);
    }
  };

  // 복사 모달 열기
  const handleCopyClick = () => {
    fetchSpaces();
    setShowCopyModal(true);
  };

  // 예약 복사 실행
  const handleCopyReservation = async () => {
    if (!reservation || !selectedSpaceId) {
      alert('공간을 선택해주세요.');
      return;
    }

    try {
      setCopying(true);
      const token = await getAccessToken();
      if (!token) {
        alert('인증이 필요합니다.');
        return;
      }

      const copyData = {
        space_id: selectedSpaceId,
        customer_name: reservation.customer_name,
        customer_phone: reservation.customer_phone,
        start_datetime: reservation.start_datetime,
        end_datetime: reservation.end_datetime,
        guest_count: reservation.guest_count,
        booking_channel: reservation.booking_channel,
        special_requirements: reservation.special_requirements
      };

      const response = await fetch('/api/reservations/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(copyData),
      });

      if (response.ok) {
        const data = await response.json();
        alert('예약이 복사되었습니다.');
        setShowCopyModal(false);
        router.push(`/reservations/detail?id=${data.reservation.id}`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || '예약 복사에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error copying reservation:', error);
      alert('예약 복사에 실패했습니다.');
    } finally {
      setCopying(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = days[date.getDay()];
    
    return `2025.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')} (${dayOfWeek})`;
  };

  const formatTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
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

  if (error || !reservation) {
    return (
      <RoleGuard allowedRoles={["USER"]}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || '예약을 찾을 수 없습니다.'}</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">
            예약 상세
          </h1>
        </div>

        <div className="space-y-8">
          {/* 예약 내용 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">예약 내용</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">공간명</span>
                <div className="flex items-center">
                  <div 
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-semibold mr-2"
                    style={{ backgroundColor: reservation.space_icon_color }}
                  >
                    {reservation.space_icon_text}
                  </div>
                  <span className="text-gray-900 font-medium">{reservation.space_name}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">예약 시간</span>
                <span className="text-gray-900">{formatDate(reservation.start_datetime)} {formatTime(reservation.start_datetime)} ~ {formatTime(reservation.end_datetime)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">예약 채널</span>
                <span className="text-blue-600 font-medium">
                  {reservation.booking_channel === 'manual' ? '직접입력' :
                   reservation.booking_channel === 'phone' ? '전화' :
                   reservation.booking_channel === 'online' ? '온라인' :
                   reservation.booking_channel || '전화'}
                </span>
              </div>
            </div>
          </div>

          {/* 고객 정보 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">고객 정보</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">이름</span>
                <span className="text-gray-900">{reservation.customer_name}</span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">인원수</span>
                <span className="text-gray-900">{reservation.guest_count} 명</span>
              </div>
              
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">휴대폰 번호</span>
                <span className="text-gray-900">{reservation.customer_phone || '-'}</span>
              </div>
            </div>

            {/* 메시지 버튼들 */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => router.push(`/reservations/message/send?reservationId=${reservation.id}`)}
                className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                메시지 보내기
              </button>
              <button
                onClick={() => router.push('/messages/reservations/message/list')}
                className="px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                보낸 메시지
              </button>
              <button
                onClick={() => router.push('/messages/reservations/message/list/reserved')}
                className="px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                발송 예정
              </button>
            </div>
          </div>

          {/* 금액 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">금액</h2>

            <div className="bg-gray-50 p-4 rounded-lg">
              <span className="text-lg font-semibold text-gray-900">{(reservation.amount || 0).toLocaleString()} 원</span>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">메모</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">※ 이 예약은 샘플 예약입니다</p>
              <p className="text-sm text-gray-600 mt-2">
                Tip) 하단의 수정하기를 누르고 휴대폰 번호에 &apos;호스트님의 전화번호&apos;를 입력한 후 메시지 보내기를 테스트해보세요. 샘플 템플릿을 선택해서 보내고 직접 받아보세요 :)
              </p>
            </div>
          </div>

          {/* 하단 버튼들 */}
          <div className="space-y-3 pt-4">
            <div className="flex gap-3">
              <button 
                onClick={handleDeleteClick}
                className="flex-1 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                삭제하기
              </button>
              <button 
                onClick={() => router.push(`/reservations/edit?id=${reservation?.id}`)}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                수정하기
              </button>
            </div>
            
            <button onClick={handleCopyClick} className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              다른 공간으로 예약 복사하기
            </button>
          </div>
        </div>

        {/* 삭제 확인 모달 */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">예약 삭제</h3>
                <p className="text-gray-600 mb-6">
                  정말로 이 예약을 삭제하시겠습니까?<br/>
                  삭제된 예약은 복구할 수 없습니다.
                </p>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-6 text-left">
                  <p className="text-sm text-gray-900 font-medium">{reservation?.space_name}</p>
                  <p className="text-sm text-gray-600">{reservation?.customer_name}</p>
                  <p className="text-sm text-gray-600">
                    {reservation && formatDate(reservation.start_datetime)} {reservation && formatTime(reservation.start_datetime)} ~ {reservation && formatTime(reservation.end_datetime)}
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? '삭제 중...' : '삭제하기'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 예약 복사 모달 */}
        {showCopyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">다른 공간으로 예약 복사</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">복사할 공간 선택</label>
                <select
                  value={selectedSpaceId || ''}
                  onChange={(e) => setSelectedSpaceId(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">공간을 선택하세요</option>
                  {spaces.filter(space => space.id !== reservation?.space_id).map(space => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCopyModal(false);
                    setSelectedSpaceId(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={copying}
                >
                  취소
                </button>
                <button
                  onClick={handleCopyReservation}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={copying}
                >
                  {copying ? '복사 중...' : '복사하기'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
