"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserInfo,
  UserInfoResponse,
  updateUserInfo,
} from "@/lib/api";
import { AdvertiserLoginRequiredGuard } from "@/components/RoleGuard";
import { useSearchParams } from "next/navigation";
import MemberInfoTab from "@/components/profile/MemberInfoTab";
import PasswordTab from "@/components/profile/PasswordTab";
import BusinessInfoTab from "@/components/profile/BusinessInfoTab";
import TaxInvoiceTab from "@/components/profile/TaxInvoiceTab";

// 회원정보 데이터 타입
export interface UserProfileData {
  // 개인 정보
  username?: string;
  name: string;
  email: string;
  phoneNumber: string;
  joinDate: string;
  lastLoginDate?: string;
  marketingConsent?: boolean; // 기존 호환성을 위해 유지
  smsMarketing?: boolean; // 문자 마케팅 동의
  emailMarketing?: boolean; // 이메일 마케팅 동의
  approval_status?: string;

  // 기업 정보
  companyName?: string;
  representativeName?: string;
  businessNumber?: string;
  address?: string;
  phoneNumberCompany?: string;
  customerServiceNumber?: string;
  faxNumber?: string;
  homepage?: string;
  businessType?: string;

  // 제출 서류
  documents?: {
    businessRegistration?: {
      fileName: string;
      fileUrl: string;
      uploadedAt: string;
    };
    employmentCertificate?: {
      fileName: string;
      fileUrl: string;
      uploadedAt: string;
    };
  };

  // 세금계산서 담당자 정보
  taxInvoiceInfo?: {
    email?: string;
    manager?: string;
    contact?: string;
  };

  // SNS 연동 상태 
  kakao_user_id?: string;
  naver_user_id?: string;
  google_user_id?: string;

  // 인덱스 시그니처 추가
  [key: string]: string | boolean | object | undefined;
}



export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState<
    | "memberInfo"
    | "businessInfo"
    | "password"
    | "taxInvoice"
  >("memberInfo");

  // 모달 상태 관리
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);



  // 사용자 프로필 데이터
  const [userData, setUserData] = useState<UserProfileData>({
    name: "",
    email: "",
    phoneNumber: "",
    joinDate: "",
    lastLoginDate: "",
    marketingConsent: false,
    companyName: "",
    representativeName: "",
    businessNumber: "",
    address: "",
    phoneNumberCompany: "",
    customerServiceNumber: "",
    faxNumber: "",
    homepage: "",
    businessType: "",
    documents: {},
  });











  // 기업유형 번역 함수
  const getBusinessTypeText = (businessType?: string) => {
    switch (businessType) {
      case "individual":
        return "개인사업자";
      case "company":
      case "corporation":
        return "법인사업자";
      default:
        return businessType || "-";
    }
  };

  // 회사 정보 존재 여부 확인 함수
  const hasCompanyInfo = (userData: UserProfileData): boolean => {
    if (!userData) {
      return false;
    }

    // 필수 정보 중 하나라도 있으면 회사 정보가 있다고 판단
    const { companyName, representativeName, businessNumber } = userData;
    return (
      !!(companyName && companyName !== "-") ||
      !!(representativeName && representativeName !== "-") ||
      !!(businessNumber && businessNumber !== "-")
    );
  };

  const getApprovalStatusText = (
    status?: string,
    hasCompanyInfoFlag?: boolean
  ) => {
    // 회사 정보가 없으면 미인증
    if (!hasCompanyInfoFlag) {
      return "미인증";
    }

    switch (status) {
      case "APPROVED":
        return "승인완료";
      case "PENDING":
        return "승인대기";
      case "REJECTED":
        return "승인거부";
      default:
        return "미인증";
    }
  };

  const getApprovalStatusColor = (
    status?: string,
    hasCompanyInfoFlag?: boolean
  ) => {
    // 회사 정보가 없으면 회색 배지
    if (!hasCompanyInfoFlag) {
      return "bg-gray-100 text-gray-800";
    }

    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // URL 파라미터에 따른 탭 설정
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      (tab === "memberInfo" ||
        tab === "businessInfo" ||
        tab === "password" ||
        tab === "taxInvoice")
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);

        // 실제 Supabase에서 사용자 정보 가져오기
        const userInfo: UserInfoResponse = await getUserInfo();

        // API 응답을 UserProfileData 형식으로 변환
        const profileData: UserProfileData = {
          username: userInfo.username || userInfo.email || "", // API에서 username 사용
          name: userInfo.name || "",
          email: userInfo.email || "",
          phoneNumber: userInfo.phoneNumber || "",
          joinDate: userInfo.createdAt
            ? new Date(userInfo.createdAt).toLocaleDateString("ko-KR")
            : "",
          lastLoginDate: userInfo.lastLoginAt
            ? new Date(userInfo.lastLoginAt).toLocaleString("ko-KR")
            : "",
          marketingConsent: false, // 레거시 호환성을 위해 기본값 사용
          smsMarketing: userInfo.smsMarketingConsent || false, // 새로운 필드 사용
          emailMarketing: userInfo.emailMarketingConsent || false, // 새로운 필드 사용
          approval_status: userInfo.approval_status || "",
          // 기업 정보
          companyName: userInfo.companyInfo?.companyName || "-",
          representativeName: userInfo.companyInfo?.ceoName || "-",
          businessNumber: userInfo.companyInfo?.businessNumber || "-",
          address: userInfo.companyInfo?.companyAddress || "-",
          phoneNumberCompany: userInfo.companyInfo?.companyPhone || "-",
          customerServiceNumber:
            userInfo.companyInfo?.customerServiceNumber || "-",
          faxNumber: userInfo.companyInfo?.faxNumber || "-",
          homepage: userInfo.companyInfo?.homepage || "-",
          businessType: userInfo.companyInfo?.businessType || "-",
          // 제출 서류 정보
          documents: userInfo.documents
            ? {
                businessRegistration: userInfo.documents.businessRegistration,
                employmentCertificate: userInfo.documents.employmentCertificate
                  ? {
                      fileName:
                        userInfo.documents.employmentCertificate.fileName,
                      fileUrl: userInfo.documents.employmentCertificate.fileUrl,
                      uploadedAt:
                        userInfo.documents.employmentCertificate.uploadedAt,
                    }
                  : undefined,
              }
            : {
                businessRegistration: {
                  fileName: "사업자등록증.pdf",
                  fileUrl: "/docs/business-registration.pdf",
                  uploadedAt: "2024-01-10T09:00:00Z",
                },
                employmentCertificate: {
                  fileName: "사업자등록번호부여서류.pdf",
                  fileUrl: "/docs/business-number-certificate.pdf",
                  uploadedAt: "2024-01-10T09:05:00Z",
                },
              },
          // 세금계산서 담당자 정보
          taxInvoiceInfo: userInfo.taxInvoiceInfo || undefined,
          // SNS 연동 상태 추가
          kakao_user_id: userInfo.kakao_user_id || undefined,
          naver_user_id: userInfo.naver_user_id || undefined,
          google_user_id: userInfo.google_user_id || undefined,
        };



        setUserData(profileData);





        setError(null);
      } catch (err) {
        console.error("사용자 정보 로드 실패:", err);
        setError("사용자 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && user) {
      loadUserData();
    }
  }, [user, authLoading]);



  // 세금계산서 이메일 변경 처리
  const handleTaxInvoiceEmailChange = async (emailData: {
    name: string;
    phone: string;
    email: string;
  }) => {
    try {
      // API 호출로 세금계산서 담당자 정보만 업데이트
      await updateUserInfo({
        taxInvoiceInfo: {
          manager: emailData.name,
          contact: emailData.phone,
          email: emailData.email,
          },
        });

      // 로컬 상태 업데이트 (세금계산서 담당자 정보만)
      setUserData((prev) => ({
      ...prev,
        taxInvoiceInfo: {
          manager: emailData.name,
          contact: emailData.phone,
          email: emailData.email,
        },
      }));
    } catch (error) {
      console.error("세금계산서 이메일 변경 오류:", error);
      throw error;
    }
  };





































  // 탭별 콘텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case "memberInfo":
        return (
          <MemberInfoTab
            userData={userData}
            onUserDataUpdate={(newData) =>
              setUserData((prev) => ({ ...prev, ...newData }))
            }
            isSaving={isSaving}
            setIsSaving={setIsSaving}
          />
        );
      case "businessInfo":
        return (
          <BusinessInfoTab
            userData={userData}
            isSaving={isSaving}
            onUserDataUpdate={(newData) =>
              setUserData((prev) => ({ ...prev, ...newData }))
            }
            getBusinessTypeText={getBusinessTypeText}
            hasCompanyInfo={hasCompanyInfo}
            getApprovalStatusText={getApprovalStatusText}
            getApprovalStatusColor={getApprovalStatusColor}
          />
        );
      case "password":
    return (
          <PasswordTab
            isSaving={isSaving}
            setIsSaving={setIsSaving}
          />
        );
      case "taxInvoice":
        return (
          <TaxInvoiceTab
            userData={userData}
            onInvoiceEmailChange={handleTaxInvoiceEmailChange}
          />
        );
      default:
        return null;
    }
  };













  // 로딩 중이거나 인증되지 않은 경우
  if (authLoading || isLoading) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 발생 시
  if (error) {
    return (
      <div className="p-4 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">오류 발생</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  onClick={() => window.location.reload()}
                >
                  다시 시도
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdvertiserLoginRequiredGuard>
      <div className="p-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1
            className="text-2xl font-semibold"
            style={{
              color: "#000000",
              fontFamily: '"Noto Sans KR"',
              fontSize: "24px",
              fontWeight: 600,
              lineHeight: "120%",
              letterSpacing: "-0.48px",
              margin: 0,
            }}
          >
            마이페이지
          </h1>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex gap-6 border-b border-gray-200 mb-8">
          <button
            className={`pb-3 px-1 font-medium text-sm transition-colors duration-200 relative ${
              activeTab === "memberInfo"
                ? "text-blue-500"
                : "text-gray-500 hover:text-blue-500"
            }`}
            onClick={() => setActiveTab("memberInfo")}
          >
            회원정보변경
            {activeTab === "memberInfo" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            className={`pb-3 px-1 font-medium text-sm transition-colors duration-200 relative ${
              activeTab === "businessInfo"
                ? "text-blue-500"
                : "text-gray-500 hover:text-blue-500"
            }`}
            onClick={() => setActiveTab("businessInfo")}
          >
            사업자정보변경
            {activeTab === "businessInfo" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            className={`pb-3 px-1 font-medium text-sm transition-colors duration-200 relative ${
              activeTab === "password"
                ? "text-blue-500"
                : "text-gray-500 hover:text-blue-500"
            }`}
            onClick={() => setActiveTab("password")}
          >
            비밀번호변경
            {activeTab === "password" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            className={`pb-3 px-1 font-medium text-sm transition-colors duration-200 relative ${
              activeTab === "taxInvoice"
                ? "text-blue-500"
                : "text-gray-500 hover:text-blue-500"
            }`}
            onClick={() => setActiveTab("taxInvoice")}
          >
            세금계산서
            {activeTab === "taxInvoice" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
            )}
          </button>
          <button
            className="pb-3 px-1 font-medium text-sm transition-colors duration-200 relative text-gray-500 hover:text-blue-500"
            onClick={() => {
              setIsComingSoonModalOpen(true);
            }}
          >
            보안 로그인
          </button>
        </div>

        {/* 탭 콘텐츠 */}
        <div>{renderTabContent()}</div>

        {/* 모달들 (기존 코드 유지) */}





















        {/* 준비중 모달 */}
        {isComingSoonModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto">
              <div className="text-center">
                <div className="text-gray-400 text-6xl mb-4">🔒</div>
                <h2 className="text-xl font-semibold text-black mb-2">
                  보안 로그인
                </h2>
                <p className="text-gray-600 mb-6">
                  준비중입니다
                </p>
                <button
                  onClick={() => setIsComingSoonModalOpen(false)}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </AdvertiserLoginRequiredGuard>
  );
}
