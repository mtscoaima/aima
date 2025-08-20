"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserProfileData } from "@/app/my-site/advertiser/profile/page";
import { updateUserInfo, tokenManager } from "@/lib/api";



interface BusinessInfoTabProps {
  userData: UserProfileData;
  isSaving: boolean;
  onUserDataUpdate: (newData: Partial<UserProfileData>) => void;
  getBusinessTypeText: (businessType?: string) => string;
  hasCompanyInfo: (userData: UserProfileData) => boolean;
  getApprovalStatusText: (status?: string, hasCompanyInfoFlag?: boolean) => string;
  getApprovalStatusColor: (status?: string, hasCompanyInfoFlag?: boolean) => string;
}

export default function BusinessInfoTab({
  userData,
  isSaving,
  onUserDataUpdate,
  getBusinessTypeText,
  hasCompanyInfo,
  getApprovalStatusText,
  getApprovalStatusColor,
}: BusinessInfoTabProps) {
  // 사업자 정보 관련 상태
  const [editTaxInvoiceData, setEditTaxInvoiceData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [editableHomepage, setEditableHomepage] = useState("");

  // 재직증명서 관련 상태
  const [isEmploymentCertModalOpen, setIsEmploymentCertModalOpen] = useState(false);
  const [employmentCertFile, setEmploymentCertFile] = useState<File | null>(null);
  const [isEmploymentCertUploading, setIsEmploymentCertUploading] = useState(false);

  // userData 변경 시 editTaxInvoiceData와 editableHomepage 초기화
  useEffect(() => {
    if (
      userData.taxInvoiceInfo ||
      userData.name ||
      userData.phoneNumber ||
      userData.email
    ) {
      setEditTaxInvoiceData({
        name: userData.taxInvoiceInfo?.manager || userData.name || "",
        phone: userData.taxInvoiceInfo?.contact || userData.phoneNumber || "",
        email: userData.taxInvoiceInfo?.email || userData.email || "",
      });
    }
    
    // 홈페이지 URL 초기화
    if (userData.homepage) {
      setEditableHomepage(userData.homepage === "-" ? "" : userData.homepage);
    }
  }, [
    userData.taxInvoiceInfo,
    userData.name,
    userData.phoneNumber,
    userData.email,
    userData.homepage,
  ]);

  // 세금계산서 담당자 인라인 편집 데이터 변경
  const handleEditTaxInvoiceDataChange = (field: string, value: string) => {
    setEditTaxInvoiceData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 세금계산서 담당자 인라인 편집 저장
  const handleSaveEditTaxInvoice = async () => {
    try {
      // 입력 검증
      if (!editTaxInvoiceData.name.trim()) {
        alert("담당자 이름을 입력해주세요.");
        return;
      }
      if (!editTaxInvoiceData.phone.trim()) {
        alert("담당자 휴대폰을 입력해주세요.");
        return;
      }
      if (!editTaxInvoiceData.email.trim()) {
        alert("계산서 수신 이메일을 입력해주세요.");
        return;
      }

      // 이메일 형식 검증
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(editTaxInvoiceData.email)) {
        alert("올바른 이메일 형식을 입력해주세요.");
        return;
      }

      // API 호출로 홈페이지 URL과 세금계산서 담당자 정보 동시 업데이트
      await updateUserInfo({
        homepage: editableHomepage,
        taxInvoiceInfo: {
          manager: editTaxInvoiceData.name,
          contact: editTaxInvoiceData.phone,
          email: editTaxInvoiceData.email,
        },
      });

      // 부모 컴포넌트 상태 업데이트
      onUserDataUpdate({
        homepage: editableHomepage || "-",
        taxInvoiceInfo: {
          manager: editTaxInvoiceData.name,
          contact: editTaxInvoiceData.phone,
          email: editTaxInvoiceData.email,
        },
      });

      alert("홈페이지 URL과 세금계산서 담당자 정보가 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("홈페이지 URL 및 세금계산서 담당자 정보 수정 실패:", error);
      alert("홈페이지 URL 및 세금계산서 담당자 정보 수정에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 재직증명서 수정 모달 닫기
  const handleEmploymentCertModalClose = () => {
    setIsEmploymentCertModalOpen(false);
    setEmploymentCertFile(null);
  };

  // 재직증명서 파일 선택 처리
  const handleEmploymentCertFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setEmploymentCertFile(file);
    }
  };

  // 재직증명서 수정 저장
  const handleEmploymentCertSave = async () => {
    if (!employmentCertFile) {
      alert("재직증명서 파일을 선택해주세요.");
      return;
    }

    try {
      setIsEmploymentCertUploading(true);

      // 파일 업로드
      const token = tokenManager.getAccessToken();
      if (!token) {
        throw new Error("로그인이 필요합니다.");
      }

      const formData = new FormData();
      formData.append("employmentCertificate", employmentCertFile);

      const response = await fetch("/api/users/upload-documents", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("파일 업로드 실패");
      }

      const result = await response.json();

      // 부모 컴포넌트 상태 업데이트
      onUserDataUpdate({
        documents: {
          ...userData.documents,
          employmentCertificate: result.documents.employmentCertificate,
        },
      });

      alert("재직증명서가 성공적으로 수정되었습니다.");
      setIsEmploymentCertModalOpen(false);
      setEmploymentCertFile(null);
    } catch (error) {
      console.error("재직증명서 수정 실패:", error);
      alert("재직증명서 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsEmploymentCertUploading(false);
    }
  };
  const router = useRouter();
  
  const isCompanyInfoExists = hasCompanyInfo(userData);
  const isNotVerified =
    !isCompanyInfoExists || userData.approval_status !== "APPROVED";

  return (
    <div className="space-y-6">
      {/* 탭 설명 */}
      <p className="text-sm text-gray-600">
        회원님의 사업자 정보를 확인 및 변경하실 수 있습니다.
      </p>

      {/* 미인증 상태 알림 */}
      {isNotVerified && (
        <div className="bg-red-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm font-medium">
                ! 미인증
              </span>
              <p className="text-sm text-red-600">
                원활한 에이마 서비스 이용을 위해 기업 정보를 인증해 주세요.
              </p>
            </div>

            <button
              onClick={() =>
                router.push("/my-site/advertiser/business-verification")
              }
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
            >
              사업자 정보 인증
            </button>
          </div>
        </div>
      )}

      {/* 사업자정보 섹션 */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black">사업자 정보</h2>
        </div>

        <div className="mb-6">
          <table className="w-full border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  기업유형
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified
                    ? ""
                    : getBusinessTypeText(userData.businessType)}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  사업자명
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? "" : userData.companyName || "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  대표자명
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? "" : userData.representativeName || "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  사업자등록번호
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? "" : userData.businessNumber || "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  주소
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? "" : userData.address || "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  업태
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? "" : "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  종목
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? "" : "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  홈페이지 URL
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? (
                    ""
                  ) : (
                    <input
                      type="text"
                      value={editableHomepage}
                      onChange={(e) => setEditableHomepage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="www.example.com"
                      disabled={userData.approval_status !== "APPROVED"}
                    />
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  사업자 인증
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getApprovalStatusColor(
                        userData.approval_status,
                        hasCompanyInfo(userData)
                      )}`}
                    >
                      {getApprovalStatusText(
                        userData.approval_status,
                        hasCompanyInfo(userData)
                      )}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 사업자 정보 변경 안내를 테이블 하단으로 이동 */}
        {userData.approval_status === "APPROVED" && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-gray-600">
              ※사업자 정보를 변경하고 싶어요.{" "}
              <button
                onClick={() => router.push("/support?tab=contact")}
                className="text-blue-500 hover:text-blue-700 underline cursor-pointer"
              >
                고객센터 문의
              </button>
            </p>
          </div>
        )}
      </div>

      {/* 재직자정보 섹션 */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black">재직자 정보</h2>
        </div>

        <div className="mb-6">
          <table className="w-full border border-gray-200">
            <tbody>
              <tr>
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  인증정보
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  <div className="flex items-center">
                    <span>
                      {isNotVerified
                        ? ""
                        : userData.documents?.employmentCertificate
                        ? "완료"
                        : "미완료"}
                    </span>
                    {userData.approval_status === "APPROVED" && (
                      <button
                        onClick={() => setIsEmploymentCertModalOpen(true)}
                        className="ml-3 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-xs font-medium"
                      >
                        수정
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 세금계산서 담당자 섹션 */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black">
            세금계산서 담당자
          </h2>
        </div>

        <div className="mb-6">
          <table className="w-full border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  담당자 이름
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? (
                    ""
                  ) : (
                    <input
                      type="text"
                      value={editTaxInvoiceData.name}
                      onChange={(e) =>
                        handleEditTaxInvoiceDataChange("name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="김갈비"
                    />
                  )}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  담당자 휴대폰
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? (
                    ""
                  ) : (
                    <input
                      type="tel"
                      value={editTaxInvoiceData.phone}
                      onChange={(e) =>
                        handleEditTaxInvoiceDataChange(
                          "phone",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="010-555-5555"
                    />
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                  계산서 수신 이메일
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {isNotVerified ? (
                    ""
                  ) : (
                    <input
                      type="email"
                      value={editTaxInvoiceData.email}
                      onChange={(e) =>
                        handleEditTaxInvoiceDataChange(
                          "email",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="avelo01@naver.com"
                    />
                  )}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 수정 버튼 */}
          {!isNotVerified && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleSaveEditTaxInvoice}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isSaving ? "수정 중..." : "수정"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 재직증명서 수정 모달 */}
      {isEmploymentCertModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-black">
                재직자 정보 수정
              </h2>
              <button
                onClick={handleEmploymentCertModalClose}
                className="text-gray-500 hover:text-gray-700"
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
              <table className="w-full border border-gray-200">
                <tbody>
                  <tr>
                    <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                      인증정보 <span className="text-red-500">*</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-4">
                        {/* 파일 첨부 영역 */}
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            placeholder={
                              employmentCertFile
                                ? employmentCertFile.name
                                : "재직증명서를 등록해주세요. (임직원만)"
                            }
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-500"
                          />
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleEmploymentCertFileChange}
                            className="hidden"
                            id="employmentCertFile"
                          />
                          <label
                            htmlFor="employmentCertFile"
                            className="inline-flex items-center px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors duration-200 cursor-pointer"
                          >
                            파일 첨부
                          </label>
                          {employmentCertFile && (
                            <button
                              onClick={() => setEmploymentCertFile(null)}
                              className="text-red-500 hover:text-red-700"
                              title="파일 제거"
                            >
                              <svg
                                className="w-5 h-5"
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
                          )}
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            PDF, JPG, PNG (최대 20MB)
                          </span>
                        </div>

                        {isEmploymentCertUploading && (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            <span className="text-sm text-blue-600">
                              업로드 중...
                            </span>
                          </div>
                        )}

                        {/* 안내 문구 */}
                        <div className="text-sm text-gray-600">
                          <ul className="space-y-1 text-xs">
                            <li>• 대표자 아닌 임직원의 경우 제출</li>
                            <li>
                              • 해당 사업체 근무 여부를 확인합니다. 임직원만
                              제출해주세요
                            </li>
                            <li>
                              • 본인의 재직증명서를 제출해주시고, 주민번호
                              뒷자리와 주소는 가려서 제출해주세요.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 버튼 영역 */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleEmploymentCertModalClose}
                className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors duration-200"
                disabled={isEmploymentCertUploading}
              >
                취소
              </button>
              <button
                onClick={handleEmploymentCertSave}
                disabled={isEmploymentCertUploading || !employmentCertFile}
                className="px-4 py-2 bg-gray-500 text-white text-sm font-medium rounded-md hover:bg-gray-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isEmploymentCertUploading ? "업로드 중..." : "수정"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
