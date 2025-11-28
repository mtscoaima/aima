"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import NaverAccountRegisterModal from "./NaverAccountRegisterModal";

interface NaverAccount {
  id: number;
  partner_key: string;
  talk_name: string | null;
  created_at: string;
}

const NaverTalkIdTab = () => {
  const [accounts, setAccounts] = useState<NaverAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 계정 목록 조회
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/naver/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAccounts(result.data || []);
      }
    } catch (error) {
      console.error("계정 목록 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSuccess = () => {
    fetchAccounts();
  };

  return (
    <div className="flex-1">
      {/* 액션 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            네이버톡톡 계정 등록
          </button>
          <button
            onClick={() => window.open("https://partner.talk.naver.com", "_blank")}
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            네이버 톡톡 파트너센터 ↗
          </button>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center gap-4">
          <select className="border border-gray-300 rounded px-3 py-1 text-sm">
            <option>20</option>
          </select>
          <span className="text-sm text-gray-600">1 / 1</span>
          <div className="flex gap-1">
            <button className="p-1 border border-gray-300 rounded hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 border border-gray-300 rounded hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 톡톡 아이디 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 p-4 text-sm font-medium text-gray-700">
            <div>톡 이름</div>
            <div>파트너키</div>
            <div>연동일</div>
            <div>상태</div>
          </div>
        </div>

        {/* 테이블 내용 */}
        {isLoading ? (
          <div className="p-16 text-center">
            <p className="text-gray-500 text-lg">로딩 중...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-500 text-lg">등록된 계정이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              &quot;네이버톡톡 계정 등록&quot; 버튼을 클릭하여 시작하세요.
            </p>
          </div>
        ) : (
          accounts.map((account) => (
            <div
              key={account.id}
              className="grid grid-cols-4 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50"
            >
              <div className="text-sm">
                {account.talk_name || <span className="text-gray-400">이름 없음</span>}
              </div>
              <div className="text-sm font-mono text-gray-600">
                {account.partner_key}
              </div>
              <div className="text-sm text-gray-600">
                {new Date(account.created_at).toLocaleDateString("ko-KR")}
              </div>
              <div>
                <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                  활성
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 계정 등록 모달 */}
      <NaverAccountRegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default NaverTalkIdTab;