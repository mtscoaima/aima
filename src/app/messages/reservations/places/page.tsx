"use client";

import React, { useState, useEffect, useCallback } from "react";
import RoleGuard from "@/components/RoleGuard";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Space {
  id: number;
  name: string;
  icon_text: string;
  icon_color: string;
  created_at: string;
  updated_at: string;
}

export default function ReservationPlacesPage() {
  const router = useRouter();
  const { getAccessToken } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);

  // 공간 목록 가져오기
  const fetchSpaces = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await getAccessToken();
      if (!token) {
        setError("인증이 필요합니다.");
        return;
      }

      const response = await fetch('/api/reservations/spaces', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('공간 목록을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      setSpaces(data.spaces || []);
    } catch (err) {
      console.error('Error fetching spaces:', err);
      setError(err instanceof Error ? err.message : '공간 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken]); // 의존성 배열에서 getAccessToken 제거

  // 공간 이름 변경 (편집 페이지로 이동)
  const handleRenameSpace = async (spaceId: number) => {
    router.push(`/reservations/places/edit?id=${spaceId}`);
    setOpenDropdownId(null);
  };


  // 공간 삭제 (예약도 함께 삭제)
  const handleDeleteSpace = async (spaceId: number, spaceName: string) => {
    if (!confirm(`"${spaceName}" 공간을 정말 삭제하시겠습니까?\n\n⚠️ 이 공간의 모든 예약도 함께 삭제됩니다.`)) {
      return;
    }
    setOpenDropdownId(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        alert('인증이 필요합니다.');
        return;
      }

      const response = await fetch(`/api/reservations/spaces/${spaceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '공간 삭제에 실패했습니다.');
      }

      alert('공간이 성공적으로 삭제되었습니다.');
      await fetchSpaces(); // 목록 새로고침
    } catch (err) {
      console.error('Error deleting space:', err);
      alert(err instanceof Error ? err.message : '공간 삭제에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setOpenDropdownId(null);
      }
    };

    if (openDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openDropdownId]);

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => router.back()}
            className="mr-4 p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            내 공간
          </h1>
        </div>

        {/* Description */}
        <div className="mb-8">
          <div className="flex items-start mb-4">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
            <p className="text-gray-600">
              오프라인에서 보유 및 운영 중인 공간을 추가하세요.
            </p>
          </div>
        </div>

        {/* Total spaces count */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            전체 공간 <span className="text-blue-600">{spaces.length}</span>
          </h2>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">공간 목록을 불러오는 중...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Space items */}
        {!loading && !error && (
          <>
            {spaces.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 공간이 없습니다</h3>
                <p className="text-gray-600 mb-6">첫 번째 공간을 추가해보세요!</p>
              </div>
            ) : (
              spaces.map((space) => (
                <div key={space.id} className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center flex-1 cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded-lg transition-colors"
                      onClick={() => router.push(`/reservations/places/detail?id=${space.id}`)}
                    >
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-semibold mr-4"
                        style={{ backgroundColor: space.icon_color }}
                      >
                        {space.icon_text}
                      </div>
                      <div>
                        <span className="text-gray-900 font-medium">{space.name}</span>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(space.created_at).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                    </div>
                    
                    {/* 더보기 버튼 */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === space.id ? null : space.id)}
                        className="text-gray-600 hover:text-gray-800 p-2"
                        title="더보기"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                      
                      {/* 드롭다운 메뉴 */}
                      {openDropdownId === space.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                          <div className="py-1">
                            <button
                              onClick={() => handleRenameSpace(space.id)}
                              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                            >
                              공간 이름 바꾸기
                            </button>
                            <button
                              onClick={() => handleDeleteSpace(space.id, space.name)}
                              className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                            >
                              삭제하기
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* Add space button */}
        <button 
          onClick={() => router.push('/messages/reservations/places/add')}
          className="w-full border-2 border-blue-300 border-dashed rounded-lg py-4 text-blue-600 font-medium hover:bg-blue-50 transition-colors"
        >
          공간 추가하기 +
        </button>
      </div>
    </RoleGuard>
  );
}