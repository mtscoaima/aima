"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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

export default function SendingNumberTab() {
  const router = useRouter();
  
  // 발신번호 관리 관련 상태
  const [senderNumbers, setSenderNumbers] = useState<SenderNumber[]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [senderNumbersLoading, setSenderNumbersLoading] = useState(false);
  const [remainingCount, setRemainingCount] = useState(10);

  // 발신번호 모달 상태
  const [isAddNumberModalOpen, setIsAddNumberModalOpen] = useState(false);
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] = useState(false);
  const [numbersToDelete, setNumbersToDelete] = useState<SenderNumber[]>([]);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false);
  const [newNumberForm, setNewNumberForm] = useState({
    phoneNumber: "",
    displayName: "",
    carrier: "",
    documents: null as File | null,
  });

  // 전화번호 형식 변환 함수
  const formatPhoneNumber = (phoneNumber?: string) => {
    if (!phoneNumber) return phoneNumber;

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

  // 발신번호 삭제 모달 열기
  const handleDeleteNumbers = () => {
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

    // 준비중 모달 열기
    setIsComingSoonModalOpen(true);
    
    // 기존 로직은 주석 처리
    // const numbersToDelete = senderNumbers.filter(
    //   (num) => selectedNumbers.includes(num.id)
    // );
    // setNumbersToDelete(numbersToDelete);
    // setIsDeleteConfirmModalOpen(true);
  };

  // 발신번호 삭제 확인 처리
  const confirmDeleteNumbers = async () => {
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
      setIsDeleteConfirmModalOpen(false);
      setNumbersToDelete([]);
      await fetchSenderNumbers(); // 목록 새로고침
    } catch (error) {
      console.error("발신번호 삭제 오류:", error);
      alert(
        error instanceof Error ? error.message : "발신번호 삭제에 실패했습니다."
      );
    }
  };

  // 발신번호 삭제 모달 닫기
  const closeDeleteConfirmModal = () => {
    setIsDeleteConfirmModalOpen(false);
    setNumbersToDelete([]);
  };



  // 발신번호 추가 모달 열기
  const openAddNumberModal = () => {
    // 준비중 모달 열기
    setIsComingSoonModalOpen(true);
    
    // 기존 로직은 주석 처리
    // setNewNumberForm({ 
    //   phoneNumber: "", 
    //   displayName: "", 
    //   carrier: "", 
    //   documents: null 
    // });
    // setIsAddNumberModalOpen(true);
  };

  // 발신번호 추가 처리
  const handleAddNumber = async () => {
    if (!newNumberForm.phoneNumber) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    if (!newNumberForm.carrier) {
      alert("통신사를 선택해주세요.");
      return;
    }

    if (!newNumberForm.displayName) {
      alert("발신번호 명의자를 입력해주세요.");
      return;
    }

    // 서류는 선택사항이므로 검증하지 않음

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

      // JSON으로 간단하게 전송
      const response = await fetch("/api/sender-numbers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber: newNumberForm.phoneNumber,
          displayName: newNumberForm.displayName,
          carrier: newNumberForm.carrier,
          hasDocuments: !!newNumberForm.documents, // 서류 제출 여부만 전송
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "발신번호 추가에 실패했습니다");
      }

      alert("발신번호 등록 신청이 완료되었습니다. 심사 결과를 기다려주세요.");
      setIsAddNumberModalOpen(false);
      setNewNumberForm({ phoneNumber: "", displayName: "", carrier: "", documents: null });
      await fetchSenderNumbers(); // 목록 새로고침
    } catch (error) {
      console.error("발신번호 추가 오류:", error);
      alert(
        error instanceof Error ? error.message : "발신번호 추가에 실패했습니다."
      );
    }
  };

  // 발신번호명 수정 처리
  const handleEditNumberName = async () => {
    // 준비중 모달 열기
    setIsComingSoonModalOpen(true);
    
    // 기존 로직은 주석 처리
    /*
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
    */
  };
  return (
    <div className="space-y-6">
      {/* 탭 설명 */}
      <p className="text-sm text-gray-600">
        발신번호는 문자 메시지 발송에 사용되며 최대 10개까지 등록할 수 있습니다.
      </p>



      {/* 발신번호 목록 */}
      <div className="bg-white">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              발신번호 목록
            </h3>
            <div className="flex items-center space-x-2">

              <button
                onClick={openAddNumberModal}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                disabled={remainingCount <= 0 || senderNumbersLoading}
              >
                {senderNumbersLoading ? "로딩중..." : "신규 발신번호 등록"}
              </button>
              <button
                onClick={handleDeleteNumbers}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors disabled:bg-gray-300"
                disabled={selectedNumbers.length === 0 || senderNumbersLoading}
              >
                {senderNumbersLoading ? "처리중..." : "삭제"}
              </button>
            </div>
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
                          {formatPhoneNumber(number.number)}
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
                          onClick={() => handleEditNumberName()}
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
      {/* 발신번호 삭제 확인 모달 */}
      {isDeleteConfirmModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              확인
            </h3>

            <div className="mb-6">
              <div className="mb-4">
                {numbersToDelete.map((number) => (
                  <p key={number.id} className="text-sm text-gray-700 mb-2">
                    [{formatPhoneNumber(number.number)}]번호를 삭제하시겠습니까?
                  </p>
                ))}
              </div>
              
              <p className="text-sm text-gray-600 leading-relaxed">
                삭제한 발신번호를 재사용하시려면 필요서류 구비 후 다시 신청해 주셔야 합니다. 
                서류 미비 시 발신번호 재등록이 불가하여, 심사에는 시간이 소요되오니 삭제 전 꼭 숙지 바랍니다.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteConfirmModal}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDeleteNumbers}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 발신번호 추가 모달 */}
      {isAddNumberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                발신번호 등록
              </h3>
              <button
                onClick={() => {
                  setIsAddNumberModalOpen(false);
                  setNewNumberForm({ phoneNumber: "", displayName: "", carrier: "", documents: null });
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* 통신사 */}
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 w-32">
                  통신사
                </label>
                <div className="flex-1">
                  <select
                    value={newNumberForm.carrier}
                    onChange={(e) =>
                      setNewNumberForm((prev) => ({
                        ...prev,
                        carrier: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">통신사 선택</option>
                    <option value="skt">SKT</option>
                    <option value="kt">KT</option>
                    <option value="lgu">LG U+</option>
                    <option value="skt_mvno">SKT 알뜰폰</option>
                    <option value="kt_mvno">KT 알뜰폰</option>
                    <option value="lgu_mvno">LG U+ 알뜰폰</option>
                  </select>
                </div>
              </div>

              {/* 발신번호 입력 */}
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 w-32">
                  발신번호 입력
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newNumberForm.phoneNumber}
                    onChange={(e) =>
                      setNewNumberForm((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    placeholder="010-1111-4574"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={13}
                  />
                </div>
              </div>

              {/* 발신번호 명의자 */}
              <div className="flex items-center">
                <label className="block text-sm font-medium text-gray-700 w-32">
                  발신번호 명의자
                </label>
                <div className="flex-1">
                  <input
                    type="text"
                    value={newNumberForm.displayName}
                    onChange={(e) =>
                      setNewNumberForm((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    placeholder="명의자를 입력해주세요."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 증빙서류 제출 */}
              <div className="flex items-start">
                <label className="block text-sm font-medium text-gray-700 w-32 mt-2">
                  증빙서류 제출 <span className="text-gray-500 text-xs">(선택)</span>
                </label>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.jpg,.jpeg,.png';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          setNewNumberForm((prev) => ({
                            ...prev,
                            documents: file,
                          }));
                        }
                      };
                      input.click();
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                  >
                    파일 첨부
                  </button>
                  {newNumberForm.documents && (
                    <p className="text-sm text-gray-600 mt-2">
                      선택된 파일: {newNumberForm.documents.name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    서류는 나중에 제출할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 증빙서류 안내 */}
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="text-sm text-gray-700 space-y-2">
                  <div>
                    <p className="font-medium">1. 사업자 대표 또는 재직원</p>
                    <ul className="ml-4 space-y-1">
                      <li>- 통신서비스 이용가입증명원</li>
                      <li>- 번호소유자 재직증명서 (선택사항)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <p className="font-medium">2. 자회사, 계열사등 다른 사업자</p>
                    <ul className="ml-4 space-y-1">
                      <li>- 통신서비스 이용가입증명원</li>
                      <li>- 위임 관계증명서</li>
                      <li>- 발신번호 위임장</li>
                      <li>- 위임자 사업자등록증</li>
                    </ul>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-3">
                    ※증빙서류 관련 도움 요청→ <span 
                      className="text-blue-500 underline cursor-pointer hover:text-blue-700"
                      onClick={() => router.push('/support?tab=inquiry')}
                    >고객센터 문의</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => {
                  setIsAddNumberModalOpen(false);
                  setNewNumberForm({ phoneNumber: "", displayName: "", carrier: "", documents: null });
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAddNumber}
                disabled={!newNumberForm.phoneNumber || !newNumberForm.carrier || !newNumberForm.displayName}
                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 준비중 모달 */}
      {isComingSoonModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm mx-4">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">⏳</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                발신번호 관리
              </h3>
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
  );
}
