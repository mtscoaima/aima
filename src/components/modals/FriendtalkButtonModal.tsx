"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

interface FriendtalkButton {
  name: string; // 버튼명 (최대 14자)
  type: 'WL' | 'AL' | 'BK' | 'MD'; // WL:웹링크, AL:앱링크, BK:봇키워드, MD:메시지전달
  url_mobile?: string; // 모바일 URL (WL/AL에만 사용)
  url_pc?: string; // PC URL (WL만 사용, 선택)
}

interface FriendtalkButtonModalProps {
  isOpen: boolean;
  onClose: () => void;
  buttons: FriendtalkButton[];
  onSave: (buttons: FriendtalkButton[]) => void;
}

const FriendtalkButtonModal: React.FC<FriendtalkButtonModalProps> = ({
  isOpen,
  onClose,
  buttons,
  onSave,
}) => {
  const [editingButtons, setEditingButtons] = useState<FriendtalkButton[]>([]);

  // 모달 열릴 때 기존 버튼 복사
  useEffect(() => {
    if (isOpen) {
      setEditingButtons(JSON.parse(JSON.stringify(buttons)));
    }
  }, [isOpen, buttons]);

  if (!isOpen) return null;

  const handleAddButton = () => {
    if (editingButtons.length >= 5) {
      alert("최대 5개까지만 추가할 수 있습니다.");
      return;
    }

    setEditingButtons([
      ...editingButtons,
      {
        name: "",
        type: "WL",
        url_mobile: "",
        url_pc: "",
      },
    ]);
  };

  const handleDeleteButton = (index: number) => {
    setEditingButtons(editingButtons.filter((_, i) => i !== index));
  };

  const handleButtonChange = (
    index: number,
    field: keyof FriendtalkButton,
    value: string
  ) => {
    const newButtons = [...editingButtons];
    if (field === 'name' && value.length > 14) {
      alert("버튼명은 최대 14자까지 입력 가능합니다.");
      return;
    }
    newButtons[index] = { ...newButtons[index], [field]: value };
    setEditingButtons(newButtons);
  };

  const handleSave = () => {
    // 유효성 검증
    for (let i = 0; i < editingButtons.length; i++) {
      const button = editingButtons[i];
      if (!button.name.trim()) {
        alert(`버튼 ${i + 1}: 버튼명을 입력해주세요.`);
        return;
      }

      // WL/AL 타입만 URL 필수
      if (button.type === 'WL' || button.type === 'AL') {
        if (!button.url_mobile || !button.url_mobile.trim()) {
          alert(`버튼 ${i + 1}: ${button.type === 'WL' ? 'URL' : 'App Scheme'}을 입력해주세요.`);
          return;
        }

        // WL은 URL 형식 검증, AL은 스킵 (scheme은 URL 형식이 아닐 수 있음)
        if (button.type === 'WL') {
          try {
            new URL(button.url_mobile);
            if (button.url_pc && button.url_pc.trim()) {
              new URL(button.url_pc);
            }
          } catch {
            alert(`버튼 ${i + 1}: 올바른 URL 형식이 아닙니다.`);
            return;
          }
        }
      }
    }

    onSave(editingButtons);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">친구톡 버튼 설정</h2>
            <p className="text-xs text-gray-500 mt-1">
              WL(웹링크), AL(앱링크), BK(봇키워드), MD(메시지전달) | 최대 5개
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {editingButtons.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-4">추가된 버튼이 없습니다.</p>
              <button
                onClick={handleAddButton}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                버튼 추가
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {editingButtons.map((button, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm text-gray-700">
                      버튼 {index + 1}
                    </span>
                    <button
                      onClick={() => handleDeleteButton(index)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* 버튼명 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        버튼명 <span className="text-red-500">*</span>
                        <span className="text-gray-400 ml-1">
                          ({button.name.length}/14자)
                        </span>
                      </label>
                      <input
                        type="text"
                        value={button.name}
                        onChange={(e) =>
                          handleButtonChange(index, "name", e.target.value)
                        }
                        maxLength={14}
                        placeholder="예: 자세히 보기"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 버튼 타입 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        버튼 타입 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={button.type}
                        onChange={(e) =>
                          handleButtonChange(index, "type", e.target.value as 'WL' | 'AL' | 'BK' | 'MD')
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="WL">웹링크 (WL)</option>
                        <option value="AL">앱링크 (AL)</option>
                        <option value="BK">봇키워드 (BK)</option>
                        <option value="MD">메시지전달 (MD)</option>
                      </select>
                    </div>

                    {/* WL/AL 타입일 때만 URL 입력 */}
                    {(button.type === 'WL' || button.type === 'AL') && (
                      <>
                        {/* 모바일 URL / App Scheme */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {button.type === 'WL' ? '모바일 URL' : 'App Scheme'} <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={button.url_mobile || ""}
                            onChange={(e) =>
                              handleButtonChange(index, "url_mobile", e.target.value)
                            }
                            placeholder={button.type === 'WL' ? 'https://example.com' : 'myapp://path'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* WL 타입일 때만 PC URL */}
                        {button.type === 'WL' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              PC URL <span className="text-gray-400">(선택)</span>
                            </label>
                            <input
                              type="url"
                              value={button.url_pc || ""}
                              onChange={(e) =>
                                handleButtonChange(index, "url_pc", e.target.value)
                              }
                              placeholder="https://example.com (선택사항)"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        )}
                      </>
                    )}

                    {/* BK/MD 타입 안내 */}
                    {(button.type === 'BK' || button.type === 'MD') && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                          {button.type === 'BK' && '봇키워드: 사용자가 버튼 클릭 시 자동으로 특정 키워드가 전송됩니다.'}
                          {button.type === 'MD' && '메시지전달: 사용자가 버튼 클릭 시 상담원에게 연결됩니다.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 버튼 추가 버튼 */}
              {editingButtons.length < 5 && (
                <button
                  onClick={handleAddButton}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  버튼 추가 ({editingButtons.length}/5)
                </button>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default FriendtalkButtonModal;
