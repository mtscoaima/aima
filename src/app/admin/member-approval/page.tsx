"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import "./styles.css";

interface DocumentInfo {
  fileName: string;
  fileSize?: number;
  fileType?: string;
  fileData?: string; // base64 데이터
  fileUrl?: string; // data URL 형태
  uploadedAt: string;
  status?: string;
}

// IE/Edge 브라우저 호환성을 위한 Navigator 인터페이스 확장
interface ExtendedNavigator extends Navigator {
  msSaveOrOpenBlob?: (blob: Blob, fileName: string) => void;
}

interface UserDocuments {
  businessRegistration?: DocumentInfo;
  employmentCertificate?: DocumentInfo;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  company_info: {
    companyName: string;
    ceoName?: string;
    companyAddress?: string;
    businessType?: string;
    businessNumber?: string;
    businessCategory?: string;
    businessType2?: string;
    homepage?: string;
  };
  tax_invoice_info?: {
    manager?: string;
    contact?: string;
    email?: string;
  };
  created_at: string;
  documents: UserDocuments;
  approval_status: string;
  approval_log?: {
    changed_at?: string;
    changed_by?: string;
    rejection_reason?: string;
  };
  representativeName?: string;
  companyAddress?: string;
  approvalDate?: string;
  approver?: string;
  rejectionReason?: string;
}

export default function MemberApprovalPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // 검색/필터 상태
  const [selectedCompany, setSelectedCompany] = useState<string>("전체");
  const [selectedStatus, setSelectedStatus] = useState<string>("전체");
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  
  // 상세보기 모달 상태
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Supabase에서 USER 역할을 가진 회원 정보 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const response = await fetch("/api/admin/users", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 403) {
            throw new Error(errorData.message || "관리자 권한이 필요합니다.");
          }
          if (response.status === 401) {
            throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
          }
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || "사용자 조회에 실패했습니다.");
        }

        // 데이터 타입 변환 및 처리
        const processedUsers: User[] = (result.users || []).map(
          (user: Record<string, unknown>) => ({
            id: (user.id as number).toString(),
            name: (user.name as string) || "",
            email: (user.email as string) || "",
            phone_number: (user.phone_number as string) || "",
            company_info: (user.company_info as User['company_info']) || { companyName: "" },
            tax_invoice_info: (user.tax_invoice_info as User['tax_invoice_info']) || {},
            created_at: (user.created_at as string) || new Date().toISOString(),
            documents: (user.documents as UserDocuments) || {},
            approval_status: (user.approval_status as string) || "PENDING",
            approval_log: (user.approval_log as User['approval_log']) || {},
            representativeName: (user.representativeName as string) || "",
            companyAddress: (user.companyAddress as string) || "",
            approvalDate: (user.approvalDate as string) || "",
            approver: (user.approver as string) || "",
            rejectionReason: (user.rejectionReason as string) || "",
          })
        );

        setUsers(processedUsers);
        setFilteredUsers(processedUsers);
        
        // 회사명 목록 추출 (중복 제거)
        const companies = Array.from(
          new Set(
            processedUsers
              .map(user => user.company_info?.companyName)
              .filter(name => name && name.trim() !== "")
          )
        );
        setAvailableCompanies(companies);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "회원 정보를 불러오는 중 오류가 발생했습니다.";
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // 필터링 로직
  useEffect(() => {
    let filtered = [...users];

    // 회사명 필터링
    if (selectedCompany !== "전체") {
      filtered = filtered.filter(
        user => user.company_info?.companyName === selectedCompany
      );
    }

    // 검수상태 필터링
    if (selectedStatus !== "전체") {
      if (selectedStatus === "등록") {
        filtered = filtered.filter(user => user.approval_status === "PENDING");
      } else if (selectedStatus === "승인") {
        filtered = filtered.filter(user => user.approval_status === "APPROVED");
      } else if (selectedStatus === "반려") {
        filtered = filtered.filter(user => user.approval_status === "REJECTED");
      }
    }

    setFilteredUsers(filtered);
  }, [users, selectedCompany, selectedStatus]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleQuickStatusChange = (userId: string) => {
    setEditingUserId(editingUserId === userId ? null : userId);
  };

  const handleDetailClick = (user: User) => {
    setSelectedUser(user);
    setRejectionReason(user.rejectionReason || "");
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
    setRejectionReason("");
  };

  const handleStatusChangeWithReason = async (userId: string, newStatus: string) => {
    const requestData: Record<string, unknown> = {
      userId,
      approval_status: newStatus,
    };

    // 반려 시 반려사유 추가
    if (newStatus === "REJECTED" && rejectionReason.trim()) {
      requestData.rejection_reason = rejectionReason.trim();
    }

    return handleStatusChange(userId, newStatus, requestData);
  };

  const handleStatusChange = async (userId: string, newStatus: string, customData?: Record<string, unknown>) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      // 현재 사용자 정보 가져오기 (SMS 전송을 위해)
      const currentUser = users.find((user) => user.id === userId);
      if (!currentUser) {
        throw new Error("사용자 정보를 찾을 수 없습니다.");
      }

      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customData || {
          userId,
          approval_status: newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 403) {
          throw new Error(errorData.message || "관리자 권한이 필요합니다.");
        }
        if (response.status === 401) {
          throw new Error("로그인이 만료되었습니다. 다시 로그인해주세요.");
        }
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "상태 업데이트에 실패했습니다.");
      }

      // 로컬 상태 업데이트
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, approval_status: newStatus } : user
        )
      );

      // 승인 시 SMS 알림 전송
      if (newStatus === "APPROVED") {
        try {
          const notificationResponse = await fetch(
            "/api/admin/send-approval-notification",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                phoneNumber: currentUser.phone_number,
                userName: currentUser.name,
                status: newStatus,
              }),
            }
          );

          if (notificationResponse.ok) {
          } else {
            const notificationError = await notificationResponse
              .json()
              .catch(() => ({}));
            console.warn("SMS 알림 전송 실패:", notificationError.message);
            // SMS 전송 실패는 전체 프로세스를 중단하지 않음
          }
        } catch (smsError) {
          console.warn("SMS 알림 전송 중 오류 발생:", smsError);
          // SMS 전송 실패는 전체 프로세스를 중단하지 않음
        }
      }

      // 드롭다운 닫기
      setEditingUserId(null);

      // 성공 메시지 표시
      const statusText =
        newStatus === "APPROVED"
          ? "승인"
          : newStatus === "REJECTED"
          ? "거부"
          : "변경";
      alert(`${currentUser.name}님의 상태가 ${statusText}되었습니다.`);
    } catch (error) {
      console.error("Error updating user status:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "상태 변경 중 오류가 발생했습니다.";
      alert(errorMessage);
    }
  };

  const handleViewDocument = (docInfo: DocumentInfo) => {
    try {
      // base64 데이터가 있는 경우 Blob으로 변환
      if (docInfo.fileData && docInfo.fileType) {
        try {
          // base64 데이터를 Blob으로 변환
          const base64Data = docInfo.fileData;
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: docInfo.fileType });

          // Blob URL 생성
          const blobUrl = URL.createObjectURL(blob);

          // 새 창에서 파일 열기
          const newWindow = window.open(blobUrl, "_blank");

          if (!newWindow) {
            alert("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");
          } else {
            // 메모리 정리를 위해 일정 시간 후 Blob URL 해제
            setTimeout(() => {
              URL.revokeObjectURL(blobUrl);
            }, 10000); // 10초 후 해제
          }

          return;
        } catch (blobError) {
          console.error("Blob 생성 오류:", blobError);
          // Blob 생성 실패 시 다운로드로 대체
          downloadFile(docInfo).catch(console.error);
          return;
        }
      }

      // fileUrl이 있는 경우 (기존 로직)
      if (docInfo.fileUrl && !docInfo.fileUrl.startsWith("data:")) {
        const newWindow = window.open(docInfo.fileUrl, "_blank");

        if (!newWindow) {
          alert("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");
        }
        return;
      }

      // 다른 방법으로 열 수 없는 경우 다운로드
      alert("파일을 열 수 없습니다. 다운로드를 시도해보세요.");
    } catch (error) {
      console.error("파일 열기 오류:", error);
      alert("파일을 여는 중 오류가 발생했습니다.");
    }
  };

  // 파일 다운로드 함수
  const downloadFile = async (docInfo: DocumentInfo) => {
    try {
      if (!docInfo.fileData && !docInfo.fileUrl) {
        alert("다운로드할 파일 데이터가 없습니다.");
        return;
      }

      let blob: Blob;
      let fileName = docInfo.fileName || "document";

      // 파일명 안전하게 처리
      fileName = fileName.replace(/[^\w\s.-]/g, "").trim();
      if (!fileName) {
        fileName = "document";
      }

      if (docInfo.fileData && docInfo.fileType) {
        try {
          // base64 데이터에서 data URL prefix 제거
          let base64Data = docInfo.fileData;
          if (base64Data.includes(",")) {
            base64Data = base64Data.split(",")[1];
          }

          // base64를 Blob으로 변환
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);

          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: docInfo.fileType });
        } catch (base64Error) {
          console.error("Base64 변환 오류:", base64Error);
          alert("파일 데이터를 처리하는 중 오류가 발생했습니다.");
          return;
        }
      } else if (docInfo.fileUrl) {
        // fileUrl에서 직접 다운로드 시도
        try {
          const response = await fetch(docInfo.fileUrl);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          blob = await response.blob();
        } catch (fetchError) {
          console.error("파일 URL 다운로드 오류:", fetchError);
          alert("파일을 다운로드할 수 없습니다.");
          return;
        }
      } else {
        alert("다운로드할 파일 데이터가 없습니다.");
        return;
      }

      // 다운로드 실행
      try {
        // 브라우저별 호환성을 위한 다운로드 방법
        const extendedNavigator = window.navigator as ExtendedNavigator;
        if (extendedNavigator && extendedNavigator.msSaveOrOpenBlob) {
          // IE/Edge
          extendedNavigator.msSaveOrOpenBlob(blob, fileName);
        } else {
          // 모던 브라우저
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          link.style.display = "none";
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // 메모리 정리
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        }
        
      } catch (downloadError) {
        console.error("다운로드 실행 오류:", downloadError);
        alert("파일 다운로드 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("파일 다운로드 오류:", error);
      alert("파일 다운로드 중 예상치 못한 오류가 발생했습니다.");
    }
  };

  const renderDocuments = (documents: UserDocuments | undefined) => {
    if (!documents) {
      return <span className="no-documents">문서 없음</span>;
    }

    const docTypes = {
      businessRegistration: "사업자등록증",
      employmentCertificate: "재직증명서",
    };

    const availableDocs = [];

    // 사업자등록증 확인
    if (
      documents.businessRegistration &&
      documents.businessRegistration.fileName
    ) {
      availableDocs.push({
        type: "businessRegistration",
        info: documents.businessRegistration,
        label: docTypes.businessRegistration,
      });
    }

    // 재직증명서 확인
    if (
      documents.employmentCertificate &&
      documents.employmentCertificate.fileName
    ) {
      availableDocs.push({
        type: "employmentCertificate",
        info: documents.employmentCertificate,
        label: docTypes.employmentCertificate,
      });
    }

    if (availableDocs.length === 0) {
      return <span className="no-documents">문서 없음</span>;
    }

    return (
      <div className="documents-container">
        {availableDocs.map(({ type, info, label }) => (
          <div key={type} className="document-item">
            <button
              className="document-link"
              onClick={() => handleViewDocument(info)}
              title={`${label} 보기`}
            >
              📄 {label}
            </button>
            <button
              className="document-download"
              onClick={() => downloadFile(info).catch(console.error)}
              title={`${label} 다운로드`}
            >
              💾
            </button>
          </div>
        ))}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return "-";

    // 숫자만 추출
    const numbers = phoneNumber.replace(/\D/g, "");

    // 11자리 번호 (010-0000-0000)
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }
    // 10자리 번호 (000-000-0000)
    else if (numbers.length === 10) {
      return numbers.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
    }
    // 기타 경우 원본 반환
    else {
      return phoneNumber;
    }
  };

  // 영어 상태를 한글로 변환
  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "비활성";
      case "APPROVED":
        return "활성";
      case "REJECTED":
        return "비활성";
      default:
        return "비활성";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return "status-pending";
      case "APPROVED":
        return "status-approved";
      case "REJECTED":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-dashboard">
        <div className="admin-main">
          <div className="admin-header">
            <h1>기업정보 관리</h1>
            <div className="admin-actions">
              <button className="btn-secondary">
                승인 대기:{" "}
                {
                  users.filter((user) => user.approval_status === "PENDING")
                    .length
                }
                건
              </button>
            </div>
          </div>

          {/* 검색/필터 섹션 */}
          <div className="search-filter-section" style={{ marginBottom: "20px", padding: "20px", backgroundColor: "#f8f9fa", borderRadius: "8px", border: "1px solid #dee2e6" }}>
            <div className="filter-row" style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
              <div className="filter-group">
                <label style={{ fontSize: "14px", fontWeight: "500", marginRight: "8px" }}>기업명:</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="전체">전체</option>
                  {availableCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label style={{ fontSize: "14px", fontWeight: "500", marginRight: "8px" }}>검수상태:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  style={{
                    padding: "6px 12px",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    fontSize: "14px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="전체">전체</option>
                  <option value="등록">등록 (대기)</option>
                  <option value="승인">승인</option>
                  <option value="반려">반려</option>
                </select>
              </div>
              
              <div className="filter-results" style={{ marginLeft: "auto", fontSize: "14px", color: "#6c757d" }}>
                {filteredUsers.length}건 / 전체 {users.length}건
              </div>
            </div>
          </div>

          {/* Member Approval Section */}
          <div className="user-management-section">
            <div className="section-header">
              <h2>회원 목록</h2>
              <p>일반회원의 승인 상태를 관리합니다.</p>
            </div>

            <div className="user-table-container">
              <table className="user-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>회사명</th>
                    <th>승인일자</th>
                    <th>승인자</th>
                    <th>상태</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        로딩 중...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        조건에 맞는 회원이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.company_info?.companyName || "-"}</td>
                        <td>{user.approvalDate || "-"}</td>
                        <td>{user.approver || "-"}</td>
                        <td>
                          <span
                            className={`status-badge ${getStatusBadge(
                              user.approval_status
                            )}`}
                          >
                            {getStatusText(user.approval_status)}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-edit"
                            onClick={() => handleDetailClick(user)}
                            style={{ fontSize: "12px", padding: "4px 8px" }}
                          >
                            상세
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p>
                * 일반회원 승인은 관리자 권한이 필요합니다. 승인 후 해당 회원은
                시스템을 이용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 상세보기 모달 */}
      {showDetailModal && selectedUser && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="modal-header">
              <h2>사업자 정보 상세</h2>
              <button
                onClick={closeDetailModal}
                className="modal-close"
              >
                ×
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="modal-body">
              {/* 신청자 정보 */}
              <div className="modal-section applicant-info">
                <h3>신청자 정보</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label>이름</label>
                    <div className="value">{selectedUser.name}</div>
                  </div>
                  <div className="modal-field">
                    <label>이메일</label>
                    <div className="value">{selectedUser.email}</div>
                  </div>
                  <div className="modal-field">
                    <label>연락처</label>
                    <div className="value">{formatPhoneNumber(selectedUser.phone_number)}</div>
                  </div>
                  <div className="modal-field">
                    <label>가입일</label>
                    <div className="value">{formatDate(selectedUser.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* 사업자 정보 */}
              <div className="modal-section business-info">
                <h3>사업자 정보</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label>기업유형</label>
                    <div className="value">
                      {selectedUser.company_info?.businessType === "individual" ? "개인사업자" : "법인사업자"}
                    </div>
                  </div>
                  <div className="modal-field">
                    <label>사업자명</label>
                    <div className="value">{selectedUser.company_info?.companyName || "-"}</div>
                  </div>
                  <div className="modal-field">
                    <label>대표자명</label>
                    <div className="value">{selectedUser.company_info?.ceoName || "-"}</div>
                  </div>
                  <div className="modal-field">
                    <label>사업자등록번호</label>
                    <div className="value">{selectedUser.company_info?.businessNumber || "-"}</div>
                  </div>
                  <div className="modal-field full-width">
                    <label>주소</label>
                    <div className="value">{selectedUser.company_info?.companyAddress || "-"}</div>
                  </div>
                  <div className="modal-field">
                    <label>업태</label>
                    <div className="value">{selectedUser.company_info?.businessCategory || "-"}</div>
                  </div>
                  <div className="modal-field">
                    <label>업종</label>
                    <div className="value">{selectedUser.company_info?.businessType2 || "-"}</div>
                  </div>
                  <div className="modal-field full-width">
                    <label>홈페이지</label>
                    <div className="value">{selectedUser.company_info?.homepage || "-"}</div>
                  </div>
                </div>
              </div>

              {/* 세금계산서 담당자 정보 */}
              <div className="modal-section tax-info">
                <h3>세금계산서 담당자 정보</h3>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label>담당자명</label>
                    <div className="value">{selectedUser.tax_invoice_info?.manager || "-"}</div>
                  </div>
                  <div className="modal-field">
                    <label>연락처</label>
                    <div className="value">{selectedUser.tax_invoice_info?.contact || "-"}</div>
                  </div>
                  <div className="modal-field">
                    <label>이메일</label>
                    <div className="value">{selectedUser.tax_invoice_info?.email || "-"}</div>
                  </div>
                </div>
              </div>

              {/* 첨부 문서 */}
              <div className="modal-section documents-info">
                <h3>첨부 문서</h3>
                <div className="modal-grid">
                  <div className="modal-field full-width">
                    {selectedUser.documents && renderDocuments(selectedUser.documents)}
                  </div>
                </div>
              </div>

              {/* 반려사유 (반려 상태인 경우에만 표시) */}
              {selectedUser.approval_status === "REJECTED" && (
                <div className="modal-section rejection-info">
                  <h3>반려사유</h3>
                  <div className="modal-field full-width">
                    <div className="value">
                      {selectedUser.rejectionReason || "반려사유가 기록되지 않았습니다."}
                    </div>
                  </div>
                </div>
              )}

              {/* 승인/반려 액션 */}
              <div className="modal-section admin-actions">
                <h3>관리자 액션</h3>
                <div className="admin-action-container">
                  {/* 현재 상태 표시 */}
                  <div className="modal-field">
                    <label>현재 상태</label>
                    <div className="value">
                      <span className={`status-badge ${getStatusBadge(selectedUser.approval_status)}`}>
                        {getStatusText(selectedUser.approval_status)}
                      </span>
                    </div>
                  </div>

                  {/* 반려사유 입력 */}
                  <div className="admin-field-group">
                    <label className="admin-field-label" htmlFor="rejection-reason">반려사유 <span className="required">*</span></label>
                    <textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="modal-textarea"
                      rows={4}
                      placeholder="반려 시 반드시 사유를 입력해주세요..."
                    />
                    <small className="help-text">승인 처리 시에는 반려사유가 필요하지 않습니다.</small>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="admin-field-group">
                    <label className="admin-field-label">액션</label>
                    <div className="action-buttons-container">
                      <div className="primary-actions">
                        <button
                          onClick={() => {
                            handleStatusChangeWithReason(selectedUser.id, "APPROVED");
                            closeDetailModal();
                          }}
                          disabled={selectedUser.approval_status === "APPROVED"}
                          className={`action-btn approve-btn ${selectedUser.approval_status === "APPROVED" ? "disabled" : ""}`}
                        >
                          <span className="btn-icon">✓</span>
                          승인
                        </button>
                        <button
                          onClick={() => {
                            if (!rejectionReason.trim()) {
                              alert("반려사유를 입력해주세요.");
                              return;
                            }
                            handleStatusChangeWithReason(selectedUser.id, "REJECTED");
                            closeDetailModal();
                          }}
                          disabled={selectedUser.approval_status === "REJECTED"}
                          className={`action-btn reject-btn ${selectedUser.approval_status === "REJECTED" ? "disabled" : ""}`}
                        >
                          <span className="btn-icon">✕</span>
                          반려
                        </button>
                      </div>
                      <div className="secondary-actions">
                        <button
                          onClick={closeDetailModal}
                          className="action-btn close-btn"
                        >
                          닫기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
