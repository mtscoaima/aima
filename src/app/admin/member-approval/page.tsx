"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
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
  };
  created_at: string;
  documents: UserDocuments;
  approval_status: string;
}

export default function MemberApprovalPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

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
          (user: {
            id: number;
            name: string;
            email: string;
            phone_number: string;
            company_info: { companyName: string };
            created_at: string;
            documents: UserDocuments;
            approval_status: string;
          }) => ({
            id: user.id.toString(),
            name: user.name || "",
            email: user.email || "",
            phone_number: user.phone_number || "",
            company_info: user.company_info || { companyName: "" },
            created_at: user.created_at || new Date().toISOString(),
            documents: user.documents || {},
            approval_status: user.approval_status || "PENDING",
          })
        );

        setUsers(processedUsers);
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleEditClick = (userId: string) => {
    setEditingUserId(editingUserId === userId ? null : userId);
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
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
        body: JSON.stringify({
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
                    <th>ID</th>
                    <th>이름</th>
                    <th>이메일</th>
                    <th>연락처</th>
                    <th>회사명</th>
                    <th>가입일</th>
                    <th>문서</th>
                    <th>상태</th>
                    <th>상태 변경</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        로딩 중...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        style={{ textAlign: "center", padding: "20px" }}
                      >
                        등록된 회원이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{formatPhoneNumber(user.phone_number)}</td>
                        <td>{user.company_info?.companyName || "-"}</td>
                        <td>{formatDate(user.created_at)}</td>
                        <td>{renderDocuments(user.documents)}</td>
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
                          {editingUserId === user.id ? (
                            <select
                              className="status-dropdown"
                              value={user.approval_status}
                              onChange={(e) =>
                                handleStatusChange(user.id, e.target.value)
                              }
                              onBlur={() => setEditingUserId(null)}
                              autoFocus
                            >
                              <option value="PENDING">대기중</option>
                              <option value="APPROVED">승인됨</option>
                              <option value="REJECTED">거부됨</option>
                            </select>
                          ) : (
                            <button
                              className="btn-edit"
                              onClick={() => handleEditClick(user.id)}
                            >
                              수정
                            </button>
                          )}
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
    </AdminGuard>
  );
}
