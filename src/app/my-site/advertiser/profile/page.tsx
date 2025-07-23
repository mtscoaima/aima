"use client";

import React, { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";

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

  // 인덱스 시그니처 추가
  [key: string]: string | boolean | object | undefined;
}

// 수정 가능한 필드들을 위한 타입
interface EditableUserData {
  username: string;
  name: string;
  email: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 탭 상태 관리
  const [activeTab, setActiveTab] = useState<
    "memberInfo" | "businessInfo" | "password" | "sendingNumber" | "taxInvoice"
  >("memberInfo");

  // 모달 상태 관리
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompanyEditModalOpen, setIsCompanyEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isWithdrawalCompleteModalOpen, setIsWithdrawalCompleteModalOpen] =
    useState(false);
  const [isPhoneChangeModalOpen, setIsPhoneChangeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 세금계산서 이메일 변경 모달 상태
  const [isTaxInvoiceEmailModalOpen, setIsTaxInvoiceEmailModalOpen] =
    useState(false);
  const [taxInvoiceEmailData, setTaxInvoiceEmailData] = useState({
    name: "",
    phone: "",
    email: "",
  });

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

  // 수정 가능한 필드들의 상태
  const [editableData, setEditableData] = useState<EditableUserData>({
    username: "",
    name: "",
    email: "",
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
          marketingConsent: userInfo.marketingConsent || false,
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
        };

        // SNS 연동 상태 확인 (userInfo에서 소셜 ID가 있는지 확인)
        setSnsLinkedAccounts({
          kakao: !!userInfo.kakao_user_id,
          naver: !!userInfo.naver_user_id,
          google: !!userInfo.google_user_id,
        });

        setUserData(profileData);

        // 수정 가능한 필드들 초기화
        setEditableData({
          username: profileData.username || "",
          name: profileData.name,
          email: profileData.email,
        });

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

  // 모달 열기
  const handleEditClick = () => {
    setEditableData({
      username: userData.username || "",
      name: userData.name,
      email: userData.email,
    });
    setIsEditModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditableData({
      username: userData.username || "",
      name: userData.name,
      email: userData.email,
    });
  };

  // 수정 가능한 필드 값 변경
  const handleEditableDataChange = (
    field: keyof EditableUserData,
    value: string
  ) => {
    setEditableData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 기업정보 수정 모달 열기
  const handleCompanyEditClick = () => {
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
    setIsCompanyEditModalOpen(true);
  };

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

  // 저장 처리
  const handleSave = async () => {
    try {
      setIsSaving(true);

      // 입력 검증
      if (!editableData.username.trim()) {
        alert("아이디를 입력해주세요.");
        return;
      }
      if (!editableData.name.trim()) {
        alert("이름을 입력해주세요.");
        return;
      }
      if (!editableData.email.trim()) {
        alert("이메일을 입력해주세요.");
        return;
      }

      // 실제 API 호출로 사용자 정보 업데이트
      await updateUserInfo(editableData);

      // 로컬 상태 업데이트
      setUserData((prev) => ({
        ...prev,
        username: editableData.username,
        name: editableData.name,
        email: editableData.email,
      }));

      // 성공 메시지 표시 (실제 구현에서는 toast나 알림으로 표시)
      alert("회원정보가 성공적으로 수정되었습니다.");

      setIsEditModalOpen(false);
    } catch (error) {
      console.error("회원정보 수정 실패:", error);
      alert("회원정보 수정에 실패했습니다. 다시 시도해주세요.");
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
      // 확인 알림
      const isConfirmed = window.confirm(
        "정말로 회원 탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      );

      if (!isConfirmed) {
        return;
      }

      setIsSaving(true);

      // 간단한 회원 탈퇴 API 호출
      await withdrawUser({
        password: "", // 비밀번호 검증 없이 진행
        reason: "사용자 요청",
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

  // 휴대폰 변경 모달 열기
  const handlePhoneChangeClick = () => {
    setIsPhoneChangeModalOpen(true);
  };

  // 휴대폰 변경 모달 닫기
  const handlePhoneChangeModalClose = () => {
    setIsPhoneChangeModalOpen(false);
  };

  // 휴대폰 변경 확인
  const handlePhoneChangeConfirm = () => {
    setIsPhoneChangeModalOpen(false);
    alert("변경되었습니다");
  };

  // 세금계산서 이메일 변경 모달 열기
  const handleChangeInvoiceEmail = () => {
    setTaxInvoiceEmailData({
      name: userData.name || "",
      phone: userData.phoneNumber || "",
      email: userData.email || "",
    });
    setIsTaxInvoiceEmailModalOpen(true);
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

      // API 호출로 사용자 정보 업데이트 (이름과 이메일만 업데이트)
      await updateUserInfo({
        name: taxInvoiceEmailData.name,
        email: taxInvoiceEmailData.email,
      });

      // 로컬 상태 업데이트
      setUserData((prev) => ({
        ...prev,
        name: taxInvoiceEmailData.name,
        phoneNumber: taxInvoiceEmailData.phone,
        email: taxInvoiceEmailData.email,
      }));

      alert("담당자 정보가 성공적으로 수정되었습니다.");
      setIsTaxInvoiceEmailModalOpen(false);
    } catch (error) {
      console.error("담당자 정보 수정 실패:", error);
      alert("담당자 정보 수정에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">회원 정보</h2>
          <button
            onClick={handleEditClick}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
          >
            회원정보 수정
          </button>
        </div>

        {/* 회원정보 현황 */}
        {/* 회원정보 */}
        <div className="mb-6">
          <table className="w-full">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32">
                  아이디
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {userData.username || userData.email || "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32">
                  이메일
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {userData.email || "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32">
                  이름
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  {userData.name || "-"}
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32">
                  담당자 휴대폰
                </td>
                <td className="py-4 px-4 text-sm text-gray-900">
                  <div className="flex items-center justify-between">
                    <span>{userData.phoneNumber || "-"}</span>
                    <button
                      onClick={handlePhoneChangeClick}
                      className="px-3 py-1 bg-gray-500 text-white text-xs rounded-md hover:bg-gray-600 transition-colors duration-200"
                    >
                      휴대폰 변경
                    </button>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 bg-gray-50 text-sm font-medium text-gray-700 w-32">
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
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-black">SNS 계정 연동</h2>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
            연동된 SNS 계정
          </h3>

          <div className="space-y-4">
            {/* 카카오 연동 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-4">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M10 3.33333C14.6024 3.33333 18.3333 6.30952 18.3333 10C18.3333 12.5476 16.6548 14.7857 14.1667 16.0714L13.3333 18.3333L10.8333 16.6667H10C5.39762 16.6667 1.66667 13.6905 1.66667 10C1.66667 6.30952 5.39762 3.33333 10 3.33333Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-black">카카오</h4>
                  <p className="text-sm text-gray-600">
                    {snsLinkedAccounts.kakao ? "연동됨" : "연동되지 않음"}
                  </p>
                </div>
              </div>
              <div>
                {snsLinkedAccounts.kakao ? (
                  <button
                    onClick={() => handleSocialUnlink("kakao")}
                    className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors duration-200 text-sm font-medium cursor-pointer"
                  >
                    연동 해제
                  </button>
                ) : (
                  <button
                    onClick={() => handleSocialLink("kakao")}
                    disabled={snsLinking.kakao}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors duration-200 text-sm font-medium disabled:bg-yellow-300 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {snsLinking.kakao ? "연동 중..." : "연동하기"}
                  </button>
                )}
              </div>
            </div>

            {/* 네이버 연동 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M13.6667 10.5833L6.33333 5.83333V10.5833H4.16667V14.1667H6.33333V18.3333H13.6667V14.1667H15.8333V10.5833H13.6667ZM11.5 12.75H8.5V7.25L11.5 10.5833V12.75Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-black">네이버</h4>
                  <p className="text-sm text-gray-600">
                    {snsLinkedAccounts.naver ? "연동됨" : "연동되지 않음"}
                  </p>
                </div>
              </div>
              <div>
                {snsLinkedAccounts.naver ? (
                  <button
                    onClick={() => handleSocialUnlink("naver")}
                    className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors duration-200 text-sm font-medium cursor-pointer"
                  >
                    연동 해제
                  </button>
                ) : (
                  <button
                    onClick={() => handleSocialLink("naver")}
                    disabled={snsLinking.naver}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 text-sm font-medium disabled:bg-green-300 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {snsLinking.naver ? "연동 중..." : "연동하기"}
                  </button>
                )}
              </div>
            </div>

            {/* 구글 연동 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md border">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mr-4">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-black">구글</h4>
                  <p className="text-sm text-gray-600">
                    {snsLinkedAccounts.google ? "연동됨" : "연동되지 않음"}
                  </p>
                </div>
              </div>
              <div>
                {snsLinkedAccounts.google ? (
                  <button
                    onClick={() => handleSocialUnlink("google")}
                    className="px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors duration-200 text-sm font-medium cursor-pointer"
                  >
                    연동 해제
                  </button>
                ) : (
                  <button
                    onClick={() => handleSocialLink("google")}
                    disabled={snsLinking.google}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-sm font-medium disabled:bg-red-300 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {snsLinking.google ? "연동 중..." : "연동하기"}
                  </button>
                )}
              </div>
            </div>
          </div>
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
  const renderBusinessInfoTab = () => (
    <div className="space-y-6">
      {/* 탭 설명 */}
      <p className="text-sm text-gray-600">
        회원님의 사업자 정보를 확인 및 변경하실 수 있습니다.
      </p>

      <div className="bg-white rounded-lg shadow p-6 border-t-4 border-t-orange-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-black">기업정보인증</h2>
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
          <button
            onClick={handleCompanyEditClick}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 text-sm font-medium"
          >
            기업정보 수정
          </button>
        </div>

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
            <div>
              <p className="text-sm text-gray-600">업종</p>
              <p className="font-medium text-black">{userData.businessType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">팩스번호</p>
              <p className="font-medium text-black">{userData.faxNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">홈페이지</p>
              <p className="font-medium text-black">{userData.homepage}</p>
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
            {/* 사업자등록증 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사업자등록증
              </label>
              {userData.documents?.businessRegistration ? (
                <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
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
                      <p className="text-sm text-gray-500">업로드 완료</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-500">
                    파일이 업로드되지 않았습니다.
                  </p>
                </div>
              )}
            </div>

            {/* 재직증명서 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                재직증명서
              </label>
              {userData.documents?.employmentCertificate ? (
                <div className="flex items-center p-3 bg-gray-50 rounded-md border border-gray-200">
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
                        {userData.documents.employmentCertificate.fileName}
                      </p>
                      <p className="text-sm text-gray-500">업로드 완료</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-500">
                    파일이 업로드되지 않았습니다.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">
                비밀번호 변경 수칙
              </p>
              <ul className="text-yellow-700 space-y-1">
                <li>• 수기적인(3~6개월) 비밀번호 변경</li>
                <li>• 다른 아이디/사이트에서 사용한 적 없는 비밀번호</li>
                <li>• 이전에 사용한 적 없는 비밀번호</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 비밀번호 변경 폼 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              현재 비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) =>
                handlePasswordDataChange("currentPassword", e.target.value)
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
              placeholder="8~20자 영문, 숫자, 특수기호 조합"
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
                handlePasswordDataChange("confirmPassword", e.target.value)
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

  // 발신번호관리 탭 (향후 구현)
  // 발신번호 관리 관련 상태
  const [senderNumbers, setSenderNumbers] = useState([
    {
      id: 1,
      number: "010-1234-1123",
      name: "미등록",
      registrationDate: "25-08-11",
      status: "정상",
      isDefault: true,
    },
    {
      id: 2,
      number: "010-1111-1111",
      name: "이름01",
      registrationDate: "25-08-11",
      status: "정상",
      isDefault: false,
    },
  ]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [defaultNumber] = useState("010-1234-1123");

  // 발신번호 선택/해제 처리
  const handleNumberSelect = (id: number) => {
    setSelectedNumbers((prev) =>
      prev.includes(id) ? prev.filter((num) => num !== id) : [...prev, id]
    );
  };

  // 전체 선택/해제 처리
  const handleSelectAll = () => {
    if (selectedNumbers.length === senderNumbers.length) {
      setSelectedNumbers([]);
    } else {
      setSelectedNumbers(senderNumbers.map((num) => num.id));
    }
  };

  // 발신번호 삭제 처리
  const handleDeleteNumbers = () => {
    if (selectedNumbers.length === 0) {
      alert("삭제할 발신번호를 선택해주세요.");
      return;
    }

    if (confirm("선택한 발신번호를 삭제하시겠습니까?")) {
      setSenderNumbers((prev) =>
        prev.filter((num) => !selectedNumbers.includes(num.id))
      );
      setSelectedNumbers([]);
    }
  };

  // 기본 발신번호 변경 처리
  const handleChangeDefaultNumber = () => {
    // 실제 구현에서는 모달이나 다른 UI로 처리
    alert("기본 발신번호 변경 기능은 추후 구현 예정입니다.");
  };

  // 발신번호 추가 처리
  const handleAddNumber = () => {
    // 실제 구현에서는 모달이나 다른 UI로 처리
    alert("발신번호 추가 기능은 추후 구현 예정입니다.");
  };

  // 발신번호명 수정 처리
  const handleEditNumberName = (id: number) => {
    // 실제 구현에서는 모달이나 다른 UI로 처리
    console.log(id);
    alert("발신번호명 수정 기능은 추후 구현 예정입니다.");
  };

  const renderSendingNumberTab = () => (
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
              {defaultNumber}
            </span>
            <button
              onClick={handleChangeDefaultNumber}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
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
              {senderNumbers.length}/10 (잔여번호 {10 - senderNumbers.length}개)
            </span>
            <button
              onClick={handleAddNumber}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              추가하기
            </button>
          </div>
        </div>
      </div>

      {/* 발신번호 목록 */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              발신번호 목록
            </h3>
            <button
              onClick={handleDeleteNumbers}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              삭제
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedNumbers.length === senderNumbers.length &&
                      senderNumbers.length > 0
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
              {senderNumbers.map((number) => (
                <tr key={number.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedNumbers.includes(number.id)}
                      onChange={() => handleNumberSelect(number.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900">
                        {number.number}
                      </span>
                      {number.isDefault && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          기본
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

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
              {userData?.email || "이메일 정보가 없습니다."}
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
          <h3 className="text-lg font-semibold text-gray-900">
            세금계산서 발행 내역
          </h3>
        </div>

        <div className="overflow-x-auto">
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
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  공급가액
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  세액
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                  충전금액
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* 발행 내역이 없을 때 */}
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
            </tbody>
          </table>
        </div>
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
        {/* 회원정보 수정 모달 */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">
                  회원정보 수정
                </h2>
                <button
                  onClick={handleModalClose}
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
                {/* 개인정보 섹션 */}
                <div>
                  <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
                    개인정보
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        아이디 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editableData.username}
                        onChange={(e) =>
                          handleEditableDataChange("username", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="아이디를 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이름 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={editableData.name}
                        onChange={(e) =>
                          handleEditableDataChange("name", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="이름을 입력하세요"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={editableData.email}
                        onChange={(e) =>
                          handleEditableDataChange("email", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="이메일을 입력하세요"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handleModalClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:bg-blue-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </div>
        )}

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
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
                <button
                  onClick={handleWithdrawalModalClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                >
                  취소
                </button>
                <button
                  onClick={handleWithdrawal}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200"
                >
                  회원 탈퇴
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 휴대폰 변경 모달 */}
        {isPhoneChangeModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">
                  휴대폰 번호 변경
                </h2>
                <button
                  onClick={handlePhoneChangeModalClose}
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
                <p className="text-gray-700 text-sm leading-relaxed">
                  휴대폰 번호 변경을 원하시면 고객센터로 문의해 주세요.
                  <br />
                  고객센터: 1588-1234
                  <br />
                  운영시간: 평일 9:00~18:00 (주말, 공휴일 제외)
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handlePhoneChangeConfirm}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
                >
                  확인
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

        {/* 세금계산서 이메일 변경 모달 */}
        {isTaxInvoiceEmailModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">
                  세금계산서 담당자 정보 수정
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자 이름
                  </label>
                  <input
                    type="text"
                    value={taxInvoiceEmailData.name}
                    onChange={(e) =>
                      handleTaxInvoiceEmailDataChange("name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="김갈비"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    담당자 휴대폰
                  </label>
                  <input
                    type="tel"
                    value={taxInvoiceEmailData.phone}
                    onChange={(e) =>
                      handleTaxInvoiceEmailDataChange("phone", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="010-555-5555"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    계산서 수신 이메일
                  </label>
                  <input
                    type="email"
                    value={taxInvoiceEmailData.email}
                    onChange={(e) =>
                      handleTaxInvoiceEmailDataChange("email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="avelo01@naver.com"
                  />
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handleTaxInvoiceEmailModalClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  onClick={handleTaxInvoiceEmailSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "수정 중..." : "수정"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvertiserLoginRequiredGuard>
  );
}
