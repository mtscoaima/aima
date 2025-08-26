"use client";

import React, { useState, useEffect, useCallback } from "react";
import { UserProfileData } from "@/app/my-site/advertiser/profile/page";
import { tokenManager } from "@/lib/api";

export interface TaxInvoice {
  id: number;
  issue_date: string;
  business_number: string;
  company_name: string;
  supply_amount: number;
  tax_amount: number;
  charge_amount: number;
}

interface TaxInvoiceTabProps {
  userData: UserProfileData;
  onInvoiceEmailChange: (emailData: { name: string; phone: string; email: string }) => Promise<void>;
}

export default function TaxInvoiceTab({
  userData,
  onInvoiceEmailChange,
}: TaxInvoiceTabProps) {
  // 세금계산서 관련 상태
  const [taxInvoices, setTaxInvoices] = useState<TaxInvoice[]>([]);
  const [taxInvoiceLoading, setTaxInvoiceLoading] = useState(false);
  const [taxInvoiceError, setTaxInvoiceError] = useState<string | null>(null);
  const [taxInvoicePagination, setTaxInvoicePagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [taxInvoiceFilters, setTaxInvoiceFilters] = useState({
    startDate: "",
    endDate: "",
  });
  const [isExcelDownloading, setIsExcelDownloading] = useState(false);

  // 세금계산서 이메일 변경 모달 상태
  const [isTaxInvoiceEmailModalOpen, setIsTaxInvoiceEmailModalOpen] = useState(false);
  const [taxInvoiceEmailData, setTaxInvoiceEmailData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // 세금계산서 목록 가져오기
  const fetchTaxInvoices = useCallback(
    async (page = taxInvoicePagination.currentPage) => {
      setTaxInvoiceLoading(true);
      setTaxInvoiceError(null);

      try {
        const token = tokenManager.getAccessToken();
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        const params = new URLSearchParams({
          page: page.toString(),
          limit: taxInvoicePagination.itemsPerPage.toString(),
        });

        if (taxInvoiceFilters.startDate) {
          params.append("startDate", taxInvoiceFilters.startDate);
        }
        if (taxInvoiceFilters.endDate) {
          params.append("endDate", taxInvoiceFilters.endDate);
        }

        const response = await fetch(`/api/tax-invoices?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("세금계산서 목록을 불러오는데 실패했습니다.");
        }

        const data = await response.json();
        
        setTaxInvoices(data.data || []);
        
        // pagination 데이터 안전하게 처리
        if (data.pagination) {
          setTaxInvoicePagination({
            currentPage: data.pagination.currentPage || page,
            totalPages: data.pagination.totalPages || 0,
            totalItems: data.pagination.totalItems || 0,
            itemsPerPage: data.pagination.itemsPerPage || taxInvoicePagination.itemsPerPage,
            hasNextPage: data.pagination.hasNextPage || false,
            hasPrevPage: data.pagination.hasPrevPage || false,
          });
        } else {
          // pagination 정보가 없는 경우 기본값 설정
          setTaxInvoicePagination(prev => ({
            ...prev,
            currentPage: page,
            totalPages: 1,
            totalItems: (data.data || []).length,
            hasNextPage: false,
            hasPrevPage: false,
          }));
        }
      } catch (error) {
        console.error("❌ 세금계산서 목록 조회 오류:", error);
        setTaxInvoiceError(
          error instanceof Error ? error.message : "세금계산서 목록을 불러오는데 실패했습니다."
        );
      } finally {
        setTaxInvoiceLoading(false);
      }
    },
    [taxInvoicePagination.itemsPerPage, taxInvoiceFilters] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // 세금계산서 엑셀 다운로드
  const downloadTaxInvoiceExcel = useCallback(async () => {
    setIsExcelDownloading(true);

    try {
      const token = tokenManager.getAccessToken();
      if (!token) {
        throw new Error("인증 토큰이 없습니다.");
      }

      const params = new URLSearchParams();
      if (taxInvoiceFilters.startDate) {
        params.append("startDate", taxInvoiceFilters.startDate);
      }
      if (taxInvoiceFilters.endDate) {
        params.append("endDate", taxInvoiceFilters.endDate);
      }

      const response = await fetch(`/api/tax-invoices/excel?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("엑셀 다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // 파일명 추출
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "세금계산서_발행내역.xlsx";
      if (contentDisposition) {
        const matches = contentDisposition.match(
          /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
        );
        if (matches && matches[1]) {
          filename = decodeURIComponent(matches[1].replace(/['"]/g, ""));
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("엑셀 다운로드 오류:", error);
      alert(
        error instanceof Error ? error.message : "엑셀 다운로드에 실패했습니다."
      );
    } finally {
      setIsExcelDownloading(false);
    }
  }, [taxInvoiceFilters]);

  // 세금계산서 페이지 변경
  const handleTaxInvoicePageChange = (page: number) => {
    // 유효한 페이지 범위 확인
    if (page < 1 || page > taxInvoicePagination.totalPages) {
      console.warn(`⚠️ 유효하지 않은 페이지: ${page}`);
      return;
    }
    
    // 현재 페이지와 같은 경우 불필요한 호출 방지
    if (page === taxInvoicePagination.currentPage) {
      return;
    }
    
    setTaxInvoicePagination((prev) => ({ ...prev, currentPage: page }));
    fetchTaxInvoices(page);
  };

  // 세금계산서 필터 변경
  const handleTaxInvoiceFilterChange = (newFilters: typeof taxInvoiceFilters) => {
    setTaxInvoiceFilters(newFilters);
    setTaxInvoicePagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // 세금계산서 필터 초기화
  const resetTaxInvoiceFilters = () => {
    setTaxInvoiceFilters({ startDate: "", endDate: "" });
    setTaxInvoicePagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // 세금계산서 이메일 변경 모달 열기
  const handleChangeInvoiceEmail = () => {
    setTaxInvoiceEmailData({
      name: userData.taxInvoiceInfo?.manager || userData.name || "",
      phone: userData.taxInvoiceInfo?.contact || userData.phoneNumber || "",
      email: userData.taxInvoiceInfo?.email || userData.email || "",
    });
    setIsTaxInvoiceEmailModalOpen(true);
  };

  // 세금계산서 이메일 데이터 변경
  const handleTaxInvoiceEmailDataChange = (field: string, value: string) => {
    setTaxInvoiceEmailData((prev) => ({ ...prev, [field]: value }));
  };

  // 세금계산서 이메일 저장
  const handleSaveTaxInvoiceEmail = async () => {
    // 입력 검증
    if (!taxInvoiceEmailData.name.trim()) {
      alert("담당자 이름을 입력해주세요.");
      return;
    }
    if (!taxInvoiceEmailData.phone.trim()) {
      alert("담당자 휴대폰을 입력해주세요.");
      return;
    }
    if (!taxInvoiceEmailData.email.trim()) {
      alert("계산서 수신 이메일을 입력해주세요.");
      return;
    }

    // 이메일 형식 검증
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(taxInvoiceEmailData.email)) {
      alert("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    try {
      await onInvoiceEmailChange(taxInvoiceEmailData);
      alert("세금계산서 담당자 정보가 변경되었습니다.");
      setIsTaxInvoiceEmailModalOpen(false);
    } catch (error) {
      console.error("세금계산서 이메일 변경 오류:", error);
      alert("세금계산서 담당자 정보 변경에 실패했습니다.");
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchTaxInvoices();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    fetchTaxInvoices(1);
  }, [taxInvoiceFilters]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="space-y-6">
      {/* 탭 설명 */}
      <p className="text-sm text-gray-600">
        세금계산서는 매월 10일 카드결제를 제외한 전월 결제분이 발행됩니다.
      </p>

      {/* 계산서 수신 이메일 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          계산서 수신 이메일
        </h3>
        <div className="flex items-center justify-between">
          <div className="border border-gray-300 rounded px-4 py-2 bg-gray-50">
            <span className="text-gray-900">
              {userData?.taxInvoiceInfo?.email ||
                userData?.email ||
                "이메일 정보가 없습니다."}
            </span>
          </div>
          <button
            onClick={handleChangeInvoiceEmail}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            변경하기
          </button>
        </div>
      </div>

      {/* 세금계산서 발행 내역 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              세금계산서 발행 내역
            </h3>
            <button
              onClick={downloadTaxInvoiceExcel}
              disabled={isExcelDownloading || taxInvoices.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              {isExcelDownloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>다운로드 중...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span>엑셀 다운로드</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 필터 영역 */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">
                기간 설정:
              </label>
              <input
                type="date"
                value={taxInvoiceFilters.startDate}
                onChange={(e) =>
                  handleTaxInvoiceFilterChange({
                    ...taxInvoiceFilters,
                    startDate: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-gray-500">~</span>
              <input
                type="date"
                value={taxInvoiceFilters.endDate}
                onChange={(e) =>
                  handleTaxInvoiceFilterChange({
                    ...taxInvoiceFilters,
                    endDate: e.target.value,
                  })
                }
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={resetTaxInvoiceFilters}
              className="px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
          </div>
        </div>

        {/* 테이블 영역 */}
        <div className="overflow-x-auto">
          {taxInvoiceLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">
                  세금계산서 목록을 불러오는 중...
                </p>
              </div>
            </div>
          ) : taxInvoiceError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg
                  className="w-12 h-12 text-red-300 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600 mb-2">{taxInvoiceError}</p>
                <button
                  onClick={() => fetchTaxInvoices()}
                  className="px-4 py-2 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                >
                  다시 시도
                </button>
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    작성일
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    사업자등록번호
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    업체명
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                    공급가액
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                    세액
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">
                    충전금액
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {taxInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <svg
                          className="w-12 h-12 text-gray-300 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-sm">발행된 세금계산서가 없습니다.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  taxInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {invoice.issue_date}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {invoice.business_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {invoice.company_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {invoice.supply_amount.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {invoice.tax_amount.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                        {invoice.charge_amount.toLocaleString()}원
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        {taxInvoices.length > 0 && 
         taxInvoicePagination.totalPages > 1 && 
         taxInvoicePagination.totalPages !== undefined &&
         !isNaN(taxInvoicePagination.totalPages) && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                총 {taxInvoicePagination.totalItems}개 중{" "}
                {(taxInvoicePagination.currentPage - 1) *
                  taxInvoicePagination.itemsPerPage +
                  1}
                -
                {Math.min(
                  taxInvoicePagination.currentPage *
                    taxInvoicePagination.itemsPerPage,
                  taxInvoicePagination.totalItems
                )}
                개 표시
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    handleTaxInvoicePageChange(
                      taxInvoicePagination.currentPage - 1
                    )
                  }
                  disabled={!taxInvoicePagination.hasPrevPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                {Array.from(
                  { length: Math.max(1, taxInvoicePagination.totalPages || 1) },
                  (_, i) => i + 1
                )
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === taxInvoicePagination.totalPages ||
                      Math.abs(page - taxInvoicePagination.currentPage) <= 2
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-sm text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => handleTaxInvoicePageChange(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          page === taxInvoicePagination.currentPage
                            ? "bg-blue-500 text-white"
                            : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  onClick={() =>
                    handleTaxInvoicePageChange(
                      taxInvoicePagination.currentPage + 1
                    )
                  }
                  disabled={!taxInvoicePagination.hasNextPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 세금계산서 이메일 변경 모달 */}
      {isTaxInvoiceEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                세금계산서 담당자 정보 수정
              </h3>
              <button
                onClick={() => setIsTaxInvoiceEmailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 w-1/3 border-r border-gray-200">
                        담당자 이름
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={taxInvoiceEmailData.name}
                          onChange={(e) =>
                            handleTaxInvoiceEmailDataChange("name", e.target.value)
                          }
                          placeholder="담당자 이름을 입력해주세요"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 w-1/3 border-r border-gray-200">
                        담당자 휴대폰
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="tel"
                          value={taxInvoiceEmailData.phone}
                          onChange={(e) =>
                            handleTaxInvoiceEmailDataChange("phone", e.target.value)
                          }
                          placeholder="010-0000-0000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 w-1/3 border-r border-gray-200">
                        계산서 수신 이메일
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="email"
                          value={taxInvoiceEmailData.email}
                          onChange={(e) =>
                            handleTaxInvoiceEmailDataChange("email", e.target.value)
                          }
                          placeholder="example@company.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-4">
              <button
                onClick={() => setIsTaxInvoiceEmailModalOpen(false)}
                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveTaxInvoiceEmail}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
