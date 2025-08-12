"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import { tokenManager } from "@/lib/api";
import "./styles.css";

// 회원 목록 데이터 (실제로는 API에서 가져올 데이터)
interface User {
  id: string;
  userId: string;
  name: string;
  company?: string;
  userType: "개인" | "기업";
  email: string;
  phone: string;
  status: "정상" | "정지" | "탈퇴" | "대기" | "거부";
  grade: "일반" | "실버" | "골드" | "VIP";
  joinDate: string;
  updateDate: string;
  lastLogin: string;
}

interface UserFormData {
  username: string;
  name: string;
  email: string;
  phone: string;
  userType: "개인" | "기업";
  company?: string;
  password?: string;
}

interface LoginLog {
  id: string;
  userId: string;
  userName: string;
  company?: string;
  loginIp: string;
  loginTime: string;
  success: boolean;
  sessionStatus: "활성" | "비활성" | "-";
}

interface UserStats {
  total: number;
  individual: number;
  business: number;
  active: number;
  suspended: number;
  pending: number;
  rejected: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  users?: T[];
  stats?: UserStats;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function UserManagementPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"members" | "grades" | "access">("members");
  
  // 회원 관리 상태
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalType, setModalType] = useState<"add" | "edit" | "detail">("add");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    name: "",
    email: "",
    phone: "",
    userType: "개인",
    company: "",
    password: ""
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0
  });

  // 검색 필터 상태
  const [searchFilters, setSearchFilters] = useState({
    userType: "전체",
    company: "전체",
    searchType: "사용자ID",
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    status: "전체"
  });

  // API 호출 함수들
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        console.error("토큰이 없습니다.");
        return;
      }

      const queryParams = new URLSearchParams({
        userType: searchFilters.userType,
        company: searchFilters.company,
        searchType: searchFilters.searchType,
        searchTerm: searchFilters.searchTerm,
        status: searchFilters.status,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('사용자 목록을 가져오는데 실패했습니다.');
      }

      const data: ApiResponse<User> = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
        setStats(data.stats || null);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        console.error('API 오류:', data.message);
      }
    } catch (error) {
      console.error('사용자 목록 가져오기 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [searchFilters, pagination.page, pagination.limit]);

  // 기업 목록 가져오기
  const fetchCompanies = useCallback(async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        console.error("토큰이 없습니다.");
        return;
      }

      const response = await fetch('/api/admin/companies', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('기업 목록을 가져오는데 실패했습니다.');
      }

      const data = await response.json();
      
      if (data.success) {
        setCompanies(data.companies || []);
      } else {
        console.error('기업 목록 API 오류:', data.message);
      }
    } catch (error) {
      console.error('기업 목록 가져오기 실패:', error);
    }
  }, []);

  // API 연동 함수들 
  const createUser = async (userData: UserFormData) => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) throw new Error("토큰이 없습니다.");

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchUsers(); // 목록 새로고침
        return data;
      } else {
        throw new Error(data.message || '회원 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원 등록 실패:', error);
      throw error;
    }
  };

  const updateUser = async (userId: string, updateData: Partial<UserFormData>) => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) throw new Error("토큰이 없습니다.");

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, ...updateData }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchUsers(); // 목록 새로고침
        return data;
      } else {
        throw new Error(data.message || '회원 정보 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원 정보 수정 실패:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) throw new Error("토큰이 없습니다.");

      const response = await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchUsers(); // 목록 새로고침
        return data;
      } else {
        throw new Error(data.message || '회원 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원 삭제 실패:', error);
      throw error;
    }
  };

  const bulkUpdateUsers = async (userIds: string[], action: string) => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) throw new Error("토큰이 없습니다.");

      const response = await fetch('/api/admin/users/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds, action }),
      });

      const data = await response.json();
      
      if (data.success) {
        await fetchUsers(); // 목록 새로고침
        return data;
      } else {
        throw new Error(data.message || '일괄 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('일괄 처리 실패:', error);
      throw error;
    }
  };

  const downloadExcel = async () => {
    try {
      const token = tokenManager.getAccessToken();
      if (!token) throw new Error("토큰이 없습니다.");

      const queryParams = new URLSearchParams({
        userType: searchFilters.userType,
        company: searchFilters.company,
        searchType: searchFilters.searchType,
        searchTerm: searchFilters.searchTerm,
        status: searchFilters.status,
      });

      const response = await fetch(`/api/admin/users/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Excel 다운로드에 실패했습니다.');
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `회원목록_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel 다운로드 실패:', error);
      throw error;
    }
  };

  const [loginLogs] = useState<LoginLog[]>([
    {
      id: "1",
      userId: "user001",
      userName: "홍*동",
      company: "(주)ABC",
      loginIp: "192.168.1.100",
      loginTime: "2024-12-21 09:30:15",
      success: true,
      sessionStatus: "활성"
    },
    {
      id: "2",
      userId: "user002", 
      userName: "김*수",
      company: "",
      loginIp: "10.0.0.50",
      loginTime: "2024-12-21 08:45:22",
      success: false,
      sessionStatus: "-"
    },
    {
      id: "3",
      userId: "user003",
      userName: "박*영",
      company: "(주)XYZ", 
      loginIp: "172.16.0.25",
      loginTime: "2024-12-21 11:15:33",
      success: true,
      sessionStatus: "활성"
    }
  ]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [fetchUsers, fetchCompanies]);

  // 검색 필터 변경 시 첫 페이지로 이동
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [searchFilters.userType, searchFilters.company, searchFilters.searchType, searchFilters.searchTerm, searchFilters.status]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // 회원 관리 핸들러들
  const handleAddUser = () => {
    console.log("회원 등록 버튼 클릭");
    setModalType("add");
    setSelectedUser(null);
    setFormData({
      username: "",
      name: "",
      email: "",
      phone: "",
      userType: "개인",
      company: "",
      password: ""
    });
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    console.log("회원 수정:", user);
    setModalType("edit");
    setSelectedUser(user);
    setFormData({
      username: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      company: user.company || "",
      password: ""
    });
    setShowUserModal(true);
  };

  const handleViewUser = (user: User) => {
    console.log("회원 상세 보기:", user);
    setModalType("detail");
    setSelectedUser(user);
    setFormData({
      username: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType: user.userType,
      company: user.company || "",
      password: ""
    });
    setShowUserModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    console.log("회원 삭제:", userId);
    if (confirm("정말로 이 회원을 삭제하시겠습니까?")) {
      try {
        await deleteUser(userId);
        alert("회원이 성공적으로 삭제되었습니다.");
      } catch (error) {
        alert("회원 삭제에 실패했습니다: " + (error as Error).message);
      }
    }
  };

  const handleBulkAction = async (action: string) => {
    if (!action || selectedUsers.length === 0) {
      alert("액션을 선택하고 대상 회원을 선택해주세요.");
      return;
    }

    const actionNames = {
      activate: "활성화",
      suspend: "정지",
      approve: "승인",
      reject: "거부",
      delete: "삭제"
    };

    const actionName = actionNames[action as keyof typeof actionNames] || action;
    
    if (confirm(`선택한 ${selectedUsers.length}명의 회원을 ${actionName}하시겠습니까?`)) {
      try {
        const result = await bulkUpdateUsers(selectedUsers, action);
        alert(result.message);
        setSelectedUsers([]); // 선택 해제
      } catch (error) {
        alert("일괄 처리에 실패했습니다: " + (error as Error).message);
      }
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(selectedUsers.length === users.length ? [] : users.map(u => u.id));
  };

  const handleSearch = () => {
    console.log("검색 실행:", searchFilters);
    fetchUsers(); // 실제 검색 실행
  };

  const handleExcelDownload = async () => {
    try {
      await downloadExcel();
      console.log("Excel 다운로드 완료");
    } catch (error) {
      alert("Excel 다운로드에 실패했습니다: " + (error as Error).message);
    }
  };



  // 등급 관리 핸들러들
  const handleGradeSettings = () => {
    console.log("등급 기준 설정");
  };

  const handleBenefitSettings = () => {
    console.log("혜택 설정");
  };

  // 폼 제출 핸들러
  const handleFormSubmit = async () => {
    try {
      if (modalType === "add") {
        await createUser(formData);
        alert("회원이 성공적으로 등록되었습니다.");
      } else if (modalType === "edit" && selectedUser) {
        await updateUser(selectedUser.id, formData);
        alert("회원 정보가 성공적으로 수정되었습니다.");
      }
      setShowUserModal(false);
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleModalClose = () => {
    setShowUserModal(false);
    setSelectedUser(null);
    setFormData({
      username: "",
      name: "",
      email: "",
      phone: "",
      userType: "개인",
      company: "",
      password: ""
    });
  };

  const handleFormChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // handleGradeAdjust는 추후 등급 관리 기능에서 구현 예정

  // 접속 관리 핸들러들
  const handleTerminateSession = (sessionId: string) => {
    console.log("세션 강제 종료:", sessionId);
  };

  const handleBlockIp = (ip: string) => {
    console.log("IP 차단:", ip);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "정상":
        return "status-active";
      case "정지":
        return "status-suspended";
      case "탈퇴":
        return "status-withdrawn";
      default:
        return "status-unknown";
    }
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case "VIP":
        return "grade-vip";
      case "골드":
        return "grade-gold";
      case "실버":
        return "grade-silver";
      case "일반":
        return "grade-normal";
      default:
        return "grade-normal";
    }
  };

  // 통계 데이터 (API에서 받아온 것 우선, 없으면 로컬 계산)
  const totalUsers = stats?.total || users.length;
  const usersByType = {
    individual: stats?.individual || users.filter(u => u.userType === "개인").length,
    business: stats?.business || users.filter(u => u.userType === "기업").length
  };
  const usersByStatus = {
    active: stats?.active || users.filter(u => u.status === "정상").length,
    suspended: stats?.suspended || users.filter(u => u.status === "정지").length,
    pending: stats?.pending || users.filter(u => u.status === "대기").length,
    rejected: stats?.rejected || users.filter(u => u.status === "거부").length
  };

  const renderMembersTab = () => (
    <div className="tab-content">
      {/* 통계 영역 */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{totalUsers.toLocaleString()}</div>
            <div className="stat-label">전체 회원수</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{usersByType.individual}</div>
            <div className="stat-label">개인 회원</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{usersByType.business}</div>
            <div className="stat-label">기업 회원</div>
            </div>
          <div className="stat-card">
            <div className="stat-number">{usersByStatus.active}</div>
            <div className="stat-label">정상 회원</div>
          </div>
        </div>
      </div>

      {/* 검색 필터 영역 */}
      <div className="filter-section">
        <div className="filter-row">
          <select 
            value={searchFilters.userType}
            onChange={(e) => setSearchFilters({...searchFilters, userType: e.target.value})}
            className="filter-select"
          >
            <option value="전체">회원유형 전체</option>
            <option value="개인">개인</option>
            <option value="기업">기업</option>
          </select>
          
          <select 
            value={searchFilters.company}
            onChange={(e) => setSearchFilters({...searchFilters, company: e.target.value})}
            className="filter-select"
          >
            <option value="전체">기업명 전체</option>
            {companies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>

          <select 
            value={searchFilters.searchType}
            onChange={(e) => setSearchFilters({...searchFilters, searchType: e.target.value})}
            className="filter-select"
          >
            <option value="사용자ID">사용자ID</option>
            <option value="사용자이름">사용자이름</option>
            <option value="가입일">가입일</option>
          </select>

          <input 
            type="text"
            value={searchFilters.searchTerm}
            onChange={(e) => setSearchFilters({...searchFilters, searchTerm: e.target.value})}
            placeholder="검색어를 입력하세요"
            className="filter-input"
          />

          <button onClick={handleSearch} className="btn-primary">검색</button>
        </div>
      </div>

      {/* 액션 버튼 영역 */}
      <div className="table-actions">
        <div className="table-actions-left">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              checked={selectedUsers.length === users.length}
              onChange={handleSelectAll}
            />
            전체선택
          </label>
          <select 
            onChange={(e) => {
              if (e.target.value) {
                handleBulkAction(e.target.value);
                e.target.value = ""; // 선택 후 초기화
              }
            }}
            className="bulk-action-select"
            value=""
            disabled={selectedUsers.length === 0}
          >
            <option value="">일괄처리 선택</option>
            <option value="activate">활성화</option>
            <option value="suspend">정지</option>
            <option value="approve">승인</option>
            <option value="reject">거부</option>
            <option value="delete">삭제</option>
          </select>
        </div>
        <div className="table-actions-right">
          <button onClick={handleAddUser} className="btn-primary">회원 등록</button>
          <button onClick={handleExcelDownload} className="btn-secondary">Excel 다운로드</button>
        </div>
            </div>

      {/* 회원 목록 테이블 */}
      <div className="table-container">
        <table className="data-table">
                <thead>
                  <tr>
                          <th style={{ width: "40px" }}>
              <input 
                type="checkbox" 
                checked={users.length > 0 && selectedUsers.length === users.length}
                onChange={handleSelectAll}
                disabled={users.length === 0}
              />
            </th>
              <th>사용자ID</th>
              <th>사용자명</th>
              <th>기업명</th>
              <th>회원유형</th>
                    <th>이메일</th>
              <th>연락처</th>
                    <th>상태</th>
              <th>등급</th>
              <th>가입일</th>
              <th>수정일</th>
              <th>최종로그인</th>
              <th>관리</th>
                  </tr>
                </thead>
                                 <tbody>
                   {loading ? (
                     <tr>
                       <td colSpan={13} style={{ textAlign: 'center', padding: '40px' }}>
                         <div className="loading-spinner">로딩 중...</div>
                       </td>
                     </tr>
                   ) : users.length === 0 ? (
                     <tr>
                       <td colSpan={13} style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                         조회된 회원이 없습니다.
                       </td>
                     </tr>
                   ) : (
                     users.map((user) => (
                       <tr key={user.id}>
                         <td>
                           <input 
                             type="checkbox"
                             checked={selectedUsers.includes(user.id)}
                             onChange={() => handleUserSelect(user.id)}
                           />
                         </td>
                         <td>{user.userId}</td>
                         <td>{user.name}</td>
                         <td>{user.company || '-'}</td>
                         <td>{user.userType}</td>
                         <td>{user.email}</td>
                         <td>{user.phone}</td>
                         <td>
                           <span className={`status-badge ${getStatusBadge(user.status)}`}>
                             {user.status}
                           </span>
                         </td>
                         <td>
                           <span className={`grade-badge ${getGradeBadge(user.grade)}`}>
                             {user.grade}
                           </span>
                         </td>
                         <td>{user.joinDate}</td>
                         <td>{user.updateDate}</td>
                         <td>{user.lastLogin}</td>
                         <td>
                           <div className="action-buttons">
                             <button 
                               onClick={() => handleViewUser(user)}
                               className="btn-xs btn-secondary"
                             >
                               상세
                             </button>
                             <button 
                               onClick={() => handleEditUser(user)}
                               className="btn-xs btn-primary"
                             >
                               수정
                             </button>
                             <button 
                               onClick={() => handleDeleteUser(user.id)}
                               className="btn-xs btn-danger"
                             >
                               삭제
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {!loading && users.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            전체 {pagination.total.toLocaleString()}명 중 {pagination.page}페이지 ({pagination.totalPages}페이지)
          </div>
          <div className="pagination-controls">
            <button 
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page <= 1}
              className="btn-secondary"
            >
              이전
            </button>
            <span className="page-indicator">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button 
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page >= pagination.totalPages}
              className="btn-secondary"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderGradesTab = () => (
    <div className="tab-content">
      <div className="grades-section">
        <div className="section-header">
          <h2>회원 등급 관리</h2>
          <p>회원 등급 기준과 혜택을 설정하고 관리합니다.</p>
        </div>

        <div className="grades-actions">
          <button onClick={handleGradeSettings} className="btn-primary">등급 기준 설정</button>
          <button onClick={handleBenefitSettings} className="btn-secondary">혜택 설정</button>
        </div>

        {/* 등급 기준 표 */}
        <div className="grades-table-container">
          <h3>현재 등급 기준 (최근 3개월 기준)</h3>
          <table className="grades-table">
            <thead>
              <tr>
                <th>등급</th>
                <th>조건</th>
                <th>혜택</th>
                <th>회원수</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="grade-badge grade-normal">일반</span></td>
                <td>전월 사용금액 3만원 이하</td>
                <td>기본 서비스 이용</td>
                <td>{users.filter(u => u.grade === "일반").length}명</td>
                <td><button className="btn-xs btn-secondary">수정</button></td>
              </tr>
              <tr>
                <td><span className="grade-badge grade-silver">실버</span></td>
                <td>전월 사용금액 3~5만원</td>
                <td>생일쿠폰 제공</td>
                <td>{users.filter(u => u.grade === "실버").length}명</td>
                <td><button className="btn-xs btn-secondary">수정</button></td>
              </tr>
              <tr>
                <td><span className="grade-badge grade-gold">골드</span></td>
                <td>전월 사용금액 5~10만원</td>
                <td>포인트 적립 혜택</td>
                <td>{users.filter(u => u.grade === "골드").length}명</td>
                <td><button className="btn-xs btn-secondary">수정</button></td>
              </tr>
              <tr>
                <td><span className="grade-badge grade-vip">VIP</span></td>
                <td>전월 사용금액 10만원 이상</td>
                <td>전용쿠폰, 우선지원</td>
                <td>{users.filter(u => u.grade === "VIP").length}명</td>
                <td><button className="btn-xs btn-secondary">수정</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 수동 등급 조정 */}
        <div className="manual-grade-section">
          <h3>수동 등급 조정</h3>
          <div className="grade-adjust-form">
            <select className="grade-select">
              <option value="">회원 선택</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.userId})
                </option>
              ))}
            </select>
            <select className="grade-select">
              <option value="">새 등급 선택</option>
              <option value="일반">일반</option>
              <option value="실버">실버</option>
              <option value="골드">골드</option>
              <option value="VIP">VIP</option>
            </select>
            <input 
              type="text" 
              placeholder="조정 사유 입력"
              className="reason-input"
            />
            <button className="btn-primary">등급 조정</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccessTab = () => (
    <div className="tab-content">
      {/* 실시간 접속 현황 */}
      <div className="access-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">245</div>
            <div className="stat-label">현재 접속자</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">1,234</div>
            <div className="stat-label">오늘 신규 로그인</div>
          </div>
          <div className="stat-card warning">
            <div className="stat-number">3</div>
            <div className="stat-label">이상 로그인</div>
          </div>
          <div className="stat-card danger">
            <div className="stat-number">12</div>
            <div className="stat-label">차단된 IP</div>
          </div>
        </div>
      </div>

      {/* 검색 필터 */}
      <div className="filter-section">
        <div className="filter-row">
          <select className="filter-select">
            <option value="전체">회원유형 전체</option>
            <option value="개인">개인</option>
            <option value="기업">기업</option>
          </select>
          
          <input type="date" className="filter-input" />
          <span>~</span>
          <input type="date" className="filter-input" />

          <select className="filter-select">
            <option value="전체">로그인 결과</option>
            <option value="성공">성공</option>
            <option value="실패">실패</option>
          </select>

          <button className="btn-primary">검색</button>
        </div>
      </div>

      {/* 접속 이력 테이블 */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>사용자ID</th>
              <th>사용자명</th>
              <th>기업명</th>
              <th>접속 IP</th>
              <th>접속일시</th>
              <th>성공여부</th>
              <th>세션상태</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {loginLogs.map((log) => (
              <tr key={log.id}>
                <td>{log.userId}</td>
                <td>{log.userName}</td>
                <td>{log.company || '-'}</td>
                <td>{log.loginIp}</td>
                <td>{log.loginTime}</td>
                <td>
                  <span className={`status-badge ${log.success ? 'status-success' : 'status-failed'}`}>
                    {log.success ? '성공' : '실패'}
                  </span>
                </td>
                <td>
                  <span className={`session-badge ${log.sessionStatus === '활성' ? 'session-active' : 'session-inactive'}`}>
                    {log.sessionStatus}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                    {log.sessionStatus === '활성' && (
                          <button
                        onClick={() => handleTerminateSession(log.id)}
                        className="btn-xs btn-danger"
                          >
                        세션종료
                          </button>
                    )}
                          <button
                      onClick={() => handleBlockIp(log.loginIp)}
                      className="btn-xs btn-warning"
                          >
                      IP차단
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
    </div>
  );

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-dashboard">
        <div className="admin-main">
          <div className="admin-header">
            <h1>회원 관리</h1>
            <div className="admin-actions">
              <span className="total-count">전체 {totalUsers.toLocaleString()}명</span>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
              onClick={() => setActiveTab('members')}
            >
              회원 정보 관리
            </button>
            <button 
              className={`tab-button ${activeTab === 'grades' ? 'active' : ''}`}
              onClick={() => setActiveTab('grades')}
            >
              회원 등급 관리
            </button>
            <button 
              className={`tab-button ${activeTab === 'access' ? 'active' : ''}`}
              onClick={() => setActiveTab('access')}
            >
              로그인/접속 관리
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="tab-container">
            {activeTab === 'members' && renderMembersTab()}
            {activeTab === 'grades' && renderGradesTab()}
            {activeTab === 'access' && renderAccessTab()}
          </div>

          {/* 회원 모달 */}
          {showUserModal && (
            <div className="modal-overlay" onClick={handleModalClose}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>
                    {modalType === 'add' && '회원 등록'}
                    {modalType === 'edit' && '회원 정보 수정'}
                    {modalType === 'detail' && '회원 상세 정보'}
                  </h3>
                  <button 
                    className="modal-close"
                    onClick={handleModalClose}
                  >
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="form-grid">
                    <div className="form-group">
                      <label>사용자ID *</label>
                      <input 
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleFormChange('username', e.target.value)}
                        disabled={modalType === 'detail'}
                        placeholder="영문, 숫자, 언더스코어 (3-20자)"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>사용자명 *</label>
                      <input 
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        disabled={modalType === 'detail'}
                        placeholder="사용자 이름"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>이메일 *</label>
                      <input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        disabled={modalType === 'detail'}
                        placeholder="example@email.com"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>연락처 *</label>
                      <input 
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        disabled={modalType === 'detail'}
                        placeholder="010-1234-5678"
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>회원유형 *</label>
                      <select 
                        value={formData.userType}
                        onChange={(e) => handleFormChange('userType', e.target.value as "개인" | "기업")}
                        disabled={modalType === 'detail'}
                        className="form-select"
                      >
                        <option value="개인">개인</option>
                        <option value="기업">기업</option>
                      </select>
                    </div>
                    
                    {formData.userType === '기업' && (
                      <div className="form-group">
                        <label>기업명</label>
                        <input 
                          type="text"
                          value={formData.company}
                          onChange={(e) => handleFormChange('company', e.target.value)}
                          disabled={modalType === 'detail'}
                          placeholder="회사명"
                          className="form-input"
                        />
                      </div>
                    )}
                    
                    {modalType === 'add' && (
                      <div className="form-group">
                        <label>비밀번호</label>
                        <input 
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleFormChange('password', e.target.value)}
                          placeholder="미입력 시 temp123! 사용"
                          className="form-input"
                        />
                      </div>
                    )}
                    
                    {modalType === 'detail' && selectedUser && (
                      <>
                        <div className="form-group">
                          <label>상태</label>
                          <span className={`status-badge ${getStatusBadge(selectedUser.status)}`}>
                            {selectedUser.status}
                          </span>
                        </div>
                        
                        <div className="form-group">
                          <label>등급</label>
                          <span className={`grade-badge ${getGradeBadge(selectedUser.grade)}`}>
                            {selectedUser.grade}
                          </span>
                        </div>
                        
                        <div className="form-group">
                          <label>가입일</label>
                          <span className="form-text">{selectedUser.joinDate}</span>
                        </div>
                        
                        <div className="form-group">
                          <label>최종 로그인</label>
                          <span className="form-text">{selectedUser.lastLogin}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    className="btn-secondary"
                    onClick={handleModalClose}
                  >
                    취소
                  </button>
                  {modalType !== 'detail' && (
                    <button 
                      className="btn-primary"
                      onClick={handleFormSubmit}
                    >
                      {modalType === 'add' ? '등록' : '수정'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  );
}