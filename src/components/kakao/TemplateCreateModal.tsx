"use client";

import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { createAlimtalkTemplate } from "@/utils/kakaoTemplateApi";

interface ButtonData {
  name: string;
  type: string;
  url_mobile?: string;
  url_pc?: string;
}

interface TemplateCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderKey: string;
  onSuccess: () => void;
}

const TemplateCreateModal: React.FC<TemplateCreateModalProps> = ({
  isOpen,
  onClose,
  senderKey,
  onSuccess,
}) => {
  const [templateCode, setTemplateCode] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [requestInspection, setRequestInspection] = useState(false);
  const [buttons, setButtons] = useState<ButtonData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAddButton = () => {
    if (buttons.length >= 5) {
      setError("버튼은 최대 5개까지 추가 가능합니다.");
      return;
    }
    setButtons([...buttons, { name: "", type: "WL", url_mobile: "" }]);
  };

  const handleRemoveButton = (index: number) => {
    setButtons(buttons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (
    index: number,
    field: keyof ButtonData,
    value: string
  ) => {
    const newButtons = [...buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setButtons(newButtons);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // 유효성 검사
    if (!templateCode.trim()) {
      setError("템플릿 코드를 입력하세요.");
      return;
    }

    if (templateCode.length > 30) {
      setError("템플릿 코드는 최대 30자까지 가능합니다.");
      return;
    }

    if (!templateName.trim()) {
      setError("템플릿 이름을 입력하세요.");
      return;
    }

    if (templateName.length > 200) {
      setError("템플릿 이름은 최대 200자까지 가능합니다.");
      return;
    }

    if (!templateContent.trim()) {
      setError("템플릿 내용을 입력하세요.");
      return;
    }

    // 버튼 유효성 검사
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];

      if (!button.name.trim()) {
        setError(`버튼 ${i + 1}의 이름을 입력하세요.`);
        return;
      }

      if (button.name.length > 14) {
        setError(`버튼 ${i + 1}의 이름은 최대 14자까지 가능합니다.`);
        return;
      }

      // WL(웹링크), AL(앱링크) 타입은 URL 필수
      if (button.type === "WL" || button.type === "AL") {
        if (!button.url_mobile?.trim()) {
          setError(`버튼 ${i + 1}의 모바일 URL을 입력하세요.`);
          return;
        }

        // URL 형식 검사 (http:// 또는 https://로 시작해야 함)
        const urlPattern = /^https?:\/\/.+/i;
        if (!urlPattern.test(button.url_mobile.trim())) {
          setError(`버튼 ${i + 1}의 모바일 URL은 http:// 또는 https://로 시작해야 합니다.`);
          return;
        }

        // PC URL이 입력된 경우 형식 검사
        if (button.url_pc?.trim() && !urlPattern.test(button.url_pc.trim())) {
          setError(`버튼 ${i + 1}의 PC URL은 http:// 또는 https://로 시작해야 합니다.`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      // 버튼 데이터 정제 (빈 필드 제거)
      const cleanedButtons = buttons.map((button) => {
        const cleaned: Record<string, string> = {
          name: button.name.trim(),
          type: button.type,
        };

        // WL, AL 타입은 URL 추가
        if (button.type === "WL" || button.type === "AL") {
          cleaned.url_mobile = button.url_mobile!.trim();
          if (button.url_pc?.trim()) {
            cleaned.url_pc = button.url_pc.trim();
          }
        }

        return cleaned;
      });

      await createAlimtalkTemplate({
        senderKey,
        templateCode: templateCode.trim(),
        templateName: templateName.trim(),
        templateContent: templateContent.trim(),
        templateMessageType: "BA",
        templateEmphasizeType: "NONE",
        buttons: cleanedButtons.length > 0 ? cleanedButtons : undefined,
        requestInspection,
      });

      alert(
        requestInspection
          ? "템플릿이 등록되고 검수 요청되었습니다."
          : "템플릿이 등록되었습니다."
      );

      // 폼 초기화
      setTemplateCode("");
      setTemplateName("");
      setTemplateContent("");
      setButtons([]);
      setRequestInspection(false);

      onSuccess();
      onClose();
    } catch (error) {
      console.error("템플릿 생성 오류:", error);
      setError(error instanceof Error ? error.message : "템플릿 생성 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">템플릿 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 본문 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 템플릿 코드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 코드 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateCode}
              onChange={(e) => setTemplateCode(e.target.value)}
              placeholder="예: WELCOME_001 (최대 30자, 영문/숫자/언더스코어)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={30}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              {templateCode.length}/30자
            </p>
          </div>

          {/* 템플릿 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="예: 가입환영 메시지 (최대 200자)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={200}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              {templateName.length}/200자
            </p>
          </div>

          {/* 템플릿 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={templateContent}
              onChange={(e) => setTemplateContent(e.target.value)}
              placeholder={`안녕하세요, #{고객명}님!\n가입을 환영합니다.\n\n변수는 #{변수명} 형식으로 입력하세요.`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={10}
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-gray-500">
              변수 형식: #{"{"}변수명{"}"} (예: #{"{"}고객명{"}"}, #{"{"}주문번호{"}"})
            </p>
          </div>

          {/* 버튼 설정 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                버튼 (선택)
              </label>
              <button
                type="button"
                onClick={handleAddButton}
                disabled={buttons.length >= 5 || isSubmitting}
                className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                버튼 추가
              </button>
            </div>

            {buttons.length > 0 && (
              <div className="space-y-3">
                {buttons.map((button, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        버튼 {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveButton(index)}
                        className="text-red-500 hover:text-red-700"
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {/* 버튼 이름 */}
                      <div>
                        <input
                          type="text"
                          value={button.name}
                          onChange={(e) =>
                            handleButtonChange(index, "name", e.target.value)
                          }
                          placeholder="버튼 이름 (최대 14자)"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          maxLength={14}
                          disabled={isSubmitting}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {button.name.length}/14자
                        </p>
                      </div>

                      {/* 버튼 타입 */}
                      <div>
                        <select
                          value={button.type}
                          onChange={(e) =>
                            handleButtonChange(index, "type", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          disabled={isSubmitting}
                        >
                          <option value="WL">웹링크 (WL)</option>
                          <option value="AL">앱링크 (AL)</option>
                          <option value="BK">봇키워드 (BK)</option>
                          <option value="MD">메시지전달 (MD)</option>
                        </select>
                      </div>

                      {/* URL 입력 (WL, AL 타입만) */}
                      {(button.type === "WL" || button.type === "AL") && (
                        <>
                          <div>
                            <input
                              type="text"
                              value={button.url_mobile || ""}
                              onChange={(e) =>
                                handleButtonChange(
                                  index,
                                  "url_mobile",
                                  e.target.value
                                )
                              }
                              placeholder="모바일 URL (필수) - 예: https://example.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              disabled={isSubmitting}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={button.url_pc || ""}
                              onChange={(e) =>
                                handleButtonChange(
                                  index,
                                  "url_pc",
                                  e.target.value
                                )
                              }
                              placeholder="PC URL (선택) - 예: https://example.com"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                              disabled={isSubmitting}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {buttons.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded border border-gray-200">
                버튼을 추가하려면 위의 &quot;버튼 추가&quot; 버튼을 클릭하세요.
              </p>
            )}

            <p className="mt-2 text-xs text-gray-500">
              • 버튼은 최대 5개까지 추가 가능합니다.
              <br />
              • 웹링크(WL), 앱링크(AL)는 URL 입력이 필요합니다.
              <br />• 버튼 이름은 최대 14자까지 입력 가능합니다.
            </p>
          </div>

          {/* 검수 요청 */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="requestInspection"
              checked={requestInspection}
              onChange={(e) => setRequestInspection(e.target.checked)}
              className="rounded"
              disabled={isSubmitting}
            />
            <label htmlFor="requestInspection" className="text-sm text-gray-700">
              등록 후 즉시 검수 요청
            </label>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>안내:</strong>
              <br />
              • 템플릿은 등록 후 카카오 검수를 받아야 사용 가능합니다.
              <br />
              • 검수는 보통 2~3 영업일 소요됩니다.
              <br />• 기본형(BA) 템플릿으로 등록되며, 버튼은 등록 후 수정할 수
              있습니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "등록 중..." : "템플릿 등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateCreateModal;
