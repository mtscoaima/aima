"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface ApprovalRequestCompleteProps {
  onGoBack?: () => void;
  onConfirm?: () => void;
}

const ApprovalRequestComplete: React.FC<ApprovalRequestCompleteProps> = ({
  onGoBack,
  onConfirm,
}) => {
  const router = useRouter();

  const handleGoBack = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      // 기본적으로 이전 페이지로 돌아가기
      router.back();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      // 기본적으로 캠페인 관리 탭으로 이동
      router.push("/target-marketing?tab=campaign-management");
    }
  };

  return (
    <div className="flex items-center justify-center p-5 my-auto">
      <div className="py-[60px] px-10 text-center max-w-[480px] w-full max-[600px]:py-10 max-[600px]:px-6">
        {/* 성공 아이콘 */}
        <div className="mb-8">
          <div className="text-[80px] mb-4 animate-[bounce_2s_infinite]">
            👏
          </div>
        </div>

        {/* 메시지 */}
        <div className="mb-12">
          <h1 className="text-2xl font-bold text-[#333] m-0 leading-[1.4] max-[600px]:text-xl">
            승인 요청이 완료되었습니다
          </h1>
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-4 justify-center flex-wrap max-[600px]:flex-col max-[600px]:items-center">
          <button
            className="flex items-center gap-2 py-[14px] px-6 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 border border-[#dee2e6] min-w-[140px] justify-center bg-[#f8f9fa] text-[#6c757d] hover:bg-[#e9ecef] hover:text-[#5a6268] hover:-translate-y-0.5 max-[600px]:w-full max-[600px]:max-w-[280px]"
            onClick={handleGoBack}
          >
            <span className="text-lg font-bold mr-1">&lt;</span>
            이전으로 가기
          </button>
          <button
            className="flex items-center gap-2 py-[14px] px-6 rounded-lg text-base font-semibold cursor-pointer transition-all duration-200 border-none min-w-[140px] justify-center bg-[#007bff] text-white hover:bg-[#0056b3] hover:-translate-y-0.5 max-[600px]:w-full max-[600px]:max-w-[280px]"
            onClick={handleConfirm}
          >
            확인
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
};

export default ApprovalRequestComplete;
