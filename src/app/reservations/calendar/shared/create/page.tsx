"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/RoleGuard";

interface Space {
  id: number;
  name: string;
  icon_text: string;
  icon_color: string;
}

export default function CreateSharedCalendarPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    selectedSpaceIds: [] as number[],
    reservationDescription: ""
  });

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/spaces", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSpaces(data.spaces || []);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleSpaceSelection = (spaceId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedSpaceIds: prev.selectedSpaceIds.includes(spaceId)
        ? prev.selectedSpaceIds.filter(id => id !== spaceId)
        : [...prev.selectedSpaceIds, spaceId]
    }));
  };

  const handleCreateCalendar = async () => {
    if (!formData.title.trim()) {
      alert("캘린더 제목을 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/shared-calendars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          spaceIds: formData.selectedSpaceIds,
          reservationDescription: formData.reservationDescription || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create shared calendar");
      }

      alert("공유 캘린더가 생성되었습니다.");
      router.push("/reservations/calendar/shared");
    } catch (error) {
      console.error("Error creating calendar:", error);
      alert("캘린더 생성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center mb-8">
            <button 
              onClick={handleBackClick}
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900">
              공유 캘린더 만들기
            </h1>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  공유 캘린더 링크를 게시하면 고객님이 실시간 예약 현황을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* 캘린더 제목 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                캘린더 제목
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">캘린더에 표시됩니다</p>
            </div>

            {/* 캘린더 선택 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                캘린더 선택
              </label>
              <p className="text-sm text-gray-600 mb-3">
                표시할 캘린더를 선택하세요. 여러 개를 선택할 수 있습니다. (비선택시 전체 공간)
              </p>
              {loading ? (
                <p className="text-gray-500">로딩 중...</p>
              ) : spaces.length === 0 ? (
                <p className="text-gray-500">등록된 공간이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {spaces.map((space) => (
                    <div
                      key={space.id}
                      onClick={() => toggleSpaceSelection(space.id)}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.selectedSpaceIds.includes(space.id)
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-sm flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: space.icon_color }}
                      >
                        {space.icon_text}
                      </div>
                      <span className={`font-medium ${
                        formData.selectedSpaceIds.includes(space.id)
                          ? "text-green-800"
                          : "text-gray-900"
                      }`}>
                        {space.name}
                      </span>
                      {formData.selectedSpaceIds.includes(space.id) && (
                        <svg className="w-5 h-5 ml-auto text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 예약 문의 설명글 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3 flex items-center">
                예약 문의 설명글
                <button type="button" className="ml-2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                예약 문의 버튼을 누르면 표시되는 문구입니다.
              </p>

              <textarea
                value={formData.reservationDescription}
                onChange={(e) => handleInputChange("reservationDescription", e.target.value)}
                placeholder="예약 문의 시 표시될 설명글을 입력하세요"
                rows={6}
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />

              <div className="bg-gray-50 p-4 rounded-lg space-y-4 mt-3">
                <div>
                  <p className="text-sm text-gray-700 mb-2">
                    설명글을 자유롭게 수정해서 이용하세요.
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    링크와 전화번호는 바로가기로 인식됩니다.
                  </p>
                  <p className="text-sm text-gray-700 mb-4">
                    (단, 링크는 http로 시작하는 전체 URL, 전화번호는 하이픈( - )이 있는 경우에만 인식됩니다.)
                  </p>

                  <p className="text-sm text-gray-700 mb-2">예시)</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span>♦️</span>
                      <span className="font-medium">공간 예약 문의</span>
                    </div>
                    <div className="flex items-center space-x-2 text-purple-600">
                      <span>💜</span>
                      <span>카카오톡 : http://pf.kakao.com/_IREab</span>
                    </div>
                    <div className="flex items-center space-x-2 text-pink-600">
                      <span>📞</span>
                      <span>전화번호 : 010-0000-0000</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>• 예약처명은 &apos;김**&apos; 형식으로 별 앞글자만 표기됩니다.</p>
                <p>• 과거 날짜의 예약 정보도 표시되지 않습니다.</p>
              </div>
            </div>

            {/* 만들기 버튼 */}
            <div className="pt-4">
              <button
                onClick={handleCreateCalendar}
                disabled={!formData.title.trim() || submitting}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  !formData.title.trim() || submitting
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                {submitting ? "생성 중..." : "공유 캘린더 만들기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}