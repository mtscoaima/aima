"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatKSTDateTime } from "@/lib/utils";
import { getUserInfo, UserInfoResponse } from "@/lib/api";
import { AdvertiserLoginRequiredGuard } from "@/components/RoleGuard";

// 회원정보 데이터 타입
interface UserProfileData {
  // 개인 정보
  name: string;
  email: string;
  phoneNumber: string;
  joinDate: string;
  lastLoginDate?: string;

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
    businessNumberCertificate?: {
      fileName: string;
      fileUrl: string;
      uploadedAt: string;
    };
  };

  // 인덱스 시그니처 추가
  [key: string]: string | boolean | object | undefined;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 사용자 프로필 데이터
  const [userData, setUserData] = useState<UserProfileData>({
    name: "",
    email: "",
    phoneNumber: "",
    joinDate: "",
    lastLoginDate: "",
    companyName: "아이마테크놀로지",
    representativeName: "김대표",
    businessNumber: "123-45-67890",
    address: "서울특별시 강남구 테헤란로 123, 아이마빌딩 5층",
    phoneNumberCompany: "02-1234-5678",
    customerServiceNumber: "1588-1234",
    faxNumber: "02-1234-5679",
    homepage: "https://www.aimatech.co.kr",
    businessType: "정보통신업",
    documents: {
      businessRegistration: {
        fileName: "사업자등록증.pdf",
        fileUrl: "/docs/business-registration.pdf",
        uploadedAt: "2024-01-10T09:00:00Z",
      },
      businessNumberCertificate: {
        fileName: "사업자등록번호부여서류.pdf",
        fileUrl: "/docs/business-number-certificate.pdf",
        uploadedAt: "2024-01-10T09:05:00Z",
      },
    },
  });

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);

        // 실제 Supabase에서 사용자 정보 가져오기
        const userInfo: UserInfoResponse = await getUserInfo();

        // API 응답을 UserProfileData 형식으로 변환
        const profileData: UserProfileData = {
          name: userInfo.name || "",
          email: userInfo.email || "",
          phoneNumber: userInfo.phoneNumber || "",
          joinDate: userInfo.createdAt
            ? new Date(userInfo.createdAt).toLocaleDateString("ko-KR")
            : "",
          lastLoginDate: userInfo.lastLoginAt
            ? new Date(userInfo.lastLoginAt).toLocaleString("ko-KR")
            : "",
          // 기업 정보
          companyName: userInfo.companyInfo?.companyName || "아이마테크놀로지",
          representativeName: userInfo.companyInfo?.ceoName || "김대표",
          businessNumber:
            userInfo.companyInfo?.businessNumber || "123-45-67890",
          address:
            userInfo.companyInfo?.companyAddress ||
            "서울특별시 강남구 테헤란로 123, 아이마빌딩 5층",
          phoneNumberCompany:
            userInfo.companyInfo?.companyPhone || "02-1234-5678",
          customerServiceNumber:
            userInfo.companyInfo?.customerServiceNumber || "1588-1234",
          faxNumber: "02-1234-5679", // API에 없는 필드는 기본값 사용
          homepage: "https://www.aimatech.co.kr", // API에 없는 필드는 기본값 사용
          businessType: "정보통신업", // API에 없는 필드는 기본값 사용
          // 제출 서류 정보
          documents: userInfo.documents
            ? {
                businessRegistration: userInfo.documents.businessRegistration,
                businessNumberCertificate: userInfo.documents
                  .employmentCertificate
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
                businessNumberCertificate: {
                  fileName: "사업자등록번호부여서류.pdf",
                  fileUrl: "/docs/business-number-certificate.pdf",
                  uploadedAt: "2024-01-10T09:05:00Z",
                },
              },
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
              color: "#1681ff",
              fontFamily: '"Noto Sans KR"',
              fontSize: "24px",
              fontWeight: 600,
              lineHeight: "120%",
              letterSpacing: "-0.48px",
              margin: 0,
            }}
          >
            회원정보 관리
          </h1>
        </div>

        {/* 회원정보관리 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-t-4 border-t-blue-500">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-black">회원정보관리</h2>
            <button
              onClick={() => {
                // 회원정보 수정 기능 구현 예정
                console.log("회원정보 수정 클릭");
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
            >
              회원정보 수정
            </button>
          </div>

          {/* 회원정보 현황 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
              회원정보 현황
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">이름</p>
                <p className="font-medium text-black">{userData.name || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">이메일</p>
                <p className="font-medium text-black">
                  {userData.email || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">휴대폰 번호</p>
                <p className="font-medium text-black">
                  {userData.phoneNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">가입일</p>
                <p className="font-medium text-black">
                  {userData.joinDate || "-"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">최근 로그인</p>
                <p className="font-medium text-black">
                  {userData.lastLoginDate || "-"}
                </p>
              </div>
            </div>
          </div>

          {/* 비밀번호 변경 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
              비밀번호 변경
            </h3>

            <div className="flex items-center mt-4">
              <span className="text-red-500 text-xl mr-2">✕</span>
            </div>
          </div>

          {/* 회원 탈퇴 */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
              회원 탈퇴
            </h3>

            <div className="flex items-center mt-4">
              <span className="text-red-500 text-xl mr-2">✕</span>
            </div>
          </div>
        </div>

        {/* 기업정보인증 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-t-4 border-t-green-500">
          <h2 className="text-xl font-semibold mb-6 text-black">
            기업정보인증
          </h2>

          {/* 인증 정보 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
              인증 정보
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">사업자등록번호</p>
                <p className="font-medium text-black">
                  {userData.businessNumber}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">회사명</p>
                <p className="font-medium text-black">{userData.companyName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">대표자명</p>
                <p className="font-medium text-black">
                  {userData.representativeName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">대표번호</p>
                <p className="font-medium text-black">
                  {userData.phoneNumberCompany}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">회사주소</p>
                <p className="font-medium text-black">{userData.address}</p>
              </div>
            </div>
          </div>

          {/* 제출 서류 */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
              제출 서류
            </h3>
            <div className="space-y-4">
              {userData.documents?.businessRegistration && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center">
                    <svg
                      className="w-8 h-8 text-red-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-black">
                        {userData.documents.businessRegistration.fileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        업로드일:{" "}
                        {formatKSTDateTime(
                          userData.documents.businessRegistration.uploadedAt
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-2">✕</span>
                  </div>
                </div>
              )}

              {userData.documents?.businessNumberCertificate && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center">
                    <svg
                      className="w-8 h-8 text-blue-500 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium text-black">
                        {userData.documents.businessNumberCertificate.fileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        업로드일:{" "}
                        {formatKSTDateTime(
                          userData.documents.businessNumberCertificate
                            .uploadedAt
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className="text-red-500 text-xl mr-2">✕</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdvertiserLoginRequiredGuard>
  );
}
