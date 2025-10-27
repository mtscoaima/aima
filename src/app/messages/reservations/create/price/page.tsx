"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";

export default function PriceInputPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // URL에서 기존 금액 정보 가져오기
  const existingAmount = searchParams.get('amount') || '';
  
  const [amount, setAmount] = useState(existingAmount);
  const [notes, setNotes] = useState("");

  // 페이지 로드 시 기존 금액 정보 불러오기
  useEffect(() => {
    const savedPriceData = sessionStorage.getItem('reservationPrice');
    if (savedPriceData) {
      try {
        const parsed = JSON.parse(savedPriceData);
        setAmount(parsed.amount || '');
        setNotes(parsed.notes || '');
      } catch (error) {
        console.error('Error parsing saved price data:', error);
      }
    }
  }, []);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 허용
    setAmount(value);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleComplete = () => {
    // 금액 정보를 sessionStorage에 저장
    const priceData = {
      amount: amount,
      notes: notes,
      timestamp: Date.now()
    };
    
    sessionStorage.setItem('reservationPrice', JSON.stringify(priceData));
    
    // 예약 생성 페이지로 돌아가기
    router.push('/messages/reservations/create');
  };

  const formatAmount = (value: string) => {
    if (!value) return '';
    return parseInt(value).toLocaleString();
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              금액 입력
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleComplete}
              disabled={!amount.trim()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                amount.trim()
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              완료
            </button>
            <span className="text-gray-500">완료</span>
          </div>
        </div>

        <div className="space-y-8">
          {/* 금액 입력 */}
          <div>
            <label className="block text-gray-900 font-medium mb-3">
              금액 <span className="text-red-500">*</span>
            </label>
            
            <div className="relative">
              <input
                type="text"
                value={formatAmount(amount)}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full p-4 pr-12 text-right text-2xl font-semibold border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <span className="text-gray-500 text-lg font-medium">원</span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-3">
              한불로 설력하면 마이너스로 입력되며 정산 및 통계에서 해당 금액만큼 차감됩니다. 부분 환불, 수실 등에 활용하세요.
            </p>
          </div>

          {/* 내용 입력 */}
          <div>
            <label className="block text-gray-900 font-medium mb-3">
              내용 입력
            </label>
            
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="내용을 입력해 주세요.(최대 20자)"
              maxLength={20}
              rows={3}
              className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <p className="text-sm text-gray-500 mt-2">
              호스트님에게만 표시됩니다. 고객에게 표시되지 않습니다.
            </p>
          </div>
        </div>

        {/* 완료 버튼 (하단) */}
        <div className="mt-12">
          <button
            onClick={handleComplete}
            disabled={!amount.trim()}
            className={`w-full py-4 px-4 rounded-lg font-medium transition-colors text-lg ${
              amount.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            완료
          </button>
        </div>
      </div>
    </RoleGuard>
  );
}