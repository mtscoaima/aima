"use client";

interface TermsData {
  id?: number;
  title: string;
  content: string;
  version: string;
}

interface VersionInfo {
  id: number;
  version: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface DocumentSettingsProps {
  type: 'terms' | 'privacy' | 'marketing';
  title: string;
  description: string;
  data: TermsData;
  versions: VersionInfo[];
  showVersionHistory: boolean;
  pagination: { currentPage: number; totalPages: number; };
  onDataChange: (newData: TermsData) => void;
  onSave: () => void;
  onToggleVersionHistory: () => void;
  onChangePage: (page: number) => void;
  onActivateVersion: (versionId: number) => void;
  onDeleteVersion: (versionId: number, version: string) => void;
  isSaving: boolean;
  getCurrentPageVersions: (versions: VersionInfo[]) => VersionInfo[];
}

export default function DocumentSettings({
  type,
  title,
  description,
  data,
  versions,
  showVersionHistory,
  pagination,
  onDataChange,
  onSave,
  onToggleVersionHistory,
  onChangePage,
  onActivateVersion,
  onDeleteVersion,
  isSaving,
  getCurrentPageVersions
}: DocumentSettingsProps) {
  const handleChange = (field: keyof TermsData, value: string) => {
    onDataChange({ ...data, [field]: value });
  };

  const getButtonText = () => {
    switch (type) {
      case 'terms': return '이용약관 저장';
      case 'privacy': return '개인정보처리방침 저장';
      case 'marketing': return '마케팅 동의서 저장';
      default: return '저장';
    }
  };

  const getContentPlaceholder = () => {
    switch (type) {
      case 'terms': return '이용약관 내용을 입력하세요...';
      case 'privacy': return '개인정보처리방침 내용을 입력하세요...';
      case 'marketing': return '마케팅 정보 수신 동의서 내용을 입력하세요...';
      default: return '내용을 입력하세요...';
    }
  };

  const getTitleLabel = () => {
    switch (type) {
      case 'terms': return '약관 제목';
      case 'privacy': return '방침 제목';
      case 'marketing': return '동의서 제목';
      default: return '제목';
    }
  };

  const getContentLabel = () => {
    switch (type) {
      case 'terms': return '약관 내용';
      case 'privacy': return '방침 내용';
      case 'marketing': return '동의서 내용';
      default: return '내용';
    }
  };

  const getVersionHistoryTitle = () => {
    switch (type) {
      case 'terms': return '이용약관 버전 히스토리';
      case 'privacy': return '개인정보처리방침 버전 히스토리';
      case 'marketing': return '마케팅 동의 버전 히스토리';
      default: return '버전 히스토리';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-800">{getTitleLabel()}</label>
            <input
              type="text"
              className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
              value={data.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-800">버전</label>
            <input
              type="text"
              className="w-full max-w-md px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-800 bg-white transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
              value={data.version}
              onChange={(e) => handleChange('version', e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-800">{getContentLabel()}</label>
            <textarea
              className="w-full min-h-96 px-3 py-3 border border-gray-200 rounded-lg text-sm leading-relaxed resize-y transition-colors focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
              rows={15}
              value={data.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder={getContentPlaceholder()}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors hover:bg-blue-700 disabled:bg-gray-400 disabled:text-gray-600 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : getButtonText()}
          </button>
          <button
            type="button"
            className="bg-gray-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors hover:bg-gray-700"
            onClick={onToggleVersionHistory}
          >
            {showVersionHistory ? "버전 히스토리 숨기기" : "버전 히스토리 보기"}
          </button>
        </div>

        {/* 버전 히스토리 */}
        {showVersionHistory && (
          <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="mb-4 text-base font-semibold text-gray-800">{getVersionHistoryTitle()}</h3>
            {versions.length === 0 ? (
              <p className="text-gray-600 text-sm italic">버전 히스토리가 없습니다.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {getCurrentPageVersions(versions).map((version) => (
                    <div
                      key={version.id}
                      className={`flex justify-between items-center p-3 rounded border ${
                        version.is_active
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-800">
                            {version.title} (v{version.version})
                          </span>
                          {version.is_active && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">
                              활성
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(version.created_at).toLocaleString('ko-KR')}
                        </div>
                      </div>
                      {!version.is_active && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => onActivateVersion(version.id)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          >
                            활성화
                          </button>
                          <button
                            onClick={() => onDeleteVersion(version.id, version.version)}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center mt-4 gap-2">
                    <button
                      onClick={() => onChangePage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                      className={`px-3 py-1 text-xs rounded border ${
                        pagination.currentPage <= 1
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      }`}
                    >
                      이전
                    </button>

                    <span className="text-sm text-gray-600">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>

                    <button
                      onClick={() => onChangePage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages}
                      className={`px-3 py-1 text-xs rounded border ${
                        pagination.currentPage >= pagination.totalPages
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      }`}
                    >
                      다음
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}