"use client";

import React, { useState, useEffect } from "react";

import RoleGuard from "@/components/RoleGuard";

interface Space {
  id: number;
  name: string;
  host_contact_number_id?: number | null;
  host_contact_number?: {
    id: number;
    number: string;
    name: string;
    status: string;
  } | null;
}

interface SenderNumber {
  id: number;
  number: string;
  name: string;
  registrationDate: string;
  status: string;
  isDefault?: boolean;
  isSystem?: boolean;
  isUserPhone?: boolean;
}

export default function MessageSenderContactPage() {
  // 상태 관리
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<number | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [spacesLoading, setSpacesLoading] = useState(true);
  const [senderNumbers, setSenderNumbers] = useState<SenderNumber[]>([]);
  const [senderNumbersLoading, setSenderNumbersLoading] = useState(false);
  const [selectedNumberId, setSelectedNumberId] = useState<number | null>(null);
  const [isDefaultNumberModalOpen, setIsDefaultNumberModalOpen] = useState(false);
  const [isHostContactModalOpen, setIsHostContactModalOpen] = useState(false);
  const [isAddNumberModalOpen, setIsAddNumberModalOpen] = useState(false);

  // 공간 목록 조회
  const fetchSpaces = async () => {
    try {
      setSpacesLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/spaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSpaces(data.spaces || []);

        // 첫 번째 공간 자동 선택
        if (data.spaces && data.spaces.length > 0 && !selectedSpaceId) {
          setSelectedSpaceId(data.spaces[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
    } finally {
      setSpacesLoading(false);
    }
  };

  // 발신번호 목록 조회
  const fetchSenderNumbers = async () => {
    try {
      setSenderNumbersLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/sender-numbers", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // 시스템 기본번호 추가
        const systemNumber: SenderNumber = {
          id: -1,
          number: "[비공개]",
          name: "시스템 기본번호",
          registrationDate: "",
          status: "approved",
          isSystem: true,
        };

        setSenderNumbers([systemNumber, ...(data.senderNumbers || [])]);
      }
    } catch (error) {
      console.error("Error fetching sender numbers:", error);
    } finally {
      setSenderNumbersLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    fetchSpaces();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // spaces 업데이트 시 selectedSpace 동기화
  useEffect(() => {
    if (selectedSpaceId && spaces.length > 0) {
      const space = spaces.find((s) => s.id === selectedSpaceId);
      setSelectedSpace(space || null);
    }
  }, [spaces, selectedSpaceId]);

  // 공간 선택 변경
  const handleSpaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const spaceId = parseInt(e.target.value);
    setSelectedSpaceId(spaceId);
    const space = spaces.find((s) => s.id === spaceId);
    setSelectedSpace(space || null);
  };

  // 보내는 번호 설정 (준비중)
  const handleSenderNumberInfo = () => {
    setIsDefaultNumberModalOpen(true);
  };

  // 호스트 연락처 설정
  const handleHostContactInfo = () => {
    // 현재 선택된 공간의 host_contact_number_id 설정
    const currentHostContactId = selectedSpace?.host_contact_number_id || null;
    setSelectedNumberId(currentHostContactId);
    fetchSenderNumbers();
    setIsHostContactModalOpen(true);
  };

  // 호스트 연락처 선택 완료
  const handleSelectHostContact = async () => {
    if (!selectedSpaceId) return;

    try {
      const token = localStorage.getItem("accessToken");

      // -1 (시스템 기본번호)이면 null로 저장
      const hostContactNumberId = selectedNumberId === -1 ? null : selectedNumberId;

      const response = await fetch(`/api/reservations/spaces/${selectedSpaceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: selectedSpace?.name,
          host_contact_number_id: hostContactNumberId,
        }),
      });

      if (response.ok) {
        // 공간 목록 다시 조회하여 화면 갱신
        await fetchSpaces();
        setIsHostContactModalOpen(false);
        alert("호스트 연락처가 설정되었습니다.");
      } else {
        alert("호스트 연락처 설정에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error updating host contact:", error);
      alert("호스트 연락처 설정 중 오류가 발생했습니다.");
    }
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (number: string) => {
    if (!number) return "";
    if (number === "[비공개]") return number;

    const cleaned = number.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return number;
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">
              발신자 정보 설정
            </h1>
          </div>

          <div className="space-y-6">
            {/* 발신자 선택 드롭다운 */}
            <div className="relative">
              {spacesLoading ? (
                <div className="w-full p-4 bg-white border border-gray-200 rounded-lg text-gray-500">
                  로딩 중...
                </div>
              ) : spaces.length === 0 ? (
                <div className="w-full p-4 bg-white border border-gray-200 rounded-lg text-gray-500">
                  등록된 공간이 없습니다. 먼저 공간을 등록해주세요.
                </div>
              ) : (
                <>
                  <select
                    value={selectedSpaceId || ""}
                    onChange={handleSpaceChange}
                    className="w-full p-4 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {spaces.map((space) => (
                      <option key={space.id} value={space.id}>
                        📍 {space.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </>
              )}
            </div>

            {/* 보내는 번호 섹션 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">보내는 번호</h3>
                  <p className="text-gray-500 text-sm">[비공개]</p>
                </div>
                <button
                  onClick={handleSenderNumberInfo}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 호스트 연락처 섹션 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">호스트 연락처</h3>
                  {selectedSpace?.host_contact_number ? (
                    <div>
                      <p className="text-gray-900 text-sm font-medium">
                        {formatPhoneNumber(selectedSpace.host_contact_number.number)}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {selectedSpace.host_contact_number.name}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">연락처 입력하기</p>
                  )}
                </div>
                <button
                  onClick={handleHostContactInfo}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={!selectedSpace}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. 발신번호 안내 모달 */}
      {isDefaultNumberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-bold mb-2">발신번호 안내</h3>
              <p className="text-gray-600 mb-2">
                발신번호는 <strong>프로필의 전화번호</strong>가 사용됩니다.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm text-blue-800">
                  📌 전화번호 변경은 <strong>마이페이지 &gt; 프로필 설정</strong>에서 가능합니다.
                </p>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                모든 메시지는 회원님의 전화번호로 발송되며, 수신자가 회신할 수 있습니다.
              </p>
              <button
                onClick={() => setIsDefaultNumberModalOpen(false)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 호스트 연락처 선택 모달 */}
      {isHostContactModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">호스트 연락처 선택</h3>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                📌 발신번호는 프로필의 전화번호가 사용됩니다. 변경은 마이페이지 &gt; 프로필 설정에서 가능합니다.
              </p>
            </div>

            {senderNumbersLoading ? (
              <div className="text-center py-8 text-gray-500">로딩 중...</div>
            ) : senderNumbers.length === 0 ? (
              <div className="py-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800 mb-2">
                    발신번호는 <strong>프로필의 전화번호</strong>가 사용됩니다.
                  </p>
                  <p className="text-xs text-yellow-600">
                    전화번호가 등록되지 않은 경우 마이페이지에서 등록해주세요.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {senderNumbers.map((number) => (
                  <label
                    key={number.id}
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="hostContact"
                      value={number.id}
                      checked={selectedNumberId === number.id}
                      onChange={() => setSelectedNumberId(number.id)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatPhoneNumber(number.number)}</span>
                        {number.isDefault && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">기본</span>
                        )}
                        {number.isUserPhone && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">본인</span>
                        )}
                        {number.isSystem && (
                          <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">시스템</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{number.name}</div>
                      {number.status && (
                        <div className="text-xs text-gray-400">
                          상태: {number.status === "approved" ? "승인됨" : number.status}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setIsAddNumberModalOpen(true)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
              >
                발신번호 안내
              </button>
              <button
                onClick={() => {
                  setIsHostContactModalOpen(false);
                  setSelectedNumberId(null);
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleSelectHostContact}
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                disabled={selectedNumberId === null}
              >
                선택 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 발신번호 정책 안내 모달 (기존 등록 모달 대체) */}
      {isAddNumberModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-4xl mb-4">ℹ️</div>
              <h3 className="text-lg font-bold mb-4">발신번호 안내</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm text-blue-800 mb-2">
                  현재 발신번호는 <strong>프로필의 전화번호</strong>만 사용 가능합니다.
                </p>
                <p className="text-xs text-blue-600">
                  발신번호 변경이 필요한 경우 마이페이지 &gt; 프로필 설정에서 전화번호를 수정해주세요.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6 text-left">
                <p className="text-xs text-gray-600">
                  💡 모든 메시지는 회원님의 전화번호로 발송됩니다. 수신자가 해당 번호로 회신할 수 있습니다.
                </p>
              </div>

              <button
                onClick={() => setIsAddNumberModalOpen(false)}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
