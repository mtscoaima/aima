"use client";

import React, { useState, useEffect } from "react";

interface SenderNumber {
  id: number;
  number: string;
  name: string;
  registrationDate: string;
  status: string;
  isDefault: boolean;
  isVerified?: boolean;
  isUserPhone?: boolean;
}

interface User {
  phoneNumber?: string;
}

interface SendingNumberTabProps {
  user: User | null;
}

export default function SendingNumberTab({
  user,
}: SendingNumberTabProps) {
  // 발신번호 관리 관련 상태
  const [senderNumbers, setSenderNumbers] = useState<SenderNumber[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [defaultNumber, setDefaultNumber] = useState<string>("");
  const [senderNumbersLoading, setSenderNumbersLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [remainingCount, setRemainingCount] = useState(10);

  // 발신번호 모달 상태
  const [isChangeDefaultModalOpen, setIsChangeDefaultModalOpen] = useState(false);
  const [isAddNumberModalOpen, setIsAddNumberModalOpen] = useState(false);
  const [selectedDefaultNumber, setSelectedDefaultNumber] = useState<number | null>(null);
  const [newNumberForm, setNewNumberForm] = useState({
    phoneNumber: "",
    displayName: "",
  });

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
      alert("발신번호 목록을 불러오는데 실패했습니다.");
    } finally {
      setSenderNumbersLoading(false);
    }
  };

  // 컴포넌트 마운트 시 발신번호 목록 가져오기
  useEffect(() => {
    fetchSenderNumbers();
  }, []);

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
  return (
    <div className="space-y-6">
      {/* 탭 설명 */}
      <p className="text-sm text-gray-600">
        발신번호는 문자 메시지 발송에 사용되며 최대 10개까지 등록할 수 있습니다.
      </p>

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

      {/* 기본 발신번호 변경 모달 */}
      {isChangeDefaultModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
      )}

      {/* 발신번호 추가 모달 */}
      {isAddNumberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
      )}
    </div>
  );
}
