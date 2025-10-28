"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import RoleGuard from "@/components/RoleGuard";

interface AutoRule {
  id: number;
  rule_name: string;
  trigger_type: string;
  time_type: string;
  time_value: number | null;
  time_direction: string | null;
  absolute_time: string | null;
  is_active: boolean;
  spaces: {
    id: number;
    name: string;
  };
  reservation_message_templates: {
    id: number;
    name: string;
  };
  created_at: string;
}

export default function MessageAutoPage() {
  const router = useRouter();
  const [rules, setRules] = useState<AutoRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }

      const response = await fetch("/api/reservations/auto-rules", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("자동 발송 규칙 조회 실패");
      }

      const data = await response.json();
      setRules(data.rules);
    } catch (error) {
      console.error("자동 발송 규칙 조회 오류:", error);
      alert("자동 발송 규칙을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateAutoRule = () => {
    router.push('/messages/reservations/message/auto/create');
  };

  // 활성화/비활성화 토글
  const handleToggleActive = async (ruleId: number, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/reservations/auto-rules/${ruleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("규칙 상태 변경 실패");
      }

      // 목록 새로고침
      fetchRules();
    } catch (error) {
      console.error("규칙 상태 변경 오류:", error);
      alert("규칙 상태 변경에 실패했습니다.");
    }
  };

  // 규칙 삭제
  const handleDeleteRule = async (ruleId: number, ruleName: string) => {
    if (!confirm(`"${ruleName}" 규칙을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/reservations/auto-rules/${ruleId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("규칙 삭제 실패");
      }

      alert("규칙이 삭제되었습니다.");
      fetchRules();
    } catch (error) {
      console.error("규칙 삭제 오류:", error);
      alert("규칙 삭제에 실패했습니다.");
    }
  };

  // 규칙 편집
  const handleEditRule = (ruleId: number) => {
    router.push(`/reservations/message/auto/edit/${ruleId}`);
  };

  // 시간 설명 생성
  const getTimeDescription = (rule: AutoRule) => {
    const triggerText = rule.trigger_type === "check_in" ? "입실" : "퇴실";

    if (rule.time_type === "relative") {
      const hours = Math.floor((rule.time_value || 0) / 60);
      const minutes = (rule.time_value || 0) % 60;
      const timeText =
        hours > 0
          ? minutes > 0
            ? `${hours}시간 ${minutes}분`
            : `${hours}시간`
          : `${minutes}분`;
      const directionText = rule.time_direction === "before" ? "전" : "후";
      return `${triggerText} ${timeText} ${directionText}`;
    } else {
      const daysText =
        rule.time_value === 0
          ? "당일"
          : rule.time_value === 1
          ? "1일 전"
          : `${rule.time_value}일 전`;
      const time = rule.absolute_time?.substring(0, 5) || "";
      return `${triggerText} ${daysText} ${time}`;
    }
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">
              자동 메시지 설정
            </h1>
          </div>

          <div className="space-y-6">
            {/* 안내 메시지 */}
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    SMS 메시지를 발송 규칙에 따라 자동으로 보낼 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 등록된 발송 규칙 */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                등록된 발송 규칙 <span className="text-blue-500">{rules.length}</span>
              </h2>

              {loading ? (
                <div className="text-center py-8 text-gray-500">로딩 중...</div>
              ) : rules.length === 0 ? (
                <button
                  onClick={handleCreateAutoRule}
                  className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="font-medium">발송 규칙 만들기</span>
                </button>
              ) : (
                <div className="space-y-4">
                  {/* 규칙 목록 */}
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* 규칙 이름 */}
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {rule.rule_name}
                          </h3>

                          {/* 규칙 상세 */}
                          <div className="space-y-1 text-sm text-gray-600">
                            <p>
                              <span className="font-medium">공간:</span>{" "}
                              {rule.spaces.name}
                            </p>
                            <p>
                              <span className="font-medium">템플릿:</span>{" "}
                              {rule.reservation_message_templates.name}
                            </p>
                            <p>
                              <span className="font-medium">발송 시점:</span>{" "}
                              {getTimeDescription(rule)}
                            </p>
                          </div>

                          {/* 상태 배지 */}
                          <div className="mt-3">
                            {rule.is_active ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                활성화
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                비활성화
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 액션 버튼 */}
                        <div className="flex flex-col space-y-2 ml-4">
                          {/* 활성화/비활성화 토글 */}
                          <button
                            onClick={() => handleToggleActive(rule.id, rule.is_active)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              rule.is_active
                                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                          >
                            {rule.is_active ? "비활성화" : "활성화"}
                          </button>

                          {/* 편집 버튼 */}
                          <button
                            onClick={() => handleEditRule(rule.id)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            편집
                          </button>

                          {/* 삭제 버튼 */}
                          <button
                            onClick={() => handleDeleteRule(rule.id, rule.rule_name)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 새 규칙 추가 버튼 */}
                  <button
                    onClick={handleCreateAutoRule}
                    className="w-full py-3 border-2 border-dashed border-blue-300 text-blue-500 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-medium">발송 규칙 추가</span>
                  </button>
                </div>
              )}
            </div>

            {/* 안내사항 */}
            <div className="space-y-3 text-sm text-gray-600">
              <h3 className="font-medium text-gray-900">안내사항</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>자동 메시지는 예약 정보와 연동됩니다. 예약 정보의 수정 사항이 자동 메시지에 반영됩니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>발송 규칙당 1회만 발송됩니다. 예약 시간이 변경되더라도 이미 발송된 규칙에 대해서는 더 이상 발송되지 않습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>발송 예정 15분 이내로 입력한 시점에는 발송을 취소하거나 수정할 수 없습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>자동 발송 시점이 이미 지난 경우, 발송되지 않습니다.</span>
                </li>
                <li className="flex items-start">
                  <span className="inline-block w-1 h-1 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                  <span>발송 규칙을 수정했을 경우, 발송 예정 메시지들이 일괄 적용됩니다.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}