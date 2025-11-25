"use client";

import React, { useState, useEffect } from "react";
import {
  Info,
  ChevronDown,
  RefreshCw
} from "lucide-react";

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
  buttonUrls: Record<string, { mobileUrl: string; pcUrl?: string }>; // buttonCode를 key로 사용
  templateVariables?: string[]; // 템플릿에서 추출된 변수 목록
  smsBackup?: boolean; // SMS 백업 설정 여부 (미지원)
}

interface NaverTalkContentProps {
  recipients: Recipient[];
  selectedSenderNumber?: string;
  onDataChange?: (data: NaverData) => void;
}

interface NaverTalkTemplate {
  id: number;
  partner_key: string;
  code: string;
  name: string;
  text: string;
  categoryCode: string;
  product_code: string;
  status: string;
  buttons?: Array<{
    type: string;
    buttonCode: string;
    buttonName: string;
    url?: string;
    mobileUrl?: string;
  }>;
}

interface NaverAccount {
  id: number;
  partner_key: string;
  talk_name: string | null;
  created_at: string;
}

const NaverTalkContent: React.FC<NaverTalkContentProps> = ({ recipients, selectedSenderNumber, onDataChange }) => {
  // 계정 관련 상태
  const [accounts, setAccounts] = useState<NaverAccount[]>([]);
  const [navertalkId, setNavertalkId] = useState("");

  // 템플릿 관련 상태
  const [templates, setTemplates] = useState<NaverTalkTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NaverTalkTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [productCode, setProductCode] = useState<'INFORMATION' | 'BENEFIT' | 'CARDINFO'>('INFORMATION');
  const [buttonUrls, setButtonUrls] = useState<Record<string, { mobileUrl: string; pcUrl?: string }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 계정 목록 조회
  const loadAccounts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/naver/accounts', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const accountList = result.data || [];
        setAccounts(accountList);

        // 첫 번째 계정 자동 선택
        if (accountList.length > 0 && accountList[0].partner_key) {
          setNavertalkId(accountList[0].partner_key);
        }
      }
    } catch (error) {
      console.error('계정 조회 실패:', error);
    }
  };

  // 템플릿 목록 로드 (DB에서 조회)
  const loadTemplates = async (navertalkIdValue: string) => {
    if (!navertalkIdValue) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('/api/naver/templates/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '템플릿 목록 조회 실패');
      }

      // DB에서 조회한 템플릿을 partner_key로 필터링
      const filteredTemplates = (result.data || []).filter(
        (t: NaverTalkTemplate) => t.partner_key === navertalkIdValue
      );
      setTemplates(filteredTemplates);

    } catch (err) {
      console.error('템플릿 조회 오류:', err);
      setError(err instanceof Error ? err.message : '템플릿 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 계정 목록 로드
  useEffect(() => {
    loadAccounts();
  }, []);

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
        buttonUrls,
      });
    }
  }, [navertalkId, selectedTemplate, templateContent, productCode, buttonUrls, onDataChange]);

  // 템플릿 선택 시 내용 업데이트
  const handleTemplateSelect = (templateCode: string) => {
    const template = templates.find(t => t.code === templateCode);
    if (template) {
      setSelectedTemplate(template);
      setTemplateContent(template.text);

      // 버튼 URL 초기화
      const initialUrls: Record<string, { mobileUrl: string; pcUrl?: string }> = {};
      if (template.buttons) {
        template.buttons.forEach((btn) => {
          initialUrls[btn.buttonCode] = {
            mobileUrl: btn.mobileUrl || btn.url || '',
            pcUrl: btn.url || ''
          };
        });
      }
      setButtonUrls(initialUrls);
    } else {
      setSelectedTemplate(null);
      setTemplateContent("");
      setButtonUrls({});
    }
  };

  // 네이버 톡톡 발송 (sendNaverTalkMessage로 대체되어 현재 미사용, 향후 UI 발송 버튼 추가 시 사용)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSend = async () => {
    // 유효성 검사
    if (!navertalkId) {
      setError('네이버톡 계정을 선택해주세요.');
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

    // 버튼 URL 검증
    if (selectedTemplate.buttons && selectedTemplate.buttons.length > 0) {
      const missingUrls: string[] = [];
      selectedTemplate.buttons.forEach(btn => {
        const urls = buttonUrls[btn.buttonCode];
        if (!urls || !urls.mobileUrl) {
          missingUrls.push(btn.buttonName);
        }
      });
      if (missingUrls.length > 0) {
        setError(`다음 버튼의 모바일 URL을 입력해주세요: ${missingUrls.join(', ')}`);
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
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          navertalkId,
          templateCode: selectedTemplate.code,
          message: selectedTemplate.text, // 템플릿 메시지 내용
          callbackNumber: selectedSenderNumber || '', // 발신번호
          recipients: recipients.map(r => ({
            phone_number: r.phone_number,
            name: r.name,
            variables: r.variables, // 수신자별 변수 (있는 경우)
          })),
          templateParams: {}, // MTS API가 서버에서 #{변수} 치환 처리
          productCode: productCode === 'CARDINFO' ? 'INFORMATION' : productCode, // CARDINFO는 별도 API 필요, INFORMATION으로 변환
          attachments: selectedTemplate.buttons ? {
            buttons: selectedTemplate.buttons.map(btn => {
              const urls = buttonUrls[btn.buttonCode] || { mobileUrl: '', pcUrl: '' };
              return {
                buttonCode: btn.buttonCode,
                mobileUrl: urls.mobileUrl,
                pcUrl: urls.pcUrl || urls.mobileUrl,
              };
            }),
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

      {/* 네이버톡 계정 선택 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h3 className="font-medium mb-3" style={{ color: "#00a732" }}>네이버톡 계정</h3>
        {accounts.length === 0 ? (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            등록된 계정이 없습니다. 먼저 &quot;카카오/네이버 톡톡&quot; → &quot;네이버톡톡&quot; → &quot;톡톡 아이디&quot; 탭에서 계정을 등록해주세요.
          </div>
        ) : (
          <select
            value={navertalkId}
            onChange={(e) => setNavertalkId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">계정을 선택하세요</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.partner_key}>
                {account.talk_name || account.partner_key}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 mt-2">
          * 네이버 톡톡 관리 탭에서 등록한 계정을 선택하세요.
        </p>
      </div>

      {/* 템플릿 선택 및 상품 코드 */}
      <div className="flex gap-6 mb-4">
        {/* 좌측: 템플릿 선택 */}
        <div className="flex-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium" style={{ color: "#00a732" }}>템플릿 선택</h3>
              <button
                onClick={() => navertalkId && loadTemplates(navertalkId)}
                disabled={loading || !navertalkId}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="템플릿 목록 새로고침"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </button>
            </div>
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
            {templates.length === 0 && navertalkId && !loading && (
              <p className="text-xs text-red-500 mt-2">
                등록된 템플릿이 없습니다. 템플릿 관리 탭에서 템플릿을 생성하거나, 새로고침 버튼을 눌러 다시 시도해주세요.
              </p>
            )}
            {loading && (
              <p className="text-xs text-gray-500 mt-2">
                템플릿 목록 조회 중...
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
          * 템플릿에 #{"{"}변수명{"}"} 형식으로 작성된 변수는 발송 시 자동으로 치환됩니다.
        </p>
      </div>

      {/* 버튼 URL 입력 */}
      {selectedTemplate && selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <h3 className="font-medium mb-3" style={{ color: "#00a732" }}>버튼 URL 설정</h3>
          <p className="text-xs text-gray-500 mb-3">
            * 템플릿 등록 시에는 버튼 이름만 저장되며, 발송 시 각 버튼의 URL을 입력해야 합니다.
          </p>
          <div className="space-y-4">
            {selectedTemplate.buttons.map((btn, index) => {
              const buttonCode = btn.buttonCode;
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-medium text-gray-700">버튼 #{index + 1}:</span>
                    <span className="text-sm text-gray-600">{btn.buttonName}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded">
                      {btn.type === 'WEB_LINK' ? '웹 링크' : '앱 링크'}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        모바일 URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={btn.type === 'APP_LINK' ? '예: myapp://action' : 'https://example.com'}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                        value={buttonUrls[buttonCode]?.mobileUrl || ''}
                        onChange={(e) => {
                          setButtonUrls({
                            ...buttonUrls,
                            [buttonCode]: {
                              ...buttonUrls[buttonCode],
                              mobileUrl: e.target.value
                            }
                          });
                        }}
                      />
                    </div>
                    {btn.type === 'WEB_LINK' && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          PC URL (선택사항)
                        </label>
                        <input
                          type="text"
                          placeholder="https://example.com"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          value={buttonUrls[buttonCode]?.pcUrl || ''}
                          onChange={(e) => {
                            setButtonUrls({
                              ...buttonUrls,
                              [buttonCode]: {
                                ...buttonUrls[buttonCode],
                                pcUrl: e.target.value
                              }
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

// 네이버 톡톡 발송 함수 (MessageSendTab에서 호출)
export async function sendNaverTalkMessage(
  naverData: NaverData,
  recipients: Recipient[],
  callbackNumber: string, // 발신번호 추가
  scheduledAt?: string // YYYYMMDDHHmmss 형식
): Promise<{ success: boolean; message: string; successCount?: number; failCount?: number }> {
  // 유효성 검사
  if (!naverData.navertalkId) {
    throw new Error('네이버톡 계정을 선택해주세요.');
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

  // 버튼 URL 검증
  if (naverData.selectedTemplate.buttons && naverData.selectedTemplate.buttons.length > 0) {
    const missingUrls: string[] = [];
    naverData.selectedTemplate.buttons.forEach(btn => {
      const urls = naverData.buttonUrls[btn.buttonCode];
      if (!urls || !urls.mobileUrl) {
        missingUrls.push(btn.buttonName);
      }
    });
    if (missingUrls.length > 0) {
      throw new Error(`다음 버튼의 모바일 URL을 입력해주세요: ${missingUrls.join(', ')}`);
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
      message: naverData.templateContent, // 템플릿 메시지 내용 추가
      callbackNumber: callbackNumber, // 발신번호 추가
      recipients: recipients.map(r => ({
        phone_number: r.phone_number,
        name: r.name,
        variables: r.variables, // 수신자별 변수 (있는 경우)
      })),
      templateParams: {}, // MTS API가 서버에서 #{변수} 치환 처리
      productCode: naverData.productCode === 'CARDINFO' ? 'INFORMATION' : naverData.productCode, // CARDINFO → INFORMATION
      attachments: naverData.selectedTemplate.buttons ? {
        buttons: naverData.selectedTemplate.buttons.map(btn => {
          const urls = naverData.buttonUrls[btn.buttonCode] || { mobileUrl: '', pcUrl: '' };
          return {
            buttonCode: btn.buttonCode,
            mobileUrl: urls.mobileUrl,
            pcUrl: urls.pcUrl || urls.mobileUrl, // PC URL이 없으면 모바일 URL 사용
          };
        }),
      } : undefined,
      sendDate: scheduledAt, // 예약 발송 시간 (sendDate로 변경)
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
