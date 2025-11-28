"use client";

import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface CreateKakaoGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateKakaoGroupModal: React.FC<CreateKakaoGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [groupKey, setGroupKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검증
    if (!groupKey.trim()) {
      setError('그룹 키를 입력하세요');
      return;
    }

    if (!name.trim()) {
      setError('그룹 이름을 입력하세요');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('로그인이 필요합니다');
      }

      const response = await fetch('/api/kakao/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          groupKey: groupKey.trim(),
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '그룹 생성 실패');
      }

      alert('그룹이 생성되었습니다');

      // 초기화
      setGroupKey('');
      setName('');
      setDescription('');

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('그룹 생성 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setGroupKey('');
      setName('');
      setDescription('');
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-lg shadow-xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">카카오 채널 그룹 생성</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 안내 메시지 */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-yellow-800 mb-1">⚠️ 그룹 키 발급 필요</p>
                <p className="text-yellow-700">
                  그룹 키는 MTS API를 통해 자동 생성되지 않습니다.
                  <br />
                  <strong>MTS 영업팀(support@mtsco.co.kr)</strong>에 문의하여 groupKey를 발급받은 후 입력하세요.
                </p>
              </div>
            </div>
          </div>

          {/* 그룹 키 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              그룹 키 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={groupKey}
              onChange={(e) => setGroupKey(e.target.value)}
              placeholder="MTS에서 발급받은 그룹 키를 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              예: @ABC1234DEF (MTS 담당자로부터 제공받은 키)
            </p>
          </div>

          {/* 그룹 이름 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              그룹 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="그룹 이름을 입력하세요 (예: 마케팅팀 채널 그룹)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
              required
            />
          </div>

          {/* 그룹 설명 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              그룹 설명 (선택)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="그룹에 대한 설명을 입력하세요"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              disabled={loading}
            />
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !groupKey.trim() || !name.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '생성 중...' : '그룹 생성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateKakaoGroupModal;
