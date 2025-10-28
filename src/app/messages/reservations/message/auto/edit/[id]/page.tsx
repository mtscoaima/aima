"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

import RoleGuard from "@/components/RoleGuard";

interface Space {
  id: number;
  name: string;
}

interface Template {
  id: number;
  name: string;
}

interface SpaceDetail {
  id: number;
  name: string;
  host_contact_number_id?: number;
  host_contact_number?: {
    id: number;
    number: string;
    name: string;
    status: string;
  };
}

export default function EditAutoRulePage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params.id as string;

  const [formData, setFormData] = useState({
    ruleName: "",
    spaceId: "",
    triggerType: "check_in",
    timeType: "relative",
    timeValue: "120", // 분 단위 (2시간 = 120분)
    timeDirection: "before",
    absoluteTime: "09:00",
    absoluteDaysBefore: "1",
    templateId: ""
  });
  const [showSenderInfo, setShowSenderInfo] = useState(true);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [hostContactNumber, setHostContactNumber] = useState<string>("[비공개]");

  // 공간 목록 조회 및 기존 규칙 데이터 로드
  useEffect(() => {
    fetchSpaces();
    fetchTemplates();
    fetchRuleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSpaces = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/spaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("공간 조회 실패");

      const data = await response.json();
      setSpaces(data.spaces || []);
    } catch (error) {
      console.error("공간 조회 오류:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/reservations/message-templates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("템플릿 조회 실패");

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error("템플릿 조회 오류:", error);
    }
  };

  // 기존 규칙 데이터 로드
  const fetchRuleData = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/reservations/auto-rules/${ruleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("규칙 조회 실패");

      const data = await response.json();
      const rule = data.rule;

      // 폼 데이터 채우기
      setFormData({
        ruleName: rule.rule_name,
        spaceId: String(rule.space_id),
        triggerType: rule.trigger_type,
        timeType: rule.time_type,
        timeValue: String(rule.time_value || 120),
        timeDirection: rule.time_direction || "before",
        absoluteTime: rule.absolute_time ? rule.absolute_time.substring(0, 5) : "09:00",
        absoluteDaysBefore: String(rule.time_value || 1),
        templateId: String(rule.template_id),
      });

      // 호스트 연락처 조회
      if (rule.space_id) {
        await fetchHostContactNumber(rule.space_id);
      }
    } catch (error) {
      console.error("규칙 조회 오류:", error);
      alert("규칙을 불러오는데 실패했습니다.");
      router.push("/messages/reservations/message/auto");
    }
  };

  const handleInputChange = async (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // 공간 선택 시 호스트 연락처 조회
    if (field === "spaceId" && value) {
      await fetchHostContactNumber(parseInt(value));
    }
  };

  // 호스트 연락처 조회
  const fetchHostContactNumber = async (spaceId: number) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`/api/reservations/spaces/${spaceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const space: SpaceDetail = data.space;

        if (space.host_contact_number?.number) {
          setHostContactNumber(space.host_contact_number.number);
        } else {
          setHostContactNumber("[비공개]");
        }
      } else {
        setHostContactNumber("[비공개]");
      }
    } catch (error) {
      console.error("호스트 연락처 조회 오류:", error);
      setHostContactNumber("[비공개]");
    }
  };

  const handleSenderInfo = () => {
    setShowSenderInfo(!showSenderInfo);
  };


  const handleUpdateRule = async () => {
    // 유효성 검사
    if (!formData.ruleName.trim()) {
      alert("발송 규칙 제목을 입력하세요.");
      return;
    }

    if (!formData.spaceId) {
      alert("대상 공간을 선택하세요.");
      return;
    }

    if (!formData.templateId) {
      alert("메시지 템플릿을 선택하세요.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");

      // API 요청 데이터 구성
      const requestData: Record<string, string | number> = {
        rule_name: formData.ruleName,
        space_id: parseInt(formData.spaceId),
        template_id: parseInt(formData.templateId),
        trigger_type: formData.triggerType,
        time_type: formData.timeType,
      };

      if (formData.timeType === "relative") {
        // 상대적 시점
        requestData.time_value = parseInt(formData.timeValue);
        requestData.time_direction = formData.timeDirection;
      } else {
        // 절대적 시점
        requestData.time_value = parseInt(formData.absoluteDaysBefore);
        requestData.absolute_time = formData.absoluteTime + ":00";
      }

      const response = await fetch(`/api/reservations/auto-rules/${ruleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "규칙 수정 실패");
      }

      alert("자동 발송 규칙이 수정되었습니다.");
      router.push("/messages/reservations/message/auto");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "규칙 수정에 실패했습니다.";
      console.error("규칙 수정 오류:", error);
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 폼 유효성 검사
  const isFormValid = (): boolean => {
    return (
      formData.ruleName.trim() !== "" &&
      formData.spaceId !== "" &&
      formData.templateId !== ""
    );
  };

  return (
    <RoleGuard allowedRoles={["USER"]}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900">
              발송 규칙 수정하기
            </h1>
          </div>

          <div className="space-y-6">
            {/* 발송 규칙 제목 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                발송 규칙 제목<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.ruleName}
                onChange={(e) => handleInputChange("ruleName", e.target.value)}
                placeholder="제목을 입력하세요."
                className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-500 mt-2">고객에게 표시되지 않습니다.</p>
            </div>

            {/* 대상 공간 선택 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                대상 공간 선택<span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">
                이 공간에 대한 모든 예약에 대해 발송 규칙이 적용됩니다. 특정 예약이나 메시지에 대해 개별적으로 발송을 취소할 수도 있습니다.
              </p>
              <div className="relative">
                <select
                  value={formData.spaceId}
                  onChange={(e) => handleInputChange("spaceId", e.target.value)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">공간을 선택하세요</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 보낼 시점 선택 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                보낼 시점 선택<span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-3">언제 메시지를 보낼지 선택하세요.</p>
              
              <div className="space-y-4">
                {/* 기준 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">기준</label>
                  <div className="relative">
                    <select
                      value={formData.triggerType}
                      onChange={(e) => handleInputChange("triggerType", e.target.value)}
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="check_in">입실 (이용 시작)</option>
                      <option value="check_out">퇴실 (이용 종료)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 유형 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">유형</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleInputChange("timeType", "absolute")}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                        formData.timeType === "absolute"
                          ? "bg-gray-200 border-gray-300 text-gray-900"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      시간 지정
                    </button>
                    <button
                      onClick={() => handleInputChange("timeType", "relative")}
                      className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                        formData.timeType === "relative"
                          ? "bg-gray-200 border-gray-300 text-gray-900"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      상대적 시점
                    </button>
                  </div>
                </div>

                {/* 시간 설정 */}
                {formData.timeType === "relative" ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시간</label>
                    <div className="flex space-x-2">
                      <select
                        value={formData.timeValue}
                        onChange={(e) => handleInputChange("timeValue", e.target.value)}
                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="30">30분</option>
                        <option value="60">1시간</option>
                        <option value="120">2시간</option>
                        <option value="180">3시간</option>
                        <option value="360">6시간</option>
                        <option value="720">12시간</option>
                        <option value="1440">1일</option>
                        <option value="2880">2일</option>
                        <option value="4320">3일</option>
                      </select>
                      <select
                        value={formData.timeDirection}
                        onChange={(e) => handleInputChange("timeDirection", e.target.value)}
                        className="w-20 p-2 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="before">전</option>
                        <option value="after">후</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">시간</label>
                    <div className="flex space-x-2">
                      <select
                        value={formData.absoluteDaysBefore}
                        onChange={(e) => handleInputChange("absoluteDaysBefore", e.target.value)}
                        className="flex-1 p-2 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="0">당일</option>
                        <option value="1">1일 전</option>
                        <option value="2">2일 전</option>
                        <option value="3">3일 전</option>
                      </select>
                      <input
                        type="time"
                        value={formData.absoluteTime}
                        onChange={(e) => handleInputChange("absoluteTime", e.target.value)}
                        className="w-32 p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 보낼 메시지 템플릿 선택 */}
            <div>
              <label className="block text-gray-900 font-medium mb-3">
                보낼 메시지 템플릿 선택<span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={formData.templateId}
                  onChange={(e) => handleInputChange("templateId", e.target.value)}
                  className="w-full p-4 bg-white border border-gray-200 rounded-lg appearance-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">템플릿을 선택하세요</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 발신자 정보 */}
            <div>
              <div className="bg-white border border-gray-200 rounded-lg">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={handleSenderInfo}
                >
                  <span className="text-gray-900 font-medium">발신자 정보</span>
                  <svg 
                    className={`w-5 h-5 text-gray-400 transition-transform ${showSenderInfo ? 'rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                
                {showSenderInfo && (
                  <div className="px-4 pb-4 border-t border-gray-100 space-y-3">
                    {/* 보내는 번호 */}
                    <div className="py-3">
                      <div className="text-gray-900 font-medium mb-1">보내는 번호</div>
                      <div className="text-gray-700 text-sm font-mono">[비공개]</div>
                      <p className="text-xs text-gray-400 mt-2">
                        ※ SMS 발신은 통신사 및 정부 정책에 따라 발신전용 번호로 발송됩니다.
                      </p>
                    </div>

                    {/* 호스트 연락처 */}
                    <div className="py-3 border-t border-gray-100">
                      <div className="text-gray-900 font-medium mb-1">호스트 연락처</div>
                      <div className="text-gray-700 text-sm font-mono">
                        {formData.spaceId ? hostContactNumber : "공간을 먼저 선택하세요"}
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        ※ 메시지 내용에 {`{{전화번호}}`} 변수로 삽입됩니다. 고객이 회신할 수 있는 번호입니다.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 수정하기 버튼 */}
            <div className="pt-4">
              <button
                onClick={handleUpdateRule}
                disabled={!isFormValid() || loading}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  isFormValid() && !loading
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-gray-400 text-white cursor-not-allowed"
                }`}
              >
                {loading ? "수정 중..." : "수정하기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}