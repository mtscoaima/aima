"use client";

interface MenuItem {
  id: string;
  name: string;
  url: string;
  order: number;
  visible: boolean;
}

interface SiteSettings {
  site_name: string;
  site_description: string;
  contact_email: string;
  contact_phone: string;
  footer_text: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  minimum_campaign_price: string;
  default_daily_limit: string;
}

interface MenuSettingsProps {
  menuSettings: {
    main_menu: MenuItem[];
    admin_menu: MenuItem[];
  };
  siteSettings: SiteSettings;
  onMenuSettingsChange: (newMenuSettings: { main_menu: MenuItem[]; admin_menu: MenuItem[]; }) => void;
  onSiteSettingsChange: (newSiteSettings: SiteSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function MenuSettings({
  menuSettings,
  siteSettings,
  onMenuSettingsChange,
  onSiteSettingsChange,
  onSave,
  isSaving
}: MenuSettingsProps) {
  const handleMainMenuChange = (index: number, field: keyof MenuItem, value: string | number | boolean) => {
    const newMainMenu = [...menuSettings.main_menu];
    newMainMenu[index] = { ...newMainMenu[index], [field]: value };
    onMenuSettingsChange({ ...menuSettings, main_menu: newMainMenu });
  };

  const handleSiteSettingChange = (key: keyof SiteSettings, value: string | boolean) => {
    onSiteSettingsChange({ ...siteSettings, [key]: value });
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">메뉴 설정</h2>
          <p className="text-gray-600 text-sm leading-relaxed">사이트의 메뉴 구성을 관리합니다.</p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">메인 메뉴</h3>
          <div className="flex flex-col gap-3">
            {menuSettings.main_menu.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleMainMenuChange(index, 'name', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                  placeholder="메뉴 이름"
                />
                <input
                  type="text"
                  value={item.url}
                  onChange={(e) => handleMainMenuChange(index, 'url', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-100"
                  placeholder="URL"
                />
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={item.visible}
                    onChange={(e) => handleMainMenuChange(index, 'visible', e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  보이기
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">사이트 정보</h3>
          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-800">사이트 이름</label>
              <input
                type="text"
                className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                value={siteSettings.site_name}
                onChange={(e) => handleSiteSettingChange('site_name', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-800">사이트 설명</label>
              <input
                type="text"
                className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                value={siteSettings.site_description}
                onChange={(e) => handleSiteSettingChange('site_description', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-800">연락처 이메일</label>
              <input
                type="email"
                className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                value={siteSettings.contact_email}
                onChange={(e) => handleSiteSettingChange('contact_email', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-800">연락처 전화번호</label>
              <input
                type="tel"
                className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                value={siteSettings.contact_phone}
                onChange={(e) => handleSiteSettingChange('contact_phone', e.target.value)}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-800">푸터 텍스트</label>
              <input
                type="text"
                className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                value={siteSettings.footer_text}
                onChange={(e) => handleSiteSettingChange('footer_text', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : "메뉴 설정 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}