"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, FileText, ChevronLeft, ChevronRight, Trash2, RefreshCw, XCircle } from "lucide-react";
import NaverTemplateCreateModal from "./NaverTemplateCreateModal";

interface NaverTemplate {
  id: number;
  partner_key: string;
  template_id?: string;
  code: string;
  name?: string;
  text: string;
  product_code: string;
  category_code: string;
  buttons?: unknown;
  status: string;
  created_at: string;
  updated_at: string;
}

interface NaverAccount {
  id: number;
  partner_key: string;
  talk_name: string | null;
}

const NaverTemplateTab = () => {
  const [selectedStatus, setSelectedStatus] = useState("전체");
  const [templateStatus, setTemplateStatus] = useState("전체");
  const [templateName, setTemplateName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [showOnlyApproved, setShowOnlyApproved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templates, setTemplates] = useState<NaverTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingTemplateId, setDeletingTemplateId] = useState<number | null>(null);
  const [cancelingInspectionId, setCancelingInspectionId] = useState<number | null>(null);
  const [accounts, setAccounts] = useState<NaverAccount[]>([]);
  const [selectedPartnerKey, setSelectedPartnerKey] = useState<string>("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // 템플릿 목록 조회
  useEffect(() => {
    fetchTemplates();
    fetchAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/naver/templates/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setTemplates(result.data || []);
      }
    } catch (error) {
      console.error("템플릿 목록 조회 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/naver/accounts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const accountList = result.data || [];
        setAccounts(accountList);

        // 첫 번째 계정을 기본 선택
        if (accountList.length > 0 && !selectedPartnerKey) {
          setSelectedPartnerKey(accountList[0].partner_key);
        }
      }
    } catch (error) {
      console.error("계정 목록 조회 오류:", error);
    }
  };

  // NOTE: MTS API에 네이버 톡톡 템플릿 목록 조회 엔드포인트가 없어서
  // MTS 동기화 기능은 제공하지 않습니다.
  // 템플릿 생성 시 자동으로 DB에 저장되며, DB 기반으로 목록을 관리합니다.

  // 템플릿 상태 업데이트 (검수중 템플릿만)
  const handleUpdateStatus = async () => {
    if (!confirm("검수중인 템플릿의 상태를 MTS에서 확인하여 업데이트하시겠습니까?")) {
      return;
    }

    try {
      setIsUpdatingStatus(true);
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/naver/templates/status/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}), // 모든 검수중 템플릿 업데이트
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          result.message ||
            `${result.updatedCount}개의 템플릿 상태가 업데이트되었습니다.`
        );
        await fetchTemplates(); // 목록 새로고침
      } else {
        throw new Error(result.error || "상태 업데이트 실패");
      }
    } catch (error) {
      console.error("템플릿 상태 업데이트 오류:", error);
      alert(
        error instanceof Error
          ? error.message
          : "상태 업데이트 중 오류가 발생했습니다."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSuccess = () => {
    fetchTemplates(); // 목록 새로고침
  };

  // 템플릿 삭제 핸들러
  const handleDeleteTemplate = async (template: NaverTemplate) => {
    const confirmed = window.confirm(
      `"${template.code}" 템플릿을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`
    );

    if (!confirmed) return;

    setDeletingTemplateId(template.id);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/naver/templates/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partnerKey: template.partner_key,
          templateCode: template.code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "템플릿 삭제 실패");
      }

      // 삭제 성공 시 템플릿 목록 새로고침
      await fetchTemplates();
    } catch (error) {
      console.error("네이버 템플릿 삭제 실패:", error);
      alert(error instanceof Error ? error.message : "템플릿 삭제 실패");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  // 검수 취소 핸들러
  const handleCancelInspection = async (template: NaverTemplate) => {
    const confirmed = window.confirm(
      `"${template.code}" 템플릿의 검수 요청을 취소하시겠습니까?\n\n취소 후 템플릿은 '등록됨(REGISTERED)' 상태로 돌아가며, 삭제 또는 수정이 가능해집니다.`
    );

    if (!confirmed) return;

    setCancelingInspectionId(template.id);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/naver/templates/inspection-cancel", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partnerKey: template.partner_key,
          templateCode: template.code,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "검수 취소 실패");
      }

      alert(result.message || "검수 요청이 취소되었습니다.");
      // 목록 새로고침
      await fetchTemplates();
    } catch (error) {
      console.error("네이버 템플릿 검수 취소 실패:", error);
      alert(error instanceof Error ? error.message : "검수 취소 실패");
    } finally {
      setCancelingInspectionId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      PENDING: { label: "검수중", className: "bg-yellow-100 text-yellow-700" },
      APPROVED: { label: "승인됨", className: "bg-green-100 text-green-700" },
      REJECTED: { label: "반려됨", className: "bg-red-100 text-red-700" },
      REGISTERED: { label: "등록됨", className: "bg-blue-100 text-blue-700" },
    };
    const config = statusMap[status] || { label: status, className: "bg-gray-100 text-gray-700" };
    return (
      <span className={`inline-block px-2 py-1 text-xs rounded ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex-1">
      {/* 검색 필터 */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">연동 에이전트</label>
          <div className="relative">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="전체">전체</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 상태</label>
          <div className="relative">
            <select
              value={templateStatus}
              onChange={(e) => setTemplateStatus(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="전체">전체</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 이름</label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">템플릿 ID</label>
          <input
            type="text"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center">
          <div className="flex items-center gap-2 mr-4">
            <input
              type="checkbox"
              id="approvedOnly"
              checked={showOnlyApproved}
              onChange={(e) => setShowOnlyApproved(e.target.checked)}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="approvedOnly" className="text-sm text-gray-700">
              숨긴 템플릿 보기
            </label>
          </div>
        </div>
        {/* 버튼 그룹 */}
        <div className="flex gap-2 items-center">
          <button className="w-full h-fit bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
            검색
          </button>
          <button className="w-full h-fit border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 text-sm">
            검색 초기화
          </button>
        </div>
      </div>



      {/* 액션 버튼 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2 items-center">
          {/* 파트너키 선택 드롭다운 */}
          <div className="relative">
            <select
              value={selectedPartnerKey}
              onChange={(e) => setSelectedPartnerKey(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg appearance-none bg-white pr-8 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={accounts.length === 0}
            >
              {accounts.length === 0 ? (
                <option value="">계정 없음</option>
              ) : (
                accounts.map((account) => (
                  <option key={account.id} value={account.partner_key}>
                    {account.talk_name || account.partner_key}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          {/* 템플릿 생성 버튼 */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-green-700"
          >
            <FileText className="w-4 h-4" />
            네이버 템플릿 생성
          </button>

          {/* 상태 업데이트 버튼 */}
          <button
            onClick={handleUpdateStatus}
            disabled={isUpdatingStatus}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
            title="검수중인 템플릿의 상태를 MTS에서 확인하여 업데이트합니다"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdatingStatus ? "animate-spin" : ""}`} />
            {isUpdatingStatus ? "상태 확인 중..." : "템플릿 상태 업데이트"}
          </button>
        </div>

        {/* 페이지네이션 */}
        <div className="flex items-center gap-4">
          <select className="border border-gray-300 rounded px-3 py-1 text-sm">
            <option>20</option>
          </select>
          <span className="text-sm text-gray-600">1 / 1</span>
          <div className="flex gap-1">
            <button className="p-1 border border-gray-300 rounded hover:bg-gray-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="p-1 border border-gray-300 rounded hover:bg-gray-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 템플릿 테이블 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 테이블 헤더 */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-8 gap-4 p-4 text-sm font-medium text-gray-700">
            <div>회원 ID</div>
            <div>템플릿 코드</div>
            <div>내용</div>
            <div>상품 코드</div>
            <div>카테고리</div>
            <div>상태</div>
            <div>생성일</div>
            <div className="text-center">작업</div>
          </div>
        </div>

        {/* 테이블 내용 */}
        {isLoading ? (
          <div className="p-16 text-center">
            <p className="text-gray-500 text-lg">로딩 중...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-gray-500 text-lg">생성된 템플릿이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">
              &quot;네이버 템플릿 생성&quot; 버튼을 클릭하여 템플릿을 만들어보세요.
            </p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="grid grid-cols-8 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50"
            >
              <div className="text-sm font-mono text-gray-600">
                {template.partner_key}
              </div>
              <div className="text-sm font-medium">
                {template.code}
              </div>
              <div className="text-sm text-gray-600 truncate" title={template.text}>
                {template.text}
              </div>
              <div className="text-sm">
                {template.product_code}
              </div>
              <div className="text-sm text-gray-600">
                {template.category_code}
              </div>
              <div>
                {getStatusBadge(template.status)}
              </div>
              <div className="text-sm text-gray-600">
                {new Date(template.created_at).toLocaleDateString("ko-KR")}
              </div>
              <div className="flex justify-center gap-1">
                {/* PENDING 상태일 때만 검수 취소 버튼 표시 */}
                {template.status === "PENDING" && (
                  <button
                    onClick={() => handleCancelInspection(template)}
                    disabled={cancelingInspectionId === template.id}
                    className="p-1 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    title="검수 취소"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteTemplate(template)}
                  disabled={deletingTemplateId === template.id}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                  title="템플릿 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 템플릿 생성 모달 */}
      <NaverTemplateCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default NaverTemplateTab;