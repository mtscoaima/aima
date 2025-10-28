"use client";

import React, { useState, useEffect } from "react";
import {
  Info,
  HelpCircle,
  ChevronDown,
  Send
} from "lucide-react";

interface Recipient {
  phone_number: string;
  name?: string;
}

interface NaverTalkContentProps {
  recipients: Recipient[];
  selectedSenderNumber?: string;
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

const NaverTalkContent: React.FC<NaverTalkContentProps> = ({ recipients }) => {
  const [navertalkId, setNavertalkId] = useState("");
  const [templates, setTemplates] = useState<NaverTalkTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NaverTalkTemplate | null>(null);
  const [templateContent, setTemplateContent] = useState("");
  const [productCode, setProductCode] = useState<'INFORMATION' | 'BENEFIT' | 'CARDINFO'>('INFORMATION');
  const [smsBackup, setSmsBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  // 템플릿 선택 시 내용 업데이트
  const handleTemplateSelect = (templateCode: string) => {
    const template = templates.find(t => t.code === templateCode);
    if (template) {
      setSelectedTemplate(template);
      setTemplateContent(template.text);
    } else {
      setSelectedTemplate(null);
      setTemplateContent("");
    }
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

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/messages/naver/talk/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          navertalkId,
          templateCode: selectedTemplate.code,
          recipients,
          text: templateContent,
          productCode,
          buttons: selectedTemplate.buttons,
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
            onChange={(e) => setTemplateContent(e.target.value)}
            rows={12}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * 템플릿의 변수(#{'{'} {'}'})는 실제 값으로 치환하여 입력하세요.
        </p>
      </div>

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

      {/* 발송 버튼 */}
      <div className="flex justify-end gap-2">
        <button
          onClick={handleSend}
          disabled={loading || !navertalkId || !selectedTemplate || recipients.length === 0}
          className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
          {loading ? '발송 중...' : '네이버 톡톡 발송'}
        </button>
      </div>
    </>
  );
};

export default NaverTalkContent;
