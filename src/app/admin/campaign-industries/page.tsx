"use client";

import React, { useState, useEffect } from "react";
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

export default function CampaignIndustriesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [industries, setIndustries] = useState<CampaignIndustry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingIndustry, setEditingIndustry] = useState<CampaignIndustry | null>(null);
  const [formData, setFormData] = useState({ order_number: 0, name: "", is_active: true });

  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.push("/");
    } else if (user) {
      fetchIndustries();
    }
  }, [user, router]);

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

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">캠페인 업종 관리</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          업종 추가
        </button>
      </div>

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

      {/* 편집 모달 */}
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
    </div>
  );
}
