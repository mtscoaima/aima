"use client";

import React, { useState } from "react";
import { changePassword } from "@/lib/api";

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordErrors {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  general: string;
}

interface PasswordTabProps {
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

export default function PasswordTab({
  isSaving,
  setIsSaving,
}: PasswordTabProps) {
  // 비밀번호 변경 상태
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 비밀번호 변경 에러 상태
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    general: "",
  });

  // 비밀번호 변경 데이터 입력 처리
  const handlePasswordDataChange = (
    field: keyof PasswordData,
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

        // 현재 비밀번호와 새 비밀번호가 같은지 검증
        if (value === passwordData.currentPassword && passwordData.currentPassword.length > 0) {
          newErrors.newPassword = "새 비밀번호는 현재 비밀번호와 달라야 합니다.";
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

    // 현재 비밀번호가 변경되면 새 비밀번호와 다시 비교
    if (
      field === "currentPassword" &&
      passwordData.newPassword.length > 0 &&
      value === passwordData.newPassword
    ) {
      newErrors.newPassword = "새 비밀번호는 현재 비밀번호와 달라야 합니다.";
    }

    setPasswordErrors(newErrors);
  };

  // 비밀번호 변경 처리
  const handlePasswordSubmit = async () => {
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

      // 현재 비밀번호와 새 비밀번호가 같은지 검증
      if (passwordData.newPassword === passwordData.currentPassword) {
        newErrors.newPassword = "새 비밀번호는 현재 비밀번호와 달라야 합니다.";
        hasError = true;
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

    try {
      setIsSaving(true);

      // 실제 API 호출로 비밀번호 변경 - 부모에서 이동
      await changePassword(passwordData);

      // 성공 메시지 표시
      alert(
        "비밀번호가 성공적으로 변경되었습니다. 보안을 위해 다시 로그인해주세요."
      );
      
      // 성공 시 폼 초기화
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
    } catch (error) {
      // 에러 처리
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
  return (
    <div className="space-y-6">
      {/* 탭 설명 */}
      <p className="text-sm text-gray-600">
        안전한 서비스 이용을 위해 비밀번호를 변경해주세요.
      </p>

      <div>
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
              onClick={handlePasswordSubmit}
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
}
