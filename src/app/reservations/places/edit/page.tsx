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

export default function SpaceEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getAccessToken } = useAuth();
  const [space, setSpace] = useState<Space | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeName, setPlaceName] = useState("");
  const [iconName, setIconName] = useState("");
  const [iconColor, setIconColor] = useState("#8BC34A");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorOptions = [
    "#F59E0B", "#EF4444", "#EC4899", "#DC2626", "#06B6D4",
    "#1D4ED8", "#8BC34A", "#059669", "#A78BFA", "#78350F",
    "#6B7280", "#374151"
  ];

  const spaceId = searchParams.get('id');

  // 공간 정보 가져오기
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
      setPlaceName(data.space.name);
      setIconName(data.space.icon_text);
      setIconColor(data.space.icon_color);
    } catch (err) {
      console.error('Error fetching space:', err);
      setError(err instanceof Error ? err.message : '공간 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpace();
  }, [spaceId]);

  const handleBackClick = () => {
    router.back();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!placeName || placeName.length < 2) {
      alert('공간 이름을 2글자 이상 입력해주세요.');
      return;
    }

    if (!space) return;

    setIsSubmitting(true);
    
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('인증이 필요합니다. 로그인을 다시 시도해주세요.');
        return;
      }

      const spaceData = {
        name: placeName.trim(),
        icon_text: iconName.trim() || placeName.trim().substring(0, 2),
        icon_color: iconColor
      };

      const response = await fetch(`/api/reservations/spaces/${spaceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spaceData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '공간 수정에 실패했습니다.');
      }

      const { space } = await response.json();
      console.log('Space updated successfully:', space);
      
      alert('공간이 성공적으로 수정되었습니다!');
      router.back();
      
    } catch (error) {
      console.error('Error updating space:', error);
      alert(error instanceof Error ? error.message : '공간 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen bg-gray-50">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || '공간을 찾을 수 없습니다.'}</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-screen bg-gray-50">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={handleBackClick}
            className="mr-4 p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-gray-900">
            공간 이름 수정
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Place Name Input */}
          <div>
            <label className="block text-gray-900 font-medium mb-3">
              공간 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="공간 이름을 입력하세요(2글자 이상)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
              minLength={2}
            />
            <div className="flex items-start mt-2">
              <div className="text-gray-400 text-sm mr-2">ℹ️</div>
              <p className="text-gray-500 text-sm">
                공간 이름은 이용객에게 발송되는 메시지 앞부분과 결제 링크에서 자동으로 표시됩니다.
              </p>
            </div>
          </div>

          {/* Icon Settings */}
          <div>
            <h3 className="text-gray-900 font-medium mb-4">아이콘 설정</h3>
            
            {/* Icon Preview */}
            <div className="flex justify-center mb-6">
              <div 
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-xl font-semibold"
                style={{ backgroundColor: iconColor }}
              >
                {iconName.slice(0, 2) || placeName.slice(0, 2) || ""}
              </div>
            </div>

            {/* Icon Name Input */}
            <input
              type="text"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder={`아이콘 문구를 입력해 주세요. (비어있으면 "${placeName.substring(0, 2)}"로 자동 설정)`}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-6"
              maxLength={2}
            />

            {/* Icon Color Selector */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full flex items-center justify-between py-3"
              >
                <span className="text-gray-900 font-medium">아이콘 색상</span>
                <div className="flex items-center">
                  <div 
                    className="w-8 h-8 rounded-full mr-3"
                    style={{ backgroundColor: iconColor }}
                  ></div>
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    className={`text-gray-400 transition-transform ${
                      showColorPicker ? 'rotate-90' : ''
                    }`}
                  >
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </button>
              
              {/* Color Picker Grid */}
              {showColorPicker && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                  <div className="grid grid-cols-5 gap-4">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setIconColor(color);
                          setShowColorPicker(false);
                        }}
                        className={`w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                          iconColor === color 
                            ? 'ring-4 ring-gray-300 ring-opacity-50' 
                            : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-8">
            <button
              type="submit"
              disabled={!placeName || placeName.length < 2 || isSubmitting}
              className={`w-full py-4 rounded-lg font-medium text-white transition-colors ${
                placeName && placeName.length >= 2 && !isSubmitting
                  ? 'bg-gray-800 hover:bg-gray-900'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  공간 수정 중...
                </div>
              ) : (
                '완료'
              )}
            </button>
          </div>
        </form>
      </div>
    </RoleGuard>
  );
}