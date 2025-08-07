"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserInfo,
  UserInfoResponse,
  updateUserInfo,
  changePassword,
  withdrawUser,
  tokenManager,
} from "@/lib/api";
import { AdvertiserLoginRequiredGuard } from "@/components/RoleGuard";
import { useRouter, useSearchParams } from "next/navigation";

// 회원정보 데이터 타입
interface UserProfileData {
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

  // 인덱스 시그니처 추가
  [key: string]: string | boolean | object | undefined;
}

// 기업정보 수정 가능한 필드들을 위한 타입
interface EditableCompanyData {
  companyName: string;
  representativeName: string;
  businessNumber: string;
  address: string;
  phoneNumberCompany: string;
  customerServiceNumber: string;
  faxNumber: string;
  homepage: string;
  businessType: string;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState<
    | "memberInfo"
    | "businessInfo"
    | "password"
    | "sendingNumber"
    | "taxInvoice"
    | "발신번호관리"
  >("memberInfo");

  // 모달 상태 관리
  const [isCompanyEditModalOpen, setIsCompanyEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isWithdrawalCompleteModalOpen, setIsWithdrawalCompleteModalOpen] =
    useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 휴대폰 변경 관련 상태
  const [
    isPhoneChangeVerificationLoading,
    setIsPhoneChangeVerificationLoading,
  ] = useState(false);

  // 세금계산서 이메일 변경 모달 상태
  const [isTaxInvoiceEmailModalOpen, setIsTaxInvoiceEmailModalOpen] =
    useState(false);
  const [taxInvoiceEmailData, setTaxInvoiceEmailData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // 세금계산서 담당자 편집 데이터
  const [editTaxInvoiceData, setEditTaxInvoiceData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  // 재직증명서 수정 모달 상태
  const [isEmploymentCertModalOpen, setIsEmploymentCertModalOpen] =
    useState(false);
  const [employmentCertFile, setEmploymentCertFile] = useState<File | null>(
    null
  );
  const [isEmploymentCertUploading, setIsEmploymentCertUploading] =
    useState(false);

  // 세금계산서 관련 상태
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [taxInvoices, setTaxInvoices] = useState<any[]>([]);
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

  // SNS 연동 상태
  const [snsLinkedAccounts, setSnsLinkedAccounts] = useState({
    kakao: false,
    naver: false,
    google: false,
  });

  // SNS 연동 로딩 상태
  const [snsLinking, setSnsLinking] = useState({
    kakao: false,
    naver: false,
    google: false,
  });

  // 기업정보 수정 가능한 필드들의 상태
  const [editableCompanyData, setEditableCompanyData] =
    useState<EditableCompanyData>({
      companyName: "",
      representativeName: "",
      businessNumber: "",
      address: "",
      phoneNumberCompany: "",
      customerServiceNumber: "",
      faxNumber: "",
      homepage: "",
      businessType: "",
    });

  // 파일 업로드 상태
  const [uploadFiles, setUploadFiles] = useState<{
    businessRegistration?: File;
    employmentCertificate?: File;
  }>({});

  const [uploadProgress, setUploadProgress] = useState<{
    businessRegistration?: boolean;
    employmentCertificate?: boolean;
  }>({});

  // 비밀번호 변경 모달 상태
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 비밀번호 변경 에러 상태
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: "",
  });

  // SNS 연동 함수들
  const handleSocialLink = async (socialType: "kakao" | "naver" | "google") => {
    try {
      setSnsLinking((prev) => ({ ...prev, [socialType]: true }));

      let accessToken: string;

      // 각 소셜 로그인 타입에 따라 토큰 획득
      if (socialType === "kakao") {
        accessToken = await getKakaoAccessToken();
      } else if (socialType === "naver") {
        accessToken = await getNaverAccessToken();
      } else {
        accessToken = await getGoogleAccessToken();
      }

      // API 호출하여 계정 연동
      const { tokenManager } = await import("@/lib/api");
      const token = tokenManager.getAccessToken();

      const response = await fetch("/api/users/social-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          socialType,
          accessToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnsLinkedAccounts((prev) => ({ ...prev, [socialType]: true }));
        alert(data.message);
      } else {
        if (response.status === 409) {
          if (data.existingUser) {
            alert(
              `이미 다른 계정(${data.existingUser.email})에 연동된 ${
                socialType === "kakao"
                  ? "카카오"
                  : socialType === "naver"
                  ? "네이버"
                  : "구글"
              } 계정입니다.`
            );
          } else {
            alert(data.message);
          }
        } else {
          alert(data.message || "SNS 계정 연동에 실패했습니다.");
        }
      }
    } catch (error) {
      console.error("SNS 연동 오류:", error);
      alert("SNS 계정 연동 중 오류가 발생했습니다.");
    } finally {
      setSnsLinking((prev) => ({ ...prev, [socialType]: false }));
    }
  };

  const handleSocialUnlink = async (
    socialType: "kakao" | "naver" | "google"
  ) => {
    try {
      const confirmed = window.confirm(
        `${
          socialType === "kakao"
            ? "카카오"
            : socialType === "naver"
            ? "네이버"
            : "구글"
        } 계정 연동을 해제하시겠습니까?`
      );

      if (!confirmed) return;

      const { tokenManager } = await import("@/lib/api");
      const token = tokenManager.getAccessToken();

      const response = await fetch(
        `/api/users/social-link?type=${socialType}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSnsLinkedAccounts((prev) => ({ ...prev, [socialType]: false }));
        alert(data.message);
      } else {
        alert(data.message || "SNS 계정 연동 해제에 실패했습니다.");
      }
    } catch (error) {
      console.error("SNS 연동 해제 오류:", error);
      alert("SNS 계정 연동 해제 중 오류가 발생했습니다.");
    }
  };

  // 카카오 액세스 토큰 획득
  const getKakaoAccessToken = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      let popup: Window | null = null;

      try {
        // 카카오 인증 URL 가져오기
        const authUrlResponse = await fetch("/api/auth/kakao-auth-url");
        if (!authUrlResponse.ok) {
          reject(new Error("카카오 인증 URL을 가져올 수 없습니다"));
          return;
        }
        const { authUrl } = await authUrlResponse.json();

        popup = window.open(
          authUrl,
          "kakaoAuth",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        if (!popup) {
          reject(new Error("팝업이 차단되었습니다"));
          return;
        }
      } catch (error) {
        reject(error);
        return;
      }

      const checkClosed = setInterval(async () => {
        try {
          if (!popup || popup.closed) {
            clearInterval(checkClosed);
            reject(new Error("인증이 취소되었습니다"));
            return;
          }

          const url = popup.location.href;
          if (url.includes("code=")) {
            const urlParams = new URLSearchParams(popup.location.search);
            const code = urlParams.get("code");
            if (code) {
              popup.close();
              clearInterval(checkClosed);

              // 토큰 요청
              const tokenResponse = await fetch("/api/auth/kakao-token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ code }),
              });

              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                resolve(tokenData.access_token);
              } else {
                reject(new Error("토큰 요청 실패"));
              }
            }
          }
        } catch {
          // 팝업이 다른 도메인에 있을 때는 접근할 수 없음 (정상)
        }
      }, 1000);
    });
  };

  // 네이버 액세스 토큰 획득
  const getNaverAccessToken = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      let popup: Window | null = null;
      let state: string = "";

      try {
        // 네이버 인증 URL 가져오기
        const authUrlResponse = await fetch("/api/auth/naver-auth-url");
        if (!authUrlResponse.ok) {
          reject(new Error("네이버 인증 URL을 가져올 수 없습니다"));
          return;
        }
        const authUrlData = await authUrlResponse.json();
        state = authUrlData.state;

        popup = window.open(
          authUrlData.authUrl,
          "naverAuth",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        if (!popup) {
          reject(new Error("팝업이 차단되었습니다"));
          return;
        }
      } catch (error) {
        reject(error);
        return;
      }

      const checkClosed = setInterval(async () => {
        try {
          if (!popup || popup.closed) {
            clearInterval(checkClosed);
            reject(new Error("인증이 취소되었습니다"));
            return;
          }

          const url = popup.location.href;
          if (url.includes("code=")) {
            const urlParams = new URLSearchParams(popup.location.search);
            const code = urlParams.get("code");
            const returnedState = urlParams.get("state");

            if (code && returnedState && returnedState === state) {
              popup.close();
              clearInterval(checkClosed);

              // 토큰 요청
              const tokenResponse = await fetch("/api/auth/naver-token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ code, state: returnedState }),
              });

              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                resolve(tokenData.access_token);
              } else {
                reject(new Error("토큰 요청 실패"));
              }
            }
          }
        } catch {
          // 팝업이 다른 도메인에 있을 때는 접근할 수 없음 (정상)
        }
      }, 1000);
    });
  };

  // 구글 액세스 토큰 획득
  const getGoogleAccessToken = async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      let popup: Window | null = null;

      try {
        // 구글 인증 URL 가져오기
        const authUrlResponse = await fetch("/api/auth/google-auth-url");
        if (!authUrlResponse.ok) {
          reject(new Error("구글 인증 URL을 가져올 수 없습니다"));
          return;
        }
        const { authUrl } = await authUrlResponse.json();

        popup = window.open(
          authUrl,
          "googleAuth",
          "width=500,height=600,scrollbars=yes,resizable=yes"
        );

        if (!popup) {
          reject(new Error("팝업이 차단되었습니다"));
          return;
        }
      } catch (error) {
        reject(error);
        return;
      }

      const checkClosed = setInterval(async () => {
        try {
          if (!popup || popup.closed) {
            clearInterval(checkClosed);
            reject(new Error("인증이 취소되었습니다"));
            return;
          }

          const url = popup.location.href;
          if (url.includes("code=")) {
            const urlParams = new URLSearchParams(popup.location.search);
            const code = urlParams.get("code");
            if (code) {
              popup.close();
              clearInterval(checkClosed);

              // 토큰 요청
              const tokenResponse = await fetch("/api/auth/google-token", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ code }),
              });

              if (tokenResponse.ok) {
                const tokenData = await tokenResponse.json();
                resolve(tokenData.access_token);
              } else {
                reject(new Error("토큰 요청 실패"));
              }
            }
          }
        } catch {
          // 팝업이 다른 도메인에 있을 때는 접근할 수 없음 (정상)
        }
      }, 1000);
    });
  };

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

  // 승인 상태 표시 함수
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
        tab === "sendingNumber" ||
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
        };

        // SNS 연동 상태 확인 (userInfo에서 소셜 ID가 있는지 확인)
        setSnsLinkedAccounts({
          kakao: !!userInfo.kakao_user_id,
          naver: !!userInfo.naver_user_id,
          google: !!userInfo.google_user_id,
        });

        setUserData(profileData);

        // 기업정보 수정 가능한 필드들 초기화
        setEditableCompanyData({
          companyName: profileData.companyName || "",
          representativeName: profileData.representativeName || "",
          businessNumber: profileData.businessNumber || "",
          address: profileData.address || "",
          phoneNumberCompany: profileData.phoneNumberCompany || "",
          customerServiceNumber: profileData.customerServiceNumber || "",
          faxNumber: profileData.faxNumber || "",
          homepage: profileData.homepage || "",
          businessType: profileData.businessType || "",
        });

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

  // 휴대폰 번호 업데이트 처리
  const handlePhoneUpdate = useCallback(async (newPhoneNumber: string) => {
    try {
      // 휴대폰 번호 업데이트
      await updateUserInfo({
        phoneNumber: newPhoneNumber,
      });

      // 로컬 상태 업데이트
      setUserData((prev) => ({
        ...prev,
        phoneNumber: newPhoneNumber,
      }));

      alert("휴대폰 번호가 성공적으로 변경되었습니다.");

      // 로딩 상태 초기화
      setIsPhoneChangeVerificationLoading(false);
    } catch (error) {
      console.error("휴대폰 번호 변경 실패:", error);
      alert("휴대폰 번호 변경에 실패했습니다. 다시 시도해주세요.");
    }
  }, []);

  // 세금계산서 목록 조회
  const fetchTaxInvoices = useCallback(
    async (page = 1) => {
      if (!user) return;

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
        setTaxInvoicePagination(data.pagination);
      } catch (error) {
        console.error("세금계산서 조회 오류:", error);
        setTaxInvoiceError(
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setTaxInvoiceLoading(false);
      }
    },
    [user, taxInvoicePagination.itemsPerPage, taxInvoiceFilters]
  );

  // 세금계산서 엑셀 다운로드
  const downloadTaxInvoiceExcel = useCallback(async () => {
    if (!user) return;

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
  }, [user, taxInvoiceFilters]);

  // 세금계산서 페이지 변경
  const handleTaxInvoicePageChange = (page: number) => {
    setTaxInvoicePagination((prev) => ({ ...prev, currentPage: page }));
    fetchTaxInvoices(page);
  };

  // 세금계산서 필터 변경
  const handleTaxInvoiceFilterChange = (
    newFilters: typeof taxInvoiceFilters
  ) => {
    setTaxInvoiceFilters(newFilters);
    setTaxInvoicePagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // 세금계산서 필터 초기화
  const resetTaxInvoiceFilters = () => {
    setTaxInvoiceFilters({ startDate: "", endDate: "" });
    setTaxInvoicePagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // 세금계산서 탭 활성화 시 데이터 로드
  useEffect(() => {
    if (activeTab === "taxInvoice" && user) {
      fetchTaxInvoices();
    }
  }, [activeTab, user, fetchTaxInvoices]);

  // 세금계산서 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    if (activeTab === "taxInvoice" && user) {
      fetchTaxInvoices(1);
    }
  }, [taxInvoiceFilters, activeTab, user, fetchTaxInvoices]);

  // 휴대폰 변경 본인인증 팝업 메시지 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "inicis-auth-success") {
        // 본인인증 성공
        const { userInfo } = event.data;

        // 현재 휴대폰 번호와 다른 번호인지 확인
        if (userInfo.phoneNumber === userData.phoneNumber) {
          alert("현재 휴대폰 번호와 동일합니다. 다른 번호로 인증해주세요.");
          return;
        }

        // 휴대폰 번호 업데이트
        handlePhoneUpdate(userInfo.phoneNumber);
      } else if (event.data.type === "inicis-auth-failed") {
        // 본인인증 실패
        alert(`본인인증에 실패했습니다: ${event.data.resultMsg}`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [userData.phoneNumber, handlePhoneUpdate]);

  // 기업정보 수정 모달 닫기
  const handleCompanyModalClose = () => {
    setIsCompanyEditModalOpen(false);
    setEditableCompanyData({
      companyName: userData.companyName || "",
      representativeName: userData.representativeName || "",
      businessNumber: userData.businessNumber || "",
      address: userData.address || "",
      phoneNumberCompany: userData.phoneNumberCompany || "",
      customerServiceNumber: userData.customerServiceNumber || "",
      faxNumber: userData.faxNumber || "",
      homepage: userData.homepage || "",
      businessType: userData.businessType || "",
    });
  };

  // 기업정보 수정 가능한 필드 값 변경
  const handleEditableCompanyDataChange = (
    field: keyof EditableCompanyData,
    value: string
  ) => {
    setEditableCompanyData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 파일 업로드 처리
  const handleFileUpload = (
    fileType: "businessRegistration" | "employmentCertificate",
    file: File
  ) => {
    setUploadFiles((prev) => ({
      ...prev,
      [fileType]: file,
    }));
  };

  // 파일 제거 처리
  const handleFileRemove = (
    fileType: "businessRegistration" | "employmentCertificate"
  ) => {
    setUploadFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[fileType];
      return newFiles;
    });
  };

  // 파일 업로드 API 호출
  const uploadFileToServer = async (files: {
    businessRegistration?: File;
    employmentCertificate?: File;
  }): Promise<{
    [key: string]: { fileName: string; fileUrl: string; uploadedAt: string };
  }> => {
    const token = tokenManager.getAccessToken();
    if (!token) {
      throw new Error("로그인이 필요합니다.");
    }

    const formData = new FormData();

    if (files.businessRegistration) {
      formData.append("businessRegistration", files.businessRegistration);
    }
    if (files.employmentCertificate) {
      formData.append("employmentCertificate", files.employmentCertificate);
    }

    try {
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
      return result.documents;
    } catch (error) {
      console.error("파일 업로드 에러:", error);
      throw error;
    }
  };

  // 기업정보 저장 처리
  const handleCompanySave = async () => {
    try {
      setIsSaving(true);

      // 입력 검증
      if (!editableCompanyData.companyName.trim()) {
        alert("회사명을 입력해주세요.");
        return;
      }
      if (!editableCompanyData.representativeName.trim()) {
        alert("대표자명을 입력해주세요.");
        return;
      }
      if (!editableCompanyData.businessNumber.trim()) {
        alert("사업자등록번호를 입력해주세요.");
        return;
      }
      if (!editableCompanyData.address.trim()) {
        alert("주소를 입력해주세요.");
        return;
      }

      // 파일 업로드 처리
      let uploadedDocuments: {
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
      } = {};

      // 업로드할 파일이 있는 경우
      const filesToUpload: {
        businessRegistration?: File;
        employmentCertificate?: File;
      } = {};

      if (uploadFiles.businessRegistration) {
        filesToUpload.businessRegistration = uploadFiles.businessRegistration;
      }
      if (uploadFiles.employmentCertificate) {
        filesToUpload.employmentCertificate = uploadFiles.employmentCertificate;
      }

      if (Object.keys(filesToUpload).length > 0) {
        setUploadProgress((prev) => ({
          ...prev,
          businessRegistration: !!filesToUpload.businessRegistration,
          employmentCertificate: !!filesToUpload.employmentCertificate,
        }));

        try {
          uploadedDocuments = await uploadFileToServer(filesToUpload);
        } catch {
          alert("파일 업로드에 실패했습니다.");
          return;
        } finally {
          setUploadProgress((prev) => ({
            ...prev,
            businessRegistration: false,
            employmentCertificate: false,
          }));
        }
      }

      const updatePayload = {
        companyName: editableCompanyData.companyName,
        representativeName: editableCompanyData.representativeName,
        businessNumber: editableCompanyData.businessNumber,
        address: editableCompanyData.address,
        phoneNumberCompany: editableCompanyData.phoneNumberCompany,
        customerServiceNumber: editableCompanyData.customerServiceNumber,
        businessType: editableCompanyData.businessType,
        faxNumber: editableCompanyData.faxNumber,
        homepage: editableCompanyData.homepage,
        documents:
          Object.keys(uploadedDocuments).length > 0
            ? uploadedDocuments
            : undefined,
      };

      await updateUserInfo(updatePayload);

      // 로컬 상태 업데이트
      setUserData((prev) => ({
        ...prev,
        companyName: editableCompanyData.companyName,
        representativeName: editableCompanyData.representativeName,
        businessNumber: editableCompanyData.businessNumber,
        address: editableCompanyData.address,
        phoneNumberCompany: editableCompanyData.phoneNumberCompany,
        customerServiceNumber: editableCompanyData.customerServiceNumber,
        faxNumber: editableCompanyData.faxNumber,
        homepage: editableCompanyData.homepage,
        businessType: editableCompanyData.businessType,
        approval_status: "PENDING", // 승인 상태도 업데이트
        documents:
          Object.keys(uploadedDocuments).length > 0
            ? { ...prev.documents, ...uploadedDocuments }
            : prev.documents,
      }));

      // 업로드된 파일 상태 초기화
      setUploadFiles({});

      // 성공 메시지 표시
      alert("기업정보가 성공적으로 수정되었습니다.");

      setIsCompanyEditModalOpen(false);

      // 페이지 새로고침하여 최신 데이터 로드
      window.location.reload();
    } catch (error) {
      console.error("기업정보 수정 실패:", error);
      alert("기업정보 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  // 비밀번호 변경 모달 닫기
  const handlePasswordModalClose = () => {
    setIsPasswordModalOpen(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      general: "",
    });
  };

  // 비밀번호 변경 데이터 입력 처리
  const handlePasswordDataChange = (
    field: keyof typeof passwordData,
    value: string
  ) => {
    const newPasswordData = {
      ...passwordData,
      [field]: value,
    };

    setPasswordData(newPasswordData);

    // 입력 시 해당 필드 에러 메시지 초기화
    const newErrors = {
      ...passwordErrors,
      [field]: "",
      general: "", // 일반 에러도 함께 초기화
    };

    // 실시간 검증 추가
    if (field === "newPassword" && value.length > 0) {
      if (value.length < 8) {
        newErrors.newPassword = "새 비밀번호는 8자 이상이어야 합니다.";
      } else if (value.length > 20) {
        newErrors.newPassword = "새 비밀번호는 20자 이하여야 합니다.";
      } else {
        // 영문, 숫자, 특수기호 조합 검증
        const hasLetter = /[a-zA-Z]/.test(value);
        const hasNumber = /\d/.test(value);
        const hasSpecialChar = /[~!@#$%^&*()_\-=+[{\]}'"\\;:/?.>,<]/.test(
          value
        );

        if (!(hasLetter && hasNumber && hasSpecialChar)) {
          newErrors.newPassword =
            "영문, 숫자, 특수기호를 모두 포함해야 합니다.";
        } else if (/(.)\1{3,}/.test(value)) {
          newErrors.newPassword =
            "동일한 문자가 4개 이상 연속으로 사용될 수 없습니다.";
        } else {
          // 연속된 문자 검증
          let hasConsecutive = false;
          for (let i = 0; i <= value.length - 4; i++) {
            const slice = value.slice(i, i + 4);
            let isConsecutive = true;

            for (let j = 1; j < slice.length; j++) {
              if (slice.charCodeAt(j) !== slice.charCodeAt(j - 1) + 1) {
                isConsecutive = false;
                break;
              }
            }

            if (isConsecutive) {
              hasConsecutive = true;
              break;
            }
          }

          if (hasConsecutive) {
            newErrors.newPassword =
              "연속된 문자가 4개 이상 사용될 수 없습니다.";
          }
        }
      }
    }

    if (
      field === "confirmPassword" &&
      value.length > 0 &&
      value !== newPasswordData.newPassword
    ) {
      newErrors.confirmPassword = "새 비밀번호가 일치하지 않습니다.";
    }

    // 새 비밀번호가 변경되면 확인 비밀번호도 다시 검증
    if (
      field === "newPassword" &&
      passwordData.confirmPassword.length > 0 &&
      value !== passwordData.confirmPassword
    ) {
      newErrors.confirmPassword = "새 비밀번호가 일치하지 않습니다.";
    }

    setPasswordErrors(newErrors);
  };

  // 비밀번호 변경 처리
  const handlePasswordChange = async () => {
    try {
      setIsSaving(true);

      // 에러 상태 초기화
      setPasswordErrors({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        general: "",
      });

      let hasError = false;
      const newErrors = {
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        general: "",
      };

      // 입력 검증
      if (!passwordData.currentPassword.trim()) {
        newErrors.currentPassword = "현재 비밀번호를 입력해주세요.";
        hasError = true;
      }
      if (!passwordData.newPassword.trim()) {
        newErrors.newPassword = "새 비밀번호를 입력해주세요.";
        hasError = true;
      } else if (passwordData.newPassword.length < 8) {
        newErrors.newPassword = "새 비밀번호는 8자 이상이어야 합니다.";
        hasError = true;
      } else if (passwordData.newPassword.length > 20) {
        newErrors.newPassword = "새 비밀번호는 20자 이하여야 합니다.";
        hasError = true;
      } else {
        // 영문, 숫자, 특수기호 조합 검증
        const hasLetter = /[a-zA-Z]/.test(passwordData.newPassword);
        const hasNumber = /\d/.test(passwordData.newPassword);
        const hasSpecialChar = /[~!@#$%^&*()_\-=+[{\]}'"\\;:/?.>,<]/.test(
          passwordData.newPassword
        );

        if (!(hasLetter && hasNumber && hasSpecialChar)) {
          newErrors.newPassword =
            "영문, 숫자, 특수기호를 모두 포함해야 합니다.";
          hasError = true;
        } else if (/(.)\1{3,}/.test(passwordData.newPassword)) {
          newErrors.newPassword =
            "동일한 문자가 4개 이상 연속으로 사용될 수 없습니다.";
          hasError = true;
        } else {
          // 연속된 문자 검증
          for (let i = 0; i <= passwordData.newPassword.length - 4; i++) {
            const slice = passwordData.newPassword.slice(i, i + 4);
            let isConsecutive = true;

            for (let j = 1; j < slice.length; j++) {
              if (slice.charCodeAt(j) !== slice.charCodeAt(j - 1) + 1) {
                isConsecutive = false;
                break;
              }
            }

            if (isConsecutive) {
              newErrors.newPassword =
                "연속된 문자가 4개 이상 사용될 수 없습니다.";
              hasError = true;
              break;
            }
          }
        }
      }
      if (!passwordData.confirmPassword.trim()) {
        newErrors.confirmPassword = "새 비밀번호 확인을 입력해주세요.";
        hasError = true;
      } else if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = "새 비밀번호가 일치하지 않습니다.";
        hasError = true;
      }

      if (hasError) {
        setPasswordErrors(newErrors);
        return;
      }

      // 실제 API 호출로 비밀번호 변경
      await changePassword(passwordData);

      // 성공 메시지 표시
      alert(
        "비밀번호가 성공적으로 변경되었습니다. 보안을 위해 다시 로그인해주세요."
      );

      setIsPasswordModalOpen(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);

      // API 에러 메시지 처리
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes("현재 비밀번호가 올바르지 않습니다") ||
          errorMessage.includes("current password is incorrect")
        ) {
          setPasswordErrors({
            currentPassword: "현재 비밀번호가 올바르지 않습니다.",
            newPassword: "",
            confirmPassword: "",
            general: "",
          });
        } else if (
          errorMessage.includes("사용자를 찾을 수 없습니다") ||
          errorMessage.includes("user not found")
        ) {
          setPasswordErrors({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            general: "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
          });
        } else if (
          errorMessage.includes("새 비밀번호가 일치하지 않습니다") ||
          errorMessage.includes("password confirmation failed")
        ) {
          setPasswordErrors({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "새 비밀번호가 일치하지 않습니다.",
            general: "",
          });
        } else if (
          errorMessage.includes("새 비밀번호는 8자 이상이어야 합니다") ||
          errorMessage.includes("password too short")
        ) {
          setPasswordErrors({
            currentPassword: "",
            newPassword: "새 비밀번호는 8자 이상이어야 합니다.",
            confirmPassword: "",
            general: "",
          });
        } else if (errorMessage.includes("로그인이 필요합니다")) {
          setPasswordErrors({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            general: "로그인이 필요합니다. 다시 로그인해주세요.",
          });
        } else {
          setPasswordErrors({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
            general:
              error.message ||
              "비밀번호 변경에 실패했습니다. 다시 시도해주세요.",
          });
        }
      } else {
        setPasswordErrors({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          general: "비밀번호 변경에 실패했습니다. 다시 시도해주세요.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 회원 탈퇴 모달 열기
  const handleWithdrawalClick = () => {
    setIsWithdrawalModalOpen(true);
  };

  // 회원 탈퇴 모달 닫기
  const handleWithdrawalModalClose = () => {
    setIsWithdrawalModalOpen(false);
  };

  // 회원 탈퇴 처리
  const handleWithdrawal = async () => {
    try {
      setIsSaving(true);

      // 간단한 회원 탈퇴 API 호출
      await withdrawUser({
        password: "",
        reason: "",
        customReason: undefined,
      });

      // 탈퇴 모달 닫고 완료 모달 띄우기
      setIsWithdrawalModalOpen(false);
      setIsWithdrawalCompleteModalOpen(true);
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);
      alert("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  // 본인인증을 통한 휴대폰 변경
  const handlePhoneChangeClick = async () => {
    setIsPhoneChangeVerificationLoading(true);

    try {
      // KG이니시스 본인인증 요청 API 호출
      const response = await fetch("/api/auth/inicis-auth/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // 휴대폰 변경을 위한 본인인증임을 명시
          purpose: "phone_change",
        }),
      });

      if (!response.ok) {
        throw new Error("본인인증 요청에 실패했습니다.");
      }

      const data = await response.json();

      // 팝업창 열기
      const width = 400;
      const height = 640;
      const left = (window.innerWidth - width) / 2;
      const top = (window.innerHeight - height) / 2;

      const popup = window.open(
        "",
        "inicis_phone_change_auth",
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
      );

      // 팝업 차단 확인
      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        alert("팝업이 차단되었습니다. 팝업 차단을 해제해주세요.");
        return;
      }

      // 폼 생성 및 제출
      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.authUrl;
      form.target = "inicis_phone_change_auth";

      // 파라미터 추가
      Object.entries(data.params).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      // 폼을 body에 추가하고 제출
      document.body.appendChild(form);
      form.submit();

      // 폼 제거
      document.body.removeChild(form);
    } catch (error) {
      console.error("본인인증 요청 오류:", error);
      alert("본인인증 요청 중 오류가 발생했습니다.");
    } finally {
      setIsPhoneChangeVerificationLoading(false);
    }
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

  // userData가 변경될 때 editTaxInvoiceData 초기화 (세금계산서 담당자 정보에서)
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
  }, [
    userData.taxInvoiceInfo,
    userData.name,
    userData.phoneNumber,
    userData.email,
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
      setIsSaving(true);

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

      // API 호출로 세금계산서 담당자 정보만 업데이트
      await updateUserInfo({
        taxInvoiceInfo: {
          manager: editTaxInvoiceData.name,
          contact: editTaxInvoiceData.phone,
          email: editTaxInvoiceData.email,
        },
      });

      // 로컬 상태 업데이트 (세금계산서 담당자 정보만)
      setUserData((prev) => ({
        ...prev,
        taxInvoiceInfo: {
          manager: editTaxInvoiceData.name,
          contact: editTaxInvoiceData.phone,
          email: editTaxInvoiceData.email,
        },
      }));

      alert("세금계산서 담당자 정보가 성공적으로 수정되었습니다.");
    } catch (error) {
      console.error("세금계산서 담당자 정보 수정 실패:", error);
      alert("세금계산서 담당자 정보 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  // 세금계산서 이메일 변경 모달 닫기
  const handleTaxInvoiceEmailModalClose = () => {
    setIsTaxInvoiceEmailModalOpen(false);
    setTaxInvoiceEmailData({
      name: "",
      phone: "",
      email: "",
    });
  };

  // 세금계산서 이메일 데이터 변경 처리
  const handleTaxInvoiceEmailDataChange = (field: string, value: string) => {
    setTaxInvoiceEmailData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 세금계산서 이메일 정보 수정 처리
  const handleTaxInvoiceEmailSave = async () => {
    try {
      setIsSaving(true);

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

      // API 호출로 세금계산서 담당자 정보만 업데이트
      await updateUserInfo({
        taxInvoiceInfo: {
          manager: taxInvoiceEmailData.name,
          contact: taxInvoiceEmailData.phone,
          email: taxInvoiceEmailData.email,
        },
      });

      // 로컬 상태 업데이트 (세금계산서 담당자 정보만)
      setUserData((prev) => ({
        ...prev,
        taxInvoiceInfo: {
          manager: taxInvoiceEmailData.name,
          contact: taxInvoiceEmailData.phone,
          email: taxInvoiceEmailData.email,
        },
      }));

      alert("세금계산서 담당자 정보가 성공적으로 수정되었습니다.");
      setIsTaxInvoiceEmailModalOpen(false);
    } catch (error) {
      console.error("담당자 정보 수정 실패:", error);
      alert("담당자 정보 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
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

      // 로컬 상태 업데이트
      setUserData((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          employmentCertificate: result.documents.employmentCertificate,
        },
      }));

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

  // 탭별 콘텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case "memberInfo":
        return renderMemberInfoTab();
      case "businessInfo":
        return renderBusinessInfoTab();
      case "password":
        return renderPasswordTab();
      case "sendingNumber":
        return renderSendingNumberTab();
      case "taxInvoice":
        return renderTaxInvoiceTab();
      default:
        return null;
    }
  };

  // 회원정보변경 탭
  const renderMemberInfoTab = () => (
    <div className="space-y-6">
      {/* 탭 설명 */}
      <p className="text-sm text-gray-600">
        회원님의 정보를 확인 및 변경하실 수 있습니다.
      </p>

      {/* 회원정보관리 섹션 */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black">회원 정보</h2>
        </div>

        {/* 회원정보 현황 */}
        <div className="mb-6">
          <table className="w-full border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32 border-r border-gray-200">
                  아이디
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {userData.username || userData.email || "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32 border-r border-gray-200">
                  이름
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {userData.name || "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32 border-r border-gray-200">
                  담당자 휴대폰
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  <div className="flex items-center">
                    <span>
                      {userData.phoneNumber
                        ? userData.phoneNumber.replace(
                            /(\d{3})(\d{4})(\d{4})/,
                            "$1-$2-$3"
                          )
                        : "-"}
                    </span>
                    <button
                      onClick={handlePhoneChangeClick}
                      disabled={isPhoneChangeVerificationLoading}
                      className="ml-3 px-3 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {isPhoneChangeVerificationLoading
                        ? "처리 중..."
                        : "휴대폰 변경"}
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32 border-r border-gray-200">
                  마케팅정보수신
                </td>
                <td className="py-4 px-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userData.smsMarketing || false}
                          onChange={async (e) => {
                            const newSmsConsent = e.target.checked;
                            setUserData((prev) => ({
                              ...prev,
                              smsMarketing: newSmsConsent,
                            }));
                            // API 호출로 즉시 업데이트
                            try {
                              await updateUserInfo({
                                smsMarketingConsent: newSmsConsent,
                              });
                            } catch (error) {
                              console.error(
                                "SMS 마케팅 동의 업데이트 실패:",
                                error
                              );
                              // 실패 시 이전 상태로 되돌리기
                              setUserData((prev) => ({
                                ...prev,
                                smsMarketing: !newSmsConsent,
                              }));
                              alert(
                                "SMS 마케팅 동의 설정 변경에 실패했습니다."
                              );
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">문자</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userData.emailMarketing || false}
                          onChange={async (e) => {
                            const newEmailConsent = e.target.checked;
                            setUserData((prev) => ({
                              ...prev,
                              emailMarketing: newEmailConsent,
                            }));
                            // API 호출로 즉시 업데이트
                            try {
                              await updateUserInfo({
                                emailMarketingConsent: newEmailConsent,
                              });
                            } catch (error) {
                              console.error(
                                "이메일 마케팅 동의 업데이트 실패:",
                                error
                              );
                              // 실패 시 이전 상태로 되돌리기
                              setUserData((prev) => ({
                                ...prev,
                                emailMarketing: !newEmailConsent,
                              }));
                              alert(
                                "이메일 마케팅 동의 설정 변경에 실패했습니다."
                              );
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          이메일
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">
                      * 수신 동의 시 각종 혜택 및 이벤트 정보를 받아보실 수
                      있습니다.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 회원 탈퇴 링크 */}
        <div className="flex justify-end mt-4">
          <p className="text-sm text-gray-600">
            더 이상 서비스를 이용하지 않을 경우{" "}
            <button
              onClick={handleWithdrawalClick}
              className="text-blue-500 hover:text-blue-700 underline font-medium"
            >
              회원 탈퇴
            </button>
          </p>
        </div>
      </div>

      {/* SNS 연동 섹션 */}
      <div className="mb-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black">SNS 계정 연동</h2>
        </div>

        <div className="mb-6">
          <table className="w-full border border-gray-200">
            <tbody>
              {/* 카카오 연동 */}
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32 border-r border-gray-200">
                  카카오
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  <div className="flex items-center justify-between">
                    <span>
                      {snsLinkedAccounts.kakao ? "연동됨" : "연동되지 않음"}
                    </span>
                    {snsLinkedAccounts.kakao ? (
                      <button
                        onClick={() => handleSocialUnlink("kakao")}
                        className="px-3 py-1 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors duration-200 text-xs font-medium cursor-pointer"
                      >
                        연동 해제
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSocialLink("kakao")}
                        disabled={snsLinking.kakao}
                        className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-200 text-xs font-medium disabled:bg-yellow-300 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {snsLinking.kakao ? "연동 중..." : "연동하기"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>

              {/* 네이버 연동 */}
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32 border-r border-gray-200">
                  네이버
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  <div className="flex items-center justify-between">
                    <span>
                      {snsLinkedAccounts.naver ? "연동됨" : "연동되지 않음"}
                    </span>
                    {snsLinkedAccounts.naver ? (
                      <button
                        onClick={() => handleSocialUnlink("naver")}
                        className="px-3 py-1 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors duration-200 text-xs font-medium cursor-pointer"
                      >
                        연동 해제
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSocialLink("naver")}
                        disabled={snsLinking.naver}
                        className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 text-xs font-medium disabled:bg-green-300 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {snsLinking.naver ? "연동 중..." : "연동하기"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>

              {/* 구글 연동 */}
              <tr>
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32 border-r border-gray-200">
                  구글
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  <div className="flex items-center justify-between">
                    <span>
                      {snsLinkedAccounts.google ? "연동됨" : "연동되지 않음"}
                    </span>
                    {snsLinkedAccounts.google ? (
                      <button
                        onClick={() => handleSocialUnlink("google")}
                        className="px-3 py-1 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors duration-200 text-xs font-medium cursor-pointer"
                      >
                        연동 해제
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSocialLink("google")}
                        disabled={snsLinking.google}
                        className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-xs font-medium disabled:bg-red-300 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {snsLinking.google ? "연동 중..." : "연동하기"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SNS 연동 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-1">SNS 연동 안내</p>
              <ul className="text-blue-700 space-y-1">
                <li>
                  • SNS 계정을 연동하면 해당 계정으로도 로그인할 수 있습니다
                </li>
                <li>• 이미 다른 계정에 연동된 SNS 계정은 연동할 수 없습니다</li>
                <li>• 연동 해제 후에도 기존 계정 정보는 유지됩니다</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 사업자정보변경 탭
  const renderBusinessInfoTab = () => {
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
      </div>
    );
  };

  // 비밀번호변경 탭
  const renderPasswordTab = () => (
    <div className="space-y-6">
      {/* 탭 설명 */}
      <p className="text-sm text-gray-600">
        안전한 서비스 이용을 위해 비밀번호를 변경해주세요.
      </p>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-black">비밀번호 변경</h2>
        </div>

        {/* 비밀번호 변경 수칙 */}
        <div className="mb-6 p-4 bg-red-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-black-800 mb-1">
                비밀번호 변경 수칙
              </p>
              <ul className="text-black-700 space-y-1">
                <li>• 주기적인(3~6개월) 비밀번호 변경</li>
                <li>• 다른 아이디/사이트에서 사용한 적 없는 비밀번호</li>
                <li>• 이전에 사용한 적 없는 비밀번호</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 비밀번호 변경 폼 - 테이블 형식 */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 w-1/4">
                  현재 비밀번호 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        handlePasswordDataChange(
                          "currentPassword",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        passwordErrors.currentPassword
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="현재 비밀번호 입력"
                    />
                    {passwordErrors.currentPassword && (
                      <p className="mt-2 text-sm text-red-600">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-200">
                <td className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 w-1/4">
                  새 비밀번호 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordDataChange("newPassword", e.target.value)
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        passwordErrors.newPassword
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="8~20자 영문, 숫자, 특수기호 조합"
                    />
                    {passwordErrors.newPassword && (
                      <p className="mt-2 text-sm text-red-600">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-200 last:border-b-0">
                <td className="bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 w-1/4">
                  새 비밀번호 확인 <span className="text-red-500">*</span>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handlePasswordDataChange(
                          "confirmPassword",
                          e.target.value
                        )
                      }
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                        passwordErrors.confirmPassword
                          ? "border-red-500 focus:ring-red-500"
                          : "border-gray-300 focus:ring-blue-500"
                      }`}
                      placeholder="새 비밀번호와 동일하게 입력"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-600">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          {/* 일반 에러 메시지 */}
          {passwordErrors.general && (
            <div className="p-4 bg-red-50 rounded-md">
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
                  <p className="text-sm text-red-800">
                    {passwordErrors.general}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 변경 버튼 */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handlePasswordChange}
              disabled={
                isSaving ||
                Object.values(passwordErrors).some((error) => error !== "") ||
                !passwordData.currentPassword.trim() ||
                !passwordData.newPassword.trim() ||
                !passwordData.confirmPassword.trim()
              }
              className="px-8 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? "변경 중..." : "변경"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // 전화번호 형식 변환 함수
  const formatPhoneNumber = (phoneNumber?: string) => {
    if (!phoneNumber) return null;

    // 하이픈이 이미 있는 경우 그대로 반환
    if (phoneNumber.includes("-")) {
      return phoneNumber;
    }

    // 숫자만 추출
    const digitsOnly = phoneNumber.replace(/[^0-9]/g, "");

    // 11자리 010으로 시작하는 번호인 경우 하이픈 형식으로 변환
    if (digitsOnly.length === 11 && digitsOnly.startsWith("010")) {
      return digitsOnly.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
    }

    // 그 외의 경우 원본 반환
    return phoneNumber;
  };

  // 발신번호관리 탭
  // 발신번호 관리 관련 상태
  const [senderNumbers, setSenderNumbers] = useState<
    Array<{
      id: number;
      number: string;
      name: string;
      registrationDate: string;
      status: string;
      isDefault: boolean;
      isVerified?: boolean;
      isUserPhone?: boolean; // 본인 전화번호 여부
    }>
  >([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [defaultNumber, setDefaultNumber] = useState<string>("");
  const [senderNumbersLoading, setSenderNumbersLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(10);

  // 발신번호 모달 상태
  const [isChangeDefaultModalOpen, setIsChangeDefaultModalOpen] =
    useState(false);
  const [isAddNumberModalOpen, setIsAddNumberModalOpen] = useState(false);
  const [selectedDefaultNumber, setSelectedDefaultNumber] = useState<
    number | null
  >(null);
  const [newNumberForm, setNewNumberForm] = useState({
    phoneNumber: "",
    displayName: "",
  });

  // 발신번호 선택/해제 처리
  const handleNumberSelect = (id: number) => {
    setSelectedNumbers((prev) =>
      prev.includes(id) ? prev.filter((num) => num !== id) : [...prev, id]
    );
  };

  // 전체 선택/해제 처리
  const handleSelectAll = () => {
    // 선택 가능한 번호들만 필터링 (기본번호나 본인번호가 아닌 것들)
    const selectableNumbers = senderNumbers.filter(
      (num) => !num.isDefault && !num.isUserPhone
    );

    if (selectedNumbers.length === selectableNumbers.length) {
      setSelectedNumbers([]);
    } else {
      setSelectedNumbers(selectableNumbers.map((num) => num.id));
    }
  };

  // 발신번호 목록 가져오기
  const fetchSenderNumbers = async () => {
    setSenderNumbersLoading(true);
    try {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch("/api/sender-numbers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("발신번호 목록을 불러오는데 실패했습니다");
      }

      const data = await response.json();

      setSenderNumbers(data.senderNumbers || []);
      setDefaultNumber(data.defaultNumber || "");
      setTotalCount(data.totalCount || 0);
      setRemainingCount(data.remainingCount || 10);
    } catch (error) {
      console.error("❌ 발신번호 목록 조회 오류:", error);
      // 실제 환경에서는 toast 알림 등으로 대체
      alert("발신번호 목록을 불러오는데 실패했습니다.");
    } finally {
      setSenderNumbersLoading(false);
    }
  };

  // 컴포넌트 마운트 시 발신번호 목록 가져오기
  useEffect(() => {
    if (activeTab === "sendingNumber") {
      fetchSenderNumbers();
    }
  }, [activeTab]);

  // 발신번호 삭제 처리
  const handleDeleteNumbers = async () => {
    if (selectedNumbers.length === 0) {
      alert("삭제할 발신번호를 선택해주세요.");
      return;
    }

    // 기본번호 삭제 방지 체크
    const defaultNumbers = senderNumbers.filter(
      (num) => selectedNumbers.includes(num.id) && num.isDefault
    );
    if (defaultNumbers.length > 0) {
      alert("기본 발신번호는 삭제할 수 없습니다.");
      return;
    }

    if (!confirm("선택한 발신번호를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch("/api/sender-numbers", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: selectedNumbers }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "발신번호 삭제에 실패했습니다");
      }

      alert("선택한 발신번호가 삭제되었습니다.");
      setSelectedNumbers([]);
      await fetchSenderNumbers(); // 목록 새로고침
    } catch (error) {
      console.error("발신번호 삭제 오류:", error);
      alert(
        error instanceof Error ? error.message : "발신번호 삭제에 실패했습니다."
      );
    }
  };

  // 기본 발신번호 변경 모달 열기
  const openChangeDefaultModal = () => {
    setIsChangeDefaultModalOpen(true);
    // 현재 기본 발신번호 선택
    const currentDefault = senderNumbers.find((num) => num.isDefault);
    setSelectedDefaultNumber(currentDefault?.id || null);
  };

  // 기본 발신번호 변경 처리
  const handleChangeDefaultNumber = async (newDefaultId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch(
        `/api/sender-numbers/${newDefaultId}/set-default`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "기본 발신번호 변경에 실패했습니다"
        );
      }

      alert("기본 발신번호가 변경되었습니다.");
      await fetchSenderNumbers(); // 목록 새로고침
    } catch (error) {
      console.error("기본 발신번호 변경 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "기본 발신번호 변경에 실패했습니다."
      );
    }
  };

  // 발신번호 추가 모달 열기
  const openAddNumberModal = () => {
    setNewNumberForm({ phoneNumber: "", displayName: "" });
    setIsAddNumberModalOpen(true);
  };

  // 발신번호 추가 처리
  const handleAddNumber = async () => {
    if (!newNumberForm.phoneNumber) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    // 전화번호 형식 검증 (두 가지 형식 허용)
    const digitsOnly = newNumberForm.phoneNumber.replace(/[^0-9]/g, "");
    const phoneRegexWithHyphen = /^010-[0-9]{4}-[0-9]{4}$/;
    const phoneRegexWithoutHyphen = /^010[0-9]{8}$/;

    if (
      !phoneRegexWithHyphen.test(newNumberForm.phoneNumber) &&
      !phoneRegexWithoutHyphen.test(digitsOnly)
    ) {
      alert("올바른 전화번호 형식이 아닙니다 (010-XXXX-XXXX 또는 01XXXXXXXXX)");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch("/api/sender-numbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: newNumberForm.phoneNumber,
          displayName: newNumberForm.displayName || "미등록",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "발신번호 추가에 실패했습니다");
      }

      alert("발신번호가 추가되었습니다.");
      setIsAddNumberModalOpen(false);
      setNewNumberForm({ phoneNumber: "", displayName: "" });
      await fetchSenderNumbers(); // 목록 새로고침
    } catch (error) {
      console.error("발신번호 추가 오류:", error);
      alert(
        error instanceof Error ? error.message : "발신번호 추가에 실패했습니다."
      );
    }
  };

  // 발신번호명 수정 처리
  const handleEditNumberName = async (id: number) => {
    const currentNumber = senderNumbers.find((num) => num.id === id);
    if (!currentNumber) return;

    const newDisplayName = prompt(
      "새로운 발신번호명을 입력해주세요:",
      currentNumber.name
    );
    if (!newDisplayName || newDisplayName === currentNumber.name) return;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        throw new Error("로그인이 필요합니다");
      }

      const response = await fetch(`/api/sender-numbers/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ displayName: newDisplayName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "발신번호명 수정에 실패했습니다");
      }

      alert("발신번호명이 수정되었습니다.");
      await fetchSenderNumbers(); // 목록 새로고침
    } catch (error) {
      console.error("발신번호명 수정 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "발신번호명 수정에 실패했습니다."
      );
    }
  };

  // 기본 발신번호 변경 모달 렌더링
  const renderChangeDefaultModal = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        isChangeDefaultModalOpen ? "block" : "hidden"
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          기본 발신번호 변경
        </h3>

        <div className="space-y-3 mb-6">
          {senderNumbers.map((number) => (
            <label
              key={number.id}
              className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="defaultNumber"
                value={number.id}
                checked={selectedDefaultNumber === number.id}
                onChange={() => setSelectedDefaultNumber(number.id)}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {number.number}
                  </span>
                  {number.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      현재 기본
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{number.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    등록: {number.registrationDate}
                  </span>
                  {number.isVerified && (
                    <span className="text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded">
                      인증완료
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsChangeDefaultModalOpen(false);
              setSelectedDefaultNumber(null);
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => {
              if (selectedDefaultNumber) {
                handleChangeDefaultNumber(selectedDefaultNumber);
                setIsChangeDefaultModalOpen(false);
                setSelectedDefaultNumber(null);
              }
            }}
            disabled={!selectedDefaultNumber}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            변경하기
          </button>
        </div>
      </div>
    </div>
  );

  // 발신번호 추가 모달 렌더링
  const renderAddNumberModal = () => (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        isAddNumberModalOpen ? "block" : "hidden"
      }`}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          발신번호 추가
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newNumberForm.phoneNumber}
              onChange={(e) =>
                setNewNumberForm((prev) => ({
                  ...prev,
                  phoneNumber: e.target.value,
                }))
              }
              placeholder="010-XXXX-XXXX 또는 01XXXXXXXXX"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={13}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              발신번호명 (선택)
            </label>
            <input
              type="text"
              value={newNumberForm.displayName}
              onChange={(e) =>
                setNewNumberForm((prev) => ({
                  ...prev,
                  displayName: e.target.value,
                }))
              }
              placeholder="발신번호명을 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 mt-1">
              입력하지 않으면 &lsquo;미등록&rsquo;으로 설정됩니다.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsAddNumberModalOpen(false);
              setNewNumberForm({ phoneNumber: "", displayName: "" });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleAddNumber}
            disabled={!newNumberForm.phoneNumber}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            추가하기
          </button>
        </div>
      </div>
    </div>
  );

  const renderSendingNumberTab = () => {
    return (
      <div className="space-y-6">
        {/* 안내 정보 */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-l-blue-500">
          <ul className="text-sm text-gray-700 space-y-1">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              발신번호는 메시지 발송에 사용됩니다.
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              사업자 회원은 최대 10개까지 등록할 수 있어요.
            </li>
          </ul>
        </div>

        {/* 기본 발신번호 및 등록한 번호 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 기본 발신번호 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              기본 발신번호
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-xl font-medium text-gray-900">
                {defaultNumber ||
                  formatPhoneNumber(user?.phoneNumber) ||
                  "기본 발신번호 없음"}
              </span>
              <button
                onClick={() => {
                  if (senderNumbers.length === 0) {
                    alert(
                      "등록된 발신번호가 없습니다. 먼저 발신번호를 추가해주세요."
                    );
                    return;
                  }
                  const nonDefaultNumbers = senderNumbers.filter(
                    (num) => !num.isDefault
                  );
                  if (nonDefaultNumbers.length === 0) {
                    alert("변경 가능한 발신번호가 없습니다.");
                    return;
                  }
                  openChangeDefaultModal();
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                disabled={senderNumbers.length <= 1}
              >
                변경하기
              </button>
            </div>
          </div>

          {/* 등록한 번호 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              등록한 번호
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-lg text-gray-700">
                {totalCount}/10 (잔여번호 {remainingCount}개)
              </span>
              <button
                onClick={openAddNumberModal}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                disabled={remainingCount <= 0 || senderNumbersLoading}
              >
                {senderNumbersLoading ? "로딩중..." : "추가하기"}
              </button>
            </div>
          </div>
        </div>

        {/* 발신번호 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              발신번호 목록
            </h3>
            <button
              onClick={handleDeleteNumbers}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-300"
              disabled={selectedNumbers.length === 0 || senderNumbersLoading}
            >
              {senderNumbersLoading ? "처리중..." : "삭제"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedNumbers.length ===
                          senderNumbers.filter(
                            (num) => !num.isDefault && !num.isUserPhone
                          ).length &&
                        senderNumbers.filter(
                          (num) => !num.isDefault && !num.isUserPhone
                        ).length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    발신번호
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    발신번호명
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {senderNumbersLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                        발신번호 목록을 불러오는 중...
                      </div>
                    </td>
                  </tr>
                ) : senderNumbers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      등록된 발신번호가 없습니다. 발신번호를 추가해주세요.
                    </td>
                  </tr>
                ) : (
                  senderNumbers.map((number) => (
                    <tr key={number.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedNumbers.includes(number.id)}
                          onChange={() => handleNumberSelect(number.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          disabled={number.isDefault || number.isUserPhone} // 기본번호나 본인번호는 선택 불가
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">
                            {number.number}
                          </span>
                          {number.isUserPhone && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              본인
                            </span>
                          )}
                          {number.isDefault && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              기본
                            </span>
                          )}
                          {number.isVerified && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              인증완료
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">
                            {number.name}
                          </span>
                          <button
                            onClick={() => handleEditNumberName(number.id)}
                            className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                          >
                            수정
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {number.registrationDate}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-blue-600 font-medium">
                          {number.status}
                        </span>
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
  };

  const renderTaxInvoiceTab = () => (
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
                    발행일
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                    계산서 번호
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
                    총 금액
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-medium text-gray-700">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {taxInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
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
                        {invoice.invoice_number}
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
                        {invoice.total_amount.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            invoice.status === "issued"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {invoice.status === "issued" ? "발행" : "취소"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 페이지네이션 */}
        {taxInvoices.length > 0 && taxInvoicePagination.totalPages > 1 && (
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
                  { length: taxInvoicePagination.totalPages },
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
    </div>
  );

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
              activeTab === "sendingNumber"
                ? "text-blue-500"
                : "text-gray-500 hover:text-blue-500"
            }`}
            onClick={() => setActiveTab("sendingNumber")}
          >
            발신번호관리
            {activeTab === "sendingNumber" && (
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
        </div>

        {/* 탭 콘텐츠 */}
        <div>{renderTabContent()}</div>

        {/* 모달들 (기존 코드 유지) */}

        {/* 비밀번호 변경 모달 */}
        {isPasswordModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">
                  비밀번호 변경
                </h2>
                <button
                  onClick={handlePasswordModalClose}
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    현재 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      handlePasswordDataChange(
                        "currentPassword",
                        e.target.value
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      passwordErrors.currentPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  {passwordErrors.currentPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      handlePasswordDataChange("newPassword", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      passwordErrors.newPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="8~20자의 영문, 숫자, 특수기호 조합"
                  />
                  {passwordErrors.newPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 확인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      handlePasswordDataChange(
                        "confirmPassword",
                        e.target.value
                      )
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      passwordErrors.confirmPassword
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="새 비밀번호를 다시 입력하세요"
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* 일반 에러 메시지 */}
              {passwordErrors.general && (
                <div className="mt-4 p-4 bg-red-50 rounded-md">
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
                      <p className="text-sm text-red-800">
                        {passwordErrors.general}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                      새 비밀번호는 8자 이상이어야 하며, 영문, 숫자, 특수문자를
                      포함하는 것을 권장합니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handlePasswordModalClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={
                    isSaving ||
                    Object.values(passwordErrors).some(
                      (error) => error !== ""
                    ) ||
                    !passwordData.currentPassword.trim() ||
                    !passwordData.newPassword.trim() ||
                    !passwordData.confirmPassword.trim()
                  }
                  className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 disabled:bg-orange-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "변경 중..." : "비밀번호 변경"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 기업정보 수정 모달 */}
        {isCompanyEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">
                  기업정보 수정
                </h2>
                <button
                  onClick={handleCompanyModalClose}
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

              <div className="space-y-6">
                {/* 기업 기본 정보 */}
                <div>
                  <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
                    기업 기본 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        회사명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editableCompanyData.companyName}
                        onChange={(e) =>
                          handleEditableCompanyDataChange(
                            "companyName",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="회사명을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        대표자명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editableCompanyData.representativeName}
                        onChange={(e) =>
                          handleEditableCompanyDataChange(
                            "representativeName",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="대표자명을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        사업자등록번호 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editableCompanyData.businessNumber}
                        onChange={(e) =>
                          handleEditableCompanyDataChange(
                            "businessNumber",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="사업자등록번호를 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        업종
                      </label>
                      <input
                        type="text"
                        value={editableCompanyData.businessType}
                        onChange={(e) =>
                          handleEditableCompanyDataChange(
                            "businessType",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="업종을 입력하세요"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        회사주소 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editableCompanyData.address}
                        onChange={(e) =>
                          handleEditableCompanyDataChange(
                            "address",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="회사주소를 입력하세요"
                      />
                    </div>
                  </div>
                </div>

                {/* 연락처 정보 */}
                <div>
                  <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
                    연락처 정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        대표번호
                      </label>
                      <input
                        type="tel"
                        value={editableCompanyData.phoneNumberCompany}
                        onChange={(e) =>
                          handleEditableCompanyDataChange(
                            "phoneNumberCompany",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="대표번호를 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        고객센터 번호
                      </label>
                      <input
                        type="tel"
                        value={editableCompanyData.customerServiceNumber}
                        onChange={(e) =>
                          handleEditableCompanyDataChange(
                            "customerServiceNumber",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="고객센터 번호를 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        팩스번호
                      </label>
                      <input
                        type="tel"
                        value={editableCompanyData.faxNumber}
                        onChange={(e) =>
                          handleEditableCompanyDataChange(
                            "faxNumber",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="팩스번호를 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        홈페이지
                      </label>
                      <input
                        type="url"
                        value={editableCompanyData.homepage}
                        onChange={(e) =>
                          handleEditableCompanyDataChange(
                            "homepage",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="홈페이지 URL을 입력하세요"
                      />
                    </div>
                  </div>
                </div>

                {/* 제출 서류 */}
                <div>
                  <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
                    제출 서류 변경
                  </h3>

                  {/* 안내문구 */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <div className="text-sm">
                        <p className="font-medium text-blue-800 mb-1">
                          제출 서류 안내
                        </p>
                        <ul className="text-blue-700 space-y-1">
                          <li>
                            • 90일 이내 발행된 사업자등록증을 첨부해주세요
                          </li>
                          <li>
                            • 재직증명서는 최근 발급된 것으로 첨부해주세요 (ex.
                            991234-*******표시 등)
                          </li>
                          <li>
                            • 파일 형식: JPEG, JPG, PNG, PDF, TIF / 용량 20MB
                            이하
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* 사업자등록증 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        사업자등록증
                      </label>
                      {userData.documents?.businessRegistration &&
                      !uploadFiles.businessRegistration ? (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 mb-2">
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
                                {
                                  userData.documents.businessRegistration
                                    .fileName
                                }
                              </p>
                              <p className="text-sm text-gray-500">
                                업로드 완료
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {uploadFiles.businessRegistration ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
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
                                {uploadFiles.businessRegistration.name}
                              </p>
                              <p className="text-sm text-blue-600">
                                업로드 대기 중
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleFileRemove("businessRegistration")
                            }
                            className="text-red-500 hover:text-red-700"
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
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload("businessRegistration", file);
                              }
                            }}
                            className="hidden"
                            id="businessRegistration"
                          />
                          <label
                            htmlFor="businessRegistration"
                            className="cursor-pointer flex flex-col items-center justify-center"
                          >
                            <svg
                              className="w-12 h-12 text-gray-400 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            <p className="text-sm text-gray-600">
                              사업자등록증을 업로드하세요
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              PDF, JPG, PNG 파일 (최대 20MB)
                            </p>
                          </label>
                        </div>
                      )}
                      {uploadProgress.businessRegistration && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            <span className="text-sm text-blue-600">
                              업로드 중...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 재직증명서 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        재직증명서
                      </label>
                      {userData.documents?.employmentCertificate &&
                      !uploadFiles.employmentCertificate ? (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200 mb-2">
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
                                {
                                  userData.documents.employmentCertificate
                                    .fileName
                                }
                              </p>
                              <p className="text-sm text-gray-500">
                                현재 업로드된 파일
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {uploadFiles.employmentCertificate ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-md border border-blue-200">
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
                                {uploadFiles.employmentCertificate.name}
                              </p>
                              <p className="text-sm text-blue-600">
                                업로드 대기 중
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleFileRemove("employmentCertificate")
                            }
                            className="text-red-500 hover:text-red-700"
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
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-md p-4">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload("employmentCertificate", file);
                              }
                            }}
                            className="hidden"
                            id="employmentCertificate"
                          />
                          <label
                            htmlFor="employmentCertificate"
                            className="cursor-pointer flex flex-col items-center justify-center"
                          >
                            <svg
                              className="w-12 h-12 text-gray-400 mb-2"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            <p className="text-sm text-gray-600">
                              재직증명서를 업로드하세요
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              PDF, JPG, PNG 파일 (최대 20MB)
                            </p>
                          </label>
                        </div>
                      )}
                      {uploadProgress.employmentCertificate && (
                        <div className="mt-2">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            <span className="text-sm text-blue-600">
                              업로드 중...
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handleCompanyModalClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  onClick={handleCompanySave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 회원 탈퇴 모달 */}
        {isWithdrawalModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">회원탈퇴</h2>
                <button
                  onClick={handleWithdrawalModalClose}
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

              <div className="space-y-6">
                <p className="text-gray-700 text-sm">
                  회원 탈퇴 시 아래 유의사항을 반드시 확인해주세요.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      계정을 삭제하면 복구가 불가능하며, 더 이상 해당 계정으로
                      메시지 발송 및 서비스 이용이 불가합니다.
                    </p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      기존에 사용하던 발신번호, 주소록, 잔액 등 계정에 관련된
                      데이터도 함께 삭제됩니다.
                    </p>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      메시지 목록과 사용자정보는 정보통신망법에 의거 6개월간
                      보관됩니다.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4">
                  <p className="text-gray-800 font-medium text-center">
                    회원탈퇴를 진행하시겠습니까?
                  </p>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-center space-x-3 mt-6 pt-4">
                <button
                  onClick={handleWithdrawalModalClose}
                  disabled={isSaving}
                  className="px-8 py-3 bg-gray-500 rounded-md hover:bg-gray-600 transition-colors duration-200 text-white font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  취소
                </button>
                <button
                  onClick={handleWithdrawal}
                  disabled={isSaving}
                  className="px-8 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 font-medium disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "처리 중..." : "회원탈퇴"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 회원탈퇴 완료 모달 */}
        {isWithdrawalCompleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-md text-center">
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-black mb-4">
                  회원탈퇴가 완료 되었습니다.
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  에이마를 이용해 주셔서 감사합니다.
                  <br />더 나은 서비스로 찾아뵙겠습니다.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => {
                    logout();
                    router.push("/");
                  }}
                  className="px-8 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
                >
                  메인으로
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 세금계산서 담당자 수정 모달 */}
        {isTaxInvoiceEmailModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">
                  세금계산서 담당자
                </h2>
                <button
                  onClick={handleTaxInvoiceEmailModalClose}
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
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                        담당자 이름
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="text"
                          value={taxInvoiceEmailData.name}
                          onChange={(e) =>
                            handleTaxInvoiceEmailDataChange(
                              "name",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="김갈비"
                        />
                      </td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                        담당자 휴대폰
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="tel"
                          value={taxInvoiceEmailData.phone}
                          onChange={(e) =>
                            handleTaxInvoiceEmailDataChange(
                              "phone",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="010-555-5555"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-44 border-r border-gray-200">
                        계산서 수신 이메일
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="email"
                          value={taxInvoiceEmailData.email}
                          onChange={(e) =>
                            handleTaxInvoiceEmailDataChange(
                              "email",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          placeholder="avelo01@naver.com"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleTaxInvoiceEmailModalClose}
                  className="px-8 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200 font-medium"
                >
                  취소
                </button>
                <button
                  onClick={handleTaxInvoiceEmailSave}
                  disabled={isSaving}
                  className="px-8 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed font-medium"
                >
                  {isSaving ? "수정 중..." : "수정"}
                </button>
              </div>
            </div>
          </div>
        )}

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
                          {/* 파일 첨부 영역을 최상단으로 이동 */}
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

                          {/* 안내 문구를 하단으로 이동 */}
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

        {/* 모달들 */}
        {renderChangeDefaultModal()}
        {renderAddNumberModal()}
      </div>
    </AdvertiserLoginRequiredGuard>
  );
}
