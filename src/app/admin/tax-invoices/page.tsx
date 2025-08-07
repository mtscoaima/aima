"use client";

import { useState } from "react";
import { AdminGuard } from "@/components/RoleGuard";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import "./styles.css";

// 세금계산서 인터페이스
interface TaxInvoice {
  id: number;
  invoiceNumber: string;
  issueDate: string;
  businessNumber: string;
  companyName: string;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
  periodStart?: string;
  periodEnd?: string;
  status: "issued" | "cancelled";
  createdAt: string;
}

export default function TaxInvoiceManagement() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "upload" | "history">(
    "overview"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const itemsPerPage = 10;

  // 더미 데이터
  const sampleInvoices: TaxInvoice[] = [
    {
      id: 1,
      invoiceNumber: "2024-001",
      issueDate: "2024-01-15",
      businessNumber: "123-45-67890",
      companyName: "주식회사 샘플",
      supplyAmount: 100000,
      taxAmount: 10000,
      totalAmount: 110000,
      status: "issued",
      createdAt: "2024-01-15T09:00:00",
    },
    {
      id: 2,
      invoiceNumber: "2024-002",
      issueDate: "2024-01-16",
      businessNumber: "987-65-43210",
      companyName: "테스트 기업",
      supplyAmount: 200000,
      taxAmount: 20000,
      totalAmount: 220000,
      status: "issued",
      createdAt: "2024-01-16T10:30:00",
    },
    {
      id: 3,
      invoiceNumber: "2024-003",
      issueDate: "2024-01-17",
      businessNumber: "555-44-33221",
      companyName: "예시 회사",
      supplyAmount: 150000,
      taxAmount: 15000,
      totalAmount: 165000,
      status: "cancelled",
      createdAt: "2024-01-17T14:20:00",
    },
    {
      id: 4,
      invoiceNumber: "2024-004",
      issueDate: "2024-01-18",
      businessNumber: "111-22-33444",
      companyName: "가나다 상사",
      supplyAmount: 300000,
      taxAmount: 30000,
      totalAmount: 330000,
      status: "issued",
      createdAt: "2024-01-18T11:15:00",
    },
    {
      id: 5,
      invoiceNumber: "2024-005",
      issueDate: "2024-01-19",
      businessNumber: "999-88-77665",
      companyName: "마바사 기업",
      supplyAmount: 250000,
      taxAmount: 25000,
      totalAmount: 275000,
      status: "issued",
      createdAt: "2024-01-19T16:45:00",
    },
    {
      id: 6,
      invoiceNumber: "2024-006",
      issueDate: "2024-01-20",
      businessNumber: "777-66-55443",
      companyName: "아자차 주식회사",
      supplyAmount: 180000,
      taxAmount: 18000,
      totalAmount: 198000,
      status: "issued",
      createdAt: "2024-01-20T13:30:00",
    },
    {
      id: 7,
      invoiceNumber: "2024-007",
      issueDate: "2024-01-21",
      businessNumber: "444-33-22111",
      companyName: "카타파 기업",
      supplyAmount: 400000,
      taxAmount: 40000,
      totalAmount: 440000,
      status: "issued",
      createdAt: "2024-01-21T10:00:00",
    },
    {
      id: 8,
      invoiceNumber: "2024-008",
      issueDate: "2024-01-22",
      businessNumber: "666-77-88999",
      companyName: "하헤호 회사",
      supplyAmount: 350000,
      taxAmount: 35000,
      totalAmount: 385000,
      status: "cancelled",
      createdAt: "2024-01-22T15:20:00",
    },
    {
      id: 9,
      invoiceNumber: "2024-009",
      issueDate: "2024-01-23",
      businessNumber: "222-33-44555",
      companyName: "히후하 상사",
      supplyAmount: 120000,
      taxAmount: 12000,
      totalAmount: 132000,
      status: "issued",
      createdAt: "2024-01-23T09:45:00",
    },
    {
      id: 10,
      invoiceNumber: "2024-010",
      issueDate: "2024-01-24",
      businessNumber: "888-99-00111",
      companyName: "가나다라 기업",
      supplyAmount: 280000,
      taxAmount: 28000,
      totalAmount: 308000,
      status: "issued",
      createdAt: "2024-01-24T12:10:00",
    },
    {
      id: 11,
      invoiceNumber: "2024-011",
      issueDate: "2024-01-25",
      businessNumber: "333-22-11000",
      companyName: "마바사아자 회사",
      supplyAmount: 160000,
      taxAmount: 16000,
      totalAmount: 176000,
      status: "issued",
      createdAt: "2024-01-25T14:30:00",
    },
    {
      id: 12,
      invoiceNumber: "2024-012",
      issueDate: "2024-01-26",
      businessNumber: "555-66-77888",
      companyName: "차카타파 상사",
      supplyAmount: 220000,
      taxAmount: 22000,
      totalAmount: 242000,
      status: "issued",
      createdAt: "2024-01-26T11:20:00",
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(sampleInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInvoices = sampleInvoices.slice(startIndex, endIndex);

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

    // 업로드 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      // 실제 API 호출 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setUploadProgress(100);
      setUploadResult({
        success: 150,
        failed: 5,
        errors: [
          "3행: 사업자등록번호 형식이 올바르지 않습니다",
          "7행: 공급가액이 숫자가 아닙니다",
          "12행: 필수 컬럼(업체명)이 누락되었습니다",
        ],
      });
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      clearInterval(progressInterval);
    }
  };

  const downloadTemplate = () => {
    alert("엑셀 템플릿 다운로드 기능은 추후 구현 예정입니다.");
  };

  const resetUpload = () => {
    setUploadFile(null);
    setUploadProgress(0);
    setUploadResult(null);
    setIsUploading(false);
  };

  // 통계 계산
  const totalInvoices = sampleInvoices.length;
  const totalAmount = sampleInvoices.reduce(
    (sum, invoice) => sum + invoice.totalAmount,
    0
  );
  const monthlyInvoices = sampleInvoices.filter(
    (invoice) =>
      new Date(invoice.issueDate).getMonth() === new Date().getMonth()
  ).length;
  const cancelledInvoices = sampleInvoices.filter(
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
                        계산서 번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        업체명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        발행일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        총 금액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sampleInvoices.slice(0, 5).map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {invoice.companyName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(invoice.totalAmount)}
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
                      </tr>
                    ))}
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
                    • 필수 컬럼: 계산서번호, 발행일, 사업자번호, 업체명,
                    공급가액, 세액, 총금액
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

                  {uploadResult.errors.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-red-900 mb-2">
                        오류 내역
                      </h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        {uploadResult.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기간 선택
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary">
                    <option value="all">전체</option>
                    <option value="today">오늘</option>
                    <option value="week">최근 7일</option>
                    <option value="month">최근 30일</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상태
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 ring-primary"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                    검색
                  </button>
                  <button className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">
                    초기화
                  </button>
                </div>
              </div>
            </div>

            {/* 테이블 */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  발행 내역 ({sampleInvoices.length}건)
                </h3>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                  📄 엑셀 다운로드
                </button>
              </div>

              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      계산서 번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      발행일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사업자번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      업체명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      공급가액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      세액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      총 금액
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentInvoices.map((invoice) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.businessNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.companyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.supplyAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.taxAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.totalAmount)}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                총 {sampleInvoices.length}건 중 {startIndex + 1}-
                {Math.min(endIndex, sampleInvoices.length)}건 표시
              </div>
              <div className="flex space-x-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  이전
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 2 && page <= currentPage + 2)
                  )
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === page
                            ? "bg-primary text-white"
                            : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
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
    </AdminGuard>
  );
}
