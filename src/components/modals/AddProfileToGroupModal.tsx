"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle } from 'lucide-react';

interface Profile {
  id: string;
  sender_key: string;
  name: string;
  phone_number: string;
  category_code?: string;
  status: string;
  group_id?: string | null;
}

interface AddProfileToGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  onSuccess?: () => void;
}

const AddProfileToGroupModal: React.FC<AddProfileToGroupModalProps> = ({
  isOpen,
  onClose,
  groupId,
  onSuccess,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 프로필 목록 조회 (그룹에 속하지 않은 프로필만)
  const fetchAvailableProfiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      const response = await fetch('/api/kakao/profiles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 목록 조회 실패');
      }

      // 현재 그룹에 속하지 않은 프로필만 필터링
      const availableProfiles = (data.profiles || []).filter(
        (p: Profile) => !p.group_id || p.group_id !== groupId
      );

      setProfiles(availableProfiles);
      setFilteredProfiles(availableProfiles);
    } catch (err) {
      console.error('프로필 목록 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProfiles(profiles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = profiles.filter((profile) =>
      profile.name.toLowerCase().includes(query) ||
      profile.sender_key.toLowerCase().includes(query) ||
      profile.phone_number.includes(query)
    );

    setFilteredProfiles(filtered);
  }, [searchQuery, profiles]);

  // 프로필 추가
  const handleAddProfile = async () => {
    if (!selectedProfileId) {
      alert('추가할 프로필을 선택하세요');
      return;
    }

    const selectedProfile = profiles.find((p) => p.id === selectedProfileId);
    if (!selectedProfile) {
      alert('선택한 프로필을 찾을 수 없습니다');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      const response = await fetch(`/api/kakao/groups/${groupId}/profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          senderKey: selectedProfile.sender_key,
          profileId: selectedProfile.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '프로필 추가 실패');
      }

      alert('프로필이 그룹에 추가되었습니다');

      // 초기화
      setSelectedProfileId(null);
      setSearchQuery('');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('프로필 추가 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setSubmitting(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    if (isOpen) {
      fetchAvailableProfiles();
      setSelectedProfileId(null);
      setSearchQuery('');
    }
  }, [isOpen, groupId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">그룹에 프로필 추가</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 */}
        <div className="p-6 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="프로필 이름, Sender Key, 전화번호로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading || submitting}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            현재 그룹에 속하지 않은 프로필만 표시됩니다
          </p>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 로딩 상태 */}
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">프로필 목록 로딩 중...</div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && !loading && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          {/* 프로필 없음 */}
          {!loading && filteredProfiles.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <p className="mb-2">
                {searchQuery ? '검색 결과가 없습니다' : '추가 가능한 프로필이 없습니다'}
              </p>
              <p className="text-sm">
                {!searchQuery && '모든 프로필이 이미 그룹에 속해 있거나 등록된 프로필이 없습니다'}
              </p>
            </div>
          )}

          {/* 프로필 목록 */}
          {!loading && filteredProfiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                총 {filteredProfiles.length}개 프로필
              </p>
              {filteredProfiles.map((profile) => (
                <div
                  key={profile.id}
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedProfileId === profile.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* 프로필 이름 */}
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800">{profile.name}</h4>
                        {selectedProfileId === profile.id && (
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        )}
                      </div>

                      {/* Sender Key */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-500">Sender Key:</span>
                        <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                          {profile.sender_key}
                        </code>
                      </div>

                      {/* 전화번호 */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">전화번호:</span>
                        <span className="text-sm text-gray-700">{profile.phone_number}</span>
                      </div>
                    </div>

                    {/* 상태 */}
                    <div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        profile.status === 'active' || profile.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {profile.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 p-6 border-t bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            취소
          </button>
          <button
            onClick={handleAddProfile}
            disabled={submitting || !selectedProfileId}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {submitting ? '추가 중...' : '그룹에 추가'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProfileToGroupModal;
