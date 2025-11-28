"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface Recipient {
  phone_number: string;
  name?: string;
  variables?: Record<string, string>;
}

interface TemplateVariableInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  variables: string[];
  commonVariables: Record<string, string>;
  recipients: Recipient[];
  onSave: (
    commonVars: Record<string, string>,
    recipientVars: Record<string, Record<string, string>>
  ) => void;
}

const TemplateVariableInputModal: React.FC<TemplateVariableInputModalProps> = ({
  isOpen,
  onClose,
  variables,
  commonVariables: initialCommonVariables,
  recipients,
  onSave,
}) => {
  const [commonVariables, setCommonVariables] = useState<Record<string, string>>(initialCommonVariables);
  const [recipientVariables, setRecipientVariables] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    // 초기화: 수신자별 변수 객체 생성
    const initialRecipientVars: Record<string, Record<string, string>> = {};
    recipients.forEach((recipient) => {
      const varObj: Record<string, string> = {};
      variables.forEach((varName) => {
        varObj[varName] = recipient.variables?.[varName] || '';
      });
      initialRecipientVars[recipient.phone_number] = varObj;
    });
    setRecipientVariables(initialRecipientVars);
  }, [recipients, variables]);

  useEffect(() => {
    setCommonVariables(initialCommonVariables);
  }, [initialCommonVariables]);

  const handleSave = () => {
    onSave(commonVariables, recipientVariables);
    onClose();
  };

  const handleCancel = () => {
    // 초기값으로 되돌림
    setCommonVariables(initialCommonVariables);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">템플릿 변수 입력</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 내용 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 감지된 변수 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-700">
              <strong>감지된 변수:</strong> {variables.map(v => `#{${v}}`).join(', ')}
            </p>
          </div>

          {/* 공통 변수 입력 */}
          <div className="mb-8">
            <h3 className="font-medium text-gray-900 mb-4">공통 변수 (모든 수신자 동일)</h3>
            <div className="space-y-3">
              {variables.map((varName) => (
                <div key={varName} className="flex items-center gap-3">
                  <label className="w-32 text-sm font-medium text-gray-700">
                    #{`{${varName}}`}
                  </label>
                  <input
                    type="text"
                    placeholder={`${varName} 값을 입력하세요`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={commonVariables[varName] || ''}
                    maxLength={100}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length > 100) {
                        alert(`⚠️ 변수 값은 최대 100자까지 입력 가능합니다.\n현재: ${value.length}자`);
                        return;
                      }
                      setCommonVariables({
                        ...commonVariables,
                        [varName]: value,
                      });
                    }}
                  />
                  <span className="text-xs text-gray-400 ml-2">
                    {commonVariables[varName]?.length || 0}/100
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 수신자별 변수 입력 */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">
              수신자별 변수 (개별 설정, 선택사항)
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              * 공통 변수와 다른 값을 사용하려는 수신자만 입력하세요. 빈 칸은 공통 변수 값이 사용됩니다.
            </p>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-3 text-left font-medium text-gray-700 w-40">
                        전화번호
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 w-32">
                        이름
                      </th>
                      {variables.map((varName) => (
                        <th key={varName} className="px-4 py-3 text-left font-medium text-gray-700 min-w-[150px]">
                          #{`{${varName}}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recipients.map((recipient, index) => (
                      <tr key={recipient.phone_number} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-gray-900">
                          {recipient.phone_number}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {recipient.name || '-'}
                        </td>
                        {variables.map((varName) => (
                          <td key={varName} className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <input
                                type="text"
                                placeholder={`공통값: ${commonVariables[varName] || '(미입력)'}`}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                value={recipientVariables[recipient.phone_number]?.[varName] || ''}
                                maxLength={100}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value.length > 100) {
                                    alert(`⚠️ 변수 값은 최대 100자까지 입력 가능합니다.\n현재: ${value.length}자`);
                                    return;
                                  }
                                  setRecipientVariables({
                                    ...recipientVariables,
                                    [recipient.phone_number]: {
                                      ...recipientVariables[recipient.phone_number],
                                      [varName]: value,
                                    },
                                  });
                                }}
                              />
                              <span className="text-xs text-gray-400">
                                {recipientVariables[recipient.phone_number]?.[varName]?.length || 0}/100
                              </span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateVariableInputModal;
