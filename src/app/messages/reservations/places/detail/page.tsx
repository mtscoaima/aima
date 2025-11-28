"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import RoleGuard from "@/components/RoleGuard";

interface Space {
  id: number;
  name: string;
  icon_text: string;
  icon_color: string;
  created_at: string;
  updated_at: string;
}

export default function SpaceDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken } = useAuth();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSenderInfo, setShowSenderInfo] = useState(false);
  const [showSenderNumberInfo, setShowSenderNumberInfo] = useState(false);
  const [showHostContactModal, setShowHostContactModal] = useState(false);
  const [showHostContactInfo, setShowHostContactInfo] = useState(false);
  const [hostContact, setHostContact] = useState("");
  const [userPhoneNumber, setUserPhoneNumber] = useState<string>("");

  const spaceId = searchParams.get('id');

  // 컴포넌트 마운트 시 사용자 전화번호 조회
  useEffect(() => {
    const fetchUserPhone = async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        const response = await fetch("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data.phoneNumber) {
          setUserPhoneNumber(data.phoneNumber);
        }
      } catch (error) {
        console.error("전화번호 조회 오류:", error);
      }
    };

    fetchUserPhone();
  }, [getAccessToken]);

  useEffect(() => {
    const fetchSpace = async () => {
      if (!spaceId) {
        setError("공간 ID가 필요합니다.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = await getAccessToken();
        if (!token) {
          setError("인증이 필요합니다.");
          return;
        }

        const response = await fetch(`/api/reservations/spaces/${spaceId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('공간 정보를 불러오는데 실패했습니다.');
        }

        const data = await response.json();
        setSpace(data.space);
      } catch (err) {
        console.error('Error fetching space:', err);
        setError(err instanceof Error ? err.message : '공간 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSpace();
  }, [spaceId, getAccessToken]);

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7) + '-' + cleaned.slice(7);
    }
    return phone;
  };

  const handleEditName = () => {
    router.push(`/reservations/places/edit?id=${spaceId}`);
  };

  const handleSenderInfo = () => {
    setShowSenderInfo(!showSenderInfo);
  };

  const handleSenderNumberInfo = () => {
    setShowSenderNumberInfo(true);
  };

  const handleHostContactInput = () => {
    setShowHostContactModal(true);
  };

  const handleHostContactInfo = () => {
    setShowHostContactInfo(true);
  };

  const handleSaveHostContact = () => {
    // 호스트 연락처 저장 로직 (향후 구현)
    setShowHostContactModal(false);
    alert('호스트 연락처가 저장되었습니다.');
  };

  const handleCancelHostContact = () => {
    setShowHostContactModal(false);
    setHostContact("");
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["USER"]}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">공간 정보를 불러오는 중...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (error || !space) {
    return (
      <RoleGuard allowedRoles={["USER"]}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || '공간을 찾을 수 없습니다.'}</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-xl font-bold text-gray-900">
            공간 상세보기
          </h1>
        </div>

        <div className="space-y-8">
          {/* 공간 이름 섹션 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">공간 이름</h2>
              <button
                onClick={handleEditName}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                편집
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold mr-4"
                  style={{ backgroundColor: space.icon_color }}
                >
                  {space.icon_text}
                </div>
                <span className="text-lg font-medium text-gray-900">{space.name}</span>
              </div>
            </div>
          </div>

          {/* 메시지 발신자 정보 설정 */}
          <div>
            <button
              onClick={handleSenderInfo}
              className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-900 font-medium">메시지 발신자 정보 설정</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* 발신자 정보 드롭다운 */}
            {showSenderInfo && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-gray-700 font-medium">보내는 번호</span>
                    <span className="ml-2 text-gray-600">{userPhoneNumber ? formatPhoneNumber(userPhoneNumber) : "전화번호 미등록"}</span>
                  </div>
                  <button
                    onClick={handleSenderNumberInfo}
                    className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
                  >
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-gray-700 font-medium">호스트 연락처</span>
                    <button
                      onClick={handleHostContactInput}
                      className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      연락처 입력하기
                    </button>
                  </div>
                  <button
                    onClick={handleHostContactInfo}
                    className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center hover:bg-gray-400 transition-colors"
                  >
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 발신 전용 번호 정보 모달 */}
        {showSenderNumberInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">발신 번호 정보</h3>
                <div className="text-left space-y-3 mb-6">
                  <div className="flex items-start">
                    <span className="text-gray-900 mr-2">•</span>
                    <p className="text-gray-700 text-sm">
                      메시지는 로그인한 사용자의 전화번호({userPhoneNumber ? formatPhoneNumber(userPhoneNumber) : "미등록"})로 발송됩니다.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-900 mr-2">•</span>
                    <p className="text-gray-700 text-sm">
                      발신번호를 변경하려면 프로필 페이지에서 전화번호를 수정하세요.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-900 mr-2">•</span>
                    <p className="text-gray-700 text-sm">
                      고객님으로부터 연락 수신은 메시지 하단에 자동으로 입력되는 &apos;호스트 연락처&apos;를 통해 가능합니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSenderNumberInfo(false)}
                  className="w-full px-4 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 호스트 연락처 입력 모달 */}
        {showHostContactModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">호스트 연락처 수정</h3>
                <input
                  type="text"
                  value={hostContact}
                  onChange={(e) => setHostContact(e.target.value)}
                  placeholder="연락처를 입력하세요(번호, 링크 등)"
                  className="w-full px-4 py-3 border border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 mb-6"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={handleCancelHostContact}
                    className="flex-1 px-4 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveHostContact}
                    className="flex-1 px-4 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    완료
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 호스트 연락처 정보 모달 */}
        {showHostContactInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">호스트 연락처란?</h3>
                <div className="text-left space-y-3 mb-6">
                  <div className="flex items-start">
                    <span className="text-gray-900 mr-2">•</span>
                    <p className="text-gray-700 text-sm">
                      고객님이 호스트님게 직접 문의할 수 있도록 메시지 내용 하단에 자동으로 적히는 연락처입니다. 상세 내용은 미리보기에서 확인할 수 있습니다.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-900 mr-2">•</span>
                    <p className="text-gray-700 text-sm">
                      전화번호, 링크, 아이디 등 다양하게 문구를 입력할 수 있습니다
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHostContactInfo(false)}
                  className="w-full px-4 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}