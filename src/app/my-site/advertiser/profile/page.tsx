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
  name: string;
  email: string;
  phoneNumber: string;
  joinDate: string;
  lastLoginDate?: string;
  marketingConsent?: boolean;
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
  name: string;
  email: string;
  phoneNumber: string;
  marketingConsent: boolean;
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

  // 모달 상태 관리
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCompanyEditModalOpen, setIsCompanyEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
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
    name: "",
    email: "",
    phoneNumber: "",
    marketingConsent: false,
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

  // 회원 탈퇴 관련 상태
  const [withdrawalData, setWithdrawalData] = useState({
    reason: "",
    customReason: "",
    password: "",
    confirmText: "",
  });

  const [withdrawalErrors, setWithdrawalErrors] = useState({
    reason: "",
    password: "",
    confirmText: "",
    general: "",
  });

  // 탈퇴 사유 옵션
  const withdrawalReasons = [
    { value: "service_dissatisfaction", label: "서비스 불만족" },
    { value: "lack_of_use", label: "사용 빈도 부족" },
    { value: "personal_reasons", label: "개인적인 사유" },
    { value: "business_closure", label: "사업 종료" },
    { value: "cost_burden", label: "비용 부담" },
    { value: "other", label: "기타" },
  ];

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
  const getApprovalStatusText = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return "승인완료";
      case "PENDING":
        return "승인대기";
      case "REJECTED":
        return "승인거부";
      default:
        return "승인대기";
    }
  };

  const getApprovalStatusColor = (status?: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
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
          name: profileData.name,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
          marketingConsent: profileData.marketingConsent || false,
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
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      marketingConsent: userData.marketingConsent || false,
    });
    setIsEditModalOpen(true);
  };

  // 모달 닫기
  const handleModalClose = () => {
    setIsEditModalOpen(false);
    setEditableData({
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      marketingConsent: userData.marketingConsent || false,
    });
  };

  // 수정 가능한 필드 값 변경
  const handleEditableDataChange = (
    field: keyof EditableUserData,
    value: string | boolean
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
      if (!editableData.name.trim()) {
        alert("이름을 입력해주세요.");
        return;
      }
      if (!editableData.email.trim()) {
        alert("이메일을 입력해주세요.");
        return;
      }
      if (!editableData.phoneNumber.trim()) {
        alert("휴대폰 번호를 입력해주세요.");
        return;
      }

      // 실제 API 호출로 사용자 정보 업데이트
      await updateUserInfo(editableData);

      // 로컬 상태 업데이트
      setUserData((prev) => ({
        ...prev,
        ...editableData,
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

  // 비밀번호 변경 모달 열기
  const handlePasswordChangeClick = () => {
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
    setIsPasswordModalOpen(true);
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
    setWithdrawalData({
      reason: "",
      customReason: "",
      password: "",
      confirmText: "",
    });
    setWithdrawalErrors({
      reason: "",
      password: "",
      confirmText: "",
      general: "",
    });
    setIsWithdrawalModalOpen(true);
  };

  // 회원 탈퇴 모달 닫기
  const handleWithdrawalModalClose = () => {
    setIsWithdrawalModalOpen(false);
    setWithdrawalData({
      reason: "",
      customReason: "",
      password: "",
      confirmText: "",
    });
    setWithdrawalErrors({
      reason: "",
      password: "",
      confirmText: "",
      general: "",
    });
  };

  // 회원 탈퇴 데이터 입력 처리
  const handleWithdrawalDataChange = (
    field: keyof typeof withdrawalData,
    value: string
  ) => {
    setWithdrawalData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 입력 시 해당 필드 에러 메시지 초기화
    setWithdrawalErrors((prev) => ({
      ...prev,
      [field]: "",
      general: "",
    }));
  };

  // 회원 탈퇴 처리
  const handleWithdrawal = async () => {
    try {
      setIsSaving(true);

      // 에러 상태 초기화
      setWithdrawalErrors({
        reason: "",
        password: "",
        confirmText: "",
        general: "",
      });

      let hasError = false;
      const newErrors = {
        reason: "",
        password: "",
        confirmText: "",
        general: "",
      };

      // 입력 검증
      if (!withdrawalData.reason) {
        newErrors.reason = "탈퇴 사유를 선택해주세요.";
        hasError = true;
      }

      if (
        withdrawalData.reason === "other" &&
        !withdrawalData.customReason.trim()
      ) {
        newErrors.reason = "기타 사유를 입력해주세요.";
        hasError = true;
      }

      if (!withdrawalData.password.trim()) {
        newErrors.password = "비밀번호를 입력해주세요.";
        hasError = true;
      }

      if (withdrawalData.confirmText !== "회원탈퇴") {
        newErrors.confirmText = "정확히 '회원탈퇴'를 입력해주세요.";
        hasError = true;
      }

      if (hasError) {
        setWithdrawalErrors(newErrors);
        return;
      }

      // 확인 알림
      const isConfirmed = window.confirm(
        "정말로 회원 탈퇴를 하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      );

      if (!isConfirmed) {
        return;
      }

      // 실제 API 호출로 회원 탈퇴
      const finalReason =
        withdrawalData.reason === "other"
          ? withdrawalData.customReason
          : withdrawalReasons.find((r) => r.value === withdrawalData.reason)
              ?.label || withdrawalData.reason;

      await withdrawUser({
        password: withdrawalData.password,
        reason: finalReason,
        customReason:
          withdrawalData.reason === "other"
            ? withdrawalData.customReason
            : undefined,
      });

      // 성공 메시지 표시
      alert("회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.");

      // 로그아웃 처리
      logout();

      // 로그인 페이지로 이동
      router.push("/login");
    } catch (error) {
      console.error("회원 탈퇴 실패:", error);

      // API 에러 메시지 처리
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();

        if (
          errorMessage.includes("비밀번호가 올바르지 않습니다") ||
          errorMessage.includes("password is incorrect")
        ) {
          setWithdrawalErrors({
            reason: "",
            password: "비밀번호가 올바르지 않습니다.",
            confirmText: "",
            general: "",
          });
        } else if (
          errorMessage.includes("사용자를 찾을 수 없습니다") ||
          errorMessage.includes("user not found")
        ) {
          setWithdrawalErrors({
            reason: "",
            password: "",
            confirmText: "",
            general: "사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
          });
        } else if (errorMessage.includes("로그인이 필요합니다")) {
          setWithdrawalErrors({
            reason: "",
            password: "",
            confirmText: "",
            general: "로그인이 필요합니다. 다시 로그인해주세요.",
          });
        } else {
          setWithdrawalErrors({
            reason: "",
            password: "",
            confirmText: "",
            general:
              error.message || "회원 탈퇴에 실패했습니다. 다시 시도해주세요.",
          });
        }
      } else {
        setWithdrawalErrors({
          reason: "",
          password: "",
          confirmText: "",
          general: "회원 탈퇴에 실패했습니다. 다시 시도해주세요.",
        });
      }
    } finally {
      setIsSaving(false);
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
              onClick={handleEditClick}
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

            <div className="flex items-center justify-between mt-4">
              <p className="text-gray-600">
                계정 보안을 위해 정기적으로 비밀번호를 변경해주세요.
              </p>
              <button
                onClick={handlePasswordChangeClick}
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors duration-200 text-sm font-medium"
              >
                비밀번호 변경
              </button>
            </div>
          </div>

          {/* 회원 탈퇴 */}
          <div>
            <h3 className="text-lg font-medium text-black mb-4 border-b pb-2">
              회원 탈퇴
            </h3>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <span className="text-red-500 text-xl mr-2">⚠️</span>
                <div>
                  <p className="text-gray-700 text-sm">
                    회원 탈퇴 시 모든 개인 정보가 즉시 삭제되며, 복구가
                    불가능합니다.
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    탈퇴 후에는 해당 계정으로 다시 로그인할 수 없습니다.
                  </p>
                </div>
              </div>
              <button
                onClick={handleWithdrawalClick}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 text-sm font-medium"
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        </div>

        {/* 기업정보인증 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-black">기업정보인증</h2>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getApprovalStatusColor(
                  userData.approval_status
                )}`}
              >
                {getApprovalStatusText(userData.approval_status)}
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
                <p className="font-medium text-black">
                  {userData.businessType}
                </p>
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

        {/* SNS 연동 섹션 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-t-4 border-t-purple-500">
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
                  <li>
                    • 이미 다른 계정에 연동된 SNS 계정은 연동할 수 없습니다
                  </li>
                  <li>• 연동 해제 후에도 기존 계정 정보는 유지됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

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
                    <div>
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
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        휴대폰 번호 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={editableData.phoneNumber}
                        onChange={(e) =>
                          handleEditableDataChange(
                            "phoneNumber",
                            e.target.value
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="휴대폰 번호를 입력하세요"
                      />
                    </div>
                  </div>

                  {/* 마케팅 정보 수신 동의 */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editableData.marketingConsent}
                        onChange={(e) =>
                          handleEditableDataChange(
                            "marketingConsent",
                            e.target.checked
                          )
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        마케팅 정보 수신에 동의합니다.
                      </span>
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
                                현재 업로드된 파일
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
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-black">회원 탈퇴</h2>
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    탈퇴 사유 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={withdrawalData.reason}
                    onChange={(e) =>
                      handleWithdrawalDataChange("reason", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">탈퇴 사유를 선택해주세요</option>
                    {withdrawalReasons.map((reason) => (
                      <option key={reason.value} value={reason.value}>
                        {reason.label}
                      </option>
                    ))}
                  </select>
                  {withdrawalData.reason === "other" && (
                    <input
                      type="text"
                      value={withdrawalData.customReason}
                      onChange={(e) =>
                        handleWithdrawalDataChange(
                          "customReason",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                      placeholder="탈퇴 사유를 입력해주세요"
                    />
                  )}
                  {withdrawalErrors.reason && (
                    <p className="mt-2 text-sm text-red-600">
                      {withdrawalErrors.reason}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    비밀번호 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={withdrawalData.password}
                    onChange={(e) =>
                      handleWithdrawalDataChange("password", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      withdrawalErrors.password
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    placeholder="현재 비밀번호를 입력하세요"
                  />
                  {withdrawalErrors.password && (
                    <p className="mt-2 text-sm text-red-600">
                      {withdrawalErrors.password}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    회원탈퇴 확인 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={withdrawalData.confirmText}
                    onChange={(e) =>
                      handleWithdrawalDataChange("confirmText", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="회원탈퇴"
                  />
                  {withdrawalErrors.confirmText && (
                    <p className="mt-2 text-sm text-red-600">
                      {withdrawalErrors.confirmText}
                    </p>
                  )}
                </div>
              </div>

              {/* 일반 에러 메시지 */}
              {withdrawalErrors.general && (
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
                        {withdrawalErrors.general}
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
                      회원 탈퇴 시 모든 개인 정보가 즉시 삭제되며, 복구가
                      불가능합니다. 탈퇴 후에는 해당 계정으로 다시 로그인할 수
                      없습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 버튼 영역 */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={handleWithdrawalModalClose}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                  disabled={isSaving}
                >
                  취소
                </button>
                <button
                  onClick={handleWithdrawal}
                  disabled={
                    isSaving ||
                    Object.values(withdrawalErrors).some(
                      (error) => error !== ""
                    ) ||
                    !withdrawalData.reason ||
                    (withdrawalData.reason === "other" &&
                      !withdrawalData.customReason.trim()) ||
                    !withdrawalData.password.trim() ||
                    withdrawalData.confirmText !== "회원탈퇴"
                  }
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-200 disabled:bg-red-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? "탈퇴 중..." : "회원 탈퇴"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvertiserLoginRequiredGuard>
  );
}
