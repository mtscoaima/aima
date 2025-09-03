"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

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

export default function PointChargeManagementPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
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

  const itemsPerPage = 20;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // 임시 데이터 - 실제 구현 시 API에서 가져올 데이터
  const loadUsers = useCallback(async () => {
    setLoading(true);
    
    // 임시 데이터 생성
    const dummyUsers: User[] = Array.from({ length: 50 }, (_, index) => ({
      id: `user_${index + 1}`,
      username: `user${index + 1}`,
      name: `사용자${index + 1}`,
      email: `user${index + 1}@example.com`,
      phone: `010-1234-${String(index + 1).padStart(4, '0')}`,
      userType: index % 3 === 0 ? "기업" : "개인",
      company: index % 3 === 0 ? `회사${index + 1}` : undefined,
      status: ["정상", "정지", "대기"][index % 3] as "정상" | "정지" | "대기",
      role: index % 10 === 0 ? "SALESPERSON" : "USER",
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      pointBalance: Math.floor(Math.random() * 100000),
      totalPointCharged: Math.floor(Math.random() * 200000),
      totalPointUsed: Math.floor(Math.random() * 150000),
      lastPointActivity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // 검색 및 필터링 적용
    let filteredUsers = dummyUsers;
    
    if (searchQuery) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.includes(searchQuery) ||
        user.username.includes(searchQuery)
      );
    }
    
    if (statusFilter !== "all") {
      filteredUsers = filteredUsers.filter(user => user.status === statusFilter);
    }

    // 페이지네이션 적용
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    setUsers(paginatedUsers);
    setTotalUsers(filteredUsers.length);
    setTotalPages(Math.ceil(filteredUsers.length / itemsPerPage));
    setLoading(false);
  }, [currentPage, searchQuery, statusFilter]);

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

    // TODO: API 호출
    console.log("개별 포인트 충전:", {
      userId: selectedUser.id,
      amount: pointChargeData.amount,
      description: pointChargeData.description,
      reason: pointChargeData.reason
    });

    alert(`${selectedUser.name}님에게 ${pointChargeData.amount}포인트가 충전되었습니다.`);
    setShowPointChargeModal(false);
    loadUsers(); // 데이터 새로고침
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

    // TODO: API 호출
    console.log("일괄 포인트 충전:", {
      userIds: selectedUsers,
      amount: pointChargeData.amount,
      description: pointChargeData.description,
      reason: pointChargeData.reason
    });

    alert(`선택한 ${selectedUsers.length}명에게 각각 ${pointChargeData.amount}포인트가 충전되었습니다.`);
    setShowBulkChargeModal(false);
    setSelectedUsers([]);
    loadUsers(); // 데이터 새로고침
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

  // 역할 뱃지 컴포넌트
  const RoleBadge = ({ role }: { role: string }) => {
    const getRoleColor = (role: string) => {
      switch (role) {
        case "ADMIN": return "bg-purple-100 text-purple-800";
        case "SALESPERSON": return "bg-blue-100 text-blue-800";
        case "USER": return "bg-gray-100 text-gray-800";
        default: return "bg-gray-100 text-gray-800";
      }
    };

    const getRoleName = (role: string) => {
      switch (role) {
        case "ADMIN": return "관리자";
        case "SALESPERSON": return "영업사원";
        case "USER": return "일반회원";
        default: return role;
      }
    };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(role)}`}>
        {getRoleName(role)}
      </span>
    );
  };

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="flex min-h-[calc(100vh-64px)] mt-16 bg-gray-50 text-gray-800 font-['Noto_Sans_KR','-apple-system','BlinkMacSystemFont','Segoe_UI','Roboto','sans-serif']">
        <div className="flex-1 ml-0 lg:ml-[250px] p-4 lg:p-6 bg-gray-50 transition-all duration-300 ease-in-out overflow-x-auto min-w-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 md:gap-0">
            <h1 className="m-0 text-2xl md:text-3xl font-bold text-gray-800">포인트 충전 관리</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">전체 {totalUsers.toLocaleString()}명</span>
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
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalUsers)} / {totalUsers}명
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <span className="px-3 py-1 text-sm">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
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