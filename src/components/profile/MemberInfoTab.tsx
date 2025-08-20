"use client";

import React, { useState, useEffect, useCallback } from "react";
import { updateUserInfo, tokenManager, withdrawUser } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface UserProfileData {
  username?: string;
  name: string;
  email: string;
  phoneNumber: string;
  smsMarketing?: boolean;
  emailMarketing?: boolean;
  // SNS 연동 상태 - 부모에서 받던 데이터
  kakao_user_id?: string;
  naver_user_id?: string;
  google_user_id?: string;
  [key: string]: string | boolean | object | undefined;
}

interface MemberInfoTabProps {
  userData: UserProfileData;
  onUserDataUpdate: (newUserData: Partial<UserProfileData>) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

export default function MemberInfoTab({
  userData,
  onUserDataUpdate,
  isSaving,
  setIsSaving,
}: MemberInfoTabProps) {
  const { logout } = useAuth();
  const router = useRouter();

  // 휴대폰 변경 관련 상태 - 부모에서 이동
  const [isPhoneChangeVerificationLoading, setIsPhoneChangeVerificationLoading] = useState(false);

  // 회원탈퇴 관련 상태 - 부모에서 이동
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [isWithdrawalCompleteModalOpen, setIsWithdrawalCompleteModalOpen] = useState(false);
  // SNS 연동 상태 - 부모에서 이동
  const [snsLinkedAccounts, setSnsLinkedAccounts] = useState({
    kakao: false,
    naver: false,
    google: false,
  });

  // SNS 연동 로딩 상태 - 부모에서 이동
  const [snsLinking, setSnsLinking] = useState({
    kakao: false,
    naver: false,
    google: false,
  });

  // 카카오 액세스 토큰 획득 - 부모에서 이동
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

  // 네이버 액세스 토큰 획득 - 부모에서 이동
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

  // 구글 액세스 토큰 획득 - 부모에서 이동
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

  // SNS 연동 함수 - 부모에서 이동
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

  // SNS 연동 해제 함수 - 부모에서 이동
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

  // 휴대폰 번호 업데이트 처리 - 부모에서 이동
  const handlePhoneUpdate = useCallback(async (newPhoneNumber: string) => {
    try {
      // 휴대폰 번호 업데이트
      await updateUserInfo({
        phoneNumber: newPhoneNumber,
      });

      // 로컬 상태 업데이트
      onUserDataUpdate({
        phoneNumber: newPhoneNumber,
      });

      alert("휴대폰 번호가 성공적으로 변경되었습니다.");

      // 로딩 상태 초기화
      setIsPhoneChangeVerificationLoading(false);
    } catch (error) {
      console.error("휴대폰 번호 변경 실패:", error);
      alert("휴대폰 번호 변경에 실패했습니다. 다시 시도해주세요.");
    }
  }, [onUserDataUpdate]);

  // 본인인증을 통한 휴대폰 변경 - 부모에서 이동
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

  // 회원 탈퇴 모달 열기 - 부모에서 이동
  const handleWithdrawalClick = () => {
    setIsWithdrawalModalOpen(true);
  };

  // 회원 탈퇴 모달 닫기 - 부모에서 이동
  const handleWithdrawalModalClose = () => {
    setIsWithdrawalModalOpen(false);
  };

  // 회원 탈퇴 처리 - 부모에서 이동
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

  // 휴대폰 변경 본인인증 팝업 메시지 리스너 - 부모에서 이동
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

  // userData 변경 시 SNS 연동 상태 초기화
  useEffect(() => {
    if (userData) {
      setSnsLinkedAccounts({
        kakao: !!userData.kakao_user_id,
        naver: !!userData.naver_user_id,
        google: !!userData.google_user_id,
      });
    }
  }, [userData]);

  const handleMarketingConsentChange = async (
    type: "sms" | "email",
    checked: boolean
  ) => {
    const fieldName = type === "sms" ? "smsMarketing" : "emailMarketing";
    const apiFieldName =
      type === "sms" ? "smsMarketingConsent" : "emailMarketingConsent";

    // 로컬 상태 업데이트
    onUserDataUpdate({
      [fieldName]: checked,
    });

    // API 호출로 즉시 업데이트
    try {
      await updateUserInfo({
        [apiFieldName]: checked,
      });
    } catch (error) {
      console.error(`${type} 마케팅 동의 업데이트 실패:`, error);
      // 실패 시 이전 상태로 되돌리기
      onUserDataUpdate({
        [fieldName]: !checked,
      });
      alert(`${type} 마케팅 동의 설정 변경에 실패했습니다.`);
    }
  };

  return (
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
                          onChange={(e) =>
                            handleMarketingConsentChange("sms", e.target.checked)
                          }
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">문자</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={userData.emailMarketing || false}
                          onChange={(e) =>
                            handleMarketingConsentChange("email", e.target.checked)
                          }
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
        <div className="flex justify-center mt-4">
          <p className="text-sm text-gray-600">
            더이상 서비스를 이용하지 않을 경우{" "}
            <button
              onClick={handleWithdrawalClick}
              className="text-blue-500 hover:text-blue-700 underline font-medium"
            >
              회원탈퇴
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

      {/* 회원 탈퇴 모달 - 부모에서 이동 */}
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

      {/* 회원탈퇴 완료 모달 - 부모에서 이동 */}
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
    </div>
  );
}
