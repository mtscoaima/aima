"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { getUserInfo, updateUserInfo } from "@/lib/api";
import { formatKSTDateTime, formatKSTDate } from "@/lib/utils";
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
  optOutNumber?: string; // 080 수신거부 번호

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

  // SNS 연동 정보
  connectedSNS?: {
    kakao: boolean;
    naver: boolean;
    google: boolean;
    [key: string]: boolean;
  };

  // 인덱스 시그니처 추가
  [key: string]: string | boolean | object | undefined;
}

// 각 섹션의 수정 상태 관리
interface EditState {
  personal: boolean;
  company: boolean;
  password: boolean;
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
    connectedSNS: {
      kakao: false,
      naver: false,
      google: false,
    },
  });

  // 수정 모드 상태
  const [isEditing, setIsEditing] = useState<EditState>({
    personal: false,
    company: false,
    password: false,
  });

  // 비밀번호 확인 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState<{
    show: boolean;
    section: keyof EditState | null;
  }>({
    show: false,
    section: null,
  });

  // 비밀번호 입력 상태
  const [password, setPassword] = useState("");

  // 미리보기 모달 상태
  const [showPreviewModal, setShowPreviewModal] = useState<{
    show: boolean;
    fileName: string;
    fileUrl: string;
  }>({
    show: false,
    fileName: "",
    fileUrl: "",
  });

  // 수정된 데이터
  const [editedData, setEditedData] = useState<UserProfileData>({
    ...userData,
  });

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const userInfo = await getUserInfo();

        // API 응답을 UserProfileData 형식으로 변환
        const profileData: UserProfileData = {
          name: userInfo.name,
          email: userInfo.email,
          phoneNumber: userInfo.phoneNumber,
          joinDate: formatKSTDate(userInfo.createdAt),
          lastLoginDate: userInfo.lastLoginAt
            ? formatKSTDateTime(userInfo.lastLoginAt)
            : undefined,
          // 기본값 설정
          companyName: userInfo.companyInfo?.companyName || "",
          representativeName: userInfo.companyInfo?.ceoName || "",
          businessNumber: userInfo.companyInfo?.businessNumber || "",
          address: userInfo.companyInfo?.companyAddress || "",
          phoneNumberCompany: userInfo.companyInfo?.companyPhone || "",
          customerServiceNumber:
            userInfo.companyInfo?.customerServiceNumber || "",
          optOutNumber: userInfo.companyInfo?.toll080Number || "",
          // 제출 서류 정보 (API에서 가져온 데이터 사용)
          documents: userInfo.documents || undefined,
          connectedSNS: {
            kakao: false,
            naver: false,
            google: false,
          },
        };

        setUserData(profileData);
        setEditedData(profileData);
        setError(null);
      } catch (err) {
        console.error("사용자 정보 로드 실패:", err);
        setError("사용자 정보를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      loadUserData();
    }
  }, [user, authLoading]);

  // 비밀번호 모달 열기
  const openPasswordModal = (section: keyof EditState) => {
    setShowPasswordModal({ show: true, section });
    setPassword("");
  };

  // 비밀번호 모달 닫기
  const closePasswordModal = () => {
    setShowPasswordModal({ show: false, section: null });
  };

  // 비밀번호 검증 및 수정 모드 전환
  const verifyPasswordAndEdit = () => {
    // 실제 구현에서는 서버에 비밀번호 검증 요청
    // 여기서는 간단하게 아무 입력이나 받으면 통과
    if (showPasswordModal.section) {
      setIsEditing({
        ...isEditing,
        [showPasswordModal.section]: true,
      });
    }
    closePasswordModal();
  };

  // 수정 취소
  const cancelEdit = (section: keyof EditState) => {
    setIsEditing({
      ...isEditing,
      [section]: false,
    });
    setEditedData({ ...userData }); // 원래 데이터로 복원
  };

  // 수정 내용 저장
  const saveChanges = async (section: keyof EditState) => {
    try {
      // 실제 구현에서는 서버에 수정된 정보 저장 요청
      await updateUserInfo(editedData);
      setUserData({ ...editedData });
      setIsEditing({
        ...isEditing,
        [section]: false,
      });
      alert("회원정보가 수정되었습니다.");
    } catch (err) {
      console.error("회원정보 저장 실패:", err);
      alert("회원정보를 저장하는데 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 입력 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // name에 '.'이 있으면 중첩된 객체 속성 (예: connectedSNS.kakao)
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEditedData({
        ...editedData,
        [parent]: {
          ...(editedData[parent] as Record<string, string | boolean>),
          [child]: value,
        },
      });
    } else {
      setEditedData({
        ...editedData,
        [name]: value,
      });
    }
  };

  // SNS 연결/해제 핸들러
  const handleSNSConnection = (
    snsName: "kakao" | "naver" | "google",
    connect: boolean
  ) => {
    // 실제 구현에서는 SNS 연결/해제 API 호출
    setUserData({
      ...userData,
      connectedSNS: {
        kakao: userData.connectedSNS?.kakao || false,
        naver: userData.connectedSNS?.naver || false,
        google: userData.connectedSNS?.google || false,
        [snsName]: connect,
      },
    });

    if (connect) {
      alert(`${snsName} 계정이 연결되었습니다.`);
    } else {
      alert(`${snsName} 계정 연결이 해제되었습니다.`);
    }
  };

  // 회원 탈퇴 핸들러
  const handleAccountDeletion = () => {
    const confirmed = window.confirm(
      "정말로 회원 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."
    );
    if (confirmed) {
      // 실제 구현에서는 회원 탈퇴 API 호출
      alert("회원 탈퇴가 처리되었습니다.");
      // 로그아웃 및 홈페이지로 리디렉션
    }
  };

  // 파일 다운로드 핸들러
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    // 실제 구현에서는 서버에서 파일을 가져와 다운로드
    // 여기서는 임시로 alert 표시
    alert(`${fileName} 파일을 다운로드합니다.`);

    // 실제 다운로드 구현 예시:
    // const link = document.createElement('a');
    // link.href = fileUrl;
    // link.download = fileName;
    // document.body.appendChild(link);
    // link.click();
    // document.body.removeChild(link);
  };

  // 파일 미리보기 핸들러
  const handleFilePreview = (fileUrl: string, fileName: string) => {
    setShowPreviewModal({
      show: true,
      fileName,
      fileUrl,
    });
  };

  // 미리보기 모달 닫기
  const closePreviewModal = () => {
    setShowPreviewModal({
      show: false,
      fileName: "",
      fileUrl: "",
    });
  };

  // 로딩 중이거나 인증되지 않은 경우
  if (authLoading || isLoading) {
    return (
      <div className="p-4 max-w-5xl mx-auto">
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
      <div className="p-4 max-w-5xl mx-auto">
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
      <div className="p-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">회원정보 관리</h1>
        </div>

        {/* 개인 정보 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-black">개인 정보</h2>
            {!isEditing.personal ? (
              <button
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                onClick={() => openPasswordModal("personal")}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  ></path>
                </svg>
                정보 수정
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                  onClick={() => saveChanges("personal")}
                >
                  저장
                </button>
                <button
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={() => cancelEdit("personal")}
                >
                  취소
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">이름</p>
              {isEditing.personal ? (
                <input
                  type="text"
                  name="name"
                  value={editedData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              ) : (
                <p className="font-medium text-black">{userData.name || "-"}</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">이메일</p>
              <p className="font-medium text-black">{userData.email || "-"}</p>
              <p className="text-xs text-gray-500 mt-1">
                (이메일은 변경할 수 없습니다. 고객센터에 문의하세요.)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">휴대폰 번호</p>
              {isEditing.personal ? (
                <input
                  type="text"
                  name="phoneNumber"
                  value={editedData.phoneNumber}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              ) : (
                <p className="font-medium text-black">
                  {userData.phoneNumber || "-"}
                </p>
              )}
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

        {/* 기업 정보 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-green-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-black">기업 정보</h2>
            {!isEditing.company ? (
              <button
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                onClick={() => openPasswordModal("company")}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  ></path>
                </svg>
                정보 수정
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                  onClick={() => saveChanges("company")}
                >
                  저장
                </button>
                <button
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={() => cancelEdit("company")}
                >
                  취소
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">기업명</p>
              {isEditing.company ? (
                <input
                  type="text"
                  name="companyName"
                  value={editedData.companyName || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              ) : (
                <p className="font-medium text-black">
                  {userData.companyName || "-"}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">대표자명</p>
              {isEditing.company ? (
                <input
                  type="text"
                  name="representativeName"
                  value={editedData.representativeName || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              ) : (
                <p className="font-medium text-black">
                  {userData.representativeName || "-"}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">사업자등록번호</p>
              <p className="font-medium text-black">
                {userData.businessNumber || "-"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                (사업자등록번호는 변경할 수 없습니다. 고객센터에 문의하세요.)
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">주소</p>
              {isEditing.company ? (
                <input
                  type="text"
                  name="address"
                  value={editedData.address || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              ) : (
                <p className="font-medium text-black">
                  {userData.address || "-"}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">대표번호</p>
              {isEditing.company ? (
                <input
                  type="text"
                  name="phoneNumberCompany"
                  value={editedData.phoneNumberCompany || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              ) : (
                <p className="font-medium text-black">
                  {userData.phoneNumberCompany || "-"}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">고객센터 번호</p>
              {isEditing.company ? (
                <input
                  type="text"
                  name="customerServiceNumber"
                  value={editedData.customerServiceNumber || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              ) : (
                <p className="font-medium text-black">
                  {userData.customerServiceNumber || "-"}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">080 수신거부 번호</p>
              {isEditing.company ? (
                <input
                  type="text"
                  name="optOutNumber"
                  value={editedData.optOutNumber || ""}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              ) : (
                <p className="font-medium text-black">
                  {userData.optOutNumber || "-"}
                </p>
              )}
            </div>
            <div>
              <Link
                href="/my-site/advertiser/company-verification"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                기업정보인증 상태 확인하기 →
              </Link>
            </div>
          </div>
        </div>

        {/* 제출 서류 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-orange-500">
          <h2 className="text-lg font-semibold mb-4 text-black">제출 서류</h2>
          <div className="space-y-4">
            {userData.documents?.businessRegistration && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-red-500 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
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
                <div className="flex space-x-2">
                  <button
                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                    onClick={() =>
                      handleFilePreview(
                        userData.documents!.businessRegistration!.fileUrl,
                        userData.documents!.businessRegistration!.fileName
                      )
                    }
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    미리보기
                  </button>
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    onClick={() =>
                      handleFileDownload(
                        userData.documents!.businessRegistration!.fileUrl,
                        userData.documents!.businessRegistration!.fileName
                      )
                    }
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    다운로드
                  </button>
                </div>
              </div>
            )}

            {userData.documents?.employmentCertificate && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-blue-500 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
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
                    <p className="text-sm text-gray-500">
                      업로드일:{" "}
                      {formatKSTDateTime(
                        userData.documents.employmentCertificate.uploadedAt
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                    onClick={() =>
                      handleFilePreview(
                        userData.documents!.employmentCertificate!.fileUrl,
                        userData.documents!.employmentCertificate!.fileName
                      )
                    }
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    미리보기
                  </button>
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    onClick={() =>
                      handleFileDownload(
                        userData.documents!.employmentCertificate!.fileUrl,
                        userData.documents!.employmentCertificate!.fileName
                      )
                    }
                  >
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    다운로드
                  </button>
                </div>
              </div>
            )}

            {!userData.documents?.businessRegistration &&
              !userData.documents?.employmentCertificate && (
                <div className="text-center py-8">
                  <svg
                    className="w-12 h-12 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    업로드된 서류가 없습니다.
                  </p>
                  <Link
                    href="/my-site/advertiser/company-verification"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block"
                  >
                    서류 업로드하기 →
                  </Link>
                </div>
              )}
          </div>
        </div>

        {/* 비밀번호 변경 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 border-t-4 border-t-purple-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-black">비밀번호 관리</h2>
            {!isEditing.password ? (
              <button
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                onClick={() => openPasswordModal("password")}
              >
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  ></path>
                </svg>
                비밀번호 변경
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                  onClick={() => saveChanges("password")}
                >
                  저장
                </button>
                <button
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={() => cancelEdit("password")}
                >
                  취소
                </button>
              </div>
            )}
          </div>
          {!isEditing.password ? (
            <p className="text-sm text-gray-600">
              보안을 위해 비밀번호는 주기적으로 변경해주세요.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm text-gray-600"
                >
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm text-gray-600"
                >
                  새 비밀번호
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  영문, 숫자, 특수문자 조합 8-20자
                </p>
              </div>
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm text-gray-600"
                >
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          )}
        </div>

        {/* SNS 연동 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-black">
            SNS 계정 연동
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-yellow-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">K</span>
                </div>
                <span className="font-medium text-black">카카오 계정</span>
              </div>
              {userData.connectedSNS?.kakao ? (
                <button
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={() => handleSNSConnection("kakao", false)}
                >
                  연결 해제
                </button>
              ) : (
                <button
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => handleSNSConnection("kakao", true)}
                >
                  연결하기
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">N</span>
                </div>
                <span className="font-medium text-black">네이버 계정</span>
              </div>
              {userData.connectedSNS?.naver ? (
                <button
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={() => handleSNSConnection("naver", false)}
                >
                  연결 해제
                </button>
              ) : (
                <button
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => handleSNSConnection("naver", true)}
                >
                  연결하기
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">G</span>
                </div>
                <span className="font-medium text-black">구글 계정</span>
              </div>
              {userData.connectedSNS?.google ? (
                <button
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                  onClick={() => handleSNSConnection("google", false)}
                >
                  연결 해제
                </button>
              ) : (
                <button
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  onClick={() => handleSNSConnection("google", true)}
                >
                  연결하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 회원 탈퇴 섹션 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-black">회원 탈퇴</h2>
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 mb-4">
              회원 탈퇴 시 모든 계정 정보와 서비스 이용 기록이 삭제됩니다. 이
              작업은 되돌릴 수 없습니다.
            </p>
            <button
              className="text-red-600 hover:text-red-800 text-sm font-medium"
              onClick={handleAccountDeletion}
            >
              회원 탈퇴하기
            </button>
          </div>
        </div>

        {/* 비밀번호 확인 모달 */}
        {showPasswordModal.show && (
          <div
            className="fixed inset-0 overflow-y-auto"
            style={{ zIndex: 1001 }}
            aria-labelledby="modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                onClick={closePasswordModal}
              ></div>

              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3
                        className="text-lg leading-6 font-medium text-gray-900"
                        id="modal-title"
                      >
                        비밀번호 확인
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          회원님의 정보 보호를 위해 비밀번호를 다시 확인합니다.
                        </p>
                        <div className="mt-4">
                          <input
                            type="password"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="비밀번호 입력"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={verifyPasswordAndEdit}
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={closePasswordModal}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 파일 미리보기 모달 */}
        {showPreviewModal.show && (
          <div
            className="fixed inset-0 z-20 overflow-y-auto bg-black bg-opacity-50"
            aria-labelledby="preview-modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-center min-h-screen p-4">
              <div
                className="fixed inset-0"
                aria-hidden="true"
                onClick={closePreviewModal}
              ></div>

              <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* 모달 헤더 */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h3
                    className="text-lg font-medium text-gray-900"
                    id="preview-modal-title"
                  >
                    {showPreviewModal.fileName} 미리보기
                  </h3>
                  <button
                    onClick={closePreviewModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
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
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* 모달 내용 */}
                <div className="p-4 max-h-[70vh] overflow-auto">
                  <div className="flex justify-center">
                    {/* PDF나 이미지 파일에 따라 다른 미리보기 표시 */}
                    {showPreviewModal.fileName
                      .toLowerCase()
                      .includes(".pdf") ? (
                      <div className="text-center py-12">
                        <svg
                          className="w-24 h-24 text-red-500 mx-auto mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-gray-600 mb-4 text-lg">
                          PDF 파일은 브라우저에서 직접 미리보기할 수 없습니다.
                        </p>
                        <p className="text-sm text-gray-500">
                          다운로드 버튼을 클릭하여 파일을 확인해주세요.
                        </p>
                      </div>
                    ) : (
                      <Image
                        src={showPreviewModal.fileUrl}
                        alt={showPreviewModal.fileName}
                        width={800}
                        height={600}
                        className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `
                            <div class="text-center py-12">
                              <svg class="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                              </svg>
                              <p class="text-gray-600 mb-2 text-lg">파일을 미리보기할 수 없습니다.</p>
                              <p class="text-xs text-gray-500">URL: ${target.src}</p>
                            </div>
                          `;
                          }
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* 모달 푸터 */}
                <div className="flex justify-end space-x-3 p-4 border-t bg-gray-50">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={closePreviewModal}
                  >
                    닫기
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => {
                      handleFileDownload(
                        showPreviewModal.fileUrl,
                        showPreviewModal.fileName
                      );
                      closePreviewModal();
                    }}
                  >
                    다운로드
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdvertiserLoginRequiredGuard>
  );
}
