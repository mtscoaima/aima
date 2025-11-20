"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2, Upload, Image as ImageIcon, FileText } from "lucide-react";
import VariableSelectModal from "../../modals/VariableSelectModal";

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
  buttonName: string;
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
  const [uploadedImageHashId, setUploadedImageHashId] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isVariableModalOpen, setIsVariableModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        buttonName: "",
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

  // 이미지 업로드 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!partnerKey) {
      setError('파트너키를 먼저 선택해주세요.');
      return;
    }

    // 파일 크기 검증 (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('이미지 파일 크기는 5MB 이하여야 합니다.');
      return;
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF만 가능)');
      return;
    }

    setIsUploadingImage(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/naver/image/upload?navertalkId=${partnerKey}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '이미지 업로드 실패');
      }

      setUploadedImageHashId(result.imageHashId);
      setSuccess('이미지 업로드 성공');

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('이미지 업로드 오류:', err);
      setError(err instanceof Error ? err.message : '이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingImage(false);
    }

    // 파일 입력 초기화
    e.target.value = '';
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = () => {
    setUploadedImageHashId('');
    setSuccess('이미지가 제거되었습니다.');
    setTimeout(() => {
      setSuccess(null);
    }, 2000);
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
          buttons: buttons.length > 0
            ? buttons.filter(btn => btn.buttonName.trim() !== '')
            : undefined,
          sampleImageHashId: uploadedImageHashId || undefined,
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
    setUploadedImageHashId("");
    setError(null);
    setSuccess(null);
  };

  const handleVariableSelect = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = text.substring(0, start) + variable + text.substring(end);

    setText(newText);

    // Restore focus and cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
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

          {/* 성공 메시지 */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              {success}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  템플릿 내용 <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsVariableModalOpen(true)}
                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                  title="치환문구 추가"
                  disabled={isLoading}
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="예: #{이름}님, 예약이 완료되었습니다.&#10;예약일시: #{오늘날짜}&#10;감사합니다."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 min-h-[100px]"
                disabled={isLoading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                치환문구 버튼을 클릭하여 변수를 삽입할 수 있습니다.
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

            {/* 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이미지 첨부 (선택사항)
              </label>

              {uploadedImageHashId ? (
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">이미지 업로드 완료</p>
                        <p className="text-xs text-gray-500">Hash ID: {uploadedImageHashId.substring(0, 20)}...</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="text-red-500 hover:text-red-700"
                      disabled={isUploadingImage || isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-colors">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-1">
                        {isUploadingImage ? "업로드 중..." : "클릭하여 이미지 업로드"}
                      </p>
                      <p className="text-xs text-gray-500">
                        JPG, PNG, GIF (최대 5MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={isUploadingImage || isLoading || !partnerKey}
                    />
                  </label>
                  {!partnerKey && (
                    <p className="text-xs text-yellow-600 mt-1">
                      * 이미지 업로드는 파트너키 선택 후 가능합니다.
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                템플릿에 포함될 이미지를 업로드하세요. 업로드된 이미지는 템플릿 검수 시 함께 제출됩니다.
              </p>
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
                        <label className="block text-xs text-gray-600 mb-1">버튼 타입</label>
                        <select
                          value={button.type}
                          onChange={(e) => handleButtonChange(index, "type", e.target.value as "WEB_LINK" | "APP_LINK")}
                          className="w-full px-2 py-1 text-sm border rounded"
                        >
                          <option value="WEB_LINK">웹 링크</option>
                          <option value="APP_LINK">앱 링크</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">버튼 코드</label>
                        <input
                          type="text"
                          value={button.buttonCode}
                          onChange={(e) => handleButtonChange(index, "buttonCode", e.target.value)}
                          placeholder="예: BTN000001"
                          className="w-full px-2 py-1 text-sm border rounded"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">버튼 이름</label>
                      <input
                        type="text"
                        value={button.buttonName}
                        onChange={(e) => handleButtonChange(index, "buttonName", e.target.value)}
                        placeholder="예: 예약 확인하기"
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * 버튼 URL은 메시지 발송 시 설정합니다.
                  </p>
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

        {/* Variable Select Modal */}
        <VariableSelectModal
          isOpen={isVariableModalOpen}
          onClose={() => setIsVariableModalOpen(false)}
          onSelect={handleVariableSelect}
        />
      </div>
    </div>
  );
};

export default NaverTemplateCreateModal;
