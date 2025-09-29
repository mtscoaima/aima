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

      {/* 캠페인 예산 설정 섹션 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">캠페인 예산 설정</h2>
          <p className="text-gray-600 text-sm leading-relaxed">캠페인 생성 시 최소 예산 및 일 광고비 제한 기준을 설정합니다.</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-800">캠페인 최소 예산 (원)</label>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="text"
                className="w-full max-w-52 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
                value={parseInt(siteSettings.minimum_campaign_price || "0").toLocaleString()}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  onSiteSettingChange("minimum_campaign_price", value || "0");
                }}
                placeholder="200,000"
              />
              <span className="text-sm font-medium text-gray-600 min-w-5">원</span>
            </div>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              사용자가 캠페인을 생성할 때 설정해야 하는 최소 예산 금액입니다.
            </p>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-800">일 최대 광고비 제한 (원)</label>
            <div className="flex items-center gap-2 max-w-xs">
              <input
                type="text"
                className="w-full max-w-52 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
                value={parseInt(siteSettings.default_daily_limit || "0").toLocaleString()}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, '');
                  onSiteSettingChange("default_daily_limit", value || "0");
                }}
                placeholder="50,000"
              />
              <span className="text-sm font-medium text-gray-600 min-w-5">원</span>
            </div>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              캠페인의 일일 광고비 사용 한도 최소값입니다.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-2">
            <h4 className="text-base font-semibold text-blue-800 mb-4">현재 설정값 미리보기</h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm text-gray-800">
                <span>캠페인 최소 예산:</span>
                <strong className="text-blue-800 font-semibold">{parseInt(siteSettings.minimum_campaign_price || "0").toLocaleString()}원</strong>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-800">
                <span>일 최대 광고비 제한:</span>
                <strong className="text-blue-800 font-semibold">{parseInt(siteSettings.default_daily_limit || "0").toLocaleString()}원</strong>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-25 p-4 rounded-md">
              <small className="text-xs text-gray-600 leading-relaxed">
                • 사용자는 위 금액 이상으로만 캠페인을 생성할 수 있습니다.<br />
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* 수수료 비율 설정 섹션 */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">수수료 비율 설정</h2>
          <p className="text-gray-600 text-sm leading-relaxed">추천 시스템의 수수료 비율을 관리합니다.</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
            <label className="block mb-2 text-sm font-medium text-gray-800">
              1차 추천 수수료 비율 (%)
            </label>
            <div className="flex items-center gap-2 max-w-lg flex-wrap">
              <input
                type="number"
                className="w-full max-w-40 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
                value={settings.firstLevelCommissionRate}
                onChange={(e) => onSettingChange("firstLevelCommissionRate", parseFloat(e.target.value) || 10)}
                min="0"
                max="100"
                step="0.1"
                placeholder="10"
              />
              <span className="text-sm font-medium text-gray-600 min-w-5">%</span>
            </div>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              직접 추천한 사용자가 결제 시 지급되는 수수료 비율입니다.
            </p>
          </div>

          <div className="p-5 bg-gray-50 border border-gray-200 rounded-lg">
            <label className="block mb-2 text-sm font-medium text-gray-800">
              n차 수수료 계산용 분모
            </label>
            <div className="flex items-center gap-2 max-w-lg flex-wrap">
              <input
                type="number"
                className="w-full max-w-40 px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 text-right"
                value={settings.nthLevelDenominator}
                onChange={(e) => onSettingChange("nthLevelDenominator", parseFloat(e.target.value) || 20)}
                min="1"
                max="100"
                step="1"
                placeholder="20"
              />
              <span className="text-xs text-blue-600 font-medium whitespace-nowrap ml-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded">
                (2차:{" "}
                {((100 - settings.firstLevelCommissionRate) / settings.nthLevelDenominator).toFixed(2)}
                %, 3차:{" "}
                {((100 - settings.firstLevelCommissionRate) / Math.pow(settings.nthLevelDenominator, 2)).toFixed(3)}
                %)
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              2차 이상 간접 추천 사용자 수수료 계산에 사용되는
              분모값입니다.
              <br />
              공식: (결제금액 - 1차 수수료) ÷ 분모^(차수-1)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mt-2">
            <h4 className="text-base font-semibold text-blue-800 mb-4">수수료 예시 (1,000원 결제 기준)</h4>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm text-gray-800 mb-2 pb-2 border-b border-blue-200 font-medium">
                <span>1차 추천자 수수료:</span>
                <strong className="text-blue-800 font-semibold">
                  {((1000 * settings.firstLevelCommissionRate) / 100).toFixed(2)}원
                </strong>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-800">
                <span>2차 추천자 수수료:</span>
                <strong className="text-blue-800 font-semibold">
                  {((1000 * (100 - settings.firstLevelCommissionRate)) / 100 / settings.nthLevelDenominator).toFixed(2)}원
                </strong>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-800">
                <span>3차 추천자 수수료:</span>
                <strong className="text-blue-800 font-semibold">
                  {((1000 * (100 - settings.firstLevelCommissionRate)) / 100 / Math.pow(settings.nthLevelDenominator, 2)).toFixed(2)}원
                </strong>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200 bg-blue-25 p-4 rounded-md">
              <small className="text-xs text-gray-600 leading-relaxed">
                • 1차: 1,000원 × {settings.firstLevelCommissionRate}% ={" "}
                {((1000 * settings.firstLevelCommissionRate) / 100).toFixed(2)}원<br />
                • 나머지 금액: 1,000원 -{" "}
                {((1000 * settings.firstLevelCommissionRate) / 100).toFixed(2)}원 ={" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100).toFixed(2)}원<br />
                • 2차:{" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100).toFixed(2)}원 ÷ {settings.nthLevelDenominator} ={" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100 / settings.nthLevelDenominator).toFixed(2)}원<br />
                • 3차:{" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100).toFixed(2)}원 ÷ {settings.nthLevelDenominator}² ={" "}
                {((1000 * (100 - settings.firstLevelCommissionRate)) / 100 / Math.pow(settings.nthLevelDenominator, 2)).toFixed(2)}원
              </small>
            </div>
          </div>
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