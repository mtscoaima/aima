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
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleBackClick = () => {
    router.back();
  };

  const handleAmountChange = () => {
    router.push(`/reservations/detail/price?reservationId=${reservation?.id}`);
  };

  const handleSaveAmount = async () => {
    if (!reservation || !newAmount) return;

    try {
      const token = await getAccessToken();
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseInt(newAmount)
        }),
      });

      if (response.ok) {
        setReservation({ ...reservation, amount: parseInt(newAmount) });
        setShowAmountModal(false);
        alert('결제 금액이 변경되었습니다.');
      } else {
        alert('결제 금액 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error updating amount:', error);
      alert('결제 금액 변경에 실패했습니다.');
    }
  };

  const handleCreatePaymentLink = () => {
    setShowLinkModal(true);
  };

  const handleCopyLink = () => {
    const link = `https://payment.example.com/pay/${reservation?.id}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('결제 링크가 복사되었습니다.');
    });
  };

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
        router.push('/reservations/list');
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
              예약 상세
            </h1>
          </div>
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
              <button className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors">
                메시지 보내기
              </button>
              <button className="px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                보낸 메시지
              </button>
              <button className="px-4 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                발송 예정
              </button>
            </div>
          </div>

          {/* 금액 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">금액</h2>
            
            <button 
              onClick={handleAmountChange}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg font-semibold text-gray-900">{(reservation.amount || 0).toLocaleString()} 원</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <div className="mt-2">
              <span className="text-sm text-gray-600">[샘플] 공간 대여료</span>
            </div>

            {/* 결제 관련 버튼들 */}
            <div className="space-y-3 mt-6">
              <button 
                onClick={handleCreatePaymentLink}
                className="w-full flex items-center justify-center px-4 py-3 bg-white border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                결제 링크 만들기
              </button>
              
              <button 
                onClick={handleAmountChange}
                className="w-full flex items-center justify-center px-4 py-3 bg-white border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                금액 입력하기
              </button>
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
            
            <button className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              다른 공간으로 예약 복사하기
            </button>
          </div>
        </div>

        {/* 금액 변경 모달 */}
        {showAmountModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">금액 변경</h3>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="금액을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAmountModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveAmount}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 결제 링크 생성 모달 */}
        {showLinkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center mb-6">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">결제 링크 생성 완료</h3>
                <p className="text-gray-600 text-sm">
                  고객에게 아래 링크를 전송하여 온라인으로 결제를 받을 수 있습니다.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">결제 정보</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-900 font-medium">{reservation.space_name}</p>
                    <p className="text-sm text-gray-600">{reservation.customer_name}</p>
                    <p className="text-sm text-gray-600">{(reservation.total_amount || reservation.amount || 0).toLocaleString()}원</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">결제 링크</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={`https://payment.example.com/pay/${reservation.id}`}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      복사
                    </button>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-start">
                    <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-blue-700">
                      결제 링크는 생성일로부터 30일간 유효합니다. 고객이 결제 완료 시 자동으로 예약 상태가 업데이트됩니다.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    handleCopyLink();
                    setShowLinkModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  링크 복사 후 닫기
                </button>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </RoleGuard>
  );
}