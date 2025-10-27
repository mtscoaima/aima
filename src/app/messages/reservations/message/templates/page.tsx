"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import RoleGuard from "@/components/RoleGuard";
import { previewTemplate } from "@/utils/messageTemplateParser";

interface Template {
  id: number;
  name: string;
  content: string;
  category?: string;
  is_active?: boolean;
  created_at?: string;
}

export default function MessageTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    category: "기타",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [expandedTemplateId, setExpandedTemplateId] = useState<number | null>(null);
  const createTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 템플릿 목록 불러오기
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/reservations/message-templates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("템플릿을 불러오는데 실패했습니다");
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("템플릿 로딩 오류:", error);
      alert(error instanceof Error ? error.message : "템플릿을 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 템플릿 만들기 모달 열기
  const handleCreateTemplate = () => {
    setFormData({ name: "", content: "", category: "기타" });
    setIsCreateModalOpen(true);
  };

  // 템플릿 생성
  const handleSubmitCreate = async () => {
    if (!formData.name || !formData.content) {
      alert("템플릿 이름과 내용을 입력해주세요");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/message-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "템플릿 생성에 실패했습니다");
      }

      alert("템플릿이 생성되었습니다");
      setIsCreateModalOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error("템플릿 생성 오류:", error);
      alert(error instanceof Error ? error.message : "템플릿 생성에 실패했습니다");
    }
  };

  // 템플릿 수정 모달 열기
  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category || "기타",
    });
    setIsEditModalOpen(true);
  };

  // 템플릿 수정
  const handleSubmitEdit = async () => {
    if (!editingTemplate) return;

    if (!formData.name || !formData.content) {
      alert("템플릿 이름과 내용을 입력해주세요");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/reservations/message-templates/${editingTemplate.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "템플릿 수정에 실패했습니다");
      }

      alert("템플릿이 수정되었습니다");
      setIsEditModalOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("템플릿 수정 오류:", error);
      alert(error instanceof Error ? error.message : "템플릿 수정에 실패했습니다");
    }
  };

  // 템플릿 삭제
  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm("정말로 이 템플릿을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `/api/reservations/message-templates/${templateId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "템플릿 삭제에 실패했습니다");
      }

      alert("템플릿이 삭제되었습니다");
      fetchTemplates();
    } catch (error) {
      console.error("템플릿 삭제 오류:", error);
      alert(error instanceof Error ? error.message : "템플릿 삭제에 실패했습니다");
    }
  };

  // 미리보기 토글
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  // 템플릿 펼침/접힘 토글
  const handleToggleTemplate = (templateId: number) => {
    setExpandedTemplateId(expandedTemplateId === templateId ? null : templateId);
  };

  // 변수 삽입 함수
  const insertVariable = (variable: string, textareaRef: React.RefObject<HTMLTextAreaElement | null>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;

    const newContent =
      currentContent.substring(0, start) +
      variable +
      currentContent.substring(end);

    setFormData({ ...formData, content: newContent });

    // 커서를 삽입된 변수 뒤로 이동
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + variable.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 변수 목록
  const variables = [
    { label: "고객명", value: "{{고객명}}" },
    { label: "공간명", value: "{{공간명}}" },
    { label: "예약날짜", value: "{{예약날짜}}" },
    { label: "체크인시간", value: "{{체크인시간}}" },
    { label: "체크아웃시간", value: "{{체크아웃시간}}" },
    { label: "인원수", value: "{{인원수}}" },
    { label: "총금액", value: "{{총금액}}" },
    { label: "입금액", value: "{{입금액}}" },
    { label: "잔금", value: "{{잔금}}" },
    { label: "전화번호", value: "{{전화번호}}" },
    { label: "특이사항", value: "{{특이사항}}" },
  ];

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">내 템플릿</h1>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <p className="text-gray-500">템플릿을 불러오는 중...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 템플릿 목록 */}
              {templates.map((template) => {
                const isExpanded = expandedTemplateId === template.id;
                return (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleToggleTemplate(template.id)}
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {template.name}
                          </h3>
                          {/* 펼침/접힘 아이콘 */}
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                              isExpanded ? 'transform rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                        {template.category && (
                          <span className="text-xs text-gray-500">
                            {template.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(template);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* 펼쳐진 경우에만 내용 표시 */}
                    {isExpanded && (
                      <div className="mt-3 text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-md transition-all duration-200">
                        {template.content}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 템플릿 만들기 버튼 */}
              <button
                onClick={handleCreateTemplate}
                className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="font-medium">템플릿 만들기</span>
              </button>

              {/* 빈 상태일 때의 메시지 (템플릿이 없을 때) */}
              {templates.length === 0 && (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-lg font-medium mb-2">
                    등록된 템플릿이 없습니다
                  </p>
                  <p className="text-sm">새로운 템플릿을 만들어보세요.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 템플릿 생성 모달 */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  템플릿 만들기
                </h2>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 템플릿 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    템플릿 이름<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="예: 예약 확정 안내"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                </div>

                {/* 카테고리 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="예약 확정 안내">예약 확정 안내</option>
                    <option value="이용시작 안내">이용시작 안내</option>
                    <option value="이용종료 안내">이용종료 안내</option>
                    <option value="예약 변경 안내">예약 변경 안내</option>
                    <option value="예약 취소 안내">예약 취소 안내</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                {/* 템플릿 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    템플릿 내용<span className="text-red-500">*</span>
                  </label>

                  {/* 변수 삽입 버튼들 */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">템플릿 내 변수 사용 가능하도록 버튼형으로 기능추가</p>
                    <div className="flex flex-wrap gap-2">
                      {variables.map((variable) => (
                        <button
                          key={variable.label}
                          type="button"
                          onClick={() => insertVariable(variable.value, createTextareaRef)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-md transition-colors duration-150 flex items-center gap-1"
                        >
                          <span>+</span>
                          <span>{variable.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    ref={createTextareaRef}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="안녕하세요 {{고객명}}님, {{예약날짜}} {{체크인시간}}에 {{공간명}}에서 뵙겠습니다."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.content.length} / 2000자
                  </p>
                </div>

                {/* 미리보기 */}
                {showPreview && formData.content && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      미리보기 (샘플 데이터):
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {previewTemplate(formData.content)}
                    </p>
                  </div>
                )}

                {/* 미리보기 토글 버튼 */}
                <button
                  onClick={handleTogglePreview}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  {showPreview ? "미리보기 숨기기" : "미리보기"}
                </button>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitCreate}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 템플릿 수정 모달 (생성 모달과 유사) */}
      {isEditModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  템플릿 수정
                </h2>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTemplate(null);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* 템플릿 이름 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    템플릿 이름<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                </div>

                {/* 카테고리 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    카테고리
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="예약 확정 안내">예약 확정 안내</option>
                    <option value="이용시작 안내">이용시작 안내</option>
                    <option value="이용종료 안내">이용종료 안내</option>
                    <option value="예약 변경 안내">예약 변경 안내</option>
                    <option value="예약 취소 안내">예약 취소 안내</option>
                    <option value="기타">기타</option>
                  </select>
                </div>

                {/* 템플릿 내용 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    템플릿 내용<span className="text-red-500">*</span>
                  </label>

                  {/* 변수 삽입 버튼들 */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">템플릿 내 변수 사용 가능하도록 버튼형으로 기능추가</p>
                    <div className="flex flex-wrap gap-2">
                      {variables.map((variable) => (
                        <button
                          key={variable.label}
                          type="button"
                          onClick={() => insertVariable(variable.value, editTextareaRef)}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs rounded-md transition-colors duration-150 flex items-center gap-1"
                        >
                          <span>+</span>
                          <span>{variable.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    ref={editTextareaRef}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[200px]"
                    maxLength={2000}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.content.length} / 2000자
                  </p>
                </div>

                {/* 미리보기 */}
                {showPreview && formData.content && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      미리보기 (샘플 데이터):
                    </p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">
                      {previewTemplate(formData.content)}
                    </p>
                  </div>
                )}

                {/* 미리보기 토글 버튼 */}
                <button
                  onClick={handleTogglePreview}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  {showPreview ? "미리보기 숨기기" : "미리보기"}
                </button>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingTemplate(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSubmitEdit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </RoleGuard>
  );
}
