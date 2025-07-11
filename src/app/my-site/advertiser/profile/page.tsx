"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatKSTDateTime } from "@/lib/utils";
import {
  getUserInfo,
  UserInfoResponse,
  updateUserInfo,
  changePassword,
  withdrawUser,
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

// 수정 가능한 필드들을 위한 타입
interface EditableUserData {
  name: string;
  email: string;
  phoneNumber: string;
  marketingConsent: boolean;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태 관리
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  // 수정 가능한 필드들의 상태
  const [editableData, setEditableData] = useState<EditableUserData>({
    name: "",
    email: "",
    phoneNumber: "",
    marketingConsent: false,
  });

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

        // 수정 가능한 필드들 초기화
        setEditableData({
          name: profileData.name,
          email: profileData.email,
          phoneNumber: profileData.phoneNumber,
          marketingConsent: profileData.marketingConsent || false,
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

      console.log("저장 완료:", editableData);

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
    if (field === "newPassword" && value.length > 0 && value.length < 8) {
      newErrors.newPassword = "새 비밀번호는 8자 이상이어야 합니다.";
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
                    placeholder="새 비밀번호를 입력하세요 (8자 이상)"
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
