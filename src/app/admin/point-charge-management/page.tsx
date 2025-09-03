"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { tokenManager } from "@/lib/api";

// 사용자 데이터 타입 정의
interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  userType: "개인" | "기업";
  company?: string;
  status: "정상" | "정지" | "자진탈퇴" | "관리자탈퇴" | "대기" | "거부";
  role: "USER" | "SALESPERSON" | "ADMIN";
  joinDate: string;
  pointBalance: number;
  totalPointCharged: number;
  totalPointUsed: number;
  lastPointActivity: string;
}

// 포인트 충전 모달 데이터 타입
interface PointChargeData {
  amount: number;
  description: string;
  reason: string;
}

// 일괄 충전 오류 타입 정의
interface BulkChargeError {
  userId: string;
  username: string;
  name: string;
  error: string;
}

export default function PointChargeManagementPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0
  });
  
  // 검색 및 필터링
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // 모달 상태
  const [showPointChargeModal, setShowPointChargeModal] = useState(false);
  const [showBulkChargeModal, setShowBulkChargeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pointChargeData, setPointChargeData] = useState<PointChargeData>({
    amount: 0,
    description: "",
    reason: ""
  });

  // 페이지네이션 함수들
  const handlePageSizeChange = (newSize: number) => {
    setPagination(prev => ({ 
      ...prev, 
      limit: newSize, 
      page: 1 
    }));
  };

  const handlePageChange = (pageNumber: number) => {
    setPagination(prev => ({ ...prev, page: pageNumber }));
    // 테이블 상단으로 스크롤
    document.querySelector('.point-charge-management-content')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFirstPage = () => handlePageChange(1);
  const handleLastPage = () => handlePageChange(pagination.totalPages);
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      handlePageChange(pagination.page - 1);
    }
  };
  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      handlePageChange(pagination.page + 1);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // 실제 API에서 사용자 데이터 로드
  const loadUsers = useCallback(async () => {
    setLoading(true);
    
    try {
      // 인증 토큰 가져오기
      const token = tokenManager.getAccessToken();
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      // API 호출
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }

      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/admin/point-status?${params.toString()}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "사용자 정보를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        throw new Error("데이터 로드에 실패했습니다.");
      }
    } catch (error) {
      console.error("사용자 데이터 로드 오류:", error);
      
      // 에러 처리 - 빈 상태로 설정
      setUsers([]);
      setPagination({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      });
      
      // 사용자에게 에러 알림 (선택적)
      if (error instanceof Error && error.message.includes("인증")) {
        // 인증 오류의 경우 로그인 페이지로 리다이렉트할 수 있음
        console.error("인증 오류:", error.message);
      } else {
        console.error("데이터 로드 오류:", error);
      }
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 사용자 선택/해제
  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // 전체 선택/해제
  const handleSelectAll = () => {
    setSelectedUsers(selectedUsers.length === users.length ? [] : users.map(u => u.id));
  };


  // 개별 포인트 충전 모달 열기
  const openPointChargeModal = (user: User) => {
    setSelectedUser(user);
    setPointChargeData({ amount: 0, description: "", reason: "" });
    setShowPointChargeModal(true);
  };

  // 일괄 포인트 충전 모달 열기
  const openBulkChargeModal = () => {
    if (selectedUsers.length === 0) {
      alert("충전할 사용자를 선택해주세요.");
      return;
    }
    setPointChargeData({ amount: 0, description: "", reason: "" });
    setShowBulkChargeModal(true);
  };

  // 포인트 충전 처리 (개별)
  const handlePointCharge = async () => {
    if (!selectedUser || pointChargeData.amount <= 0) {
      alert("올바른 포인트 금액을 입력해주세요.");
      return;
    }

    if (!pointChargeData.description || !pointChargeData.reason) {
      alert("설명과 사유를 입력해주세요.");
      return;
    }

    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch("/api/admin/point-charge", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount: pointChargeData.amount,
          description: pointChargeData.description,
          reason: pointChargeData.reason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "포인트 충전에 실패했습니다.");
      }

      if (result.success) {
        alert(result.message);
        setShowPointChargeModal(false);
        loadUsers(); // 데이터 새로고침
      } else {
        throw new Error("포인트 충전에 실패했습니다.");
      }
    } catch (error) {
      console.error("포인트 충전 오류:", error);
      alert(error instanceof Error ? error.message : "포인트 충전에 실패했습니다.");
    }
  };

  // 일괄 포인트 충전 처리
  const handleBulkPointCharge = async () => {
    if (pointChargeData.amount <= 0) {
      alert("올바른 포인트 금액을 입력해주세요.");
      return;
    }

    if (!pointChargeData.description || !pointChargeData.reason) {
      alert("설명과 사유를 입력해주세요.");
      return;
    }

    if (!confirm(`선택한 ${selectedUsers.length}명에게 각각 ${pointChargeData.amount}포인트를 충전하시겠습니까?`)) {
      return;
    }

    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        alert("인증 토큰이 없습니다. 다시 로그인해주세요.");
        return;
      }

      const response = await fetch("/api/admin/point-charge/bulk", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          amount: pointChargeData.amount,
          description: pointChargeData.description,
          reason: pointChargeData.reason,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "일괄 포인트 충전에 실패했습니다.");
      }

      if (result.success) {
        alert(result.message);
        
        // 부분 실패가 있었다면 오류 정보도 표시
        if (result.errors && result.errors.length > 0) {
          const errorMessages = result.errors.map((err: BulkChargeError) => 
            `${err.name} (${err.username}): ${err.error}`
          ).join('\n');
          alert(`일부 사용자 충전 실패:\n${errorMessages}`);
        }
        
        setShowBulkChargeModal(false);
        setSelectedUsers([]);
        loadUsers(); // 데이터 새로고침
      } else {
        throw new Error("일괄 포인트 충전에 실패했습니다.");
      }
    } catch (error) {
      console.error("일괄 포인트 충전 오류:", error);
      alert(error instanceof Error ? error.message : "일괄 포인트 충전에 실패했습니다.");
    }
  };

  // 상태 뱃지 컴포넌트
  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case "정상": return "bg-green-100 text-green-800";
        case "정지": return "bg-red-100 text-red-800";
        case "대기": return "bg-yellow-100 text-yellow-800";
        case "거부": return "bg-gray-100 text-gray-800";
        default: return "bg-gray-100 text-gray-800";
      }
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)}`}>
        {status}
      </span>
    );
  };


  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="flex min-h-[calc(100vh-64px)] mt-16 bg-gray-50 text-gray-800 font-['Noto_Sans_KR','-apple-system','BlinkMacSystemFont','Segoe_UI','Roboto','sans-serif']">
        <div className="flex-1 ml-0 lg:ml-[250px] p-4 lg:p-6 bg-gray-50 transition-all duration-300 ease-in-out overflow-x-auto min-w-0 point-charge-management-content">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 md:gap-0">
            <h1 className="m-0 text-2xl md:text-3xl font-bold text-gray-800">포인트 충전 관리</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">전체 {pagination.total.toLocaleString()}명</span>
            </div>
          </div>

          {/* 검색 및 필터 영역 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">검색어</label>
                <input
                  type="text"
                  placeholder="이름, 사용자ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">전체</option>
                  <option value="정상">정상</option>
                  <option value="정지">정지</option>
                  <option value="대기">대기</option>
                </select>
              </div>
            </div>
          </div>

          {/* 일괄처리 영역 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onChange={handleSelectAll}
                  disabled={users.length === 0}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">전체선택</span>
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedUsers.length}명 선택됨
                </span>
                <button
                  onClick={openBulkChargeModal}
                  disabled={selectedUsers.length === 0}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  선택된 사용자 일괄 포인트 충전
                </button>
              </div>
            </div>
          </div>

          {/* 사용자 목록 테이블 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white min-w-[900px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-10 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={users.length > 0 && selectedUsers.length === users.length}
                        onChange={handleSelectAll}
                        disabled={users.length === 0}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">사용자ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">이름</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[60px]">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">현재포인트</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">총충전</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[80px]">총사용</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">마지막활동</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[100px]">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        로딩 중...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        검색 결과가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleUserSelect(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.username}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.name}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                          {user.pointBalance.toLocaleString()} P
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.totalPointCharged.toLocaleString()} P
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.totalPointUsed.toLocaleString()} P
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {user.lastPointActivity ? new Date(user.lastPointActivity).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => openPointChargeModal(user)}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            포인트충전
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 */}
          {!loading && users.length > 0 && (
            <div className="flex flex-col lg:flex-row justify-between items-center p-4 lg:p-6 bg-gray-50 border-t border-gray-200 gap-4">
              <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
                <div className="text-sm text-gray-600 whitespace-nowrap">
                  {((pagination.page - 1) * pagination.limit + 1)}-{Math.min(pagination.page * pagination.limit, pagination.total)} 
                  / 전체 {pagination.total.toLocaleString()}명
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 whitespace-nowrap">페이지당</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded cursor-pointer bg-white min-w-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400"
                  >
                    <option value={10}>10개</option>
                    <option value={20}>20개</option>
                    <option value={50}>50개</option>
                    <option value={100}>100개</option>
                  </select>
                </div>
              </div>
              
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleFirstPage}
                    disabled={pagination.page === 1}
                    className="flex items-center justify-center min-w-8 h-9 text-base font-bold border border-gray-300 bg-white text-gray-700 cursor-pointer transition-all duration-200 rounded hover:bg-gray-100 hover:border-gray-400 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                    title="첫 페이지"
                  >
                    ««
                  </button>
                  
                  <button
                    onClick={handlePrevPage}
                    disabled={pagination.page === 1}
                    className="flex items-center justify-center min-w-8 h-9 text-base font-bold border border-gray-300 bg-white text-gray-700 cursor-pointer transition-all duration-200 rounded hover:bg-gray-100 hover:border-gray-400 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                    title="이전 페이지"
                  >
                    ‹
                  </button>
                  
                  {/* 페이지 번호 버튼들 */}
                  {(() => {
                    const startPage = Math.max(1, pagination.page - 2);
                    const endPage = Math.min(pagination.totalPages, startPage + 4);
                    const pages = [];
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`flex items-center justify-center min-w-9 h-9 text-sm font-medium border cursor-pointer transition-all duration-200 rounded ${
                            i === pagination.page 
                              ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700' 
                              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:border-gray-400'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  <button
                    onClick={handleNextPage}
                    disabled={pagination.page === pagination.totalPages}
                    className="flex items-center justify-center min-w-8 h-9 text-base font-bold border border-gray-300 bg-white text-gray-700 cursor-pointer transition-all duration-200 rounded hover:bg-gray-100 hover:border-gray-400 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                    title="다음 페이지"
                  >
                    ›
                  </button>
                  
                  <button
                    onClick={handleLastPage}
                    disabled={pagination.page === pagination.totalPages}
                    className="flex items-center justify-center min-w-8 h-9 text-base font-bold border border-gray-300 bg-white text-gray-700 cursor-pointer transition-all duration-200 rounded hover:bg-gray-100 hover:border-gray-400 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
                    title="마지막 페이지"
                  >
                    »»
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 개별 포인트 충전 모달 */}
      {showPointChargeModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">포인트 충전</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>{selectedUser.name}</strong> ({selectedUser.username})님에게 포인트를 충전합니다.
              </p>
              <p className="text-sm text-gray-600">
                현재 포인트: <strong>{selectedUser.pointBalance.toLocaleString()} P</strong>
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">충전 포인트</label>
                <input
                  type="number"
                  value={pointChargeData.amount}
                  onChange={(e) => setPointChargeData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  placeholder="충전할 포인트를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input
                  type="text"
                  value={pointChargeData.description}
                  onChange={(e) => setPointChargeData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="예: 관리자 포인트 충전"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
                <textarea
                  value={pointChargeData.reason}
                  onChange={(e) => setPointChargeData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="포인트 충전 사유를 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowPointChargeModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handlePointCharge}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                충전하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 일괄 포인트 충전 모달 */}
      {showBulkChargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">일괄 포인트 충전</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                선택된 <strong>{selectedUsers.length}명</strong>의 사용자에게 각각 동일한 포인트를 충전합니다.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">충전 포인트 (1인당)</label>
                <input
                  type="number"
                  value={pointChargeData.amount}
                  onChange={(e) => setPointChargeData(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
                  placeholder="충전할 포인트를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                <input
                  type="text"
                  value={pointChargeData.description}
                  onChange={(e) => setPointChargeData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="예: 이벤트 포인트 지급"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
                <textarea
                  value={pointChargeData.reason}
                  onChange={(e) => setPointChargeData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="일괄 포인트 충전 사유를 입력하세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-700">
                  총 충전 포인트: <strong>{(pointChargeData.amount * selectedUsers.length).toLocaleString()} P</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowBulkChargeModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleBulkPointCharge}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                일괄 충전하기
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}