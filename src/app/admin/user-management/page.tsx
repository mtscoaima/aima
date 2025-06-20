"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import "./styles.css";

export default function UserManagementPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 사용자 목록 데이터 (실제로는 API에서 가져올 데이터)
  const [users] = useState([
    {
      id: "admin01",
      name: "김관리",
      role: "최고관리자",
      email: "admin@company.com",
      lastLogin: "2024-06-20 09:00",
      status: "활성",
    },
    {
      id: "oper01",
      name: "박운영",
      role: "운영자",
      email: "operator@company.com",
      lastLogin: "2024-06-19 14:30",
      status: "활성",
    },
    {
      id: "marketer01",
      name: "최마케터",
      role: "마케터",
      email: "marketer@company.com",
      lastLogin: "2024-06-18 10:15",
      status: "비활성",
    },
  ]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleEditUser = (userId: string) => {
    console.log("Edit user:", userId);
    // 사용자 편집 로직
  };

  const handleManageUser = (userId: string) => {
    console.log("Manage user:", userId);
    // 사용자 관리 로직 (권한 변경, 상태 변경 등)
  };

  const handleAddUser = () => {
    console.log("Add new user");
    // 새 사용자 추가 로직
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "활성":
        return "status-active";
      case "대기중":
        return "status-pending";
      case "비활성":
        return "status-inactive";
      default:
        return "status-inactive";
    }
  };

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-dashboard">
        <div className="admin-main">
          <div className="admin-header">
            <h1>사용자 관리 (관리자 전용)</h1>
            <div className="admin-actions">
              <button className="btn-primary" onClick={handleAddUser}>
                새 사용자 추가
              </button>
            </div>
          </div>

          {/* User List Section */}
          <div className="user-management-section">
            <div className="section-header">
              <h2>사용자 목록</h2>
              <p>시스템 사용자 계정 및 권한을 관리합니다.</p>
            </div>

            <div className="user-table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이름</th>
                    <th>권한</th>
                    <th>이메일</th>
                    <th>최근 로그인</th>
                    <th>상태</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>
                        <span
                          className={`role-badge ${
                            user.role === "최고관리자"
                              ? "role-super-admin"
                              : user.role === "운영자"
                              ? "role-operator"
                              : "role-marketer"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.lastLogin}</td>
                      <td>
                        <span
                          className={`status-badge ${getStatusBadge(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-action btn-edit"
                            onClick={() => handleEditUser(user.id)}
                            title="수정"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-action btn-manage"
                            onClick={() => handleManageUser(user.id)}
                            title="관리"
                          >
                            🛡️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p>
                * 이 페이지는 RBAC(역할 기반 접근 제어) 예시를 위해 관리자
                권한이 있는 사용자에게만 표시됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
