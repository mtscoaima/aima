"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Users, Trash2, Settings } from 'lucide-react';
import CreateKakaoGroupModal from '../modals/CreateKakaoGroupModal';
import KakaoGroupDetailModal from '../modals/KakaoGroupDetailModal';

interface Group {
  id: string;
  group_key: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

interface GroupListPanelProps {
  onRefresh?: () => void;
}

const GroupListPanel: React.FC<GroupListPanelProps> = ({ onRefresh }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 그룹 목록 조회
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      const response = await fetch('/api/kakao/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '그룹 목록 조회 실패');
      }

      setGroups(data.groups || []);
    } catch (err) {
      console.error('그룹 목록 조회 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  // 그룹 삭제
  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`"${groupName}" 그룹을 삭제하시겠습니까?\n그룹 내 프로필은 유지되며, 멤버십만 삭제됩니다.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      const response = await fetch(`/api/kakao/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '그룹 삭제 실패');
      }

      alert('그룹이 삭제되었습니다');
      fetchGroups(); // 목록 새로고침
      onRefresh?.(); // 상위 컴포넌트 새로고침
    } catch (err) {
      console.error('그룹 삭제 오류:', err);
      alert(err instanceof Error ? err.message : '그룹 삭제 중 오류가 발생했습니다');
    }
  };

  // 그룹 상세 보기
  const handleViewGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsDetailModalOpen(true);
  };

  // 초기 로드
  useEffect(() => {
    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={fetchGroups}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold">카카오 채널 그룹</h3>
          <span className="text-sm text-gray-500">({groups.length}개)</span>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          그룹 생성
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="text-blue-800 font-medium mb-1">💡 그룹 생성 안내</p>
        <p className="text-blue-700">
          그룹 키(groupKey)는 MTS 영업팀(support@mtsco.co.kr)에 요청하여 발급받아야 합니다.
          <br />
          그룹을 통해 여러 발신 프로필을 묶어서 템플릿을 공유할 수 있습니다.
        </p>
      </div>

      {/* 그룹 목록 */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 rounded-lg">
          <Users className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-gray-500 mb-2">아직 생성된 그룹이 없습니다</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            첫 그룹 만들기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="border border-gray-300 rounded-lg p-4 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer"
              onClick={() => handleViewGroup(group.id)}
            >
              {/* 그룹 이름 */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{group.name}</h4>
                  {group.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">{group.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteGroup(group.id, group.name);
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title="그룹 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 그룹 키 */}
              <div className="mb-3 p-2 bg-gray-50 rounded text-xs font-mono text-gray-700 truncate">
                {group.group_key}
              </div>

              {/* 멤버 수 */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>멤버 {group.member_count || 0}개</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewGroup(group.id);
                  }}
                  className="flex items-center gap-1 text-purple-600 hover:text-purple-700"
                >
                  <Settings className="w-4 h-4" />
                  <span>관리</span>
                </button>
              </div>

              {/* 생성일 */}
              <div className="mt-2 text-xs text-gray-500">
                생성: {new Date(group.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 그룹 생성 모달 */}
      <CreateKakaoGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchGroups();
          onRefresh?.();
        }}
      />

      {/* 그룹 상세 모달 */}
      {selectedGroupId && (
        <KakaoGroupDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedGroupId(null);
          }}
          groupId={selectedGroupId}
          onUpdate={() => {
            fetchGroups();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
};

export default GroupListPanel;
