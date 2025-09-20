"use client";

import { useState, useEffect } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Pagination from "@/components/Pagination";

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

// Daum Postcode global typings (minimal)
type DaumPostcodeData = {
  roadAddress?: string;
  jibunAddress?: string;
  zonecode?: string;
};

type DaumPostcodeCtor = new (options: { oncomplete: (data: DaumPostcodeData) => void }) => {
  open: () => void;
};

type DaumWindow = Window & {
  daum?: {
    Postcode?: DaumPostcodeCtor;
  };
};

export default function MemberApprovalPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 검색/필터 상태
  const [selectedCompany, setSelectedCompany] = useState<string>("전체");
  const [selectedStatus, setSelectedStatus] = useState<string>("전체");
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;
  
  // 상세보기 모달 상태
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editedCompanyInfo, setEditedCompanyInfo] = useState<User['company_info'] | null>(null);
  const [editedTaxInfo, setEditedTaxInfo] = useState<User['tax_invoice_info'] | undefined>({});

  // 유효성 검사 유틸
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const normalizeBizNumber = (input: string) => input.replace(/[^0-9]/g, "");

  const formatBizNumber = (digitsOnly: string) => {
    if (digitsOnly.length !== 10) return digitsOnly;
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 5)}-${digitsOnly.slice(5)}`;
  };

  // 사업자등록번호 검증 (검증 알고리즘 적용)
  const validateBizNumber = (raw: string) => {
    const s = normalizeBizNumber(raw);
    if (s.length !== 10) return false;
    const multipliers = [1, 3, 7, 1, 3, 7, 1, 3, 5];
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(s[i]) * multipliers[i];
    }
    sum += Math.floor((Number(s[8]) * 5) / 10);
    const check = (10 - (sum % 10)) % 10;
    return check === Number(s[9]);
  };

  // 주소 검색 (다음 우편번호)
  const loadDaumPostcodeScript = () => {
    return new Promise<void>((resolve, reject) => {
      if (typeof window !== 'undefined') {
        const w = window as DaumWindow;
        if (w.daum?.Postcode) {
          resolve();
          return;
        }
      }
      const existing = document.querySelector("script[data-daum-postcode]") as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('주소 스크립트 로드 실패')));
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
      script.async = true;
      script.setAttribute('data-daum-postcode', 'true');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('주소 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  };

  const handleSearchAddress = async () => {
    try {
      await loadDaumPostcodeScript();
      const w = window as DaumWindow;
      const Postcode = w.daum?.Postcode;
      if (!Postcode) throw new Error('주소 스크립트 로드 실패');
      new Postcode({
        oncomplete: (data: DaumPostcodeData) => {
          const roadAddr = data.roadAddress; // 도로명 주소
          const jibunAddr = data.jibunAddress; // 지번 주소
          const zonecode = data.zonecode; // 우편번호
          const address = roadAddr || jibunAddr || '';
          if (address) {
            setEditedCompanyInfo(prev => ({ ...(prev || { companyName: '' }), companyAddress: `(${zonecode}) ${address}` }));
          }
        }
      }).open();
    } catch (e) {
      console.error(e);
      alert('주소 검색 스크립트를 불러오지 못했습니다.');
    }
  };

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
    setCurrentPage(1); // 필터 변경 시 첫 페이지로 리셋
  }, [users, selectedCompany, selectedStatus]);

  // 페이지네이션 데이터
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageUsers = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };


  const handleDetailClick = (user: User) => {
    setSelectedUser(user);
    setRejectionReason(user.rejectionReason || "");
    setEditMode(false);
    setEditedCompanyInfo(user.company_info ? { ...user.company_info } : { companyName: "" });
    setEditedTaxInfo(user.tax_invoice_info ? { ...user.tax_invoice_info } : {});
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
    setRejectionReason("");
    setEditMode(false);
    setEditedCompanyInfo(null);
    setEditedTaxInfo({});
  };

  const handleSaveCompanyEdits = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("인증 토큰이 없습니다.");
        return;
      }

      // 유효성 검증
      if (editedCompanyInfo?.businessNumber) {
        const bn = editedCompanyInfo.businessNumber.trim();
        if (!validateBizNumber(bn)) {
          alert('유효하지 않은 사업자등록번호입니다. (예: 123-45-67890)');
          return;
        }
      }
      if (editedTaxInfo?.email) {
        const em = (editedTaxInfo.email || '').trim();
        if (em && !validateEmail(em)) {
          alert('유효하지 않은 이메일 형식입니다.');
          return;
        }
      }

      // 포맷 정규화 (사업자번호 하이픈)
      const normalizedCompanyInfo = editedCompanyInfo ? {
        ...editedCompanyInfo,
        businessNumber: editedCompanyInfo.businessNumber
          ? formatBizNumber(normalizeBizNumber(editedCompanyInfo.businessNumber))
          : editedCompanyInfo.businessNumber,
      } : undefined;

      const payload: Record<string, unknown> = {
        userId: selectedUser.id,
      };

      if (normalizedCompanyInfo) payload.companyInfo = normalizedCompanyInfo;
      if (editedTaxInfo) payload.taxInvoiceInfo = editedTaxInfo;

      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || "기업 정보 저장에 실패했습니다.");
      }

      // 로컬 상태 업데이트
      setUsers(prev => prev.map(u =>
        u.id === selectedUser.id
          ? {
              ...u,
              company_info: normalizedCompanyInfo || u.company_info,
              tax_invoice_info: editedTaxInfo || u.tax_invoice_info,
            }
          : u
      ));

      // 선택 사용자도 업데이트
      setSelectedUser(prev => prev ? {
        ...prev,
        company_info: normalizedCompanyInfo || prev.company_info,
        tax_invoice_info: editedTaxInfo || prev.tax_invoice_info,
      } : prev);

      setEditMode(false);
      alert("기업 정보가 저장되었습니다.");
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : "기업 정보 저장 중 오류가 발생했습니다.");
    }
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


  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="flex min-h-[calc(100vh-64px)] mt-16 bg-gray-50 text-gray-900">
        <div className="flex-1 ml-[250px] p-6 bg-gray-50 transition-all duration-300 ease-in-out">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">기업정보 관리</h1>
            <div className="flex gap-3">
              <button className="bg-amber-500 text-white border-none px-6 py-3 rounded-lg font-medium cursor-pointer transition-colors duration-200 hover:bg-amber-600">
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
          <div className="mb-5 p-5 bg-gray-50 rounded-lg border border-gray-300">
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">기업명:</label>
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="전체">전체</option>
                  {availableCompanies.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">검수상태:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="전체">전체</option>
                  <option value="등록">등록 (대기)</option>
                  <option value="승인">승인</option>
                  <option value="반려">반려</option>
                </select>
              </div>
              
              <div className="ml-auto text-sm text-gray-600">
                {filteredUsers.length}건 / 전체 {users.length}건
              </div>
            </div>
          </div>

          {/* Member Approval Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">회원 목록</h2>
              <p className="text-gray-600 text-sm leading-relaxed">일반회원의 승인 상태를 관리합니다.</p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 mb-4">
              <table className="w-full border-collapse bg-white table-fixed">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-[20%] px-3 py-4 text-left font-semibold text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap">회사명</th>
                    <th className="w-[12%] px-3 py-4 text-left font-semibold text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap">이름</th>
                    <th className="w-[8%] px-3 py-4 text-left font-semibold text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap">사용자 ID</th>
                    <th className="w-[22%] px-3 py-4 text-left font-semibold text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap">이메일</th>
                    <th className="w-[12%] px-3 py-4 text-left font-semibold text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap">승인일자</th>
                    <th className="w-[10%] px-3 py-4 text-left font-semibold text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap">승인자</th>
                    <th className="w-[8%] px-3 py-4 text-left font-semibold text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap">상태</th>
                    <th className="w-[8%] px-3 py-4 text-left font-semibold text-sm text-gray-900 border-b border-gray-200 whitespace-nowrap">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-5"
                      >
                        로딩 중...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-center py-5"
                      >
                        조건에 맞는 회원이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    currentPageUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                        <td className="px-3 py-4 text-sm text-gray-900 border-b border-gray-50 align-middle overflow-hidden text-ellipsis">{user.company_info?.companyName || "-"}</td>
                        <td className="px-3 py-4 text-sm text-gray-900 border-b border-gray-50 align-middle overflow-hidden text-ellipsis">{user.name}</td>
                        <td className="px-3 py-4 text-sm text-gray-900 border-b border-gray-50 align-middle overflow-hidden text-ellipsis">{user.id}</td>
                        <td className="px-3 py-4 text-sm text-gray-900 border-b border-gray-50 align-middle overflow-hidden text-ellipsis">{user.email}</td>
                        <td className="px-3 py-4 text-sm text-gray-900 border-b border-gray-50 align-middle overflow-hidden text-ellipsis">{user.approvalDate || "-"}</td>
                        <td className="px-3 py-4 text-sm text-gray-900 border-b border-gray-50 align-middle overflow-hidden text-ellipsis">{user.approver || "-"}</td>
                        <td className="px-3 py-4 text-sm text-gray-900 border-b border-gray-50 align-middle overflow-hidden text-ellipsis">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${
                              user.approval_status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              user.approval_status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                              user.approval_status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {getStatusText(user.approval_status)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-sm text-gray-900 border-b border-gray-50 align-middle overflow-hidden text-ellipsis">
                          <button
                            className="bg-blue-600 text-white border-none px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 whitespace-nowrap w-full max-w-[90px]"
                            onClick={() => handleDetailClick(user)}
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

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredUsers.length}
                  onPageChange={handlePageChange}
                  className="member-approval-pagination"
                />
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-600 italic">
                * 일반회원 승인은 관리자 권한이 필요합니다. 승인 후 해당 회원은
                시스템을 이용할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 상세보기 모달 */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]" onClick={closeDetailModal}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-[90%] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* 모달 헤더 */}
            <div className="px-6 py-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-xl font-semibold text-gray-900">사업자 정보 상세</h2>
              <button
                onClick={closeDetailModal}
                className="bg-transparent border-none text-2xl font-bold text-gray-600 cursor-pointer p-0 w-8 h-8 flex items-center justify-center rounded transition-all duration-200 hover:text-gray-900 hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            {/* 모달 내용 */}
            <div className="p-6">
              {/* 신청자 정보 */}
              <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
                <h3 className="text-base font-semibold text-gray-900 mb-4">신청자 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
                    <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.name}</div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">이메일</label>
                    <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.email}</div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">연락처</label>
                    <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{formatPhoneNumber(selectedUser.phone_number || "")}</div>
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">가입일</label>
                    <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{formatDate(selectedUser.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* 사업자 정보 */}
              <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-blue-50">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">사업자 정보</h3>
                  <div className="flex gap-2 items-center">
                    {!editMode ? (
                      <button className="bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-md text-xs cursor-pointer hover:bg-gray-50" onClick={() => setEditMode(true)}>정보 수정</button>
                    ) : (
                      <>
                        <button className="bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-md text-xs cursor-pointer hover:bg-gray-50" onClick={() => { setEditMode(false); setEditedCompanyInfo(selectedUser?.company_info || { companyName: "" }); setEditedTaxInfo(selectedUser?.tax_invoice_info || {}); }}>취소</button>
                        <button className="bg-blue-600 text-white border-none px-3 py-2 rounded-md text-xs cursor-pointer hover:bg-blue-700" onClick={handleSaveCompanyEdits}>저장</button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">기업유형</label>
                    {editMode ? (
                      <select
                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500"
                        value={editedCompanyInfo?.businessType || "corporate"}
                        onChange={(e) => setEditedCompanyInfo(prev => ({ ...(prev || { companyName: "" }), businessType: e.target.value }))}
                      >
                        <option value="individual">개인사업자</option>
                        <option value="corporate">법인사업자</option>
                      </select>
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">
                        {selectedUser.company_info?.businessType === "individual" ? "개인사업자" : "법인사업자"}
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">사업자명</label>
                    {editMode ? (
                      <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500" value={editedCompanyInfo?.companyName || ""} onChange={(e) => setEditedCompanyInfo(prev => ({ ...(prev || { companyName: "" }), companyName: e.target.value }))} />
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.company_info?.companyName || "-"}</div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">대표자명</label>
                    {editMode ? (
                      <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500" value={editedCompanyInfo?.ceoName || ""} onChange={(e) => setEditedCompanyInfo(prev => ({ ...(prev || { companyName: "" }), ceoName: e.target.value }))} />
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.company_info?.ceoName || "-"}</div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">사업자등록번호</label>
                    {editMode ? (
                      <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500" value={editedCompanyInfo?.businessNumber || ""} onChange={(e) => setEditedCompanyInfo(prev => ({ ...(prev || { companyName: "" }), businessNumber: e.target.value }))} />
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.company_info?.businessNumber || "-"}</div>
                    )}
                  </div>
                   <div className="mb-3 col-span-full">
                     <label className="block text-xs font-medium text-gray-600 mb-1">주소</label>
                     {editMode ? (
                       <div className="flex gap-2">
                         <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500 flex-1" value={editedCompanyInfo?.companyAddress || ""} onChange={(e) => setEditedCompanyInfo(prev => ({ ...(prev || { companyName: "" }), companyAddress: e.target.value }))} />
                         <button type="button" className="bg-white text-gray-700 border border-gray-300 px-3 py-2 rounded-md text-xs cursor-pointer hover:bg-gray-50" onClick={handleSearchAddress}>주소검색</button>
                       </div>
                     ) : (
                       <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.company_info?.companyAddress || "-"}</div>
                     )}
                   </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">업태</label>
                    {editMode ? (
                      <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500" value={editedCompanyInfo?.businessCategory || ""} onChange={(e) => setEditedCompanyInfo(prev => ({ ...(prev || { companyName: "" }), businessCategory: e.target.value }))} />
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.company_info?.businessCategory || "-"}</div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">업종</label>
                    {editMode ? (
                      <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500" value={editedCompanyInfo?.businessType2 || ""} onChange={(e) => setEditedCompanyInfo(prev => ({ ...(prev || { companyName: "" }), businessType2: e.target.value }))} />
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.company_info?.businessType2 || "-"}</div>
                    )}
                  </div>
                  <div className="mb-3 col-span-full">
                    <label className="block text-xs font-medium text-gray-600 mb-1">홈페이지</label>
                    {editMode ? (
                      <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500" value={editedCompanyInfo?.homepage || ""} onChange={(e) => setEditedCompanyInfo(prev => ({ ...(prev || { companyName: "" }), homepage: e.target.value }))} />
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.company_info?.homepage || "-"}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 세금계산서 담당자 정보 */}
              <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-green-50">
                <h3 className="text-base font-semibold text-gray-900 mb-4">세금계산서 담당자 정보</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">담당자명</label>
                    {editMode ? (
                      <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500" value={editedTaxInfo?.manager || ""} onChange={(e) => setEditedTaxInfo(prev => ({ ...(prev || {}), manager: e.target.value }))} />
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.tax_invoice_info?.manager || "-"}</div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">연락처</label>
                    {editMode ? (
                      <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500" value={editedTaxInfo?.contact || ""} onChange={(e) => setEditedTaxInfo(prev => ({ ...(prev || {}), contact: e.target.value }))} />
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.tax_invoice_info?.contact || "-"}</div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">이메일</label>
                    {editMode ? (
                      <input className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-blue-500" value={editedTaxInfo?.email || ""} onChange={(e) => setEditedTaxInfo(prev => ({ ...(prev || {}), email: e.target.value }))} />
                    ) : (
                      <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">{selectedUser.tax_invoice_info?.email || "-"}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 첨부 문서 */}
              <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-amber-50">
                <h3 className="text-base font-semibold text-gray-900 mb-4">첨부 문서</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div className="mb-3 col-span-full">
                    {selectedUser.documents && renderDocuments(selectedUser.documents)}
                  </div>
                </div>
              </div>

              {/* 반려사유 (반려 상태인 경우에만 표시) */}
              {selectedUser.approval_status === "REJECTED" && (
                <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-red-50">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">반려사유</h3>
                  <div className="mb-3 col-span-full">
                    <div className="text-sm text-gray-900 bg-white px-3 py-2 border border-gray-200 rounded min-h-[20px]">
                      {selectedUser.rejectionReason || "반려사유가 기록되지 않았습니다."}
                    </div>
                  </div>
                </div>
              )}

              {/* 승인/반려 액션 */}
              <div className="mb-6 p-4 rounded-lg border-2 border-gray-300 bg-gray-50 flex flex-col">
                <h3 className="text-base font-semibold text-gray-900 mb-4">관리자 액션</h3>
                <div className="flex flex-col gap-6 w-full">
                  {/* 현재 상태 표시 */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">현재 상태</label>
                    <div className="flex items-center w-full px-3 py-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium border whitespace-nowrap ${
                        selectedUser.approval_status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        selectedUser.approval_status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                        selectedUser.approval_status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {getStatusText(selectedUser.approval_status)}
                      </span>
                    </div>
                  </div>

                  {/* 반려사유 입력 */}
                  <div className="flex flex-col gap-3 w-full">
                    <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="rejection-reason">반려사유 <span className="text-red-500 text-xs">*</span></label>
                    <textarea
                      id="rejection-reason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-200 rounded text-sm resize-vertical min-h-[80px] focus:outline-none focus:border-blue-500"
                      rows={4}
                      placeholder="반려 시 반드시 사유를 입력해주세요..."
                    />
                    <small className="text-xs text-gray-600 italic mt-1">승인 처리 시에는 반려사유가 필요하지 않습니다.</small>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="flex flex-col gap-3 w-full">
                    <label className="block text-xs font-medium text-gray-600 mb-1">액션</label>
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex gap-3 w-full">
                        <button
                          onClick={() => {
                            handleStatusChangeWithReason(selectedUser.id, "APPROVED");
                            closeDetailModal();
                          }}
                          disabled={selectedUser.approval_status === "APPROVED"}
                          className={`flex items-center justify-center gap-2 px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex-1 relative ${
                            selectedUser.approval_status === "APPROVED"
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none transform-none"
                              : "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md hover:from-green-600 hover:to-green-700 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-200"
                          }`}
                        >
                          <span className="text-base font-bold">✓</span>
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
                          className={`flex items-center justify-center gap-2 px-6 py-3 border-none rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 flex-1 relative ${
                            selectedUser.approval_status === "REJECTED"
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed shadow-none transform-none"
                              : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:from-red-600 hover:to-red-700 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-200"
                          }`}
                        >
                          <span className="text-base font-bold">✕</span>
                          반려
                        </button>
                      </div>
                      <div className="flex justify-center w-full">
                        <button
                          onClick={closeDetailModal}
                          className="bg-gray-600 text-white border border-gray-600 px-6 py-3 rounded-lg text-sm font-semibold cursor-pointer transition-all duration-200 hover:bg-gray-700 hover:border-gray-700 hover:-translate-y-0.5"
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
