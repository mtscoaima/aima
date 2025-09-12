"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import RoleGuard from "@/components/RoleGuard";

export default function MessageTemplatesPage() {
  const router = useRouter();

  // 샘플 템플릿 데이터
  const [templates] = useState([
    {
      id: 1,
      name: "[샵플] 입실 안내 메시지",
      content: "안녕하세요. 샵플 입니다.\n오늘 예약하신 시간에 맞춰 입실해 주세요.\n\n예약 정보:\n- 일시: {날짜} {시간}\n- 서비스: {서비스명}\n\n감사합니다."
    }
  ]);

  const handleBackClick = () => {
    router.back();
  };

  const handleCreateTemplate = () => {
    // 템플릿 만들기 기능 (UI만 구현)
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEditTemplate = (_templateId: number) => {
    // 템플릿 수정 기능 (UI만 구현)
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleDeleteTemplate = (_templateId: number) => {
    // 템플릿 삭제 기능 (UI만 구퍨)
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
              내 템플릿
            </h1>
          </div>

          <div className="space-y-4">
            {/* 템플릿 목록 */}
            {templates.map((template) => (
              <div key={template.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-gray-900">{template.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditTemplate(template.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-md">
                  {template.content}
                </div>
              </div>
            ))}

            {/* 템플릿 만들기 버튼 */}
            <button
              onClick={handleCreateTemplate}
              className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium">템플릿 만들기</span>
            </button>

            {/* 빈 상태일 때의 메시지 (템플릿이 없을 때) */}
            {templates.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-lg font-medium mb-2">등록된 템플릿이 없습니다</p>
                <p className="text-sm">새로운 템플릿을 만들어보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}