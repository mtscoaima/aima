"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface CampaignIndustry {
  id: number;
  order_number: number;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomIndustry {
  name: string;
  count: number;
  lastUsed: string;
}

export default function CampaignIndustriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'official' | 'custom'>('official');

  // Official industries state
  const [industries, setIndustries] = useState<CampaignIndustry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<CampaignIndustry | null>(null);
  const [formData, setFormData] = useState({ order_number: 0, name: "", is_active: true });

  // Custom industries state
  const [customIndustries, setCustomIndustries] = useState<CustomIndustry[]>([]);
  const [isCustomLoading, setIsCustomLoading] = useState(false);

  // 다중 선택 및 승격 관련 state
  const [selectedCustomNames, setSelectedCustomNames] = useState<string[]>([]);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [promotingCustomNames, setPromotingCustomNames] = useState<string[]>([]);
  const [newIndustryName, setNewIndustryName] = useState<string>("");
  const [promoteFormData, setPromoteFormData] = useState({ orderNumber: 1, isActive: true });

  // 검색 및 정렬 state
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  const [sortBy, setSortBy] = useState<'name' | 'count' | 'lastUsed'>('count');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/");
    } else if (user) {
      fetchIndustries();
    }
  }, [user, router]);

  useEffect(() => {
    if (activeTab === 'custom') {
      fetchCustomIndustries();
    }
  }, [activeTab, sortBy, sortOrder]);

  const fetchIndustries = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/admin/campaign-industries", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setIndustries(result.industries || []);
      }
    } catch (error) {
      console.error("업종 목록 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCustomIndustries = async () => {
    try {
      setIsCustomLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/admin/custom-industries?sortBy=${sortBy}&sortOrder=${sortOrder}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setCustomIndustries(result.customIndustries || []);
      }
    } catch (error) {
      console.error("커스텀 업종 목록 조회 실패:", error);
    } finally {
      setIsCustomLoading(false);
    }
  };

  // 검색 필터링
  const filteredCustomIndustries = useMemo(() => {
    if (!searchKeyword.trim()) {
      return customIndustries;
    }

    return customIndustries.filter(industry =>
      industry.name.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }, [customIndustries, searchKeyword]);

  const handleCreate = () => {
    const nextOrderNumber = industries.length > 0
      ? Math.max(...industries.map(i => i.order_number)) + 1
      : 1;
    setFormData({ order_number: nextOrderNumber, name: "", is_active: true });
    setEditingIndustry(null);
    setIsEditModalOpen(true);
  };

  const handleEdit = (industry: CampaignIndustry) => {
    setFormData({
      order_number: industry.order_number,
      name: industry.name,
      is_active: industry.is_active,
    });
    setEditingIndustry(industry);
    setIsEditModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const url = editingIndustry
        ? `/api/admin/campaign-industries/${editingIndustry.id}`
        : "/api/admin/campaign-industries";
      const method = editingIndustry ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(editingIndustry ? "업종이 수정되었습니다." : "업종이 추가되었습니다.");
        setIsEditModalOpen(false);
        fetchIndustries();
      } else {
        const error = await response.json();
        alert(error.error || "저장에 실패했습니다.");
      }
    } catch (error) {
      console.error("업종 저장 실패:", error);
      alert("저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/admin/campaign-industries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert("업종이 삭제되었습니다.");
        fetchIndustries();
      } else {
        const error = await response.json();
        alert(error.error || "삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("업종 삭제 실패:", error);
      alert("삭제에 실패했습니다.");
    }
  };

  // 일괄 승격
  const handleBulkPromoteClick = () => {
    if (selectedCustomNames.length === 0) {
      alert("승격할 업종을 선택해주세요.");
      return;
    }

    const nextOrderNumber = industries.length > 0
      ? Math.max(...industries.map(i => i.order_number)) + 1
      : 1;

    setPromotingCustomNames(selectedCustomNames);
    setNewIndustryName(""); // 사용자가 직접 입력
    setPromoteFormData({ orderNumber: nextOrderNumber, isActive: true });
    setIsPromoteModalOpen(true);
  };

  // 단독 승격
  const handleSinglePromoteClick = (customName: string) => {
    const nextOrderNumber = industries.length > 0
      ? Math.max(...industries.map(i => i.order_number)) + 1
      : 1;

    setPromotingCustomNames([customName]);
    setNewIndustryName(customName); // 기본값으로 설정
    setPromoteFormData({ orderNumber: nextOrderNumber, isActive: true });
    setIsPromoteModalOpen(true);
  };

  // 승격 실행
  const handlePromoteSubmit = async () => {
    if (promotingCustomNames.length === 0 || !newIndustryName.trim()) {
      alert("업종명을 입력해주세요.");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/admin/custom-industries", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customNames: promotingCustomNames,
          newIndustryName: newIndustryName.trim(),
          orderNumber: promoteFormData.orderNumber,
          isActive: promoteFormData.isActive,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `${promotingCustomNames.length}개의 커스텀 업종이 "${newIndustryName}"으로 승격되었습니다.\n` +
          `업데이트된 캠페인 수: ${result.updatedCampaigns}`
        );

        setIsPromoteModalOpen(false);
        setPromotingCustomNames([]);
        setSelectedCustomNames([]);
        setNewIndustryName("");

        fetchIndustries();
        fetchCustomIndustries();
      } else {
        const error = await response.json();
        alert(error.error || "승격에 실패했습니다.");
      }
    } catch (error) {
      console.error("커스텀 업종 승격 실패:", error);
      alert("승격에 실패했습니다.");
    }
  };

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomNames(filteredCustomIndustries.map(i => i.name));
    } else {
      setSelectedCustomNames([]);
    }
  };

  // 개별 선택/해제
  const handleSelectOne = (name: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomNames([...selectedCustomNames, name]);
    } else {
      setSelectedCustomNames(selectedCustomNames.filter(n => n !== name));
    }
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">캠페인 업종 관리</h1>
        {activeTab === 'official' && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            업종 추가
          </button>
        )}
        {activeTab === 'custom' && (
          <button
            onClick={fetchCustomIndustries}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            새로고침
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('official')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'official'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            정식 업종 관리
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'custom'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            커스텀 업종 현황
          </button>
        </nav>
      </div>

      {/* Official Industries Tab */}
      {activeTab === 'official' && (
        <>
          {isLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">순서</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업종명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">활성 상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {industries.map((industry) => (
                    <tr key={industry.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {industry.order_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {industry.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            industry.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {industry.is_active ? "활성" : "비활성"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(industry)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(industry.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Custom Industries Tab */}
      {activeTab === 'custom' && (
        <>
          {/* 상단 컨트롤 영역 */}
          <div className="mb-4 space-y-3">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              {/* 검색 */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="업종명 검색..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword("")}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    초기화
                  </button>
                )}
              </div>

              {/* 정렬 */}
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">정렬:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">업종명</option>
                  <option value="count">사용 횟수</option>
                  <option value="lastUsed">최근 사용일</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                  title={sortOrder === 'asc' ? '오름차순' : '내림차순'}
                >
                  {sortOrder === 'asc' ? '↑ 오름차순' : '↓ 내림차순'}
                </button>
              </div>
            </div>

            {/* 일괄 승격 버튼 */}
            <div className="flex justify-end">
              <button
                onClick={handleBulkPromoteClick}
                disabled={selectedCustomNames.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                선택한 업종 승격 ({selectedCustomNames.length}개)
              </button>
            </div>
          </div>

          {/* 테이블 */}
          {isCustomLoading ? (
            <div className="text-center py-8">로딩 중...</div>
          ) : filteredCustomIndustries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchKeyword ? `"${searchKeyword}"에 대한 검색 결과가 없습니다.` : '커스텀 업종 데이터가 없습니다.'}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          filteredCustomIndustries.length > 0 &&
                          filteredCustomIndustries.every(i => selectedCustomNames.includes(i.name))
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      업종명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      사용 횟수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      최근 사용일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomIndustries.map((customIndustry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomNames.includes(customIndustry.name)}
                          onChange={(e) => handleSelectOne(customIndustry.name, e.target.checked)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customIndustry.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customIndustry.count}회
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(customIndustry.lastUsed).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleSinglePromoteClick(customIndustry.name)}
                          className="text-green-600 hover:text-green-800"
                        >
                          단독 승격
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Edit/Create Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingIndustry ? "업종 수정" : "업종 추가"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  순서 번호
                </label>
                <input
                  type="number"
                  value={formData.order_number}
                  onChange={(e) =>
                    setFormData({ ...formData, order_number: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업종명
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  활성 상태
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Promote Modal */}
      {isPromoteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">커스텀 업종 승격</h2>

            {/* 선택된 커스텀 업종 목록 */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                선택된 커스텀 업종 ({promotingCustomNames.length}개):
              </p>
              <ul className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
                {promotingCustomNames.map((name, idx) => (
                  <li key={idx} className="text-sm text-gray-700 py-1">
                    • {name}
                  </li>
                ))}
              </ul>
            </div>

            {/* 정식 업종명 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                정식 업종명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newIndustryName}
                onChange={(e) => setNewIndustryName(e.target.value)}
                placeholder="예: 여행"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                선택한 모든 커스텀 업종이 이 이름으로 통합됩니다.
              </p>
            </div>

            {/* 순서 번호 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                순서 번호
              </label>
              <input
                type="number"
                value={promoteFormData.orderNumber}
                onChange={(e) =>
                  setPromoteFormData({ ...promoteFormData, orderNumber: parseInt(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            {/* 활성 상태 */}
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="promote_is_active"
                checked={promoteFormData.isActive}
                onChange={(e) =>
                  setPromoteFormData({ ...promoteFormData, isActive: e.target.checked })
                }
                className="mr-2"
              />
              <label htmlFor="promote_is_active" className="text-sm text-gray-700">
                활성 상태
              </label>
            </div>

            {/* 버튼 */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsPromoteModalOpen(false);
                  setPromotingCustomNames([]);
                  setNewIndustryName("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handlePromoteSubmit}
                disabled={!newIndustryName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                승격
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
