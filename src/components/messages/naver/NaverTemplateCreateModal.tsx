"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

interface NaverTemplateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface NaverAccount {
  id: number;
  partner_key: string;
  talk_name: string | null;
}

interface Button {
  type: "WEB_LINK" | "APP_LINK";
  buttonCode: string;
  name: string;
  url?: string;
  mobileUrl?: string;
}

const NaverTemplateCreateModal: React.FC<NaverTemplateCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [accounts, setAccounts] = useState<NaverAccount[]>([]);
  const [partnerKey, setPartnerKey] = useState("");
  const [code, setCode] = useState("");
  const [text, setText] = useState("");
  const [productCode, setProductCode] = useState<"INFORMATION" | "BENEFIT" | "CARDINFO">("INFORMATION");
  const [categoryCode, setCategoryCode] = useState("S001");
  const [buttons, setButtons] = useState<Button[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 계정 목록 조회
  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/naver/accounts", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await response.json();
      if (response.ok && result.success) {
        setAccounts(result.data || []);
        if (result.data && result.data.length > 0) {
          setPartnerKey(result.data[0].partner_key);
        }
      }
    } catch (error) {
      console.error("계정 조회 오류:", error);
    }
  };

  const handleAddButton = () => {
    if (buttons.length >= 5) {
      alert("버튼은 최대 5개까지 추가할 수 있습니다.");
      return;
    }

    setButtons([
      ...buttons,
      {
        type: "WEB_LINK",
        buttonCode: `BTN${buttons.length + 1}`.padStart(6, "0"),
        name: "",
        url: "",
        mobileUrl: "",
      },
    ]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (index: number, field: keyof Button, value: string) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 유효성 검사
    if (!partnerKey) {
      setError("파트너키를 선택해주세요.");
      return;
    }

    if (!code.trim()) {
      setError("템플릿 코드를 입력해주세요.");
      return;
    }

    if (!text.trim()) {
      setError("템플릿 내용을 입력해주세요.");
      return;
    }

    if (!categoryCode) {
      setError("카테고리 코드를 선택해주세요.");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("/api/messages/naver/templates/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          partnerKey,
          code: code.trim(),
          text: text.trim(),
          productCode,
          categoryCode,
          buttons: buttons.length > 0 ? buttons : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "템플릿 생성 실패");
      }

      alert("네이버 톡톡 템플릿이 성공적으로 생성되었습니다.\nMTS 검수 후 사용 가능합니다.");
      handleReset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error("템플릿 생성 오류:", err);
      setError(err instanceof Error ? err.message : "템플릿 생성 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setCode("");
    setText("");
    setProductCode("INFORMATION");
    setCategoryCode("S001");
    setButtons([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-2xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">네이버 톡톡 템플릿 생성</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* 파트너 키 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                네이버 톡톡 계정 <span className="text-red-500">*</span>
              </label>
              {accounts.length === 0 ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  등록된 계정이 없습니다. 먼저 &quot;톡톡 아이디&quot; 탭에서 계정을 등록해주세요.
                </div>
              ) : (
                <select
                  value={partnerKey}
                  onChange={(e) => setPartnerKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  disabled={isLoading}
                  required
                >
                  <option value="">계정 선택...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.partner_key}>
                      {account.talk_name || account.partner_key}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 템플릿 코드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                템플릿 코드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="예: TEST_TEMPLATE_001 (영문+숫자, 유니크)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
                required
              />
            </div>

            {/* 템플릿 내용 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                템플릿 내용 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="예: #{name}님, 예약이 완료되었습니다.&#10;예약일시: #{date}&#10;감사합니다."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 min-h-[100px]"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                변수 사용 가능: #{"{"}변수명{"}"} (예: #{"{"}name{"}"}, #{"{"}date{"}"})
              </p>
            </div>

            {/* 상품 코드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                상품 코드 <span className="text-red-500">*</span>
              </label>
              <select
                value={productCode}
                onChange={(e) => setProductCode(e.target.value as "INFORMATION" | "BENEFIT" | "CARDINFO")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              >
                <option value="INFORMATION">정보성 - 알림 (INFORMATION) - 13원</option>
                <option value="BENEFIT">마케팅/광고 - 혜택 (BENEFIT) - 20원</option>
                <option value="CARDINFO">정보성 - 카드알림 (CARDINFO) - 13원</option>
              </select>
            </div>

            {/* 카테고리 코드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 코드 <span className="text-red-500">*</span>
              </label>
              <select
                value={categoryCode}
                onChange={(e) => setCategoryCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                disabled={isLoading}
              >
                <optgroup label="숙박(S)">
                  <option value="S001">S001 - 예약완료</option>
                  <option value="S002">S002 - 예약취소</option>
                  <option value="S003">S003 - 바우처발송</option>
                  <option value="S004">S004 - 결제요청</option>
                </optgroup>
                <optgroup label="예약(T)">
                  <option value="T001">T001 - 예약완료</option>
                  <option value="T002">T002 - 예약취소</option>
                  <option value="T003">T003 - 바우처발송</option>
                  <option value="T004">T004 - 결제요청</option>
                </optgroup>
              </select>
            </div>

            {/* 버튼 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  버튼 (선택사항, 최대 5개)
                </label>
                <button
                  type="button"
                  onClick={handleAddButton}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                  disabled={isLoading || buttons.length >= 5}
                >
                  <Plus className="w-4 h-4" />
                  버튼 추가
                </button>
              </div>

              {buttons.map((button, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3 mb-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">버튼 #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveButton(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">버튼 코드</label>
                        <input
                          type="text"
                          value={button.buttonCode}
                          onChange={(e) => handleButtonChange(index, "buttonCode", e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">버튼 이름</label>
                        <input
                          type="text"
                          value={button.name}
                          onChange={(e) => handleButtonChange(index, "name", e.target.value)}
                          placeholder="예: 예약 확인하기"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">웹 링크 (PC)</label>
                      <input
                        type="url"
                        value={button.url || ""}
                        onChange={(e) => handleButtonChange(index, "url", e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">웹 링크 (모바일)</label>
                      <input
                        type="url"
                        value={button.mobileUrl || ""}
                        onChange={(e) => handleButtonChange(index, "mobileUrl", e.target.value)}
                        placeholder="https://m.example.com"
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              disabled={isLoading || accounts.length === 0}
            >
              {isLoading ? "생성 중..." : "템플릿 생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NaverTemplateCreateModal;
