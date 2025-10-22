"use client";

interface GeneralSettingsProps {
  settings: {
    portalName: string;
    dormantMode: boolean;
    timezone: string;
    externalApiKey: string;
    firstLevelCommissionRate: number;
    nthLevelDenominator: number;
  };
  siteSettings: {
    site_name: string;
    site_description: string;
    contact_email: string;
    contact_phone: string;
    footer_text: string;
    maintenance_mode: boolean;
    maintenance_message: string;
    minimum_campaign_price: string;
    default_daily_limit: string;
  };
  onSettingChange: (key: string, value: string | boolean | number) => void;
  onSiteSettingChange: (key: string, value: string | boolean) => void;
  onSave: () => void;
  isSaving: boolean;
  onGenerateApiKey: () => void;
}

export default function GeneralSettings({
  settings,
  siteSettings,
  onSettingChange,
  onSiteSettingChange,
  onSave,
  isSaving,
  onGenerateApiKey
}: GeneralSettingsProps) {
  return (
    <div className="animate-fade-in">
      {/* 일반 설정 섹션 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">일반 설정</h2>
          <p className="text-gray-600 text-sm leading-relaxed">시스템 전반에 적용되는 기본 설정을 관리합니다.</p>
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-800">포털 이름</label>
          <input
            type="text"
            className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
            value={settings.portalName}
            onChange={(e) => onSettingChange("portalName", e.target.value)}
          />
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <label className="block mb-2 text-sm font-medium text-gray-800">점검 모드 활성화</label>
              <p className="text-xs text-gray-600 leading-relaxed">
                활성화 시 일반 사용자 접근이 차단됩니다.
              </p>
            </div>
            <div className="relative inline-block w-12 h-6 flex-shrink-0">
              <input
                type="checkbox"
                id="dormantMode"
                className="opacity-0 w-0 h-0"
                checked={settings.dormantMode}
                onChange={(e) => onSettingChange("dormantMode", e.target.checked)}
              />
              <label
                htmlFor="dormantMode"
                className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 rounded-full transition-colors duration-300 ${
                  settings.dormantMode ? 'bg-blue-600' : 'bg-gray-300'
                } before:absolute before:content-[''] before:h-5 before:w-5 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform before:duration-300 before:shadow-sm ${
                  settings.dormantMode ? 'before:translate-x-6' : 'before:translate-x-0'
                }`}
              ></label>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-800">기본 시간대</label>
          <select
            className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 cursor-pointer bg-[url('data:image/svg+xml,%3csvg xmlns=\\'http://www.w3.org/2000/svg\\' fill=\\'none\\' viewBox=\\'0 0 20 20\\'%3e%3cpath stroke=\\'%236b7280\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\' stroke-width=\\'1.5\\' d=\\'m6 8 4 4 4-4\\'/%3e%3c/svg%3e')] bg-[length:16px] bg-[center_right_12px] bg-no-repeat pr-10"
            value={settings.timezone}
            onChange={(e) => onSettingChange("timezone", e.target.value)}
          >
            <option value="Asia/Seoul (UTC+9)">Asia/Seoul (UTC+9)</option>
            <option value="America/New_York (UTC-5)">America/New_York (UTC-5)</option>
            <option value="Europe/London (UTC+0)">Europe/London (UTC+0)</option>
            <option value="Asia/Tokyo (UTC+9)">Asia/Tokyo (UTC+9)</option>
          </select>
        </div>
      </div>

      {/* API 키 관리 섹션 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">API 키 관리</h2>
          <p className="text-gray-600 text-sm leading-relaxed">외부 연동을 위한 API 키를 관리합니다.</p>
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-sm font-medium text-gray-800">외부 서비스 API 키</label>
          <div className="flex gap-3 items-start">
            <input
              type="text"
              className="flex-1 w-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 font-mono text-xs tracking-wide"
              value={settings.externalApiKey}
              onChange={(e) => onSettingChange("externalApiKey", e.target.value)}
              placeholder="API 키를 입력하세요"
            />
            <button
              type="button"
              className="bg-gray-600 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-gray-700 whitespace-nowrap"
              onClick={onGenerateApiKey}
            >
              재발급
            </button>
          </div>
        </div>

        <div className="mb-0">
          <button
            type="button"
            className="w-full bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-blue-600 hover:text-white"
            onClick={onGenerateApiKey}
          >
            새 API 키 생성
          </button>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex flex-col items-end gap-4 p-6">
        <button
          type="button"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
          onClick={onSave}
          disabled={isSaving}
        >
          {isSaving ? "저장 중..." : "변경사항 저장"}
        </button>
      </div>
    </div>
  );
}