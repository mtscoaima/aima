"use client";

import React, { useState, useEffect } from "react";
import {
  Info,
  HelpCircle,
  ChevronDown,
  Send,
  Settings
} from "lucide-react";
import TemplateVariableInputModal from "../modals/TemplateVariableInputModal";

interface Recipient {
  phone_number: string;
  name?: string;
  variables?: Record<string, string>; // 수신자별 변수
}

// NaverData export for parent component
export interface NaverData {
  navertalkId: string;
  selectedTemplate: NaverTalkTemplate | null;
  templateContent: string;
  productCode: 'INFORMATION' | 'BENEFIT' | 'CARDINFO';
  smsBackup: boolean;
  templateVariables: string[];
  commonVariables: Record<string, string>;
  recipientVariables: Record<string, Record<string, string>>;
}

interface NaverTalkContentProps {
  recipients: Recipient[];
  selectedSenderNumber?: string;
  onDataChange?: (data: NaverData) => void;
}

interface NaverTalkTemplate {
  code: string;
  name: string;
  text: string;
  categoryCode: string;
  buttons?: Array<{
    type: string;
    name: string;
    url?: string;
    mobileUrl?: string;
  }>;
}

const NaverTalkContent: React.FC<NaverTalkContentProps> = ({ recipients, onDataChange }) => {
  const [navertalkId, setNavertalkId] = useState("");
  const [templates, setTemplates] = useState<NaverTalkTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NaverTalkTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [productCode, setProductCode] = useState<'INFORMATION' | 'BENEFIT' | 'CARDINFO'>('INFORMATION');
  const [smsBackup, setSmsBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 템플릿 변수 관련 상태
  const [templateVariables, setTemplateVariables] = useState<string[]>([]);
  const [commonVariables, setCommonVariables] = useState<Record<string, string>>({});
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [recipientVariables, setRecipientVariables] = useState<Record<string, Record<string, string>>>({});

  // 템플릿 목록 로드
  const loadTemplates = async (navertalkIdValue: string) => {
    if (!navertalkIdValue) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/naver/templates?navertalkId=${navertalkIdValue}&page=1&count=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '템플릿 목록 조회 실패');
      }

      if (result.data?.template_list) {
        setTemplates(result.data.template_list);
      } else {
        setTemplates([]);
      }
    } catch (err) {
      console.error('템플릿 조회 오류:', err);
      setError(err instanceof Error ? err.message : '템플릿 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 네이버톡 ID 변경 시 템플릿 목록 로드
  useEffect(() => {
    if (navertalkId) {
      loadTemplates(navertalkId);
    }
  }, [navertalkId]);

  // 데이터 변경 시 상위로 전달
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        navertalkId,
        selectedTemplate,
        templateContent,
        productCode,
        smsBackup,
        templateVariables,
        commonVariables,
        recipientVariables,
      });
    }
  }, [navertalkId, selectedTemplate, templateContent, productCode, smsBackup, templateVariables, commonVariables, recipientVariables, onDataChange]);

  // 템플릿에서 변수 추출 (#{변수명} 패턴)
  const extractVariables = (text: string): string[] => {
    const regex = /#\{([^}]+)\}/g;
    const variables: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  };

  // 템플릿 선택 시 내용 업데이트 및 변수 추출
  const handleTemplateSelect = (templateCode: string) => {
    const template = templates.find(t => t.code === templateCode);
    if (template) {
      setSelectedTemplate(template);
      setTemplateContent(template.text);

      // 템플릿에서 변수 추출
      const variables = extractVariables(template.text);
      setTemplateVariables(variables);

      // 공통 변수 초기화
      const initialVariables: Record<string, string> = {};
      variables.forEach(varName => {
        initialVariables[varName] = '';
      });
      setCommonVariables(initialVariables);
    } else {
      setSelectedTemplate(null);
      setTemplateContent("");
      setTemplateVariables([]);
      setCommonVariables({});
    }
  };

  // 모달에서 변수 저장
  const handleSaveVariables = (
    commonVars: Record<string, string>,
    recipientVars: Record<string, Record<string, string>>
  ) => {
    setCommonVariables(commonVars);
    setRecipientVariables(recipientVars);
  };

  // 네이버 톡톡 발송
  const handleSend = async () => {
    // 유효성 검사
    if (!navertalkId) {
      setError('네이버톡 ID를 입력해주세요.');
      return;
    }

    if (!selectedTemplate) {
      setError('템플릿을 선택해주세요.');
      return;
    }

    if (recipients.length === 0) {
      setError('수신자를 추가해주세요.');
      return;
    }

    if (!templateContent) {
      setError('템플릿 내용이 비어 있습니다.');
      return;
    }

    // 변수 검증 (변수가 있는 경우)
    if (templateVariables.length > 0) {
      const emptyVariables = templateVariables.filter(varName => !commonVariables[varName]);
      if (emptyVariables.length > 0) {
        setError(`다음 변수를 입력해주세요: ${emptyVariables.join(', ')}`);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 새 API 스펙에 맞게 요청 본문 구성
      const response = await fetch('/api/messages/naver/talk/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navertalkId,
          templateCode: selectedTemplate.code,
          recipients: recipients.map(r => {
            // 수신자별 변수가 있으면 사용, 없으면 빈 객체 (서버에서 공통 변수로 병합됨)
            const recipientVars = recipientVariables[r.phone_number];
            const filteredVars: Record<string, string> = {};

            // 빈 값이 아닌 변수만 전달
            if (recipientVars) {
              Object.keys(recipientVars).forEach(key => {
                if (recipientVars[key]) {
                  filteredVars[key] = recipientVars[key];
                }
              });
            }

            return {
              phone_number: r.phone_number,
              name: r.name,
              variables: Object.keys(filteredVars).length > 0 ? filteredVars : undefined,
            };
          }),
          templateParams: commonVariables, // 공통 변수 객체
          productCode,
          attachments: selectedTemplate.buttons ? {
            buttons: selectedTemplate.buttons.map(btn => ({
              type: btn.type === 'WEB_LINK' ? 'WEB_LINK' as const : 'APP_LINK' as const,
              buttonCode: btn.name.substring(0, 10), // 임시 버튼 코드
              buttonName: btn.name,
              mobileUrl: btn.mobileUrl || btn.url,
              pcUrl: btn.url,
            })),
          } : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '네이버 톡톡 발송 실패');
      }

      setSuccess(result.message || `네이버 톡톡 발송 완료 (성공: ${result.successCount}건, 실패: ${result.failCount}건)`);

      // 3초 후 성공 메시지 제거
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('네이버 톡톡 발송 오류:', err);
      setError(err instanceof Error ? err.message : '발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 변수 입력 모달 */}
      <TemplateVariableInputModal
        isOpen={showVariableModal}
        onClose={() => setShowVariableModal(false)}
        variables={templateVariables}
        commonVariables={commonVariables}
        recipients={recipients}
        onSave={handleSaveVariables}
      />

      {/* 상단 정보 바 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
        <span className="text-sm text-gray-600">
          [네이버 스마트알림 발송방법 및 수신확인 문의 : 1577-1603]
        </span>
      </div>

      {/* 에러/성공 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-700">{success}</span>
          </div>
        </div>
      )}

      {/* 네이버톡 ID 입력 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium mb-3" style={{ color: "#00a732" }}>네이버톡 ID</h3>
        <input
          type="text"
          placeholder="네이버톡 ID를 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          value={navertalkId}
          onChange={(e) => setNavertalkId(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-2">
          * 네이버 톡톡 관리자 센터에서 발급받은 ID를 입력하세요.
        </p>
      </div>

      {/* 템플릿 선택 및 상품 코드 */}
      <div className="flex gap-6 mb-4">
        {/* 좌측: 템플릿 선택 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-3" style={{ color: "#00a732" }}>템플릿 선택</h3>
            <div className="relative">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm appearance-none bg-white"
                value={selectedTemplate?.code || ""}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                disabled={loading || templates.length === 0}
              >
                <option value="">템플릿 선택</option>
                {templates.map((template) => (
                  <option key={template.code} value={template.code}>
                    {template.name} ({template.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {templates.length === 0 && navertalkId && (
              <p className="text-xs text-red-500 mt-2">
                등록된 템플릿이 없습니다.
              </p>
            )}
          </div>
        </div>

        {/* 우측: 상품 코드 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium mb-3" style={{ color: "#00a732" }}>상품 코드</h3>
            <div className="relative">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm appearance-none bg-white"
                value={productCode}
                onChange={(e) => setProductCode(e.target.value as 'INFORMATION' | 'BENEFIT' | 'CARDINFO')}
              >
                <option value="INFORMATION">정보성 - 알림 (INFORMATION)</option>
                <option value="BENEFIT">마케팅/광고 - 혜택 (BENEFIT)</option>
                <option value="CARDINFO">정보성 - 카드알림 (CARDINFO)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 템플릿 내용 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium mb-3" style={{ color: "#00a732" }}>템플릿 내용</h3>
        <div className="bg-gray-50 border border-gray-200 rounded p-4 min-h-[300px]">
          <textarea
            placeholder="사용할 템플릿을 선택하면, 이곳에 템플릿 내용이 표시됩니다."
            className="w-full h-full bg-transparent border-none outline-none text-sm resize-none"
            value={templateContent}
            readOnly
            rows={12}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * 템플릿의 변수는 아래에서 입력할 수 있습니다.
        </p>
      </div>

      {/* 템플릿 변수 입력 */}
      {templateVariables.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium" style={{ color: "#00a732" }}>
              템플릿 변수 입력 (공통 변수)
            </h3>
            <button
              onClick={() => setShowVariableModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
              고급 설정 (수신자별 변수)
            </button>
          </div>
          <div className="space-y-3">
            {templateVariables.map((varName) => (
              <div key={varName} className="flex items-center gap-3">
                <label className="w-32 text-sm font-medium text-gray-700">
                  #{`{${varName}}`}
                </label>
                <input
                  type="text"
                  placeholder={`${varName} 값을 입력하세요`}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                  value={commonVariables[varName] || ''}
                  onChange={(e) => {
                    setCommonVariables({
                      ...commonVariables,
                      [varName]: e.target.value,
                    });
                  }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            * 모든 수신자에게 동일하게 적용되는 변수입니다. 수신자별로 다른 값이 필요한 경우 &quot;고급 설정&quot; 버튼을 클릭하세요.
          </p>
        </div>
      )}

      {/* 발송실패 시 문자대체발송 여부 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="smsBackupNaver"
            className="rounded"
            checked={smsBackup}
            onChange={(e) => setSmsBackup(e.target.checked)}
          />
          <label htmlFor="smsBackupNaver" className="text-sm text-gray-700">
            발송실패 시 문자대체발송 여부
          </label>
          <HelpCircle className="w-4 h-4 text-gray-400" />
        </div>
        <p className="text-xs text-gray-500 mt-2 ml-6">
          * 현재 네이버 톡톡은 SMS 백업 기능을 지원하지 않습니다.
        </p>
      </div>
    </>
  );
};

// 네이버 톡톡 발송 함수 (MessageSendTab에서 호출)
export async function sendNaverTalkMessage(
  naverData: NaverData,
  recipients: Recipient[],
  scheduledAt?: string // YYYYMMDDHHmmss 형식
): Promise<{ success: boolean; message: string; successCount?: number; failCount?: number }> {
  // 유효성 검사
  if (!naverData.navertalkId) {
    throw new Error('네이버톡 ID를 입력해주세요.');
  }

  if (!naverData.selectedTemplate) {
    throw new Error('템플릿을 선택해주세요.');
  }

  if (recipients.length === 0) {
    throw new Error('수신자를 추가해주세요.');
  }

  if (!naverData.templateContent) {
    throw new Error('템플릿 내용이 비어 있습니다.');
  }

  // 변수 검증 (변수가 있는 경우)
  if (naverData.templateVariables.length > 0) {
    const emptyVariables = naverData.templateVariables.filter(
      varName => !naverData.commonVariables[varName]
    );
    if (emptyVariables.length > 0) {
      throw new Error(`다음 변수를 입력해주세요: ${emptyVariables.join(', ')}`);
    }
  }

  // JWT 토큰 가져오기
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }

  // API 요청
  const response = await fetch('/api/messages/naver/talk/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      navertalkId: naverData.navertalkId,
      templateCode: naverData.selectedTemplate.code,
      recipients: recipients.map(r => {
        // 수신자별 변수가 있으면 사용, 없으면 빈 객체 (서버에서 공통 변수로 병합됨)
        const recipientVars = naverData.recipientVariables[r.phone_number];
        const filteredVars: Record<string, string> = {};

        // 빈 값이 아닌 변수만 전달
        if (recipientVars) {
          Object.keys(recipientVars).forEach(key => {
            if (recipientVars[key]) {
              filteredVars[key] = recipientVars[key];
            }
          });
        }

        return {
          phone_number: r.phone_number,
          name: r.name,
          variables: Object.keys(filteredVars).length > 0 ? filteredVars : undefined,
        };
      }),
      templateParams: naverData.commonVariables, // 공통 변수 객체
      productCode: naverData.productCode,
      attachments: naverData.selectedTemplate.buttons ? {
        buttons: naverData.selectedTemplate.buttons.map(btn => ({
          type: btn.type === 'WEB_LINK' ? 'WEB_LINK' as const : 'APP_LINK' as const,
          buttonCode: btn.name.substring(0, 10), // 임시 버튼 코드
          buttonName: btn.name,
          mobileUrl: btn.mobileUrl || btn.url,
          pcUrl: btn.url,
        })),
      } : undefined,
      scheduledAt, // 예약 발송 시간 추가
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '네이버 톡톡 발송 실패');
  }

  return {
    success: true,
    message: result.message || `네이버 톡톡 발송 완료 (성공: ${result.successCount}건, 실패: ${result.failCount}건)`,
    successCount: result.successCount,
    failCount: result.failCount,
  };
}

export default NaverTalkContent;
