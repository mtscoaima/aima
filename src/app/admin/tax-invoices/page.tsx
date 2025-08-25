"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import "./styles.css";

// 세금계산서 인터페이스
interface TaxInvoice {
  id: number;
  issueDate: string;
  businessNumber: string;
  companyName: string;
  supplyAmount: number;
  taxAmount: number;
  chargeAmount: number;
  status: "issued" | "cancelled";
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
}

// API 응답 인터페이스
interface ApiResponse {
  data: TaxInvoice[];
  pagination: {
    currentPage: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  filters: {
    startDate: string | null;
    endDate: string | null;
    businessNumber: string | null;
    companyName: string | null;
    status: string | null;
  };
}

// 세금계산서 수정 모달 컴포넌트
interface TaxInvoiceEditModalProps {
  taxInvoice: TaxInvoice;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedInvoice: Partial<TaxInvoice>) => void;
  isSubmitting: boolean;
}

function TaxInvoiceEditModal({
  taxInvoice,
  isOpen,
  onClose,
  onSave,
  isSubmitting,
}: TaxInvoiceEditModalProps) {
  const [formData, setFormData] = useState({
    issueDate: taxInvoice?.issueDate || "",
    businessNumber: taxInvoice?.businessNumber || "",
    companyName: taxInvoice?.companyName || "",
    supplyAmount: taxInvoice?.supplyAmount || 0,
    taxAmount: taxInvoice?.taxAmount || 0,
    chargeAmount: taxInvoice?.chargeAmount || 0,
    status: taxInvoice?.status || "issued",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 폼 데이터 초기화
  useEffect(() => {
    if (taxInvoice) {
      setFormData({
        issueDate: taxInvoice.issueDate || "",
        businessNumber: taxInvoice.businessNumber || "",
        companyName: taxInvoice.companyName || "",
        supplyAmount: taxInvoice.supplyAmount || 0,
        taxAmount: taxInvoice.taxAmount || 0,
        chargeAmount: taxInvoice.chargeAmount || 0,
        status: taxInvoice.status || "issued",
      });
      setErrors({});
    }
  }, [taxInvoice]);

  // 입력값 변경 핸들러
  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // 에러 메시지 클리어
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // 금액 필드들의 자동 계산
    if (field === "supplyAmount" || field === "taxAmount") {
      const supply =
        field === "supplyAmount" ? Number(value) : formData.supplyAmount;
      const tax = field === "taxAmount" ? Number(value) : formData.taxAmount;
      setFormData((prev) => ({ ...prev, chargeAmount: supply + tax }));
    }
  };

  // 폼 검증
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // 계산서 번호 검증 제거 (더 이상 사용하지 않음)

    if (!formData.issueDate) {
      newErrors.issueDate = "발행일은 필수입니다.";
    }

    if (!formData.businessNumber.trim()) {
      newErrors.businessNumber = "사업자번호는 필수입니다.";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "업체명은 필수입니다.";
    }

    if (formData.supplyAmount <= 0) {
      newErrors.supplyAmount = "공급가액은 0보다 커야 합니다.";
    }

    if (formData.taxAmount < 0) {
      newErrors.taxAmount = "세액은 0 이상이어야 합니다.";
    }

    if (formData.chargeAmount <= 0) {
      newErrors.chargeAmount = "총 금액은 0보다 커야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장 핸들러
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">세금계산서 수정</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* 계산서 번호 필드 제거 */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                발행일
              </label>
              <input
                type="date"
                value={formData.issueDate}
                onChange={(e) => handleInputChange("issueDate", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.issueDate
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={isSubmitting}
              />
              {errors.issueDate && (
                <p className="mt-1 text-sm text-red-600">{errors.issueDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                사업자번호
              </label>
              <input
                type="text"
                value={formData.businessNumber}
                onChange={(e) =>
                  handleInputChange("businessNumber", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.businessNumber
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={isSubmitting}
              />
              {errors.businessNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.businessNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                업체명
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) =>
                  handleInputChange("companyName", e.target.value)
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.companyName
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={isSubmitting}
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.companyName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange("status", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="issued">발행</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                공급가액
              </label>
              <input
                type="number"
                value={formData.supplyAmount}
                onChange={(e) =>
                  handleInputChange("supplyAmount", Number(e.target.value))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.supplyAmount
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={isSubmitting}
              />
              {errors.supplyAmount && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.supplyAmount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                세액
              </label>
              <input
                type="number"
                value={formData.taxAmount}
                onChange={(e) =>
                  handleInputChange("taxAmount", Number(e.target.value))
                }
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.taxAmount
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                disabled={isSubmitting}
              />
              {errors.taxAmount && (
                <p className="mt-1 text-sm text-red-600">{errors.taxAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                총 금액
              </label>
              <input
                type="number"
                value={formData.chargeAmount}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none"
              />
              <p className="mt-1 text-sm text-gray-500">
                공급가액 + 세액으로 자동 계산됩니다.
              </p>
            </div>

            {/* 과세기간 필드들 제거 */}
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TaxInvoiceManagement() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "history">(
    "overview"
  );

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
    details: {
      processed: number;
      duplicates: number;
      userNotFound: number;
      validationErrors: number;
    };
  } | null>(null);

  // 실제 데이터 관리를 위한 state
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [searchFilters, setSearchFilters] = useState({
    startDate: "",
    endDate: "",
    businessNumber: "",
    companyName: "",
    status: "all",
  });

  // 모달 상태 관리
  const [selectedTaxInvoice, setSelectedTaxInvoice] =
    useState<TaxInvoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteInvoiceNumber, setDeleteInvoiceNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsPerPage = 10;

  // 세금계산서 목록 조회 함수
  const fetchTaxInvoices = useCallback(
    async (page: number = 1, filters?: typeof searchFilters) => {
      try {
        setIsLoading(true);
        setError(null);

        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("로그인이 필요합니다.");
        }

        // 쿼리 파라미터 구성
        const params = new URLSearchParams({
          page: page.toString(),
          limit: itemsPerPage.toString(),
        });

        const currentFilters = filters || searchFilters;
        if (currentFilters.startDate)
          params.append("startDate", currentFilters.startDate);
        if (currentFilters.endDate)
          params.append("endDate", currentFilters.endDate);
        if (currentFilters.businessNumber)
          params.append("businessNumber", currentFilters.businessNumber);
        if (currentFilters.companyName)
          params.append("companyName", currentFilters.companyName);
        if (currentFilters.status && currentFilters.status !== "all")
          params.append("status", currentFilters.status);

        const response = await fetch(
          `/api/admin/tax-invoices?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "데이터 조회에 실패했습니다.");
        }

        const result: ApiResponse = await response.json();
        setInvoices(result.data);
        setPagination(result.pagination);
      } catch (error) {
        console.error("세금계산서 목록 조회 오류:", error);
        setError(
          error instanceof Error
            ? error.message
            : "데이터 조회 중 오류가 발생했습니다."
        );
        setInvoices([]);
        setPagination({
          currentPage: 1,
          limit: 10,
          totalCount: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [searchFilters]
  );

  // 컴포넌트 마운트 시 및 탭 변경 시 데이터 로드
  useEffect(() => {
    if (activeTab === "history" || activeTab === "overview") {
      fetchTaxInvoices(1);
    }
  }, [activeTab, fetchTaxInvoices]);

  // 컴포넌트 초기 로드
  useEffect(() => {
    fetchTaxInvoices(1);
  }, [fetchTaxInvoices]);

  // 검색 실행
  const handleSearch = () => {
    fetchTaxInvoices(1, searchFilters);
  };

  // 검색 초기화
  const handleResetSearch = () => {
    const resetFilters = {
      startDate: "",
      endDate: "",
      businessNumber: "",
      companyName: "",
      status: "all",
    };
    setSearchFilters(resetFilters);
    fetchTaxInvoices(1, resetFilters);
  };

  // 페이지 변경
  const handlePageChange = (page: number) => {
    fetchTaxInvoices(page, searchFilters);
  };

  // 엑셀 다운로드 핸들러
  const handleExcelDownload = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      // 현재 검색 필터를 쿼리 파라미터로 구성
      const params = new URLSearchParams();
      if (searchFilters.startDate)
        params.append("startDate", searchFilters.startDate);
      if (searchFilters.endDate)
        params.append("endDate", searchFilters.endDate);
      if (searchFilters.businessNumber)
        params.append("businessNumber", searchFilters.businessNumber);
      if (searchFilters.companyName)
        params.append("companyName", searchFilters.companyName);
      if (searchFilters.status && searchFilters.status !== "all")
        params.append("status", searchFilters.status);

      const response = await fetch(
        `/api/admin/tax-invoices/export?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "엑셀 다운로드에 실패했습니다.");
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // 파일명 추출 (Content-Disposition 헤더에서)
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "세금계산서_목록.xlsx";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ""));
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      console.error("엑셀 다운로드 오류:", error);
      alert(
        `엑셀 다운로드 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  };

  // 세금계산서 상세보기 핸들러
  const handleViewTaxInvoice = async (invoiceId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(`/api/admin/tax-invoices/${invoiceId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "세금계산서 조회에 실패했습니다.");
      }

      const result = await response.json();
      setSelectedTaxInvoice(result.data);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error("세금계산서 조회 오류:", error);
      alert(
        `세금계산서 조회 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  };

  // 세금계산서 수정 핸들러
  const handleEditTaxInvoice = async (invoiceId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(`/api/admin/tax-invoices/${invoiceId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "세금계산서 조회에 실패했습니다.");
      }

      const result = await response.json();
      setSelectedTaxInvoice(result.data);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("세금계산서 조회 오류:", error);
      alert(
        `세금계산서 조회 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    }
  };

  // 세금계산서 삭제 핸들러
  const handleDeleteTaxInvoice = (invoiceId: number) => {
    setSelectedTaxInvoice({ id: invoiceId } as TaxInvoice);
    setDeleteInvoiceNumber(`ID: ${invoiceId}`);
    setIsDeleteModalOpen(true);
  };

  // 삭제 확인 핸들러
  const confirmDeleteTaxInvoice = async () => {
    if (!selectedTaxInvoice) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        `/api/admin/tax-invoices/${selectedTaxInvoice.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "세금계산서 삭제에 실패했습니다.");
      }

      alert("세금계산서가 성공적으로 삭제되었습니다.");
      setIsDeleteModalOpen(false);
      setSelectedTaxInvoice(null);
      setDeleteInvoiceNumber("");

      // 목록 새로고침
      fetchTaxInvoices(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error("세금계산서 삭제 오류:", error);
      alert(
        `세금계산서 삭제 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // 세금계산서 수정 제출 핸들러
  const handleSaveTaxInvoice = async (updatedInvoice: Partial<TaxInvoice>) => {
    if (!selectedTaxInvoice) return;

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch(
        `/api/admin/tax-invoices/${selectedTaxInvoice.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedInvoice),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "세금계산서 수정에 실패했습니다.");
      }

      alert("세금계산서가 성공적으로 수정되었습니다.");
      setIsEditModalOpen(false);
      setSelectedTaxInvoice(null);

      // 목록 새로고침
      fetchTaxInvoices(pagination.currentPage, searchFilters);
    } catch (error) {
      console.error("세금계산서 수정 오류:", error);
      alert(
        `세금계산서 수정 중 오류가 발생했습니다: ${
          error instanceof Error ? error.message : "알 수 없는 오류"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // 파일 업로드 핸들러
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        setIsUploading(false);
        return;
      }

      // FormData 생성
      const formData = new FormData();
      formData.append("file", uploadFile);

      // 업로드 진행률 시뮬레이션 (실제 진행률 추적은 복잡하므로 간단히 처리)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const response = await fetch("/api/admin/tax-invoices/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "업로드에 실패했습니다.");
      }

      // 성공 결과 표시
      setUploadResult(result.data);
    } catch (error) {
      console.error("Upload failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "업로드 중 오류가 발생했습니다."
      );

      // 오류 시 기본 결과 표시
      setUploadResult({
        success: 0,
        failed: 1,
        errors: [
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다",
        ],
        details: {
          processed: 1,
          duplicates: 0,
          userNotFound: 0,
          validationErrors: 1,
        },
      });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        return;
      }

      const response = await fetch("/api/admin/tax-invoices/template", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "템플릿 다운로드에 실패했습니다.");
      }

      // 파일 다운로드 처리
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // 파일명 추출 (Content-Disposition 헤더에서)
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "세금계산서_업로드_템플릿.xlsx";

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ""));
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("템플릿 다운로드 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "템플릿 다운로드 중 오류가 발생했습니다."
      );
    }
  };

  const resetUpload = () => {
    setUploadFile(null);
    setUploadProgress(0);
    setUploadResult(null);
    setIsUploading(false);
  };

  // 통계 계산 (실제 데이터 기준)
  const totalInvoices = pagination.totalCount;
  const totalAmount = invoices.reduce(
    (sum, invoice) => sum + invoice.chargeAmount,
    0
  );
  const monthlyInvoices = invoices.filter(
    (invoice) =>
      new Date(invoice.issueDate).getMonth() === new Date().getMonth()
  ).length;
  const cancelledInvoices = invoices.filter(
    (invoice) => invoice.status === "cancelled"
  ).length;

  const formatCurrency = (amount: number) => `₩${amount.toLocaleString()}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("ko-KR");

  // 탭 컨텐츠 렌더링 함수
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* 통계 정보 */}
            <div className="stats-section">
              <h2>통계 정보</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>총 발행 건수</h3>
                    <div className="stat-number">{totalInvoices}건</div>
                    <div className="stat-subtitle">전체 기간</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <h3>총 발행 금액</h3>
                    <div className="stat-number">
                      {formatCurrency(totalAmount)}
                    </div>
                    <div className="stat-subtitle">누적 금액</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">📅</div>
                  <div className="stat-content">
                    <h3>이번 달 발행</h3>
                    <div className="stat-number">{monthlyInvoices}건</div>
                    <div className="stat-subtitle">2024년 1월</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⚠️</div>
                  <div className="stat-content">
                    <h3>취소된 계산서</h3>
                    <div className="stat-number">{cancelledInvoices}건</div>
                    <div className="stat-subtitle">전체 기간</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 최근 발행 내역 미리보기 */}
            <div className="recent-invoices">
              <div className="flex items-center justify-between mb-4">
                <h2>최근 발행 내역</h2>
                <button
                  onClick={() => setActiveTab("history")}
                  className="text-primary hover:text-primary text-sm font-medium cursor-pointer"
                >
                  전체보기
                </button>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사업자등록번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        업체명
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        공급가액
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        세액
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        충전금액
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                          <span className="text-gray-500">
                            데이터를 불러오는 중...
                          </span>
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <span className="text-red-500">오류: {error}</span>
                        </td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          발행된 세금계산서가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      invoices.slice(0, 5).map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(invoice.issueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.businessNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.companyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(invoice.supplyAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(invoice.taxAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(invoice.chargeAmount)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "upload":
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                엑셀 파일 업로드
              </h2>

              {/* 업로드 가이드 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  업로드 안내
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 지원 파일 형식: .xlsx, .xls</li>
                  <li>• 최대 파일 크기: 10MB</li>
                  <li>• 첫 번째 행은 헤더로 사용됩니다</li>
                  <li>
                    • 필수 컬럼: 작성일, 사업자등록번호, 업체명, 공급가액, 세액, 충전금액
                  </li>
                </ul>
                <button
                  onClick={downloadTemplate}
                  className="mt-3 inline-flex items-center px-3 py-1 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  📄 템플릿 다운로드
                </button>
              </div>

              {/* 파일 업로드 영역 */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {!uploadFile ? (
                  <div>
                    <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
                      📤
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      엑셀 파일을 드래그하여 놓거나 클릭하여 선택하세요
                    </p>
                    <input
                      type="file"
                      onChange={handleFileChange}
                      accept=".xlsx,.xls"
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      파일 선택
                    </label>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm font-medium text-gray-900">
                        {uploadFile.name}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <div className="flex space-x-3 justify-center">
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        {isUploading ? "업로드 중..." : "업로드 시작"}
                      </button>
                      <button
                        onClick={resetUpload}
                        disabled={isUploading}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 업로드 진행률 */}
              {isUploading && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                    <span>업로드 진행률</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* 업로드 결과 */}
              {uploadResult && (
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    업로드 결과
                  </h3>

                  {/* 메인 결과 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {uploadResult.success}
                      </div>
                      <div className="text-sm text-gray-600">성공</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {uploadResult.failed}
                      </div>
                      <div className="text-sm text-gray-600">실패</div>
                    </div>
                  </div>

                  {/* 세부 정보 */}
                  {uploadResult.details && (
                    <div className="mb-4 p-3 bg-white rounded border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        세부 정보
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-blue-600">
                            {uploadResult.details.processed}
                          </div>
                          <div className="text-gray-500">처리된 행</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-orange-600">
                            {uploadResult.details.duplicates}
                          </div>
                          <div className="text-gray-500">중복</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-purple-600">
                            {uploadResult.details.userNotFound}
                          </div>
                          <div className="text-gray-500">사용자 없음</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-red-600">
                            {uploadResult.details.validationErrors}
                          </div>
                          <div className="text-gray-500">검증 오류</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 오류 목록 */}
                  {uploadResult.errors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-900 mb-2">
                        오류 내역 ({uploadResult.errors.length}개)
                      </h4>
                      <div className="max-h-32 overflow-y-auto bg-white rounded border border-red-200 p-2">
                        <ul className="text-sm text-red-800 space-y-1">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-red-500 mr-2">•</span>
                              <span>{error}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-6">
            {/* 검색 및 필터 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={searchFilters.startDate}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={searchFilters.endDate}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자번호 검색
                  </label>
                  <input
                    type="text"
                    placeholder="사업자번호로 검색..."
                    value={searchFilters.businessNumber}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        businessNumber: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <select
                    value={searchFilters.status}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                  >
                    <option value="all">전체</option>
                    <option value="issued">발행</option>
                    <option value="cancelled">취소</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업체명 검색
                  </label>
                  <input
                    type="text"
                    placeholder="업체명으로 검색..."
                    value={searchFilters.companyName}
                    onChange={(e) =>
                      setSearchFilters({
                        ...searchFilters,
                        companyName: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-end space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
                  >
                    {isLoading ? "검색 중..." : "검색"}
                  </button>
                  <button
                    onClick={handleResetSearch}
                    disabled={isLoading}
                    className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
                  >
                    초기화
                  </button>
                </div>
              </div>
            </div>

            {/* 테이블 */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* 데스크톱 테이블 */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    발행 내역 ({pagination.totalCount}건)
                  </h3>
                  <button
                    onClick={handleExcelDownload}
                    disabled={isLoading || pagination.totalCount === 0}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📄 엑셀 다운로드
                  </button>
                </div>

                {isLoading ? (
                  <div className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">데이터를 불러오는 중...</p>
                  </div>
                ) : error ? (
                  <div className="px-6 py-12 text-center">
                    <p className="text-red-500 mb-4">오류: {error}</p>
                    <button
                      onClick={() => fetchTaxInvoices(1, searchFilters)}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="px-6 py-12 text-center text-gray-500">
                    발행된 세금계산서가 없습니다.
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작성일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사업자등록번호
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          업체명
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          공급가액
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          세액
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          충전금액
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          액션
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(invoice.issueDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.businessNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.companyName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(invoice.supplyAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatCurrency(invoice.taxAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(invoice.chargeAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                invoice.status === "issued"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {invoice.status === "issued" ? "발행" : "취소"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleViewTaxInvoice(invoice.id)}
                                className="text-indigo-600 hover:text-indigo-900 text-xs bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded"
                                title="상세보기"
                              >
                                보기
                              </button>
                              <button
                                onClick={() => handleEditTaxInvoice(invoice.id)}
                                className="text-green-600 hover:text-green-900 text-xs bg-green-50 hover:bg-green-100 px-2 py-1 rounded"
                                title="수정"
                              >
                                수정
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteTaxInvoice(invoice.id)
                                }
                                className="text-red-600 hover:text-red-900 text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                                title="삭제"
                              >
                                삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 모바일/태블릿 카드 레이아웃 */}
              <div className="lg:hidden">
                <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    발행 내역 ({pagination.totalCount}건)
                  </h3>
                  <button
                    onClick={handleExcelDownload}
                    disabled={isLoading || pagination.totalCount === 0}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    📄 다운로드
                  </button>
                </div>

                {isLoading ? (
                  <div className="px-4 py-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">데이터를 불러오는 중...</p>
                  </div>
                ) : error ? (
                  <div className="px-4 py-12 text-center">
                    <p className="text-red-500 mb-4">오류: {error}</p>
                    <button
                      onClick={() => fetchTaxInvoices(1, searchFilters)}
                      className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="px-4 py-12 text-center text-gray-500">
                    발행된 세금계산서가 없습니다.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              ID: {invoice.id}
                            </span>
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                invoice.status === "issued"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {invoice.status === "issued" ? "발행" : "취소"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleViewTaxInvoice(invoice.id)}
                              className="text-indigo-600 hover:text-indigo-900 text-xs bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded"
                              title="상세보기"
                            >
                              보기
                            </button>
                            <button
                              onClick={() => handleEditTaxInvoice(invoice.id)}
                              className="text-green-600 hover:text-green-900 text-xs bg-green-50 hover:bg-green-100 px-2 py-1 rounded"
                              title="수정"
                            >
                              수정
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteTaxInvoice(invoice.id)
                              }
                              className="text-red-600 hover:text-red-900 text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                              title="삭제"
                            >
                              삭제
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">발행일:</span>
                            <span className="ml-1 text-gray-900">
                              {formatDate(invoice.issueDate)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">사업자번호:</span>
                            <span className="ml-1 text-gray-900">
                              {invoice.businessNumber}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">업체명:</span>
                            <span className="ml-1 text-gray-900">
                              {invoice.companyName}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">공급가액:</span>
                            <span className="ml-1 text-gray-900">
                              {formatCurrency(invoice.supplyAmount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">세액:</span>
                            <span className="ml-1 text-gray-900">
                              {formatCurrency(invoice.taxAmount)}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500">총 금액:</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {formatCurrency(invoice.chargeAmount)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 페이지네이션 */}
              {!isLoading && !error && invoices.length > 0 && (
                <div className="px-4 lg:px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-gray-700 text-center sm:text-left">
                    총 {pagination.totalCount}건 중{" "}
                    {(pagination.currentPage - 1) * pagination.limit + 1}-
                    {Math.min(
                      pagination.currentPage * pagination.limit,
                      pagination.totalCount
                    )}
                    건 표시
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrevPage || isLoading}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      이전
                    </button>
                    <span className="px-3 py-1 bg-primary text-white rounded-md text-sm">
                      {pagination.currentPage}
                    </span>
                    <button
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNextPage || isLoading}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      다음
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AdminGuard>
      <AdminHeader onToggleSidebar={toggleSidebar} />
      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      <div className="admin-dashboard">
        <div className="admin-main">
          <div className="admin-header">
            <h1>세금계산서 관리</h1>
            <p>세금계산서 발행 및 관리를 할 수 있습니다.</p>
          </div>

          {/* 탭 네비게이션 */}
          <div className="tm-tabs">
            <button
              className={`tm-tab-btn ${
                activeTab === "overview" ? "active" : ""
              }`}
              onClick={() => setActiveTab("overview")}
            >
              개요
            </button>
            <button
              className={`tm-tab-btn ${activeTab === "upload" ? "active" : ""}`}
              onClick={() => setActiveTab("upload")}
            >
              엑셀 업로드
            </button>
            <button
              className={`tm-tab-btn ${
                activeTab === "history" ? "active" : ""
              }`}
              onClick={() => setActiveTab("history")}
            >
              발행 내역
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="tm-content">{renderTabContent()}</div>
        </div>
      </div>

      {/* 세금계산서 상세보기 모달 */}
      {isViewModalOpen && selectedTaxInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                세금계산서 상세 정보
              </h2>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* 계산서 번호 필드 제거 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    발행일
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formatDate(selectedTaxInvoice.issueDate)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사업자번호
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedTaxInvoice.businessNumber}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업체명
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedTaxInvoice.companyName}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedTaxInvoice.status === "issued"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {selectedTaxInvoice.status === "issued" ? "발행" : "취소"}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    공급가액
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formatCurrency(selectedTaxInvoice.supplyAmount)} 원
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    세액
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formatCurrency(selectedTaxInvoice.taxAmount)} 원
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    총 금액
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded font-semibold">
                    {formatCurrency(selectedTaxInvoice.chargeAmount)} 원
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    등록일
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {formatDate(selectedTaxInvoice.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {selectedTaxInvoice.user && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  담당자 정보
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      담당자명
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedTaxInvoice.user.name || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이메일
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedTaxInvoice.user.email || "-"}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연락처
                    </label>
                    <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {selectedTaxInvoice.user.phone || "-"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setIsEditModalOpen(true);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                수정하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 세금계산서 수정 모달 */}
      {isEditModalOpen && selectedTaxInvoice && (
        <TaxInvoiceEditModal
          taxInvoice={selectedTaxInvoice}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveTaxInvoice}
          isSubmitting={isSubmitting}
        />
      )}

      {/* 세금계산서 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                세금계산서 삭제
              </h2>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700">
                정말로 세금계산서를 삭제하시겠습니까?
              </p>
              <p className="mt-2 text-sm text-red-600 font-medium">
                계산서 번호: {deleteInvoiceNumber}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteTaxInvoice}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isSubmitting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}
