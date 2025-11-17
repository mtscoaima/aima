"use client";

import React, { useState, useEffect } from 'react';
import { X, Users, Plus, Trash2, RefreshCw } from 'lucide-react';
import AddProfileToGroupModal from './AddProfileToGroupModal';

interface Profile {
  senderKey: string;
  name?: string;
  phoneNumber?: string;
  categoryCode?: string;
  status?: string;
}

interface KakaoGroupDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onUpdate?: () => void;
}

const KakaoGroupDetailModal: React.FC<KakaoGroupDetailModalProps> = ({
  isOpen,
  onClose,
  groupId,
  onUpdate,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  if (!isOpen) return null;

  // 그룹 프로필 목록 조회 (MTS API)
  const fetchProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      const response = await fetch(`/api/kakao/groups/${groupId}/profiles`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 목록 조회 실패');
      }

      setProfiles(data.profiles || []);
    } catch (err) {
      console.error('프로필 목록 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  // 프로필 삭제
  const handleRemoveProfile = async (profile: Profile) => {
    if (!confirm(`"${profile.name || profile.senderKey}" 프로필을 그룹에서 제거하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      // profileId는 senderKey로 조회해야 함 (실제 구현에서는 로컬 DB와 매핑 필요)
      const response = await fetch(
        `/api/kakao/groups/${groupId}/profiles?senderKey=${encodeURIComponent(profile.senderKey)}&profileId=${encodeURIComponent(profile.senderKey)}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 제거 실패');
      }

      alert('프로필이 그룹에서 제거되었습니다');
      fetchProfiles();
      onUpdate?.();
    } catch (err) {
      console.error('프로필 제거 오류:', err);
      alert(err instanceof Error ? err.message : '프로필 제거 중 오류가 발생했습니다');
    }
  };

  // 초기 로드
  useEffect(() => {
    if (isOpen) {
      fetchProfiles();
    }
  }, [isOpen, groupId]);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-800">그룹 프로필 관리</h2>
                <p className="text-sm text-gray-500 mt-1">MTS API에서 실시간으로 조회</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 액션 버튼 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  총 {profiles.length}개 프로필
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchProfiles}
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  새로고침
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  프로필 추가
                </button>
              </div>
            </div>

            {/* 로딩 상태 */}
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">프로필 목록 로딩 중...</div>
              </div>
            )}

            {/* 에러 상태 */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                  onClick={fetchProfiles}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* 프로필 목록 */}
            {!loading && !error && profiles.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
                <Users className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-gray-500 mb-2">그룹에 프로필이 없습니다</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  첫 프로필 추가하기
                </button>
              </div>
            )}

            {!loading && !error && profiles.length > 0 && (
              <div className="space-y-3">
                {profiles.map((profile, index) => (
                  <div
                    key={profile.senderKey || index}
                    className="border border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 프로필 이름 */}
                        <h4 className="font-semibold text-gray-800 mb-1">
                          {profile.name || '(이름 없음)'}
                        </h4>

                        {/* Sender Key */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500">Sender Key:</span>
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                            {profile.senderKey}
                          </code>
                        </div>

                        {/* 전화번호 */}
                        {profile.phoneNumber && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">전화번호:</span>
                            <span className="text-sm text-gray-700">{profile.phoneNumber}</span>
                          </div>
                        )}

                        {/* 상태 */}
                        {profile.status && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">상태:</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              profile.status === 'ACTIVE' || profile.status === 'A'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {profile.status}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 삭제 버튼 */}
                      <button
                        onClick={() => handleRemoveProfile(profile)}
                        className="text-gray-400 hover:text-red-600 transition-colors p-2"
                        title="그룹에서 제거"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 하단 */}
          <div className="flex items-center justify-end p-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>

      {/* 프로필 추가 모달 */}
      <AddProfileToGroupModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        groupId={groupId}
        onSuccess={() => {
          fetchProfiles();
          onUpdate?.();
        }}
      />
    </>
  );
};

export default KakaoGroupDetailModal;
